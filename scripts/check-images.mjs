import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const dist = join(__dir, '..', 'dist');

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === 'index.html') acc.push(p);
  }
  return acc;
}

const seen = new Set();
let broken = 0;
for (const f of walk(dist)) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/src="(\/images\/[^"]+)"/g)) {
    const rel = m[1];
    if (seen.has(rel)) continue; seen.add(rel);
    const disk = join(dist, decodeURIComponent(rel));
    if (!existsSync(disk)) { console.log('BROKEN:', rel); broken++; }
  }
}
console.log(`unique image refs: ${seen.size}, broken: ${broken}`);

// total dist size
let total = 0;
(function sz(d){ for (const e of readdirSync(d,{withFileTypes:true})){ const p=join(d,e.name); if(e.isDirectory())sz(p); else total+=statSync(p).size; } })(dist);
console.log(`dist total: ${(total/1024/1024).toFixed(2)} MB`);
