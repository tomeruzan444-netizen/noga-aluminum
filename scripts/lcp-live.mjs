import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const BASE = 'https://noga-aluminum.co.il';
const ROUTES = ['/', '/מעקות-אלומיניום/', '/תיקון-חלונות/'];

const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
for (const route of ROUTES) {
  const page = await b.newPage();
  await page.setCacheEnabled(false);
  const client = await page.target().createCDPSession();
  // Slow 4G-ish + 4x CPU slowdown (Google's "mobile" lab profile)
  await client.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 });
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluateOnNewDocument(() => {
    window.__lcp = 0; window.__lcpEl = '';
    new PerformanceObserver((l) => { const es = l.getEntries(); const e = es[es.length - 1]; window.__lcp = e.renderTime || e.loadTime || e.startTime; window.__lcpEl = (e.element && (e.element.tagName + (e.element.className ? '.' + e.element.className : ''))) || e.url || '?'; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  let imgBytes = 0;
  page.on('response', (r) => { if ((r.headers()['content-type'] || '').startsWith('image/')) { const h = r.headers()['content-length']; if (h) imgBytes += parseInt(h); } });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await page.goto(BASE + encodeURI(route), { waitUntil: 'load', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 1500));
  const m = await page.evaluate(() => ({ fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0, lcp: window.__lcp, lcpEl: window.__lcpEl }));
  console.log(`${route}\n  FCP ${m.fcp.toFixed(0)}ms | LCP ${m.lcp.toFixed(0)}ms | LCP element: ${m.lcpEl} | image bytes: ${(imgBytes/1024).toFixed(0)}KB`);
  await page.close();
}
await b.close();
