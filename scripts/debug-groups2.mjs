import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const pagesIndex = JSON.parse(readFileSync(join(__dir, '../src/data/pages-index.json'), 'utf8').replace(/^﻿/, ''));

const RULES = [
  { key: 'core',       test: (r) => r === '/' || r === '/אודות/' || r === '/צרו-קשר/' },
  { key: 'legal',      test: (r) => /מדיניות-פרטיות|הצהרת-נגישות|תנאי-שימוש/.test(r) },
  { key: 'railings',   test: (r) => /מעקות|מעקה/.test(r) },
  { key: 'fences',     test: (r) => /גדר/.test(r) },
  { key: 'pergolas',   test: (r) => /פרגול/.test(r) },
  { key: 'gates',      test: (r) => /שער/.test(r) },
  { key: 'enclosures', test: (r) => /סגיר|מרפסת/.test(r) },
  { key: 'shutters',   test: (r) => /תריס/.test(r) },
  { key: 'windows',    test: (r) => /חלון|ויטרינ|זכוכי|רשתות|דלת|גלגלים/.test(r) },
  { key: 'works',      test: (r) => /עבודות-אלומיניום/.test(r) },
  { key: 'metalwork',  test: (r) => /ריתוך|הלחמ|תיקוני-אלומיניום|איש-אלומיניום/.test(r) },
];
function getGroupKey(route) { for (const r of RULES) if (r.test(route)) return r.key; return 'works'; }

const buckets = {};
for (const p of pagesIndex) { const k = getGroupKey(p.route); (buckets[k] ||= []).push(p.route); }
for (const [k, v] of Object.entries(buckets)) console.log(`${k}: ${v.length}`);
console.log('\nrailings ->', getGroupKey('/מעקות-אלומיניום-בנתניה/'));
console.log('works bucket:', buckets.works);
