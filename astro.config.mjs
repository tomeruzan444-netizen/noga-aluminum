import { defineConfig } from 'astro/config';

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
});
