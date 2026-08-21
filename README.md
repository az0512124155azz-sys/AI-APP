# Edu AI — אפליקציית AI לתלמידים (בסגנון Perplexity Computer Mode)

מנוע: NVIDIA NIM Cloud API · חיפוש: DuckDuckGo · Backend: Node/Express (SSE) · Frontend: React + Vite + Tailwind

---

## ⚠️ אבטחה — קריאה חובה לפני שמתחילים

1. שמת מפתחות NVIDIA אמיתיים בהודעה קודמת. **בטל אותם והנפק חדשים** בפאנל NGC של NVIDIA.
2. המפתחות **לא** נמצאים בשום קובץ קוד — רק ב-`.env` (שלא נכנס ל-Git, ראה `.gitignore`).
3. לעולם אל תחשוף `.env` בצד הלקוח (Frontend) — כל קריאות ה-NIM עוברות רק דרך ה-Backend.

## הרצה מהירה

```bash
# Backend
cd backend
cp ../.env.template .env    # ואז מלא מפתחות אמיתיים
npm install
npm run dev                  # http://localhost:5000

# Frontend (טרמינל נפרד)
cd frontend
cp .env.template .env
npm install
npm run dev                  # http://localhost:5173
```

---

## 1. ארכיטקטורת התיקיות

```
edu-ai-app/
├── .env.template              # תבנית משתני סביבה (ללא מפתחות אמיתיים!)
├── backend/
│   ├── server.js              # נקודת כניסה - Express app
│   ├── routes/
│   │   ├── chat.js            # POST /api/chat — SSE: status/sources/token/files/done
│   │   └── files.js           # GET /api/files/:filename — הורדת קבצים שנוצרו
│   └── services/
│       ├── nvidiaClient.js    # קריאה גנרית ל-NVIDIA NIM (+streaming SSE parser)
│       ├── modelRouter.js     # 🧠 מנוע הניתוב האוטומטי בין 5 המודלים
│       ├── duckduckgoSearch.js# שליפת מקורות מ-DuckDuckGo
│       └── fileGenerator.js   # חילוץ בלוקי קוד מהתשובה ← קבצים בפועל
└── frontend/
    └── src/
        ├── App.jsx             # Layout: Sidebar | ChatArea | PreviewPanel
        ├── hooks/useChatStream.js  # ניהול ה-SSE מול השרת
        └── components/
            ├── Sidebar/         # היסטוריה, מצבי עבודה, העלאת קבצים
            ├── ChatArea/        # שיחה, שורת קלט, סטרימינג
            ├── PreviewPanel/    # פאנל תצוגה מקדימה ימני
            └── Shared/          # StatusBanner, CitationCards
```

## 2. איך מנגנון הניתוב (Model Router) עובד

`modelRouter.js` מבצע ניתוב בשתי שכבות:

1. **שכבת חוקים (מיידית, ללא עלות)** — `routeByRules()`:
   - יש תמונה מצורפת / מצב "Vision" → `meta/llama-3.2-90b-vision-instruct`
   - מילות מפתח תרגום → `nvidia/riva-translate-4b-instruct-v2`
   - מצב "Code" או מילות מפתח קוד/מתמטיקה → `nvidia/llama-3.3-nemotron-super-49b-v1.5`
   - מצב "Study" → `nvidia/nemotron-3-nano-30b-a3b`
2. **שכבת סיווג (Fallback)** — אם החוקים לא הכריעו, נשלחת שאלה קצרה למודל ה-FAST
   שמחזירה מילה יחידה (GENERAL/REASONING/TRANSLATE) לצורך ניתוב סופי.

כל קטגוריה בקובץ `ROUTES` כוללת `statusMessage` — הטקסט שמוצג ב-Live Execution Status
banner בזמן אמת בצד הלקוח (`event: status` ב-SSE).

## 3. פרוטוקול התקשורת (SSE) — `POST /api/chat`

השרת מחזיר זרם אירועים כדי לאפשר UI חי:

