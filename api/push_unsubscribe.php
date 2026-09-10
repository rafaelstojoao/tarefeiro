<?php
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$endpoint = $input['endpoint'] ?? '';

if ($endpoint === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Endpoint obrigatório']);
    exit;
}

$pdo = getDbConnection();
$stmt = $pdo->prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?');
$stmt->execute([$_SESSION['user_id'], $endpoint]);

echo json_encode(['success' => true]);
