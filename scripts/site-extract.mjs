import { load } from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const base = join(__dir, '..');
const DOMAIN = 'https://noga-aluminum.co.il';
const html = readFileSync(join(base, '_source/raw/01_3652.html'), 'utf8');
const $ = load(html, { decodeEntities: false });
const clip = (s,n=80)=>(s||'').replace(/\s+/g,' ').trim().slice(0,n);

console.log('=== ALL <img> on page (src | alt | context) ===');
$('img').each((i, el) => {
  let src = el.attribs['data-src'] || el.attribs.src || '';
  if (src.startsWith('data:')) src = el.attribs['data-src'] || el.attribs['data-lazy-src'] || '[inline-data]';
  const alt = el.attribs.alt || '';
  let ctx = 'content';
  if ($(el).closest('header').length) ctx = 'HEADER';
  else if ($(el).closest('footer').length) ctx = 'FOOTER';
  else if ($(el).closest('.elementor-widget-theme-post-content').length) ctx = 'post-content';
  else if ($(el).closest('.elementor-location-single').length) ctx = 'TEMPLATE';
  console.log(`${ctx}\t${decodeURIComponent(src.split('/').pop())}\t«${clip(alt,40)}»`);
});

console.log('\n=== HEADER nav links ===');
$('header a').each((_, el) => {
  const t = clip($(el).text(), 40); const h = el.attribs.href || '';
  if (t) console.log(`${t}\t${decodeURIComponent(h)}`);
});

console.log('\n=== Logo (header img src) ===');
console.log($('header img').first().attr('src') || $('header img').first().attr('data-src'));

console.log('\n=== FOOTER text ===');
console.log(clip($('footer').text(), 500));

console.log('\n=== Background images (style="...url()") in template ===');
$('.elementor-location-single [style*="url("], header [style*="url("]').slice(0,8).each((_,el)=>{
  const m=(el.attribs.style||'').match(/url\(([^)]+)\)/);
  if(m) console.log(decodeURIComponent(m[1].replace(/["']/g,'')));
});
