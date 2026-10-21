/** page change: the knob's dot turns to the destination zone while the page fades to black, then the next page fades in. */
import { isReduced } from './motion';

const KEY = 'knob:from';
const root = document.documentElement;
const ZONES: [string, number][] = [['/now/', 1], ['/writing/', 2], ['/papers/', 3], ['/projects/', 4], ['/about/', 5], ['/connect/', 6], ['/contact/', 6], ['/future/', 7]];
const zoneFor = (path: string) => ZONES.find(([p]) => path.startsWith(p))?.[1] ?? (path === '/' ? 0 : undefined);
const here = () => { const z = root.dataset.zone; return z === undefined || z === '' ? undefined : Number(z); };
const dots = () => document.querySelectorAll<SVGGElement>('[data-knob-dot]');
const setAngle = (z: number) => dots().forEach((d) => d.style.setProperty('--a', `${z * 36}deg`));

let bound = false;

/** going to the future: the knob stays put, its dot turns to 7 and a few thin bolts crackle off the ring at an uneven
    frame rate, leaving brief afterimages; then the page steps down to black. */
function blowup(href: string) {
  const knob = document.querySelector<SVGElement>('.rail .sigil') ?? document.querySelector<SVGElement>('.topline .sigil');
  const r = knob?.getBoundingClientRect() ?? { left: 40, top: 40, width: 34, height: 34 } as DOMRect;
  const cv = document.createElement('canvas');
  cv.className = 'blowup';
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const cx = cv.getContext('2d')!;
  cx.scale(dpr, dpr);
  const bolt = getComputedStyle(root).getPropertyValue('--bolt').trim() || '#ffe14d';
  const x = r.left + r.width / 2, y = r.top + r.height / 2, R = r.width / 2;
  const D = 880, t0 = performance.now();
  setAngle(7);
  root.classList.add('leaving');
  let last = 0;

  const jag = (xa: number, ya: number, xb: number, yb: number, rough: number, depth: number, pts: number[][]) => {
    if (depth === 0) { pts.push([xb, yb]); return; }
    const mx = (xa + xb) / 2 + (Math.random() - 0.5) * rough, my = (ya + yb) / 2 + (Math.random() - 0.5) * rough;
    jag(xa, ya, mx, my, rough / 2, depth - 1, pts); jag(mx, my, xb, yb, rough / 2, depth - 1, pts);
  };
  const strike = (t: number) => {
    const th = Math.random() * Math.PI * 2;
    const sx = x + R * Math.cos(th), sy = y + R * Math.sin(th);
    const L = R * (1 + Math.random() * (1.5 + t * 4));
    const pts: number[][] = [[sx, sy]];
    jag(sx, sy, sx + Math.cos(th) * L, sy + Math.sin(th) * L, L * 0.45, 4, pts);
    cx.beginPath(); pts.forEach(([px, py], j) => (j ? cx.lineTo(px, py) : cx.moveTo(px, py)));
    cx.strokeStyle = bolt; cx.lineWidth = 1.3; cx.stroke();
    cx.strokeStyle = '#fffbe6'; cx.lineWidth = 0.5; cx.stroke();
  };

  const frame = (now: number) => {
    const t = Math.min(1, (now - t0) / D);
    // laggy: hold each frame for an uneven 60-150 ms
    if (t < 1 && now - last < 60 + Math.random() * 90) { requestAnimationFrame(frame); return; }
    last = now;
    // afterimage: the previous frame fades instead of vanishing
    cx.globalCompositeOperation = 'destination-out';
    cx.fillStyle = 'rgba(0,0,0,0.65)'; cx.fillRect(0, 0, innerWidth, innerHeight);
    cx.globalCompositeOperation = 'source-over';
    // the last third steps down to black
    if (t > 0.62) { cx.globalAlpha = Math.min(1, Math.ceil((t - 0.62) / 0.38 * 3) / 3); cx.fillStyle = '#000'; cx.fillRect(0, 0, innerWidth, innerHeight); cx.globalAlpha = 1; }
    if (t < 0.9) for (let i = 0, n = 1 + ((Math.random() * (1 + t * 2.5)) | 0); i < n; i++) strike(t);
    if (t < 1) requestAnimationFrame(frame);
    else location.href = href;
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
    if (to === 7 && here() !== 7) { blowup(url.href); return; }
    if (to !== undefined) setAngle(to);
    root.classList.add('leaving');
    setTimeout(() => { location.href = url.href; }, 420);
  });
}
