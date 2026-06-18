import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const dir = 'src/content/pages';
const norm = (tr) => tr.replace(/<[^>]+>/g, '|').replace(/\s+/g, '').toLowerCase();

function parse(tableHtml) {
  const inner = tableHtml
    .replace(/^<table[^>]*>/, '').replace(/<\/table>$/, '')
    .replace(/<\/?tbody[^>]*>/g, '').replace(/<\/?thead[^>]*>/g, '');
  const trs = inner.match(/<tr[\s\S]*?<\/tr>/g) || [];
  return { header: trs[0] || '', rows: trs.slice(1) };
}

let merged = 0, files = 0;

for (const f of readdirSync(dir)) {
  if (!f.endsWith('.json')) continue;
  const path = `${dir}/${f}`;
  const j = JSON.parse(readFileSync(path, 'utf8'));
  const html = j.contentHtml || '';
  if ((html.match(/<table/g) || []).length < 2) continue;

  // tokenize into text / table segments
  const parts = [];
  let last = 0;
  const re = /<table[\s\S]*?<\/table>/g; let m;
  while ((m = re.exec(html))) {
    if (m.index > last) parts.push({ t: 'text', html: html.slice(last, m.index) });
    parts.push({ t: 'table', html: m[0] });
    last = re.lastIndex;
  }
  if (last < html.length) parts.push({ t: 'text', html: html.slice(last) });

  const out = [];
  let changed = false;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].t !== 'table') { out.push(parts[i]); continue; }
    let { header, rows } = parse(parts[i].html);
    let j2 = i + 1, count = 0;
    while (j2 + 1 < parts.length && parts[j2].t === 'text' && /^\s*$/.test(parts[j2].html) && parts[j2 + 1].t === 'table') {
      const nxt = parse(parts[j2 + 1].html);
      if (norm(nxt.header) === norm(header) && header) { rows = rows.concat(nxt.rows); j2 += 2; count++; }
      else break;
    }
    if (count > 0) {
      out.push({ t: 'table', html: `<table><tbody>${header}${rows.join('')}</tbody></table>` });
      merged += count; changed = true; i = j2 - 1;
    } else out.push(parts[i]);
  }

  if (changed) {
    j.contentHtml = out.map((p) => p.html).join('');
    writeFileSync(path, JSON.stringify(j, null, 2) + '\n', 'utf8');
    files++;
  }
}
console.log(`✅ merged ${merged} adjacent same-header tables across ${files} files.`);
