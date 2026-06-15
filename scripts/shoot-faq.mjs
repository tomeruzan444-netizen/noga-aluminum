import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setCacheEnabled(false);
await p.setViewport({ width: 900, height: 1000 });
await p.goto('http://127.0.0.1:4321/' + encodeURIComponent('גדר-אלומיניום-בנתניה') + '/', { waitUntil: 'networkidle0' });
const el = await p.$('.faq');
if (el) { await el.scrollIntoView(); await new Promise(r=>setTimeout(r,300)); await el.screenshot({ path: '_source/faq-fixed.png' }); }
const count = await p.evaluate(() => Array.from(document.querySelectorAll('h2')).filter(h=>h.textContent.trim()==='שאלות ותשובות').length);
console.log('FAQ headings on page:', count);
await b.close();
