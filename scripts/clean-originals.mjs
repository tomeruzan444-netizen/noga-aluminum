import { readdirSync, unlinkSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const imgDir = join(__dir, '..', 'public/images');

// Keep: logo png (favicon), team jpg (OG sharing). Delete other raster originals (now served as .webp).
const KEEP = new Set(['נוגה-אלומיניום-2-1.png', 'צוות-נוגה-אלומיניום.jpg']);
// Also drop the unused old stock team image entirely.
const DROP_WEBP = new Set(['צוות-המקצוענים-של-נוגה-אלומיניום-1024x683.webp']);

let freed = 0, n = 0;
for (const f of readdirSync(imgDir)) {
  const isRaster = /\.(png|jpe?g)$/i.test(f);
  if ((isRaster && !KEEP.has(f)) || DROP_WEBP.has(f)) {
    const p = join(imgDir, f);
    freed += statSync(p).size; n++;
    unlinkSync(p);
  }
}
const left = readdirSync(imgDir);
console.log(`Deleted ${n} files, freed ${(freed/1024/1024).toFixed(2)}MB`);
console.log(`Remaining: ${left.length} files`);
console.log('Non-webp kept:', left.filter((f) => !f.endsWith('.webp')).join(', '));
const total = left.reduce((s, f) => s + statSync(join(imgDir, f)).size, 0);
console.log(`Images folder total: ${(total/1024/1024).toFixed(2)}MB`);
