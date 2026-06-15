import { load } from 'cheerio';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const dir = join(__dir, '../src/content/pages');

// A "block" counts as an image-block if it is an <img> or a <p>/<figure> whose
// only meaningful content is an <img>.
function isImgBlock($, el) {
  if (el.type !== 'tag') return false;
  if (el.tagName === 'img') return true;
  if (['p', 'figure'].includes(el.tagName)) {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, '').trim();
    const imgs = $el.find('img').length;
    return imgs >= 1 && txt === '';
  }
  return false;
}

let totalRuns = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const $ = load(`<div id="r">${data.contentHtml}</div>`, { decodeEntities: false });
  const kids = $('#r')[0].children.filter((c) => c.type === 'tag');
  let run = 0; const runs = [];
  for (const el of kids) {
    if (isImgBlock($, el)) run++;
    else { if (run > 3) runs.push(run); run = 0; }
  }
  if (run > 3) runs.push(run);
  if (runs.length) { console.log(`${data.route}  → runs: ${runs.join(', ')}`); totalRuns += runs.length; }
}
console.log(`\nTotal image-runs >3: ${totalRuns}`);
