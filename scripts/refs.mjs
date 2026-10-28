// art references: prepares backgrounds for the past / present eras.
// inputs: photos/IMG_20260926_190541.jpg (Cildo Meireles, Babel, 2001 — own photo)
//         photos/refs/bruegel-babel-vienna.jpg (Pieter Bruegel the Elder, The Tower of Babel, 1563 — public domain, Wikimedia Commons)
//         photos/refs/dl/panopticon-2000.jpg (Jeremy Bentham, Panopticon, plan drawn by Willey Reveley, 1791 — public domain, Wikimedia Commons)
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
// Panopticon: an ink drawing on white paper, inverted into pale warm lines on the site ground (a blueprint)
{
  const { data, info } = await sharp('photos/refs/dl/panopticon-2000.jpg').grayscale().negate().linear(1.6, -40).raw().toBuffer({ resolveWithObject: true });
  const ground = [7, 9, 12], line = [214, 160, 104];
  const rgb = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < data.length; i++) for (let c = 0; c < 3; c++) rgb[i * 3 + c] = ground[c] + (data[i] / 255) * (line[c] - ground[c]);
  await sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${out}/panopticon.jpg`);
}
for (const f of ['babel-meireles.jpg', 'bruegel-babel.jpg', 'panopticon.jpg']) {
  const m = await sharp(`${out}/${f}`).metadata();
  console.log(f, m.width + 'x' + m.height, Math.round((await import('node:fs')).statSync(`${out}/${f}`).size / 1024) + ' KB');
}
