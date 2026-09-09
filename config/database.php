<?php
// Credenciais do banco - ajuste para cada ambiente (local XAMPP vs cPanel)
define('DB_HOST', '128.201.75.100');
define('DB_NAME', 'projdev_tarefeiro');
define('DB_USER', 'projdev_tarefeirouser');
define('DB_PASS', 'Rf=t}l}!5*gn*jr~');

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
