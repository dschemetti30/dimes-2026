// Dimes Front Office service worker v2.
// Network-first for the app itself (index.html, app.js, manifest) so every deploy shows up on the next load;
// cache is only a fallback when offline. Cache-first for icons and fonts. Push handlers unchanged.
const CACHE = "dimes-shell-v2";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/icon-192.png", "/icon-512.png"]).catch(() => {}))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url); if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.startsWith("/api/")) return;
  const isShell = e.request.mode === "navigate" || /\.(js|html|json|webmanifest)$/.test(u.pathname) || u.pathname === "/";
  if (isShell) {
    e.respondWith(fetch(e.request, { cache: "no-store" }).then((r) => { if (r && r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request).then((r) => { if (r && r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone())); return r; })));
  }
});
self.addEventListener("push", (e) => { let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "Dimes Front Office", body: e.data ? e.data.text() : "" }; } e.waitUntil(self.registration.showNotification(d.title || "Dimes Front Office", { body: d.body || "", icon: "/icon-192.png", badge: "/icon-192.png", data: { url: d.url || "/" } })); });
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => { for (const c of list) { if ("focus" in c) return c.focus(); } return clients.openWindow(e.notification.data && e.notification.data.url ? e.notification.data.url : "/"); })); });
