<?php
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../config/push.php';

header('Content-Type: application/json');
echo json_encode(['publicKey' => VAPID_PUBLIC_KEY]);
