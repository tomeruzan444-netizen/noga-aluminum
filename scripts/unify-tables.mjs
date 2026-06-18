import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const dir = 'src/content/pages';
const TR = /<tr[^>]*>[\s\S]*?<\/tr>/;
const TD = /<td[^>]*>[\s\S]*?<\/td>/g;
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
const isPrice = (cellHtml) => {
  const t = text(cellHtml);
  return /\d/.test(t) && (/[-–]/.test(t) || /₪/.test(t) || /ש"ח/.test(t) || /\d{3}/.test(t));
};

let converted = 0, headed = 0, skipped = 0, filesChanged = 0;

for (const f of readdirSync(dir)) {
  if (!f.endsWith('.json')) continue;
  const path = `${dir}/${f}`;
  const j = JSON.parse(readFileSync(path, 'utf8'));
  let html = j.contentHtml || '';
  if (!html.includes('<table')) continue;
  let changed = false;

  html = html.replace(/<table[\s\S]*?<\/table>/g, (table) => {
    if (/<th[ >]/.test(table)) { skipped++; return table; }          // already has a header

    const firstTr = (table.match(TR) || [''])[0];
    const cells = firstTr.match(TD) || [];
    if (!cells.length) return table;

    const firstRowIsHeader = /<strong>/.test(firstTr) || !cells.some(isPrice);

    if (firstRowIsHeader) {
      // promote the existing first row to a real <th> header row
      const newFirst = firstTr.replace(/<td(\s[^>]*)?>/g, '<th$1>').replace(/<\/td>/g, '</th>');
      converted++; changed = true;
      return table.replace(firstTr, newFirst);
    }

    // genuinely headerless data table -> build a header from the column roles
    const priceIdx = cells.findIndex(isPrice);
    const labels = cells.map((_, i) =>
      i === 0 ? 'סוג העבודה' : i === priceIdx ? 'מחיר' : 'פירוט');
    const headerRow = '<tr>' + labels.map((l) => `<th>${l}</th>`).join('') + '</tr>';
    headed++; changed = true;
    return table.replace(/(<table[^>]*>\s*(?:<tbody[^>]*>\s*)?)/, `$1${headerRow}`);
  });

  if (changed) { j.contentHtml = html; writeFileSync(path, JSON.stringify(j, null, 2) + '\n', 'utf8'); filesChanged++; }
}

console.log(`✅ tables unified:`);
console.log(`   header rows promoted to <th>: ${converted}`);
console.log(`   header rows added (was data-only): ${headed}`);
console.log(`   already had <th> (left as-is): ${skipped}`);
console.log(`   files changed: ${filesChanged}`);
