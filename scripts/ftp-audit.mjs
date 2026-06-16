import { Client } from 'basic-ftp';
const host = process.env.FTP_HOST, user = process.env.FTP_USER, password = process.env.FTP_PASS;
const c = new Client(60000);
// anything that is source code / backup / config that must NOT live in the web root
const BAD = ['.git', '.github', 'src', 'scripts', 'deploy', 'node_modules', 'public',
  'package.json', 'package-lock.json', 'astro.config.mjs', 'README.md', 'DEPLOY.md',
  '.gitignore', '.env', 'tsconfig.json', '_pre_migration_backup', 'wp-config.php',
  'wp-admin', 'wp-content', 'wp-includes'];
try {
  await c.access({ host, user, password, secure: false });
  await c.cd('/public_html');
  const list = await c.list();
  console.log(`/public_html has ${list.length} entries.\n`);
  const bad = list.filter(e => BAD.includes(e.name) || e.name.startsWith('wp-'));
  if (bad.length) {
    console.log('⚠️ FOUND artifacts that should be removed from the web root:');
    bad.forEach(e => console.log(`   ${e.isDirectory ? 'DIR ' : 'FILE'}  ${e.name}`));
  } else {
    console.log('✅ Clean: no source/backup/WordPress artifacts in the web root.');
  }
  console.log('\nAll entries:');
  console.log('  ' + list.map(e => (e.isDirectory ? '[' + e.name + ']' : e.name)).join('  '));
} catch (e) { console.error('ERROR:', e.message); }
finally { c.close(); }
