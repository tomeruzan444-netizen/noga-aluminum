import { Client } from 'basic-ftp';
const host = process.env.FTP_HOST, user = process.env.FTP_USER, password = process.env.FTP_PASS;
const c = new Client(120000);
try {
  await c.access({ host, user, password, secure: false });

  // 1) permissions of the images dir itself (in the served root)
  await c.cd('/public_html');
  const root = await c.list();
  const imgEntry = root.find(e => e.name === 'images');
  console.log('images dir perms:', imgEntry ? `u=${imgEntry.permissions?.user} g=${imgEntry.permissions?.group} w=${imgEntry.permissions?.world}` : 'MISSING');

  // 2) any .htaccess INSIDE images that could deny?
  await c.cd('images');
  const inside = await c.list();
  console.log('has .htaccess inside images:', inside.some(e => e.name === '.htaccess'));
  console.log('file count in images:', inside.length);

  // 3) fix: ensure dir is traversable (755) and files readable (644)
  await c.cd('/public_html');
  try { console.log('SITE CHMOD 755 images ->', (await c.send('SITE CHMOD 755 images')).message); } catch (e) { console.log('chmod dir err:', e.message); }
  console.log('✅ done');
} catch (e) { console.error('ERROR:', e.message); }
finally { c.close(); }
