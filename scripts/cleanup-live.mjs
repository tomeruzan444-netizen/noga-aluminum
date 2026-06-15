// SURGICAL cleanup: removes ONLY our deployed files that accidentally landed in
// public_html (the live WordPress root). Deletes from an explicit allowlist only —
// never touches wp-*, index.php, .htaccess, staging, .private, domains, etc.
import { Client } from 'basic-ftp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const base = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = JSON.parse(readFileSync(join(base, 'src/data/pages-index.json'), 'utf8').replace(/^﻿/, ''));

// Our page folders (decoded Hebrew slugs) + asset dirs + root files we uploaded.
const OUR_DIRS = new Set([
  ...pages.filter((p) => p.route !== '/').map((p) => decodeURIComponent(p.route).replace(/^\/|\/$/g, '')),
  '_astro', 'fonts', 'images',
]);
const OUR_FILES = new Set([
  'index.html', '404.html', 'contact.php', 'robots.txt', 'sitemap.xml', '.ftp-deploy-sync-state.json',
]);
// Things we must NEVER delete (sanity guard).
const PROTECTED = new Set(['wp-admin', 'wp-content', 'wp-includes', 'index.php', 'wp-config.php',
  '.htaccess', 'staging', '.private', 'domains', 'public_html', 'wp-login.php', 'xmlrpc.php',
  'license.txt', 'readme.html', 'wp-cron.php', 'wp-load.php', 'wp-settings.php', 'wp-blog-header.php',
  'wp-links-opml.php', 'wp-mail.php', 'wp-signup.php', 'wp-activate.php', 'wp-trackback.php', 'wp-comments-post.php']);

const PASS = process.env.FTP_PASS;
if (!PASS) { console.error('Set FTP_PASS env var first.'); process.exit(1); }

const c = new Client(30000);
c.ftp.verbose = false;
try {
  await c.access({ host: '82.29.187.1', user: 'u260375810.staging', password: PASS, secure: false });
  const pwd = await c.pwd();
  console.log('Connected. Working dir:', pwd);
  const list = await c.list();
  console.log(`\nRoot has ${list.length} entries. WordPress present: wp-content=${list.some((e) => e.name === 'wp-content')} wp-admin=${list.some((e) => e.name === 'wp-admin')} index.php=${list.some((e) => e.name === 'index.php')}`);
  if (!list.some((e) => e.name === 'wp-content')) {
    console.error('\n⚠️ SAFETY ABORT: wp-content not found here — not the expected directory. Nothing deleted.');
    process.exit(1);
  }

  let delDirs = 0, delFiles = 0, kept = [];
  for (const e of list) {
    if (PROTECTED.has(e.name)) { kept.push(e.name); continue; }
    const isDir = e.isDirectory;
    if (isDir && OUR_DIRS.has(e.name)) { await c.removeDir(e.name); console.log('  🗑️ dir  ' + e.name); delDirs++; }
    else if (!isDir && OUR_FILES.has(e.name)) { await c.remove(e.name); console.log('  🗑️ file ' + e.name); delFiles++; }
    else kept.push(e.name + (isDir ? '/' : ''));
  }
  console.log(`\nDeleted: ${delDirs} folders + ${delFiles} files (ours).`);
  console.log('KEPT (not ours / protected):', kept.join(', '));
} catch (err) {
  console.error('ERROR:', err.message);
} finally {
  c.close();
}
