const APP_VERSION = "v3.0.1";
const CACHE_NAME = `family-finance-${APP_VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest?v=v3.0.1",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

async function networkFirst(request, fallbackPath) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    if (fallbackPath) {
      const fallback = await caches.match(fallbackPath);
      if (fallback) {
        return fallback;
      }
    }
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || networkPromise || new Response("Offline", { status: 503, statusText: "Offline" });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigation = event.request.mode === "navigate";
  const isAppShell =
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "worker";
  const isManifest = url.pathname.endsWith("manifest.webmanifest") || url.pathname.endsWith("manifest.json");

  if (isNavigation) {
    event.respondWith(networkFirst(event.request, OFFLINE_URL));
    return;
  }

  if (isManifest) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isAppShell) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "SHOW_NOTIFICATION") {
    const title = event.data.title || "FamilYMoney";
    const options = {
      body: event.data.body || "Lembrete financeiro",
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});
