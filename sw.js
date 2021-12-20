self.addEventListener('install', (e) => {
});

self.addEventListener('fetch', (e) => {
//  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
