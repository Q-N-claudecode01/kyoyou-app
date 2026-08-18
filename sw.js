// 許容応力度計算ツール Service Worker
// HTML: network-first(更新を取りこぼさない) / 画像・manifest: cache-first
const CACHE = 'kyoyou-v2';
const ASSETS = [
  './',
  './%E8%A8%B1%E5%AE%B9%E5%BF%9C%E5%8A%9B%E5%BA%A6%E8%A8%88%E7%AE%97%E3%82%A2%E3%83%97%E3%83%AA.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // 通信があれば最新を取りに行き、圏外ならキャッシュで開く
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./%E8%A8%B1%E5%AE%B9%E5%BF%9C%E5%8A%9B%E5%BA%A6%E8%A8%88%E7%AE%97%E3%82%A2%E3%83%97%E3%83%AA.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => hit))
  );
});
