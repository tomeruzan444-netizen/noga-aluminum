import pages from '../data/pages-index.json';
import lastmod from '../data/lastmod.json';
import { site } from '../data/site.js';

export async function GET() {
  const urls = pages.map((p) => {
    const loc = site.domain + encodeURI(p.route);
    const priority = p.route === '/' ? '1.0' : '0.8';
    const lm = lastmod[p.route] ? `\n    <lastmod>${lastmod[p.route]}</lastmod>` : '';
    return `  <url>\n    <loc>${loc}</loc>${lm}\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
