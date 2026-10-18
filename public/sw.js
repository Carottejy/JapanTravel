// Service worker minimal : rend l'application installable et permet de rouvrir
// la dernière version de la page sans réseau. Les données (Supabase) ne sont jamais mises en cache.
const CACHE = "jt-shell-v1";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add("./")).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    // Réseau d'abord, copie de secours de la page si hors ligne
    e.respondWith(
      fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put("./", copy)); return r; })
        .catch(() => caches.match("./")),
    );
    return;
  }
  // Fichiers de l'application (noms versionnés) et photos : cache puis réseau
  if (/\/(assets|sprites)\//.test(req.url) || /\.(png|svg|webmanifest)$/.test(req.url)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return r;
    })));
  }
});
