import { Client } from 'basic-ftp';
const host = process.env.FTP_HOST, user = process.env.FTP_USER, password = process.env.FTP_PASS;
const c = new Client(60000);
try {
  await c.access({ host, user, password, secure: false });
  await c.cd('/public_html/images');
  const list = await c.list();
  const show = (n) => { const e = list.find(x => x.name === n); return e ? `size=${e.size} perm u=${e.permissions?.user} g=${e.permissions?.group} w=${e.permissions?.world} raw=${e.rawModifiedAt||''}` : 'MISSING'; };
  console.log('original   צוות-נוגה-אלומיניום.webp     :', show('צוות-נוגה-אלומיניום.webp'));
  console.log('variant800 צוות-נוגה-אלומיניום-800.webp :', show('צוות-נוגה-אלומיניום-800.webp'));
  console.log('variant1200 צוות-נוגה-אלומיניום-1200.webp:', show('צוות-נוגה-אלומיניום-1200.webp'));
} catch (e) { console.error('ERROR:', e.message); }
finally { c.close(); }
