// === 📴 SERVICE WORKER ===
const CACHE_NAME = 'smart-dashboard-v1';
const CACHE_VERSION = 'v1';

// Ресурсы для кэширования при установке
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',           // ← ДОБАВЬ ЭТУ СТРОКУ
  '/manifest.json',
  '/favicon.ico',
  '/src/main.js',
  '/src/styles/variables.css',
  '/src/styles/reset.css',
  '/src/styles/main.css',
  '/src/core/router.js',
  '/src/core/authService.js',
  '/src/core/dataService.js',
  '/src/core/cacheService.js',
  '/src/core/notifications.js',
  '/src/core/uiContainer.js',
  '/src/core/mascot.js',
  '/src/modules/tasks/tasks.js',
  '/src/modules/tasks/tasksUI.js',
  '/src/modules/tasks/tasks.css',
  '/src/modules/notes/notes.js',
  '/src/modules/notes/notesUI.js',
  '/src/modules/notes/notes.css',
  '/src/modules/tracker/tracker.js',
  '/src/modules/tracker/trackerUI.js',
  '/src/modules/tracker/tracker.css',
  '/src/modules/profile/profile.js'
];

// === УСТАНОВКА SERVICE WORKER ===
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Cache failed:', err))
  );
});

// === АКТИВАЦИЯ SERVICE WORKER ===
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// === ПЕРЕХВАТ ЗАПРОСОВ (FETCH) ===
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если есть в кэше — возвращаем
        if (response) {
          return response;
        }

        // Если нет в кэше — пробуем сеть
        return fetch(event.request)
          .then(networkResponse => {
            // Проверяем валидность ответа
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Клонируем ответ для кэширования
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Если нет интернета — показываем offline.html
            // Только для навигационных запросов (страницы)
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            // Для других запросов возвращаем ошибку
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// === ОБРАБОТКА СООБЩЕНИЙ ===
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');