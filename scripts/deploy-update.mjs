// Ongoing PRODUCTION deploy: uploads the freshly built dist/ over the live site.
// Locates the live docroot by our own markers (_astro + index.html) so it is robust
// to Hostinger's FTP path quirks, and ABORTS if the live site isn't found there.
import { Client } from 'basic-ftp';

const host = process.env.FTP_HOST, user = process.env.FTP_USER, password = process.env.FTP_PASS;
if (!host || !user || !password) { console.error('Missing FTP creds'); process.exit(1); }

const c = new Client(180000);
c.ftp.verbose = false;
try {
  await c.access({ host, user, password, secure: false });
  console.log('Logged in at', await c.pwd());

  // Only probe public_html paths (the FTP home root holds stale leftovers we must NOT target).
  let found = false;
  for (const rel of ['public_html', 'domains/noga-aluminum.co.il/public_html']) {
    await c.cd('/');
    try { await c.cd(rel); } catch { continue; }
    let list; try { list = await c.list(); } catch { continue; }
    const isLiveSite = list.some((e) => e.name === 'index.html')
      && (list.some((e) => e.name === '_pre_migration_backup') || list.some((e) => e.name === '_astro'));
    console.log(`  probe "${await c.pwd()}" -> live-site=${isLiveSite}`);
    if (isLiveSite) { found = true; break; }
  }
  if (!found) {
    console.error('❌ ABORT: live site docroot (_astro + index.html) not found. Nothing uploaded.');
    process.exit(1);
  }

  const root = await c.pwd();
  console.log('✅ Deploying to', root);
  await c.uploadFromDir('dist');
  try { await c.uploadFrom('dist/.htaccess', '.htaccess'); } catch {}
  console.log('✅ Live site updated.');
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
} finally {
  c.close();
}
