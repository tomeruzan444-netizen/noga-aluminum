import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
const reqs = [];
p.on('response', (r) => { const u = r.url(); if (u.includes('.woff2') || u.includes('fonts.google')) reqs.push(`${r.status()} ${u.split('/').pop()}`); });
await p.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 600));
const info = await p.evaluate(() => {
  const h1 = document.querySelector('h1');
  const body = document.body;
  return {
    bodyFont: getComputedStyle(body).fontFamily,
    h1Font: getComputedStyle(h1).fontFamily,
    assistantLoaded: document.fonts.check('700 16px Assistant'),
    fontsReady: document.fonts.status,
  };
});
console.log('font requests:', JSON.stringify(reqs, null, 2));
console.log('computed:', JSON.stringify(info, null, 2));
await b.close();
