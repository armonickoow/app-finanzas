const CACHE_NAME = 'finanzas-aussie-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/config.js',
  './js/modules/auth.js',
  './js/modules/excel.js',
  './js/modules/summary.js',
  './js/modules/theme.js',
  './js/modules/ui.js',
  './js/modules/views.js',
  './js/services/supabaseService.js'
];

// Instalación del Service Worker y Caché de recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache abierta');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones para que funcione Offline
self.addEventListener('fetch', event => {
  // Solo interceptamos GET
  if (event.request.method !== 'GET') return;
  
  // Ignoramos peticiones a la base de datos de Supabase para que siempre busque lo más reciente
  if (event.request.url.includes('supabase.co')) return;
  // Ignoramos la librería externa de excel y supabase
  if (event.request.url.includes('cdn.jsdelivr.net')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // Retorna de la caché si existe, sino hace la petición a la red
      return response || fetch(event.request);
    }).catch(() => {
      // Si falla la red y no está en caché (ej. sin internet), devolvemos el index.html
      if (event.request.headers.get('accept').includes('text/html')) {
        return caches.match('./index.html');
      }
    })
  );
});
