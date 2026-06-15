import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const dir = join(__dir, '..', 'src/content/pages');

const needles = process.argv.slice(2);
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const blob = [d.metaTitle, d.metaDesc, d.h1, d.contentHtml, ...(d.faq || []).flatMap((x) => [x.q, x.a])].join('\n');
  for (const n of needles) {
    let idx = blob.indexOf(n);
    while (idx !== -1) {
      const ctx = blob.slice(Math.max(0, idx - 45), idx + n.length + 45).replace(/\s+/g, ' ');
      console.log(`[${d.route}]  «…${ctx}…»`);
      idx = blob.indexOf(n, idx + 1);
    }
  }
}
