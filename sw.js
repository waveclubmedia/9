/* ============================================
   WAVECLUBMEDIA — Service Worker v2
   PWA + Offline Game
   ============================================ */

var CACHE_NAME = 'wcm-pwa-v2';

/* Файлы которые кэшируем сразу */
var PRECACHE_URLS = [
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './offline.html',
  './merch.html',
  './radio.html',
  './articles.html',
  './article-recording.html',
  './article-mixing.html',
  './article-promo.html',
  './article-label.html'
];

/* ── УСТАНОВКА ── */
self.addEventListener('install', function(e){
  console.log('[SW] Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      /* Кэшируем по одному — если один файл не найден, остальные всё равно кэшируются */
      return Promise.allSettled(
        PRECACHE_URLS.map(function(url){
          return cache.add(url).catch(function(err){
            console.log('[SW] Could not cache:', url, err);
          });
        })
      );
    }).then(function(){
      console.log('[SW] Installed!');
    })
  );
  self.skipWaiting();
});

/* ── АКТИВАЦИЯ ── */
self.addEventListener('activate', function(e){
  console.log('[SW] Activating...');
  e.waitUntil(
    caches.keys().then(function(cacheNames){
      return Promise.all(
        cacheNames
          .filter(function(name){ return name !== CACHE_NAME; })
          .map(function(name){
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(function(){
      console.log('[SW] Activated!');
      return self.clients.claim();
    })
  );
});

/* ── СТРАТЕГИЯ КЭШИРОВАНИЯ ── */
self.addEventListener('fetch', function(e){
  var url = e.request.url;

  /* Пропускаем не-GET запросы */
  if(e.request.method !== 'GET') return;

  /* Пропускаем внешние запросы (Google Fonts, API и т.д.) */
  if(!url.startsWith(self.location.origin) && 
     !url.includes('raw.githubusercontent.com') &&
     !url.includes('fonts.googleapis.com')) return;

  /* Навигационные запросы (переход на страницу) */
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request)
        .then(function(response){
          /* Кэшируем свежую версию */
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, clone);
          });
          return response;
        })
        .catch(function(){
          /* Нет интернета — ищем в кэше */
          return caches.match(e.request)
            .then(function(cached){
              return cached || caches.match('./offline.html');
            });
        })
    );
    return;
  }

  /* Всё остальное — Cache First (быстро + офлайн) */
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;

      /* Нет в кэше — грузим из сети и кэшируем */
      return fetch(e.request).then(function(response){
        if(!response || response.status !== 200 || response.type === 'opaque'){
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(e.request, clone);
        });
        return response;
      }).catch(function(){
        /* Совсем нет интернета */
        if(e.request.destination === 'image'){
          /* Для картинок возвращаем пустой ответ */
          return new Response('', {status: 200});
        }
        return caches.match('./offline.html');
      });
    })
  );
});

/* ── PUSH УВЕДОМЛЕНИЯ (задел на будущее) ── */
self.addEventListener('push', function(e){
  if(!e.data) return;
  var data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'WAVECLUBMEDIA', {
      body:    data.body || '',
      icon:    'https://raw.githubusercontent.com/mrgrayyooo/wcm/refs/heads/main/logo.png',
      badge:   'https://raw.githubusercontent.com/mrgrayyooo/wcm/refs/heads/main/logo.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(
    clients.openWindow(e.notification.data.url)
  );
});
