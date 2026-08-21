/**
 * fileGenerator.js
 * מזהה בלוקי קוד/תוכן בתשובת המודל (```python, ```mermaid, ```html וכו')
 * ושומר אותם כקבצים בפועל בתיקיית storage/generated, כדי שה-Preview Panel
 * יוכל להציג אותם / להציע הורדה.
 *
 * הערה: זהו שלד עובד לזיהוי + שמירת טקסט/קוד. המרות מורכבות (למשל
 * Markdown -> PPTX/DOCX אמיתי, או טקסט -> STL תלת-ממדי) דורשות ספריות ייעודיות
 * בצד ה-backend (למשל python-docx, python-pptx, trimesh וכו') ומומלץ להריץ
 * אותן כ-microservice נפרד או worker, לא בתוך תהליך הבקשה הראשי.
 */
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const OUT_DIR = process.env.GENERATED_FILES_DIR || "./storage/generated";

const LANG_TO_EXT = {
  python: "py", py: "py", javascript: "js", js: "js", typescript: "ts",
  bash: "sh", sh: "sh", sql: "sql", json: "json", yaml: "yml", yml: "yml",
  html: "html", css: "css", cpp: "cpp", "c++": "cpp", java: "java",
  csharp: "cs", "c#": "cs", markdown: "md", md: "md", mermaid: "mmd",
  svg: "svg", xml: "xml", csv: "csv",
};

/** מוצא את כל בלוקי הקוד ```lang ... ``` בטקסט תשובה */
function extractCodeBlocks(markdownText) {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  while ((match = regex.exec(markdownText)) !== null) {
    const lang = (match[1] || "txt").toLowerCase();
    blocks.push({ lang, content: match[2] });
  }
  return blocks;
}

/**
 * סורק תשובת מודל, שומר כל בלוק קוד רלוונטי כקובץ, ומחזיר metadata
 * שה-Frontend ישתמש בו כדי לרנדר את ה-Preview Panel (שפה, קישור הורדה, תוכן לרנדור).
 */
export async function generateFilesFromResponse(responseText) {
  const blocks = extractCodeBlocks(responseText);
  if (blocks.length === 0) return [];

  await fs.mkdir(OUT_DIR, { recursive: true });

  const generated = [];
  for (const block of blocks) {
    const ext = LANG_TO_EXT[block.lang] || "txt";
    const filename = `${uuidv4()}.${ext}`;
    const filePath = path.join(OUT_DIR, filename);
    await fs.writeFile(filePath, block.content, "utf-8");

    generated.push({
      filename,
      language: block.lang,
      downloadUrl: `/api/files/${filename}`,
      preview: block.content.slice(0, 2000), // לתצוגה מקדימה בפאנל
      renderable: ["html", "svg", "mermaid"].includes(block.lang),
    });
  }
  return generated;
}
