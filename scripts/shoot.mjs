import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const BASE = 'http://127.0.0.1:4321';
const jobs = [
  { route: '/', w: 1280, h: 1900, out: '_source/d-home.png' },
  { route: '/מעקות-אלומיניום-בנתניה/', w: 1280, h: 1700, out: '_source/d-service2.png' },
  { route: '/', w: 390, h: 1700, out: '_source/m-home2.png' },
];
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setCacheEnabled(false);
for (const j of jobs) {
  await p.setViewport({ width: j.w, height: j.h, deviceScaleFactor: 1, isMobile: j.w < 700 });
  await p.goto(BASE + encodeURI(j.route), { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 500));
  await p.screenshot({ path: j.out });
  console.log('shot', j.out);
}
await b.close();
