// Service Worker for Finance Journal Pro PWA
// v2: HTML selalu network-first (tidak boleh basi), aset ber-hash cache-first.
const CACHE_NAME = 'fj-pro-v2';
const OFFLINE_HTML = '/';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Jangan sampai install gagal hanya karena satu ikon tidak ada
      return Promise.all(STATIC_ASSETS.map((url) => cache.add(url).catch(() => undefined)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // 1) Navigasi / HTML: SELALU ambil dari jaringan dulu.
  //    Cache hanya dipakai sebagai cadangan saat offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(OFFLINE_HTML, copy));
          return res;
        })
        .catch(() =>
          caches.match(OFFLINE_HTML).then(
            (cached) => cached || new Response('Offline', { status: 503 })
          )
        )
    );
    return;
  }

  // 2) Aset ber-hash (nama file berubah tiap build): cache-first aman.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // 3) Sisanya (ikon, manifest): jaringan dulu, cache sebagai cadangan.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || Response.error()))
  );
});
