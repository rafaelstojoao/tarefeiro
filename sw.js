const CACHE_NAME = 'tarefeiro-v2';
const APP_SHELL = [
    'index.html',
    'list.html',
    'login.html',
    'assets/css/style.css',
    'assets/js/common.js',
    'assets/js/calendar.js',
    'assets/js/list.js',
    'assets/js/login.js',
    'manifest.json',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Nunca cacheia chamadas de API - sempre busca dados frescos do servidor
    if (request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request))
    );
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
