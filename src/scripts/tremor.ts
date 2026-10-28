/** past and future pages: spikes from the edges and a laggy tremble on the background art. present pages stay still. */
import { isReduced, onMotion } from './motion';
import { rng, seedOf } from './rng';

const SVG = 'http://www.w3.org/2000/svg';
let timer = 0, shake = 0, running = false;

function makeSpikes(svg: SVGSVGElement, era: string) {
  const w = innerWidth, h = innerHeight;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.replaceChildren();
  const r = rng(seedOf(location.pathname + era));
  const small = w < 700;
  const n = era === 'future' ? (small ? 14 : 30) : (small ? 8 : 16);
  const maxL = era === 'future' ? 0.34 : 0.22;
  for (let i = 0; i < n; i++) {
    // pick an edge; avoid the left rail on desktop
    const edge = r() < 0.38 ? 'right' : r() < 0.55 ? 'top' : r() < 0.75 ? 'bottom' : 'left';
    let x = 0, y = 0, base = 0;
    if (edge === 'right') { x = w; y = r() * h; base = Math.PI; }
    if (edge === 'left') { x = small ? 0 : 230; y = r() * h; base = 0; }
    if (edge === 'top') { x = (small ? 0 : 230) + r() * (w - (small ? 0 : 230)); y = 0; base = Math.PI / 2; }
    if (edge === 'bottom') { x = (small ? 0 : 230) + r() * (w - (small ? 0 : 230)); y = h; base = -Math.PI / 2; }
    const ang = base + (r() - 0.5) * 1.1;
    const len = (0.06 + r() * maxL) * Math.min(w, h) * (r() < 0.12 ? 1.8 : 1);
    const half = 0.8 + r() * (era === 'future' ? 3.2 : 2.2);
    const tip = [x + Math.cos(ang) * len, y + Math.sin(ang) * len];
    const nx = -Math.sin(ang) * half, ny = Math.cos(ang) * half;
    const g = document.createElementNS(SVG, 'g');
    g.setAttribute('class', 'spike');
    g.style.transformOrigin = `${x}px ${y}px`;
    g.style.setProperty('--s', String(0.4 + r() * 0.8));
    const p = document.createElementNS(SVG, 'polygon');
    p.setAttribute('points', `${x + nx},${y + ny} ${x - nx},${y - ny} ${tip[0]},${tip[1]}`);
    const hot = r() < (era === 'future' ? 0.45 : 0.3);
    p.setAttribute('class', hot ? 'hot' : r() < 0.15 && era === 'future' ? 'bolt' : 'cold');
    g.appendChild(p);
    svg.appendChild(g);
  }
}

// costs: every spike change repaints the full-screen spike layer, so spikes move a few times a second, not every frame;
// the background art only jitters in short bursts (a transform on its own layer, cheap) and rests in between.
function tick() {
  if (!running) return;
  const spikes = document.querySelectorAll<SVGGElement>('.spikes .spike');
  const k = 1 + ((Math.random() * 3) | 0);
  for (let i = 0; i < k && spikes.length; i++) {
    const s = spikes[(Math.random() * spikes.length) | 0];
    s.style.setProperty('--s', (Math.random() < 0.15 ? 0.05 : 0.25 + Math.random() * 1.15).toFixed(2));
  }
  if (Math.random() < 0.3) burst();
  // laggy cadence: mostly 250-600 ms, sometimes a long stall
  const next = Math.random() < 0.15 ? 900 + Math.random() * 1400 : 250 + Math.random() * 350;
  timer = window.setTimeout(tick, next);
}

/** a few quick jolts of the background art and the title, then back to rest */
function burst() {
  const future = document.documentElement.dataset.era === 'future';
  const amp = (future ? 2.2 : 1.3) * (Math.random() < 0.25 ? 4 : 1.5);
  const bgs = document.querySelectorAll<HTMLElement>('[data-tremble]');
  const title = document.querySelector<HTMLElement>('.page-title');
  // the title joins about 1 in 3 bursts (past) or 3 in 5 (future)
  const withTitle = Math.random() < (future ? 0.6 : 0.3);
  let n = 2 + ((Math.random() * 3) | 0);
  const jolt = () => {
    if (!running) return;
    const last = --n < 0;
    bgs.forEach((b) => (b.style.transform = last ? '' : `translate(${((Math.random() - 0.5) * amp).toFixed(1)}px, ${((Math.random() - 0.5) * amp).toFixed(1)}px)`));
    if (title) title.classList.toggle('quake', withTitle && !last && Math.random() < 0.5);
    if (!last) shake = window.setTimeout(jolt, 60 + Math.random() * 90);
  };
  clearTimeout(shake);
  jolt();
}

function start() { if (running || isReduced()) return; running = true; tick(); }
function stop() {
  running = false; clearTimeout(timer); clearTimeout(shake);
  document.querySelector('.page-title')?.classList.remove('quake');
  document.querySelectorAll<HTMLElement>('[data-tremble]').forEach((b) => (b.style.transform = ''));
}

export function initTremor() {
  const era = document.documentElement.dataset.era;
  if (era !== 'past' && era !== 'future') {
    // present pages stay still, except the past/future emblems on the home plate
    if (!document.querySelector('[data-tremble]')) return;
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    onMotion((r) => (r ? stop() : start()));
    start();
    return;
  }
  let svg = document.querySelector<SVGSVGElement>('svg.spikes');
  if (!svg) {
    svg = document.createElementNS(SVG, 'svg') as SVGSVGElement;
    svg.setAttribute('class', 'spikes'); svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('preserveAspectRatio', 'none');
    document.body.prepend(svg);
  }
  makeSpikes(svg, era);
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(() => svg && makeSpikes(svg, era), 200); }, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  onMotion((r) => (r ? stop() : start()));
  start();
}
