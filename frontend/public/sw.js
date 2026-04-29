/* Thal Tracker — service worker
 * Strategy:
 *  - Install: take control immediately (skipWaiting)
 *  - Activate: claim clients, drop old caches
 *  - Fetch:
 *      • Same-origin navigation requests → network-first, fall back to cached /index.html (offline shell)
 *      • Same-origin GET assets        → stale-while-revalidate (instant cache hit, refresh in bg)
 *      • Cross-origin (fonts, etc.)    → cache-first
 *      • Anything else                 → pass through (websockets, /api, hot-update, etc.)
 *
 * Data persistence (localStorage + IndexedDB) does NOT live in this cache; it is browser-managed
 * and already works offline by definition. This SW only ensures the *app shell + assets* load offline.
 */

const VERSION = "thal-v1";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// Minimal precache — the SPA shell and the manifest/icons.
// CRA emits hashed JS/CSS; those will be picked up by the runtime cache on first load.
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function shouldBypass(req, url) {
  // Pass-through: HMR / dev server endpoints, websockets, posthog, backend API, range requests
  if (req.method !== "GET") return true;
  if (req.headers.get("range")) return true;
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/sockjs-node") ||
    url.pathname.includes("hot-update") ||
    url.pathname.startsWith("/ws")
  )
    return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (shouldBypass(req, url)) return;

  // Navigation requests → network-first, fall back to cached shell
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put("/index.html", copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached =
            (await caches.match("/index.html")) ||
            (await caches.match("/")) ||
            new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
          return cached;
        })
    );
    return;
  }

  // Same-origin assets → stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === "basic") {
              const copy = res.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Cross-origin (Google Fonts, etc.) → cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && (res.status === 200 || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});

// Allow page to trigger immediate update
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
