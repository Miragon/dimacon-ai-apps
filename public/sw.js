/* Dimacon Durchbruch-Kalkulator – Service Worker
 *
 * Strategie (reine URL-State-SPA, kein Backend):
 *  - Navigation (HTML): network-first, offline Fallback auf gecachte App-Shell.
 *    So läuft online immer die aktuelle Version, offline die zuletzt gecachte.
 *    Query-Parameter (der komplette App-Zustand) werden clientseitig geparst,
 *    daher genügt eine einzige gecachte index.html für beliebige Links.
 *  - Statische Assets (gehashte JS/CSS/Fonts/Bilder): cache-first. Sie sind
 *    durch den Datei-Hash unveränderlich und werden beim ersten Online-Besuch
 *    automatisch in den Cache aufgenommen -> danach voll offline-fähig.
 */

const CACHE = "dimacon-durchbruch-v1";
const APP_SHELL = "/index.html";
const PRECACHE = ["/", APP_SHELL, "/manifest.webmanifest", "/favicon.png", "/pwa-192.png", "/pwa-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // SPA-Navigation: aktuelle Shell online holen, offline aus dem Cache liefern.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(APP_SHELL, copy));
          return res;
        })
        .catch(() => caches.match(APP_SHELL).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Statische Assets: cache-first, bei Miss laden und cachen.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    }),
  );
});
