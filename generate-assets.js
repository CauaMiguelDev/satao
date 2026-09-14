const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const RED = '#d91620';
const RED_DEEP = '#a80e17';
const RED_HOT = '#ff5c5c';
const INK = '#14090b';
const INK_SOFT = '#281317';
const PAPER = '#f2e8dd';
const PAPER_MUTED = '#c8b4a7';

function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function blob(ctx, x, y, r, color, alpha, squish = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squish);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.55, rgba(color, alpha * 0.6));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function mist(ctx, cx, cy, r, count, color, alphaMax) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const d = Math.pow(Math.random(), 0.5) * r;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const fall = 1 - d / r;
    const rr = rand(0.6, 2.4);
    ctx.save();
    ctx.globalAlpha = fall * alphaMax * rand(0.4, 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drip(ctx, x, yTop, len, wTop, color, alpha) {
  const yBottom = yTop + len;
  const wBottom = wTop * rand(0.25, 0.5);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - wTop / 2, yTop);
  ctx.lineTo(x + wTop / 2, yTop);
  ctx.quadraticCurveTo(x + wBottom / 2, yBottom - wBottom, x + wBottom / 2, yBottom - wBottom / 2);
  ctx.arc(x, yBottom - wBottom / 2, wBottom / 2, 0, Math.PI);
  ctx.quadraticCurveTo(x - wBottom / 2, yBottom - wBottom, x - wTop / 2, yTop);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function grain(ctx, W, H, count, colors, alpha) {
  for (let i = 0; i < count; i++) {
    const x = rand(0, W), y = rand(0, H);
    ctx.save();
    ctx.globalAlpha = rand(0.15, 1) * alpha;
    ctx.fillStyle = pick(colors);
    ctx.fillRect(x, y, rand(0.6, 1.6), rand(0.6, 1.6));
    ctx.restore();
  }
}

function crack(ctx, x, y, len, color, alpha, lw) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  let cx = x, cy = y;
  const segs = 4 + Math.floor(Math.random() * 4);
  const segLen = len / segs;
  let angle = rand(0, Math.PI * 2);
  for (let i = 0; i < segs; i++) {
    angle += rand(-0.7, 0.7);
    cx += Math.cos(angle) * segLen;
    cy += Math.sin(angle) * segLen;
    ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.restore();
}

function vignette(ctx, W, H, color, strength) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(1, rgba(color, strength));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// rough-edged spray splash: many soft-edged stamps fused into one organic mass
function sprayCluster(ctx, cx, cy, R, color, coreAlpha) {
  const n = Math.round(rand(28, 46));
  for (let i = 0; i < n; i++) {
    const t = Math.pow(Math.random(), 1.7); // bias toward center
    const a = rand(0, Math.PI * 2);
    const d = t * R * 0.7;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const r = (1 - t * 0.5) * rand(R * 0.28, R * 0.55);
    blob(ctx, x, y, r, color, coreAlpha * rand(0.5, 0.85));
  }
  // fine mist fringe carries the rough edge
  mist(ctx, cx, cy, R * 1.55, 360, color, 0.34);
}

// tapered brush/spray stroke stamped along a jittery path — gestural, not lettered
function strokePath(ctx, pts, wStart, wEnd, color, alpha) {
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
    const localT = t * (pts.length - 1) - seg;
    const p0 = pts[seg], p1 = pts[seg + 1];
    const x = p0.x + (p1.x - p0.x) * localT + rand(-6, 6);
    const y = p0.y + (p1.y - p0.y) * localT + rand(-6, 6);
    const w = wStart + (wEnd - wStart) * t;
    const stamps = 2;
    for (let s = 0; s < stamps; s++) {
      const jr = rand(0, w * 0.3);
      const ja = rand(0, Math.PI * 2);
      blob(ctx, x + Math.cos(ja) * jr, y + Math.sin(ja) * jr, rand(w * 0.55, w * 0.9), color, alpha * rand(0.55, 0.9));
    }
  }
}

function filmGrain(canvas, ctx, W, H, amount) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

