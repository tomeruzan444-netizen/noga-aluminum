# נוגה אלומיניום — אתר חדש (Astro)

אתר סטטי מהיר שנבנה מאפס (ללא וורדפרס/אלמנטור), שומר 1:1 על התוכן, ה-URLs והמטא-דאטא של האתר הקיים.

## הפעלה מקומית
```bash
npm install      # פעם אחת
npm run dev      # שרת פיתוח → http://localhost:4321
npm run build    # בונה את האתר הסטטי לתיקיית dist/
npm run preview  # מציג את התוצאה הבנויה → http://localhost:4321
```

## מבנה
- `src/content/pages/*.json` — התוכן של כל 71 העמודים (חולץ מהאתר החי, read-only).
- `src/data/site.js` — פרטי העסק, תפריט, פוטר.
- `src/data/groups.js` — חלוקת העמודים לקבוצות + סיידבר ייעודי לכל קבוצה.
- `src/layouts/BaseLayout.astro` — head, מטא, JSON-LD, הדר, פוטר.
- `src/pages/[...slug].astro` — מייצר את כל העמודים.
- `src/styles/global.css` — מערכת העיצוב (צבעי המותג, גופן Assistant, RTL).
- `public/images/` — כל התמונות.
- `public/contact.php` — מטפל טופס יצירת הקשר (שולח מייל; עובד על Hostinger/PHP).
- `public/robots.txt`, `sitemap.xml` — SEO.

## סקריפטים לחילוץ (חד-פעמי, מול האתר הישן)
- `scripts/extract.mjs` — מחלץ תוכן נקי מ-`_source/raw/`.
- `scripts/collect-images.mjs` — אוסף רשימת תמונות.

## פריסה (GitHub → Hostinger)
ראה **[DEPLOY.md](DEPLOY.md)** — פריסה אוטומטית: `git push` → GitHub Actions בונה ומעלה ל-Hostinger.
האתר עולה תחילה לדומיין זמני **חסום מאינדוקס** (סיסמה + noindex), ורק בסוף מוחלף לאתר החי.
