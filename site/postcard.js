// The postcards, drawn. The front is a picture — paper, a hand-lettered place,
// the bee as it looked that day, and one thing it saw — and the corner of the
// back is a stamp and a postmark, struck the way Carnet's stamps are.
const Postcard = (() => {
  const paper = '#F8F3E7', paperShade = '#ECE4D3', ink = 'rgb(46,41,36)', faded = 'rgb(107,99,90)';
  const rouge = 'rgb(163,59,41)', blue = 'rgb(27,73,101)', tram = 'rgb(38,88,150)';
  const HAND = '"Caveat", "Bradley Hand", "Noteworthy", "Marker Felt", cursive';
  const TYPED = '"American Typewriter", "Courier New", monospace';

  function hash(seed) {
    let v = 0xcbf29ce4 ^ 0x84222325;
    for (const ch of seed) { v ^= ch.charCodeAt(0); v = Math.imul(v, 0x01000193) >>> 0; }
    return (v % 1000000) / 1000000;
  }
  const noise = (seed, ch, lo, hi) => lo + hash(`${seed}#${ch}`) * (hi - lo);

  /// Aged paper: warm base, soft vignette, fibre speckle.
  function drawPaper(ctx, w, h, seed = 'card') {
    ctx.fillStyle = paper; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.45, h * 0.4, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.8);
    g.addColorStop(0, paper); g.addColorStop(1, paperShade);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = Math.max(0.5, w * 0.0014); ctx.lineCap = 'round';
    const n = Math.round(w * h / 1400);
    for (let i = 0; i < n; i++) {
      const x = noise(seed, i, 0, 1) * w, y = noise(seed, 5000 + i, 0, 1) * h, len = noise(seed, 10000 + i, 0.004, 0.012) * w;
      ctx.strokeStyle = `rgba(46,41,36,${noise(seed, 15000 + i, 0.03, 0.08).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y + len * 0.4); ctx.stroke();
    }
  }

  // MARK: - The things it saw

  function tramScene(ctx, w, h) {
    // A GVB tram, side on, with the one thing the bee cares about: the wire.
    const s = w / 400;
    ctx.save(); ctx.translate(w * 0.5, h * 0.62); ctx.scale(s, s);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Rails and the wire.
    ctx.beginPath(); ctx.moveTo(-190, 40); ctx.lineTo(190, 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-190, -78); ctx.lineTo(190, -78); ctx.lineWidth = 1.2; ctx.stroke();
    // Pantograph.
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(10, -42); ctx.lineTo(28, -62); ctx.lineTo(12, -76); ctx.moveTo(4, -76); ctx.lineTo(22, -76); ctx.stroke();
    // Body: two rounded carriages with a bend.
    const body = new Path2D();
    body.roundRect(-140, -44, 130, 78, [12, 6, 6, 12]);
    body.roundRect(-4, -44, 130, 78, [6, 12, 12, 6]);
    ctx.fillStyle = '#fff'; ctx.fill(body);
    ctx.fillStyle = tram; ctx.save(); ctx.clip(body); ctx.fillRect(-150, 6, 300, 30); ctx.restore();
    ctx.stroke(body);
    // Windows.
    ctx.fillStyle = 'rgba(200,220,235,0.9)';
    for (const x0 of [-132, -66, 6, 70]) { ctx.beginPath(); ctx.roundRect(x0, -36, 50, 34, 4); ctx.fill(); ctx.stroke(); }
    // The bend, doors, wheels.
    ctx.beginPath(); ctx.moveTo(-8, -44); ctx.lineTo(-8, 34); ctx.moveTo(-2, -44); ctx.lineTo(-2, 34); ctx.stroke();
    for (const x0 of [-100, -40, 40, 100]) { ctx.beginPath(); ctx.arc(x0, 40, 7, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill(); }
    // Route number.
    ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${TYPED}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('2', 118, 20);
    ctx.restore();
  }

  function planeScene(ctx, w, h) {
    const s = w / 400;
    ctx.save(); ctx.translate(w * 0.5, h * 0.5); ctx.scale(s, s);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // Contrail behind.
    ctx.setLineDash([6, 8]); ctx.strokeStyle = faded;
    ctx.beginPath(); ctx.moveTo(-190, 30); ctx.quadraticCurveTo(-120, 20, -70, 6); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = ink;
    ctx.rotate(-0.16);
    // Fuselage.
    const f = new Path2D();
    f.moveTo(-120, 0); f.quadraticCurveTo(-110, -14, -80, -14); f.lineTo(110, -14); f.quadraticCurveTo(150, -14, 165, 0);
    f.quadraticCurveTo(150, 12, 110, 12); f.lineTo(-80, 12); f.quadraticCurveTo(-110, 12, -120, 0); f.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(f); ctx.stroke(f);
    // KLM-ish blue along the bottom half and the fin.
    ctx.save(); ctx.clip(f); ctx.fillStyle = 'rgb(0,161,222)'; ctx.fillRect(-130, 2, 300, 12); ctx.restore();
    const fin = new Path2D(); fin.moveTo(-95, -13); fin.lineTo(-70, -52); fin.lineTo(-40, -52); fin.lineTo(-60, -13); fin.closePath();
    ctx.fillStyle = 'rgb(0,161,222)'; ctx.fill(fin); ctx.stroke(fin);
    // Wing, towards us.
    const wing = new Path2D(); wing.moveTo(0, 0); wing.lineTo(-40, 48); wing.lineTo(-10, 48); wing.lineTo(50, 0); wing.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(wing); ctx.stroke(wing);
    // Engine, windows.
    ctx.beginPath(); ctx.roundRect(-8, 26, 34, 14, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = ink;
    for (let x0 = -60; x0 < 120; x0 += 14) { ctx.beginPath(); ctx.arc(x0, -4, 2.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function beeHotelScene(ctx, w, h) {
    // A plank with holes drilled in it, on a post, in a park. Which is a hotel.
    const s = w / 400;
    ctx.save(); ctx.translate(w * 0.5, h * 0.55); ctx.scale(s, s);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // Grass line.
    ctx.strokeStyle = 'rgb(107,135,92)';
    for (let x0 = -180; x0 <= 180; x0 += 9) { ctx.beginPath(); ctx.moveTo(x0, 92); ctx.lineTo(x0 + noise('grass', x0, -4, 4), 82 - noise('grass', x0 + 1, 0, 8)); ctx.stroke(); }
    ctx.strokeStyle = ink;
    // Post and roof.
    ctx.fillStyle = 'rgb(160,120,80)';
    ctx.beginPath(); ctx.rect(-6, 20, 12, 72); ctx.fill(); ctx.stroke();
    const box = new Path2D(); box.rect(-70, -40, 140, 62);
    ctx.fillStyle = 'rgb(214,176,124)'; ctx.fill(box); ctx.stroke(box);
    const roof = new Path2D(); roof.moveTo(-80, -40); roof.lineTo(0, -72); roof.lineTo(80, -40); roof.closePath();
    ctx.fillStyle = 'rgb(120,86,58)'; ctx.fill(roof); ctx.stroke(roof);
    // Holes, in rows, with the one that is taken.
    ctx.fillStyle = 'rgb(70,50,34)';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
      const x0 = -56 + c * 16, y0 = -26 + r * 18;
      ctx.beginPath(); ctx.arc(x0, y0, 4.2, 0, Math.PI * 2); ctx.fill();
    }
    // A little sign.
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(28, 30, 58, 22, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ink; ctx.font = `bold 9px ${TYPED}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('BIJENHOTEL', 57, 41);
    ctx.restore();
  }

  function eurostarScene(ctx, w, h) {
    // A train, and above it the sea. Fish included, for the record.
    const s = w / 400;
    ctx.save(); ctx.translate(w * 0.5, h * 0.55); ctx.scale(s, s);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // The sea, as wavy lines, above the tunnel.
    ctx.strokeStyle = blue;
    for (let row = 0; row < 4; row++) {
      ctx.beginPath();
      for (let x0 = -190; x0 <= 190; x0 += 4) {
        const y0 = -110 + row * 14 + Math.sin(x0 / 14 + row) * 4;
        if (x0 === -190) ctx.moveTo(x0, y0); else ctx.lineTo(x0, y0);
      }
      ctx.stroke();
    }
    // Two fish.
    for (const [fx, fy, dir] of [[-90, -92, 1], [70, -70, -1]]) {
      ctx.beginPath(); ctx.ellipse(fx, fy, 10, 5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx - 10 * dir, fy); ctx.lineTo(fx - 16 * dir, fy - 5); ctx.lineTo(fx - 16 * dir, fy + 5); ctx.closePath(); ctx.stroke();
    }
    ctx.strokeStyle = ink;
    // The tunnel: an arch of rock.
    ctx.fillStyle = 'rgb(200,190,172)';
    ctx.beginPath(); ctx.moveTo(-190, 60); ctx.lineTo(-190, -30); ctx.quadraticCurveTo(-190, -50, -170, -50); ctx.lineTo(170, -50);
    ctx.quadraticCurveTo(190, -50, 190, -30); ctx.lineTo(190, 60); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgb(60,54,48)'; ctx.beginPath(); ctx.roundRect(-176, -36, 352, 90, [24, 24, 0, 0]); ctx.fill();
    // Rails.
    ctx.strokeStyle = 'rgb(120,110,100)'; ctx.beginPath(); ctx.moveTo(-176, 46); ctx.lineTo(176, 46); ctx.stroke();
    // The train nose, coming at us a bit.
    ctx.strokeStyle = ink;
    const nose = new Path2D();
    nose.moveTo(-110, 40); nose.lineTo(-110, 0); nose.quadraticCurveTo(-110, -22, -80, -24); nose.lineTo(60, -24);
    nose.quadraticCurveTo(120, -22, 150, 8); nose.quadraticCurveTo(160, 24, 150, 40); nose.closePath();
    ctx.fillStyle = 'rgb(240,238,232)'; ctx.fill(nose); ctx.stroke(nose);
    ctx.save(); ctx.clip(nose); ctx.fillStyle = 'rgb(0,46,96)'; ctx.fillRect(-120, -24, 300, 8); ctx.fillStyle = 'rgb(255,214,0)'; ctx.fillRect(-120, 26, 300, 14); ctx.restore();
    ctx.fillStyle = 'rgba(200,220,235,0.9)';
    for (const x0 of [-96, -66, -36, -6, 24]) { ctx.beginPath(); ctx.roundRect(x0, -14, 22, 16, 3); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(100, -10); ctx.quadraticCurveTo(130, -2, 140, 16); ctx.stroke();
    ctx.restore();
  }

  function bloemenmarktScene(ctx, w, h) {
    // A row of tulips in buckets, and a canal behind them.
    const s = w / 400;
    ctx.save(); ctx.translate(w * 0.5, h * 0.6); ctx.scale(s, s);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = blue;
    for (let row = 0; row < 3; row++) {
      ctx.beginPath();
      for (let x0 = -190; x0 <= 190; x0 += 4) { const y0 = -96 + row * 10 + Math.sin(x0 / 18 + row * 2) * 2.5; if (x0 === -190) ctx.moveTo(x0, y0); else ctx.lineTo(x0, y0); }
      ctx.stroke();
    }
    ctx.strokeStyle = ink;
    // Stall counter.
    ctx.fillStyle = 'rgb(214,176,124)'; ctx.beginPath(); ctx.rect(-170, 30, 340, 40); ctx.fill(); ctx.stroke();
    const colours = ['rgb(204,61,46)', 'rgb(236,170,40)', 'rgb(214,96,150)', 'rgb(204,61,46)', 'rgb(250,240,220)', 'rgb(236,170,40)'];
    for (let b = 0; b < 6; b++) {
      const bx = -140 + b * 56;
      // Bucket.
      ctx.fillStyle = 'rgb(120,130,140)'; ctx.beginPath(); ctx.moveTo(bx - 18, 0); ctx.lineTo(bx + 18, 0); ctx.lineTo(bx + 14, 32); ctx.lineTo(bx - 14, 32); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Stems and heads.
      for (let t = 0; t < 4; t++) {
        const tx = bx - 12 + t * 8 + noise('tulip', b * 10 + t, -2, 2), ty = -30 - noise('tulip', b * 10 + t + 100, 0, 22);
        ctx.strokeStyle = 'rgb(107,135,92)'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(tx, 0); ctx.quadraticCurveTo(tx + 2, ty / 2, tx, ty); ctx.stroke();
        ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
        ctx.fillStyle = colours[(b + t) % colours.length];
        ctx.beginPath(); ctx.moveTo(tx - 5, ty); ctx.quadraticCurveTo(tx - 7, ty - 10, tx - 5, ty - 13); ctx.quadraticCurveTo(tx - 1, ty - 8, tx, ty - 12);
        ctx.quadraticCurveTo(tx + 1, ty - 8, tx + 5, ty - 13); ctx.quadraticCurveTo(tx + 7, ty - 10, tx + 5, ty); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.lineWidth = 1.6;
    }
    ctx.restore();
  }

  function bagScene(ctx, w, h) {
    // A bag, zipped, on a chair at a gate, and two antennae poking out of it.
    const s = w / 400;
    ctx.save(); ctx.translate(w * 0.5, h * 0.55); ctx.scale(s, s);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // Gate sign.
    ctx.fillStyle = 'rgb(255,214,0)'; ctx.beginPath(); ctx.roundRect(60, -110, 110, 36, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ink; ctx.font = `bold 14px ${TYPED}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('D57  EZY2166', 115, -92);
    // Chair.
    ctx.fillStyle = 'rgb(90,100,110)'; ctx.beginPath(); ctx.roundRect(-120, 30, 240, 14, 4); ctx.fill(); ctx.stroke();
    for (const x0 of [-100, 100]) { ctx.beginPath(); ctx.moveTo(x0, 44); ctx.lineTo(x0, 80); ctx.stroke(); }
    // Bag.
    const bag = new Path2D(); bag.roundRect(-70, -50, 140, 82, 14);
    ctx.fillStyle = 'rgb(115,70,50)'; ctx.fill(bag); ctx.stroke(bag);
    ctx.beginPath(); ctx.moveTo(-40, -50); ctx.quadraticCurveTo(0, -84, 40, -50); ctx.stroke(); // handle
    ctx.strokeStyle = 'rgb(230,220,200)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(-58, -34); ctx.lineTo(58, -34); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = ink;
    ctx.beginPath(); ctx.roundRect(-20, -10, 40, 26, 4); ctx.fillStyle = 'rgb(140,90,66)'; ctx.fill(); ctx.stroke(); // pocket
    // The zip, open a touch, and two antennae out of it.
    ctx.fillStyle = 'rgb(46,41,36)'; ctx.beginPath(); ctx.ellipse(30, -34, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1.8;
    for (const [dx, tip] of [[-4, -8], [4, -6]]) {
      ctx.beginPath(); ctx.moveTo(30 + dx, -36); ctx.quadraticCurveTo(30 + dx * 2, -48, 30 + dx * 2 + tip / 2, -54); ctx.stroke();
      ctx.beginPath(); ctx.arc(30 + dx * 2 + tip / 2, -54, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  const scenes = { centraal: tramScene, plane: planeScene, beehotel: beeHotelScene, eurostar: eurostarScene, bloemenmarkt: bloemenmarktScene, bag: bagScene };

  /// The picture side. `look` is what the bee looked like when it wrote it.
  function drawFront(ctx, w, h, card, look, phase = 0.18) {
    drawPaper(ctx, w, h, 'front' + card.id);
    // A printed border, the way old cards have.
    ctx.strokeStyle = 'rgba(46,41,36,0.35)'; ctx.lineWidth = Math.max(1, w * 0.004);
    ctx.strokeRect(w * 0.035, h * 0.05, w * 0.93, h * 0.9);
    // The picture area.
    ctx.save(); ctx.beginPath(); ctx.rect(w * 0.035, h * 0.05, w * 0.93, h * 0.9); ctx.clip();
    (scenes[card.front] || tramScene)(ctx, w, h * 0.78);
    // The bee, in the corner nearest whatever it is looking at.
    const bw = w * 0.36, bh = bw / Bee.ASPECT;
    ctx.save(); ctx.translate(w * 0.06, h * 0.86 - bh);
    Bee.draw(ctx, bw, bh, { phase, mood: 'cheerful', look });
    ctx.restore();
    ctx.restore();
    // The place, hand-lettered across the bottom band.
    ctx.fillStyle = 'rgba(248,243,231,0.85)'; ctx.fillRect(w * 0.035, h * 0.78, w * 0.93, h * 0.17);
    ctx.strokeStyle = 'rgba(46,41,36,0.35)'; ctx.beginPath(); ctx.moveTo(w * 0.035, h * 0.78); ctx.lineTo(w * 0.965, h * 0.78); ctx.stroke();
    ctx.fillStyle = rouge; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(h * 0.11)}px ${HAND}`;
    ctx.fillText(card.caption, w * 0.94, h * 0.865);
    ctx.fillStyle = faded; ctx.font = `${Math.round(h * 0.032)}px ${TYPED}`; ctx.textAlign = 'left';
    ctx.fillText('BY BEE', w * 0.06, h * 0.93);
  }

  /// A small stamp with the bee on it, for the back.
  function drawStamp(ctx, x, y, w, h) {
    const layer = document.createElement('canvas'); layer.width = Math.ceil(w); layer.height = Math.ceil(h);
    const l = layer.getContext('2d');
    l.fillStyle = '#FBF7EC'; l.fillRect(0, 0, w, h);
    const pitch = w / 8, r = w * 0.05;
    l.globalCompositeOperation = 'destination-out';
    for (let i = 0; i <= 8; i++) for (const yy of [0, h]) { l.beginPath(); l.arc(i * pitch, yy, r, 0, Math.PI * 2); l.fill(); }
    const ny = Math.round(h / pitch);
    for (let j = 0; j <= ny; j++) for (const xx of [0, w]) { l.beginPath(); l.arc(xx, j * (h / ny), r, 0, Math.PI * 2); l.fill(); }
    l.globalCompositeOperation = 'source-over';
    const inset = w * 0.1;
    l.strokeStyle = 'rgba(46,41,36,0.5)'; l.lineWidth = 1; l.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    const bw = w * 0.95, bh = bw / Bee.ASPECT;
    l.save(); l.translate(w / 2 - bw / 2, h * 0.52 - bh / 2); Bee.draw(l, bw, bh, { phase: 0.18, look: { tan: 0.3 } }); l.restore();
    l.fillStyle = 'rgba(46,41,36,0.85)'; l.font = `${Math.round(h * 0.11)}px ${TYPED}`; l.textAlign = 'left'; l.textBaseline = 'bottom';
    l.fillText('1ST', inset * 1.6, h - inset * 1.4);
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.03); ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
    ctx.drawImage(layer, 0, 0); ctx.restore();
  }

  /// A postmark: double ring, the town round the top, the date across.
  function drawPostmark(ctx, cx, cy, R, town, date, seed = 'pm', tilt = -0.15, colour = rouge) {
    const layer = document.createElement('canvas'); layer.width = ctx.canvas.width; layer.height = ctx.canvas.height;
    const p = layer.getContext('2d');
    p.setTransform(ctx.getTransform());
    p.translate(cx, cy); p.rotate(tilt); p.translate(-cx, -cy);
    p.strokeStyle = colour; p.lineWidth = R * 0.06; p.beginPath(); p.arc(cx, cy, R, 0, Math.PI * 2); p.stroke();
    p.lineWidth = R * 0.03; p.beginPath(); p.arc(cx, cy, R * 0.88, 0, Math.PI * 2); p.stroke();
    p.fillStyle = colour; p.textAlign = 'center'; p.textBaseline = 'middle';
    p.font = `bold ${Math.round(R * 0.26)}px ${TYPED}`;
    const step = Math.min(0.32, 2.4 / town.length), sweep = step * (town.length - 1);
    for (let i = 0; i < town.length; i++) {
      const th = -Math.PI / 2 - sweep / 2 + step * i;
      p.save(); p.translate(cx + Math.cos(th) * R * 0.68, cy + Math.sin(th) * R * 0.68); p.rotate(th + Math.PI / 2); p.fillText(town[i], 0, 0); p.restore();
    }
    p.lineWidth = R * 0.025;
    for (const off of [-R * 0.2, R * 0.2]) { p.beginPath(); p.moveTo(cx - R * 0.5, cy + off); p.lineTo(cx + R * 0.5, cy + off); p.stroke(); }
    p.font = `bold ${Math.round(R * 0.2)}px ${TYPED}`; p.fillText(date, cx, cy + R * 0.01);
    // Eroded, like something pressed by hand.
    p.setTransform(1, 0, 0, 1, 0, 0);
    p.globalCompositeOperation = 'destination-out';
    const m = ctx.getTransform();
    const dev = (x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
    const c = dev(cx, cy), Rd = R * m.a;
    for (let i = 0; i < 40; i++) {
      const a = noise(seed, i, 0, Math.PI * 2), d = Math.sqrt(noise(seed, 500 + i, 0, 1)) * Rd * 1.1, rr = noise(seed, 1000 + i, 0.02, 0.09) * Rd;
      p.fillStyle = `rgba(0,0,0,${noise(seed, 1500 + i, 0.3, 0.9).toFixed(2)})`;
      p.beginPath(); p.arc(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, rr, 0, Math.PI * 2); p.fill();
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.88; ctx.drawImage(layer, 0, 0); ctx.restore();
  }

  /// The top-right of the back: stamp, and the postmarks it has picked up.
  function drawCorner(ctx, w, h, card, opts = {}) {
    ctx.clearRect(0, 0, w, h);
    const sw = w * 0.5, sh = sw * 1.2;
    drawStamp(ctx, w - sw - w * 0.06, h * 0.06, sw, sh);
    drawPostmark(ctx, w * 0.42, h * 0.3, w * 0.26, 'MANCHESTER', opts.posted || '', 'pm' + card.id, -0.2);
    if (opts.signed) drawPostmark(ctx, w * 0.64, h * 0.66, w * 0.22, opts.town || 'AMSTERDAM', opts.delivered || '', 'sg' + card.id, 0.18, blue);
  }

  return { drawPaper, drawFront, drawStamp, drawPostmark, drawCorner, HAND, TYPED };
})();
