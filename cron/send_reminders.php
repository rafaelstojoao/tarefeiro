<?php
// Roda via Cron Job do cPanel, ex: a cada 5 minutos:
// /usr/local/bin/php /home/SEUUSUARIO/public_html/tasks/cron/send_reminders.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/push.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// Só exige token quando acessado via navegador/HTTP; chamadas via CLI (cron do cPanel) passam direto
if (php_sapi_name() !== 'cli') {
    $token = $_GET['token'] ?? '';
    if (!hash_equals(CRON_SECRET, $token)) {
        http_response_code(403);
        exit('Forbidden');
    }
}

$secondsPerUnit = [
    'minutos' => 60,
    'horas' => 3600,
    'dias' => 86400,
];

$pdo = getDbConnection();

$stmt = $pdo->query(
    "SELECT id, user_id, title, due_date, due_time, reminder_amount, reminder_unit
     FROM tasks
     WHERE status = 'pendente'
       AND reminder_sent = 0
       AND reminder_amount IS NOT NULL
       AND due_date IS NOT NULL"
);
$tasks = $stmt->fetchAll();

if (empty($tasks)) {
    echo "Nenhum lembrete pendente.\n";
    exit;
}

$webPush = new WebPush([
    'VAPID' => [
        'subject' => VAPID_SUBJECT,
        'publicKey' => VAPID_PUBLIC_KEY,
        'privateKey' => VAPID_PRIVATE_KEY,
    ],
]);

$now = new DateTime('now');
$dueTaskIds = [];

foreach ($tasks as $task) {
    $time = $task['due_time'] ?: '23:59:00';
    $deadline = DateTime::createFromFormat('Y-m-d H:i:s', $task['due_date'] . ' ' . $time);
    if (!$deadline) {
        continue;
    }

    $secondsBefore = (int)$task['reminder_amount'] * $secondsPerUnit[$task['reminder_unit']];
    $notifyAt = (clone $deadline)->modify("-{$secondsBefore} seconds");

    // Dispara se já passou do horário de avisar, mas ainda não passou muito do prazo (evita reenviar avisos muito antigos após o cron ficar parado)
    $tooLate = (clone $deadline)->modify('+1 day');
    if ($now >= $notifyAt && $now < $tooLate) {
        $dueTaskIds[] = $task['id'];

        $subsStmt = $pdo->prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?');
        $subsStmt->execute([$task['user_id']]);
        $subscriptions = $subsStmt->fetchAll();

        $payload = json_encode([
            'title' => 'Tarefeiro',
            'body' => "\"{$task['title']}\" vence " . formatDeadline($deadline),
            'url' => 'index.html',
        ]);

        foreach ($subscriptions as $sub) {
            $subscription = Subscription::create([
                'endpoint' => $sub['endpoint'],
                'publicKey' => $sub['p256dh'],
                'authToken' => $sub['auth'],
            ]);
            $webPush->queueNotification($subscription, $payload);
        }
    }
}

foreach ($webPush->flush() as $report) {
    $endpoint = $report->getEndpoint();

    if (!$report->isSuccess() && $report->isSubscriptionExpired()) {
        $del = $pdo->prepare('DELETE FROM push_subscriptions WHERE endpoint = ?');
        $del->execute([$endpoint]);
        echo "Inscrição expirada removida: $endpoint\n";
    } elseif ($report->isSuccess()) {
        echo "Enviado: $endpoint\n";
    } else {
        echo "Falha ($endpoint): " . $report->getReason() . "\n";
    }
}

if (!empty($dueTaskIds)) {
    $placeholders = implode(',', array_fill(0, count($dueTaskIds), '?'));
    $pdo->prepare("UPDATE tasks SET reminder_sent = 1 WHERE id IN ($placeholders)")->execute($dueTaskIds);
}

echo count($dueTaskIds) . " tarefa(s) processada(s).\n";

function formatDeadline(DateTime $deadline): string
{
    $today = new DateTime('today');
    $diffDays = (int)$today->diff($deadline)->format('%r%a');

    if ($diffDays === 0) {
        return 'hoje às ' . $deadline->format('H:i');
    }
    if ($diffDays === 1) {
        return 'amanhã às ' . $deadline->format('H:i');
    }
    return 'em ' . $deadline->format('d/m') . ' às ' . $deadline->format('H:i');
}
