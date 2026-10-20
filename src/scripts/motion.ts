/** motion preference: media query or html[data-motion=off]; footer toggle persists to localStorage. */
const mq = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
let reduced = mq.matches || root.dataset.motion === 'off';
const subs = new Set<(r: boolean) => void>();

export const isReduced = () => reduced;
export const onMotion = (fn: (r: boolean) => void) => { subs.add(fn); };

function set(r: boolean) {
  if (r === reduced) return;
  reduced = r;
  subs.forEach((fn) => fn(r));
}

function sync() {
  const off = root.dataset.motion === 'off';
  document.querySelectorAll<HTMLElement>('[data-motion-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(!off));
    const s = b.querySelector('[data-motion-state]');
    if (s) s.textContent = off ? 'off' : 'on';
  });
  set(mq.matches || off);
}

export function initMotion() {
  document.querySelectorAll<HTMLElement>('[data-motion-toggle]').forEach((b) => {
    if (b.dataset.bound) return;
    b.dataset.bound = '1';
    b.addEventListener('click', () => {
      const off = root.dataset.motion !== 'off';
      if (off) root.dataset.motion = 'off'; else delete root.dataset.motion;
      try { localStorage.setItem('motion', off ? 'off' : 'on'); } catch { /* private mode */ }
      sync();
    });
  });
  mq.addEventListener('change', sync);
  sync();
}
