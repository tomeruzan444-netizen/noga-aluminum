import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const page = await b.newPage();
await page.setCacheEnabled(false);
const imgResponses = [];
page.on('response', (r) => { const u = r.url(); if (u.includes('/images/') && /\.(webp|jpg|png)/.test(u)) imgResponses.push(`${r.status()}  ${decodeURIComponent(u.split('/images/')[1])}`); });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
await page.goto('https://noga-aluminum.co.il/', { waitUntil: 'networkidle2', timeout: 45000 });
const hero = await page.evaluate(() => {
  const im = document.querySelector('img.hero-bg');
  return im ? { complete: im.complete, naturalWidth: im.naturalWidth, currentSrc: decodeURIComponent(im.currentSrc) } : null;
});
console.log('hero <img.hero-bg>:', JSON.stringify(hero, null, 2));
console.log('\nimage responses seen by the browser:');
imgResponses.forEach((r) => console.log('  ' + r));
await b.close();
