#!/usr/bin/env node
/**
 * scripts/photos.mjs — photo pipeline for the site.
 *
 * usage:   node scripts/photos.mjs          (or: npm run photos)
 * reads:   photos/*.JPG|jpg   (originals, gitignored — ask the author for them)
 * writes:  src/assets/hero.jpg              colour hero, consumed by astro:assets <Picture>
 *          public/img/hero-lqip.jpg         24px placeholder
 *          public/img/og.jpg                1200×630 open-graph card, no text
 *          public/img/grille-1600.png       dash field, 2-colour ordered dither (amber/ground)
 *          public/img/grille-tile.png       512×512 repeating tile of the same
 *          public/img/ribbon-tile.png       1024×56 repeat-x strip
 *          public/img/contact-1600.png      glowing grille, 8×8 Bayer, amber/ground
 *          public/img/about-1920.png/-1280  moonlit sea, 8×8 Bayer, teal/ground
 *          public/img/projects-1920.png/-1280  sandcastle, posterised + 4×4 Bayer, amber/ground
 *          public/apple-touch-icon.png      180×180 rasterised from public/favicon.svg
 *
 * Everything sharp cannot do on its own (ordered Bayer dither → 2-colour indexed PNG)
 * is done by hand over raw grayscale pixels. The script is deterministic except for the
 * hero grain, which is seeded, so re-running yields byte-identical outputs.
 */

import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = (f) => resolve(ROOT, 'photos', f);
const OUT = (f) => resolve(ROOT, 'public', 'img', f);
const ASSET = (f) => resolve(ROOT, 'src', 'assets', f);

const GROUND = '#07090c';
const AMBER = '#f0a32e';
const TEAL = '#2fb8b0';

const written = [];

// ── helpers ──────────────────────────────────────────────────────────────────

const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** n×n Bayer threshold matrix (n a power of two), values in [0, n²). */
export function bayer(n) {
  let m = [[0]];
  let size = 1;
  while (size < n) {
    const next = [];
    for (let y = 0; y < size * 2; y++) {
      next.push(new Array(size * 2));
      for (let x = 0; x < size * 2; x++) {
        const base = 4 * m[y % size][x % size];
        const q = (y >= size ? 1 : 0) * 1 + (x >= size ? 1 : 0) * 2;
        // quadrant offsets: TL 0, TR 2, BL 3, BR 1
        next[y][x] = base + [0, 3, 2, 1][q];
      }
    }
    m = next;
    size *= 2;
  }
  return m;
}

/**
 * Ordered dither of an 8-bit grayscale buffer to 1 bit.
 * `bias` shifts the threshold (negative → fewer lit pixels).
 * Returns Uint8Array of 0/1, same w×h.
 */
export function dither(gray, w, h, matrix, bias = 0) {
  const n = matrix.length;
  const scale = 255 / (n * n);
  const bits = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = matrix[y % n];
    for (let x = 0; x < w; x++) {
      const t = (row[x % n] + 0.5) * scale - bias;
      bits[y * w + x] = gray[y * w + x] > t ? 1 : 0;
    }
  }
  return bits;
}

/** Write a 1-bit field as a 2-colour indexed PNG (c0 for 0, c1 for 1). */
export async function toPalettePng(bits, w, h, c0, c1, file) {
  const [r0, g0, b0] = hex(c0);
  const [r1, g1, b1] = hex(c1);
  const rgb = Buffer.alloc(w * h * 3);
  for (let i = 0, j = 0; i < bits.length; i++, j += 3) {
    if (bits[i]) { rgb[j] = r1; rgb[j + 1] = g1; rgb[j + 2] = b1; }
    else { rgb[j] = r0; rgb[j + 1] = g0; rgb[j + 2] = b0; }
  }
  await sharp(rgb, { raw: { width: w, height: h, channels: 3 } })
    .png({ palette: true, colours: 2, compressionLevel: 9, effort: 10 })
    .toFile(file);
  written.push(file);
}

