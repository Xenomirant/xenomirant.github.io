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
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
