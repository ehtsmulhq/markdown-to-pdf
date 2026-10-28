import { Router, type Request, type Response } from "express";
import { markdownToHtml, type FontFamilyChoice } from "../services/markdown.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const {
    markdown,
    fontFamily = "sans",
    toc = false,
  } = req.body as {
    markdown?: string;
    fontFamily?: FontFamilyChoice;
    toc?: boolean;
  };

  if (!markdown || typeof markdown !== "string") {
    res.status(400).json({ error: "markdown is required and must be a string" });
    return;
  }

  try {
    let html = await markdownToHtml(markdown, fontFamily, { toc });
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    res.json({ html });
  } catch (error) {
    console.error("Preview rendering failed:", error);
    res.status(500).json({ error: "Failed to render preview" });
  }
});

export default router;
