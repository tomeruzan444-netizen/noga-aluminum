// Extracts clean, semantic content + metadata from the downloaded raw WordPress HTML.
// Read-only: operates entirely on local files in _source/raw. Produces src/content/pages/*.json
// and src/data/site.json. Never touches the live site.
import { load } from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { applyCorrections, CORRECTIONS } from './corrections.mjs';

const corrCounts = {};
const __dir = dirname(fileURLToPath(import.meta.url));
const base = join(__dir, '..');
const rawDir = join(base, '_source/raw');
const outDir = join(base, 'src/content/pages');
const dataDir = join(base, 'src/data');
mkdirSync(outDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/^﻿/, ''));
const index = readJson(join(base, '_source/index.json'));
const imgDims = readJson(join(base, 'src/data/image-dims.json'));
const DOMAIN = 'https://noga-aluminum.co.il';

// ---- slug map: old permalink (any encoding) -> clean route "/heb-slug/" ----
const slugByFile = {};
const routeByPath = {}; // decoded path without domain -> route
for (const e of index) {
  let p = decodeURIComponent(e.url).replace(DOMAIN, '');
  if (!p.startsWith('/')) p = '/' + p;
  if (!p.endsWith('/')) p += '/';
  const route = p === '/' ? '/' : p;
  slugByFile[e.file] = route;
  routeByPath[p] = route;
  // also index encoded form
  routeByPath[e.url.replace(DOMAIN, '')] = route;
}

function rewriteHref(href) {
  if (!href) return href;
  let h = href.trim();
  if (h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('https://wa.me') || h.startsWith('#')) return h;
  // internal?
  if (h.startsWith(DOMAIN) || h.startsWith('/')) {
    let path = h.replace(DOMAIN, '');
    try { path = decodeURIComponent(path); } catch {}
    if (!path.startsWith('/')) path = '/' + path;
    const [pure, hash] = path.split('#');
    let pp = pure;
    if (!pp.endsWith('/')) pp += '/';
    if (routeByPath[pp]) return routeByPath[pp] + (hash ? '#' + hash : '');
    return pp + (hash ? '#' + hash : '');
  }
  return h; // external
}

// ---- whitelist cleaner ----
const KEEP = new Set(['h2','h3','h4','h5','p','ul','ol','li','table','thead','tbody','tfoot','tr','td','th','caption','img','a','strong','b','em','i','br','blockquote','figure','figcaption','hr','span']);
const DROP = new Set(['script','style','svg','noscript','form','button','input','textarea','select','iframe','path','use','i','link','meta']);

const images = new Set();

