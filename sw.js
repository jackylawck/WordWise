/**
 * WordWise Service Worker
 * Strategy: Cache-First with Automatic Version Management
 * Target: 100% Offline Capability (PWA Compliance)
 */

const CACHE_NAME = 'wordwise-v1.0.0';

// 需要快取的靜態核心資源清單
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './WordWiseicon-192.png',
    './WordWiseicon-512.png',
    './PRIVACY.md',
    './TERMS.md'
];

// 安裝階段：快取所有靜態資產
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// 啟用階段：清除舊版本的快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// 攔截請求：優先使用本機快取，若無則發起網路請求
self.addEventListener('fetch', (event) => {
    // 僅處理同源 GET 請求
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    // 若為有效資源，動態加入快取
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                });
            })
            .catch(() => {
                // 斷網且快取無符合項目時的回退處理
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});
