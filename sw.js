/* Salud de mi cartera · service worker: funciona sin conexión */
const CACHE = "salud-cartera-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "logo.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon-32.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fuentes = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !fuentes) return;
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    /* la página: primero red (para recibir actualizaciones); sin conexión, la copia */
    e.respondWith(fetch(req, { cache: "no-cache" }).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
    return r;
  })));
});
