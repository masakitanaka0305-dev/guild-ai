// GUILD AI Service Worker — stale-while-revalidate
// Caches /projects, /guild, /onboarding last-visited version.
// Offline fallback: /offline

const CACHE = "guild-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  // Navigation requests: stale-while-revalidate
  if (request.mode === "navigate") {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
            .catch(() => cached ?? caches.match(OFFLINE_URL));
          return cached ?? networkFetch;
        }),
      ),
    );
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request)),
  );
});
