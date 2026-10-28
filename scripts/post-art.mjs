// art for blog posts: public-domain paintings → 2-colour ordered dither in the past-era orange.
// inputs: photos/refs/dl/narcissus.jpg (Caravaggio, Narcissus, c. 1597–99 — public domain, Wikimedia Commons)
// usage: node scripts/post-art.mjs
import sharp from 'sharp';

const GROUND = '#07090c';
const ORANGE = '#e5801c';
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

/** n×n Bayer threshold matrix, as in photos.mjs (importing that file would run it) */
function bayer(n) {
  let m = [[0]];
  for (let size = 1; size < n; size *= 2) {
    m = Array.from({ length: size * 2 }, (_, y) => Array.from({ length: size * 2 }, (_, x) =>
      4 * m[y % size][x % size] + [0, 3, 2, 1][(y >= size ? 1 : 0) + (x >= size ? 2 : 0)]));
  }
  return m;
}

/** Atkinson error diffusion (passes on 6/8 of the error): keeps edges and faces, lets deep shadows go clean */
function atkinson(gray, w, h) {
  const f = Float32Array.from(gray), bits = new Uint8Array(w * h);
  const spread = [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, on = f[i] > 127;
    bits[i] = on ? 1 : 0;
    const e = (f[i] - (on ? 255 : 0)) / 8;
    for (const [dx, dy] of spread) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < w && yy < h) f[yy * w + xx] += e; }
  }
  return bits;
}

/** ordered 4×4 Bayer dither */
function ordered(gray, w, h) {
  const m = bayer(4), n = 4, scale = 255 / (n * n), bits = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) bits[y * w + x] = gray[y * w + x] > (m[y % n][x % n] + 0.5) * scale ? 1 : 0;
  return bits;
}

/** grayscale → 1-bit dither → indexed png, ground for 0 and orange for 1 */
async function dithered(src, out, { width, method = 'ordered', gamma = 1, lift = 1, offset = 0, sharpen = false, curve, water }) {
  let p = sharp(src).resize({ width }).grayscale();
  if (sharpen) p = p.sharpen({ sigma: 0.8 });
  const { data, info } = await p.gamma(gamma).linear(lift, offset).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // tone curve: v ↦ 255·(v/255)^curve lifts the shadows; `water` = [from, gain] brightens rows below a line (a reflection)
  if (curve || water) for (let y = 0; y < h; y++) {
    const g = water && y > water[0] * h ? water[1] : 1;
    for (let x = 0; x < w; x++) { const i = y * w + x; data[i] = Math.min(255, 255 * Math.pow(data[i] / 255, curve ?? 1) * g); }
  }
  const bits = (method === 'atkinson' ? atkinson : ordered)(data, w, h);
  const [r0, g0, b0] = hex(GROUND), [r1, g1, b1] = hex(ORANGE);
  const rgb = Buffer.alloc(w * h * 3);
  for (let i = 0, j = 0; i < bits.length; i++, j += 3) {
    const on = bits[i];
    rgb[j] = on ? r1 : r0; rgb[j + 1] = on ? g1 : g0; rgb[j + 2] = on ? b1 : b0;
  }
  await sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).png({ palette: true, colours: 2, compressionLevel: 9, effort: 10 }).toFile(out);
  const { size } = await (await import('node:fs/promises')).stat(out);
  console.log(out, `${w}×${h}`, Math.round(size / 1024) + ' KB');
}

// 2× the display width, so each dither dot is one device pixel on retina screens
const V = process.argv[2] ? JSON.parse(process.argv[2]) : { curve: 0.65, water: [0.6, 2.2], lift: 1.1, offset: -28 };
await dithered('photos/refs/dl/narcissus.jpg', process.argv[3] ?? 'public/img/post-narcissus.png', { width: 760, method: 'atkinson', sharpen: true, ...V });
