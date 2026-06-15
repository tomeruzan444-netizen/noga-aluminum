import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const BASE = 'http://127.0.0.1:4321';
const ROUTES = ['/', '/מעקות-אלומיניום-בנתניה/', '/תיקון-תריסים/'];

const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });

for (const route of ROUTES) {
  const page = await b.newPage();
  await page.setCacheEnabled(false);
  await page.evaluateOnNewDocument(() => {
    window.__cls = 0; window.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { const es = l.getEntries(); window.__lcp = es[es.length - 1].renderTime || es[es.length - 1].loadTime || es[es.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  let bytes = 0, reqs = 0;
  page.on('response', (r) => { reqs++; const h = r.headers()['content-length']; if (h) bytes += parseInt(h); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await page.goto(BASE + encodeURI(route), { waitUntil: 'load', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));
  const m = await page.evaluate(() => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;
    const nav = performance.getEntriesByType('navigation')[0] || {};
    // quality checks
    const imgsNoDim = [...document.querySelectorAll('.content img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length;
    const contentImgs = document.querySelectorAll('.content img').length;
    // heading order
    const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]);
    let skips = 0; for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) skips++;
    // form fields without label/aria-label
    const fields = [...document.querySelectorAll('input:not([type=hidden]):not([tabindex="-1"]), textarea')];
    const noLabel = fields.filter((f) => !f.getAttribute('aria-label') && !f.id && !f.closest('label')).length;
    // links/buttons without accessible name
    const emptyLinks = [...document.querySelectorAll('a')].filter((a) => !a.textContent.trim() && !a.getAttribute('aria-label')).length;
    const emptyBtns = [...document.querySelectorAll('button')].filter((bt) => !bt.textContent.trim() && !bt.getAttribute('aria-label')).length;
    return { fcp, dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, cls: window.__cls, lcp: window.__lcp, imgsNoDim, contentImgs, skips, noLabel, emptyLinks, emptyBtns };
  });
  console.log(`\n### ${route}`);
  console.log(`  FCP: ${m.fcp.toFixed(0)}ms | LCP: ${m.lcp.toFixed(0)}ms | CLS: ${m.cls.toFixed(3)} | DCL: ${m.dcl.toFixed(0)}ms | Load: ${m.load.toFixed(0)}ms`);
  console.log(`  Requests: ${reqs} | Transferred: ${(bytes / 1024).toFixed(0)} KB`);
  console.log(`  Content imgs missing width/height: ${m.imgsNoDim}/${m.contentImgs}  ${m.imgsNoDim ? '⚠️ CLS risk' : '✓'}`);
  console.log(`  Heading-order skips: ${m.skips} | Form fields w/o label: ${m.noLabel} | Empty links: ${m.emptyLinks} | Empty buttons: ${m.emptyBtns}`);
  await page.close();
}
await b.close();
