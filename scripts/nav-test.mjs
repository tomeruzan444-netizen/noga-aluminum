import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const BASE = 'http://127.0.0.1:4321';
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setCacheEnabled(false);

// Desktop overflow at a few widths
for (const w of [1280, 1100, 1000]) {
  await p.setViewport({ width: w, height: 900 });
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
  const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log(`desktop ${w}: scrollW=${o.sw} overflow=${o.sw > o.cw + 1}`);
}

// Hover first dropdown, check submenu visible, screenshot
await p.setViewport({ width: 1280, height: 900 });
await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
await p.hover('.has-children .nav-link');
await new Promise(r => setTimeout(r, 400));
const vis = await p.evaluate(() => {
  const sm = document.querySelector('.has-children .submenu');
  const cs = getComputedStyle(sm);
  return { visibility: cs.visibility, opacity: cs.opacity, items: sm.querySelectorAll('a').length };
});
console.log('hover submenu:', JSON.stringify(vis));
await p.screenshot({ path: '_source/nav-desktop.png' });

// Mobile: open hamburger, expand a submenu
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
await p.click('.nav-toggle');
await new Promise(r => setTimeout(r, 300));
await p.click('.has-children .submenu-toggle');
await new Promise(r => setTimeout(r, 400));
const m = await p.evaluate(() => {
  const li = document.querySelector('.has-children.sub-open');
  const sm = li?.querySelector('.submenu');
  return { navOpen: document.querySelector('.main-nav').classList.contains('open'), subOpen: !!li, submenuMaxH: sm ? getComputedStyle(sm).maxHeight : 'n/a', overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
});
console.log('mobile menu:', JSON.stringify(m));
await p.screenshot({ path: '_source/nav-mobile.png' });
await b.close();
