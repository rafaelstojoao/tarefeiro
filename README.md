# Tarefeiro

PWA de gestão de tarefas: PHP + MySQL no backend, HTML/JS puro + Bootstrap no front, sem etapa de build.

## Rodar localmente (XAMPP)

1. Abra o **XAMPP Control Panel** e inicie **Apache** e **MySQL**.
2. Crie o banco e as tabelas:
   ```
   "C:\Users\rafael.stoffalette\Documents\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE tarefeiro"
   "C:\Users\rafael.stoffalette\Documents\xampp\mysql\bin\mysql.exe" -u root tarefeiro < sql\schema.sql
   ```
3. Crie seu usuário de login (troque `SEU_USUARIO` e `SUA_SENHA`):
   ```
   "C:\Users\rafael.stoffalette\Documents\xampp\php\php.exe" sql\create_user.php SEU_USUARIO SUA_SENHA
   ```
4. Acesse **http://localhost/tarefeiro/login.html**

## Deploy no cPanel

1. No cPanel, crie um banco MySQL e um usuário com acesso total a ele (em "MySQL® Databases").
2. Abra o **phpMyAdmin** do cPanel, selecione o banco criado e importe `sql/schema.sql` (aba "Importar").
3. Edite `config/database.php` com as credenciais reais (host geralmente é `localhost`, nome do banco e usuário costumam vir prefixados, ex: `seuusuario_tarefeiro`).
4. Envie todos os arquivos da pasta do projeto via FTP/Gerenciador de Arquivos para a pasta desejada (raiz do domínio, um subdomínio, ou uma subpasta como `public_html/tarefeiro`). Como os caminhos são relativos, funciona em qualquer nível.
5. Crie o usuário de login. Se seu plano tiver acesso SSH, rode o mesmo comando do passo 3 do setup local. **Sem SSH**, crie um arquivo temporário `api/setup_temporario.php` com o conteúdo abaixo, acesse pelo navegador uma vez e **delete o arquivo em seguida**:
   ```php
   <?php
   require_once __DIR__ . '/../config/database.php';
   $pdo = getDbConnection();
   $stmt = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
   $stmt->execute(['SEU_USUARIO', password_hash('SUA_SENHA', PASSWORD_DEFAULT)]);
   echo 'Usuário criado!';
   ```
6. Acesse `https://seudominio.com/(subpasta)/login.html` no navegador.

## Instalar como app no iPhone

1. Abra a URL do site no **Safari** (tem que ser Safari, não funciona pelo Chrome no iOS).
2. Toque no ícone de compartilhar (quadrado com seta pra cima) → **"Adicionar à Tela de Início"**.
3. O ícone aparece na tela inicial e abre em tela cheia, sem barra de navegador.

## Avisos por push notification

Cada tarefa pode ter um aviso configurável ("me avisar X minutos/horas/dias antes do prazo"). Requer iOS 16.4+ **e** o app instalado pela tela de início (não funciona numa aba comum do Safari).

**Configuração única no servidor (depois de cada deploy):**

1. Garanta que a migração do banco rodou: acesse `https://seudominio.com/(subpasta)/api/migrate_temporario.php` uma vez pelo navegador (ele adiciona as colunas/tabela novas) e **depois apague esse arquivo do servidor**.
2. No cPanel, vá em **Cron Jobs** e adicione uma tarefa rodando a cada 5 minutos:
   ```
   */5 * * * * /usr/local/bin/php /home/SEUUSUARIO/caminho/para/tasks/cron/send_reminders.php
   ```
   (ajuste o caminho para o local real do projeto no servidor; o cPanel geralmente mostra o caminho completo ao criar o cron)
3. No app (ícone instalado no iPhone), toque no sino 🔔 no topo e permita as notificações.

As chaves VAPID (`config/push.php`) já estão geradas e commitadas — não gere novas depois que alguém já tiver ativado os avisos, ou as inscrições existentes param de funcionar.

A biblioteca PHP de push (`minishlink/web-push`) já vem **pré-instalada na pasta `vendor/`**, commitada no repositório — não é necessário rodar Composer no servidor.

## Estrutura

- `api/` — endpoints PHP (login, logout, sessão, CRUD de tarefas, inscrição/push)
- `config/database.php` — credenciais do MySQL e timezone da aplicação
- `config/push.php` — chaves VAPID do Web Push
- `cron/send_reminders.php` — script que dispara os avisos (rodar via Cron Job do cPanel)
- `sql/schema.sql` — script de criação das tabelas (instalação nova)
- `sql/migration_push.sql` — script de migração para bancos já existentes
- `sql/create_user.php` — script CLI para criar usuário de login
- `assets/` — CSS, JS e ícones do front-end
- `manifest.json` / `sw.js` — configuração PWA (instalável, tema escuro, cache do shell, push)
- `vendor/` — dependências PHP (Composer), commitadas para não precisar de SSH no servidor
