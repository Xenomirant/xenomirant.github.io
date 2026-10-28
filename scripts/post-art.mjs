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

/** grayscale → ordered 4×4 dither → indexed png, ground for 0 and orange for 1 */
async function dithered(src, out, { width, gamma = 1, lift = 1, offset = 0 }) {
  const { data, info } = await sharp(src).resize({ width }).grayscale().gamma(gamma).linear(lift, offset).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const m = bayer(4), n = 4, scale = 255 / (n * n);
  const [r0, g0, b0] = hex(GROUND), [r1, g1, b1] = hex(ORANGE);
  const rgb = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, j = i * 3;
    const on = data[i] > (m[y % n][x % n] + 0.5) * scale;
    rgb[j] = on ? r1 : r0; rgb[j + 1] = on ? g1 : g0; rgb[j + 2] = on ? b1 : b0;
  }
  await sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).png({ palette: true, colours: 2, compressionLevel: 9, effort: 10 }).toFile(out);
  const { size } = await (await import('node:fs/promises')).stat(out);
  console.log(out, `${w}×${h}`, Math.round(size / 1024) + ' KB');
}

await dithered('photos/refs/dl/narcissus.jpg', 'public/img/post-narcissus.png', { width: 460, lift: 1.7, offset: -48 });
