import sharp from 'sharp';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const imgDir = join(__dir, '..', 'public/images');

// Keep these originals as-is (logo used for favicon; team jpg used for OG sharing).
const KEEP_ORIGINAL = new Set(['נוגה-אלומיניום-2-1.png']);
const MAX_W = 1600;

const files = readdirSync(imgDir).filter((f) => /\.(png|jpe?g)$/i.test(f));
let before = 0, after = 0;
for (const f of files) {
  if (KEEP_ORIGINAL.has(f)) continue;
  const src = join(imgDir, f);
  const out = join(imgDir, basename(f, extname(f)) + '.webp');
  const origSize = statSync(src).size;
  const meta = await sharp(src).metadata();
  let pipe = sharp(src);
  if (meta.width > MAX_W) pipe = pipe.resize({ width: MAX_W });
  await pipe.webp({ quality: 80, effort: 5 }).toFile(out);
  const newSize = statSync(out).size;
  before += origSize; after += newSize;
  console.log(`${f}  ${(origSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB  (${(100 - newSize/origSize*100).toFixed(0)}% smaller)`);
}
console.log(`\nTotal: ${(before/1024/1024).toFixed(2)}MB -> ${(after/1024/1024).toFixed(2)}MB  (saved ${(100 - after/before*100).toFixed(0)}%)`);
