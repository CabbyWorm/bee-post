// The app icon: a stamp with the bee on it, struck with a Manchester postmark,
// on a page of the scrapbook. Drawn rather than shipped, like Carnet's, so it
// can be adjusted and comes out identical every time. `scripts/make_icons.sh`
// renders it to PNG at the sizes a home screen wants.
const Icon = (() => {
  const paper = '#F6F1E5', paperShade = '#EAE3D4', ink = 'rgb(46,41,36)', rouge = 'rgb(163,59,41)';
  const cream = '#FBF7EC';

  // Deterministic noise, so the speckle is the same every render.
  function hash(seed) {
    let v = 0xcbf29ce4 ^ 0x84222325;
    for (const ch of seed) { v ^= ch.charCodeAt(0); v = Math.imul(v, 0x01000193) >>> 0; }
    return (v % 1000000) / 1000000;
  }
  const noise = (seed, ch, lo, hi) => lo + hash(`${seed}#${ch}`) * (hi - lo);

  function draw(ctx, side, opts = {}) {
    const look = opts.look || { tan: 0.3 };
    // Paper, opaque corner to corner: an icon may not carry transparency and
    // a rounded one drawn here would be rounded twice on the home screen.
    ctx.fillStyle = paper; ctx.fillRect(0, 0, side, side);
    const warmth = ctx.createRadialGradient(side * 0.42, side * 0.38, side * 0.2, side * 0.5, side * 0.5, side * 0.86);
    warmth.addColorStop(0, paper); warmth.addColorStop(1, paperShade);
    ctx.fillStyle = warmth; ctx.fillRect(0, 0, side, side);
    // Paper fibre.
    ctx.lineWidth = side * 0.0016; ctx.lineCap = 'round';
    for (let i = 0; i < 420; i++) {
      const x = noise('fibre', i, 0, 1) * side, y = noise('fibre', 5000 + i, 0, 1) * side;
      const len = noise('fibre', 10000 + i, 0.002, 0.008) * side;
      ctx.strokeStyle = `rgba(46,41,36,${noise('fibre', 15000 + i, 0.03, 0.09).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y + len * 0.4); ctx.stroke();
    }

    // The stamp: a perforated rectangle, a few degrees off square, on its own
    // layer so the perforations can be punched out of it.
    const sw = side * 0.66, sh = side * 0.76;
    const layer = document.createElement('canvas'); layer.width = side; layer.height = side;
    const l = layer.getContext('2d');
    l.translate(side / 2, side / 2); l.rotate(-6 * Math.PI / 180); l.translate(-sw / 2, -sh / 2);
    l.fillStyle = cream; l.fillRect(0, 0, sw, sh);
    // Perforations.
    const pitch = side * 0.048, r = side * 0.015;
    l.globalCompositeOperation = 'destination-out';
    const nx = Math.round(sw / pitch), ny = Math.round(sh / pitch);
    for (let i = 0; i <= nx; i++) { const x = i * (sw / nx); for (const y of [0, sh]) { l.beginPath(); l.arc(x, y, r, 0, Math.PI * 2); l.fill(); } }
    for (let j = 0; j <= ny; j++) { const y = j * (sh / ny); for (const x of [0, sw]) { l.beginPath(); l.arc(x, y, r, 0, Math.PI * 2); l.fill(); } }
    l.globalCompositeOperation = 'source-over';
    // The printed frame inside the perforations, and the bee.
    const inset = side * 0.045;
    l.strokeStyle = 'rgba(46,41,36,0.55)'; l.lineWidth = side * 0.004;
    l.strokeRect(inset, inset, sw - inset * 2, sh - inset * 2);
    l.strokeStyle = 'rgba(46,41,36,0.25)'; l.lineWidth = side * 0.002;
    l.strokeRect(inset * 1.35, inset * 1.35, sw - inset * 2.7, sh - inset * 2.7);
    // A faint honeycomb behind it, the way a stamp has a printed ground.
    l.save(); l.beginPath(); l.rect(inset * 1.35, inset * 1.35, sw - inset * 2.7, sh - inset * 2.7); l.clip();
    l.strokeStyle = 'rgba(46,41,36,0.06)'; l.lineWidth = side * 0.0025;
    const hr = side * 0.05, hw = hr * Math.sqrt(3);
    for (let row = -1; row < sh / (hr * 1.5) + 2; row++) {
      for (let col = -1; col < sw / hw + 2; col++) {
        const cx = col * hw + (row % 2 ? hw / 2 : 0), cy = row * hr * 1.5;
        l.beginPath();
        for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; l.lineTo(cx + hr * Math.cos(a), cy + hr * Math.sin(a)); }
        l.closePath(); l.stroke();
      }
    }
    l.restore();
    // The bee, big: it is the whole point of the stamp.
    const bw = sw * 1.16, bh = bw / Bee.ASPECT;
    l.save(); l.translate(sw / 2 - bw / 2 + sw * 0.015, sh * 0.55 - bh / 2);
    Bee.draw(l, bw, bh, { phase: 0.18, mood: 'cheerful', look });
    l.restore();
    // The denomination, small, top right, in the official voice.
    l.fillStyle = 'rgba(46,41,36,0.85)';
    l.font = `${Math.round(side * 0.06)}px "American Typewriter", "Courier New", monospace`;
    l.textAlign = 'left'; l.textBaseline = 'bottom';
    l.fillText('1ST', inset * 1.9, sh - inset * 1.7);
    // A slight shadow under the stamp, so it is stuck on rather than printed.
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = side * 0.02; ctx.shadowOffsetY = side * 0.008;
    ctx.drawImage(layer, 0, 0); ctx.restore();

    // The postmark, struck over the top-right corner, in a layer so the ink can
    // be eroded before it lands.
    const pm = document.createElement('canvas'); pm.width = side; pm.height = side;
    const p = pm.getContext('2d');
    const cx = side * 0.70, cy = side * 0.245, R = side * 0.205;
    p.translate(cx, cy); p.rotate(-9 * Math.PI / 180); p.translate(-cx, -cy);
    p.strokeStyle = rouge; p.lineWidth = R * 0.05;
    p.beginPath(); p.arc(cx, cy, R, 0, Math.PI * 2); p.stroke();
    p.lineWidth = R * 0.024;
    p.beginPath(); p.arc(cx, cy, R * 0.9, 0, Math.PI * 2); p.stroke();
    // Letters round the top, each standing upright on the ring.
    p.fillStyle = rouge; p.textAlign = 'center'; p.textBaseline = 'middle';
    p.font = `bold ${Math.round(R * 0.225)}px "American Typewriter", "Courier New", monospace`;
    const word = 'MANCHESTER', step = 0.285, sweep = step * (word.length - 1);
    for (let i = 0; i < word.length; i++) {
      const theta = -Math.PI / 2 - sweep / 2 + step * i;
      p.save(); p.translate(cx + Math.cos(theta) * R * 0.72, cy + Math.sin(theta) * R * 0.72); p.rotate(theta + Math.PI / 2);
      p.fillText(word[i], 0, 0); p.restore();
    }
    // The date band across the middle.
    p.lineWidth = R * 0.02;
    for (const off of [-R * 0.17, R * 0.17]) { p.beginPath(); p.moveTo(cx - R * 0.5, cy + off); p.lineTo(cx + R * 0.5, cy + off); p.stroke(); }
    p.font = `bold ${Math.round(R * 0.19)}px "American Typewriter", "Courier New", monospace`;
    p.fillText('16 SEP 26', cx, cy + R * 0.01);
    p.font = `${Math.round(R * 0.13)}px "American Typewriter", "Courier New", monospace`;
    p.fillText('BY BEE', cx, cy + R * 0.42);
    // Cancellation waves running off to the right.
    p.lineWidth = R * 0.045; p.lineCap = 'round';
    for (let k = -2; k <= 2; k++) {
      const y = cy + k * R * 0.22;
      p.beginPath();
      for (let x = cx + R * 1.12; x <= side - R * 0.1; x += R * 0.05) {
        const yy = y + Math.sin((x - cx) / (R * 0.18)) * R * 0.05;
        if (x === cx + R * 1.12) p.moveTo(x, yy); else p.lineTo(x, yy);
      }
      p.stroke();
    }
    // Unevenly inked, like something pressed by hand.
    p.setTransform(1, 0, 0, 1, 0, 0);
    p.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 44; i++) {
      const a = noise('erode', i, 0, Math.PI * 2), d = Math.sqrt(noise('erode', 500 + i, 0, 1)) * R * 1.3;
      const rr = noise('erode', 1000 + i, 0.02, 0.09) * R;
      p.fillStyle = `rgba(0,0,0,${noise('erode', 1500 + i, 0.35, 0.9).toFixed(2)})`;
      p.beginPath(); p.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rr, 0, Math.PI * 2); p.fill();
    }
    ctx.globalAlpha = 0.92; ctx.drawImage(pm, 0, 0); ctx.globalAlpha = 1;
  }

  return { draw };
})();
