import { initMotion } from './motion';
import { initDecode } from './decode';
import { initSigil } from './sigil';
import { initGlow } from './glow';
import { initClock } from './clock';
import { initReveal } from './reveal';
import { initCopy } from './copy';

function init() {
  initMotion();
  initDecode();
  initSigil();
  initGlow();
  initClock();
  initReveal();
  initCopy();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
