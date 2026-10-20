let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  document.querySelectorAll<HTMLElement>('[data-clock][data-tz]').forEach((el) => {
    try {
      el.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone: el.dataset.tz, hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date());
    } catch { /* bad tz: keep SSR text */ }
  });
}

function schedule() {
  clearInterval(timer);
  if (document.hidden) return;
  tick();
  timer = setInterval(tick, 30_000);
}

export function initClock() {
  if (!document.querySelector('[data-clock]')) return;
  document.addEventListener('visibilitychange', schedule);
  schedule();
}
