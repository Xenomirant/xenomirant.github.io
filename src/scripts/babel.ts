/** the confusion of tongues: navigation labels stutter through other languages, then return. */
import { isReduced } from './motion';

const TONGUES: Record<string, string[]> = {
  'the past': ['прошлое', 'menneisyys', '过去', 'praeteritum'],
  'the present': ['настоящее', 'nykyhetki', '现在', 'praesens'],
  'the future is': ['будущее —', 'tulevaisuus on', '未来是', 'futurum est'],
  now: ['сейчас', 'nyt', '此刻', 'nunc'],
  connect: ['связь', 'yhteys', '联系', 'nexus'],
  future: ['будущее', 'tulevaisuus', '未来', 'futurum'],
  blog: ['блог', 'blogi', '博客', 'diarium'],
  papers: ['статьи', 'artikkelit', '论文', 'scripta'],
  projects: ['проекты', 'projektit', '项目', 'opera'],
  cv: ['резюме', 'ansioluettelo', '简历', 'curriculum'],
};
const SEL = '.rail a, .rail .era-head, .statusbar nav a, .door-title, .door-links a';
const busy = new WeakSet<Element>();

function textNode(el: Element) {
  return Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim()) as Text | undefined;
}

function babble(el: Element) {
  if (busy.has(el) || isReduced()) return;
  const t = textNode(el);
  if (!t) return;
  const home = t.data;
  const list = TONGUES[home.trim().toLowerCase()];
  if (!list) return;
  busy.add(el);
  let k = 2 + ((Math.random() * 3) | 0);
  const step = () => {
    if (k-- <= 0) { t.data = home; busy.delete(el); return; }
    t.data = list[(Math.random() * list.length) | 0];
    setTimeout(step, 70 + Math.random() * 160);
  };
  step();
}

let bound = false;
export function initBabel() {
  if (bound) return;
  bound = true;
  document.addEventListener('pointerover', (e) => {
    const el = (e.target as Element | null)?.closest?.(SEL);
    if (el) babble(el);
  });
  const era = document.documentElement.dataset.era;
  if (era !== 'past' && era !== 'future') return;
  // unprompted babel on past and future pages
  const tick = () => {
    if (!document.hidden) {
      const all = Array.from(document.querySelectorAll(SEL));
      if (all.length) babble(all[(Math.random() * all.length) | 0]);
    }
    setTimeout(tick, (era === 'future' ? 1800 : 3500) + Math.random() * 5000);
  };
  setTimeout(tick, 2500);
}
