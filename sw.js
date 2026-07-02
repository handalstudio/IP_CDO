// PENTING: naikkan angka versi ini SETIAP kali ada file yang diedit,
// jika tidak, HP staf akan tetap memuat versi lama dari cache.
const CACHE = 'cdo-penjualan-v1.1.0';
const ASSETS = [
  './',
  './index.html',
  './menu.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './core-toast.js',
  './core-confirm.js',
  './core-format.js',
  './core-settings.js',
  './core-wa.js',
  './core-pin.js',
  './core-cart.js',
  './core-db.js',
  './core-lock.js',
  './core-backup.js',
  './core-reconcile.js',
  './core-export.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first: saat online selalu ambil versi terbaru, cache hanya cadangan offline.
  e.respondWith(
    fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