/** Grayscale raw pixels from a sharp pipeline. */
async function gray(pipeline) {
  const { data, info } = await pipeline.grayscale().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** Posterise an 8-bit buffer to `levels` evenly spaced values, in place. */
function posterize(data, levels) {
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.length; i++) data[i] = Math.round(Math.round(data[i] / step) * step);
  return data;
}

/** Fraction of lit pixels, for the log. */
const coverage = (bits) => (bits.reduce((a, b) => a + b, 0) / bits.length);

/** Deterministic mid-grey noise buffer (xorshift) for film grain; `amp` in 0..1. */
function noise(w, h, amp = 0.16, seed = 0x9e3779b9) {
  const buf = Buffer.alloc(w * h);
  let s = seed >>> 0;
  for (let i = 0; i < buf.length; i++) {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    buf[i] = Math.round(128 + ((s & 255) - 128) * amp);
  }
  return buf;
}

/**
 * Dominant period (px) of a 1-D profile via autocorrelation, with parabolic
 * sub-pixel refinement. Used to crop the dash field to whole periods so tiles repeat.
 */
function period(profile, minLag = 8, maxLag = 300) {
  const n = profile.length;
  const mean = profile.reduce((a, b) => a + b, 0) / n;
  const d = Array.from(profile, (v) => v - mean);
  const ac = (lag) => { let s = 0; for (let i = 0; i + lag < n; i++) s += d[i] * d[i + lag]; return s / (n - lag); };
  let best = -Infinity, bl = minLag;
  for (let lag = minLag; lag < maxLag; lag++) { const v = ac(lag); if (v > best) { best = v; bl = lag; } }
  const a = ac(bl - 1), b = best, c = ac(bl + 1);
  const denom = a - 2 * b + c;
  return denom ? bl + 0.5 * (a - c) / denom : bl;
}

/**
 * Row/column pitch of the dash grid, measured on a blurred crop of the field,
 * plus the absolute y/x of one dash centre so crops can be phase-aligned.
 */
async function dashPitch(src, region) {
  const { data, w, h } = await gray(sharp(src).extract(region).blur(1.5));
  const rows = new Float64Array(h), cols = new Float64Array(w);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = data[y * w + x]; rows[y] += v; cols[x] += v; }
  const argmax = (a) => a.reduce((bi, v, i) => (v > a[bi] ? i : bi), 0);
  return { row: period(rows), col: period(cols), y0: region.top + argmax(rows), x0: region.left + argmax(cols) };
}

/** Nearest grid-aligned top-left so that a crop of n periods is centred on dash centres. */
const snap = (want, origin, pitch) => Math.round(origin + Math.round((want - origin) / pitch) * pitch - pitch / 2);

// ── hero: dusk long exposure, colour ─────────────────────────────────────────

async function hero() {
  const src = SRC('IMG_20260926_190535.jpg');
  const W = 1920;
  const meta = await sharp(src).metadata();
  const H = Math.round((meta.height / meta.width) * W);
  const [r, g, b] = hex(GROUND);

  const grain = await sharp(noise(W, H, 0.16, 0x5eed), { raw: { width: W, height: H, channels: 1 } })
    .png().toBuffer();

  const base = sharp(src)
    .rotate()
    .resize(W)
    .modulate({ saturation: 1.35 })
    .blur(2)
    .composite([
      // lift blacks toward ground
      { input: { create: { width: W, height: H, channels: 4, background: { r, g, b, alpha: 0.18 } } }, blend: 'over' },
      // grain
      { input: grain, blend: 'soft-light' },
    ]);

  // the colour grade the page used to apply as a css filter (saturate 1.25, contrast 1.08, brightness 1.1),
  // baked in here: a live filter on a masked, rotated layer is expensive to repaint and Safari draws it badly
  const graded = sharp(await base.png().toBuffer()).modulate({ saturation: 1.25, brightness: 1.1 }).linear(1.08, -10);

  const out = ASSET('hero.jpg');
  const BUDGET = 220 * 1024;
  for (let q = 82; q >= 60; q -= 4) {
    const { size } = await graded.clone().jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:2:0' }).toFile(out);
    if (size <= BUDGET) { console.log(`  hero quality ${q}`); break; }
  }
  written.push(out);

  const lqip = OUT('hero-lqip.jpg');
  await sharp(out).resize(24).jpeg({ quality: 50 }).toFile(lqip);
  written.push(lqip);

  // og card: cover crop, darkened 25%, no text
  const og = OUT('og.jpg');
  await sharp(src)
    .rotate()
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .modulate({ saturation: 1.25, brightness: 0.75 })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(og);
  written.push(og);
}

