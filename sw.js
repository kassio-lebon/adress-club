// ADRESS CLUB — service worker : l'interface fonctionne hors ligne, les données restent toujours en direct.
const CACHE = 'acl-v9';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'admin.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'logo.png', 'motion.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // Supabase et CDN : jamais mis en cache ici
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
self.addEventListener('push', (e) => {
  const d = e.data ? e.data.json() : { titre: 'ADRESS CLUB' };
  e.waitUntil(self.registration.showNotification(d.titre || 'ADRESS CLUB', { body: d.message || '', icon: 'icon-192.png', data: { url: d.url || './#/notifications' } }));
});
self.addEventListener('notificationclick', (e) => { e.notification.close(); e.waitUntil(clients.openWindow(e.notification.data?.url || './')); });
