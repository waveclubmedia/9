/* ============================================
   WAVECLUBMEDIA — Service Worker
   Перехватывает запросы, показывает offline.html
   когда нет интернета
   ============================================ */

var CACHE = 'wcm-v1';

/* Файлы которые кэшируем сразу при установке */
var PRECACHE = [
  './offline.html'
];

/* Установка — кэшируем offline страницу */
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(PRECACHE);
    })
  );
  self.skipWaiting();
});

/* Активация — чистим старые кэши */
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* Перехват запросов */
self.addEventListener('fetch', function(e){
  /* Обрабатываем только GET навигационные запросы (страницы) */
  if(e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .catch(function(){
        /* Нет интернета — показываем offline игру */
        return caches.match('./offline.html');
      })
  );
});
