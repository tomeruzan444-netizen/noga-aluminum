import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setCacheEnabled(false);
await p.setViewport({ width: 1000, height: 800 });
await p.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle0' });
const r = await p.evaluate(() => {
  const W = window.innerWidth, off = [];
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > W + 1 || r.left < -1) off.push(`${el.tagName.toLowerCase()}.${(el.className||'').toString().trim().split(/\s+/).slice(0,2).join('.')} L=${Math.round(r.left)} R=${Math.round(r.right)} w=${Math.round(r.width)}`);
  });
  return { scrollW: document.documentElement.scrollWidth, innerW: W, off: [...new Set(off)].slice(0, 12) };
});
console.log('scrollW', r.scrollW, 'innerW', r.innerW);
r.off.forEach(o => console.log('  ' + o));
await b.close();
