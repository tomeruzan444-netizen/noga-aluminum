import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const pages = JSON.parse(readFileSync(join(__dir, '../src/data/pages-index.json'), 'utf8').replace(/^﻿/, ''));
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
const key = (r) => (RULES.find(([, t]) => t(r)) || ['works'])[0];
const g = {};
for (const p of pages) (g[key(p.route)] ||= []).push(p.route.replace(/\//g, '').replace(/-/g, ' ') + '  ::  ' + p.route);
for (const [k, v] of Object.entries(g)) { console.log(`\n### ${k} (${v.length})`); v.forEach((x) => console.log('  ' + x)); }
