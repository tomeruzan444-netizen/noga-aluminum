import { defineConfig } from 'astro/config';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Strips developer HTML comments (<!-- ... -->) from the final built HTML.
// They are non-rendering, non-functional notes that only add bytes; Astro's
// compressHTML keeps them. Conditional comments (<!--[ ... ]-->) are preserved
// just in case (the site has none). Runs after the build, on the output files only.
function stripHtmlComments() {
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = join(d, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
  return {
    name: 'strip-html-comments',
    hooks: {
      'astro:build:done': ({ dir }) => {
        for (const file of walk(fileURLToPath(dir))) {
          const html = readFileSync(file, 'utf8');
          const out = html.replace(/<!--[\s\S]*?-->/g, (m) => (m.startsWith('<!--[') ? m : ''));
          if (out !== html) writeFileSync(file, out);
        }
      },
    },
  };
}

// Static, fastest-possible output. URLs keep the exact WordPress structure
// (Hebrew slugs, trailing slash) so Google sees identical links.
export default defineConfig({
  site: 'https://noga-aluminum.co.il',
  trailingSlash: 'always',
  build: {
    format: 'directory', // /slug/index.html  -> served as /slug/
    inlineStylesheets: 'always', // fold the ~21KB stylesheet into the HTML so it isn't a render-blocking request (faster FCP/LCP on mobile)
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [stripHtmlComments()],
});
