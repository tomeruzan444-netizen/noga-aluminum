import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const imgDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');
const src = join(imgDir, 'צוות-נוגה-אלומיניום.jpg'); // highest-quality source

for (const w of [800, 1200]) {
  const out = join(imgDir, `צוות-נוגה-אלומיניום-${w}.webp`);
  const info = await sharp(src).resize(w).webp({ quality: 72 }).toFile(out);
  console.log(`  wrote צוות-נוגה-אלומיניום-${w}.webp  ${w}x${info.height}  ${(info.size/1024).toFixed(1)}KB`);
}
