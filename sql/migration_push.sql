-- Migração: adiciona suporte a avisos (push notifications) em bancos já existentes
-- Rode uma vez no phpMyAdmin (local e produção)

ALTER TABLE tasks
    ADD COLUMN due_time TIME NULL AFTER due_date,
    ADD COLUMN reminder_amount INT NULL AFTER due_time,
    ADD COLUMN reminder_unit ENUM('minutos', 'horas', 'dias') NULL AFTER reminder_amount,
    ADD COLUMN reminder_sent TINYINT(1) NOT NULL DEFAULT 0 AFTER reminder_unit;

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    p256dh VARCHAR(255) NOT NULL,
    auth VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_endpoint (endpoint(255)),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
