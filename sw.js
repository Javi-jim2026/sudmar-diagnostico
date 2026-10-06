const CACHE_NAME = 'sudmar-v24';
const ASSETS = [
  '/sudmar-diagnostico/',
  '/sudmar-diagnostico/index.html',
  '/sudmar-diagnostico/manifest.json',
  '/sudmar-diagnostico/ai-assistant.js',
  '/sudmar-diagnostico/assets/logo-sudmar.png',
  '/sudmar-diagnostico/assets/logo-prettl.png',
  '/sudmar-diagnostico/assets/logo-endress.png',
  '/sudmar-diagnostico/assets/logo-comap.png',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css',
  'https://accounts.google.com/gsi/client'
];

// Instalar y cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/sudmar-diagnostico/',
        '/sudmar-diagnostico/index.html',
        '/sudmar-diagnostico/manifest.json',
        '/sudmar-diagnostico/ai-assistant.js',
        '/sudmar-diagnostico/assets/logo-sudmar.png',
        '/sudmar-diagnostico/assets/logo-prettl.png',
        '/sudmar-diagnostico/assets/logo-endress.png',
        '/sudmar-diagnostico/assets/logo-comap.png'
      ]);
    })
  );
  self.skipWaiting();
});

// Activar y limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Interceptar requests - Network first, cache fallback
self.addEventListener('fetch', event => {
  // Solo cachear requests GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, actualizar cache
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin internet: servir desde cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback a index.html para navegación
          if (event.request.mode === 'navigate') {
            return caches.match('/sudmar-diagnostico/index.html');
          }
        });
      })
  );
});
