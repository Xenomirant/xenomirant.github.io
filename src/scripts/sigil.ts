import { isReduced } from './motion';

export function initSigil() {
  const svgs = document.querySelectorAll<SVGElement>('[data-sigil]');
  if (!svgs.length) return;
  if (!isReduced()) {
    svgs.forEach((svg) => {
      if (svg.dataset.drawn) return;
      svg.dataset.drawn = '1';
      svg.querySelectorAll<SVGElement>('.ring, .chord').forEach((s) => {
        s.setAttribute('pathLength', '1');
        s.classList.add('draw');
      });
    });
  }
  // hovering a zone link lights that node without unlighting the current page's.
  document.querySelectorAll<HTMLElement>('.statusbar nav a[data-zone]').forEach((a) => {
    if (a.dataset.bound) return;
    a.dataset.bound = '1';
    const nodes = () => document.querySelectorAll(`.statusbar [data-node="${a.dataset.zone}"]`);
    a.addEventListener('pointerenter', () => nodes().forEach((n) => n.classList.add('on', 'hover')));
    a.addEventListener('pointerleave', () =>
      nodes().forEach((n) => { if (n.classList.contains('hover')) n.classList.remove('on', 'hover'); }));
  });
}
