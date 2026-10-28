import puppeteer, { type Browser } from "puppeteer";
import { createQueue } from "./queue.js";

let browser: Browser | null = null;
const pdfQueue = createQueue();

export interface PdfExportOptions {
  headerText?: string;
  footerText?: string;
}

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(launchOptions);
  }
  return browser;
}

export async function htmlToPdf(
  html: string,
  pageType: "letter" | "a4" | "a3" = "a4",
  options: PdfExportOptions = {}
): Promise<Buffer> {
  return pdfQueue.enqueue(async () => {
    const instance = await getBrowser();
    const page = await instance.newPage();

    try {
      await page.setContent(html, { waitUntil: "load", timeout: 30000 });
      const pdfFormats: { [key: string]: string } = {
        letter: "Letter",
        a4: "A4",
        a3: "A3",
      };
      const formatKey = (pageType || "a4").toLowerCase();

      const hasHeaderOrFooter = Boolean(options.headerText || options.footerText);

      const headerTemplate = options.headerText
        ? `<div style="font-size: 8pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; padding: 0 2cm; text-align: right;">${options.headerText}</div>`
        : "<div></div>";

      const footerTemplate = options.footerText
        ? `<div style="font-size: 8pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; padding: 0 2cm; text-align: center;">${options.footerText
            .replace(/{page}/g, '<span class="pageNumber"></span>')
            .replace(/{pages}/g, '<span class="totalPages"></span>')
            .replace(/{date}/g, new Date().toLocaleDateString())}</div>`
        : `<div style="font-size: 8pt; color: #94a3b8; font-family: -apple-system, sans-serif; width: 100%; padding: 0 2cm; text-align: center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`;

      const pdf = await page.pdf({
        format: (pdfFormats[formatKey] || "A4") as "Letter" | "A4" | "A3",
        printBackground: true,
        displayHeaderFooter: hasHeaderOrFooter,
        headerTemplate,
        footerTemplate,
        margin: {
          top: options.headerText ? "2.5cm" : "2cm",
          bottom: options.footerText ? "2.5cm" : "2cm",
          left: "2cm",
          right: "2cm",
        },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  });
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
export default closeBrowser;
