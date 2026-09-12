const { createCanvas } = require('canvas');
const fs = require('fs');

const W = 2400;
const H = 3200;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

const BG = '#070910';
const ACCENT = '#d4a84a';
const ACCENT_B = '#f0c960';
const ACCENT2 = '#3a8a9e';
const LINE = '#1c2030';
const LINE_L = '#2a3048';
const TEXT_D = '#404868';
const TEXT_M = '#606888';
const TEXT_L = '#909ab0';
const WHITE = '#dce0ec';

function dot(x, y, r, fill, a=1) {
  ctx.save(); ctx.globalAlpha=a; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill(); ctx.restore();
}
function circ(x, y, r, stroke, lw=1, a=1) {
  ctx.save(); ctx.globalAlpha=a; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.stroke(); ctx.restore();
}
function line(x1,y1,x2,y2,stroke,lw=1,a=1) {
  ctx.save(); ctx.globalAlpha=a; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.stroke(); ctx.restore();
}
function arc(x,y,r,sa,ea,color,lw,a) {
  ctx.save(); ctx.globalAlpha=a; ctx.beginPath(); ctx.arc(x,y,r,sa,ea); ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.stroke(); ctx.restore();
}

// BG
ctx.fillStyle = BG; ctx.fillRect(0,0,W,H);

// Warm radial glow
let g = ctx.createRadialGradient(W*0.48, H*0.34, 0, W*0.48, H*0.34, 1000);
g.addColorStop(0, 'rgba(50,42,20,0.5)');
g.addColorStop(0.3, 'rgba(25,28,40,0.25)');
g.addColorStop(1, 'rgba(7,9,16,0)');
ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

// Second cool glow in lower section
g = ctx.createRadialGradient(W*0.5, H*0.7, 0, W*0.5, H*0.7, 800);
g.addColorStop(0, 'rgba(30,40,55,0.2)');
g.addColorStop(1, 'rgba(7,9,16,0)');
ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

const M = 90; // margin

// === GRID ===
for (let y = M; y <= H-M; y += 32) {
  const a = (y-M) % 160===0 ? 0.22 : (y-M)%64===0 ? 0.10 : 0.04;
  line(M, y, W-M, y, LINE, 0.5, a);
}
for (let x = M; x <= W-M; x += 32) {
  const a = (x-M) % 160===0 ? 0.22 : (x-M)%64===0 ? 0.10 : 0.04;
  line(x, M, x, H-M, LINE, 0.5, a);
}

const cx = W * 0.48;
const cy = H * 0.34;

// === CONCENTRIC RINGS — 28 rings, dense ===
for (let i = 0; i < 28; i++) {
  const r = 55 + i * 33;
  const a = i < 6 ? 0.28 - i*0.025 : Math.max(0.04, 0.18 - i*0.006);
  const lw = i < 4 ? 1.6 : i < 10 ? 0.9 : 0.5;
  circ(cx, cy, r, i < 6 ? LINE_L : LINE, lw, a);
}

// Golden inner rings
for (let i = 0; i < 10; i++) {
  const r = 22 + i * 23;
  circ(cx, cy, r, ACCENT, 0.5, 0.04 + i * 0.012);
}

// === DENSE RADIAL TICKS ===
for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 54) {
  const iR = 230, oR = 258 + Math.sin(angle * 9) * 18;
  const x1=cx+Math.cos(angle)*iR, y1=cy+Math.sin(angle)*iR;
  const x2=cx+Math.cos(angle)*oR, y2=cy+Math.sin(angle)*oR;
  line(x1,y1,x2,y2, LINE_L, 0.5, 0.22);
}

// Second ring of ticks
for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 36) {
  const iR = 380, oR = 402 + Math.sin(angle * 6) * 12;
  const x1=cx+Math.cos(angle)*iR, y1=cy+Math.sin(angle)*iR;
  const x2=cx+Math.cos(angle)*oR, y2=cy+Math.sin(angle)*oR;
  line(x1,y1,x2,y2, LINE, 0.4, 0.15);
}

// Axis lines — cardinal directions extended
[0, Math.PI/2, Math.PI, Math.PI*1.5].forEach(angle => {
  const x1=cx+Math.cos(angle)*260, y1=cy+Math.sin(angle)*260;
  const x2=cx+Math.cos(angle)*380, y2=cy+Math.sin(angle)*380;
  line(x1,y1,x2,y2, TEXT_D, 1.2, 0.4);
});

// Diagonal axes
[Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4].forEach(angle => {
  const x1=cx+Math.cos(angle)*280, y1=cy+Math.sin(angle)*280;
  const x2=cx+Math.cos(angle)*340, y2=cy+Math.sin(angle)*340;
  line(x1,y1,x2,y2, LINE_L, 0.6, 0.2);
});

