import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const dir = join(__dir, '..', 'src/content/pages');
const needles = process.argv.slice(2);
const vis = (s) => s.replace(/\n/g, '\\n').replace(/\t/g, '\\t');
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const blob = [d.metaTitle, d.metaDesc, d.h1, d.contentHtml, ...(d.faq || []).flatMap((x) => [x.q, x.a])].join('');
  for (const n of needles) {
    let idx = blob.indexOf(n);
    while (idx !== -1) {
      console.log(`[${d.route}] «${vis(blob.slice(Math.max(0, idx - 30), idx + n.length + 30))}»`);
      idx = blob.indexOf(n, idx + 1);
    }
  }
}
