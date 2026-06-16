import { Client } from 'basic-ftp';

const host = process.env.FTP_HOST, user = process.env.FTP_USER, password = process.env.FTP_PASS;
const c = new Client(60000);
c.ftp.verbose = false;
try {
  await c.access({ host, user, password, secure: false });
  console.log('✅ Logged in. PWD =', await c.pwd());

  for (const dir of ['/', '/public_html', '/domains/noga-aluminum.co.il/public_html']) {
    try {
      await c.cd(dir);
      const list = await c.list();
      console.log(`\n=== ${dir}  (${list.length} entries) ===`);
      for (const e of list.slice(0, 60)) {
        const t = e.isDirectory ? 'D' : (e.isSymbolicLink ? 'L' : 'F');
        console.log(`  ${t} ${String(e.permissions?.user ?? '')}${String(e.permissions?.group ?? '')}${String(e.permissions?.world ?? '')}  ${String(e.size).padStart(8)}  ${e.name}`);
      }
      if (list.length > 60) console.log(`  ... +${list.length - 60} more`);
    } catch (err) {
      console.log(`\n=== ${dir} === (cannot access: ${err.message})`);
    }
  }
} catch (err) {
  console.error('ERROR:', err.message);
  process.exitCode = 1;
} finally {
  c.close();
}
