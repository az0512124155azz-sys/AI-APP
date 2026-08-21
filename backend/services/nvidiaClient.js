/**
 * nvidiaClient.js
 * עטיפה גנרית לקריאה ל-NVIDIA NIM Cloud API (תואם OpenAI Chat Completions).
 * כל מודל מקבל את ה-base URL, שם המודל, ומפתח ה-API הייעודי לו מתוך .env
 */

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";

/**
 * שולח בקשת chat completion למודל NIM נתון.
 * @param {Object} params
 * @param {string} params.model - שם המודל (למשל "meta/llama-3.3-70b-instruct")
 * @param {string} params.apiKey - מפתח ה-API הייעודי למודל הזה
 * @param {Array}  params.messages - מערך הודעות בפורמט OpenAI ({role, content})
 * @param {boolean} [params.stream=true] - האם לבקש תגובה בסטרימינג
 * @param {number} [params.temperature=0.6]
 * @param {number} [params.max_tokens=2048]
 * @param {Object} [params.extra] - שדות נוספים ספציפיים למודל (למשל reasoning_budget)
 */
export async function callNimModel({
  model,
  apiKey,
  messages,
  stream = true,
  temperature = 0.6,
  max_tokens = 2048,
  extra = {},
}) {
  if (!apiKey) {
    throw new Error(`Missing API key for model: ${model}. בדוק את קובץ ה-.env שלך.`);
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: stream ? "text/event-stream" : "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream,
      ...extra,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NVIDIA NIM error (${response.status}) for model ${model}: ${errText}`);
  }

  return response; // הקורא מחליט אם לקרוא כ-stream או כ-JSON רגיל
}

/**
 * עוזר: קורא סטרים מסוג SSE (Server-Sent Events) ומעביר chunks דרך callback.
 * שימושי כדי לשדר טוקנים חיים לצד הלקוח (Live Execution Status / streaming תשובה).
 */
export async function* streamNimResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop(); // שארית לא גמורה

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.replace(/^data:\s*/, "");
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // שורה לא-JSON תקינה, מתעלמים
      }
    }
  }
}
