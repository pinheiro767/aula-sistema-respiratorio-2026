const CACHE_NAME = 'atlas-respiratorio-final-v1';
const FILES = ['index.html','styles.css','app.js','pdf.js','voice.js','manifest.json'];
for(let i=1;i<=25;i++) FILES.push(`imagens/${i}.png`);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES).catch(()=>null)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
});
