<?php
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

$pdo = getDbConnection();
$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare(
            'SELECT id, title, description, priority, status, due_date, created_at, completed_at
             FROM tasks WHERE user_id = ?
             ORDER BY status ASC, (due_date IS NULL), due_date ASC, FIELD(priority, "alta", "media", "baixa")'
        );
        $stmt->execute([$userId]);
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $title = trim($input['title'] ?? '');

        if ($title === '') {
            http_response_code(400);
            echo json_encode(['error' => 'O título é obrigatório']);
            exit;
        }

        $description = $input['description'] ?? null;
        $priority = in_array($input['priority'] ?? '', ['baixa', 'media', 'alta'], true) ? $input['priority'] : 'media';
        $dueDate = !empty($input['due_date']) ? $input['due_date'] : null;

        $stmt = $pdo->prepare(
            'INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$userId, $title, $description, $priority, $dueDate]);

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = (int)($input['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID inválido']);
            exit;
        }

        // Confirma que a tarefa pertence ao usuário logado
        $check = $pdo->prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?');
        $check->execute([$id, $userId]);
        if (!$check->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Tarefa não encontrada']);
            exit;
        }

        $fields = [];
        $params = [];

        if (isset($input['title'])) {
            $fields[] = 'title = ?';
            $params[] = trim($input['title']);
        }
        if (array_key_exists('description', $input)) {
            $fields[] = 'description = ?';
            $params[] = $input['description'];
        }
        if (isset($input['priority']) && in_array($input['priority'], ['baixa', 'media', 'alta'], true)) {
            $fields[] = 'priority = ?';
            $params[] = $input['priority'];
        }
        if (array_key_exists('due_date', $input)) {
            $fields[] = 'due_date = ?';
            $params[] = $input['due_date'] ?: null;
        }
        if (isset($input['status']) && in_array($input['status'], ['pendente', 'concluida'], true)) {
            $fields[] = 'status = ?';
            $params[] = $input['status'];
            $fields[] = 'completed_at = ?';
            $params[] = $input['status'] === 'concluida' ? date('Y-m-d H:i:s') : null;
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nada para atualizar']);
            exit;
        }

        $params[] = $id;
        $params[] = $userId;
        $sql = 'UPDATE tasks SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?';
        $pdo->prepare($sql)->execute($params);

        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = (int)($input['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID inválido']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);

        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
}
