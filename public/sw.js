const CACHE_NAME = 'batizen-v3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Stratégie "réseau d'abord" pour TOUTES les requêtes (pas seulement la navigation) :
// on va toujours chercher la dernière version en priorité, le cache ne sert
// que de secours si le réseau est indisponible. Ça garantit qu'aucun client
// ne reste jamais bloqué sur une ancienne version, tout en gardant l'app
// installable sur l'écran d'accueil.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return response;
      })
      .catch(() => caches.match(req))
  );
});