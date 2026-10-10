// Service worker de Cupid@: la app abre al instante y sin conexión (la IA sí necesita internet).
const VERSION = "cupida-v10";
const SHELL = ["/", "/manifest.webmanifest", "/icons/logo.webp", "/icons/cupid.webp", "/icons/icon-192.png", "/icons/icon-512.png", "/auth.js", "/fonts/fonts.css", "/fonts/dm-sans-latin-opsz-normal.woff2", "/fonts/plus-jakarta-sans-latin-wght-normal.woff2", "/privacidad", "/terminos", "/aviso-legal", "/cookies"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.host)) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/")) return;   // IA, pagos y cuentas: siempre en red
  if (e.request.mode === "navigate") {
    // Páginas: red primero (para tener siempre la última versión), caché si no hay conexión
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(url.pathname === "/" ? "/" : e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("/"))));
    return;
  }
  // Recursos: caché primero y se actualiza por detrás
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok && (url.origin === location.origin || url.host.endsWith("gstatic.com") || url.host.endsWith("googleapis.com"))) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
