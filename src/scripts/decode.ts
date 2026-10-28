import { isReduced } from './motion';

const POOL = '0123456789abcdef·_';
const TICK = 30;
const MAX_MS = 1400;

function run(el: HTMLElement, target: string) {
  // operate on the first text node so a trailing <span class="cursor"> survives.
  let node = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE) as Text | undefined;
  if (!node) { node = document.createTextNode(''); el.prepend(node); }
  const text = node;
  // pin the box to the final (SSR) size so scrambled glyphs never reflow the page
  const h = el.offsetHeight, w = el.offsetWidth;
  if (h) { el.style.minHeight = h + 'px'; el.style.maxHeight = h + 'px'; el.style.overflow = 'hidden'; }
  if (w) el.style.width = w + 'px';
  const unpin = () => { el.style.minHeight = ''; el.style.maxHeight = ''; el.style.overflow = ''; el.style.width = ''; };
  const n = target.length;
  const ticks = Math.min(n * 2.5, MAX_MS / TICK);
  const perTick = n / ticks;
  let shown = 0;
  let last = 0;
  const frame = (t: number) => {
    if (t - last >= TICK) {
      last = t;
      shown = Math.min(n, shown + perTick);
      const k = Math.floor(shown);
      let out = target.slice(0, k);
      for (let i = k; i < n; i++) {
        const c = target[i];
        out += c === ' ' ? ' ' : POOL[(Math.random() * POOL.length) | 0];
      }
      text.data = out;
    }
    if (shown < n) requestAnimationFrame(frame); else { text.data = target; unpin(); }
  };
  text.data = target.replace(/\S/g, () => POOL[(Math.random() * POOL.length) | 0]!);
  document.documentElement.classList.remove('decoding');
  requestAnimationFrame(frame);
}

export function initDecode() {
  const key = 'decoded:' + location.pathname;
  let seen = false;
  try { seen = !!sessionStorage.getItem(key); } catch { /* ignore */ }
  const els = document.querySelectorAll<HTMLElement>('[data-decode]');
  const reveal = () => document.documentElement.classList.remove('decoding');
  if (!els.length) { reveal(); return; }
  try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
  if (isReduced() || seen) { reveal(); return; }
  // measure and pin the box only once the web fonts are in: pinned to a fallback font's width, the name gets clipped
  const go = () => els.forEach((el) => {
    if (el.dataset.decoded) return;
    el.dataset.decoded = '1';
    run(el, el.dataset.decode ?? el.textContent ?? '');
  });
  const fonts = document.fonts?.ready;
  if (!fonts) { go(); return; }
  let done = false;
  const once = () => { if (!done) { done = true; go(); } };
  fonts.then(once);
  setTimeout(once, 600); // never wait long for slow fonts
}
