import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setCacheEnabled(false);
for (const w of [982, 990, 999, 1040]) {
  await p.setViewport({ width: w, height: 800 });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle0' });
  const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, ham: getComputedStyle(document.querySelector('.nav-toggle')).display }));
  console.log(`w=${w}: scrollW=${o.sw} overflow=${o.sw > o.cw + 1} hamburger=${o.ham}`);
}
await b.close();
