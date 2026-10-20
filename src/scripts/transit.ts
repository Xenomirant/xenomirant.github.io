/** page change: the knob's dot turns to the destination zone while the page fades to black, then the next page fades in. */
import { isReduced } from './motion';

const KEY = 'knob:from';
const root = document.documentElement;
const ZONES: [string, number][] = [['/now/', 1], ['/writing/', 2], ['/papers/', 3], ['/projects/', 4], ['/about/', 5], ['/contact/', 6], ['/future/', 7]];
const zoneFor = (path: string) => ZONES.find(([p]) => path.startsWith(p))?.[1] ?? (path === '/' ? 0 : undefined);
const here = () => { const z = root.dataset.zone; return z === undefined || z === '' ? undefined : Number(z); };
const dots = () => document.querySelectorAll<SVGGElement>('[data-knob-dot]');
const setAngle = (z: number) => dots().forEach((d) => d.style.setProperty('--a', `${z * 36}deg`));

let bound = false;

/** going to the future: the knob leaves the rail, swells to the centre and throws laggy lightning, then the page goes black. */
function blowup(href: string, from?: number) {
  const knob = document.querySelector<SVGElement>('.rail .sigil') ?? document.querySelector<SVGElement>('.topline .sigil');
  const r = knob?.getBoundingClientRect() ?? { left: 40, top: 40, width: 34, height: 34 } as DOMRect;
  const cv = document.createElement('canvas');
  cv.className = 'blowup';
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const cx = cv.getContext('2d')!;
  cx.scale(dpr, dpr);
  const css = getComputedStyle(root);
  const ink = css.getPropertyValue('--ink').trim() || '#d9d4c7';
  const bolt = '#ffe14d', dot = '#ff3b2a';
  const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2, R0 = r.width / 2 * 0.8;
  const x1 = innerWidth / 2, y1 = innerHeight / 2, R1 = Math.min(innerWidth, innerHeight) * 0.3;
  const a0 = ((from ?? 0) * 36 - 90) * Math.PI / 180, a1 = (7 * 36 - 90 + 360) * Math.PI / 180;
  const D = 1150, t0 = performance.now();
  root.classList.add('leaving');
  let last = 0;

  const jag = (xa: number, ya: number, xb: number, yb: number, rough: number, depth: number, pts: number[][]) => {
    if (depth === 0) { pts.push([xb, yb]); return; }
    const mx = (xa + xb) / 2 + (Math.random() - 0.5) * rough, my = (ya + yb) / 2 + (Math.random() - 0.5) * rough;
    jag(xa, ya, mx, my, rough / 2, depth - 1, pts); jag(mx, my, xb, yb, rough / 2, depth - 1, pts);
  };

  const frame = (now: number) => {
    const t = Math.min(1, (now - t0) / D);
    // laggy: skip most frames, hold some longer
    if (t < 1 && now - last < 55 + Math.random() * 110) { requestAnimationFrame(frame); return; }
    last = now;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e;
    const R = R0 + (R1 - R0) * Math.min(1, e * 1.15) * (1 + Math.sin(t * 40) * 0.04 * t);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    cx.globalAlpha = Math.min(1, t * 1.8); cx.fillStyle = '#000'; cx.fillRect(0, 0, innerWidth, innerHeight); cx.globalAlpha = 1;
    if (Math.random() < 0.14 * t) { cx.fillStyle = bolt; cx.globalAlpha = 0.12; cx.fillRect(0, 0, innerWidth, innerHeight); cx.globalAlpha = 1; }
    // knob
    cx.strokeStyle = ink; cx.lineWidth = Math.max(1, R / 40);
    cx.beginPath(); cx.arc(x, y, R, 0, Math.PI * 2); cx.stroke();
    cx.globalAlpha = 0.5;
    for (let i = 0; i < 5; i++) {
      const p = (-90 + i * 36) * Math.PI / 180, q = (-90 + (9 - i) * 36) * Math.PI / 180;
      cx.beginPath(); cx.moveTo(x + R * Math.cos(p), y + R * Math.sin(p)); cx.lineTo(x + R * Math.cos(q), y + R * Math.sin(q)); cx.stroke();
    }
    cx.globalAlpha = 1;
    const a = a0 + (a1 - a0) * e;
    cx.fillStyle = dot; cx.beginPath(); cx.arc(x + R * Math.cos(a), y + R * Math.sin(a), Math.max(4, R * 0.09), 0, Math.PI * 2); cx.fill();
    // lightning from the ring
    const n = 2 + ((Math.random() * (3 + t * 6)) | 0);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2;
      const sx = x + R * Math.cos(th), sy = y + R * Math.sin(th);
      const L = R * (0.5 + Math.random() * (1 + t * 2.5));
      const ex = sx + Math.cos(th + (Math.random() - 0.5) * 0.9) * L, ey = sy + Math.sin(th + (Math.random() - 0.5) * 0.9) * L;
      const pts: number[][] = [[sx, sy]];
      jag(sx, sy, ex, ey, L * 0.35, 5, pts);
      cx.strokeStyle = bolt; cx.lineWidth = 2.2 + Math.random() * 1.8; cx.lineJoin = 'miter';
      cx.beginPath(); pts.forEach(([px, py], j) => (j ? cx.lineTo(px, py) : cx.moveTo(px, py))); cx.stroke();
      cx.strokeStyle = '#fffbe6'; cx.lineWidth = 0.8; cx.stroke();
    }
    if (t < 1) requestAnimationFrame(frame);
    else { location.href = href; }
  };
  requestAnimationFrame(frame);
}

export function initTransit() {
  // arrival: start the dot where the previous page left it, then let it settle.
  if (root.classList.contains('arriving')) {
    let from: number | undefined;
    try { const v = sessionStorage.getItem(KEY); if (v !== null && v !== '') from = Number(v); sessionStorage.removeItem(KEY); } catch { /* ignore */ }
    const to = here();
    if (from !== undefined && to !== undefined) setAngle(from);
    void root.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.remove('arriving');
      if (to !== undefined) setAngle(to);
    }));
  }
  if (bound) return;
  bound = true;

  addEventListener('pageshow', (e) => { if (e.persisted) { root.classList.remove('leaving', 'arriving'); document.querySelectorAll('canvas.blowup').forEach((c) => c.remove()); } });

  document.addEventListener('click', (e) => {
    if (isReduced() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;
    if (/\.(pdf|xml|txt|png|jpe?g)$/i.test(url.pathname)) return;
    e.preventDefault();
    const to = a.dataset.zone !== undefined ? Number(a.dataset.zone) : zoneFor(url.pathname);
    try { const z = here(); sessionStorage.setItem(KEY, z === undefined ? '' : String(z)); } catch { /* ignore */ }
    if (to === 7 && here() !== 7) { blowup(url.href, here()); return; }
    if (to !== undefined) setAngle(to);
    root.classList.add('leaving');
    setTimeout(() => { location.href = url.href; }, 420);
  });
}
