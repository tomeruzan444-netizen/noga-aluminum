// One-command publish: build -> upload dist/ to the live web root -> verify it's live.
// Reliable path that bypasses Hostinger's cloud-IP FTP block (runs from a local machine).
//
//   node scripts/publish.mjs
//
// Credentials: read from env (FTP_HOST/FTP_USER/FTP_PASS) or from C:\Users\tomer\.noga-ftp.json
// (kept outside the synced project folder so the password isn't pushed to git or OneDrive).
import { Client } from 'basic-ftp';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const WEB_ROOT = '/public_html';
const SITE = 'https://noga-aluminum.co.il/';

function creds() {
  let { FTP_HOST: host, FTP_USER: user, FTP_PASS: password } = process.env;
  const file = 'C:/Users/tomer/.noga-ftp.json';
  if ((!host || !user || !password) && existsSync(file)) {
    const j = JSON.parse(readFileSync(file, 'utf8'));
    host ||= j.host; user ||= j.user; password ||= j.password;
  }
  if (!host || !user || !password) throw new Error('Missing FTP credentials (env or C:\\Users\\tomer\\.noga-ftp.json)');
  return { host, user, password };
}

// 1) build
console.log('▶ Building (npx astro build)...');
execSync('npx astro build', { stdio: 'inherit' });

// 2) upload
const c = new Client(180000);
try {
  await c.access({ ...creds(), secure: false });
  await c.cd(WEB_ROOT);
  if (await c.pwd() !== WEB_ROOT) throw new Error('Unexpected web root: ' + (await c.pwd()));
  // safety: never upload the raw repo into the web root
  if (existsSync('dist/index.html') === false) throw new Error('dist/index.html missing — did the build fail?');
  console.log(`▶ Uploading dist/ -> ${WEB_ROOT} ...`);
  await c.uploadFromDir('dist');
  try { await c.uploadFrom('dist/.htaccess', '.htaccess'); } catch {}
  // keep the images dir traversable (Hostinger sometimes resets this on overwrite)
  try { await c.cd(WEB_ROOT); await c.send('SITE CHMOD 755 images'); } catch {}
  console.log('▶ Upload complete.');
} catch (e) {
  console.error('❌ Deploy failed:', e.message);
  process.exit(1);
} finally {
  c.close();
}

// 3) verify the live site
console.log('▶ Verifying live site...');
let ok = false;
for (let i = 0; i < 8; i++) {
  await new Promise((r) => setTimeout(r, 4000));
  try {
    const res = await fetch(SITE, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const blockingCss = (html.match(/rel="stylesheet"/g) || []).length;
    if (res.status === 200 && html.includes('<title>')) {
      console.log(`  ✅ ${SITE} -> 200 | render-blocking CSS: ${blockingCss} | ${(html.length / 1024).toFixed(0)}KB`);
      ok = true; break;
    }
    console.log(`  ...status ${res.status}`);
  } catch (e) { console.log('  ...retry', e.message); }
}
if (!ok) { console.error('❌ Live verification failed — check the site!'); process.exit(1); }
console.log('✅ Published & verified live.');
