import { load } from 'cheerio';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const base = join(__dir, '..');
const file = process.argv[2] || '_source/raw/01_3652.html';
const html = readFileSync(join(base, file), 'utf8');
const $ = load(html);

const clip = (s, n = 60) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);

function outline(el, depth, maxDepth) {
  if (depth > maxDepth) return;
  const $el = $(el);
  const tag = el.tagName;
  if (!tag) return;
  const id = el.attribs.id ? `#${el.attribs.id}` : '';
  const cls = (el.attribs.class || '').split(/\s+/).filter(Boolean).slice(0, 3).join('.');
  const ownText = $el.clone().children().remove().end().text().replace(/\s+/g, ' ').trim();
  const textLen = $el.text().replace(/\s+/g, ' ').trim().length;
  const pad = '  '.repeat(depth);
  console.log(`${pad}${tag}${id}${cls ? '.' + cls : ''}  [txt:${textLen}]${ownText ? '  «' + clip(ownText, 40) + '»' : ''}`);
  $el.children().each((_, c) => outline(c, depth + 1, maxDepth));
}

console.log('=== BODY OUTLINE (depth 4) ===');
$('body').children().each((_, c) => outline(c, 0, 4));

console.log('\n=== <h1>,<h2>,<h3> sequence ===');
$('h1,h2,h3').each((_, el) => {
  console.log(`${el.tagName}: ${clip($(el).text(), 80)}`);
});