// === ARC ORBITS ===
arc(cx,cy,370, 0.2, 1.9, ACCENT, 1.8, 0.25);
arc(cx,cy,370, 3.0, 4.1, ACCENT, 1.0, 0.15);
arc(cx,cy,460, 2.0, 4.4, ACCENT2, 1.2, 0.2);
arc(cx,cy,460, -0.6, 0.3, ACCENT2, 0.6, 0.1);
arc(cx,cy,550, 4.0, 5.8, ACCENT, 1.0, 0.15);
arc(cx,cy,640, -1.2, 0.5, ACCENT2, 0.8, 0.12);
arc(cx,cy,720, 1.2, 2.4, ACCENT, 0.6, 0.08);
arc(cx,cy,800, 3.4, 4.6, ACCENT2, 0.5, 0.06);

// Small dots at arc endpoints
[[370,0.2],[370,1.9],[460,2.0],[460,4.4],[550,4.0],[550,5.8],[640,-1.2],[640,0.5]].forEach(([r,a])=>{
  dot(cx+Math.cos(a)*r, cy+Math.sin(a)*r, 2.5, ACCENT, 0.4);
});

// === CENTRAL GLOW ===
g = ctx.createRadialGradient(cx,cy,0,cx,cy,260);
g.addColorStop(0, 'rgba(212,168,74,0.15)');
g.addColorStop(0.2, 'rgba(212,168,74,0.06)');
g.addColorStop(0.6, 'rgba(212,168,74,0.02)');
g.addColorStop(1, 'rgba(212,168,74,0)');
ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,260,0,Math.PI*2); ctx.fill();

g = ctx.createRadialGradient(cx,cy,0,cx,cy,50);
g.addColorStop(0, 'rgba(240,201,96,0.35)');
g.addColorStop(1, 'rgba(240,201,96,0)');
ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,50,0,Math.PI*2); ctx.fill();

dot(cx,cy, 8, ACCENT_B, 1);
dot(cx,cy, 4, '#fff', 1);
circ(cx,cy, 16, ACCENT, 1.4, 0.55);
circ(cx,cy, 30, ACCENT, 0.8, 0.3);

// === NETWORK NODES ===
const nodes = [
  {x:460,y:580,r:5,a:1}, {x:700,y:440,r:4,a:0}, {x:1700,y:480,r:5,a:1}, {x:1940,y:740,r:4,a:0},
  {x:300,y:1060,r:3.5,a:0}, {x:2100,y:1000,r:4.5,a:1}, {x:560,y:1560,r:4,a:0}, {x:1840,y:1460,r:4,a:1},
  {x:1100,y:1760,r:4.5,a:0}, {x:360,y:2160,r:3.5,a:0}, {x:2040,y:2040,r:4,a:1}, {x:1200,y:2420,r:3.5,a:0},
  {x:860,y:860,r:4,a:1}, {x:1540,y:810,r:3.5,a:0},
];

const conns = [[0,1],[1,12],[2,3],[3,5],[12,13],[13,2],[4,6],[5,7],[6,8],[7,10],[8,11],[9,11],[10,11],[0,4],[2,5],[7,8],[6,9],[8,10]];

conns.forEach(([i,j]) => {
  line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y, LINE_L, 0.6, 0.18);
});

// Dashed lines to center
[0,1,2,3,12,13].forEach(i => {
  const n=nodes[i], dx=cx-n.x, dy=cy-n.y;
  for(let s=0;s<16;s+=2) {
    const t1=s/16, t2=(s+1)/16;
    line(n.x+dx*t1, n.y+dy*t1, n.x+dx*t2, n.y+dy*t2, LINE_L, 0.4, 0.10);
  }
});

nodes.forEach(n => {
  const c = n.a ? ACCENT : ACCENT2;
  dot(n.x, n.y, n.r, c, 0.85);
  circ(n.x, n.y, n.r+9, c, 0.5, 0.3);
  const ng = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,30);
  ng.addColorStop(0, n.a ? 'rgba(212,168,74,0.08)' : 'rgba(58,138,158,0.08)');
  ng.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(n.x,n.y,30,0,Math.PI*2); ctx.fill();
});

// === DOT MATRIX ===
for (let y = H*0.56; y < H*0.76; y += 12) {
  for (let x = W*0.10; x < W*0.90; x += 12) {
    const dx=x-cx, dy=y-cy;
    const d = Math.sqrt(dx*dx+dy*dy);
    const w = Math.sin(x*0.006+y*0.004)*Math.cos(y*0.005-x*0.003);
    const v = (w*0.5+0.5) * Math.max(0, 1 - d/2200);
    if (v > 0.12) {
      dot(x, y, 0.6+v*2.0, TEXT_M, v*0.30);
    }
  }
}