function cleanNode($, el, out) {
  if (el.type === 'text') { out.push(el.data.replace(/ /g, ' ')); return; }
  if (el.type !== 'tag') return;
  const tag = el.tagName.toLowerCase();
  if (DROP.has(tag) && tag !== 'i') {
    // i sometimes used for icons; drop those too (handled below)
    if (tag === 'i') return;
    return;
  }
  const $el = $(el);
  if (!KEEP.has(tag)) {
    // unwrap: process children inline
    el.children.forEach((c) => cleanNode($, c, out));
    return;
  }
  // img
  if (tag === 'img') {
    let src = el.attribs['data-src'] || el.attribs.src || '';
    if (src.startsWith('data:')) src = el.attribs['data-src'] || '';
    if (!src) return;
    const abs = src.startsWith('http') ? src : DOMAIN + src;
    const fname = decodeURIComponent(abs.split('/').pop().split('?')[0]);
    images.add(abs);
    const webp = fname.replace(/\.(png|jpe?g)$/i, '.webp');
    const alt = (el.attribs.alt || '').replace(/"/g, '&quot;');
    const dim = imgDims[webp];
    const wh = dim ? ` width="${dim.w}" height="${dim.h}"` : '';
    out.push(`<img src="/images/${webp}" alt="${alt}"${wh} loading="lazy" decoding="async">`);
    return;
  }
  if (tag === 'br') { out.push('<br>'); return; }
  if (tag === 'hr') { out.push('<hr>'); return; }
  // span: unwrap unless it carries meaning -> just unwrap to reduce noise
  if (tag === 'span') { el.children.forEach((c) => cleanNode($, c, out)); return; }

  // build attrs
  let attrs = '';
  if (tag === 'a') {
    const href = rewriteHref(el.attribs.href || '');
    attrs = ` href="${href}"`;
    if (href.startsWith('http') && !href.includes('noga-aluminum')) attrs += ' target="_blank" rel="noopener"';
  }
  if (tag === 'td' || tag === 'th') {
    if (el.attribs.colspan) attrs += ` colspan="${el.attribs.colspan}"`;
    if (el.attribs.rowspan) attrs += ` rowspan="${el.attribs.rowspan}"`;
  }
  const inner = [];
  el.children.forEach((c) => cleanNode($, c, inner));
  let html = inner.join('');
  // drop empty inline/structural
  const textOnly = html.replace(/<[^>]+>/g, '').trim();
  if (!textOnly && tag !== 'img' && tag !== 'tr' && !html.includes('<img')) {
    if (['p','h2','h3','h4','h5','a','strong','b','em','li'].includes(tag)) return;
  }
  out.push(`<${tag}${attrs}>${html}</${tag}>`);
}

const BLOCK = new Set(['h2','h3','h4','h5','p','ul','ol','table','blockquote','figure','hr','img','div']);
function cleanHtml($, $container) {
  const out = [];
  $container.contents().each((_, c) => cleanNode($, c, out));
  let html = out.join('');
  // Re-parse and wrap orphan inline/text nodes (direct children of root) into <p>
  const $$ = load(`<div id="r">${html}</div>`, { decodeEntities: false });
  const root = $$('#r');
  const newChildren = [];
  let buffer = [];
  const flush = () => {
    if (!buffer.length) return;
    const frag = buffer.join('').trim();
    if (frag.replace(/<[^>]+>/g, '').trim() || frag.includes('<img')) newChildren.push(`<p>${frag}</p>`);
    buffer = [];
  };
  root.contents().each((_, c) => {
    if (c.type === 'text') { buffer.push(c.data); return; }
    const tag = c.tagName?.toLowerCase();
    if (BLOCK.has(tag)) { flush(); newChildren.push($$.html(c)); }
    else { buffer.push($$.html(c)); }
  });
  flush();
  html = newChildren.join('\n')
             .replace(/[ \t]+/g, ' ')
             .replace(/<p>\s*<\/p>/g, '')
             .replace(/\n{3,}/g, '\n\n')
             .trim();
  return html;
}

// ---- turn runs of >3 consecutive images into a slider ----
function wrapImageRuns(html) {
  const $$ = load(`<div id="r">${html}</div>`, { decodeEntities: false });
  const root = $$('#r')[0];
  const nodes = root.children.filter((c) => c.type === 'tag');
  const isImg = (el) => {
    if (el.tagName === 'img') return true;
    if (['p', 'figure'].includes(el.tagName)) {
      const $el = $$(el);
      return $el.find('img').length >= 1 && $el.text().replace(/\s+/g, '').trim() === '';
    }
    return false;
  };
  const out = [];
  let i = 0;
  while (i < nodes.length) {
    if (isImg(nodes[i])) {
      let j = i;
      const imgs = [];
      while (j < nodes.length && isImg(nodes[j])) {
        const im = nodes[j].tagName === 'img' ? nodes[j] : $$(nodes[j]).find('img')[0];
        imgs.push($$.html(im));
        j++;
      }
      if (imgs.length > 3) {
        const slides = imgs.map((h) => `<div class="slide">${h}</div>`).join('');
        out.push(
          `<div class="img-slider" data-slider>` +
          `<div class="slider-viewport"><div class="slider-track">${slides}</div></div>` +
          `<button type="button" class="slider-btn slider-prev" aria-label="תמונה קודמת">›</button>` +
          `<button type="button" class="slider-btn slider-next" aria-label="תמונה הבאה">‹</button>` +
          `<div class="slider-dots"></div></div>`
        );
      } else {
        for (let k = i; k < j; k++) out.push($$.html(nodes[k]));
      }
      i = j;
    } else {
      out.push($$.html(nodes[i]));
      i++;
    }
  }
  return out.join('\n');
}

// ---- per page ----
const files = readdirSync(rawDir).filter((f) => f.endsWith('.html')).sort();
const pagesMeta = [];

for (const file of files) {
  const html = readFileSync(join(rawDir, file), 'utf8');
  const $ = load(html, { decodeEntities: false });
  const route = slugByFile[file];

  const metaTitle = $('title').first().text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const robots = $('meta[name="robots"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const h1 = $('.elementor-widget-theme-post-title h1, h1.entry-title').first().text().trim()
           || $('h1').first().text().trim();

  // JSON-LD (rank math) – keep raw graph for reference
  let jsonld = null;
  const ld = $('script.rank-math-schema').first().html();
  if (ld) { try { jsonld = JSON.parse(ld); } catch {} }

  const postContent = $('.elementor-widget-theme-post-content .elementor-widget-container').first();

  // FAQ extraction from toggle widgets
  const faq = [];
  postContent.find('.elementor-toggle-item').each((_, item) => {
    const q = $(item).find('.elementor-tab-title').text().replace(/\s+/g, ' ').trim();
    const aOut = [];
    $(item).find('.elementor-tab-content').contents().each((_, c) => cleanNode($, c, aOut));
    const a = aOut.join('').replace(/\s+/g, ' ').trim();
    if (q && a) faq.push({ q, a });
  });
  // remove toggle widgets (their Q&A is captured in faq[] and rendered by the Faq component)
  postContent.find('.elementor-widget-toggle, .elementor-widget-accordion').remove();
  // remove the now-orphaned FAQ section heading so it isn't duplicated (Faq component adds its own)
  if (faq.length) {
    postContent.find('h1,h2,h3,h4,h5').each((_, el) => {
      const t = $(el).text().replace(/\s+/g, ' ').trim();
      if (/^שאלות ותשובות/.test(t) || /^שאלות נפוצות/.test(t)) $(el).remove();
    });
  }

  const contentHtml = wrapImageRuns(cleanHtml($, postContent));

  // Replace long dashes (en/em + entities) with a plain hyphen everywhere.
  const fixDashes = (s) => (s || '')
    .replace(/[‒–—―]/g, '-')
    .replace(/&#8211;|&#8212;|&#x2013;|&#x2014;|&ndash;|&mdash;/g, '-');
  // Apply audited content corrections (typos/garbles only).
  const fix = (s) => applyCorrections(fixDashes(s), corrCounts);
  const mTitle = fix(metaTitle);
  const mDesc = fix(metaDesc);
  const mH1 = fix(h1);
  const faqFixed = faq.map((x) => ({ q: fix(x.q), a: fix(x.a) }));

  const data = { route, file, metaTitle: mTitle, metaDesc: mDesc, canonical, robots, ogImage, h1: mH1, faq: faqFixed, contentHtml: fix(contentHtml) };
  const name = route === '/' ? 'home' : route.replace(/\//g, '').trim();
  writeFileSync(join(outDir, `${encodeURIComponent(name)}.json`), JSON.stringify(data, null, 2), 'utf8');
  pagesMeta.push({ route, name, h1: mH1, metaTitle: mTitle, faqCount: faq.length, contentLen: contentHtml.length });
}

writeFileSync(join(dataDir, 'pages-index.json'), JSON.stringify(pagesMeta, null, 2), 'utf8');
writeFileSync(join(base, '_source/images.json'), JSON.stringify([...images], null, 2), 'utf8');

console.log(`Extracted ${files.length} pages.`);
console.log(`Unique content images: ${images.size}`);
const applied = CORRECTIONS.filter(([f]) => corrCounts[f]).length;
const zero = CORRECTIONS.filter(([f]) => !corrCounts[f]).map(([f]) => f);
console.log(`\nCorrections applied: ${applied}/${CORRECTIONS.length} rules, total hits: ${Object.values(corrCounts).reduce((a, b) => a + b, 0)}`);
if (zero.length) { console.log('RULES WITH ZERO MATCHES (check string):'); zero.forEach((f) => console.log('  ✗ ' + f)); }
console.log('Sample:', JSON.stringify(pagesMeta[0], null, 2));
console.log('Shortest content pages:');
pagesMeta.sort((a,b)=>a.contentLen-b.contentLen).slice(0,5).forEach(p=>console.log(`  ${p.contentLen}  ${p.route}  (${p.h1})`));
