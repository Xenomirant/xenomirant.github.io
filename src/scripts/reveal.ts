import { isReduced } from './motion';

export function initReveal() {
  if (isReduced() || !('IntersectionObserver' in window)) return;
  const els = document.querySelectorAll<HTMLElement>('[data-reveal], .row');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px 12% 0px' });
  els.forEach((el) => {
    if (el.classList.contains('reveal')) return;
    const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.matches('[data-reveal], .row')) : [el];
    el.style.setProperty('--i', String(Math.min(sibs.indexOf(el), 8)));
    el.classList.add('reveal');
    io.observe(el);
  });
  // safety net: never leave content hidden if the observer misfires (print, odd scroll roots, screenshots)
  window.setTimeout(() => els.forEach((el) => el.classList.add('in')), 2500);
}