// ============================================================
// LEGACY MURAL — rich generative spray-paint wall texture
// ============================================================
function makeMural() {
  const W = 2400, H = 1900;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = INK_SOFT;
  ctx.fillRect(0, 0, W, H);

  // broad soft color wash fields (underpaint)
  blob(ctx, W * 0.26, H * 0.32, 780, RED_DEEP, 0.4, 1.15);
  blob(ctx, W * 0.8, H * 0.6, 820, INK, 0.5, 1.0);
  blob(ctx, W * 0.55, H * 0.16, 520, PAPER, 0.05, 1.0);

  // concrete pitting (visible speckle, drawn under the paint)
  grain(ctx, W, H, 90000, [rgba(PAPER_MUTED, 1), rgba(INK, 1)], 0.8);

  // gestural sweeping strokes — wildstyle energy without forming letters
  strokePath(ctx, [
    { x: W * 0.05, y: H * 0.62 }, { x: W * 0.32, y: H * 0.2 }, { x: W * 0.58, y: H * 0.5 }, { x: W * 0.9, y: H * 0.12 },
  ], 90, 30, RED, 0.8);
  strokePath(ctx, [
    { x: W * 0.95, y: H * 0.75 }, { x: W * 0.7, y: H * 0.55 }, { x: W * 0.45, y: H * 0.85 }, { x: W * 0.15, y: H * 0.6 },
  ], 24, 110, RED_HOT, 0.75);
  strokePath(ctx, [
    { x: W * 0.1, y: H * 0.15 }, { x: W * 0.35, y: H * 0.05 }, { x: W * 0.5, y: H * 0.3 },
  ], 60, 12, PAPER, 0.3);

  // rough spray-can splatter clusters
  const spots = [
    { x: 0.16, y: 0.26, r: 220, c: RED },
    { x: 0.32, y: 0.48, r: 260, c: RED_HOT },
    { x: 0.5, y: 0.2, r: 190, c: RED_DEEP },
    { x: 0.64, y: 0.42, r: 300, c: RED },
    { x: 0.82, y: 0.24, r: 220, c: RED_HOT },
    { x: 0.86, y: 0.58, r: 240, c: RED_DEEP },
    { x: 0.4, y: 0.74, r: 200, c: RED },
    { x: 0.7, y: 0.8, r: 220, c: PAPER },
    { x: 0.1, y: 0.72, r: 160, c: RED_HOT },
  ];
  spots.forEach((s) => {
    const x = s.x * W, y = s.y * H;
    sprayCluster(ctx, x, y, s.r, s.c, 0.9);
  });

  // heavy drips falling from splatters
  spots.forEach((s) => {
    if (Math.random() < 0.75) {
      const x = s.x * W + rand(-s.r * 0.35, s.r * 0.35);
      const yTop = s.y * H + s.r * 0.15;
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        drip(ctx, x + rand(-50, 50), yTop, rand(150, 480), rand(14, 40), s.c, rand(0.7, 0.95));
      }
    }
  });

  // fine overspray mist for cohesion between clusters
  for (let i = 0; i < 24; i++) {
    mist(ctx, rand(0, W), rand(0, H), rand(90, 260), 90, pick([RED, RED_HOT, RED_DEEP]), 0.2);
  }

  // diagonal scratch texture
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  for (let i = -H; i < W; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H * 0.55, H);
    ctx.stroke();
  }
  ctx.restore();

  // cracks / wear marks
  for (let i = 0; i < 30; i++) {
    crack(ctx, rand(0, W), rand(0, H), rand(40, 170), INK, rand(0.3, 0.55), rand(1.2, 2.8));
  }
  for (let i = 0; i < 14; i++) {
    crack(ctx, rand(0, W), rand(0, H), rand(30, 90), PAPER_MUTED, rand(0.2, 0.4), 1.2);
  }

  vignette(ctx, W, H, INK, 0.4);
  filmGrain(canvas, ctx, W, H, 9);

  fs.writeFileSync(path.join(__dirname, 'site/media/legacy-mural.jpg'), canvas.toBuffer('image/jpeg', { quality: 0.8 }));
  console.log('legacy-mural.jpg done');
}

// ============================================================
// CLOSING BURST — radial spray explosion for the closing section
// ============================================================
function makeBurst() {
  const W = 2000, H = 2000;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const cx = W / 2, cy = H / 2;

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  const ambient = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.62);
  ambient.addColorStop(0, rgba(RED_DEEP, 0.35));
  ambient.addColorStop(1, rgba(INK, 0));
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, W, H);

  // radiating streaks
  const streakCount = 46;
  for (let i = 0; i < streakCount; i++) {
    const angle = (i / streakCount) * Math.PI * 2 + rand(-0.05, 0.05);
    const len = rand(W * 0.28, W * 0.48);
    const wStart = rand(10, 34);
    const color = pick([RED, RED_HOT, RED_DEEP]);
    const x1 = cx + Math.cos(angle) * (W * 0.06);
    const y1 = cy + Math.sin(angle) * (W * 0.06);
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;
    const nx = -Math.sin(angle), ny = Math.cos(angle);
    ctx.save();
    ctx.globalAlpha = rand(0.4, 0.75);
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, rgba(color, 0.9));
    grad.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x1 + nx * wStart / 2, y1 + ny * wStart / 2);
    ctx.lineTo(x1 - nx * wStart / 2, y1 - ny * wStart / 2);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // satellite droplet at streak end
    if (Math.random() < 0.6) {
      blob(ctx, x2 + rand(-20, 20), y2 + rand(-20, 20), rand(14, 36), color, 0.7);
    }
  }

  // bright core
  blob(ctx, cx, cy, W * 0.16, RED_HOT, 0.95);
  blob(ctx, cx, cy, W * 0.07, PAPER, 0.4);

  // mist cloud around core
  mist(ctx, cx, cy, W * 0.42, 1400, RED, 0.35);
  mist(ctx, cx, cy, W * 0.3, 900, RED_HOT, 0.3);

  vignette(ctx, W, H, INK, 0.7);
  filmGrain(canvas, ctx, W, H, 8);

  fs.writeFileSync(path.join(__dirname, 'site/media/closing-burst.jpg'), canvas.toBuffer('image/jpeg', { quality: 0.82 }));
  console.log('closing-burst.jpg done');
}

