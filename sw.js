// ADRESS CLUB — service worker : l'interface fonctionne hors ligne, les données restent toujours en direct.
const CACHE = 'acl-v72';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'admin.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'logo.png', 'motion.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE && x !== 'acl-img' && x !== 'acl-lib').map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.pathname.includes('/videos/')) return; // vidéos : lues directement (lecture par morceaux)
  // Bibliothèque Supabase et polices : gardées sur le téléphone (l'appli démarre même si le CDN est lent ou hors ligne)
  if (e.request.method === 'GET' && /^(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname)) {
    e.respondWith(caches.open('acl-lib').then(c => c.match(e.request).then(r => r || fetch(e.request).then(rep => { if (rep.ok || rep.type === 'opaque') c.put(e.request, rep.clone()); return rep; }))));
    return;
  }
  if (e.request.method === 'GET' && /\/storage\/v1\/object\/(sign|public)\//.test(u.pathname)) {
    // Photos : servies depuis le téléphone après le premier affichage (clé = chemin, sans le jeton)
    const cle = new Request(u.origin + u.pathname);
    e.respondWith(caches.open('acl-img').then(c => c.match(cle).then(r => r || fetch(e.request).then(rep => { if (rep.ok) { c.put(cle, rep.clone()); c.keys().then(k => { if (k.length > 300) k.slice(0, k.length - 300).forEach(x => c.delete(x)); }); } return rep; }))));
    return;
  }
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // Supabase et CDN : jamais mis en cache ici
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
self.addEventListener('push', (e) => {
  let d = { titre: 'ADRESS CLUB' }; try { d = e.data ? e.data.json() : d; } catch (_) {}
  const badge = () => { try { if (self.navigator.setAppBadge && d.badge) return self.navigator.setAppBadge(d.badge); } catch (_) {} };
  e.waitUntil(Promise.all([self.registration.showNotification(d.titre || 'ADRESS CLUB', { body: d.message || '', icon: 'icon-192.png', badge: 'badge-96.png', tag: d.tag, vibrate: [80, 40, 80], data: { url: d.url || './#/notifications' } }), badge()]));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close(); const url = e.notification.data?.url || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => { const w = ws.find(x => 'focus' in x); if (w) { w.navigate(url).catch(() => {}); return w.focus(); } return clients.openWindow(url); }));
});
