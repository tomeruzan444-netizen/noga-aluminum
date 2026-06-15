// Comprehensive migration-readiness audit of the built site (dist/).
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const base = join(__dir, '..');
const dist = join(base, 'dist');
const DOMAIN = 'https://noga-aluminum.co.il';
const P = (s) => console.log(s);
const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

// ---- gather all built pages ----
function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === 'index.html') acc.push(p);
  }
  return acc;
}
const pageFiles = walk(dist);
const routeOf = (file) => {
  let r = file.slice(dist.length).replace(/\\/g, '/').replace(/index\.html$/, '');
  return decode(r);
};
const builtRoutes = new Set(pageFiles.map(routeOf));

P('================ 1. URL STRUCTURE PARITY ================');
const oldUrls = readFileSync(join(base, '_source/old-page-urls.txt'), 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/).filter(Boolean);
let missing = 0, extra = 0;
for (const u of oldUrls) {
  let path = decode(u.replace(DOMAIN, ''));
  if (!path.endsWith('/')) path += '/';
  if (!builtRoutes.has(path)) { P(`  ❌ MISSING in new site: ${path}`); missing++; }
}
const oldSet = new Set(oldUrls.map((u) => { let p = decode(u.replace(DOMAIN, '')); if (!p.endsWith('/')) p += '/'; return p; }));
for (const r of builtRoutes) if (!oldSet.has(r) && r !== '/404/') { /* '/' is home (in old as domain root) */ if (r === '/') continue; P(`  ⚠️  EXTRA (not in old sitemap): ${r}`); extra++; }
P(`  Old page URLs: ${oldUrls.length} | Built pages: ${builtRoutes.size} | Missing: ${missing} | Extra: ${extra}`);
P(`  Home '/' present: ${builtRoutes.has('/')}`);

// ---- crawl all pages ----
const internalLinks = new Map(); // target route -> count
const badRefs = [];   // old-wp / problematic
const extImages = []; // images not local
const seoIssues = [];
const titles = new Map(), descs = new Map();
let totalH1Issues = 0, noCanon = 0, noJsonld = 0, noindexPages = [];
const httpRefs = new Set(), localhostRefs = new Set();

const WP_PATTERNS = /wp-content|wp-json|wp-admin|wp-includes|\/\?p=|\/category\/|\/tag\/|\/author\/|\/feed|xmlrpc|replytocom|elementor|\.php(?!.*contact)/i;

