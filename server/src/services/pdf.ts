import puppeteer, { type Browser } from "puppeteer";
import { createQueue } from "./queue.js";

let browser: Browser | null = null;
const pdfQueue = createQueue();

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
  pageType: "letter" | "a4" | "a3" = "a4"
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
      const pdf = await page.pdf({
        format: (pdfFormats[formatKey] || "A4") as "Letter" | "A4" | "A3",
        printBackground: true,
        margin: {
          top: "2cm",
          bottom: "2cm",
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
