// Bee Post — the placeholder. Where the bee is, and getting the door ready for the post.

const MAN = { lat: 53.48, lon: -2.24 };
const AMS = { lat: 52.379, lon: 4.900 };
const DEPART = Date.parse('2026-09-16T07:00:00Z');   // 08:00 in Manchester, before anyone was up
const ARRIVE = Date.parse('2026-09-17T05:30:00Z');   // 07:30 in Amsterdam

const R = 6371;
const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI;
function haversine(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// Point a fraction f along the great circle from a to b.
function along(a, b, f) {
  const φ1 = rad(a.lat), λ1 = rad(a.lon), φ2 = rad(b.lat), λ2 = rad(b.lon);
  const δ = haversine(a, b) / R;
  const A = Math.sin((1 - f) * δ) / Math.sin(δ), B = Math.sin(f * δ) / Math.sin(δ);
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);
  return { lat: deg(Math.atan2(z, Math.sqrt(x * x + y * y))), lon: deg(Math.atan2(y, x)) };
}

// Map: a plain equirectangular sheet over the North Sea.
const W = 600, H = 360;
const BOUNDS = { lonMin: -4.6, lonMax: 7.4, latMin: 50.3, latMax: 55.1 };
const kx = W / (BOUNDS.lonMax - BOUNDS.lonMin);
const ky = H / (BOUNDS.latMax - BOUNDS.latMin);
const px = (p) => [((p.lon - BOUNDS.lonMin) * kx).toFixed(1), ((BOUNDS.latMax - p.lat) * ky).toFixed(1)];

const svgNS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};

const map = document.getElementById('map');
const out = document.getElementById('out');
const eta = document.getElementById('eta');
const said = document.getElementById('said');

