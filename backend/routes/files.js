import express from "express";
import path from "path";

const router = express.Router();
const OUT_DIR = process.env.GENERATED_FILES_DIR || "./storage/generated";

// GET /api/files/:filename - הורדת/צפייה בקובץ שנוצר על ידי המודל
router.get("/files/:filename", (req, res) => {
  const filename = path.basename(req.params.filename); // מניעת path traversal
  const filePath = path.resolve(OUT_DIR, filename);
  res.download(filePath, (err) => {
    if (err) res.status(404).json({ error: "קובץ לא נמצא" });
  });
});

export default router;
