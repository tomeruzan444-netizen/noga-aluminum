// Classifies every page into a service group and builds a custom sidebar per group.
import pagesIndex from './pages-index.json';

// Ordered rules - first match wins.
const RULES = [
  { key: 'core',       title: 'ניווט מהיר',            test: (r) => r === '/' || r === '/אודות/' || r === '/צרו-קשר/' },
  { key: 'legal',      title: 'מידע משפטי',            test: (r) => /מדיניות-פרטיות|הצהרת-נגישות|תנאי-שימוש/.test(r) },
  { key: 'railings',   title: 'מעקות אלומיניום',       test: (r) => /מעקות|מעקה/.test(r) },
  { key: 'fences',     title: 'גדרות אלומיניום',       test: (r) => /גדר/.test(r) },
  { key: 'pergolas',   title: 'פרגולות אלומיניום',     test: (r) => /פרגול/.test(r) },
  { key: 'gates',      title: 'שערי אלומיניום',        test: (r) => /שער/.test(r) },
  { key: 'enclosures', title: 'סגירות חורף ומרפסות',  test: (r) => /סגיר|מרפסת/.test(r) },
  { key: 'shutters',   title: 'תריסים - תיקון והתקנה', test: (r) => /תריס/.test(r) },
  { key: 'windows',    title: 'חלונות, ויטרינות ודלתות', test: (r) => /חלו|ויטרינ|זכוכי|רשת|דלת|גלגלים/.test(r) },
  { key: 'works',      title: 'עבודות אלומיניום באזורך', test: (r) => /עבודות-אלומיניום/.test(r) },
  { key: 'metalwork',  title: 'ריתוך, הלחמה ותיקונים', test: (r) => /ריתוך|הלחמ|תיקוני-אלומיניום|איש-אלומיניום/.test(r) },
];

function labelFromRoute(route) {
  if (route === '/') return 'עמוד הבית';
  return decodeURIComponent(route).replace(/\//g, '').replace(/-/g, ' ').trim();
}

function decode(route) { try { return decodeURIComponent(route); } catch { return route; } }

export function getGroupKey(route) {
  const r = decode(route);
  for (const rule of RULES) if (rule.test(r)) return rule.key;
  return 'works';
}

const META = Object.fromEntries(RULES.map((r) => [r.key, r]));

// Pre-build, for each group, the list of its pages (label + route).
const byGroup = {};
for (const p of pagesIndex) {
  const k = getGroupKey(p.route);
  (byGroup[k] ||= []).push({ route: p.route, label: labelFromRoute(p.route) });
}
// Stable, readable order inside each group.
for (const k of Object.keys(byGroup)) byGroup[k].sort((a, b) => a.label.localeCompare(b.label, 'he'));

const allPages = pagesIndex.map((p) => ({ route: p.route, label: labelFromRoute(p.route) }));

// ---- city detection (multi-word first) + token relevance ----
const CITIES = ['ראשון לציון', 'הוד השרון', 'תל אביב', 'רמת גן', 'פתח תקווה', 'נתניה', 'חיפה',
  'גבעתיים', 'רעננה', 'רחובות', 'ירושלים', 'חולון', 'אשדוד', 'קיסריה', 'טבריה', 'כרמיאל', 'נהריה', 'נשר'];
const norm = (route) => decode(route).replace(/\//g, '').replace(/-/g, ' ').trim();

export function extractCity(route) {
  const n = norm(route);
  return CITIES.find((c) => n.includes(c)) || null;
}

const STOP = new Set(['אלומיניום', 'מידע', 'ומחירים', 'כולל', 'מחיר', 'מחירים', 'של', 'עם', 'ב', 'ה', 'ל', 'את', 'ועוד']);
const tokens = (route) => norm(route).split(' ').filter((t) => t && !STOP.has(t));
const overlap = (a, b) => { const s = new Set(b); return a.reduce((n, t) => n + (s.has(t) ? 1 : 0), 0); };

export function getSidebar(route) {
  const r = decode(route);
  const key = getGroupKey(r);
  const curTokens = tokens(r);

  // Group links, sorted by relevance to the current page, capped.
  let items = (byGroup[key] || []).map((it) => ({
    ...it, active: it.route === r, score: overlap(curTokens, tokens(it.route)),
  }));
  items.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'he'));
  const CAP = 10;
  if (items.length > CAP) {
    items = items.slice(0, CAP);
    if (!items.some((x) => x.active)) {
      const act = (byGroup[key] || []).find((x) => x.route === r);
      if (act) items[CAP - 1] = { ...act, active: true, score: 99 };
    }
  }

  // Cross-group links for the same city - highly tailored to this page.
  const city = extractCity(r);
  const cityItems = city
    ? allPages.filter((p) => p.route !== r && extractCity(p.route) === city).slice(0, 6)
    : [];

  return { key, title: META[key].title, items, city, cityItems };
}

export const groupsSummary = Object.fromEntries(
  Object.entries(byGroup).map(([k, v]) => [k, { title: META[k].title, count: v.length }])
);

// Per-category hero image so each service group shows a relevant photo (not the same
// team photo everywhere). Groups without an entry (core/legal/works) fall back to the
// team photo, which keeps its responsive srcset for a fast LCP.
const HERO_BY_GROUP = {
  railings:   { src: '/images/מעקה-למרפסת.webp', w: 1536, h: 1024 },
  fences:     { src: '/images/גדר-אלומיניום.webp', w: 600, h: 400 },
  pergolas:   { src: '/images/פרגולת-אלומיניום.webp', w: 700, h: 400 },
  gates:      { src: '/images/שער-אלומיניום-לחניה.webp', w: 1006, h: 483 },
  enclosures: { src: '/images/סגירת-מרפסת-שמש.webp', w: 1024, h: 1024 },
  shutters:   { src: '/images/תיקון-תריסים.webp', w: 700, h: 400 },
  windows:    { src: '/images/תיקון-חלונות-1.webp', w: 700, h: 400 },
  metalwork:  { src: '/images/ריתוך-אלומיניום.webp', w: 1536, h: 1024 },
};

// Returns the category hero {src,w,h} for a route, or null to use the default team photo.
export function getHero(route) {
  return HERO_BY_GROUP[getGroupKey(route)] || null;
}
