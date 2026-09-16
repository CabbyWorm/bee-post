// The bee, drawn. A unit-for-unit port of Carnet's `BeeDrawing`, `BeeSouvenirs`
// and `BeeGlyph`, so the creature on this page is the same creature that came
// back from France — same proportions, same wingbeat, same cheeks — plus the
// two things it picks up in the Netherlands.
//
// Everything is a function of one clock (`phase`, in seconds), so there is no
// animation state to get out of step: wingbeat, bob, drift, blink and the sway
// of its legs all come off the same number.
const Bee = (() => {
  const rgb = (r, g, b) => [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const deg = (d) => d * Math.PI / 180;
  const clamp01 = (v) => Math.min(1, Math.max(0, v || 0));

  // `BeePalette`. Warm enough to sit on paper without looking like somebody
  // else's sticker.
  const P = {
    honey: rgb(0.96, 0.74, 0.20),
    honeyDeep: rgb(0.87, 0.57, 0.11),
    fur: rgb(0.99, 0.90, 0.68),
    stripe: rgb(0.20, 0.16, 0.13),
    wing: rgb(0.82, 0.90, 0.96),
    blush: rgb(0.95, 0.56, 0.52),
  };

  // Souvenir colours, from `BeeSouvenirs`, and the two Dutch ones.
  const S = {
    bronze: rgb(0.80, 0.62, 0.29), bronzeDeep: rgb(0.54, 0.38, 0.15), feather: rgb(0.98, 0.96, 0.90),
    wool: rgb(0.15, 0.19, 0.30), woolLit: rgb(0.24, 0.29, 0.42),
    stem: rgb(0.42, 0.53, 0.36), flower: rgb(0.56, 0.44, 0.78), flowerDeep: rgb(0.42, 0.31, 0.62),
    glass: rgb(0.11, 0.10, 0.13),
    // A stroopwafel: baked, then syruped.
    waffle: rgb(0.82, 0.58, 0.28), waffleDeep: rgb(0.55, 0.34, 0.13), syrup: rgb(0.40, 0.22, 0.08),
    // A wooden tulip off the Bloemenmarkt, painted the one colour they all are.
    tulip: rgb(0.80, 0.24, 0.18), tulipDeep: rgb(0.58, 0.14, 0.11), tulipLit: rgb(0.92, 0.42, 0.34),
  };

  const MOODS = {
    cheerful: { beat: 11, bob: 3.5, drift: 4.0 },
    delighted: { beat: 15, bob: 6.0, drift: 7.0 },
    sleepy: { beat: 6, bob: 2.0, drift: 1.5 },
  };

  // The unit box, where the bee sits in it, and the room it needs to wander.
  const UNIT = { w: 96, h: 106 };
  const CENTRE = { x: 9, y: -13 };
  const MARGIN = { w: 13, h: 14 };
  const PADDED = { w: UNIT.w + MARGIN.w * 2, h: UNIT.h + MARGIN.h * 2 };
  const ASPECT = PADDED.w / PADDED.h;

  /// How much wider and taller a thoroughly fed bee is than a lean one.
  const PLUMPEST = 9;

  /// Whether a souvenir goes on the crown, and so has antennae to get out of the way of.
  const ON_THE_CROWN = new Set(['wingedHelmet', 'beret', 'stroopwafel']);
  const CROWN = -22;

  // Canvas blur is a `filter`, which not every engine has; where it is missing
  // the soft parts are drawn crisp, which is a bee with harder cheeks rather
  // than no bee. `unit` because the filter works in device pixels and the
  // radius is in bee units.
  let hasFilter = null;
  function blurred(ctx, unit, radius, draw) {
    if (hasFilter === null) { try { hasFilter = 'filter' in ctx && typeof ctx.filter === 'string'; } catch { hasFilter = false; } }
    ctx.save();
    if (hasFilter) ctx.filter = `blur(${(radius * unit).toFixed(2)}px)`;
    draw();
    ctx.restore();
  }

  const ellipse = (ctx, x, y, w, h) => { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); };
  const ellipsePath = (x, y, w, h) => { const p = new Path2D(); p.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); return p; };
  const stroke = (ctx, colour, width, cap = 'round') => { ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.lineCap = cap; ctx.stroke(); };

  /// The bee's colours after however long it has been out in it. A fortnight of
  /// Provence does not turn a bee brown: fur from cream towards biscuit, the
  /// honey a shade deeper, the cheeks up.
  function skin(tan) {
    return {
      fur: mix([0.99, 0.90, 0.68], [0.94, 0.79, 0.53], tan).map((v) => Math.round(v * 255)),
      honey: mix([0.96, 0.74, 0.20], [0.91, 0.65, 0.15], tan).map((v) => Math.round(v * 255)),
      honeyDeep: mix([0.87, 0.57, 0.11], [0.79, 0.47, 0.09], tan).map((v) => Math.round(v * 255)),
      blush: 0.45 + tan * 0.28,
    };
  }

  /// Draws one bee filling `w` × `h`, at instant `phase`.
  function draw(ctx, w, h, opts = {}) {
    const phase = opts.phase ?? 0;
    const mood = MOODS[opts.mood] || MOODS.cheerful;
    const talking = !!opts.talking;
    const look = { souvenir: opts.look?.souvenir || null, plumpness: clamp01(opts.look?.plumpness), weariness: clamp01(opts.look?.weariness), tan: clamp01(opts.look?.tan) };
    const unit = Math.min(w / PADDED.w, h / PADDED.h);
    const sk = skin(look.tan);

    // A tired bee flies lower, slower and in a smaller circle, on top of the mood.
    const beat = mood.beat * (talking ? 1.25 : 1) * (1 - look.weariness * 0.32);
    const effort = 1 - look.weariness * 0.55;
    const drift = Math.sin(phase * 0.7) * mood.drift * effort;
    const bob = (Math.sin(phase * 1.9) * mood.bob + Math.sin(phase * 0.53) * mood.bob * 0.4) * effort;
    const tilt = Math.sin(phase * 0.7 + Math.PI / 2) * 5;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(unit, unit);
    ctx.translate(drift - CENTRE.x, bob - CENTRE.y);

    // Shadow first, in unrotated space: it belongs to the ground.
    const squash = 1 - bob / 40;
    blurred(ctx, unit, 3, () => {
      ellipse(ctx, -22 * squash, 30 - bob * 0.6, 44 * squash, 7);
      ctx.fillStyle = `rgba(0,0,0,${(0.12 - bob / 300).toFixed(3)})`;
      ctx.fill();
    });

    ctx.rotate(deg(tilt));

    drawWings(ctx, unit, phase, beat, true);
    drawLegs(ctx, phase, look);
    drawAbdomen(ctx, unit, look, sk);
    drawWings(ctx, unit, phase, beat, false);
    drawHead(ctx, unit, phase, mood === MOODS.sleepy, talking, look, sk);

    ctx.restore();
  }

  function drawAbdomen(ctx, unit, look, sk) {
    const grow = look.plumpness * PLUMPEST;
    const body = { x: -8 - grow * 0.15, y: -20 - grow / 2, w: 52 + grow, h: 40 + grow };
    const maxX = body.x + body.w, maxY = body.y + body.h;
    const path = ellipsePath(body.x, body.y, body.w, body.h);
    const stretch = body.w / 52;

    const g = ctx.createLinearGradient(0, body.y, maxX - 4, maxY);
    g.addColorStop(0, rgba(sk.honey)); g.addColorStop(1, rgba(sk.honeyDeep));
    ctx.fillStyle = g; ctx.fill(path);

    // Stripes, clipped to the body so they curve with it, spaced with it too.
    ctx.save(); ctx.clip(path);
    ctx.fillStyle = rgba(P.stripe, 0.92);
    for (let i = 0; i < 3; i++) {
      const x = body.x + (6 + i * 13 + 8) * stretch;
      ctx.beginPath();
      ctx.moveTo(x, -30);
      ctx.quadraticCurveTo(x + 11, 0, x + 4, 30);
      ctx.lineTo(x + 12, 30);
      ctx.quadraticCurveTo(x + 19, 0, x + 8, -30);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // The sting, small and entirely decorative.
    ctx.beginPath(); ctx.moveTo(maxX - 1, -3); ctx.lineTo(maxX + 8, 1); ctx.lineTo(maxX - 1, 5); ctx.closePath();
    ctx.fillStyle = rgba(P.stripe, 0.85); ctx.fill();

    // A fuzzy collar where the body meets the head.
    blurred(ctx, unit, 1.6, () => { ellipse(ctx, -13, -15, 22, 30); ctx.fillStyle = rgba(sk.fur, 0.95); ctx.fill(); });

    ctx.strokeStyle = rgba(P.stripe, 0.35); ctx.lineWidth = 1.1; ctx.stroke(path);
  }

  function drawWings(ctx, unit, phase, beat, back) {
    // Fast down, slower up: a squared sine that keeps its sign.
    const raw = Math.sin(phase * beat * 2 * Math.PI);
    const swing = raw * Math.abs(raw);
    const angle = (back ? -8 : -46) + swing * (back ? 22 : 30);
    const length = back ? 36 : 46, width = back ? 16 : 19;

    blurred(ctx, unit, back ? 1.5 : 0.7, () => {
      ctx.translate(6, -16);
      ctx.rotate(deg(angle));
      const g = ctx.createLinearGradient(0, 0, length, 0);
      g.addColorStop(0, rgba(P.wing, back ? 0.62 : 0.8)); g.addColorStop(1, rgba(P.wing, 0.3));
      ellipse(ctx, -2, -width / 2, length, width);
      ctx.fillStyle = g; ctx.fill();
      stroke(ctx, rgba(P.wing, 0.9), 0.9, 'butt');
      // One vein, which is all it takes to stop the wing reading as a bubble.
      ctx.beginPath(); ctx.moveTo(1, 0); ctx.quadraticCurveTo(length / 2, -width / 3, length - 4, -1);
      stroke(ctx, 'rgba(255,255,255,0.6)', 0.7, 'butt');
    });
  }

  function drawLegs(ctx, phase, look) {
    const belly = look.plumpness * PLUMPEST / 2;
    const hang = look.weariness * 6;
    for (let i = 0; i < 3; i++) {
      const x = -2 + i * 13;
      const sway = Math.sin(phase * 2.3 + i * 1.1) * 2.2 * (1 - look.weariness * 0.7);
      ctx.beginPath();
      ctx.moveTo(x, 14 + belly);
      ctx.quadraticCurveTo(x - 3 + sway, 21 + belly + hang * 0.4, x + 2 + sway, 27 + belly + hang);
      stroke(ctx, rgba(P.stripe, 0.8), 2.1);
    }
  }

  function drawHead(ctx, unit, phase, sleepy, talking, look, sk) {
    const hatted = ON_THE_CROWN.has(look.souvenir);
    if (!hatted) drawAntennae(ctx, phase, -16);
    drawBehind(ctx, look.souvenir);

    const g = ctx.createRadialGradient(-24, -8, 2, -24, -8, 30);
    g.addColorStop(0, rgba(sk.fur)); g.addColorStop(1, rgba(sk.honey));
    ellipse(ctx, -34, -19, 36, 36); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = rgba(P.stripe, 0.35); ctx.lineWidth = 1.1; ctx.stroke();

    drawOnTop(ctx, look.souvenir);
    if (hatted) drawAntennae(ctx, phase, CROWN);

    // Blink: mostly open, shut briefly, out of step with the wings.
    const cycle = (phase * 0.29) % 1;
    const shut = (sleepy ? 0.10 : 0.035) + look.weariness * 0.06;
    const blinking = cycle < shut;
    // Eyelids at half mast, taken off the top of the eye only.
    const lid = look.weariness * 5;

    for (const ex of [-26, -13]) {
      if (blinking) {
        ctx.beginPath(); ctx.moveTo(ex - 4.5, -2); ctx.quadraticCurveTo(ex, -5, ex + 4.5, -2);
        stroke(ctx, rgba(P.stripe), 2);
      } else {
        ellipse(ctx, ex - 4, -8 + lid, 8, 11 - lid); ctx.fillStyle = rgba(P.stripe); ctx.fill();
        ellipse(ctx, ex - 1.5, -6 + lid, 3.4, 3.4); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
        if (lid > 1) {
          ctx.beginPath(); ctx.moveTo(ex - 4.6, -7.5 + lid); ctx.quadraticCurveTo(ex, -10 + lid, ex + 4.6, -7.5 + lid);
          stroke(ctx, rgba(P.stripe), 1.7);
        }
      }
    }

    for (const cx of [-30, -8]) {
      blurred(ctx, unit, 2, () => { ellipse(ctx, cx - 4, 3, 9, 6); ctx.fillStyle = rgba(P.blush, sk.blush); ctx.fill(); });
    }

    drawOverTheFace(ctx, look.souvenir);

    if (talking) {
      const open = (Math.sin(phase * 7.5) + 1) / 2;
      ellipse(ctx, -22, 4, 9, 3 + open * 5); ctx.fillStyle = rgba(P.stripe, 0.9); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(-23, 5); ctx.quadraticCurveTo(-17.5, 11, -12, 5);
      stroke(ctx, rgba(P.stripe), 2);
    }
  }

  function drawAntennae(ctx, phase, rootY) {
    [-28, -16].forEach((rootX, i) => {
      const wobble = Math.sin(phase * 1.6 + i * 0.9) * 2.4;
      const tip = { x: rootX - 7 + wobble, y: rootY - 16 };
      ctx.beginPath(); ctx.moveTo(rootX, rootY); ctx.quadraticCurveTo(rootX - 8 + wobble, rootY - 8, tip.x, tip.y);
      stroke(ctx, rgba(P.stripe, 0.85), 1.8);
      ellipse(ctx, tip.x - 2.6, tip.y - 2.6, 5.2, 5.2); ctx.fillStyle = rgba(P.stripe, 0.9); ctx.fill();
    });
  }

  // MARK: - Souvenirs

  function drawBehind(ctx, s) {
    if (s === 'lavender') drawLavender(ctx);
    if (s === 'tulip') drawTulip(ctx);
  }
  function drawOnTop(ctx, s) {
    if (s === 'wingedHelmet') drawWingedHelmet(ctx);
    if (s === 'beret') drawBeret(ctx);
    if (s === 'stroopwafel') drawStroopwafel(ctx);
  }
  function drawOverTheFace(ctx, s) {
    if (s === 'sunglasses') drawSunglasses(ctx);
  }

  /// Parc Astérix: wings, on a thing that has wings.
  function drawWingedHelmet(ctx) {
    drawHelmetWing(ctx, -32, -14, 23, -1, -52);
    drawHelmetWing(ctx, 0, -17, 17, 1, -64);

    // The cap: an oval a little wider than the head with everything below the brow taken off.
    ctx.save();
    ctx.beginPath(); ctx.rect(-40, -32, 50, 27); ctx.clip();
    const g = ctx.createLinearGradient(-30, -28, 0, -5);
    g.addColorStop(0, rgba(S.bronze)); g.addColorStop(1, rgba(S.bronzeDeep));
    ellipse(ctx, -37, -28, 42, 42); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = rgba(S.bronzeDeep); ctx.lineWidth = 1.1; ctx.stroke();
    ctx.restore();
    // The brow line the clip made, stroked so the dome has an edge there.
    ctx.beginPath(); ctx.moveTo(-36.9, -5); ctx.lineTo(4.9, -5); stroke(ctx, rgba(S.bronzeDeep), 1.1, 'butt');

    // The band round the brow, kept clear of the eyes.
    ctx.beginPath(); ctx.roundRect(-38, -11.5, 44, 6, 3);
    ctx.fillStyle = rgba(S.bronze); ctx.fill(); ctx.strokeStyle = rgba(S.bronzeDeep); ctx.lineWidth = 1.1; ctx.stroke();
    for (const x of [-34.5, 1.5]) { ellipse(ctx, x, -10, 3, 3); ctx.fillStyle = rgba(S.bronzeDeep, 0.8); ctx.fill(); }
  }

  /// One helmet wing: a single smooth blade, not a fan of feathers.
  function drawHelmetWing(ctx, rx, ry, length, side, tilt) {
    const width = length * 0.46;
    const m = new DOMMatrix().translate(rx, ry).scale(side, 1).rotate(tilt);
    const wing = new Path2D();
    wing.moveTo(0, 0);
    wing.quadraticCurveTo(length * 0.48, -width * 0.92, length, -width * 0.30);
    wing.quadraticCurveTo(length * 1.02, width * 0.08, length * 0.80, width * 0.26);
    wing.quadraticCurveTo(length * 0.34, width * 0.80, 0, 0);
    wing.closePath();
    const placed = new Path2D(); placed.addPath(wing, m);
    ctx.fillStyle = rgba(S.feather); ctx.fill(placed);
    ctx.strokeStyle = rgba(S.bronzeDeep, 0.75); ctx.lineWidth = 1.1; ctx.stroke(placed);
    for (const along of [0.42, 0.62]) {
      const q = new Path2D();
      q.moveTo(length * along, width * 0.34);
      q.quadraticCurveTo(length * (along + 0.18), width * 0.20, length * (along + 0.24), -width * 0.12);
      const pq = new Path2D(); pq.addPath(q, m);
      ctx.strokeStyle = rgba(S.bronzeDeep, 0.45); ctx.lineWidth = 0.85; ctx.lineCap = 'round'; ctx.stroke(pq);
    }
  }

  /// Paris: a soft disc worn at an angle, with the stalk on top.
  function drawBeret(ctx) {
    const disc = new Path2D();
    disc.addPath(ellipsePath(-23, -11, 46, 22), new DOMMatrix().translate(-16, -19).rotate(-11));
    const g = ctx.createLinearGradient(-34, -28, 0, -10);
    g.addColorStop(0, rgba(S.woolLit)); g.addColorStop(1, rgba(S.wool));
    ctx.fillStyle = g; ctx.fill(disc);
    ctx.strokeStyle = rgba(S.wool); ctx.lineWidth = 1.1; ctx.stroke(disc);

    const band = new Path2D(); const b = new Path2D(); b.roundRect(-34, -14, 34, 5, 2.5);
    band.addPath(b, new DOMMatrix().rotate(-7).translate(-1, 0));
    ctx.fillStyle = rgba(S.wool); ctx.fill(band);

    ellipse(ctx, -23, -33.5, 5.4, 5.4); ctx.fillStyle = rgba(S.woolLit); ctx.fill();
    ctx.strokeStyle = rgba(S.wool); ctx.lineWidth = 0.9; ctx.stroke();
  }

  /// Avignon: a sprig of lavender, tucked behind the head.
  function drawLavender(ctx) {
    ctx.beginPath(); ctx.moveTo(-7, -6); ctx.quadraticCurveTo(-6, -25, 3, -41); stroke(ctx, rgba(S.stem), 1.8);
    ctx.beginPath(); ctx.moveTo(-6, -14); ctx.quadraticCurveTo(-12, -14, -13, -21); ctx.quadraticCurveTo(-8, -19, -6, -14);
    ctx.fillStyle = rgba(S.stem); ctx.fill();
    for (let i = 0; i < 7; i++) {
      const along = i / 6;
      const y = -24 - along * 17;
      const x = 0.6 + along * 2.4 + (i % 2 === 0 ? -2.1 : 2.1) * (1 - along * 0.55);
      const size = 4.6 - along * 1.7;
      ellipse(ctx, x - size / 2, y - size / 2, size, size);
      ctx.fillStyle = rgba(i % 2 === 0 ? S.flower : S.flowerDeep); ctx.fill();
    }
  }

  /// Nice: sunglasses, over both eyes and whatever they were doing.
  function drawSunglasses(ctx) {
    for (const c of [-26, -13]) {
      ctx.beginPath(); ctx.roundRect(c - 7, -11, 14, 13, [{ x: 5.5, y: 6 }]);
      const g = ctx.createLinearGradient(c - 7, -11, c + 7, 2);
      g.addColorStop(0, rgba(S.glass, 0.93)); g.addColorStop(1, rgba(S.glass));
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.moveTo(c - 4.5, -2); ctx.lineTo(c - 0.5, -9); stroke(ctx, 'rgba(255,255,255,0.5)', 1.8);
    }
    ctx.beginPath(); ctx.moveTo(-19.5, -7); ctx.quadraticCurveTo(-20, -9.5, -20.5, -7); stroke(ctx, rgba(S.glass), 2.4);
    ctx.beginPath(); ctx.moveTo(-6.5, -7); ctx.quadraticCurveTo(-1, -6.5, 1, -3); stroke(ctx, rgba(S.glass), 1.9);
  }

  /// Schiphol: a stroopwafel, worn exactly where the beret went, because it is
  /// the same shape and the bee noticed.
  function drawStroopwafel(ctx) {
    const m = new DOMMatrix().translate(-16, -19).rotate(-11);
    const disc = new Path2D(); disc.addPath(ellipsePath(-23, -11, 46, 22), m);
    const g = ctx.createLinearGradient(-34, -28, 0, -10);
    g.addColorStop(0, rgba(S.waffle)); g.addColorStop(1, rgba(S.waffleDeep));
    ctx.fillStyle = g; ctx.fill(disc);

    // The waffle: a diagonal grid, clipped to the disc, in the same tilted space.
    ctx.save(); ctx.clip(disc);
    ctx.setTransform(ctx.getTransform().multiply(m));
    ctx.strokeStyle = rgba(S.syrup, 0.55); ctx.lineWidth = 0.9; ctx.lineCap = 'butt';
    for (let k = -30; k <= 30; k += 5.5) {
      ctx.beginPath(); ctx.moveTo(k - 14, -14); ctx.lineTo(k + 14, 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(k + 14, -14); ctx.lineTo(k - 14, 14); ctx.stroke();
    }
    ctx.restore();
    // The syrup seam round the edge, and the rim.
    const seam = new Path2D(); seam.addPath(ellipsePath(-19, -8.5, 38, 17), m);
    ctx.strokeStyle = rgba(S.syrup, 0.5); ctx.lineWidth = 1.4; ctx.stroke(seam);
    ctx.strokeStyle = rgba(S.waffleDeep); ctx.lineWidth = 1.1; ctx.stroke(disc);
  }

  /// The Bloemenmarkt: a wooden tulip, behind the head where the lavender went.
  /// It is September; the real ones are bulbs in paper bags. This one is wood,
  /// painted, and will last a good deal longer than the bee.
  function drawTulip(ctx) {
    ctx.beginPath(); ctx.moveTo(-7, -6); ctx.quadraticCurveTo(-6, -24, 3, -37); stroke(ctx, rgba(S.stem), 2);
    ctx.beginPath(); ctx.moveTo(-6, -14); ctx.quadraticCurveTo(-13, -13, -14, -22); ctx.quadraticCurveTo(-8, -20, -6, -14);
    ctx.fillStyle = rgba(S.stem); ctx.fill();
    // The head: three lobes, flat-cut the way a wooden one is.
    ctx.beginPath();
    ctx.moveTo(-4.5, -37);
    ctx.quadraticCurveTo(-7.5, -46, -5, -51.5);
    ctx.quadraticCurveTo(-1, -46, 3, -50);
    ctx.quadraticCurveTo(7, -46, 11, -51.5);
    ctx.quadraticCurveTo(13.5, -46, 10.5, -37);
    ctx.quadraticCurveTo(3, -34, -4.5, -37);
    ctx.closePath();
    const g = ctx.createLinearGradient(-6, -52, 12, -36);
    g.addColorStop(0, rgba(S.tulipLit)); g.addColorStop(1, rgba(S.tulipDeep));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = rgba(S.tulipDeep); ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.stroke();
    // One line of grain, which is what says wood rather than petal.
    ctx.beginPath(); ctx.moveTo(1, -48); ctx.quadraticCurveTo(3, -43, 2, -38); stroke(ctx, rgba(S.tulipDeep, 0.5), 0.8);
  }

  // MARK: - The glyph: the bee from above, flattened into one mark.

  /// Draws the mark into `rect` at part opacity for the wings, full for the body.
  /// Returns nothing; use `glyphImage` when it has to be composited over texture.
  function glyph(ctx, x, y, w, h, colour = '#332921') {
    const unit = Math.min(w / 100, h / 100);
    ctx.save();
    ctx.translate(x + w / 2 - 50 * unit, y + h / 2 - 50 * unit);
    ctx.scale(unit, unit);
    // Wings, held out and up either side, wider than the bee itself.
    ctx.globalAlpha = 0.45; ctx.fillStyle = colour;
    for (const side of [-1, 1]) {
      const p = new Path2D();
      p.addPath(ellipsePath(-4, -11, 46, 22), new DOMMatrix().translate(50, 48).scale(side, 1).rotate(-26));
      ctx.fill(p);
    }
    ctx.globalAlpha = 1;
    // Abdomen with the stripes taken out of it: drawn, then the bands cut.
    ctx.save();
    ctx.beginPath(); ctx.ellipse(50, 72, 20, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    for (const yy of [62, 76]) { ctx.beginPath(); ctx.roundRect(24, yy, 52, 7, 3); ctx.fill(); }
    ctx.restore();
    // Thorax and head, overlapping so the join is not a seam.
    ctx.beginPath(); ctx.ellipse(50, 49, 17, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(50, 30.5, 12, 11.5, 0, 0, Math.PI * 2); ctx.fill();
    // Antennae, out and up, with the club on the end.
    ctx.strokeStyle = colour; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(50 + 6 * side, 22); ctx.quadraticCurveTo(50 + 16 * side, 16, 50 + 19 * side, 8); ctx.stroke();
      ctx.beginPath(); ctx.arc(50 + 19 * side, 8, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /// The mark on its own transparent canvas, so the cut-out stripes stay cut
  /// when it is laid over paper.
  function glyphImage(size, colour) {
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    glyph(c.getContext('2d'), 0, 0, size, size, colour);
    return c;
  }

  /// The bee, for somebody who cannot see it.
  function describe(look = {}) {
    const parts = ['A cartoon bee'];
    const wearing = {
      wingedHelmet: 'in a winged Gaulish helmet', beret: 'in a beret',
      lavender: 'with a sprig of lavender behind its head', sunglasses: 'in sunglasses',
      stroopwafel: 'with a stroopwafel on its head', tulip: 'with a wooden tulip behind its head',
    }[look.souvenir];
    if (wearing) parts.push(wearing);
    if ((look.plumpness || 0) > 0.8) parts.push('very well fed');
    parts.push((look.weariness || 0) > 0.7 ? 'worn out and hanging in the air' : 'hovering');
    return parts.join(', ');
  }

  /// Keeps a canvas drawing the bee off the clock. Returns a stop function.
  function animate(canvas, getOpts) {
    const ctx = canvas.getContext('2d');
    let raf = 0;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function frame(t) {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const opts = getOpts() || {};
      // Still but not stiff: mid-beat, top of the bob, reads as hovering.
      draw(ctx, w, h, { ...opts, phase: reduce ? 0.18 : t / 1000, talking: reduce ? false : opts.talking });
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  return { draw, glyph, glyphImage, describe, animate, ASPECT, PALETTE: P, SOUVENIRS: S };
})();
