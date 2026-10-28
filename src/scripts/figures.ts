/** diagram animations in posts run only while the figure is on screen; svg animations repaint every frame they run. */
export function initFigures() {
  const figs = document.querySelectorAll<HTMLElement>('figure.fig');
  if (!figs.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('playing', e.isIntersecting);
  });
  figs.forEach((f) => io.observe(f));
}
