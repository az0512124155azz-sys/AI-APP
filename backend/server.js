import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat.js";
import filesRouter from "./routes/files.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", chatRouter);
app.use("/api", filesRouter);

app.listen(PORT, () => {
  console.log(`🚀 Edu AI Backend running on http://localhost:${PORT}`);
  console.log(`   Base NIM URL: ${process.env.NVIDIA_BASE_URL}`);
});
