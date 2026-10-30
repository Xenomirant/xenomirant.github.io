/** share cards (open graph / x): 1200x630 png per post, drawn at build time by satori (layout → svg) and sharp (svg → png). */
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';
import { meta } from '@/data/meta';
import { rng, seedOf } from '@/scripts/rng';

export const W = 1200, H = 630;
const GROUND = '#07090c', INK = '#d9d4c7', INK2 = '#aca99f', INK3 = '#7f7d77', AMBER = '#e5801c';
const ART_W = 620;

const req = createRequire(import.meta.url);
const file = (p: string) => fs.readFile(req.resolve(p));

// satori reads woff/ttf, not woff2; the files are the site's own (fontsource)
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 500; style: 'normal' }[]> | undefined;
const loadFonts = () => (fonts ??= Promise.all([
  ['Special Elite', '@fontsource/special-elite/files/special-elite-latin-400-normal.woff', 400],
  ['Grenze Gotisch', '@fontsource/grenze-gotisch/files/grenze-gotisch-latin-500-normal.woff', 500],
  ['IBM Plex Mono', '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff', 400],
  ['IBM Plex Mono', '@fontsource/ibm-plex-mono/files/ibm-plex-mono-cyrillic-400-normal.woff', 400],
].map(async ([name, path, weight]) => ({ name: name as string, data: await file(path as string), weight: weight as 400 | 500, style: 'normal' as const }))));

// background art for posts that set `bg`, cropped to the right-hand panel
const ART: Record<string, { src: string; position: string; opacity: number }> = {
  panopticon: { src: 'src/assets/panopticon.jpg', position: 'centre', opacity: 0.62 },
  bruegel: { src: 'src/assets/bruegel-babel.jpg', position: 'left', opacity: 0.7 },
};
async function art(kind?: string): Promise<string | undefined> {
  const a = kind ? ART[kind] : undefined;
  if (!a) return undefined;
  const buf = await sharp(a.src).resize(ART_W, H, { fit: 'cover', position: a.position }).modulate({ brightness: a.opacity }).jpeg({ quality: 88 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

/** the site's spikes (scripts/tremor.ts), frozen: thin shards from the right, top and bottom edges */
function spikes(seed: string): string {
  const r = rng(seedOf(seed));
  let out = '';
  for (let i = 0; i < 18; i++) {
    const e = r();
    const edge = e < 0.5 ? 'right' : e < 0.75 ? 'top' : 'bottom';
    let x = W, y = r() * H, base = Math.PI;
    if (edge === 'top') { x = 520 + r() * (W - 520); y = 0; base = Math.PI / 2; }
    if (edge === 'bottom') { x = 520 + r() * (W - 520); y = H; base = -Math.PI / 2; }
    const ang = base + (r() - 0.5) * 1.1;
    const len = (0.08 + r() * 0.3) * H * (r() < 0.12 ? 1.7 : 1);
    const half = 0.8 + r() * 2.2;
    const tx = x + Math.cos(ang) * len, ty = y + Math.sin(ang) * len;
    const nx = -Math.sin(ang) * half, ny = Math.cos(ang) * half;
    const fill = r() < 0.3 ? AMBER : 'rgba(217,212,199,0.42)';
    out += `<polygon points="${x + nx},${y + ny} ${x - nx},${y - ny} ${tx},${ty}" fill="${fill}"/>`;
  }
  return `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" opacity="0.6">${out}</svg>`).toString('base64')}`;
}

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node =>
  ({ type, props: { style, children, ...extra } });

/** whole sentences up to n characters; a cut mid-sentence only if the first sentence alone is longer */
const clip = (s: string, n: number) => {
  if (s.length <= n) return s;
  const whole = (s.match(/[^.!?]+[.!?]+/g) ?? []).reduce((acc, x) => ((acc + x).length <= n ? acc + x : acc), '').trim();
  return whole || s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,;:.\s]+$/, '') + '…';
};

export type Card = { slug: string; title: string; description: string; date: string; minutes?: number; bg?: string };

export async function card(c: Card): Promise<Buffer> {
  const bg = await art(c.bg);
  const n = c.title.length;
  const size = n <= 18 ? 76 : n <= 40 ? 64 : n <= 60 ? 52 : 44;
  // words as separate boxes, so the amber cursor stays on the last word's line
  const words = c.title.split(/\s+/);
  const cursor = h('div', { width: Math.round(size * 0.42), height: Math.round(size * 0.86), background: AMBER, marginLeft: Math.round(size * 0.2), marginBottom: Math.round(size * 0.1) });
  const title = words.map((w, i) => i < words.length - 1
    ? h('div', { display: 'flex', marginRight: Math.round(size * 0.5) }, w)
    : h('div', { display: 'flex', alignItems: 'flex-end' }, [w, cursor]));
  const tree = h('div', { width: W, height: H, display: 'flex', position: 'relative', background: GROUND, color: INK, fontFamily: 'IBM Plex Mono' }, [
    bg && h('img', { position: 'absolute', right: 0, top: 0, width: ART_W, height: H }, undefined, { src: bg, width: ART_W, height: H }),
    // the art fades into the ground towards the text, like the page backgrounds (era.css)
    bg && h('div', { position: 'absolute', right: 0, top: 0, width: ART_W, height: H, display: 'flex', backgroundImage: `linear-gradient(90deg, ${GROUND} 0%, rgba(7,9,12,0.55) 35%, rgba(7,9,12,0) 75%)` }),
    h('img', { position: 'absolute', left: 0, top: 0, width: W, height: H }, undefined, { src: spikes(c.slug), width: W, height: H }),
    h('div', { position: 'absolute', left: 72, top: 64, right: 72, bottom: 80, display: 'flex', flexDirection: 'column' }, [
      h('div', { display: 'flex', alignItems: 'center', fontSize: 22, color: INK2, letterSpacing: 1 }, [
        h('div', { width: 10, height: 10, borderRadius: 5, background: AMBER, marginRight: 16 }),
        meta.name.toLowerCase(),
        h('div', { display: 'flex', color: INK3, margin: '0 14px' }, '//'),
        h('div', { display: 'flex', fontFamily: 'Grenze Gotisch', fontSize: 34, color: INK, marginTop: -6 }, 'blog'),
      ]),
      h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, maxWidth: 760, paddingTop: 24 }, [
        h('div', { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', fontFamily: 'Special Elite', fontSize: size, lineHeight: 1.1, color: INK }, title),
        h('div', { display: 'flex', marginTop: 28, fontFamily: 'Special Elite', fontSize: 25, lineHeight: 1.45, color: INK2, maxWidth: 640 }, clip(c.description, n <= 40 ? 180 : 130)),
        // under the text, not in the bottom-left corner: x lays its domain label there
        h('div', { display: 'flex', marginTop: 30, fontSize: 21, color: INK3, letterSpacing: 1 }, [c.date, ...(c.minutes ? [h('div', { display: 'flex', margin: '0 14px' }, '//'), `${c.minutes} min`] : [])]),
      ]),
    ]),
  ].filter(Boolean));
  const svg = await satori(tree as never, { width: W, height: H, fonts: await loadFonts() });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
