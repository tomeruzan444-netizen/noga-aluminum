// Dumps every page's text content into readable, grouped .txt files for content auditing.
import { load } from 'cheerio';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const base = join(__dir, '..');
const pagesDir = join(base, 'src/content/pages');
const outDir = join(base, '_source/audit');
mkdirSync(outDir, { recursive: true });

const RULES = [
  ['core', (r) => r === '/' || r === '/אודות/' || r === '/צרו-קשר/'],
  ['legal', (r) => /מדיניות-פרטיות|הצהרת-נגישות|תנאי-שימוש/.test(r)],
  ['railings', (r) => /מעקות|מעקה/.test(r)],
  ['fences', (r) => /גדר/.test(r)],
  ['pergolas', (r) => /פרגול/.test(r)],
  ['gates', (r) => /שער/.test(r)],
  ['enclosures', (r) => /סגיר|מרפסת/.test(r)],
  ['shutters', (r) => /תריס/.test(r)],
  ['windows', (r) => /חלו|ויטרינ|זכוכי|רשת|דלת|גלגלים/.test(r)],
  ['works', (r) => /עבודות-אלומיניום/.test(r)],
  ['metalwork', (r) => /ריתוך|הלחמ|תיקוני-אלומיניום|איש-אלומיניום/.test(r)],
];
const keyOf = (r) => (RULES.find(([, t]) => t(r)) || ['works'])[0];

// Convert a page's contentHtml into readable structured text.
function toText(html) {
  const $ = load(`<div id="r">${html}</div>`, { decodeEntities: false });
  const lines = [];
  $('#r').children().each((_, el) => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase();
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (tag === 'h2' || tag === 'h3' || tag === 'h4') lines.push(`\n## ${txt}`);
    else if (tag === 'ul' || tag === 'ol') $el.find('li').each((_, li) => lines.push('- ' + $(li).text().replace(/\s+/g, ' ').trim()));
    else if (tag === 'table') {
      $el.find('tr').each((_, tr) => {
        const cells = $(tr).find('td,th').map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
        lines.push('| ' + cells.join(' | ') + ' |');
      });
    } else if (tag === 'img' || el.attribs?.['data-slider'] !== undefined || $el.hasClass('img-slider')) {
      // skip media
    } else if (txt) lines.push(txt);
  });
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Group pages
const pages = [];
for (const f of readdirSync(pagesDir).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(join(pagesDir, f), 'utf8'));
  pages.push({ ...d, group: keyOf(d.route) });
}

// Assemble into ~6 balanced batches
const batches = {
  'G1_railings_fences': ['railings', 'fences'],
  'G2_shutters_A': ['shutters'],   // split below
  'G3_shutters_B': [],
  'G4_windows_enclosures': ['windows', 'enclosures'],
  'G5_works_metal_pergola_gate': ['works', 'metalwork', 'pergolas', 'gates'],
  'G6_core_legal': ['core', 'legal'],
};
const shutters = pages.filter((p) => p.group === 'shutters');
const shutA = shutters.slice(0, Math.ceil(shutters.length / 2));
const shutB = shutters.slice(Math.ceil(shutters.length / 2));

function render(p) {
  return [
    '==================================================================',
    `PAGE: ${p.route}`,
    `META TITLE: ${p.metaTitle}`,
    `META DESC: ${p.metaDesc}`,
    `H1: ${p.h1}`,
    '--- BODY ---',
    toText(p.contentHtml),
    p.faq?.length ? '--- FAQ ---\n' + p.faq.map((x) => `Q: ${x.q}\nA: ${x.a.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`).join('\n\n') : '',
    '',
  ].join('\n');
}

const fileMap = {};
for (const [name, groups] of Object.entries(batches)) {
  let list;
  if (name === 'G2_shutters_A') list = shutA;
  else if (name === 'G3_shutters_B') list = shutB;
  else list = pages.filter((p) => groups.includes(p.group));
  if (!list.length) continue;
  const content = list.map(render).join('\n');
  const path = join(outDir, name + '.txt');
  writeFileSync(path, content, 'utf8');
  fileMap[name] = { path, count: list.length };
}

for (const [k, v] of Object.entries(fileMap)) console.log(`${k}: ${v.count} pages -> ${v.path}`);