// ── grille / ribbon: amber dash field ────────────────────────────────────────

async function grille() {
  const src = SRC('DSC_2706.JPG');
  const meta = await sharp(src).metadata();
  // dashes occupy roughly x 18–65 %, full height, of the frame
  const band = {
    left: Math.round(meta.width * 0.19),
    top: Math.round(meta.height * 0.02),
    width: Math.round(meta.width * 0.45),
    height: Math.round(meta.height * 0.86),
  };
  const pitch = await dashPitch(src, { left: Math.round(meta.width * 0.30), top: Math.round(meta.height * 0.30), width: 1200, height: 1200 });
  console.log(`  dash pitch row ${pitch.row.toFixed(2)} col ${pitch.col.toFixed(2)} px, phase y ${pitch.y0} x ${pitch.x0}`);
  const BIAS = 0; // ground must stay clean: with bias > 8 the lowest Bayer cell fires on every pixel

  // kill sensor noise, stretch so the background clips to ground and dashes to full
  const prep = (p) => p.grayscale().blur(1.5).linear(3.4, -34); // percentiles are useless here: dashes are <0.3 % of pixels

  // 1600 wide field
  {
    const { data, w, h } = await gray(prep(sharp(src).extract(band).resize(1600)));
    const bits = dither(data, w, h, bayer(4), BIAS);
    await toPalettePng(bits, w, h, GROUND, AMBER, OUT('grille-1600.png'));
    console.log(`  grille-1600 coverage ${(coverage(bits) * 100).toFixed(1)}%`);
  }

  // 512 tile: exactly ROWS × COLS dash periods (≈ square in source) from the brighter
  // right-centre of the field, phase-aligned to the grid, so it repeats without a seam
  {
    const ROWS = 12, COLS = 17;
    const width = Math.round(COLS * pitch.col), height = Math.round(ROWS * pitch.row);
    const left = snap(meta.width * 0.53 - width / 2, pitch.x0, pitch.col);
    const top = snap(meta.height * 0.45 - height / 2, pitch.y0, pitch.row);
    const { data, w, h } = await gray(prep(sharp(src).extract({ left, top, width, height }).resize(512, 512, { fit: 'fill' })));
    const bits = dither(data, w, h, bayer(4), BIAS);
    await toPalettePng(bits, w, h, GROUND, AMBER, OUT('grille-tile.png'));
    console.log(`  grille-tile coverage ${(coverage(bits) * 100).toFixed(1)}%`);
  }

  // ribbon: one row of dashes, 18 periods wide → 1024×56, repeat-x, from the bright centre
  {
    const COLS = 18;
    const width = Math.round(COLS * pitch.col), height = Math.round(pitch.row);
    const left = snap(meta.width * 0.50 - width / 2, pitch.x0, pitch.col);
    // the dash glow trails upward, so the visual centre sits ~0.33 period above the peak row
    const top = snap(meta.height * 0.52, pitch.y0, pitch.row) - Math.round(pitch.row * 0.33);
    const { data, w, h } = await gray(prep(sharp(src).extract({ left, top, width, height }).resize(1024, 56, { fit: 'fill' })));
    const bits = dither(data, w, h, bayer(4), BIAS);
    await toPalettePng(bits, w, h, GROUND, AMBER, OUT('ribbon-tile.png'));
    console.log(`  ribbon-tile coverage ${(coverage(bits) * 100).toFixed(1)}%`);
  }
}

