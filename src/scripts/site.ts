import { initMotion } from './motion';
import { initDecode } from './decode';
import { initSigil } from './sigil';
import { initSparks } from './sparks';
import { initTransit } from './transit';
import { initClock } from './clock';
import { initReveal } from './reveal';
import { initCopy } from './copy';
import { initTremor } from './tremor';
import { initDrips } from './drips';
import { initBabel } from './babel';
import { initSidenotes } from './sidenotes';
import { initFigures } from './figures';

function init() {
  initMotion();
  initTransit();
  initDecode();
  initSigil();
  initSparks();
  initClock();
  initReveal();
  initCopy();
  initTremor();
  initDrips();
  initBabel();
  initSidenotes();
  initFigures();
}

/** the scripts measure layout; doing that before the stylesheet has applied makes Firefox paint the page unstyled */
function styled(): Promise<void> {
  const pending = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].filter((l) => !l.sheet);
  return Promise.all(pending.map((l) => new Promise((r) => { l.addEventListener('load', r, { once: true }); l.addEventListener('error', r, { once: true }); }))).then(() => {});
}

const start = () => { styled().then(init); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
