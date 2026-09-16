// Bee Post service worker: keeps the shell offline, and shows the buzz.
const CACHE = 'bee-post-v5';
const SHELL = ['./', './index.html', './app.js', './bee.js', './trip.js', './voice.js', './postcard.js', './outlines.json', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      const stale = keys.filter((k) => k !== CACHE);
      return Promise.all(stale.map((k) => caches.delete(k))).then(() => self.clients.claim()).then(async () => {
        // A page still showing the old shell is brought up to date now rather
        // than on its next open: a phone that installed the placeholder should
        // find the post, not the placeholder.
        if (!stale.length) return;
        const list = await self.clients.matchAll({ type: 'window' });
        for (const c of list) { try { await c.navigate(c.url); } catch {} }
      });
    })
  );
});

// Content (schedule, push key) is network-first so a redeploy shows up; the shell is cache-first.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { caches.open(CACHE).then((c) => c.put(e.request, r.clone())); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('.json')) {
    e.respondWith(fetch(e.request).then((r) => { caches.open(CACHE).then((c) => c.put(e.request, r.clone())); return r; })
      .catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  const title = d.title || 'Post.';
  e.waitUntil(Promise.all([
    self.registration.showNotification(title, {
      body: d.body || 'There is something on the mat.',
      tag: d.tag || 'bee-post',
      icon: './icon-192.png',
      badge: './icon-192.png',
      data: { url: d.url || './' },
    }),
    // A dot on the icon, for a phone that missed the buzz.
    (async () => { try { if (self.navigator.setAppBadge) await self.navigator.setAppBadge(1); } catch {} })(),
  ]));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || './', self.location.href).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.navigate(target); return c.focus(); } }
    return self.clients.openWindow(target);
  }));
});