async function drawMap() {
  const land = el('g', { fill: '#F6F1E5', stroke: '#6B635A', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, map);
  try {
    const o = await (await fetch('outlines.json')).json();
    for (const ring of o.britain) {
      el('path', { d: 'M' + ring.map(([lon, lat]) => px({ lat, lon }).join(',')).join('L') + 'Z' }, land);
    }
    // The continent is only a coastline; fill down to the bottom of the sheet.
    const c = o.continent.map(([lon, lat]) => px({ lat, lon }).join(','));
    el('path', { d: 'M' + c.join('L') + `L${W},${H}L${c[0].split(',')[0]},${H}Z` }, land);
  } catch { /* a sea with no land on it is still a sea */ }

  const [mx, my] = px(MAN), [ax, ay] = px(AMS);
  // Route: sampled along the great circle, drawn as a dotted pencil line.
  const pts = [];
  for (let i = 0; i <= 40; i++) pts.push(px(along(MAN, AMS, i / 40)).join(','));
  el('path', { d: 'M' + pts.join('L'), fill: 'none', stroke: '#6B635A', 'stroke-width': 1.2, 'stroke-dasharray': '2 5' }, map);
  for (const [x, y, name, anchor] of [[mx, my, 'Manchester', 'end'], [ax, ay, 'Amsterdam', 'start']]) {
    el('circle', { cx: x, cy: y, r: 3.5, fill: '#2E2924' }, map);
    const t = el('text', { x: +x + (anchor === 'end' ? -8 : 8), y: +y + 4, 'font-size': 13, 'text-anchor': anchor, fill: '#2E2924', 'font-family': 'inherit' }, map);
    t.textContent = name;
  }

  // The bee, drawn small. Sunglasses are from Nice; it hasn't taken them off since.
  const bee = el('g', { class: 'bee' }, map);
  el('ellipse', { class: 'wing', cx: -3, cy: -6, rx: 6, ry: 3, fill: '#fff', 'fill-opacity': .7, stroke: '#2E2924', 'stroke-width': .8 }, bee);
  el('ellipse', { class: 'wing', cx: 3, cy: -6, rx: 6, ry: 3, fill: '#fff', 'fill-opacity': .7, stroke: '#2E2924', 'stroke-width': .8 }, bee);
  el('ellipse', { cx: 0, cy: 0, rx: 9, ry: 6, fill: '#E8B324', stroke: '#2E2924', 'stroke-width': 1.2 }, bee);
  el('path', { d: 'M-3 -6v12M2 -6v12M6 -4v8', stroke: '#2E2924', 'stroke-width': 2, 'stroke-linecap': 'round' }, bee);
  el('circle', { cx: -10, cy: -1, r: 4, fill: '#E8B324', stroke: '#2E2924', 'stroke-width': 1.2 }, bee);
  el('rect', { x: -14, y: -3, width: 3.5, height: 2.5, fill: '#2E2924' }, bee);
  el('rect', { x: -10, y: -3, width: 3.5, height: 2.5, fill: '#2E2924' }, bee);
  // A postcard, tucked underneath.
  el('rect', { x: -4, y: 4, width: 10, height: 6, fill: '#fff', stroke: '#2E2924', 'stroke-width': .8, transform: 'rotate(-12 1 7)' }, bee);
  el('rect', { x: 3, y: 5, width: 2, height: 2, fill: '#8C3A2B', transform: 'rotate(-12 1 7)' }, bee);
  bee.addEventListener('click', poke);
  return bee;
}

const lines = [
  'Busy.',
  'Over the sea. Dark. Fine.',
  "Twenty-two kilometres an hour, and that's with a card.",
  "Wind's behind me. Wanted that noted.",
  "Can't see a thing. Can smell chips.",
  "Don't wait up.",
  'A worker bee stays within five kilometres of the hive her whole life. Five.',
  "Not tired. Stop asking.",
  "Nearly there. Well. Not nearly. But there.",
  "It's a very big sea and I'm a very small bee and I'm doing it anyway.",
];
let lastLine = -1;
function poke() {
  let i; do { i = Math.floor(Math.random() * lines.length); } while (i === lastLine);
  lastLine = i; said.textContent = lines[i];
}

const total = haversine(MAN, AMS);
const amsTime = (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
function tick(bee) {
  const now = Date.now();
  const f = Math.min(1, Math.max(0, (now - DEPART) / (ARRIVE - DEPART)));
  const p = along(MAN, AMS, f);
  const [x, y] = px(p);
  bee.setAttribute('transform', `translate(${x} ${y})`);
  const done = total * f;
  if (f >= 1) {
    out.textContent = 'At Centraal.'; eta.textContent = 'Delivered.';
  } else {
    out.textContent = `${Math.round(done)} km out · ${Math.round(total - done)} to go`;
    eta.textContent = `Centraal ${amsTime(ARRIVE)}`;
  }
}

drawMap().then((bee) => { tick(bee); setInterval(() => tick(bee), 30 * 1000); });

// ---- The door: install, then allow the buzz, then send the subscription on.

const $ = (id) => document.getElementById(id);
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const canPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function show(step) {
  for (const s of ['install', 'buzz', 'send', 'ready']) $('step-' + s).classList.toggle('hidden', s !== step);
}

async function setup() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.register('sw.js');
  if (!canPush || (isIOS && !standalone)) { show('install'); return; }
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    if (localStorage.getItem('bee-post:sent') === existing.endpoint) show('ready');
    else { $('sub').value = JSON.stringify(existing); show('send'); }
    return;
  }
  show('buzz');
}

function b64ToBytes(s) {
  const pad = '='.repeat((4 - s.length % 4) % 4);
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

$('allow').addEventListener('click', async () => {
  $('allow').disabled = true;
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { $('allow-hint').textContent = "That's a no, then. Settings → Notifications → Bee Post, if you change your mind."; $('allow').disabled = false; return; }
    const { publicKey } = await (await fetch('push.json')).json();
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
    $('sub').value = JSON.stringify(sub);
    show('send');
  } catch (e) {
    $('allow-hint').textContent = 'Hm. ' + (e && e.message ? e.message : e);
    $('allow').disabled = false;
  }
});

$('share').addEventListener('click', async () => {
  const text = $('sub').value;
  try {
    if (navigator.share) await navigator.share({ title: 'Bee Post', text });
    else { await navigator.clipboard.writeText(text); $('share-hint').textContent = 'Copied. Paste it into a message.'; }
    localStorage.setItem('bee-post:sent', JSON.parse(text).endpoint);
    setTimeout(() => show('ready'), 800);
  } catch { $('share-hint').textContent = 'Long-press the box above to copy it instead.'; }
});

setup();
