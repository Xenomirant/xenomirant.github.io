/** sharp sparks and glints that trail the pointer; a small burst on click. desktop pointers only. */
import { isReduced, onMotion } from './motion';

type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; len: number; star: boolean };
const COLOR = () => getComputedStyle(document.documentElement).getPropertyValue('--amber').trim() || '#f6bd16';
let cv: HTMLCanvasElement | null = null, cx: CanvasRenderingContext2D | null = null;
let ps: P[] = [], raf = 0, lx = 0, ly = 0, acc = 0, lastStar = 0, color = '#f6bd16', dpr = 1;

function size() {
  if (!cv || !cx) return;
  dpr = 1; // a full-screen overlay: hairline sparks don't need retina resolution
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawn(x: number, y: number, n: number, speed: number, dirx = 0, diry = 0) {
  for (let i = 0; i < n && ps.length < 60; i++) {
    const a = Math.atan2(-diry, -dirx) + (Math.random() - 0.5) * (dirx || diry ? 1.6 : Math.PI * 2);
    const s = speed * (0.5 + Math.random());
    const max = 14 + Math.random() * 14;
    ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: max, max, len: 3 + Math.random() * 6, star: false });
  }
}

function frame() {
  raf = 0;
  if (!cx || !cv) return;
  cx.clearRect(0, 0, innerWidth, innerHeight);
  cx.strokeStyle = color; cx.lineCap = 'round';
  for (const p of ps) {
    const t = p.life / p.max;
    cx.globalAlpha = t;
    cx.lineWidth = p.star ? 1 : 1.2;
    cx.beginPath();
    if (p.star) {
      const r = p.len * Math.sin(Math.PI * (1 - t));
      cx.moveTo(p.x - r, p.y); cx.lineTo(p.x + r, p.y);
      cx.moveTo(p.x, p.y - r); cx.lineTo(p.x, p.y + r);
    } else {
      const k = p.len / Math.hypot(p.vx, p.vy || 1e-6);
      cx.moveTo(p.x, p.y); cx.lineTo(p.x - p.vx * k, p.y - p.vy * k);
      p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy = p.vy * 0.92 + 0.06;
    }
    cx.stroke();
    p.life--;
  }
  ps = ps.filter((p) => p.life > 0);
  cx.globalAlpha = 1;
  if (ps.length) raf = requestAnimationFrame(frame);
}
const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

function move(e: PointerEvent) {
  if (isReduced()) return;
  const dx = e.clientX - lx, dy = e.clientY - ly;
  lx = e.clientX; ly = e.clientY;
  acc += Math.hypot(dx, dy);
  if (acc > 26) { acc = 0; spawn(lx, ly, 1 + (Math.random() < 0.4 ? 1 : 0), 1.6, dx, dy); kick(); }
  const now = performance.now();
  if (now - lastStar > 900 && Math.hypot(dx, dy) > 6) {
    lastStar = now;
    ps.push({ x: lx + (Math.random() - 0.5) * 18, y: ly + (Math.random() - 0.5) * 18, vx: 0, vy: 0, life: 22, max: 22, len: 5 + Math.random() * 4, star: true });
    kick();
  }
}

function down(e: PointerEvent) {
  if (isReduced()) return;
  ensure();
  spawn(e.clientX, e.clientY, 9, 2.6); kick();
}

/** the overlay canvas only exists once the pointer has moved */
function ensure() {
  if (cv) return;
  cv = document.createElement('canvas');
  cv.className = 'sparks'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  cx = cv.getContext('2d');
  color = COLOR();
  size();
  addEventListener('resize', size, { passive: true });
}

let bound = false;
export function initSparks() {
  if (bound || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  bound = true;
  document.addEventListener('pointermove', (e) => { if (!isReduced()) { ensure(); move(e); } }, { passive: true });
  document.addEventListener('pointerdown', down, { passive: true });
  onMotion((r) => { if (r) { ps = []; cx?.clearRect(0, 0, innerWidth, innerHeight); } });
}
