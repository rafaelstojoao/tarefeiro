<?php
// Chaves VAPID para autenticação do servidor no protocolo Web Push.
// Geradas uma única vez com Minishlink\WebPush\VAPID::createVapidKeys().
// Não gere novas chaves depois que usuários já tiverem se inscrito - invalidaria as inscrições existentes.
define('VAPID_PUBLIC_KEY', 'BA2wA4ZC0RTJtts9WBmE2oFHwJ-tjIHDE3yH8yfn1p2AB7zqmX5zfbP25HIZlJZPL6SQPY6uBgdY9Ox_c1merPM');
define('VAPID_PRIVATE_KEY', 'sSO5AVvBuarxgAT8vwnabULZtVo9sWjtFVay-loTNgQ');
define('VAPID_SUBJECT', 'mailto:rafaelstojoao@gmail.com');

// Token para proteger a execução via HTTP do cron/send_reminders.php (não afeta chamadas via CLI)
define('CRON_SECRET', '3eb80965332f9a975f8e9ba329c45716b3dff2d592836baa');
