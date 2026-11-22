// Offline: the app shell is stored on install; pictures and videos are stored the first time they are shown.
// Answers come from the store first, and the store is refreshed in the background, so a new version
// shows the next time the app is opened. Bump VERSION when the shell list changes.
const VERSION = 'drv-2026-11-24a';
const SHELL = ['./', './index.html', './app.css', './tokens.css', './base.css', './manifest.webmanifest', './fonts/archivo-wdth.woff2',
  './data.js', './produkter.js', './rens.js', './retter-billeder.js', './opskrifter.js', './opskriftsbank.js', './bank-billeder.js', './naering.js', './illustrationer.js', './teknikker.js', './videoer.js',
  './priser.js', './pdf-maker.js', './scanner.js', './app.js', './icons/icon-192.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.headers.has('range')) return; // video seeking goes straight to the network
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then((r) => { if (r.ok && r.type === 'basic') c.put(req, r.clone()); return r; }).catch(() => hit || (req.mode === 'navigate' ? c.match('./index.html') : Response.error()));
    return hit || net;
  }));
});
