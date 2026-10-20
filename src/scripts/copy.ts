export function initCopy() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => {
    if (b.dataset.bound) return;
    b.dataset.bound = '1';
    const label = b.textContent;
    b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy ?? '');
        b.textContent = 'copied';
        setTimeout(() => { b.textContent = label; }, 1200);
      } catch { /* clipboard denied */ }
    });
  });
}
