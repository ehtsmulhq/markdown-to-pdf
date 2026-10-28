import cors from "cors";
import express from "express";
import convertRouter from "./routes/convert.js";
import previewRouter from "./routes/preview.js";
import { closeBrowser } from "./services/pdf.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Root informational endpoint
app.get("/", (_req, res) => {
  res.json({
    name: "MD to PDF API Server",
    status: "running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      convert: "POST /api/convert",
    },
  });
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Preview & conversion routers
app.use("/api/preview", previewRouter);
app.use("/api/convert", convertRouter);

// 404 Fallback JSON Handler
app.use((_req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist. Use POST /api/convert to generate PDFs.",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  await closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeBrowser();
  process.exit(0);
});
