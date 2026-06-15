import { load } from 'cheerio';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const base = join(__dir, '..');
const file = process.argv[2] || '01_3652.html';
const html = readFileSync(join(base, '_source/raw', file), 'utf8');
const $ = load(html);
const clip = (s, n = 70) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);

const single = $('.elementor-location-single').first();
console.log('=== WIDGETS inside location-single (data-widget_type) ===');
single.find('[data-widget_type]').each((i, el) => {
  const wt = el.attribs['data-widget_type'];
  const txt = clip($(el).text(), 80);
  console.log(`${i}. [${wt}]  «${txt}»`);
});

console.log('\n=== SIDEBAR (element-92e797e) full text ===');
console.log(clip($('.elementor-element-92e797e').text(), 500));

console.log('\n=== FAQ / Toggle widgets ===');
single.find('.elementor-widget-toggle, .elementor-widget-accordion, .elementor-tab-title, .elementor-toggle-item').slice(0, 6).each((i, el) => {
  console.log(`${i}. ${el.attribs.class?.split(' ')[1]} :: ${clip($(el).text(), 120)}`);
});

console.log('\n=== HERO section (first section) text ===');
console.log(clip(single.find('section').first().text(), 200));

console.log('\n=== MAIN content widget: tag histogram ===');
const main = $('.elementor-element-ccabb7d');
const hist = {};
main.find('*').each((_, el) => { hist[el.tagName] = (hist[el.tagName]||0)+1; });
console.log(JSON.stringify(hist));
console.log('\n=== MAIN content: first 600 chars of innerHTML ===');
console.log(clip(main.find('.elementor-widget-container').first().html() || main.html(), 600));
