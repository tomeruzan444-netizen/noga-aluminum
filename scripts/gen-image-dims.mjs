import sharp from 'sharp';
import { readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const base = join(dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = join(base, 'public/images');
const dims = {};
for (const f of readdirSync(imgDir)) {
  if (!/\.(webp|png|jpe?g)$/i.test(f)) continue;
  const m = await sharp(join(imgDir, f)).metadata();
  dims[f] = { w: m.width, h: m.height };
}
writeFileSync(join(base, 'src/data/image-dims.json'), JSON.stringify(dims, null, 2), 'utf8');
console.log(`Wrote dimensions for ${Object.keys(dims).length} images.`);
