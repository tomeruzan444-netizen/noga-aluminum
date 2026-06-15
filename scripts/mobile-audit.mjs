import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);

const BASE = 'http://127.0.0.1:4321';
const ROUTES = ['/', '/מעקות-אלומיניום-בנתניה/', '/תיקון-תריסים/', '/אודות/', '/צרו-קשר/'];

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setCacheEnabled(false);

async function audit(route, width, label, shotPath) {
  await page.setViewport({ width, height: 844, deviceScaleFactor: 2, isMobile: width < 700, hasTouch: width < 700 });
  const url = BASE + encodeURI(route);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 400));
  const m = await page.evaluate(() => {
    const de = document.documentElement;
    const overflowers = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        overflowers.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} (left=${Math.round(r.left)} right=${Math.round(r.right)} w=${Math.round(r.width)})`);
      }
    });
    const navHidden = (() => { const n = document.querySelector('.main-nav'); return n ? getComputedStyle(n).position : '?'; })();
    const fab = (() => { const f = document.querySelector('.floating'); return f ? getComputedStyle(f).display : '?'; })();
    const toggle = (() => { const t = document.querySelector('.nav-toggle'); return t ? getComputedStyle(t).display : '?'; })();
    return {
      scrollW: de.scrollWidth, clientW: de.clientWidth,
      overflow: de.scrollWidth > de.clientWidth + 1,
      overflowers: [...new Set(overflowers)].slice(0, 8),
      navPosition: navHidden, fabDisplay: fab, toggleDisplay: toggle,
    };
  });
  if (shotPath) await page.screenshot({ path: shotPath, fullPage: false });
  console.log(`[${label}] ${route}`);
  console.log(`   scrollW=${m.scrollW} clientW=${m.clientW}  H-OVERFLOW=${m.overflow}`);
  if (m.overflowers.length) console.log('   offenders: ' + m.overflowers.join(', '));
  if (label === 'MOBILE') console.log(`   nav.position=${m.navPosition} toggle.display=${m.toggleDisplay} fab.display=${m.fabDisplay}`);
  return m;
}

let bad = 0;
for (const r of ROUTES) {
  const m = await audit(r, 390, 'MOBILE', r === '/' ? '_source/m-home.png' : (r.includes('מעקות') ? '_source/m-service.png' : null));
  if (m.overflow) bad++;
}
console.log('\n--- desktop spot check ---');
await audit('/מעקות-אלומיניום-בנתניה/', 1280, 'DESKTOP', '_source/d-service.png');

console.log(`\n=== Mobile pages with horizontal overflow: ${bad}/${ROUTES.length} ===`);
await browser.close();
