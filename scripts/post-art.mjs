// art for blog posts: public-domain paintings → 2-colour ordered dither in the past-era orange.
// inputs: photos/refs/dl/narcissus.jpg (Caravaggio, Narcissus, c. 1597–99 — public domain, Wikimedia Commons)
// usage: node scripts/post-art.mjs ['{"levels":3,...}' out.png]  (optional overrides, for trying variants)
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

/** error diffusion to `levels` evenly spaced tones (returns level indices).
    atkinson passes on 6/8 of the error: crisp, lets deep shadows go clean; floyd-steinberg keeps every tone */
const KERNELS = {
  atkinson: [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]],
  floyd: [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]],
};
function diffuse(gray, w, h, kernel, levels = 2) {
  const f = Float32Array.from(gray), out = new Uint8Array(w * h), step = 255 / (levels - 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, q = Math.max(0, Math.min(levels - 1, Math.round(f[i] / step)));
    out[i] = q;
    const e = f[i] - q * step;
    for (const [dx, dy, k] of kernel) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < w && yy < h) f[yy * w + xx] += e * k; }
  }
  return out;
}

/** ordered 4×4 Bayer dither */
function ordered(gray, w, h) {
  const m = bayer(4), n = 4, scale = 255 / (n * n), bits = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) bits[y * w + x] = gray[y * w + x] > (m[y % n][x % n] + 0.5) * scale ? 1 : 0;
  return bits;
}

/** grayscale → 1-bit dither → indexed png, ground for 0 and orange for 1 */
async function dithered(src, out, { width, method = 'ordered', levels = 2, gamma = 1, lift = 1, offset = 0, sharpen = false, curve, water }) {
  let p = sharp(src).resize({ width }).grayscale();
  if (sharpen) p = p.sharpen({ sigma: 0.8 });
  const { data, info } = await p.gamma(gamma).linear(lift, offset).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // tone curve: v ↦ 255·(v/255)^curve lifts the shadows; `water` = [from, gain] brightens rows below a line (a reflection)
  if (curve || water) for (let y = 0; y < h; y++) {
    const g = water && y > water[0] * h ? water[1] : 1;
    for (let x = 0; x < w; x++) { const i = y * w + x; data[i] = Math.min(255, 255 * Math.pow(data[i] / 255, curve ?? 1) * g); }
  }
  const q = method === 'ordered' ? ordered(data, w, h) : diffuse(data, w, h, KERNELS[method], levels);
  // palette: `levels` tones from the ground to the orange
  const g = hex(GROUND), o = hex(ORANGE);
  const pal = Array.from({ length: levels }, (_, k) => g.map((c, ch) => Math.round(c + (o[ch] - c) * k / (levels - 1))));
  const rgb = Buffer.alloc(w * h * 3);
  for (let i = 0, j = 0; i < q.length; i++, j += 3) { const c = pal[q[i]]; rgb[j] = c[0]; rgb[j + 1] = c[1]; rgb[j + 2] = c[2]; }
  await sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).png({ palette: true, colours: Math.max(2, levels), compressionLevel: 9, effort: 10 }).toFile(out);
  const { size } = await (await import('node:fs/promises')).stat(out);
  console.log(out, `${w}×${h}`, Math.round(size / 1024) + ' KB');
}

// 2× the display width, so each dither dot is one device pixel on retina screens
const V = process.argv[2] ? JSON.parse(process.argv[2]) : { levels: 3, curve: 0.75, water: [0.6, 2.0], lift: 1.06, offset: -16 };
await dithered('photos/refs/dl/narcissus.jpg', process.argv[3] ?? 'public/img/post-narcissus.png', { width: 960, method: 'atkinson', sharpen: true, ...V });
