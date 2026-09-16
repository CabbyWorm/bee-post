// Bee Post: the bee, where it is, and what is on the mat.
(() => {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  // `?at=2026-09-18T15:00Z` moves the clock, for looking at a day that has not happened.
  const offset = params.get('at') ? Date.parse(params.get('at')) - Date.now() : 0;
  const now = () => Date.now() + offset;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('bee-post:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('bee-post:' + k, JSON.stringify(v)); } catch {} },
  };

  const dpr = () => Math.min(3, window.devicePixelRatio || 1);
  const svgNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  const h = (tag, attrs = {}, ...children) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
    for (const c of children) e.append(c);
    return e;
  };

  // MARK: - The map

  const W = 600, H = 360;
  const SHEETS = {
    sea: { lonMin: -4.6, lonMax: 7.4, latMin: 50.3, latMax: 55.1 },
    city: { lonMin: 4.70, lonMax: 4.99, latMin: 52.285, latMax: 52.425 },
  };
  const CITY = new Set(['centraal', 'ijFerry', 'vondelpark', 'beeHotel', 'bloemenmarkt', 'hotelDoor', 'schiphol', 'gate']);
  let sheet = 'sea';
  const proj = (p, s = SHEETS[sheet]) => {
    // Equirectangular, with the longitude squeezed for the latitude so the
    // sheet is not stretched; the sheet's own aspect takes care of the rest.
    const kx = W / (s.lonMax - s.lonMin), ky = H / (s.latMax - s.latMin);
    return [((p.lon - s.lonMin) * kx), ((s.latMax - p.lat) * ky)];
  };
  const map = $('map');
  let outlines = null;
  const layers = {};

  async function buildMap() {
    try { outlines = await (await fetch('outlines.json')).json(); } catch { outlines = null; }
    for (const name of ['land', 'water', 'route', 'places', 'bee']) layers[name] = el('g', { id: 'layer-' + name }, map);
    drawSheet();
  }

  function drawSheet() {
    for (const g of Object.values(layers)) while (g.firstChild) g.removeChild(g.firstChild);
    if (sheet === 'sea') {
      const land = el('g', { fill: '#F6F1E5', stroke: '#6B635A', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, layers.land);
      if (outlines) {
        for (const ring of outlines.britain) el('path', { d: 'M' + ring.map(([lon, lat]) => proj({ lat, lon }).join(',')).join('L') + 'Z' }, land);
        const c = outlines.continent.map(([lon, lat]) => proj({ lat, lon }).join(','));
        el('path', { d: 'M' + c.join('L') + `L${W},${H}L${c[0].split(',')[0]},${H}Z` }, land);
      }
      for (const [key, anchor] of [['manchester', 'end'], ['centraal', 'start'], ['stPancras', 'end']]) {
        const p = Trip.places[key], [x, y] = proj(p);
        el('circle', { cx: x, cy: y, r: 3.2, fill: '#2E2924' }, layers.places);
        const t = el('text', { x: x + (anchor === 'end' ? -7 : 7), y: y + 4, 'font-size': 12, 'text-anchor': anchor, fill: '#2E2924', 'font-family': 'inherit' }, layers.places);
        t.textContent = key === 'centraal' ? 'Amsterdam' : key === 'stPancras' ? 'London' : p.name;
      }
    } else {
      // Amsterdam, sketched: the IJ across the top, the canal ring, the Amstel,
      // and the places the bee goes. Land is paper; water is the sea colour.
      el('rect', { x: 0, y: 0, width: W, height: H, fill: '#F6F1E5' }, layers.land);
      const ij = [[4.70, 52.407], [4.78, 52.402], [4.86, 52.395], [4.90, 52.386], [4.94, 52.383], [4.99, 52.386]].map(([lon, lat]) => proj({ lat, lon }).join(','));
      const ijBack = [[4.99, 52.402], [4.94, 52.400], [4.90, 52.400], [4.86, 52.410], [4.78, 52.418], [4.70, 52.422]].map(([lon, lat]) => proj({ lat, lon }).join(','));
      el('path', { d: 'M' + ij.join('L') + 'L' + ijBack.join('L') + 'Z', fill: '#C9D6D3', stroke: '#6B635A', 'stroke-width': 1 }, layers.water);
      const [cx, cy] = proj(Trip.places.centraal);
      const kmY = H / ((SHEETS.city.latMax - SHEETS.city.latMin) * 111);
      const kmX = W / ((SHEETS.city.lonMax - SHEETS.city.lonMin) * 111 * Math.cos(52.37 * Math.PI / 180));
      for (const rkm of [0.55, 0.75, 0.93, 1.1]) {
        const rx = rkm * kmX, ry = rkm * kmY;
        el('path', { d: `M${cx - rx},${cy + ry * 0.15} A${rx},${ry} 0 0 0 ${cx + rx},${cy + ry * 0.15}`, fill: 'none', stroke: '#8FA8AA', 'stroke-width': 2.2 }, layers.water);
      }
      // The Amstel, wandering off south.
      const amstel = [[4.9005, 52.368], [4.902, 52.358], [4.906, 52.345], [4.905, 52.33], [4.91, 52.30]].map(([lon, lat]) => proj({ lat, lon }).join(','));
      el('path', { d: 'M' + amstel.join('L'), fill: 'none', stroke: '#8FA8AA', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, layers.water);
      for (const [key, anchor, label] of [['centraal', 'start', 'Centraal'], ['ijFerry', 'start', 'the ferry'], ['vondelpark', 'end', 'Vondelpark'], ['bloemenmarkt', 'start', 'Bloemenmarkt'], ['schiphol', 'start', 'Schiphol'], ['hotelDoor', 'start', 'your door']]) {
        const [x, y] = proj(Trip.places[key]);
        el('circle', { cx: x, cy: y, r: 3, fill: '#2E2924' }, layers.places);
        const t = el('text', { x: x + (anchor === 'end' ? -7 : 7), y: y + 4, 'font-size': 12, 'text-anchor': anchor, fill: '#2E2924', 'font-family': 'inherit' }, layers.places);
        t.textContent = label;
      }
    }
    // The bee marker is a small rendering of the bee itself.
    layers.beeImg = el('image', { width: 46, height: 50, x: -23, y: -25 }, layers.bee);
    layers.bee.addEventListener('click', () => sayTheNextThing());
  }

  const markerCanvas = document.createElement('canvas'); markerCanvas.width = 138; markerCanvas.height = 150;
  function renderMarker(state) {
    const c = markerCanvas.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 138, 150);
    // The bee is drawn facing left. Heading east, it is mirrored.
    const east = Math.sin(state.pos.heading * Math.PI / 180) > 0;
    c.setTransform(east ? -3 : 3, 0, 0, 3, east ? 138 : 0, 0);
    Bee.draw(c, 46, 50, { phase: 0.18, look: state.look, mood: 'cheerful' });
    return markerCanvas.toDataURL();
  }

  let lastRouteLeg = null;
  function updateMap(state) {
    const leg = state.leg;
    const wantSheet = leg.via.every((k) => CITY.has(k)) ? 'city' : 'sea';
    if (wantSheet !== sheet) { sheet = wantSheet; drawSheet(); lastRouteLeg = null; }
    if (lastRouteLeg !== leg.id) {
      while (layers.route.firstChild) layers.route.removeChild(layers.route.firstChild);
      const pts = [];
      const via = leg.via.map((k) => Trip.places[k]);
      for (let i = 0; i < via.length - 1; i++) {
        for (let s = 0; s <= 24; s++) pts.push(proj(Trip.along(via[i], via[i + 1], s / 24)).join(','));
      }
      if (pts.length > 1) {
        const dash = leg.mode === 'wing' ? '2 5' : leg.mode === 'plane' ? '6 5' : leg.mode === 'sleep' || leg.mode === 'wait' ? '1 6' : '5 3';
        el('path', { d: 'M' + pts.join('L'), fill: 'none', stroke: '#6B635A', 'stroke-width': 1.3, 'stroke-dasharray': dash }, layers.route);
      }
      // Under the sea: a second line, so the tunnel shows.
      if (leg.id === 'eurostar') {
        const a = proj(Trip.places.folkestone), b = proj(Trip.places.calais);
        el('path', { d: `M${a.join(',')}L${b.join(',')}`, fill: 'none', stroke: '#1B4965', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.5 }, layers.route);
      }
      lastRouteLeg = leg.id;
    }
    const [x, y] = proj(state.pos);
    layers.bee.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    layers.beeImg.setAttribute('href', renderMarker(state));
  }

  // MARK: - The bee, and what it is saying

  let talking = false, talkTimer = 0;
  let current = null;
  Bee.animate($('bee'), () => current ? { look: current.look, mood: current.mood, talking } : {});

  // A deck per leg: its own lines, then a few general ones, in an order that
  // stays put for the day, so tapping walks a sequence rather than reshuffling.
  const decks = {};
  function seeded(seed) { let v = 2166136261; for (const ch of seed) { v ^= ch.charCodeAt(0); v = Math.imul(v, 16777619) >>> 0; } return () => { v = (Math.imul(v, 1664525) + 1013904223) >>> 0; return v / 4294967296; }; }
  function shuffle(arr, seed) { const r = seeded(seed), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function deckFor(state) {
    const key = state.leg.id;
    if (!decks[key]) {
      const day = new Date(state.now).toISOString().slice(0, 10);
      const own = Voice.legs[key] || [];
      const rest = shuffle([...shuffle(Voice.general, key + day).slice(0, 2), ...shuffle(Voice.remembering, key + day + 'r').slice(0, state.leg.mode === 'wander' || state.leg.mode === 'sleep' ? 2 : 1), ...shuffle(Voice.facts, key + day + 'f').slice(0, 1)], key + day + 'x');
      // The leg's own first line stays first: opening the page on a new leg tells you the bee has noticed.
      decks[key] = { lines: [own[0], ...shuffle([...own.slice(1), ...rest], key + day + 'o')].filter(Boolean), i: 0 };
    }
    return decks[key];
  }
  function say(text) {
    const b = $('bubble');
    b.classList.remove('said'); void b.offsetWidth; b.classList.add('said');
    b.textContent = text;
    talking = true; clearTimeout(talkTimer);
    talkTimer = setTimeout(() => { talking = false; }, Math.min(3200, 900 + text.length * 28));
  }
  function context(state) {
    const near = Trip.nearest(state.pos, sheet === 'city' ? 3 : 60);
    return { fromHome: state.fromHome, where: near ? near.name : (state.leg.mode === 'wing' || state.leg.mode === 'plane' ? 'the North Sea' : 'here') };
  }
  function sayTheNextThing() {
    if (!current) return;
    const deck = deckFor(current);
    if (!deck.lines.length) return;
    say(Voice.fill(deck.lines[deck.i % deck.lines.length], context(current)));
    deck.i++;
  }
  $('bee').addEventListener('click', sayTheNextThing);

  // MARK: - The tracker, and the clock

  const dayOf = (t) => Trip.fmtDay(t).slice(0, 3);
  function updateTracker(state) {
    const leg = state.leg;
    $('leg').textContent = leg.label;
    $('mode').textContent = { wing: 'own wings', plane: 'by air', train: 'by rail', eurostar: 'by rail, under the sea', walk: 'on foot', wander: 'about town', sleep: 'asleep', wait: 'waiting', home: 'at home', bag: 'in the bag' }[leg.mode] || '';
    $('bar').style.width = (state.f * 100).toFixed(1) + '%';
    const sameDay = dayOf(leg.t0) === dayOf(leg.t1);
    $('from').textContent = `${Trip.places[leg.from].name} · ${dayOf(leg.t0)} ${Trip.fmtTime(leg.t0)}`;
    $('to').textContent = leg.id === 'home' ? 'for good' : `${Trip.places[leg.to].name} · ${sameDay ? '' : dayOf(leg.t1) + ' '}${Trip.fmtTime(leg.t1)}`;
    const near = Trip.nearest(state.pos, sheet === 'city' ? 3 : 60);
    const total = Trip.haversine(Trip.places[leg.from], Trip.places[leg.to]);
    let line = !near ? 'Over the North Sea' : near.key === 'midChannel' ? 'Under the Channel' : near.name.startsWith('the middle') ? 'In ' + near.name : `Near ${near.name}`;
    if (leg.mode === 'wing' || leg.mode === 'plane' || leg.mode === 'eurostar' || leg.mode === 'train') {
      const done = Math.round(total * state.f);
      line += ` · ${done} km done · ${Math.max(0, Math.round(total - done))} to go`;
    }
    $('said').textContent = line;
    const where = sheet === 'city' ? (near ? near.name : 'Amsterdam') : (near ? near.name : 'the North Sea');
    $('where').textContent = `${where.toUpperCase()} · ${Math.round(state.fromHome)} KM FROM MANCHESTER`;
    $('clock').textContent = `${Trip.fmtDay(state.now)} ${Trip.fmtTime(state.now)}`;
  }

  // MARK: - The shelf

  const thumbs = {};
  function cardLook(card) { return Trip.state(card.t).look; }
  async function updateShelf(state) {
    const list = $('cards');
    for (const card of state.delivered) {
      if (thumbs[card.id]) continue;
      const c = document.createElement('canvas'); c.width = 168 * 2; c.height = 120 * 2;
      Postcard.drawFront(c.getContext('2d'), c.width, c.height, { ...card, ...Voice.cards[card.id] }, cardLook(card));
      const when = h('div', { class: 'when typed' }, `${Trip.fmtDay(card.t)} ${Trip.fmtTime(card.t)}`);
      const t = h('div', { class: 'thumb', onclick: () => openCard(card.id) }, c, when);
      if (!store.get('seen', []).includes(card.id)) t.classList.add('unread');
      list.prepend(t);
      thumbs[card.id] = t;
    }
    if (!thumbs.royal) {
      const box = h('div', { class: 'box' }, '');
      const slot = h('div', { class: 'slot' }, box, h('div', { class: 'when typed' }, 'Royal Mail'));
      slot.addEventListener('click', () => say(now() >= Trip.royalMail.stages[Trip.royalMail.stages.length - 1].at ? Voice.royalMail.arrived : Voice.royalMail.waiting));
      list.append(slot);
      thumbs.royal = box;
    }
    const stage = Trip.royalMail.stages.filter((s) => now() >= s.at).pop();
    thumbs.royal.textContent = stage ? stage.where : 'Not posted yet';
    $('nothing').textContent = state.delivered.length ? '' : 'Nothing on the mat yet. It\'s on its way.';
  }

  // MARK: - A card, opened

  let openId = null;
  function fmtPostDate(t) { return Trip.fmtDate(t); }
  function openCard(id) {
    const card = Trip.cards.find((c) => c.id === id);
    if (!card || now() < card.t) return;
    const v = Voice.cards[id];
    openId = id;
    const seen = store.get('seen', []); if (!seen.includes(id)) { seen.push(id); store.set('seen', seen); }
    thumbs[id]?.classList.remove('unread');
    $('card').classList.remove('turned');
    $('tapme').textContent = 'tap to turn it over';
    // Front.
    const front = $('front'), rect = { w: Math.min(window.innerWidth * 0.92, 560) };
    const scale = dpr();
    front.width = Math.round(rect.w * scale); front.height = Math.round(rect.w * 2 / 3 * scale);
    Postcard.drawFront(front.getContext('2d'), front.width, front.height, { ...card, ...v }, cardLook(card));
    // Back paper.
    const paper = $('backpaper'); paper.width = front.width; paper.height = front.height;
    Postcard.drawPaper(paper.getContext('2d'), paper.width, paper.height, 'back' + id);
    // The message, with any P.S. it wrote after reading what you tapped last time.
    const msg = $('message'); msg.replaceChildren();
    for (const t of v.text) msg.append(h('p', {}, t));
    if (v.ps) msg.append(h('p', { class: 'ps' }, 'P.S. ' + v.ps));
    const answers = store.get('answers', {});
    for (const [prevId, byAnswer] of Object.entries(v.reactions || {})) {
      const a = answers[prevId];
      if (a && byAnswer[a]) msg.append(h('p', { class: 'ps' }, byAnswer[a]));
    }
    if (v.question) {
      const q = h('div', { class: 'question' }, h('div', { class: 'ask' }, v.question.ask));
      const chosen = answers[id];
      const row = h('div', { class: 'answers' });
      for (const ans of v.question.answers) {
        const b = h('button', { type: 'button' }, ans.label);
        if (chosen) { b.disabled = true; if (chosen === ans.key) b.classList.add('chosen'); }
        b.addEventListener('click', () => {
          const all = store.get('answers', {}); all[id] = ans.key; store.set('answers', all);
          for (const other of row.children) { other.disabled = true; other.classList.toggle('chosen', other === b); }
          say(["Noted.", "Right. Noted.", "Good. Writing that down.", "Thought so."][Math.floor(Math.random() * 4)]);
        });
        row.append(b);
      }
      q.append(row); msg.append(q);
    }
    // The address.
    $('address').replaceChildren(h('i', {}, 'To you'), h('i', {}, 'c/o a canal'), h('i', {}, card.where === 'gate' ? 'Schiphol, gate D' : 'Amsterdam'), h('i', {}, 'Abroad'));
    drawCorner(card);
    $('overlay').classList.remove('hidden');
  }
  function drawCorner(card) {
    const cc = $('cornercanvas'), box = $('corner');
    const w = Math.max(120, box.clientWidth || 200), hh = Math.max(120, box.clientHeight || 150);
    cc.width = Math.round(w * dpr()); cc.height = Math.round(hh * dpr());
    const ctx = cc.getContext('2d'); ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
    const signed = store.get('signed', {})[card.id];
    const posted = Trip.legs.find((l) => l.id === card.by);
    const postedTown = ['01', '02', '04'].includes(card.id) ? 'MANCHESTER' : 'AMSTERDAM';
    const layer = document.createElement('canvas'); layer.width = cc.width; layer.height = cc.height;
    const l = layer.getContext('2d'); l.setTransform(dpr(), 0, 0, dpr(), 0, 0);
    const sw = w * 0.5, sh = sw * 1.2;
    Postcard.drawStamp(l, w - sw - w * 0.06, hh * 0.06, sw, sh);
    Postcard.drawPostmark(l, w * 0.42, hh * 0.3, w * 0.26, postedTown, fmtPostDate(posted ? posted.t0 : card.t), 'pm' + card.id, -0.2);
    if (signed) Postcard.drawPostmark(l, w * 0.64, hh * 0.68, w * 0.22, card.where === 'gate' ? 'SCHIPHOL' : 'AMSTERDAM', fmtPostDate(signed), 'sg' + card.id, 0.18, 'rgb(27,73,101)');
    ctx.clearRect(0, 0, w, hh); ctx.drawImage(layer, 0, 0, w, hh);
    $('signhint').textContent = signed ? '' : 'press the stamp to sign for it';
  }
  $('corner').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!openId) return;
    const signed = store.get('signed', {});
    if (signed[openId]) return;
    signed[openId] = now(); store.set('signed', signed);
    const card = Trip.cards.find((c) => c.id === openId);
    drawCorner(card);
    say(["Signed for. That's official, that.", "There. Delivered and signed. Nobody can say it wasn't.", "Ta."][Math.floor(Math.random() * 3)]);
  });
  $('card').addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('.message')) return;
    const c = $('card'); c.classList.toggle('turned');
    $('tapme').textContent = c.classList.contains('turned') ? 'tap to turn it back' : 'tap to turn it over';
    if (c.classList.contains('turned')) setTimeout(() => drawCorner(Trip.cards.find((x) => x.id === openId)), 60);
  });
  $('close').addEventListener('click', () => { $('overlay').classList.add('hidden'); openId = null; if (location.hash) history.replaceState(null, '', location.pathname + location.search); });
  $('overlay').addEventListener('click', (e) => { if (e.target === $('overlay')) $('close').click(); });

  // MARK: - The clock

  let lastLeg = null, lastCount = -1;
  function tick() {
    const state = Trip.state(now());
    current = state;
    updateMap(state);
    updateTracker(state);
    if (state.delivered.length !== lastCount) { lastCount = state.delivered.length; updateShelf(state); }
    if (state.leg.id !== lastLeg) {
      lastLeg = state.leg.id;
      // A new leg: the bee says its first line about it unprompted.
      const deck = deckFor(state);
      if (deck.lines.length) { say(Voice.fill(deck.lines[0], context(state))); deck.i = 1; }
    } else if (thumbs.royal) {
      const stage = Trip.royalMail.stages.filter((s) => now() >= s.at).pop();
      thumbs.royal.textContent = stage ? stage.where : 'Not posted yet';
    }
  }

  // MARK: - The door: install, allow the buzz, send it on.

  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const canPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  function show(step) {
    for (const s of ['install', 'buzz', 'send', 'ready']) $('step-' + s).classList.toggle('hidden', s !== step);
    document.body.classList.toggle('setup-first', step !== 'ready');
    document.querySelector('section.setup').classList.toggle('hidden', step === 'ready');
  }
  async function setup() {
    if (!('serviceWorker' in navigator)) { show('ready'); return; }
    let reg;
    try { reg = await navigator.serviceWorker.register('sw.js'); } catch { show('install'); return; }
    if (!canPush || (isIOS && !standalone)) { show('install'); return; }
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      if (store.get('sent') === existing.endpoint) show('ready');
      else { $('sub').value = JSON.stringify(existing); show('send'); }
      return;
    }
    if (Notification.permission === 'denied') { show('ready'); return; }
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
    } catch (e) { $('allow-hint').textContent = 'Hm. ' + (e && e.message ? e.message : e); $('allow').disabled = false; }
  });
  $('share').addEventListener('click', async () => {
    const text = $('sub').value;
    try {
      if (navigator.share) await navigator.share({ title: 'Bee Post', text });
      else { await navigator.clipboard.writeText(text); $('share-hint').textContent = 'Copied. Paste it into a message.'; }
      store.set('sent', JSON.parse(text).endpoint);
      setTimeout(() => show('ready'), 800);
    } catch { $('share-hint').textContent = 'Long-press the box above to copy it instead.'; }
  });

  // MARK: - Go

  async function start() {
    try { await document.fonts.load('20px Caveat'); } catch {}
    await buildMap();
    tick();
    setInterval(tick, 1000);
    setup();
    // Opened from the buzz, or with something new on the mat: open it.
    const fromHash = location.hash.replace('#', '');
    const state = Trip.state(now());
    const unseen = state.delivered.filter((c) => !store.get('seen', []).includes(c.id)).pop();
    const target = fromHash && Trip.cards.find((c) => c.id === fromHash) ? fromHash : unseen ? unseen.id : null;
    if (target) setTimeout(() => { openCard(target); if (params.has('turned')) $('card').classList.add('turned'); }, 700);
  }
  window.addEventListener('hashchange', () => { const id = location.hash.replace('#', ''); if (id) openCard(id); });
  start();
})();
