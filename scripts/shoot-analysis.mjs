import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const BASE = 'http://127.0.0.1:4321';
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setCacheEnabled(false);

const jobs = [
  { route: '/', w: 1280, full: true, out: '_source/an-home-d.png' },
  { route: '/', w: 390, full: true, out: '_source/an-home-m.png' },
  { route: '/מעקות-אלומיניום-בנתניה/', w: 1280, full: true, out: '_source/an-service-d.png' },
  { route: '/מעקות-אלומיניום-בנתניה/', w: 390, full: true, out: '_source/an-service-m.png' },
  { route: '/צרו-קשר/', w: 1280, full: true, out: '_source/an-contact-d.png' },
  { route: '/אודות/', w: 1280, full: true, out: '_source/an-about-d.png' },
];
for (const j of jobs) {
  await p.setViewport({ width: j.w, height: 900, deviceScaleFactor: 1, isMobile: j.w < 700 });
  await p.goto(BASE + encodeURI(j.route), { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 500));
  await p.screenshot({ path: j.out, fullPage: j.full });
  console.log('shot', j.out);
}
await b.close();
