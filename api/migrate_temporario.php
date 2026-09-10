<?php
// Script temporário de migração - rode uma vez pelo navegador e DELETE este arquivo em seguida.
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

$pdo = getDbConnection();
$sql = file_get_contents(__DIR__ . '/../sql/migration_push.sql');
$statements = array_filter(array_map('trim', explode(';', $sql)));

foreach ($statements as $stmt) {
    $clean = trim(preg_replace('/^--.*$/m', '', $stmt));
    if ($clean === '') continue;

    try {
        $pdo->exec($clean);
        echo "OK: " . substr($clean, 0, 60) . "...\n";
    } catch (PDOException $e) {
        if (str_contains($e->getMessage(), 'Duplicate column') || str_contains($e->getMessage(), 'already exists')) {
            echo "JÁ EXISTIA (ok): " . substr($clean, 0, 60) . "...\n";
        } else {
            echo "ERRO: " . $e->getMessage() . "\n";
        }
    }
}

echo "\nMigração concluída. APAGUE ESTE ARQUIVO AGORA.\n";