for (const file of pageFiles) {
  const html = readFileSync(file, 'utf8');
  const route = routeOf(file);

  // links
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const h = m[1];
    if (/^(mailto:|tel:|https:\/\/wa\.me|#|data:)/.test(h)) continue;
    if (/^https?:\/\//.test(h) && !h.includes('noga-aluminum.co.il')) continue; // external
    if (/^http:\/\//.test(h)) httpRefs.add(h);
    if (/localhost|127\.0\.0\.1/.test(h)) localhostRefs.add(h);
    if (WP_PATTERNS.test(h)) { badRefs.push({ route, type: 'link', h }); continue; }
    // internal
    let path = decode(h.replace(DOMAIN, '').split('#')[0]);
    if (path.startsWith('/')) {
      if (!path.endsWith('/') && !/\.[a-z0-9]+$/i.test(path)) path += '/';
      internalLinks.set(path, (internalLinks.get(path) || 0) + 1);
    }
  }
  // images
  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const s = m[1];
    if (s.includes('wp-content') || (s.includes('noga-aluminum.co.il') && !s.startsWith('/images'))) extImages.push({ route, s });
  }
  for (const m of html.matchAll(/(?:src|href|content)="(http:\/\/[^"]+)"/g)) httpRefs.add(m[1]);
  for (const m of html.matchAll(/(localhost|127\.0\.0\.1)/g)) localhostRefs.add(m[0]);

  // SEO
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const robots = (html.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || '';
  const h1count = (html.match(/<h1[\s>]/g) || []).length;
  const hasJsonld = /application\/ld\+json/.test(html);
  const hasOgImg = /property="og:image"/.test(html);

  if (!title) seoIssues.push(`${route}: missing <title>`);
  if (!desc) seoIssues.push(`${route}: missing description`);
  if (h1count !== 1) { seoIssues.push(`${route}: H1 count = ${h1count}`); totalH1Issues++; }
  const expectCanon = DOMAIN + route;
  if (decode(canon) !== expectCanon) { noCanon++; if (noCanon <= 5) seoIssues.push(`${route}: canonical mismatch -> ${decode(canon)}`); }
  if (!hasJsonld) { noJsonld++; }
  if (!hasOgImg) seoIssues.push(`${route}: missing og:image`);
  if (/noindex/i.test(robots)) noindexPages.push(route);
  if (title) titles.set(title, (titles.get(title) || 0) + 1);
  if (desc) descs.set(desc, (descs.get(desc) || 0) + 1);
}

P('\n================ 2. INTERNAL LINKS ================');
let brokenLinks = 0;
for (const [path, count] of internalLinks) {
  const target = path.endsWith('/') ? path : path + '/';
  const isAsset = /\.[a-z0-9]+$/i.test(path);
  if (isAsset) { if (!existsSync(join(dist, decode(path)))) { P(`  ❌ broken asset link: ${path}`); brokenLinks++; } continue; }
  if (!builtRoutes.has(target)) { P(`  ❌ broken internal link -> ${target} (${count}x)`); brokenLinks++; }
}
P(`  Unique internal link targets: ${internalLinks.size} | Broken: ${brokenLinks}`);
P(`  Old-WordPress / problematic refs: ${badRefs.length}`);
badRefs.slice(0, 10).forEach((b) => P(`    ⚠️  [${b.route}] ${b.h}`));

P('\n================ 3. IMAGES ================');
const imgFiles = existsSync(join(dist, 'images')) ? readdirSync(join(dist, 'images')) : [];
const webp = imgFiles.filter((f) => f.endsWith('.webp')).length;
const raster = imgFiles.filter((f) => /\.(png|jpe?g)$/i.test(f));
P(`  Image files in dist: ${imgFiles.length} (webp: ${webp}, raster kept: ${raster.length} -> ${raster.join(', ')})`);
P(`  External/hotlinked images (wp-content): ${extImages.length}`);
extImages.slice(0, 8).forEach((e) => P(`    ⚠️  [${e.route}] ${e.s}`));
// broken img check
let brokenImg = 0; const seen = new Set();
for (const file of pageFiles) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<img[^>]+src="(\/images\/[^"]+)"/g)) {
    const rel = m[1]; if (seen.has(rel)) continue; seen.add(rel);
    if (!existsSync(join(dist, decode(rel)))) { P(`  ❌ broken image: ${rel}`); brokenImg++; }
  }
}
P(`  Unique <img> refs: ${seen.size} | Broken: ${brokenImg}`);
const imgMB = imgFiles.reduce((s, f) => s + statSync(join(dist, 'images', f)).size, 0) / 1048576;
P(`  Total images size: ${imgMB.toFixed(2)} MB`);

P('\n================ 4. SEO / METADATA ================');
P(`  Pages: ${pageFiles.length}`);
P(`  Duplicate <title>: ${[...titles.values()].filter((v) => v > 1).length}`);
P(`  Duplicate descriptions: ${[...descs.values()].filter((v) => v > 1).length}`);
P(`  H1 issues (!=1): ${totalH1Issues}`);
P(`  Canonical mismatches: ${noCanon}`);
P(`  Pages without JSON-LD: ${noJsonld}`);
P(`  Pages with noindex: ${noindexPages.length} ${noindexPages.length ? '-> ' + noindexPages.join(', ') : ''}`);
seoIssues.slice(0, 12).forEach((s) => P(`    • ${s}`));
// sitemap + robots
const hasSitemap = existsSync(join(dist, 'sitemap.xml'));
const sm = hasSitemap ? readFileSync(join(dist, 'sitemap.xml'), 'utf8') : '';
P(`  sitemap.xml: ${hasSitemap ? (sm.match(/<url>/g) || []).length + ' URLs' : 'MISSING'} | lastmod: ${/<lastmod>/.test(sm)}`);
P(`  robots.txt: ${existsSync(join(dist, 'robots.txt'))}`);
P(`  404 page: ${existsSync(join(dist, '404.html'))}`);

