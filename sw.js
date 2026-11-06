/**
 * Skycast service worker — lets the app be installed (PWA) and gives a
 * cached app shell for offline use. Weather data is always fetched live
 * from Open-Meteo, so actual forecasts need a network connection.
 *
 * Strategy: network-first for same-origin shell files (always fresh after
 * a re-deploy), falling back to cache when offline. Cross-origin requests
 * (Open-Meteo) go straight to the network.
 */
const CACHE = "skycast-v1";
const SHELL = [
  "./",
  "./style.css",
  "./i18n.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // let anything else hit the network
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Open-Meteo etc.: passthrough

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
