// art references: prepares backgrounds for the past / present eras.
// inputs: photos/IMG_20260926_190541.jpg (Cildo Meireles, Babel, 2001 — own photo)
//         photos/refs/bruegel-babel-vienna.jpg (Pieter Bruegel the Elder, The Tower of Babel, 1563 — public domain, Wikimedia Commons)
// usage: node scripts/refs.mjs
import sharp from 'sharp';
const out = 'src/assets';
// Meireles: portrait tower, keep colour, lift contrast, darken edges into the ground
await sharp('photos/IMG_20260926_190541.jpg').rotate().resize({ height: 1800 })
  .modulate({ saturation: 1.15, brightness: 0.92 }).linear(1.12, -10)
  .jpeg({ quality: 80, mozjpeg: true }).toFile(`${out}/babel-meireles.jpg`);
// Bruegel: full panel, muted toward the site ground
await sharp('photos/refs/bruegel-babel-vienna.jpg').resize({ width: 2400 })
  .modulate({ saturation: 0.8, brightness: 0.62 }).linear(1.08, -6)
  .jpeg({ quality: 76, mozjpeg: true }).toFile(`${out}/bruegel-babel.jpg`);
for (const f of ['babel-meireles.jpg', 'bruegel-babel.jpg']) {
  const m = await sharp(`${out}/${f}`).metadata();
  console.log(f, m.width + 'x' + m.height, Math.round((await import('node:fs')).statSync(`${out}/${f}`).size / 1024) + ' KB');
}
