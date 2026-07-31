// This app migrated from a PWA (which registered a service worker at this
// path and precached /site.webmanifest, genfavicon-*.png, etc.) to a plain
// web app that registers no service worker at all.
//
// Browsers re-fetch this script on every visit to check for updates, so any
// client still running the OLD worker will pick up this replacement and
// unregister itself — even if the old worker served the cached HTML shell.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});
