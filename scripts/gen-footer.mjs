import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/content/pages';
const pages = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
  const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  return { route: j.route, h1: (j.h1 || '').trim() };
}).filter(p => p.route && p.route !== '/');

const r = (p) => decodeURIComponent(p.route);
const buckets = {
  'מעקות וזכוכית': [],
  'גדרות, שערים ופרגולות': [],
  'חלונות וויטרינות': [],
  'תריסים': [],
  'תיקון תריסים בערים': [],
  'סגירות חורף': [],
  'ריתוך ואזורי שירות': [],
};
const info = ['/אודות/', '/צרו-קשר/', '/תנאי-שימוש/', '/הצהרת-נגישות/', '/מדיניות-פרטיות/'];

for (const p of pages) {
  const d = r(p);
  if (info.includes(d)) continue; // handled separately
  if (/תיקון-תריסים-ב/.test(d)) buckets['תיקון תריסים בערים'].push(p);
  else if (/תריס/.test(d)) buckets['תריסים'].push(p);
  else if (/מעקות|זכוכית/.test(d)) buckets['מעקות וזכוכית'].push(p);
  else if (/גדר|שער|פרגול/.test(d)) buckets['גדרות, שערים ופרגולות'].push(p);
  else if (/חלו|ויטרינ|רשתות|דלת-הזזה/.test(d)) buckets['חלונות וויטרינות'].push(p);
  else if (/סגירת|מרפסת/.test(d)) buckets['סגירות חורף'].push(p);
  else buckets['ריתוך ואזורי שירות'].push(p);
}

// hub pages (shorter slugs) first, city variants after
for (const arr of Object.values(buckets)) arr.sort((a, b) => r(a).length - r(b).length);

// label: a short, clean page name (drop "- מידע ומחירים" tails)
const label = (p) => {
  let l = (p.h1 || '').replace(/\s+/g, ' ').trim();
  l = l.split(/ [-–|] /)[0].trim();                       // drop " - מידע ומחירים" etc.
  l = l.replace(/\s+(מידע( ומחיר\S*)?|ומחיר\S*|כולל מחיר\S*)$/, '').trim();
  if (!l || l.length > 40) l = r(p).replace(/^\/|\/$/g, '').replace(/-/g, ' ');
  return l;
};

const esc = (s) => s.replace(/'/g, "\\'");
let out = 'export const footerNav = [\n';
for (const [title, arr] of Object.entries(buckets)) {
  if (!arr.length) continue;
  out += `  {\n    title: '${esc(title)}',\n    links: [\n`;
  for (const p of arr) out += `      { label: '${esc(label(p))}', href: '${p.route}' },\n`;
  out += '    ],\n  },\n';
}
// nav + info column
out += `  {\n    title: 'ניווט ומידע',\n    links: [\n`;
out += `      { label: 'עמוד הבית', href: '/' },\n`;
out += `      { label: 'אודות', href: '/אודות/' },\n`;
out += `      { label: 'צרו קשר', href: '/צרו-קשר/' },\n`;
out += `      { label: 'תנאי שימוש', href: '/תנאי-שימוש/' },\n`;
out += `      { label: 'הצהרת נגישות', href: '/הצהרת-נגישות/' },\n`;
out += `      { label: 'מדיניות פרטיות', href: '/מדיניות-פרטיות/' },\n`;
out += '    ],\n  },\n];\n';

let total = Object.values(buckets).reduce((s, a) => s + a.length, 0) + 6;
console.log(out);
console.error(`\n// total footer links: ${total} (covering ${pages.length + 1} pages)`);
for (const [t, a] of Object.entries(buckets)) console.error(`//   ${t}: ${a.length}`);
