/**
 * duckduckgoSearch.js
 * שליפת תוצאות חיפוש חינמיות מ-DuckDuckGo לצורך Citations בממשק.
 * משתמש בספריית duck-duck-scrape (חינמית, ללא מפתח API).
 */
import { search, SafeSearchType } from "duck-duck-scrape";

const SAFE_SEARCH_MAP = {
  strict: SafeSearchType.STRICT,
  moderate: SafeSearchType.MODERATE,
  off: SafeSearchType.OFF,
};

/**
 * מבצע חיפוש ומחזיר רשימת מקורות מנורמלת לשימוש ב-UI (כרטיסיות ציטוט).
 * @param {string} query
 * @param {number} maxResults
 */
export async function searchWeb(query, maxResults = Number(process.env.DDG_MAX_RESULTS) || 6) {
  const safeSearch =
    SAFE_SEARCH_MAP[process.env.DDG_SAFE_SEARCH] ?? SafeSearchType.MODERATE;

  try {
    const results = await search(query, { safeSearch });

    return (results.results || []).slice(0, maxResults).map((r, idx) => ({
      id: idx + 1,
      title: r.title,
      url: r.url,
      snippet: r.description?.replace(/<\/?b>/g, ""), // ניקוי תגיות הדגשה
      source: new URL(r.url).hostname.replace("www.", ""),
    }));
  } catch (err) {
    console.error("DuckDuckGo search failed:", err.message);
    return []; // כשל בחיפוש לא אמור להפיל את כל הבקשה
  }
}
