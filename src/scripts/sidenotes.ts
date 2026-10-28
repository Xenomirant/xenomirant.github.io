/** footnotes as sidenotes, LessWrong style: on wide screens each note sits in the right margin level with its reference;
    where there is no room (phones, narrow windows) the usual list at the end stays. without js the list stays too. */
const GAP = 40, EDGE = 24, MIN = 220, MAX = 300;

function layout(prose: HTMLElement, notes: HTMLElement[]) {
  const room = document.documentElement.clientWidth - prose.getBoundingClientRect().right - GAP - EDGE;
  const on = room >= MIN;
  prose.classList.toggle('has-sidenotes', on);
  if (!on) return;
  const origin = prose.getBoundingClientRect().top;
  let floor = 0; // a note never overlaps the one above it
  for (const n of notes) {
    const ref = document.getElementById(n.dataset.ref ?? '');
    if (!ref) continue;
    const top = Math.max(ref.getBoundingClientRect().top - origin - 6, floor);
    n.style.top = `${top}px`;
    n.style.width = `${Math.min(MAX, room)}px`;
    floor = top + n.offsetHeight + 16;
  }
}

export function initSidenotes() {
  const prose = document.querySelector<HTMLElement>('.post .prose');
  const list = prose?.querySelector<HTMLElement>('.footnotes');
  if (!prose || !list || prose.dataset.sidenotes) return;
  prose.dataset.sidenotes = '1';

  const notes = [...list.querySelectorAll<HTMLLIElement>('li[id]')].map((li) => {
    const refId = li.querySelector('[data-footnote-backref]')?.getAttribute('href')?.slice(1) ?? '';
    const ref = document.getElementById(refId);
    const note = document.createElement('aside');
    note.className = 'sidenote';
    note.dataset.ref = refId;
    note.setAttribute('role', 'note');
    const n = document.createElement('span');
    n.className = 'sidenote-n';
    n.textContent = ref?.textContent ?? '';
    note.append(n, ...[...li.childNodes].map((c) => c.cloneNode(true)));
    note.querySelectorAll('[data-footnote-backref]').forEach((a) => a.remove());
    note.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
    prose.append(note);
    // the reference and its note light up together
    const lit = (on: boolean) => { note.classList.toggle('lit', on); ref?.classList.toggle('lit', on); };
    for (const el of [note, ref]) {
      el?.addEventListener('mouseenter', () => lit(true));
      el?.addEventListener('mouseleave', () => lit(false));
    }
    // with notes in the margin, a click on the number points at the note instead of jumping to the hidden list
    ref?.addEventListener('click', (e) => {
      if (!prose.classList.contains('has-sidenotes')) return;
      e.preventDefault();
      lit(true);
      setTimeout(() => lit(false), 1400);
    });
    return note;
  });

  let raf = 0;
  const relayout = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => layout(prose, notes)); };
  new ResizeObserver(relayout).observe(prose);
  addEventListener('resize', relayout);
  document.fonts?.ready.then(relayout);
  relayout();
}
