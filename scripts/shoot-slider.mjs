import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setCacheEnabled(false);
await p.setViewport({ width: 1100, height: 900, deviceScaleFactor: 1 });
await p.goto('http://127.0.0.1:4321/' + encodeURIComponent('מעקות-אלומיניום-בנתניה') + '/', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 500));
const el = await p.$('.img-slider');
const info = await p.evaluate(() => {
  const s = document.querySelector('.img-slider');
  return { dots: s?.querySelectorAll('.slider-dots button').length, slides: s?.querySelectorAll('.slide').length, hasPrev: !!s?.querySelector('.slider-prev'), hasNext: !!s?.querySelector('.slider-next') };
});
console.log('slider:', JSON.stringify(info));
if (el) { await el.scrollIntoView(); await new Promise(r=>setTimeout(r,300)); await el.screenshot({ path: '_source/slider.png' }); console.log('shot _source/slider.png'); }
await b.close();
