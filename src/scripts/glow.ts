import { isReduced, onMotion } from './motion';

let bound = false;
let raf = 0;
let x = 0, y = 0;

function paint() {
  raf = 0;
  document.body.style.setProperty('--mx', x + 'px');
  document.body.style.setProperty('--my', y + 'px');
}

function move(e: PointerEvent) {
  if (isReduced()) return;
  x = e.clientX; y = e.clientY;
  if (!raf) raf = requestAnimationFrame(paint);
}

export function initGlow() {
  if (bound || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  bound = true;
  document.addEventListener('pointermove', move, { passive: true });
  onMotion((r) => { if (r) { document.body.style.removeProperty('--mx'); document.body.style.removeProperty('--my'); } });
}
