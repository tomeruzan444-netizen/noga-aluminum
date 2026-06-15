import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const base = join(__dir, '..');

const files = [
  'src/data/site.js',
  'src/data/groups.js',
  'src/styles/global.css',
  'src/components/Sidebar.astro',
  'src/components/Footer.astro',
  'src/components/ServicesGrid.astro',
  'src/pages/[...slug].astro',
  'src/layouts/BaseLayout.astro',
];

const fix = (s) => s
  .replace(/[‒–—―]/g, '-')
  .replace(/&#8211;|&#8212;|&#x2013;|&#x2014;|&ndash;|&mdash;/g, '-');

for (const rel of files) {
  const p = join(base, rel);
  let txt;
  try { txt = readFileSync(p, 'utf8'); } catch { console.log('skip (missing):', rel); continue; }
  const before = (txt.match(/[‒–—―]/g) || []).length;
  if (before === 0) { console.log(`0   ${rel}`); continue; }
  writeFileSync(p, fix(txt), 'utf8');
  console.log(`${before} replaced  ${rel}`);
}
