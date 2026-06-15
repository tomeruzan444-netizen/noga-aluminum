import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setCacheEnabled(false);
// desktop header with a dropdown open
await p.setViewport({ width: 1280, height: 520 });
await p.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle0' });
await p.hover('.has-children .nav-link');
await new Promise(r => setTimeout(r, 400));
await p.screenshot({ path: '_source/hdr-desktop.png', clip: { x: 0, y: 0, width: 1280, height: 460 } });
// plain header
await p.goto('http://127.0.0.1:4321/מעקות-אלומיניום/', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 200));
await p.screenshot({ path: '_source/hdr-plain.png', clip: { x: 0, y: 0, width: 1280, height: 90 } });
console.log('done');
await b.close();
