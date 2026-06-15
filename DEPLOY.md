# מדריך פריסה — נוגה אלומיניום

תהליך העבודה: **עורכים דרך Claude Code → `git push` → GitHub Actions בונה ומעלה אוטומטית ל-Hostinger.**

האתר עולה תחילה ל**דומיין זמני חסום מאינדוקס**, ורק בסוף מוחלף לאתר החי.

---

## חלק א' — הקמה חד-פעמית

### 1. יצירת מאגר (repo) ב-GitHub
1. היכנס ל-https://github.com/new
2. שם: `noga-aluminum` · בחר **Private** · אל תסמן שום קובץ נוסף (README/gitignore) · לחץ **Create repository**.
3. העתק את כתובת ה-repo (למשל `https://github.com/USERNAME/noga-aluminum.git`).

### 2. חיבור המאגר המקומי ל-GitHub והעלאה
ב-Claude Code (או בטרמינל בתיקיית הפרויקט) הרץ:
```bash
git remote add origin https://github.com/USERNAME/noga-aluminum.git
git push -u origin main
```
> אם תתבקש להזדהות — השתמש בשם המשתמש ובאסימון (Personal Access Token) של GitHub.

### 3. יצירת דומיין זמני ב-Hostinger
ב-hPanel של Hostinger:
- **אפשרות א' (מומלץ):** Domains → Subdomains → צור תת-דומיין, למשל `staging` → ייווצר `staging.noga-aluminum.co.il`.
- **אפשרות ב':** השתמש בדומיין התצוגה החינמי של Hostinger (`...hostingersite.com`).

רשום לעצמך את **תיקיית היעד** של תת-הדומיין (למשל `/home/uXXXX/domains/staging.noga-aluminum.co.il/public_html`).

### 4. חסימת אינדוקס — הגנת סיסמה (הכי חשוב!)
ב-hPanel:
- **Advanced → Password Protect Directories** (או "Directory Privacy").
- בחר את תיקיית תת-הדומיין → הגדר **שם משתמש + סיסמה** → שמור.

זה חוסם את גוגל לחלוטין (אי אפשר לסרוק אתר עם סיסמה → אי אפשר לאנדקס). **שכבת ההגנה העיקרית.**

> לשכבת ביטחון נוספת: העלה את הקובץ `deploy/staging.htaccess` (מהפרויקט) לתיקיית תת-הדומיין ושנה את שמו ל-`.htaccess` (מוסיף כותרת `noindex` + דחיסה + מטמון).

### 5. קבלת פרטי FTP מ-Hostinger
ב-hPanel: **Files → FTP Accounts**. רשום:
- **FTP Host** (כתובת שרת, למשל `ftp.noga-aluminum.co.il` או IP)
- **FTP Username**
- **FTP Password**
- **תיקיית היעד** מסעיף 3.

### 6. הזנת ה-secrets ב-GitHub
ב-repo ב-GitHub: **Settings → Secrets and variables → Actions → New repository secret**. צור 4 סודות:

| שם הסוד | ערך |
|---------|-----|
| `FTP_HOST` | כתובת ה-FTP מ-Hostinger |
| `FTP_USERNAME` | שם המשתמש ב-FTP |
| `FTP_PASSWORD` | הסיסמה ב-FTP |
| `FTP_REMOTE_DIR` | תיקיית היעד, **חייב להסתיים ב-/** — למשל `/domains/staging.noga-aluminum.co.il/public_html/` |

> הסודות מאוחסנים מוצפנים ב-GitHub — Claude לא רואה אותם, וזה מאובטח.

---

## חלק ב' — הפעלה ראשונה
לאחר שהגדרת את 4 הסודות, הפעל פריסה:
- ב-GitHub: **Actions → "Build & Deploy to Hostinger" → Run workflow**, **או** פשוט עשה `git push` כלשהו.
- ה-Action ירוץ ~1-2 דקות (Install → Build → FTP). אפשר לעקוב בלשונית Actions.
- כשמסתיים בירוק ✅ — היכנס לדומיין הזמני (יבקש את הסיסמה מסעיף 4) ותראה את האתר.

---

## חלק ג' — תהליך העבודה השוטף (עריכה דרך Claude Code)
מעכשיו, כל שינוי הוא פשוט:
1. אומרים ל-Claude Code מה לערוך → הוא משנה את הקבצים.
2. Claude עושה: `git add -A && git commit -m "..." && git push`
3. GitHub Actions בונה ומעלה אוטומטית — תוך ~2 דקות זה לייב בדומיין הזמני.

אין צורך להעלות ידנית כלום. 🎉

---

## חלק ד' — ההחלפה הסופית לאתר החי (כשהכל מוכן)
> בצע רק כשמאשרים סופית שהאתר הזמני מושלם. **גבה את האתר הישן לפני כן** (Hostinger → Backups).
1. שנה את `FTP_REMOTE_DIR` ב-GitHub Secrets לתיקיית הדומיין הראשי (`public_html` של `noga-aluminum.co.il`).
2. העלה את `deploy/production.htaccess` כ-`.htaccess` בתיקיית הדומיין הראשי (HTTPS + הפניות + אבטחה, **בלי** noindex).
3. הסר את הגנת הסיסמה מהדומיין הזמני (אם רוצים) והפעל פריסה (`git push` או Run workflow).
4. ב-Google Search Console: הגש את `https://noga-aluminum.co.il/sitemap.xml` ונטר כיסוי.

---

## פתרון תקלות
- **Action נכשל ב-Build:** בדוק את הלוג ב-Actions. לרוב חבילה חסרה — נדיר, כי `package-lock.json` נעול.
- **Action נכשל ב-FTP:** ודא שה-4 סודות נכונים ושה-`FTP_REMOTE_DIR` מסתיים ב-`/`.
- **האתר עולה ריק:** ודא שתיקיית היעד נכונה (ה-`public_html` של תת-הדומיין, לא תיקיית-העל).
