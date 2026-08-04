const CACHE_NAME = 'batizen-v1';
const urlsToCache = ['/', '/dashboard', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Ne jamais intercepter : requêtes non-GET (POST/PUT/DELETE) et domaines externes
  // (Cloudinary, Firebase, etc.) — seulement les GET vers notre propre domaine.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }
  event.respondWith(caches.match(req).then((response) => response || fetch(req)));
});