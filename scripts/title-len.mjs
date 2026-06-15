import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/content/pages');
let tl = [], dl = [], longT = [], longD = [], shortD = [];
for (const f of readdirSync(dir)) {
  const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  tl.push(d.metaTitle.length); dl.push(d.metaDesc.length);
  if (d.metaTitle.length > 60) longT.push(`${d.route} (${d.metaTitle.length})`);
  if (d.metaDesc.length > 160) longD.push(`${d.route} (${d.metaDesc.length})`);
  if (d.metaDesc.length < 70) shortD.push(`${d.route} (${d.metaDesc.length})`);
}
const avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
console.log(`title: avg ${avg(tl)}, max ${Math.max(...tl)}, >60 chars: ${longT.length}`);
console.log(`desc:  avg ${avg(dl)}, max ${Math.max(...dl)}, >160: ${longD.length}, <70: ${shortD.length}`);
if (longT.length) console.log('  long titles:', longT.slice(0, 6).join(' | '));
if (longD.length) console.log('  long descs:', longD.slice(0, 6).join(' | '));
