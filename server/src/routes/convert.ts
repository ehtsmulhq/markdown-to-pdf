import { Router, type Request, type Response } from "express";
import { markdownToHtml, type FontFamilyChoice } from "../services/markdown.js";
import { htmlToPdf } from "../services/pdf.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { markdown, pageType = "a4", fontFamily = "sans" } = req.body as {
    markdown?: string;
    pageType?: "letter" | "a4" | "a3";
    fontFamily?: FontFamilyChoice;
  };

  if (!markdown || typeof markdown !== "string" || !markdown.trim()) {
    res.status(400).json({ error: "markdown is required" });
    return;
  }

  try {
    const html = await markdownToHtml(markdown, fontFamily);
    const pdf = await htmlToPdf(html, pageType);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="document.pdf"');
    res.send(pdf);
  } catch (error) {
    console.error("PDF conversion failed:", error);
    res.status(500).json({ error: "Failed to convert markdown to PDF" });
  }
});

export default router;
