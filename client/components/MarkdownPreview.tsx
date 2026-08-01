"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type FontFamilyChoice } from "@/lib/api";

interface MarkdownPreviewProps {
  content: string;
  pageType?: "letter" | "a4" | "a3";
  fontFamily?: FontFamilyChoice;
  isDark?: boolean;
}

const FONT_MAP: Record<FontFamilyChoice, string> = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  mono: '"JetBrains Mono", "SF Mono", Consolas, "Courier New", monospace',
  garamond: 'Garamond, "EB Garamond", "Baskerville", Georgia, serif',
  modern: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
};

const PAGE_SPECS = {
  letter: {
    width: 816,        // 8.5in * 96
    totalHeight: 1056,  // 11in * 96
    marginVert: 75.6,   // 2cm top & bottom
    printableHeight: 904.8,
  },
  a4: {
    width: 794,        // 210mm * 3.7795
    totalHeight: 1123,  // 297mm * 3.7795
    marginVert: 75.6,   // 2cm top & bottom
    printableHeight: 971.8,
  },
  a3: {
    width: 1123,       // 297mm * 3.7795
    totalHeight: 1587,  // 420mm * 3.7795
    marginVert: 75.6,   // 2cm top & bottom
    printableHeight: 1435.8,
  },
};

export default function MarkdownPreview({
  content,
  pageType = "a4",
  fontFamily = "sans",
  isDark = true,
}: MarkdownPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPageGuides, setShowPageGuides] = useState(true);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const spec = PAGE_SPECS[pageType];
  const selectedFontStack = FONT_MAP[fontFamily] || FONT_MAP.sans;

  const processedContent = content
    .replace(/<!--\s*page\s*break\s*-->/gi, '<div class="page-break-tag"></div>')
    .replace(/<!--\s*pagebreak\s*-->/gi, '<div class="page-break-tag"></div>')
    .replace(/\\pagebreak/gi, '<div class="page-break-tag"></div>')
    .replace(/\[\[pagebreak\]\]/gi, '<div class="page-break-tag"></div>')
    .replace(/<div\s+class=["']page-break["']\s*>\s*<\/div>/gi, '<div class="page-break-tag"></div>');

  const recalculatePageCount = () => {
    if (!contentRef.current) return;
    const contentHeight = contentRef.current.scrollHeight - spec.marginVert * 2;
    const pages = Math.ceil(contentHeight / spec.printableHeight);
    setTotalPages(Math.max(pages, 1));
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    recalculatePageCount();

    // Recalculate when external images finish loading in preview
    const images = contentRef.current?.querySelectorAll("img");
    if (images && images.length > 0) {
      images.forEach((img) => {
        if (!img.complete) {
          img.addEventListener("load", recalculatePageCount, { once: true });
        }
      });
    }
  }, [content, pageType, fontFamily, spec.marginVert, spec.printableHeight]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const page = Math.floor(scrollTop / spec.printableHeight) + 1;
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }
  };

  const pageBreakLines: number[] = [];
  for (let i = 1; i < totalPages; i++) {
    pageBreakLines.push(spec.marginVert + i * spec.printableHeight);
  }

  if (!content.trim()) {
    return (
      <div className="flex flex-1 flex-col bg-surface transition-colors duration-200">
        <div className="flex h-10 items-center justify-between border-b border-border bg-background/50 px-4 text-xs text-muted">
          <span>Page 0 of 0</span>
          <span className="font-semibold text-muted-foreground uppercase">{pageType}</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-elevated border border-border flex items-center justify-center mb-4 text-accent shadow-sm">
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Live PDF Preview</h3>
          <p className="text-xs text-muted max-w-xs">
            Start typing markdown or upload a file to preview your rendered document with accurate page breaks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background transition-colors duration-200">
      {/* Preview toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-border bg-surface px-4 text-xs text-muted transition-colors duration-200">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            PDF Preview
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-foreground font-medium">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Page Breaks guide toggle */}
          <button
            type="button"
            onClick={() => setShowPageGuides(!showPageGuides)}
            className={`flex items-center gap-1 text-[11px] transition-colors px-2 py-1 rounded border ${
              showPageGuides
                ? "bg-accent/15 border-accent/40 text-accent font-medium"
                : "bg-elevated border-border text-muted hover:text-foreground"
            }`}
            title="Toggle visible page break lines"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8m-8 5h8" />
            </svg>
            <span>Page Breaks: {showPageGuides ? "ON" : "OFF"}</span>
          </button>

          <span className="font-semibold text-muted-foreground uppercase text-[11px] bg-elevated px-2 py-0.5 rounded border border-border">
            {pageType}
          </span>
        </div>
      </div>

      {/* Scrollable Printable document container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 flex justify-center bg-background relative transition-colors duration-200"
      >
        <div 
          style={{ maxWidth: `${spec.width}px` }} 
          className="w-full relative transition-all duration-300 max-w-full overflow-hidden"
        >
          <div
            ref={contentRef}
            style={{
              padding: isMobileScreen ? "1.25rem 0.85rem" : `${spec.marginVert}px`,
              fontFamily: selectedFontStack,
            }}
            className={`min-h-[600px] sm:min-h-[750px] rounded-xl shadow-paper border transition-all duration-200 relative text-[10pt] sm:text-[11pt] leading-[1.6] max-w-full overflow-x-hidden ${
              isDark
                ? "bg-surface text-foreground border-border prose prose-invert max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-a:text-accent prose-code:rounded prose-code:bg-elevated prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-elevated prose-blockquote:border-l-accent"
                : "bg-white text-slate-900 border-slate-200 prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-a:text-indigo-600 prose-code:rounded prose-code:bg-slate-100 prose-code:text-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-blockquote:border-l-indigo-500"
            }`}
          >
            {/* Clean Mathematical Page Break Guidelines Overlay */}
            {showPageGuides &&
              pageBreakLines.map((topPx, idx) => (
                <div
                  key={idx}
                  style={{ top: `${topPx}px` }}
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center justify-between px-2 -translate-y-1/2"
                >
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 opacity-60 border-t-2 border-dashed border-indigo-500" />
                  <span className="mx-2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-md uppercase tracking-wider">
                    ✂ PAGE {idx + 2} BREAK
                  </span>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 opacity-60 border-t-2 border-dashed border-indigo-500" />
                </div>
              ))}

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                div({ className, children, ...props }) {
                  if (className === "page-break-tag" || className === "page-break") {
                    return (
                      <div
                        className="my-8 py-2 border-y border-dashed border-indigo-500/60 bg-indigo-500/10 rounded flex items-center justify-center gap-2 text-indigo-500 font-semibold text-[11px] uppercase tracking-wider select-none"
                        {...props}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span>Manual Page Break</span>
                      </div>
                    );
                  }
                  return <div className={className} {...props}>{children}</div>;
                },
                table({ children, ...props }) {
                  return (
                    <div className="overflow-x-auto my-6 rounded-lg border border-border/80 shadow-sm break-inside-avoid max-w-full">
                      <table className="w-full border-collapse text-left text-sm" {...props}>
                        {children}
                      </table>
                    </div>
                  );
                },
                thead({ children, ...props }) {
                  return (
                    <thead className="bg-elevated text-xs font-bold uppercase tracking-wider border-b-2 border-border text-foreground" {...props}>
                      {children}
                    </thead>
                  );
                },
                th({ children, ...props }) {
                  return (
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground" {...props}>
                      {children}
                    </th>
                  );
                },
                td({ children, ...props }) {
                  return (
                    <td className="px-4 py-3 text-sm border-b border-border/50 text-foreground" {...props}>
                      {children}
                    </td>
                  );
                },
                tr({ children, ...props }) {
                  return (
                    <tr className="hover:bg-elevated/40 transition-colors odd:bg-transparent even:bg-elevated/20" {...props}>
                      {children}
                    </tr>
                  );
                },
                pre({ children, ...props }) {
                  return (
                    <pre className="break-inside-avoid shadow-sm overflow-x-auto max-w-full text-xs sm:text-sm" {...props}>
                      {children}
                    </pre>
                  );
                },
                img({ src, alt, ...props }) {
                  return (
                    <span className="block my-4 text-center break-inside-avoid">
                      <img
                        src={src}
                        alt={alt}
                        className="max-w-full h-auto inline-block rounded-lg border border-border shadow-sm"
                        {...props}
                      />
                    </span>
                  );
                },
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
