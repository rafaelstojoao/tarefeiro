// Este Service Worker existe só para viabilizar os avisos por push notification.
// Ele NÃO intercepta nem cacheia páginas/CSS/JS - tudo isso vai direto pra rede,
// pra evitar telas com visual quebrado por cache desatualizado.

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    );
    self.clients.claim();
});

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (err) {
        data = { title: 'Tarefeiro', body: event.data ? event.data.text() : 'Notificação recebida' };
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'Tarefeiro', {
            body: data.body || '',
            icon: 'assets/icons/icon-192.png',
            badge: 'assets/icons/icon-192.png',
            data: { url: data.url || 'index.html' },
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
