import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: false,
});

export type FontFamilyChoice = "sans" | "serif" | "mono" | "garamond" | "modern";

const FONT_MAP: Record<FontFamilyChoice, string> = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  mono: '"JetBrains Mono", "SF Mono", Consolas, "Courier New", monospace',
  garamond: 'Garamond, "EB Garamond", "Baskerville", Georgia, serif',
  modern: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
};

export function markdownToHtml(
  markdown: string,
  fontFamily: FontFamilyChoice = "sans"
): string {
  const selectedFontStack = FONT_MAP[fontFamily] || FONT_MAP.sans;

  const PRINT_STYLES = `
    * {
      box-sizing: border-box;
    }

    @page {
      margin: 2cm;
    }

    body {
      font-family: ${selectedFontStack};
      font-size: 11pt;
      line-height: 1.6;
      color: #0f172a;
      margin: 0;
      padding: 0;
    }

    /* Prevent awkward page splits inside diagrams, images, tables, code blocks & headings */
    h1, h2, h3, h4, h5, h6, table, pre, blockquote, img, svg, figure, tr, .no-break {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    h1, h2, h3 {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    /* Manual Page Breaks */
    .page-break, .page-break-tag, pagebreak, [data-page-break] {
      break-after: page !important;
      page-break-after: always !important;
      height: 0 !important;
      max-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      outline: none !important;
      display: block !important;
      visibility: hidden !important;
      overflow: hidden !important;
    }

    h1 { font-size: 2em; border-bottom: 2px solid #6366f1; padding-bottom: 0.3em; margin-top: 1.5em; margin-bottom: 0.5em; color: #0f172a; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.3em; margin-top: 1.5em; margin-bottom: 0.5em; color: #1e293b; }
    h3 { font-size: 1.25em; margin-top: 1.5em; margin-bottom: 0.5em; color: #334155; }
    h4 { font-size: 1em; margin-top: 1.2em; margin-bottom: 0.4em; color: #475569; }

    p { margin: 0 0 1em; }

    a { color: #4f46e5; text-decoration: underline; font-weight: 500; }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.88em;
      background: #f1f5f9;
      color: #4338ca;
      padding: 0.15em 0.4em;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 1.2em;
      border-radius: 8px;
      overflow-x: auto;
      margin: 0 0 1.2em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    pre code {
      background: none;
      color: inherit;
      padding: 0;
      border: none;
    }

    blockquote {
      margin: 0 0 1.2em;
      padding: 0.6em 1.2em;
      border-left: 4px solid #6366f1;
      background: #f8fafc;
      color: #334155;
      border-radius: 0 6px 6px 0;
    }

    ul, ol {
      margin: 0 0 1em;
      padding-left: 1.5em;
    }

    li { margin-bottom: 0.3em; }

    /* Modern Professional Table Styling for PDF Export */
    table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
      margin: 0 0 1.5em;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }

    th, td {
      padding: 0.75em 1em;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      background-color: #f1f5f9;
      color: #334155;
      font-size: 0.85em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #cbd5e1;
    }

    tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    hr {
      border: none;
      border-top: 1px solid #cbd5e1;
      margin: 2em 0;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
      border-radius: 6px;
    }
  `;

  let processedMarkdown = markdown
    .replace(/<!--\s*page\s*break\s*-->/gi, '<div class="page-break"></div>')
    .replace(/<!--\s*pagebreak\s*-->/gi, '<div class="page-break"></div>')
    .replace(/<div\s+class=["']page-break-tag["']\s*>\s*<\/div>/gi, '<div class="page-break"></div>')
    .replace(/\\pagebreak/gi, '<div class="page-break"></div>')
    .replace(/\[\[pagebreak\]\]/gi, '<div class="page-break"></div>');

  const body = marked.parse(processedMarkdown) as string;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${PRINT_STYLES}</style>
</head>
<body>
  ${body}
</body>
</html>`;
}
