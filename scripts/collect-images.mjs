import { load } from 'cheerio';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const base = join(__dir, '..');
const rawDir = join(base, '_source/raw');
const DOMAIN = 'https://noga-aluminum.co.il';
const files = readdirSync(rawDir).filter((f) => f.endsWith('.html'));

const imgs = new Map(); // absUrl -> filename
const add = (src) => {
  if (!src || src.startsWith('data:')) return;
  let abs = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : DOMAIN + src);
  if (!abs.includes('noga-aluminum.co.il')) return;
  abs = abs.split('?')[0];
  const fname = decodeURIComponent(abs.split('/').pop());
  if (/\.(jpe?g|png|webp|svg|gif|avif)$/i.test(fname)) imgs.set(abs, fname);
};

for (const f of files) {
  const $ = load(readFileSync(join(rawDir, f), 'utf8'), { decodeEntities: false });
  $('img').each((_, el) => { add(el.attribs.src); add(el.attribs['data-src']); add(el.attribs['data-lazy-src']); });
  // og:image
  $('meta[property="og:image"]').each((_, el) => add(el.attribs.content));
  // inline background urls
  $('[style*="url("]').each((_, el) => {
    const m = (el.attribs.style || '').match(/url\((['"]?)([^)'"]+)\1\)/);
    if (m) add(m[2]);
  });
}

const list = [...imgs.entries()].map(([url, fname]) => ({ url, fname }));
writeFileSync(join(base, '_source/all-images.json'), JSON.stringify(list, null, 2), 'utf8');
console.log(`Total unique images: ${list.length}`);
console.log('Filenames:');
list.forEach((i) => console.log('  ' + i.fname));
