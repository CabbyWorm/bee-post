// Bee Post service worker: keeps the shell offline, and shows the buzz.
const CACHE = 'bee-post-v2';
const SHELL = ['./', './index.html', './app.js', './outlines.json', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Content (schedule, push key) is network-first so a redeploy shows up; the shell is cache-first.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
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
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || 'There is something on the mat.',
    tag: d.tag || 'bee-post',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || './', self.location.href).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.navigate(target); return c.focus(); } }
    return self.clients.openWindow(target);
  }));
});
