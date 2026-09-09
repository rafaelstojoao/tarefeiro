<?php
// Uso: php sql/create_user.php <usuario> <senha>
require_once __DIR__ . '/../config/database.php';

if ($argc < 3) {
    echo "Uso: php create_user.php <usuario> <senha>\n";
    exit(1);
}

$username = $argv[1];
$password = $argv[2];

$pdo = getDbConnection();
$stmt = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
$stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT)]);

echo "Usuário '$username' criado com sucesso.\n";