P('\n================ 5. PERFORMANCE / WEIGHT ================');
const cssFiles = existsSync(join(dist, '_astro')) ? readdirSync(join(dist, '_astro')).filter((f) => f.endsWith('.css')) : [];
const jsFiles = existsSync(join(dist, '_astro')) ? readdirSync(join(dist, '_astro')).filter((f) => f.endsWith('.js')) : [];
const cssKB = cssFiles.reduce((s, f) => s + statSync(join(dist, '_astro', f)).size, 0) / 1024;
const jsKB = jsFiles.reduce((s, f) => s + statSync(join(dist, '_astro', f)).size, 0) / 1024;
const fontKB = existsSync(join(dist, 'fonts')) ? readdirSync(join(dist, 'fonts')).reduce((s, f) => s + statSync(join(dist, 'fonts', f)).size, 0) / 1024 : 0;
P(`  CSS: ${cssFiles.length} files, ${cssKB.toFixed(1)} KB total`);
P(`  JS:  ${jsFiles.length} files, ${jsKB.toFixed(1)} KB total`);
P(`  Fonts: ${fontKB.toFixed(1)} KB`);
// render-blocking check on a sample page
const sample = readFileSync(join(dist, 'מעקות-אלומיניום-בנתניה', 'index.html'), 'utf8');
const blockingCss = (sample.match(/<link[^>]+rel="stylesheet"[^>]*>/g) || []).filter((l) => !/media="print"/.test(l)).length;
const headJs = (sample.split('</head>')[0].match(/<script[^>]+src=/g) || []).length;
P(`  Sample page render-blocking CSS links: ${blockingCss}, blocking JS in head: ${headJs}`);
P(`  Sample page HTML size: ${(statSync(join(dist, 'מעקות-אלומיניום-בנתניה', 'index.html')).size / 1024).toFixed(1)} KB`);
P(`  External font requests (Google): ${/fonts\.googleapis|fonts\.gstatic/.test(sample) ? 'YES (bad)' : 'none ✓'}`);
P(`  Hero image eager+priority: ${/class="hero-bg"[^>]*fetchpriority="high"/.test(sample)}`);
const lazyImgs = (sample.match(/loading="lazy"/g) || []).length;
P(`  Lazy-loaded images on sample: ${lazyImgs}`);
const htmlSizes = pageFiles.map((f) => ({ r: routeOf(f), kb: statSync(f).size / 1024 })).sort((a, b) => b.kb - a.kb);
P(`  Largest HTML pages: ${htmlSizes.slice(0, 3).map((x) => `${x.kb.toFixed(0)}KB ${x.r}`).join(' | ')}`);
const distMB = walk(dist).length && (function sz(d){let t=0;for(const e of readdirSync(d,{withFileTypes:true})){const p=join(d,e.name);t+=e.isDirectory()?sz(p):statSync(p).size;}return t;})(dist) / 1048576;
P(`  Total dist size: ${distMB.toFixed(2)} MB`);

P('\n================ 6. TECH / SAFETY ================');
P(`  Insecure http:// refs: ${httpRefs.size} ${[...httpRefs].slice(0, 3).join(', ')}`);
P(`  localhost/127.0.0.1 refs: ${localhostRefs.size}`);
P('\n================ DONE ================');
