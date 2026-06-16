import { Client } from 'basic-ftp';
const host = process.env.FTP_HOST, user = process.env.FTP_USER, password = process.env.FTP_PASS;
const c = new Client(180000);
c.ftp.verbose = false;
try {
  await c.access({ host, user, password, secure: false });
  await c.cd('/public_html');
  if (await c.pwd() !== '/public_html') throw new Error('wrong PWD');
  console.log('Uploading dist/ -> /public_html (overwrite, no downtime) ...');
  await c.uploadFromDir('dist');
  try { await c.uploadFrom('dist/.htaccess', '.htaccess'); } catch {}
  const after = await c.list();
  console.log('  index.html:', after.some(e => e.name === 'index.html'),
              '| _astro:', after.some(e => e.name === '_astro'),
              '| images:', after.some(e => e.name === 'images'));
  console.log('✅ Deployed.');
} catch (e) { console.error('ERROR:', e.message); process.exitCode = 1; }
finally { c.close(); }
