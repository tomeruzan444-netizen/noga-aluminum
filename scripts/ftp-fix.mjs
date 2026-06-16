import { Client } from 'basic-ftp';

const host = process.env.FTP_HOST, user = process.env.FTP_USER, password = process.env.FTP_PASS;
const c = new Client(180000);
c.ftp.verbose = false;
try {
  await c.access({ host, user, password, secure: false });
  await c.cd('/public_html');
  const pwd = await c.pwd();
  if (pwd !== '/public_html') throw new Error('Unexpected PWD: ' + pwd);

  const before = await c.list();
  const looksLikeLiveSite = before.some((e) => e.name === 'index.html') && before.some((e) => e.name === '_astro');
  if (looksLikeLiveSite) {
    console.log('⚠️  /public_html already looks like a built site — NOT clearing to avoid wiping it.');
    process.exit(0);
  }
  console.log(`Web root /public_html currently has ${before.length} entries (source repo). Clearing...`);
  await c.clearWorkingDir();
  console.log('  cleared.');

  console.log('Uploading dist/ -> /public_html ...');
  await c.uploadFromDir('dist');
  // make sure the dotfile made it
  try { await c.uploadFrom('dist/.htaccess', '.htaccess'); } catch {}

  const after = await c.list();
  const ok = after.some((e) => e.name === 'index.html') && after.some((e) => e.name === '_astro');
  console.log(`\n=== /public_html after deploy (${after.length} entries) ===`);
  console.log('  index.html present:', after.some((e) => e.name === 'index.html'));
  console.log('  _astro present    :', after.some((e) => e.name === '_astro'));
  console.log('  .htaccess present :', after.some((e) => e.name === '.htaccess'));
  console.log('  sitemap.xml       :', after.some((e) => e.name === 'sitemap.xml'));
  console.log(ok ? '\n✅ Web root restored.' : '\n❌ Something is off — index.html/_astro missing.');
} catch (err) {
  console.error('ERROR:', err.message);
  process.exitCode = 1;
} finally {
  c.close();
}
