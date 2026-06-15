// One-time PRODUCTION migration: archive the live WordPress site aside and publish
// our static Astro site in its place. Runs in CI with FTP creds from GitHub secrets.
// SAFE: locates the real WP root (wp-content + wp-includes) and ABORTS if not found —
// nothing is touched unless we are certainly in the live WordPress root. WordPress is
// MOVED (renamed) into a backup folder, never bulk-deleted, so rollback is instant.
import { Client } from 'basic-ftp';

const host = process.env.FTP_HOST;
const user = process.env.FTP_USER;
const password = process.env.FTP_PASS;
if (!host || !user || !password) { console.error('Missing FTP_HOST/FTP_USER/FTP_PASS'); process.exit(1); }

const ARCHIVE = '_pre_migration_backup';
const PRESERVE = new Set(['.well-known', ARCHIVE]); // keep SSL challenge dir

const c = new Client(180000);
c.ftp.verbose = false;
try {
  await c.access({ host, user, password, secure: false });
  console.log('Logged in. Start dir:', await c.pwd());

  // ---- locate the live WordPress root ----
  let found = false;
  for (const rel of ['', 'public_html', 'domains/noga-aluminum.co.il/public_html']) {
    await c.cd('/');
    if (rel) { try { await c.cd(rel); } catch { continue; } }
    let list; try { list = await c.list(); } catch { continue; }
    const isWpRoot = list.some((e) => e.name === 'wp-content') && list.some((e) => e.name === 'wp-includes');
    console.log(`  probe "${await c.pwd()}" -> wp-root=${isWpRoot} (${list.length} entries)`);
    if (isWpRoot) { found = true; break; }
  }
  if (!found) {
    console.error('\n❌ ABORT: live WordPress root (wp-content + wp-includes) not found. Nothing changed.');
    process.exit(1);
  }
  const root = await c.pwd();
  console.log('\n✅ Live WordPress root:', root);

  // ---- archive everything currently here (WP + any leftovers) ----
  await c.send('MKD ' + ARCHIVE).catch(() => {});
  const entries = await c.list();
  let archived = 0;
  for (const e of entries) {
    if (PRESERVE.has(e.name)) continue;
    try { await c.rename(e.name, `${ARCHIVE}/${e.name}`); archived++; if (archived <= 60) console.log('  archived ->', e.name); }
    catch (err) { console.log('  could not move', e.name, '-', err.message); }
  }
  console.log(`\n✅ Archived ${archived} items into ${ARCHIVE}/ (WordPress is safe & reversible).`);

  // ---- publish our static site ----
  await c.cd(root);
  await c.uploadFromDir('dist');
  // make sure dotfiles (.htaccess) made it
  try { await c.uploadFrom('dist/.htaccess', '.htaccess'); } catch {}
  console.log('\n✅ Published static site to', root);

  const after = (await c.list()).map((e) => e.name);
  console.log('Root now contains:', after.join(', '));
  console.log('Has index.html:', after.includes('index.html'), '| has .htaccess:', after.includes('.htaccess'));
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
} finally {
  c.close();
}
