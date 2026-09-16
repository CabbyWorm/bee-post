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
    region: { lonMin: 4.70, lonMax: 4.99, latMin: 52.285, latMax: 52.425 },
    city: { lonMin: 4.845, lonMax: 4.954, latMin: 52.352, latMax: 52.392 },
  };
  const CITY = new Set(['centraal', 'ijFerry', 'vondelpark', 'beeHotel', 'bloemenmarkt', 'hotelDoor']);
  const REGION = new Set([...CITY, 'schiphol', 'gate']);
  let sheet = 'sea';
  const proj = (p, s = SHEETS[sheet]) => {
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

  function label(key, anchor, text) {
    const [x, y] = proj(Trip.places[key]);
    el('circle', { cx: x, cy: y, r: 3, fill: '#2E2924' }, layers.places);
    const t = el('text', { x: x + (anchor === 'end' ? -7 : 7), y: y + 4, 'font-size': 12, 'text-anchor': anchor, fill: '#2E2924', 'font-family': 'inherit' }, layers.places);
    t.textContent = text;
  }

  /// Amsterdam, sketched: the IJ across the top, the canal ring, the Amstel.
  function drawAmsterdam(s) {
    el('rect', { x: 0, y: 0, width: W, height: H, fill: '#F6F1E5' }, layers.land);
    const bank = [[4.70, 52.407], [4.78, 52.402], [4.845, 52.392], [4.86, 52.388], [4.89, 52.383], [4.905, 52.3815], [4.94, 52.380], [4.99, 52.386]];
    const far = [[4.99, 52.402], [4.94, 52.398], [4.905, 52.397], [4.89, 52.400], [4.86, 52.404], [4.845, 52.408], [4.78, 52.418], [4.70, 52.422]];
    const ij = bank.map(([lon, lat]) => proj({ lat, lon }).join(',')), ijb = far.map(([lon, lat]) => proj({ lat, lon }).join(','));
    el('path', { d: 'M' + ij.join('L') + 'L' + ijb.join('L') + 'Z', fill: '#C9D6D3', stroke: '#6B635A', 'stroke-width': 1 }, layers.water);
    const [cx, cy] = proj(Trip.places.centraal);
    const kmY = H / ((s.latMax - s.latMin) * 111);
    const kmX = W / ((s.lonMax - s.lonMin) * 111 * Math.cos(52.37 * Math.PI / 180));
    const wide = sheet === 'city';
    for (const rkm of [0.55, 0.75, 0.93, 1.1]) {
      const rx = rkm * kmX, ry = rkm * kmY;
      el('path', { d: `M${cx - rx},${cy + ry * 0.12} A${rx},${ry} 0 0 0 ${cx + rx},${cy + ry * 0.12}`, fill: 'none', stroke: '#9DB3B4', 'stroke-width': wide ? 4 : 2.2 }, layers.water);
    }
    // The Singel is nearest; the ring's spokes, a few of them.
    if (wide) {
      for (const a of [-155, -125, -95, -65, -35]) {
        const r0 = 0.55, r1 = 1.1, th = a * Math.PI / 180;
        el('path', { d: `M${cx + Math.cos(th) * r0 * kmX},${cy + ry(r0) - Math.sin(th) * r0 * kmY} L${cx + Math.cos(th) * r1 * kmX},${cy + ry(r1) - Math.sin(th) * r1 * kmY}`, fill: 'none', stroke: '#9DB3B4', 'stroke-width': 2.5 }, layers.water);
      }
      function ry(r) { return r * kmY * 0.12; }
    }
    const amstel = [[4.9005, 52.3665], [4.902, 52.358], [4.906, 52.345], [4.905, 52.33], [4.91, 52.30]].map(([lon, lat]) => proj({ lat, lon }).join(','));
    el('path', { d: 'M' + amstel.join('L'), fill: 'none', stroke: '#9DB3B4', 'stroke-width': wide ? 4 : 2.4, 'stroke-linecap': 'round' }, layers.water);
    // The Vondelpark, which is the bee's kind of place.
    const [vx, vy] = proj(Trip.places.vondelpark);
    el('ellipse', { cx: vx, cy: vy, rx: 0.75 * kmX, ry: 0.2 * kmY, fill: '#D5DCC4', stroke: '#9DAA88', 'stroke-width': 1, transform: `rotate(-20 ${vx} ${vy})` }, layers.water);
  }

  function drawSheet() {
    for (const g of Object.values(layers)) if (g.firstChild !== undefined) while (g.firstChild) g.removeChild(g.firstChild);
    if (sheet === 'sea') {
      const land = el('g', { fill: '#F6F1E5', stroke: '#6B635A', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, layers.land);
      if (outlines) {
        for (const ring of outlines.britain) el('path', { d: 'M' + ring.map(([lon, lat]) => proj({ lat, lon }).join(',')).join('L') + 'Z' }, land);
        const c = outlines.continent.map(([lon, lat]) => proj({ lat, lon }).join(','));
        el('path', { d: 'M' + c.join('L') + `L${W},${H}L${c[0].split(',')[0]},${H}Z` }, land);
      }
      label('manchester', 'end', 'Manchester'); label('centraal', 'start', 'Amsterdam'); label('stPancras', 'end', 'London');
    } else if (sheet === 'region') {
      drawAmsterdam(SHEETS.region);
      label('centraal', 'start', 'Centraal'); label('schiphol', 'start', 'Schiphol'); label('vondelpark', 'end', 'Vondelpark');
    } else {
      drawAmsterdam(SHEETS.city);
      label('centraal', 'start', 'Centraal'); label('ijFerry', 'start', 'the ferry'); label('hotelDoor', 'start', 'your door');
      label('bloemenmarkt', 'start', 'Bloemenmarkt'); label('vondelpark', 'end', 'Vondelpark'); label('beeHotel', 'end', 'bee hotel');
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
    const wantSheet = leg.via.every((k) => CITY.has(k)) ? 'city' : leg.via.every((k) => REGION.has(k)) ? 'region' : 'sea';
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
      if (sheet === 'sea' && (leg.mode === 'eurostar' || leg.mode === 'train') && leg.via.length > 2) {
        for (const k of leg.via.slice(1, -1)) {
          const p = Trip.places[k], [x, y] = proj(p);
          if (k === 'midChannel') continue;
          el('circle', { cx: x, cy: y, r: 2, fill: '#6B635A' }, layers.route);
          const t = el('text', { x: x + 4, y: y - 4, 'font-size': 9, fill: '#6B635A', 'font-family': 'inherit' }, layers.route);
          t.textContent = p.name.replace('London ', '');
        }
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
  Bee.animate($('bee'), () => current ? { look: current.look, mood: current.mood, talking, asleep: current.leg.mode === 'sleep' && !talking } : {});
  let bagDrawn = false;
  function showCreature(state) {
    const inBag = !!(state.leg.mode === 'bag' || state.leg.inTheBag);
    $('bee').classList.toggle('hidden', inBag);
    $('bag').classList.toggle('hidden', !inBag);
    $('zzz').classList.toggle('hidden', state.leg.mode !== 'sleep');
    if (inBag && !bagDrawn) {
      const c = $('bag'), d = dpr(); c.width = 268 * d; c.height = 200 * d;
      const ctx = c.getContext('2d'); ctx.scale(d, d);
      Postcard.scenes.bag(ctx, 268, 200);
      bagDrawn = true;
    }
  }

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
      const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/Amsterdam' }).format(new Date(state.now)));
      const slot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : hour < 23 ? 'evening' : 'night';
      const hourLine = state.leg.mode === 'sleep' || state.leg.mode === 'wing' || state.leg.mode === 'plane' ? [] : shuffle(Voice.hours[slot], key + day + 'h').slice(0, 1);
      const rest = shuffle([...shuffle(Voice.general, key + day).slice(0, 2), ...shuffle(Voice.remembering, key + day + 'r').slice(0, state.leg.mode === 'wander' || state.leg.mode === 'sleep' ? 2 : 1), ...shuffle(Voice.facts, key + day + 'f').slice(0, 1), ...hourLine], key + day + 'x');
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
    const near = Trip.nearest(state.pos, sheet === 'sea' ? 60 : 3);
    return {
      fromHome: state.fromHome,
      where: near ? near.name : (state.leg.mode === 'wing' || state.leg.mode === 'plane' ? 'the North Sea' : 'here'),
      manc: weather.home ? `${weather.home.temp} degrees and ${weather.home.sky}` : 'overcast, probably spitting',
      here: weather.here ? `${weather.here.temp} degrees and ${weather.here.sky}` : 'better than that',
      wind: windRelative(state) || 'wherever it likes',
    };
  }
  let audio = null;
  function buzz() {
    if (!store.get('buzz', true)) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const t = audio.currentTime;
      const o = audio.createOscillator(), g = audio.createGain(), lp = audio.createBiquadFilter(), trem = audio.createOscillator(), tg = audio.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(185, t); o.frequency.linearRampToValueAtTime(235, t + 0.1); o.frequency.linearRampToValueAtTime(175, t + 0.3);
      lp.type = 'lowpass'; lp.frequency.value = 900;
      trem.frequency.value = 26; tg.gain.value = 0.4; trem.connect(tg); tg.connect(g.gain);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(lp); lp.connect(g); g.connect(audio.destination);
      o.start(t); trem.start(t); o.stop(t + 0.34); trem.stop(t + 0.34);
    } catch {}
  }
  $('mute').addEventListener('click', () => { const on = !store.get('buzz', true); store.set('buzz', on); $('mute').textContent = on ? 'buzzing: on' : 'buzzing: off'; if (on) buzz(); });
  $('mute').textContent = store.get('buzz', true) ? 'buzzing: on' : 'buzzing: off';

  function sayTheNextThing() {
    if (!current) return;
    buzz();
    const deck = deckFor(current);
    if (!deck.lines.length) return;
    say(Voice.fill(deck.lines[deck.i % deck.lines.length], context(current)));
    deck.i++;
  }
  $('bee').addEventListener('click', sayTheNextThing);

  // MARK: - Weather

  // The one lookup in the whole thing, and it is not a recommendation: a bee
  // over the North Sea is allowed to know which way the wind is, and a bee
  // from Manchester is allowed to know whether it is raining there.
  const weather = { here: null, home: null, at: 0, forSheet: null };
  const describe = (c) => {
    if (!c) return null;
    const code = c.weather_code, rain = c.precipitation || 0;
    const sky = code >= 95 ? 'thunder' : code >= 80 ? 'showers' : code >= 71 ? 'snow' : code >= 61 ? 'raining' : code >= 51 ? 'spitting' : code >= 45 ? 'fog' : code >= 3 ? 'overcast' : code >= 1 ? 'a bit of cloud' : 'clear';
    return { sky, temp: Math.round(c.temperature_2m), wind: Math.round(c.wind_speed_10m), from: c.wind_direction_10m, rain };
  };
  const compass = (d) => ['the north', 'the north-east', 'the east', 'the south-east', 'the south', 'the south-west', 'the west', 'the north-west'][Math.round(((d % 360) + 360) % 360 / 45) % 8];
  async function fetchWeather(state) {
    const q = (p) => `latitude=${p.lat.toFixed(2)}&longitude=${p.lon.toFixed(2)}&current=temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code&wind_speed_unit=kmh`;
    try {
      const [a, b] = await Promise.all([fetch(`https://api.open-meteo.com/v1/forecast?${q(state.pos)}`), fetch(`https://api.open-meteo.com/v1/forecast?${q(Trip.places.manchester)}`)]);
      weather.here = describe((await a.json()).current); weather.home = describe((await b.json()).current);
      weather.at = Date.now(); weather.forSheet = sheet;
      renderWeather(state);
    } catch { /* no weather is fine; the bee has opinions anyway */ }
  }
  function renderWeather(state) {
    const w = $('weather');
    if (!weather.here || !weather.home) { w.textContent = ''; return; }
    const here = weather.here, home = weather.home;
    const whereName = sheet === 'sea' ? (state.leg.mode === 'home' ? 'Manchester' : 'Here') : 'Amsterdam';
    w.textContent = `${whereName} ${here.temp}°, ${here.sky}, wind ${here.wind} km/h from ${compass(here.from)} · Manchester ${home.temp}°, ${home.sky}`;
  }
  /// How the wind sits against the way the bee is going.
  function windRelative(state) {
    if (!weather.here) return null;
    const blowingTo = (weather.here.from + 180) % 360;
    const diff = Math.abs(((blowingTo - state.pos.heading + 540) % 360) - 180);
    return diff < 50 ? 'behind me, for once' : diff > 130 ? 'in my face. Typical.' : 'across me, which is worse';
  }

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
    const near = Trip.nearest(state.pos, sheet === 'sea' ? 60 : 3);
    const total = Trip.haversine(Trip.places[leg.from], Trip.places[leg.to]);
    let line = !near ? 'Over the North Sea' : near.key === 'midChannel' ? 'Under the Channel' : near.name.startsWith('the middle') ? 'In ' + near.name : `Near ${near.name}`;
    if (leg.mode === 'wing' || leg.mode === 'plane' || leg.mode === 'eurostar' || leg.mode === 'train') {
      const done = Math.round(total * state.f);
      line += ` · ${done} km done · ${Math.max(0, Math.round(total - done))} to go`;
    }
    if (leg.id === 'thu-centraal') line += ` · trams counted: ${Math.floor((state.now - leg.t0) / 80000)}`;
    if (leg.id === 'sat-morning' || leg.id === 'fri-town') line += ` · ferry crossings: ${Math.min(leg.id === 'fri-town' ? 3 : 2, Math.floor((state.now - leg.t0) / (25 * 60000)))}`;
    if (leg.id === 'eurostar' && state.pos.segment === 2) line += ' · fish seen: 0';
    $('said').textContent = line;
    const where = sheet !== 'sea' ? (near ? near.name : 'Amsterdam') : (near ? near.name : 'the North Sea');
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
      const how = { 'wing-out': 'own wings', kl1036: 'KL1036', 'thu-sleep': 'under the door', eurostar: 'under the sea', 'sat-deliver': 'by hand', 'sat-gate': 'from the bag' }[card.by] || '';
      const when = h('div', { class: 'when typed' }, `${Trip.fmtDay(card.t).slice(0, 3)} ${Trip.fmtTime(card.t)}${how ? ' · ' + how : ''}`);
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
    $('keep').classList.toggle('hidden', !state.delivered.length);
    const more = Trip.cards.some((c) => c.t > now());
    $('nothing').textContent = !state.delivered.length ? 'Nothing on the mat yet. It\'s on its way.' : more ? 'There\'s more coming. Not saying when.' : 'That\'s the lot.';
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
    try { if (navigator.clearAppBadge) navigator.clearAppBadge(); } catch {}
    document.body.classList.add('locked');
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
    say(['That one took some getting here.', 'Go on. Turn it over.', 'Other side.', 'Read the back. I wrote it small so it would fit.'][Number(id) % 4]);
  }
  function drawCorner(card) {
    const cc = $('cornercanvas'), box = $('corner');
    const w = Math.max(120, box.clientWidth || 200), hh = Math.max(120, box.clientHeight || 150);
    cc.width = Math.round(w * dpr()); cc.height = Math.round(hh * dpr());
    const ctx = cc.getContext('2d'); ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
    const signed = store.get('signed', {})[card.id] || (params.has('signed') ? now() : null);
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
  $('close').addEventListener('click', () => { $('overlay').classList.add('hidden'); document.body.classList.remove('locked'); openId = null; if (location.hash) history.replaceState(null, '', location.pathname + location.search); });
  $('overlay').addEventListener('click', (e) => { if (e.target === $('overlay')) $('close').click(); });

  // MARK: - Keeping them

  async function keepThem() {
    const state = Trip.state(now());
    if (!state.delivered.length) return;
    const btn = $('keep'); btn.disabled = true; btn.textContent = 'Drawing…';
    say('Hang on. Doing them all out neat.');
    await new Promise((r) => setTimeout(r, 50));
    try {
      const answers = store.get('answers', {}), signed = store.get('signed', {});
      const items = state.delivered.map((card) => {
        const posted = Trip.legs.find((l) => l.id === card.by);
        return { card, voice: Voice.cards[card.id], look: cardLook(card), opts: {
          answers, posted: fmtPostDate(posted ? posted.t0 : card.t), postedTown: ['01', '02', '04'].includes(card.id) ? 'MANCHESTER' : 'AMSTERDAM',
          signed: signed[card.id] ? fmtPostDate(signed[card.id]) : null,
          when: `${Trip.fmtDay(card.t)} ${Trip.fmtTime(card.t)}`.toUpperCase(),
        } };
      });
      const c = Postcard.memento(items, 'Amsterdam, September 2026');
      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
      const file = new File([blob], 'bee-post.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Bee Post' });
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bee-post.png'; a.click();
      }
      say('There. All of them. Keep them somewhere dry.');
    } catch (e) {
      if (!(e && e.name === 'AbortError')) say('Hm. That didn\'t work. Try again in a minute.');
    }
    btn.disabled = false; btn.textContent = 'Keep them';
  }
  $('keep').addEventListener('click', keepThem);

  // MARK: - The clock

  let lastLeg = null, lastCount = -1;
  function tick() {
    const state = Trip.state(now());
    current = state;
    if (Date.now() - weather.at > 20 * 60 * 1000 || (weather.forSheet && weather.forSheet !== sheet)) { weather.at = Date.now(); fetchWeather(state); }
    showCreature(state);
    updateMap(state);
    updateTracker(state);
    if (state.delivered.length !== lastCount) { lastCount = state.delivered.length; updateShelf(state); }
    // Something new on it gets a word, once.
    const souvenir = state.look.souvenir;
    if (souvenir && Voice.wearing[souvenir] && store.get('wearing') !== souvenir) {
      store.set('wearing', souvenir);
      say(Voice.wearing[souvenir]);
      lastLeg = state.leg.id;
    }
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
