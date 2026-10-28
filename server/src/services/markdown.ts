import { Marked } from "marked";

export type FontFamilyChoice = "sans" | "serif" | "mono" | "garamond" | "modern";

const FONT_MAP: Record<FontFamilyChoice, string> = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  mono: '"JetBrains Mono", "SF Mono", Consolas, "Courier New", monospace',
  garamond: 'Garamond, "EB Garamond", "Baskerville", Georgia, serif',
  modern: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
};

export interface MarkdownRenderOptions {
  toc?: boolean;
}

export interface HeadingItem {
  depth: number;
  text: string;
  id: string;
}

export function generateTocHtml(headings: HeadingItem[]): string {
  if (headings.length === 0) return "";

  let listHtml = "";
  for (const h of headings) {
    const depthClass = `toc-depth-${h.depth}`;
    listHtml += `  <li class="toc-item ${depthClass}">
    <a href="#${h.id}" class="toc-link">
      <span class="toc-text">${h.text}</span>
      <span class="toc-dots"></span>
    </a>
  </li>\n`;
  }

  return `<nav class="toc-card" aria-label="Table of Contents">
  <div class="toc-header">
    <h2 class="toc-title">Table of Contents</h2>
    <span class="toc-badge">Directory</span>
  </div>
  <ul class="toc-list">
${listHtml}  </ul>
</nav>
<div class="page-break"></div>\n`;
}

export async function markdownToHtml(
  markdown: string,
  fontFamily: FontFamilyChoice = "sans",
  options: MarkdownRenderOptions = {}
): Promise<string> {
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

    /* Table of Contents Styling */
    .toc-card {
      margin: 0 0 2.5em;
      padding: 1.5em 1.8em;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .toc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 0.5em;
      margin-bottom: 1.2em;
    }

    .toc-title {
      font-size: 1.3em;
      font-weight: 700;
      margin: 0 !important;
      color: #0f172a;
      border: none !important;
      padding: 0 !important;
    }

    .toc-badge {
      font-size: 0.75em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #2563eb;
      background: rgba(37, 99, 235, 0.1);
      padding: 0.2em 0.6em;
      border-radius: 4px;
    }

    .toc-list {
      list-style: none !important;
      padding-left: 0 !important;
      margin: 0 !important;
    }

    .toc-item {
      margin: 0.45em 0;
      line-height: 1.4;
    }

    .toc-depth-1 {
      font-weight: 700;
      font-size: 0.98em;
      margin-top: 0.8em;
      color: #0f172a;
    }

    .toc-depth-2 {
      font-weight: 500;
      font-size: 0.92em;
      padding-left: 1.2em;
      color: #334155;
    }

    .toc-depth-3 {
      font-weight: 400;
      font-size: 0.85em;
      padding-left: 2.4em;
      color: #64748b;
    }

    .toc-link {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      color: inherit !important;
      text-decoration: none !important;
      gap: 0.5em;
    }

    .toc-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #94a3b8;
      opacity: 0.5;
      margin-bottom: 0.25em;
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

    h1 { font-size: 2em; border-bottom: 2px solid #2563eb; padding-bottom: 0.3em; margin-top: 1.5em; margin-bottom: 0.5em; color: #0f172a; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.3em; margin-top: 1.5em; margin-bottom: 0.5em; color: #1e293b; }
    h3 { font-size: 1.25em; margin-top: 1.5em; margin-bottom: 0.5em; color: #334155; }
    h4 { font-size: 1em; margin-top: 1.2em; margin-bottom: 0.4em; color: #475569; }

    p { margin: 0 0 1em; }

    a { color: #2563eb; text-decoration: underline; font-weight: 500; }

    code {
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.88em;
      background: #f1f5f9;
      color: #1e40af;
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
      border-left: 4px solid #2563eb;
      background: #f8fafc;
      color: #334155;
      border-radius: 0 6px 6px 0;
    }

    ul, ol {
      margin: 0 0 1em;
      padding-left: 1.5em;
    }

    li { margin-bottom: 0.3em; }

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

  const headings: HeadingItem[] = [];
  const slugCounts = new Map<string, number>();

  const markedInstance = new Marked();

  markedInstance.use({
    renderer: {
      heading({ tokens, depth, text }) {
        const plainText = text.replace(/<[^>]+>/g, "").replace(/[*_`~[\]]/g, "").trim();
        let slug = plainText
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .trim();
        if (!slug) slug = `section-${headings.length + 1}`;

        const count = slugCounts.get(slug) || 0;
        slugCounts.set(slug, count + 1);
        const uniqueId = count > 0 ? `${slug}-${count}` : slug;

        headings.push({ depth, text: plainText, id: uniqueId });
        const parsed = this.parser.parseInline(tokens);
        return `<h${depth} id="${uniqueId}">${parsed}</h${depth}>\n`;
      },
    },
  });

  let processedMarkdown = markdown
    .replace(/<!--\s*page\s*break\s*-->/gi, '<div class="page-break"></div>')
    .replace(/<!--\s*pagebreak\s*-->/gi, '<div class="page-break"></div>')
    .replace(/<div\s+class=["']page-break(-tag)?["']\s*>\s*<\/div>/gi, '<div class="page-break"></div>')
    .replace(/\\pagebreak/gi, '<div class="page-break"></div>')
    .replace(/\[\[pagebreak\]\]/gi, '<div class="page-break-tag"></div>');

  let rawHtml = markedInstance.parse(processedMarkdown) as string;
  rawHtml = rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  const hasManualTocTag = /\[toc\]|\[\[toc\]\]|<!--\s*toc\s*-->/i.test(markdown);
  const shouldIncludeToc = Boolean(options.toc || hasManualTocTag);

  if (shouldIncludeToc && headings.length > 0) {
    const tocHtml = generateTocHtml(headings);
    if (hasManualTocTag) {
      rawHtml = rawHtml.replace(/<p>\s*(\[toc\]|\[\[toc\]\]|<!--\s*toc\s*-->)\s*<\/p>/i, tocHtml);
    } else {
      const firstH1Index = rawHtml.indexOf("</h1>");
      if (firstH1Index !== -1) {
        const insertPos = firstH1Index + 5;
        rawHtml = rawHtml.slice(0, insertPos) + "\n" + tocHtml + rawHtml.slice(insertPos);
      } else {
        rawHtml = tocHtml + "\n" + rawHtml;
      }
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${PRINT_STYLES}</style>
</head>
<body>
  ${rawHtml}
</body>
</html>`;
}
