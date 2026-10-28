import { Marked } from "marked";
import { type FontFamilyChoice } from "./api";

export const FONT_MAP: Record<FontFamilyChoice, string> = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  mono: '"JetBrains Mono", "SF Mono", Consolas, "Courier New", monospace',
  garamond: 'Garamond, "EB Garamond", "Baskerville", Georgia, serif',
  modern: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
};

export interface HeadingItem {
  depth: number;
  text: string;
  id: string;
}

export interface MarkdownRenderResult {
  html: string;
  headings: HeadingItem[];
}

export function generateTocHtml(headings: HeadingItem[]): string {
  if (headings.length === 0) return "";

  let listHtml = "";
  for (const h of headings) {
    const depthClass = `toc-depth-${h.depth}`;
    listHtml += `  <li class="toc-item ${depthClass}">
    <a href="#${h.id}" class="toc-link" data-toc-target="${h.id}">
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
<div class="page-break"></div>`;
}

export function processMarkdownContent(
  markdown: string,
  options: { toc?: boolean; isPreview?: boolean } = {}
): MarkdownRenderResult {
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

  // Pre-process manual page break tags
  let processed = markdown
    .replace(/<!--\s*page\s*break\s*-->/gi, '<div class="page-break"></div>')
    .replace(/<!--\s*pagebreak\s*-->/gi, '<div class="page-break"></div>')
    .replace(/\\pagebreak/gi, '<div class="page-break"></div>')
    .replace(/\[\[pagebreak\]\]/gi, '<div class="page-break"></div>');

  let rawHtml = markedInstance.parse(processed) as string;

  // Strip script tags
  rawHtml = rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Check if TOC is requested
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

  // If in preview mode, render a clean visual page break divider
  if (options.isPreview) {
    rawHtml = rawHtml.replace(
      /<div class="page-break"><\/div>/g,
      `<div class="page-break-indicator my-8 py-2.5 border-y border-dashed border-accent/40 bg-accent/5 rounded-lg flex items-center justify-center gap-2 text-accent font-semibold text-xs uppercase tracking-wider select-none"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg><span>Manual Page Break</span></div>`
    );
  }

  return { html: rawHtml, headings };
}
