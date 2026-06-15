// Content corrections — fixes only clear spelling/grammar/garble errors found in audit.
// Applied during extraction so they survive re-extraction. No content is added or removed
// beyond collapsing accidental duplications and removing extraction artifacts (e.g. "Retry").
// Each entry: [find, replace]. Strings must match the cleaned extracted text exactly.

export const CORRECTIONS = [
  // --- spelling typos ---
  ['דומי עץ', 'דמוי עץ'],
  ['לפי לסוג הפרופיל', 'לפי סוג הפרופיל'],
  ['עלומיניום', 'אלומיניום'],
  ['אלומניום', 'אלומיניום'],
  ['נוגהמ אלומיניום', 'נוגה אלומיניום'],
  ['איכוtiים', 'איכותיים'],
  ['מחיר התקה של תריס ציר', 'מחיר התקנה של תריס ציר'],
  ['לטריסי אלומיניום', 'לתריסי אלומיניום'],
  ['עשוייות מאלומיניום', 'עשויות מאלומיניום'],
  ['האופניה לתקן', 'האופציה לתקן'],
  ['את צהאסטטיקה', 'את האסטטיקה'],
  ['מרו קשר עם נוגה', 'צרו קשר עם נוגה'],
  ['הרבה שני בתחום', 'הרבה שנים בתחום'],
  ['ועמס מנוע', 'ועומס מנוע'],
  ['מזג האויר', 'מזג האוויר'],
  ['מזג אויר', 'מזג אוויר'],
  ['על מ להתאימו', 'על מנת להתאימו'],

  // --- garbled / merged words (insert the missing separator) ---
  ['צריכיםהתקנת תריס', 'צריכים התקנת תריס'],
  ['התריסים בבמחיר', 'התריסים במחיר'],
  ['וiwבדוק', 'ויבדוק'],
  ['שלבים מ- מאלומיניום', 'שלבים מאלומיניום'],
  ['כבריתר מ 10', 'כבר יותר מ-10'],
  ['בעלות מחנה משותף', 'בעלות מכנה משותף'],
  ['נוגה אלומיניום.חברה מובילה', 'נוגה אלומיניום. חברה מובילה'],

  // --- grammar / agreement ---
  ['אנחנו ישמח לייעץ', 'אנחנו נשמח לייעץ'],
  ['ובכללי לחלונות', 'ובכלל לחלונות'],
  ['היכן את גרים', 'היכן אתם גרים'],
  ['עמיד מקורוזיה ותנאי', 'עמיד בפני קורוזיה ותנאי'],
  ['אם זה ויטרינה', 'אם זו ויטרינה'],
  ['חורף אלומיניום מעוצבות במחירים', 'חורף אלומיניום מעוצבת במחירים'],
  ['לסגירות חורף אטומה מפני', 'לסגירות חורף אטומות מפני'],
  ['רוב הדלתות יש להן ברגי', 'ברוב הדלתות יש ברגי'],
  ['קורה שוב, קרא לטכנאי', 'קורה שוב, קראו לטכנאי'],
  ['אנטומיה מושלמת של התריס', 'תפקוד מושלם של התריס'],

  // --- wrong field/term (clearly the wrong word, business is aluminum) ---
  ['בתחום המנעולנות ולא', 'בתחום האלומיניום ולא'],
  ['לחכות לשרת אתם על', 'לחכות לשרת אתכם על'],

  // --- collapse accidental word duplications (a stutter, not content) ---
  ['מוניטין מוניטין מוכח', 'מוניטין מוכח'],
  ['מרחק מרחק מרכזי', 'מרחק מרכזי'],
  ['חומר עמיד ועמיד למזג', 'חומר עמיד למזג'],

  // --- relocate misplaced word (no content removed; "התקנת" belongs to next item) ---
  ['אתגר.התקנת</li><li><strong>פרגולות אלומיניום -', 'אתגר.</li><li><strong>התקנת פרגולות אלומיניום -'],

  // --- fix a broken/malformed link (pointed to an invalid "http://" + Hebrew URL) ---
  ['href="http://התקנת גדר אלמיניום"', 'href="/התקנת-גדר-אלומיניום/"'],

  // --- remove extraction artifacts (not site content) ---
  ['שיגיע.Retry', 'שיגיע.'],
  // de-duplicate the garbled "repair-or-replace" FAQ (question appeared twice + stray "ת:")
  ['<p>האם כדאי לתקן או לקנות חדש?<br>ת: ', '<p>'],
];

export function applyCorrections(str, counts) {
  if (!str) return str;
  let out = str;
  for (const [find, repl] of CORRECTIONS) {
    if (out.includes(find)) {
      const before = out;
      out = out.split(find).join(repl);
      const n = (before.length - out.length + (repl.length - find.length) * -0) ; // not exact; count occurrences
      const occ = before.split(find).length - 1;
      counts[find] = (counts[find] || 0) + occ;
    }
  }
  return out;
}