// === HORIZONTAL SCAN LINES ===
for (let i=0; i<7; i++) {
  const y = H*0.78 + i*24;
  const sx = 180 + Math.sin(i*1.8)*120;
  const ex = W - 180 - Math.cos(i*2.3)*160;
  line(sx, y, ex, y, LINE, 0.5, 0.10);
  for (let x = sx; x < ex; x += 40 + Math.sin(x*0.015)*15) {
    line(x, y-3, x, y+3, LINE_L, 0.4, 0.15);
  }
}

// === TYPOGRAPHY ===
ctx.textAlign='left';
ctx.font='bold 14px sans-serif'; ctx.fillStyle=TEXT_D; ctx.globalAlpha=0.65;
ctx.fillText('SIG.GEN // 001', M+10, M+30);
ctx.font='11px sans-serif'; ctx.globalAlpha=0.45;
ctx.fillText('PROPAGATION FIELD \u2014 EMERGENCE THRESHOLD', M+10, M+50);

ctx.textAlign='right'; ctx.font='11px sans-serif'; ctx.fillStyle=TEXT_D; ctx.globalAlpha=0.45;
ctx.fillText('48.8566\u00b0N  2.3522\u00b0E', W-M-10, M+30);
ctx.fillText('EPOCH: 2026.117', W-M-10, M+50);
ctx.globalAlpha=1;

// Title
ctx.textAlign='center';
ctx.font='100 84px sans-serif'; ctx.fillStyle=WHITE; ctx.globalAlpha=0.94;
ctx.fillText('SIGNAL', cx, H*0.505);
ctx.globalAlpha=1;

ctx.font='300 17px sans-serif'; ctx.fillStyle=TEXT_L; ctx.globalAlpha=0.6;
ctx.fillText('G  E  N  E  S  I  S', cx, H*0.505+46);
ctx.globalAlpha=1;

line(cx-130, H*0.505+64, cx+130, H*0.505+64, ACCENT, 0.6, 0.25);

ctx.font='300 13px sans-serif'; ctx.fillStyle=TEXT_M; ctx.globalAlpha=0.5;
ctx.fillText('where potential becomes signal', cx, H*0.505+92);
ctx.globalAlpha=1;

// Bottom bar
line(M, H*0.87, W-M, H*0.87, LINE_L, 0.6, 0.3);

ctx.textAlign='left'; ctx.font='10px sans-serif';
const labels=['NETWORK','PROPAGATION','THRESHOLD','EMERGENCE','SIGNAL'];
const sp=(W-2*M)/labels.length;
labels.forEach((l,i)=>{
  const x=M+i*sp;
  const last=i===4;
  dot(x, H*0.895, 3, last?ACCENT:TEXT_D, last?0.8:0.45);
  ctx.fillStyle=last?ACCENT:TEXT_D; ctx.globalAlpha=last?0.75:0.45;
  ctx.fillText(l, x+14, H*0.895+4); ctx.globalAlpha=1;
});

ctx.textAlign='right'; ctx.font='9px sans-serif'; ctx.fillStyle=TEXT_D; ctx.globalAlpha=0.3;
ctx.fillText('FIELD STUDY NO. 001  \u2014  FIRST TRANSMISSION', W-M-10, H*0.93);
ctx.globalAlpha=1;

// Side text
ctx.save(); ctx.translate(48,H*0.5); ctx.rotate(-Math.PI/2);
ctx.font='8px sans-serif'; ctx.fillStyle=TEXT_D; ctx.globalAlpha=0.22; ctx.textAlign='center';
ctx.fillText('SIGNAL GENESIS  \u00b7  EMERGENCE CARTOGRAPHY  \u00b7  2026',0,0);
ctx.restore();

ctx.save(); ctx.translate(W-48,H*0.5); ctx.rotate(Math.PI/2);
ctx.font='8px sans-serif'; ctx.fillStyle=TEXT_D; ctx.globalAlpha=0.22; ctx.textAlign='center';
ctx.fillText('THRESHOLD MAPPING  \u00b7  FIELD OBSERVATION  \u00b7  SERIES I',0,0);
ctx.restore();

// Corner brackets
const bl=44;
[[M,M,1,1],[W-M,M,-1,1],[M,H-M,1,-1],[W-M,H-M,-1,-1]].forEach(([x,y,dx,dy])=>{
  line(x,y,x+bl*dx,y,TEXT_D,1,0.25);
  line(x,y,x,y+bl*dy,TEXT_D,1,0.25);
});

// Cross markers
[[200,280],[2200,280],[200,2920],[2200,2920],[cx-520,cy],[cx+520,cy],[cx,cy-440],[cx,cy+440],[W*0.24,H*0.69],[W*0.76,H*0.69]].forEach(([x,y])=>{
  line(x-8,y,x+8,y,TEXT_D,0.6,0.25);
  line(x,y-8,x,y+8,TEXT_D,0.6,0.25);
});

// Export
fs.writeFileSync('C:\\Users\\Queiros\\Documents\\Projetos Sites\\Satão\\Satão.png', canvas.toBuffer('image/png'));
console.log('Done: Satão.png');
