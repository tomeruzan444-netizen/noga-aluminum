// Compares extracted page content against the live raw HTML (post-content) to
// detect any lost text or headings. Read-only over local files.
import { load } from 'cheerio';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const base = join(__dir, '..');
const rawDir = join(base, '_source/raw');
const pagesDir = join(base, 'src/content/pages');

const index = JSON.parse(readFileSync(join(base, '_source/index.json'), 'utf8').replace(/^﻿/, ''));
const fileByRoute = {};
for (const e of index) {
  let p = decodeURIComponent(e.url).replace('https://noga-aluminum.co.il', '');
  if (!p.startsWith('/')) p = '/' + p; if (!p.endsWith('/')) p += '/';
  fileByRoute[p] = e.file;
}

const norm = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const words = (s) => new Set(norm(s).split(/[^֐-׿A-Za-z0-9]+/).filter((w) => w.length >= 2));
const headings = ($, $root) => $root.find('h2,h3').map((_, h) => norm($(h).text())).get().filter(Boolean);

const results = [];
for (const f of readdirSync(pagesDir).filter((x) => x.endsWith('.json'))) {
  const data = JSON.parse(readFileSync(join(pagesDir, f), 'utf8'));
  const rawFile = fileByRoute[data.route];
  if (!rawFile) { console.log('NO RAW for', data.route); continue; }
  const $ = load(readFileSync(join(rawDir, rawFile), 'utf8'), { decodeEntities: false });

  const live = $('.elementor-widget-theme-post-content .elementor-widget-container').first().clone();
  live.find('style,script,svg,noscript').remove();
  const liveText = norm(live.text());
  const liveWords = words(liveText);
  const liveHeads = headings($, live);

  // My content = contentHtml text + faq text
  const myHtml = load(`<div>${data.contentHtml}</div>`, { decodeEntities: false });
  const faqText = (data.faq || []).map((x) => x.q + ' ' + x.a.replace(/<[^>]+>/g, ' ')).join(' ');
  const myText = norm(myHtml.root().text() + ' ' + faqText);
  const myWords = words(myText);

  let hit = 0; for (const w of liveWords) if (myWords.has(w)) hit++;
  const recall = liveWords.size ? hit / liveWords.size : 1;
  const missingHeads = liveHeads.filter((h) => !myText.includes(h));

  results.push({ route: data.route, recall, liveLen: liveText.length, myLen: myText.length, liveW: liveWords.size, missing: [...liveWords].filter((w) => !myWords.has(w)).slice(0, 12), missingHeads });
}

results.sort((a, b) => a.recall - b.recall);
console.log('=== Lowest content recall (word overlap with live) ===');
for (const r of results.slice(0, 14)) {
  console.log(`${(r.recall * 100).toFixed(1)}%  ${r.route}  (live ${r.liveLen}c/${r.liveW}w, mine ${r.myLen}c)`);
  if (r.missingHeads.length) console.log('    missing headings: ' + r.missingHeads.join(' | '));
}
const avg = results.reduce((s, r) => s + r.recall, 0) / results.length;
console.log(`\nPages >=95%: ${results.filter((r) => r.recall >= 0.95).length}/${results.length}`);
console.log(`Pages <85%:  ${results.filter((r) => r.recall < 0.85).length}`);
console.log(`Average recall: ${(avg * 100).toFixed(1)}%`);
