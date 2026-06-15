import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setCacheEnabled(false);
await p.setViewport({ width: 1280, height: 1500, deviceScaleFactor: 1 });
await p.goto('http://127.0.0.1:4321/' + encodeURIComponent('מעקות-אלומיניום-בנתניה') + '/', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));
const el = await p.$('.sidebar');
const data = await p.evaluate(() => Array.from(document.querySelectorAll('.sidebar .card-title, .sidebar .side-cta-title')).map(e => e.textContent.trim()));
console.log('sidebar cards:', JSON.stringify(data, null, 0));
const cityList = await p.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('.sidebar nav.card'));
  return cards.map(c => ({ title: c.querySelector('.card-title')?.textContent.trim(), items: Array.from(c.querySelectorAll('a')).map(a => a.textContent.trim()) }));
});
console.log(JSON.stringify(cityList, null, 2));
if (el) { await el.screenshot({ path: '_source/sidebar.png' }); console.log('shot'); }
await b.close();