| Event      | מתי נשלח                              | Payload                        |
|------------|----------------------------------------|---------------------------------|
| `status`   | בכל שלב (ניתוב/חיפוש/ייצור)           | `{ message, route? }`          |
| `sources`  | אחרי חיפוש DuckDuckGo                  | `{ sources: [...] }`           |
| `token`    | כל טוקן מהמודל (סטרימינג)              | `{ token }`                    |
| `files`    | אחרי זיהוי בלוקי קוד בתשובה            | `{ files: [...] }`             |
| `done`     | סיום מלא                               | `{ fullText }`                 |
| `error`    | כשל בכל שלב                            | `{ message }`                  |

בצד הלקוח, `useChatStream.js` צורך את הזרם הזה ומעדכן state בזמן אמת.

## 4. הנחיות UI/UX ליישום מלא (עבור Claude Code / המשך פיתוח)

הקומפוננטות שנוצרו הן **שלד עובד** התואם למפרט. הרחבות מומלצות:

### Sidebar
- חבר את "היסטוריית שיחות" ל-localStorage/DB אמיתי (כרגע placeholder סטטי).
- כפתור העלאת קבצים כרגע רק בשורת הקלט - ניתן להוסיף גם כאן drag&drop גלובלי.

### Main Canvas
- **Live Execution Status**: כרגע מציג הודעת סטטוס יחידה (`StatusBanner`). מומלץ
  להפוך לרצף אנימציה (fade בין הודעות) עם react-transition-group.
- **Streaming**: הטקסט כבר מוזרם טוקן-אחר-טוקן דרך `ReactMarkdown`. לביצועים
  טובים יותר בהודעות ארוכות, שקול throttling של re-render (למשל כל 50ms).

### Preview Panel
- כרגע תומך ברינדור חי (`iframe sandbox`) ל-HTML/SVG/Mermaid, והצגת קוד גולמי לשאר.
- להרחבה: rendering אמיתי ל-Mermaid (mermaid.js), ל-Plotly (react-plotly.js),
  ולתלת-ממד (STL/OBJ/GLTF) מומלץ `three.js` + `@react-three/fiber` בטאב ייעודי.
- המרות ל-PPTX/DOCX/XLSX אמיתיות (לא רק טקסט גולמי) דורשות ספריות ייעודיות
  בצד השרת (למשל `python-docx`, `python-pptx`, `exceljs`) — מומלץ כ-worker/microservice
  נפרד שנקרא מ-`fileGenerator.js`, כדי לא לחסום את תהליך הבקשה הראשי.

### Citations
- `CitationCards` מציג רשת כרטיסיות מעל תשובת ה-AI. הרחבה אפשרית: קישור בין
  מספרי הציטוט [1][2] בתוך הטקסט לכרטיסיות (scroll-to / highlight בהעברת עכבר).

### נגישות ו-RTL
- כל הקומפוננטות בנויות עם `dir="rtl"` ברמת ה-App. ודא שכל אייקון כיווני
  (חצים, חזרה) מותאם ידנית (lucide-react לא הופך אוטומטית).

## 5. מודלי NVIDIA NIM בשימוש

| תפקיד | מודל | משתנה סביבה |
|---|---|---|
| שיחה/מחקר כללי | `meta/llama-3.3-70b-instruct` | `NIM_GENERAL_*` |
| חשיבה מורכבת/קוד | `nvidia/llama-3.3-nemotron-super-49b-v1.5` | `NIM_REASONING_*` |
| ראייה ממוחשבת | `meta/llama-3.2-90b-vision-instruct` | `NIM_VISION_*` |
| מענה מהיר/לימוד | `nvidia/nemotron-3-nano-30b-a3b` | `NIM_FAST_*` |
| תרגום | `nvidia/riva-translate-4b-instruct-v2` | `NIM_TRANSLATE_*` |

כל המודלים נקראים דרך `https://integrate.api.nvidia.com/v1/chat/completions`
(פורמט תואם OpenAI), כל אחד עם מפתח ה-API הייעודי שלו כפי שמוגדר ב-`.env`.
