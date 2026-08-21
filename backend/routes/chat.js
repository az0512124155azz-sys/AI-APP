import express from "express";
import multer from "multer";
import { routeRequest } from "../services/modelRouter.js";
import { callNimModel, streamNimResponse } from "../services/nvidiaClient.js";
import { searchWeb } from "../services/duckduckgoSearch.js";
import { generateFilesFromResponse } from "../services/fileGenerator.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/chat
 * body: { message: string, mode?: string, history?: Array<{role, content}>, useWebSearch?: boolean }
 * תומך גם בהעלאת תמונה (multipart) בשדה "image" -> מנותב אוטומטית למודל ה-Vision.
 *
 * מגיב כ-SSE (Server-Sent Events) כדי לאפשר בצד הלקוח:
 *  - הצגת "Live Execution Status" (event: status)
 *  - סטרימינג טוקן-אחר-טוקן של התשובה (event: token)
 *  - שליחת מקורות/ציטוטים כשמוכנים (event: sources)
 *  - שליחת קבצים שנוצרו בסיום (event: files)
 */
router.post("/chat", upload.single("image"), async (req, res) => {
  const { message = "", mode, useWebSearch = "true" } = req.body;
  const history = req.body.history ? JSON.parse(req.body.history) : [];
  const hasImage = Boolean(req.file);

  // הגדרת תגובת SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // --- שלב 1: ניתוב למודל המתאים ---
    sendEvent("status", { message: "מזהה את סוג הבקשה..." });
    const route = await routeRequest({ text: message, mode, hasImage });
    sendEvent("status", { message: route.statusMessage, route: route.key });

    // --- שלב 2: חיפוש רשת (מקביל, רק אם רלוונטי ולא Vision גרידא) ---
    let sources = [];
    const shouldSearch = useWebSearch === "true" && route.key !== "VISION";
    if (shouldSearch) {
      sendEvent("status", { message: "מחפש ב-DuckDuckGo..." });
      sources = await searchWeb(message);
      if (sources.length) sendEvent("sources", { sources });
    }

    // --- שלב 3: בניית ההודעות למודל (כולל הקשר חיפוש אם קיים) ---
    const contextFromSearch = sources.length
      ? `\n\nמקורות רלוונטיים מהאינטרנט (צטט אותם לפי מספר [1], [2] וכו'):\n` +
        sources.map((s) => `[${s.id}] ${s.title} - ${s.snippet} (${s.url})`).join("\n")
      : "";

    const messages = [
      {
        role: "system",
        content:
          "אתה עוזר לימודי AI לתלמידים. ענה בבירור, בשלבים כשרלוונטי, " +
          "והשתמש בבלוקי קוד מסומנים (```language) עבור כל קוד, טבלה, או תרשים Mermaid " +
          "כדי שניתן יהיה להציג אותם בפאנל תצוגה מקדימה." + contextFromSearch,
      },
      ...history,
    ];

    if (hasImage) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: message },
          {
            type: "image_url",
            image_url: {
              url: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
            },
          },
        ],
      });
    } else {
      messages.push({ role: "user", content: message });
    }

    // --- שלב 4: קריאה למודל עם סטרימינג ---
    sendEvent("status", { message: "מייצר תשובה..." });
    const nimResponse = await callNimModel({
      model: route.model,
      apiKey: route.apiKey,
      messages,
      stream: true,
      extra: route.extra || {},
    });

    let fullText = "";
    for await (const chunk of streamNimResponse(nimResponse)) {
      fullText += chunk;
      sendEvent("token", { token: chunk });
    }

    // --- שלב 5: זיהוי ויצירת קבצים מהתשובה (לפאנל התצוגה) ---
    sendEvent("status", { message: "מייצר קובץ..." });
    const files = await generateFilesFromResponse(fullText);
    if (files.length) sendEvent("files", { files });

    sendEvent("done", { fullText });
    res.end();
  } catch (err) {
    console.error("Chat route error:", err);
    sendEvent("error", { message: err.message });
    res.end();
  }
});

export default router;
