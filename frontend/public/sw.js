/*
 * Service Worker Unmask — PWA installable + offline.
 *
 * Stratégies :
 *   • Navigation (pages)      → network-first, repli cache, repli /offline.html
 *   • Assets statiques (_next, polices, images, css/js) → cache-first (SWR)
 *   • Autres GET same-origin  → stale-while-revalidate
 *
 * NE TOUCHE JAMAIS :
 *   • les requêtes non-GET (les audits sont des POST) ;
 *   • les requêtes cross-origin (l'API backend) → aucun résultat d'audit n'est mis en cache.
 *
 * Versionner CACHE_VERSION invalide proprement les anciens caches à l'activation.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `unmask-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `unmask-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// App shell minimal précaché (léger, autonome de tout chunk Next).
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
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

// Permet à la page de forcer l'activation d'un SW en attente.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/landing/") ||
    url.pathname.startsWith("/sounds/") ||
    /\.(?:css|js|woff2?|ttf|otf|png|jpg|jpeg|gif|webp|svg|ico|mp3|wav)$/.test(url.pathname)
  );
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Repli ultime pour une navigation : page offline.
    if (request.mode === "navigate") {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw new Error("network-first: indisponible et hors cache");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Rafraîchit en arrière-plan (stale-while-revalidate).
    fetch(request)
      .then((res) => {
        if (res && res.ok) caches.open(STATIC_CACHE).then((c) => c.put(request, res));
      })
      .catch(() => {});
    return cached;
  }
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. On ignore tout sauf le GET same-origin (API backend POST/cross-origin = réseau direct).
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // 2. Navigations → network-first (repli cache puis offline.html).
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // 3. Assets statiques → cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 4. Reste des GET same-origin → stale-while-revalidate via network-first léger.
  event.respondWith(networkFirst(request));
});