// ============================================================
// HERO BACKGROUND — full-bleed spray wall, calm bottom-left
// (headline sits bottom-left under the scrim; keep that corner
// less busy so the wordmark reads clean)
// ============================================================
function makeHero() {
  const W = 3840, H = 2160;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  blob(ctx, W * 0.72, H * 0.28, 1400, RED_DEEP, 0.55, 1.1);
  blob(ctx, W * 0.92, H * 0.75, 1100, INK_SOFT, 0.6, 1.0);
  blob(ctx, W * 0.15, H * 0.12, 700, RED, 0.18, 1.0);

  grain(ctx, W, H, 140000, [rgba(PAPER_MUTED, 1), rgba(INK, 1)], 0.7);

  strokePath(ctx, [
    { x: W * 0.98, y: H * 0.05 }, { x: W * 0.7, y: H * 0.3 }, { x: W * 0.85, y: H * 0.6 }, { x: W * 0.55, y: H * 0.5 },
  ], 140, 40, RED, 0.75);
  strokePath(ctx, [
    { x: W * 0.4, y: H * 0.0 }, { x: W * 0.6, y: H * 0.22 }, { x: W * 0.5, y: H * 0.42 },
  ], 30, 130, RED_HOT, 0.6);
  strokePath(ctx, [
    { x: W * 0.05, y: H * 0.9 }, { x: W * 0.25, y: H * 0.78 }, { x: W * 0.18, y: H * 0.6 },
  ], 70, 14, PAPER, 0.16);

  const spots = [
    { x: 0.82, y: 0.18, r: 320, c: RED_HOT },
    { x: 0.94, y: 0.42, r: 260, c: RED },
    { x: 0.68, y: 0.55, r: 300, c: RED_DEEP },
    { x: 0.5, y: 0.14, r: 220, c: RED },
    { x: 0.9, y: 0.85, r: 260, c: RED_HOT },
    { x: 0.08, y: 0.15, r: 180, c: RED_DEEP },
  ];
  spots.forEach((s) => sprayCluster(ctx, s.x * W, s.y * H, s.r, s.c, 0.85));
  spots.forEach((s) => {
    if (Math.random() < 0.7) {
      const x = s.x * W + rand(-s.r * 0.3, s.r * 0.3);
      const yTop = s.y * H + s.r * 0.2;
      drip(ctx, x, yTop, rand(140, 420), rand(12, 34), s.c, rand(0.6, 0.9));
    }
  });

  for (let i = 0; i < 20; i++) {
    mist(ctx, rand(W * 0.35, W), rand(0, H), rand(100, 260), 80, pick([RED, RED_HOT, RED_DEEP]), 0.18);
  }

  // extra darkening in the bottom-left quiet zone, on top of the shared scrim
  const quiet = ctx.createRadialGradient(W * 0.08, H * 0.95, 0, W * 0.08, H * 0.95, W * 0.6);
  quiet.addColorStop(0, rgba(INK, 0.55));
  quiet.addColorStop(1, rgba(INK, 0));
  ctx.fillStyle = quiet;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 24; i++) {
    crack(ctx, rand(0, W), rand(0, H), rand(50, 160), INK, rand(0.25, 0.45), rand(1.2, 2.4));
  }

  vignette(ctx, W, H, INK, 0.35);
  filmGrain(canvas, ctx, W, H, 8);

  fs.writeFileSync(path.join(__dirname, 'site/media/hero-bg-4k.jpg'), canvas.toBuffer('image/jpeg', { quality: 0.85 }));

  const small = createCanvas(1920, 1080);
  small.getContext('2d').drawImage(canvas, 0, 0, 1920, 1080);
  fs.writeFileSync(path.join(__dirname, 'site/media/hero-bg-2k.jpg'), small.toBuffer('image/jpeg', { quality: 0.82 }));

  console.log('hero-bg-2k.jpg + hero-bg-4k.jpg done');
}

makeMural();
makeBurst();
makeHero();