// ── contact: glowing grille ──────────────────────────────────────────────────

async function contact() {
  const src = SRC('DSC_2702.JPG');
  const meta = await sharp(src).metadata();
  const region = {
    left: Math.round(meta.width * 0.22),
    top: Math.round(meta.height * 0.10),
    width: Math.round(meta.width * 0.50),
    height: Math.round(meta.height * 0.85),
  };
  const { data, w, h } = await gray(
    sharp(src).extract(region).resize(1600).blur(6).normalise({ lower: 1, upper: 99.8 }).gamma(1.3),
  );
  const bits = dither(data, w, h, bayer(8), 24);
  await toPalettePng(bits, w, h, GROUND, AMBER, OUT('contact-1600.png'));
  console.log(`  contact-1600 coverage ${(coverage(bits) * 100).toFixed(1)}%`);
}

// ── about: moonlit sea + sign, teal ──────────────────────────────────────────

async function about() {
  const src = SRC('DSC_2693.JPG');
  for (const W of [1920, 1280]) {
    const H = Math.round(W * 720 / 1920);
    const meta = await sharp(src).metadata();
    const fullH = Math.round(meta.height / meta.width * W);
    // bottom-biased crop so the moon track and the sign both fit
    const top = Math.round((fullH - H) * 0.78);
    const { data, w, h } = await gray(
      sharp(src)
        .resize(W)
        .extract({ left: 0, top, width: W, height: H })
        .normalise({ lower: 1, upper: 99.5 })
        .linear(1.7, -25),
    );
    const bits = dither(data, w, h, bayer(8), 0);
    await toPalettePng(bits, w, h, GROUND, TEAL, OUT(`about-${W}.png`));
    console.log(`  about-${W} coverage ${(coverage(bits) * 100).toFixed(1)}%`);
  }
}

// ── projects: sandcastle, posterised ─────────────────────────────────────────

async function projects() {
  const src = SRC('DSC_2756.JPG');
  for (const W of [1920, 1280]) {
    const H = Math.round(W * 640 / 1920);
    const { data, w, h } = await gray(
      sharp(src)
        .resize(W, H, { fit: 'cover', position: 'centre' })
        .normalise({ lower: 1, upper: 99 })
        .linear(1.0, -70),
    );
    posterize(data, 5);
    const bits = dither(data, w, h, bayer(4), 40);
    await toPalettePng(bits, w, h, GROUND, AMBER, OUT(`projects-${W}.png`));
    console.log(`  projects-${W} coverage ${(coverage(bits) * 100).toFixed(1)}%`);
  }
}

// ── icons ────────────────────────────────────────────────────────────────────

async function icons() {
  const svg = resolve(ROOT, 'public', 'favicon.svg');
  const out = resolve(ROOT, 'public', 'apple-touch-icon.png');
  await sharp(svg, { density: 384 })
    .resize(180, 180)
    .flatten({ background: GROUND })
    .png({ compressionLevel: 9, palette: true })
    .toFile(out);
  written.push(out);
}

// ── main ─────────────────────────────────────────────────────────────────────

await mkdir(resolve(ROOT, 'public', 'img'), { recursive: true });
await mkdir(resolve(ROOT, 'src', 'assets'), { recursive: true });

for (const [name, fn] of [['hero', hero], ['grille', grille], ['contact', contact], ['about', about], ['projects', projects], ['icons', icons]]) {
  console.log(`// ${name}`);
  await fn();
}

console.log('\n// sizes');
let total = 0;
for (const f of written) {
  const { size } = await stat(f);
  total += size;
  const img = await sharp(f).metadata();
  console.log(`  ${f.replace(ROOT + '/', '').padEnd(32)} ${String(Math.round(size / 1024)).padStart(5)} KB  ${img.width}×${img.height}`);
}
console.log(`  ${'total'.padEnd(32)} ${String(Math.round(total / 1024)).padStart(5)} KB`);
