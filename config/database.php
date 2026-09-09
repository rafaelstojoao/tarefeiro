<?php
// Credenciais do banco - ajuste para cada ambiente (local XAMPP vs cPanel)
define('DB_HOST', 'localhost');
define('DB_NAME', 'tarefeiro');
define('DB_USER', 'root');
define('DB_PASS', '');

function getDbConnection(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    return $pdo;
}
