// The trip: where the bee is at any moment, and what it looks like there.
//
// Every leg is a real timetable — KL1036 leaves Terminal 2 at 17:25, the 11:04
// from St Pancras goes under the sea at about 11:55 — and the legs run end to
// end, so the bee is one bee in one place. `check()` insists on that, the way
// Carnet's ContentTests insisted its legs did not overlap: a bee that left
// Manchester before it had got back there would be found by the test rather
// than by somebody watching the map.
//
// Times are ISO with a Z. The phone shows them in Amsterdam time.
const Trip = (() => {
  const T = (s) => Date.parse(s);

  const places = {
    manchester:  { name: 'Manchester',            lat: 53.4808, lon: -2.2426 },
    hive:        { name: 'a hedge off the A6',    lat: 53.42,   lon: -2.19 },
    manAirport:  { name: 'Manchester Airport',    lat: 53.3650, lon: -2.2727 },
    piccadilly:  { name: 'Manchester Piccadilly', lat: 53.4773, lon: -2.2309 },
    stoke:       { name: 'Stoke',                 lat: 53.0080, lon: -2.1810 },
    milton:      { name: 'Milton Keynes',         lat: 52.0340, lon: -0.7740 },
    euston:      { name: 'London Euston',         lat: 51.5282, lon: -0.1337 },
    stPancras:   { name: 'St Pancras',            lat: 51.5320, lon: -0.1263 },
    ashford:     { name: 'Ashford',               lat: 51.1430, lon: 0.8760 },
    folkestone:  { name: 'Folkestone',            lat: 51.0970, lon: 1.1220 },
    midChannel:  { name: 'under the Channel',     lat: 51.0200, lon: 1.4600 },
    calais:      { name: 'Calais',                lat: 50.9600, lon: 1.8100 },
    lille:       { name: 'Lille',                 lat: 50.6390, lon: 3.0750 },
    brussels:    { name: 'Brussels',              lat: 50.8360, lon: 4.3360 },
    antwerp:     { name: 'Antwerp',               lat: 51.2170, lon: 4.4210 },
    rotterdam:   { name: 'Rotterdam',             lat: 51.9250, lon: 4.4690 },
    schiphol:    { name: 'Schiphol',              lat: 52.3105, lon: 4.7683 },
    centraal:    { name: 'Amsterdam Centraal',    lat: 52.3791, lon: 4.9003 },
    ijFerry:     { name: 'the IJ ferry',          lat: 52.3835, lon: 4.9010 },
    vondelpark:  { name: 'the Vondelpark',        lat: 52.3580, lon: 4.8686 },
    beeHotel:    { name: 'a bee hotel',           lat: 52.3600, lon: 4.8720 },
    bloemenmarkt:{ name: 'the Bloemenmarkt',      lat: 52.3668, lon: 4.8912 },
    hotelDoor:   { name: 'your door',             lat: 52.3730, lon: 4.8930 },
    gate:        { name: 'the gate',              lat: 52.3105, lon: 4.7683 },
    // The sea, for saying where it is.
    theWash:     { name: 'the Wash',              lat: 52.95,   lon: 0.30 },
    skegness:    { name: 'Skegness',              lat: 53.14,   lon: 0.34 },
    grimsby:     { name: 'Grimsby',               lat: 53.57,   lon: -0.08 },
    hull:        { name: 'Hull',                  lat: 53.74,   lon: -0.33 },
    lincoln:     { name: 'Lincoln',               lat: 53.23,   lon: -0.54 },
    sheffield:   { name: 'Sheffield',             lat: 53.38,   lon: -1.47 },
    peaks:       { name: 'the Peaks',             lat: 53.35,   lon: -1.80 },
    ijmuiden:    { name: 'IJmuiden',              lat: 52.46,   lon: 4.61 },
    haarlem:     { name: 'Haarlem',               lat: 52.38,   lon: 4.64 },
    seaMid:      { name: 'the middle of the North Sea', lat: 52.85, lon: 2.40 },
    dutchCoast:  { name: 'the Dutch coast',       lat: 52.45,   lon: 4.35 },
  };

  // Legs, end to end. `via` is the path drawn; `at` is a list of fractions
  // for the waypoints when the run is not even (a train that dawdles into
  // London, a tunnel that is a fifth of the journey).
  const legs = [
    { id: 'wing-out', mode: 'wing', label: 'Under its own steam',
      from: 'manchester', to: 'centraal', departs: '2026-09-16T07:00:00Z', arrives: '2026-09-17T05:30:00Z',
      via: ['manchester', 'centraal'], weary: [0.05, 1], plump: [0.80, 0.16] },
    { id: 'thu-centraal', mode: 'wander', label: 'Watching the trams',
      from: 'centraal', to: 'centraal', departs: '2026-09-17T05:30:00Z', arrives: '2026-09-17T09:30:00Z',
      via: ['centraal', 'ijFerry', 'centraal', 'ijFerry', 'centraal'], weary: [1, 0.3], plump: [0.16, 0.26] },
    { id: 'thu-to-schiphol', mode: 'train', label: 'The train to Schiphol',
      from: 'centraal', to: 'schiphol', departs: '2026-09-17T09:30:00Z', arrives: '2026-09-17T09:50:00Z',
      via: ['centraal', 'schiphol'], weary: [0.3, 0.25], plump: [0.26, 0.26] },
    { id: 'thu-wait-ams', mode: 'wait', label: 'Schiphol, gate D',
      from: 'schiphol', to: 'schiphol', departs: '2026-09-17T09:50:00Z', arrives: '2026-09-17T10:50:00Z',
      via: ['schiphol'], weary: [0.25, 0.18], plump: [0.26, 0.30] },
    { id: 'kl1033', mode: 'plane', label: 'KL1033, Amsterdam to Manchester',
      from: 'schiphol', to: 'manAirport', departs: '2026-09-17T10:50:00Z', arrives: '2026-09-17T11:50:00Z',
      via: ['schiphol', 'manAirport'], weary: [0.18, 0.12], plump: [0.30, 0.30] },
    { id: 'thu-home', mode: 'home', label: 'Home for its dinner',
      from: 'manAirport', to: 'manAirport', departs: '2026-09-17T11:50:00Z', arrives: '2026-09-17T16:25:00Z',
      via: ['manAirport', 'hive', 'manAirport'], weary: [0.12, 0.08], plump: [0.30, 0.42] },
    { id: 'kl1036', mode: 'plane', label: 'KL1036, Manchester to Amsterdam',
      from: 'manAirport', to: 'schiphol', departs: '2026-09-17T16:25:00Z', arrives: '2026-09-17T17:45:00Z',
      via: ['manAirport', 'schiphol'], weary: [0.08, 0.12], plump: [0.42, 0.48] },
    { id: 'thu-into-town', mode: 'train', label: 'The train into town',
      from: 'schiphol', to: 'centraal', departs: '2026-09-17T17:55:00Z', arrives: '2026-09-17T18:12:00Z',
      via: ['schiphol', 'centraal'], weary: [0.12, 0.15], plump: [0.48, 0.48] },
    { id: 'thu-deliver', mode: 'wander', label: 'Finding your door',
      from: 'centraal', to: 'hotelDoor', departs: '2026-09-17T18:12:00Z', arrives: '2026-09-17T18:15:00Z',
      via: ['centraal', 'hotelDoor'], weary: [0.15, 0.15], plump: [0.48, 0.48] },
    { id: 'thu-sleep', mode: 'sleep', label: 'A bee hotel, in a park',
      from: 'hotelDoor', to: 'beeHotel', departs: '2026-09-17T18:15:00Z', arrives: '2026-09-18T03:45:00Z',
      via: ['hotelDoor', 'beeHotel'], weary: [0.4, 0.02], plump: [0.48, 0.50] },
    { id: 'fri-under-door', mode: 'wander', label: 'Under the door, quietly',
      from: 'beeHotel', to: 'hotelDoor', departs: '2026-09-18T03:45:00Z', arrives: '2026-09-18T04:00:00Z',
      via: ['beeHotel', 'hotelDoor'], weary: [0.02, 0.05], plump: [0.50, 0.50] },
    { id: 'fri-to-schiphol', mode: 'train', label: 'The first train to Schiphol',
      from: 'hotelDoor', to: 'schiphol', departs: '2026-09-18T04:00:00Z', arrives: '2026-09-18T04:35:00Z',
      via: ['hotelDoor', 'centraal', 'schiphol'], weary: [0.05, 0.08], plump: [0.50, 0.50] },
    { id: 'fri-wait-ams', mode: 'wait', label: 'Schiphol, early',
      from: 'schiphol', to: 'schiphol', departs: '2026-09-18T04:35:00Z', arrives: '2026-09-18T06:00:00Z',
      via: ['schiphol'], weary: [0.08, 0.1], plump: [0.50, 0.56] },
    { id: 'kl1029', mode: 'plane', label: 'KL1029, Amsterdam to Manchester',
      from: 'schiphol', to: 'manAirport', departs: '2026-09-18T06:00:00Z', arrives: '2026-09-18T07:00:00Z',
      via: ['schiphol', 'manAirport'], weary: [0.1, 0.1], plump: [0.56, 0.56] },
    { id: 'fri-airport-train', mode: 'train', label: 'Airport to Piccadilly',
      from: 'manAirport', to: 'piccadilly', departs: '2026-09-18T07:10:00Z', arrives: '2026-09-18T07:30:00Z',
      via: ['manAirport', 'piccadilly'], weary: [0.1, 0.12], plump: [0.56, 0.56] },
    { id: 'avanti', mode: 'train', label: 'The 08:35 to Euston',
      from: 'piccadilly', to: 'euston', departs: '2026-09-18T07:35:00Z', arrives: '2026-09-18T09:45:00Z',
      via: ['piccadilly', 'stoke', 'milton', 'euston'], at: [0, 0.27, 0.72, 1], weary: [0.1, 0.15], plump: [0.56, 0.56] },
    { id: 'fri-walk', mode: 'walk', label: 'Round the corner to St Pancras',
      from: 'euston', to: 'stPancras', departs: '2026-09-18T09:45:00Z', arrives: '2026-09-18T09:55:00Z',
      via: ['euston', 'stPancras'], weary: [0.15, 0.15], plump: [0.56, 0.56] },
    { id: 'eurostar', mode: 'eurostar', label: 'The 11:04 to Amsterdam',
      from: 'stPancras', to: 'centraal', departs: '2026-09-18T10:04:00Z', arrives: '2026-09-18T14:20:00Z',
      via: ['stPancras', 'ashford', 'folkestone', 'midChannel', 'calais', 'lille', 'brussels', 'antwerp', 'rotterdam', 'centraal'],
      at: [0, 0.14, 0.19, 0.24, 0.29, 0.36, 0.48, 0.62, 0.82, 1], weary: [0.12, 0.2], plump: [0.56, 0.56] },
    { id: 'fri-town', mode: 'wander', label: 'The flower market, and the ferry again',
      from: 'centraal', to: 'bloemenmarkt', departs: '2026-09-18T14:20:00Z', arrives: '2026-09-18T17:30:00Z',
      via: ['centraal', 'hotelDoor', 'bloemenmarkt', 'ijFerry', 'bloemenmarkt'], weary: [0.2, 0.55], plump: [0.56, 0.66] },
    { id: 'fri-sleep', mode: 'sleep', label: 'The bee hotel, again',
      from: 'bloemenmarkt', to: 'beeHotel', departs: '2026-09-18T17:30:00Z', arrives: '2026-09-19T05:30:00Z',
      via: ['bloemenmarkt', 'beeHotel'], weary: [0.6, 0.02], plump: [0.66, 0.68] },
    { id: 'sat-deliver', mode: 'wander', label: 'Hand delivered',
      from: 'beeHotel', to: 'hotelDoor', departs: '2026-09-19T05:30:00Z', arrives: '2026-09-19T07:30:00Z',
      via: ['beeHotel', 'vondelpark', 'hotelDoor'], weary: [0.02, 0.1], plump: [0.68, 0.72] },
    { id: 'sat-morning', mode: 'wander', label: 'One more go on the ferry',
      from: 'hotelDoor', to: 'hotelDoor', departs: '2026-09-19T07:30:00Z', arrives: '2026-09-19T10:30:00Z',
      via: ['hotelDoor', 'ijFerry', 'centraal', 'hotelDoor'], weary: [0.1, 0.18], plump: [0.72, 0.76] },
    { id: 'sat-bag-train', mode: 'bag', label: 'In the bag, on the train to Schiphol',
      from: 'hotelDoor', to: 'gate', departs: '2026-09-19T10:30:00Z', arrives: '2026-09-19T11:10:00Z',
      via: ['hotelDoor', 'centraal', 'gate'], weary: [0.18, 0.18], plump: [0.76, 0.76] },
    { id: 'sat-gate', mode: 'bag', label: 'In the bag, at the gate',
      from: 'gate', to: 'gate', departs: '2026-09-19T11:10:00Z', arrives: '2026-09-19T12:50:00Z',
      via: ['gate'], weary: [0.2, 0.15], plump: [0.76, 0.78] },
    { id: 'ezy2166', mode: 'plane', label: 'EZY2166, Amsterdam to Manchester', inTheBag: true,
      from: 'gate', to: 'manAirport', departs: '2026-09-19T12:50:00Z', arrives: '2026-09-19T14:10:00Z',
      via: ['gate', 'manAirport'], weary: [0.15, 0.12], plump: [0.78, 0.78] },
    { id: 'home', mode: 'home', label: 'Back in the hedge',
      from: 'manAirport', to: 'hive', departs: '2026-09-19T14:10:00Z', arrives: '2026-12-31T00:00:00Z',
      via: ['manAirport', 'hive'], at: [0, 0.002], weary: [0.12, 0.05], plump: [0.78, 0.80] },
  ].map((l) => ({ ...l, t0: T(l.departs), t1: T(l.arrives) }));

  // What it has picked up, and from when. It arrived still wearing Nice.
  const souvenirs = [
    { from: '2026-01-01T00:00:00Z', souvenir: 'sunglasses' },
    { from: '2026-09-17T17:45:00Z', souvenir: 'stroopwafel' },   // Schiphol, off the KLM
    { from: '2026-09-18T16:00:00Z', souvenir: 'tulip' },         // the Bloemenmarkt
  ].map((s) => ({ ...s, t: T(s.from) }));

  // The cards. `deliveredAt` is when it is on the mat; `buzzAt` when the phone
  // is told, if that is later (one went under the door at six).
  const cards = [
    { id: '01', deliveredAt: '2026-09-17T05:30:00Z', by: 'wing-out', where: 'centraal',
      title: 'Post.', body: 'It\'s at Centraal. It came the whole way on its own.' },
    { id: '02', deliveredAt: '2026-09-17T18:15:00Z', by: 'kl1036', where: 'hotelDoor',
      title: 'Post.', body: 'Something\'s been delivered. It came on the 17:25 from Terminal 2.' },
    { id: '03', deliveredAt: '2026-09-18T04:00:00Z', buzzAt: '2026-09-18T05:30:00Z', by: 'thu-sleep', where: 'hotelDoor',
      title: 'Post.', body: 'There\'s something under the door. It\'s been there since six.' },
    { id: '04', deliveredAt: '2026-09-18T14:20:00Z', by: 'eurostar', where: 'centraal',
      title: 'Post.', body: 'Delivered. It came under the sea. In a train.' },
    { id: '05', deliveredAt: '2026-09-19T07:30:00Z', by: 'sat-deliver', where: 'hotelDoor',
      title: 'Post.', body: 'One more. Hand delivered — it never went home.' },
    { id: '06', deliveredAt: '2026-09-19T12:05:00Z', by: 'sat-gate', where: 'gate',
      title: 'Post.', body: 'Last one. Don\'t check the bag.' },
  ].map((c) => ({ ...c, t: T(c.deliveredAt), tBuzz: T(c.buzzAt || c.deliveredAt) }));

  // The one that went by Royal Mail. Tracker only; it is not in the buzz.
  const royalMail = {
    posted: T('2026-09-16T21:00:00Z'),
    stages: [
      { at: T('2026-09-16T21:00:00Z'), where: 'In the box on the corner' },
      { at: T('2026-09-17T06:30:00Z'), where: 'Collected. Manchester Mail Centre' },
      { at: T('2026-09-17T22:00:00Z'), where: 'Heathrow Worldwide Distribution Centre' },
      { at: T('2026-09-19T04:00:00Z'), where: 'Left the UK' },
      { at: T('2026-09-21T06:00:00Z'), where: 'PostNL, Amsterdam' },
      { at: T('2026-09-22T09:00:00Z'), where: 'Delivered. To a flat with nobody in it.' },
    ],
  };

  // MARK: - Geometry

  const R = 6371;
  const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI;
  function haversine(a, b) {
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function along(a, b, f) {
    if (a.lat === b.lat && a.lon === b.lon) return { lat: a.lat, lon: a.lon };
    const φ1 = rad(a.lat), λ1 = rad(a.lon), φ2 = rad(b.lat), λ2 = rad(b.lon);
    const δ = haversine(a, b) / R;
    const A = Math.sin((1 - f) * δ) / Math.sin(δ), B = Math.sin(f * δ) / Math.sin(δ);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    return { lat: deg(Math.atan2(z, Math.sqrt(x * x + y * y))), lon: deg(Math.atan2(y, x)) };
  }
  function bearing(a, b) {
    const φ1 = rad(a.lat), φ2 = rad(b.lat), dλ = rad(b.lon - a.lon);
    const y = Math.sin(dλ) * Math.cos(φ2), x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
    return (deg(Math.atan2(y, x)) + 360) % 360;
  }

  /// Where along a leg's path the bee is at fraction `f` of its time.
  function positionOn(leg, f) {
    const pts = leg.via.map((k) => places[k]);
    if (pts.length === 1) return { ...pts[0], heading: 90 };
    const at = leg.at || pts.map((_, i) => i / (pts.length - 1));
    let i = 0; while (i < at.length - 2 && f > at[i + 1]) i++;
    const seg = (f - at[i]) / Math.max(1e-9, at[i + 1] - at[i]);
    const p = along(pts[i], pts[i + 1], Math.min(1, Math.max(0, seg)));
    return { ...p, heading: bearing(pts[i], pts[i + 1]), segment: i, segmentFraction: seg };
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  /// Everything about the bee at instant `now`.
  function state(now) {
    // Between legs — off a plane, not yet on the train — it waits where it
    // landed rather than falling through to the last leg of all, which is
    // home, and had it in the hedge for ten minutes at a time.
    let leg = legs.find((l) => now >= l.t0 && now < l.t1);
    let waiting = false;
    if (!leg) {
      if (now < legs[0].t0) leg = legs[0];
      else { leg = [...legs].reverse().find((l) => now >= l.t1) || legs[legs.length - 1]; waiting = leg.t1 <= now && leg !== legs[legs.length - 1]; }
    }
    const f = waiting ? 1 : clamp01((now - leg.t0) / (leg.t1 - leg.t0));
    const pos = positionOn(leg, f);
    const souvenir = souvenirs.filter((s) => now >= s.t).pop()?.souvenir || null;
    // The sun it caught in Provence, going off it slowly. Manchester is not helping.
    const tan = clamp01(0.55 - (now - T('2026-09-10T00:00:00Z')) / 86400000 * 0.02);
    const look = { souvenir, plumpness: clamp01(lerp(leg.plump[0], leg.plump[1], f)), weariness: clamp01(lerp(leg.weary[0], leg.weary[1], f)), tan };
    const delivered = cards.filter((c) => now >= c.t);
    const justDelivered = delivered.find((c) => now - c.t < 20 * 60 * 1000);
    const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/Amsterdam' }).format(new Date(now)));
    const mood = leg.mode === 'sleep' ? 'sleepy' : justDelivered ? 'delighted' : (hour >= 23 || hour < 6) ? 'sleepy' : 'cheerful';
    const fromHome = haversine(places.manchester, pos);
    return { now, leg, f, pos, look, mood, delivered, justDelivered, fromHome, waiting,
      next: legs[legs.indexOf(leg) + 1] || null, done: now >= legs[legs.length - 1].t0 };
  }

  /// The nearest named thing, for saying where it is.
  function nearest(pos, within = 45) {
    let best = null, bd = Infinity;
    for (const [k, p] of Object.entries(places)) {
      const d = haversine(pos, p);
      if (d < bd) { bd = d; best = { key: k, ...p, distance: d }; }
    }
    return bd <= within ? best : null;
  }

  /// Fails loudly if the bee would have to be in two places at once.
  function check() {
    const problems = [];
    for (let i = 0; i < legs.length; i++) {
      const l = legs[i];
      if (!(l.t1 > l.t0)) problems.push(`${l.id}: arrives before it departs`);
      if (l.via[0] !== l.from || l.via[l.via.length - 1] !== l.to) problems.push(`${l.id}: via does not run from ${l.from} to ${l.to}`);
      for (const k of l.via) if (!places[k]) problems.push(`${l.id}: unknown place ${k}`);
      if (i > 0) {
        const p = legs[i - 1];
        if (l.t0 < p.t1) problems.push(`${l.id} departs ${l.departs} before ${p.id} arrives ${p.arrives}`);
        if (l.from !== p.to && !(l.inTheBag)) problems.push(`${l.id} starts at ${l.from} but ${p.id} ended at ${p.to}`);
      }
    }
    for (const c of cards) {
      const s = state(c.t);
      const there = s.leg.to === c.where || s.leg.from === c.where || s.leg.via.includes(c.where);
      if (!there) problems.push(`card ${c.id} delivered at ${c.where} but the bee is on ${s.leg.id} (${s.leg.from}→${s.leg.to})`);
      if (c.tBuzz < c.t) problems.push(`card ${c.id} buzzes before it is delivered`);
    }
    return problems;
  }

  const fmtTime = (t, tz = 'Europe/Amsterdam') => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date(t));
  const fmtDay = (t, tz = 'Europe/Amsterdam') => new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: tz }).format(new Date(t));
  const fmtDate = (t, tz = 'Europe/Amsterdam') => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: '2-digit', timeZone: tz }).format(new Date(t)).toUpperCase();

  return { places, legs, cards, souvenirs, royalMail, state, nearest, check, haversine, along, bearing, positionOn, fmtTime, fmtDay, fmtDate, T };
})();
if (typeof module !== 'undefined') module.exports = Trip;
