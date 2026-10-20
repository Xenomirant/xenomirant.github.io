/** page change: the knob's dot turns to the destination zone while the page fades to black, then the next page fades in. */
import { isReduced } from './motion';

const KEY = 'knob:from';
const root = document.documentElement;
const ZONES: [string, number][] = [['/now/', 1], ['/writing/', 2], ['/papers/', 3], ['/projects/', 4], ['/about/', 5], ['/contact/', 6]];
const zoneFor = (path: string) => ZONES.find(([p]) => path.startsWith(p))?.[1] ?? (path === '/' ? 0 : undefined);
const here = () => { const z = root.dataset.zone; return z === undefined || z === '' ? undefined : Number(z); };
const dots = () => document.querySelectorAll<SVGGElement>('[data-knob-dot]');
const setAngle = (z: number) => dots().forEach((d) => d.style.setProperty('--a', `${z * 36}deg`));

let bound = false;

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

  addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('leaving', 'arriving'); });

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
    if (to !== undefined) setAngle(to);
    root.classList.add('leaving');
    setTimeout(() => { location.href = url.href; }, 420);
  });
}
