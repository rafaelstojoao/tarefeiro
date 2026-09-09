<?php
// Inclua este arquivo no topo de qualquer endpoint da API que exija login
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Não autenticado']);
    exit;
}
