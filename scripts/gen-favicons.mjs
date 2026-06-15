import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const base = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(base, 'public');
const svg = readFileSync(join(pub, 'favicon.svg'));

const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

// Standard favicon PNGs + apple touch + PWA sizes
const targets = [
  ['favicon-16x16.png', 16], ['favicon-32x32.png', 32], ['favicon-48x48.png', 48],
  ['favicon-96x96.png', 96], ['apple-touch-icon.png', 180],
  ['icon-192.png', 192], ['icon-512.png', 512],
];
for (const [name, size] of targets) {
  writeFileSync(join(pub, name), await png(size));
  console.log('  wrote', name, `(${size}px)`);
}

// Multi-size .ico (16/32/48) for legacy + Google
const ico = await pngToIco([await png(16), await png(32), await png(48)]);
writeFileSync(join(pub, 'favicon.ico'), ico);
console.log('  wrote favicon.ico (16/32/48)');
console.log('Done.');
