import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const page = await b.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto('https://noga-aluminum.co.il/' + encodeURIComponent('מעקות-אלומיניום') + '/', { waitUntil: 'networkidle2', timeout: 45000 });
const toc = await page.$('.toc');
if (toc) { await toc.screenshot({ path: 'toc.png' }); console.log('saved toc.png'); }
else console.log('no .toc found on page');
// test an anchor click lands on the heading
const firstId = await page.$eval('.toc a', a => a.getAttribute('href'));
console.log('first toc link:', decodeURIComponent(firstId));
await b.close();
