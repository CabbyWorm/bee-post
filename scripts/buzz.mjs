// Sends the push for whichever card is due. See .github/workflows/buzz.yml.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const webpush = require('web-push');

const WINDOW_MS = 30 * 60 * 1000; // cron runs late; anything delivered in the last half hour still counts
const { publicKey } = JSON.parse(fs.readFileSync('site/push.json', 'utf8'));
const { cards } = JSON.parse(fs.readFileSync('site/schedule.json', 'utf8'));

const priv = process.env.VAPID_PRIVATE_KEY;
let subs = [];
try { subs = JSON.parse(process.env.PUSH_SUBS || '[]'); } catch { subs = []; }
if (!Array.isArray(subs)) subs = [subs];
subs = subs.filter((s) => s && s.endpoint);
// Manual sends can be aimed at one label (e.g. `test`); the schedule goes to every door.
const to = process.env.TO && process.env.TO !== 'all' ? process.env.TO : null;
if (to) subs = subs.filter((s) => (s.label || 'post') === to);

if (!priv || subs.length === 0) {
  console.log(`nothing to do: ${priv ? '' : 'no VAPID key; '}${subs.length} subscription(s)${to ? ' labelled ' + to : ''}`);
  process.exit(0);
}
webpush.setVapidDetails('https://github.com/CabbyWorm/bee-post', publicKey, priv);

const now = Date.now();
let due = [];
if (process.env.TEXT) {
  due = [{ id: 'note-' + now, title: 'Bzz.', body: process.env.TEXT }];
} else if (process.env.CARD) {
  due = cards.filter((c) => c.id === process.env.CARD);
  if (!due.length) { console.log(`no card ${process.env.CARD}`); process.exit(1); }
} else {
  due = cards.filter((c) => {
    const t = Date.parse(c.deliveredAt);
    return t <= now && t > now - WINDOW_MS;
  });
}
console.log(`${due.length} due at ${new Date(now).toISOString()}: ${due.map((c) => c.id).join(', ') || '-'}`);

for (const c of due) {
  const payload = JSON.stringify({ title: c.title, body: c.body, tag: 'card-' + c.id, url: './#' + c.id });
  for (const s of subs) {
    try {
      await webpush.sendNotification(s, payload, { TTL: 60 * 60, urgency: 'high' });
      console.log(`sent ${c.id} -> ${s.label || 'post'} ${s.endpoint.slice(0, 40)}…`);
    } catch (err) {
      console.log(`failed ${c.id} -> ${s.endpoint.slice(0, 40)}…: ${err.statusCode || ''} ${err.body || err.message}`);
      if (err.statusCode === 410 || err.statusCode === 404) console.log('  (subscription gone; it needs re-subscribing)');
    }
  }
}
