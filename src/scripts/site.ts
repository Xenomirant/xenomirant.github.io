import { initMotion } from './motion';
import { initDecode } from './decode';
import { initSigil } from './sigil';
import { initSparks } from './sparks';
import { initTransit } from './transit';
import { initClock } from './clock';
import { initReveal } from './reveal';
import { initCopy } from './copy';

function init() {
  initMotion();
  initTransit();
  initDecode();
  initSigil();
  initSparks();
  initClock();
  initReveal();
  initCopy();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
