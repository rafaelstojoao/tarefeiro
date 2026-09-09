const CACHE_NAME = 'tarefeiro-v1';
const APP_SHELL = [
    'index.html',
    'login.html',
    'assets/css/style.css',
    'assets/js/app.js',
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
