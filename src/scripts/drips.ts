/** a drip field after Jackson Pollock, Number 7A (1948): seeded skeins of bone, yellow, aluminium and rust that keep arriving. */
import { isReduced } from './motion';
import { rng, seedOf } from './rng';

const PALETTE = ['#ece5d3', '#ece5d3', '#d8b443', '#8f9a9c', '#a2421f', '#3b3836', '#f2efe6'];
type Seg = { x0: number; y0: number; x1: number; y1: number; lw: number; dot?: [number, number, number]; pool?: [number, number, number, number, number] };
type Skein = { col: string; alpha: number; segs: Seg[] };

function makeSkein(w: number, h: number, r: () => number): Skein {
  const col = PALETTE[(r() * PALETTE.length) | 0];
  let x = r() * w, y = h * (0.08 + r() * 0.84);
  let dir = (r() < 0.5 ? 0 : Math.PI) + (r() - 0.5) * 0.9;
  const steps = 60 + ((r() * 160) | 0);
  const base = 0.6 + r() * (r() < 0.15 ? 5 : 2.4);
  const segs: Seg[] = [];
  for (let i = 0; i < steps; i++) {
    dir += (r() - 0.5) * 0.55 + Math.sin(i / (6 + r() * 10)) * 0.12;
    const step = 4 + r() * 9;
    const nx = x + Math.cos(dir) * step, ny = y + Math.sin(dir) * step * 0.7;
    const s: Seg = { x0: x, y0: y, x1: nx, y1: ny, lw: Math.max(0.3, base * (0.35 + Math.abs(Math.sin(i * 0.37 + r())) * 0.9)) };
    if (r() < 0.035) s.dot = [nx + (r() - 0.5) * 14, ny + (r() - 0.5) * 14, r() * 2.2];
    if (r() < 0.008) s.pool = [nx, ny, 2 + r() * 6, 1 + r() * 3, r() * 3];
    segs.push(s);
    x = nx; y = ny;
    if (x < -40 || x > w + 40 || y < -40 || y > h + 40) break;
  }
  return { col, alpha: 0.55 + r() * 0.4, segs };
}

function draw(cx: CanvasRenderingContext2D, k: Skein, from = 0, to = k.segs.length) {
  cx.strokeStyle = k.col; cx.fillStyle = k.col; cx.lineCap = 'round'; cx.globalAlpha = k.alpha;
  for (let i = from; i < Math.min(to, k.segs.length); i++) {
    const s = k.segs[i];
    cx.lineWidth = s.lw;
    cx.beginPath(); cx.moveTo(s.x0, s.y0); cx.lineTo(s.x1, s.y1); cx.stroke();
    if (s.dot) { cx.beginPath(); cx.arc(s.dot[0], s.dot[1], s.dot[2], 0, Math.PI * 2); cx.fill(); }
    if (s.pool) { cx.beginPath(); cx.ellipse(s.pool[0], s.pool[1], s.pool[2], s.pool[3], s.pool[4], 0, Math.PI * 2); cx.fill(); }
  }
  cx.globalAlpha = 1;
}

export function initDrips() {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-drips]').forEach((cv) => {
    if (cv.dataset.drawn) return;
    cv.dataset.drawn = '1';
    const cx = cv.getContext('2d');
    if (!cx) return;
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; cx.scale(dpr, dpr);
    const seed = seedOf(location.pathname);
    const r = rng(seed);
    const n = Math.round((w * h) / 9000);
    for (let i = 0; i < n; i++) draw(cx, makeSkein(w, h, r));
    if (isReduced()) return;
    // a new skein lands now and then, poured in stuttering chunks
    const land = () => {
      if (!document.hidden && !isReduced()) {
        const k = makeSkein(w, h, Math.random);
        let at = 0;
        const pour = () => {
          const next = at + 6 + ((Math.random() * 30) | 0);
          draw(cx, k, at, next);
          at = next;
          if (at < k.segs.length) setTimeout(pour, 40 + Math.random() * 180);
        };
        pour();
      }
      setTimeout(land, 1600 + Math.random() * 4400);
    };
    setTimeout(land, 1200);
  });
}
