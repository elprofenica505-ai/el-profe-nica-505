// ===== Service Worker - El Profe Nica 505 (PWA) =====
const CACHE = "profe-nica-505-v1";
const ESTATICOS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ESTATICOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // La API de la IA siempre va a la red; nunca se cachea
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // Al abrir la app: red primero; si no hay internet, usa la copia guardada
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put("/index.html", copia));
        return resp;
      }).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Estáticos (íconos, manifest, CDNs): caché primero y se actualiza en segundo plano
  e.respondWith(
    caches.match(e.request).then((enCache) => {
      const deRed = fetch(e.request).then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return resp;
      }).catch(() => enCache);
      return enCache || deRed;
    })
  );
});
