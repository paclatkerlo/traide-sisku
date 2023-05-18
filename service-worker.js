// give your cache a name
const cacheName = 'traide-sisku-cache';

// put the static assets and routes you want to cache here
const filesToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/latkerlo-jvotci/js/docs/data.js',
  '/latkerlo-jvotci/js/docs/rafsi.js',
  '/latkerlo-jvotci/js/docs/tarmi.js',
  '/latkerlo-jvotci/js/docs/tools.js',
  '/latkerlo-jvotci/js/docs/jvozba.js',
  '/latkerlo-jvotci/js/docs/katna.js',
  '/Font-Awesome/js/fontawesome.js',
  '/Font-Awesome/js/solid.js',
  '/?en',
  '/?eo',
  '/?ja',
  '/?jbo'
];

self.addEventListener('activate', e => self.clients.claim());

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName)
    .then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith((async () => {
    const fetchedResponsePromise = (async () => {
      return fetch(e.request)
      .then(response => {
        const clonedResponse = response.clone();
        if (response.ok) {
          caches
          .open(cacheName)
          .then((someCache) => someCache.put(e.request, response));
          return clonedResponse;
        }
      })
    })();

    const cachedResponse = await caches.match(e.request);
    return (cachedResponse ? cachedResponse : await fetchedResponsePromise);
  })());
});
