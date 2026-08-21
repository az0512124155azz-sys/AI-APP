/**
 * modelRouter.js
 * "המוח" של המערכת: מזהה את סוג הבקשה ומנתב אותה למודל ה-NIM המתאים.
 *
 * אסטרטגיית ניתוב דו-שלבית:
 *  1. חוקים דטרמיניסטיים ומהירים (keywords, סוג קלט - תמונה/מצב עבודה) — ללא קריאת רשת.
 *  2. Fallback: שימוש במודל ה-FAST (nemotron-3-nano) כ"שופט" קליל שמחזיר קטגוריה יחידה,
 *     כאשר החוקים לא הכריעו בבירור.
 *
 * כל קטגוריה ממופה למודל ולמפתח ה-API שלו מתוך .env
 */
import { callNimModel } from "./nvidiaClient.js";

export const ROUTES = {
  GENERAL: {
    key: "GENERAL",
    label: "שיחה ומחקר כללי",
    statusMessage: "מפעיל מודל שיחה ומחקר...",
    model: process.env.NIM_GENERAL_MODEL,
    apiKey: process.env.NIM_GENERAL_API_KEY,
  },
  REASONING: {
    key: "REASONING",
    label: "חשיבה מורכבת / קוד / מתמטיקה",
    statusMessage: "מפעיל מודל חשיבה עמוקה...",
    model: process.env.NIM_REASONING_MODEL,
    apiKey: process.env.NIM_REASONING_API_KEY,
  },
  VISION: {
    key: "VISION",
    label: "ניתוח תמונה / דף עבודה",
    statusMessage: "מנתח את התמונה שהועלתה...",
    model: process.env.NIM_VISION_MODEL,
    apiKey: process.env.NIM_VISION_API_KEY,
  },
  FAST: {
    key: "FAST",
    label: "מענה מהיר / סיוע לימודי",
    statusMessage: "מייצר תשובה מהירה...",
    model: process.env.NIM_FAST_MODEL,
    apiKey: process.env.NIM_FAST_API_KEY,
    extra: { reasoning_budget: "low" },
  },
  TRANSLATE: {
    key: "TRANSLATE",
    label: "תרגום",
    statusMessage: "מתרגם את הטקסט...",
    model: process.env.NIM_TRANSLATE_MODEL,
    apiKey: process.env.NIM_TRANSLATE_API_KEY,
  },
};

const REASONING_KEYWORDS = [
  "כתוב קוד", "תקן שגיאה", "פונקציה", "אלגוריתם", "משוואה", "אינטגרל", "נגזרת",
  "הוכח", "פתור", "python", "javascript", "bug", "debug", "code", "solve",
];

const TRANSLATE_KEYWORDS = ["תרגם", "translate", "בתרגום ל", "translation"];

/**
 * ניתוב מבוסס חוקים - שכבה ראשונה, מהירה וללא עלות API.
 * @param {Object} ctx
 * @param {string} ctx.text - טקסט ההודעה של המשתמש
 * @param {string} [ctx.mode] - מצב עבודה נבחר מה-Sidebar: Study | Code | Vision | General
 * @param {boolean} [ctx.hasImage] - האם צורפה תמונה לבקשה
 */
export function routeByRules({ text = "", mode, hasImage }) {
  // עדיפות עליונה: אם צורפה תמונה, או שהמשתמש נמצא במצב Vision -> מודל ראייה
  if (hasImage || mode === "Vision") return ROUTES.VISION;

  const lower = text.toLowerCase();

  if (TRANSLATE_KEYWORDS.some((k) => lower.includes(k))) return ROUTES.TRANSLATE;

  if (mode === "Code" || REASONING_KEYWORDS.some((k) => lower.includes(k))) {
    return ROUTES.REASONING;
  }

  if (mode === "Study") return ROUTES.FAST;

  // ברירת מחדל: לא הוכרע חד-משמעית -> ננסה שכבה שנייה
  return null;
}

/**
 * שכבה שנייה: כשה-heuristics לא הכריעו, שואלים את מודל ה-FAST לסווג בקצרה.
 * מחזיר את אחת הקטגוריות ב-ROUTES.
 */
export async function routeByClassifierModel(text) {
  const classifierPrompt = [
    {
      role: "system",
      content:
        "You are a routing classifier. Reply with EXACTLY ONE WORD from: " +
        "GENERAL, REASONING, TRANSLATE. No punctuation, no explanation.",
    },
    { role: "user", content: text },
  ];

  try {
    const response = await callNimModel({
      model: ROUTES.FAST.model,
      apiKey: ROUTES.FAST.apiKey,
      messages: classifierPrompt,
      stream: false,
      max_tokens: 5,
      temperature: 0,
    });
    const data = await response.json();
    const word = data.choices?.[0]?.message?.content?.trim().toUpperCase();
    return ROUTES[word] || ROUTES.GENERAL;
  } catch (err) {
    console.error("Classifier routing failed, defaulting to GENERAL:", err.message);
    return ROUTES.GENERAL;
  }
}

/**
 * נקודת הכניסה הראשית לניתוב: מנסה חוקים, ואם לא מכריעים - קלאסיפיקציה.
 */
export async function routeRequest(ctx) {
  const ruleMatch = routeByRules(ctx);
  if (ruleMatch) return ruleMatch;
  return routeByClassifierModel(ctx.text);
}
