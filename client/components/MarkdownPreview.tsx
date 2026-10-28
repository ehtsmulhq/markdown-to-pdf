"use client";

import React, { useState, useRef, useEffect } from "react";
import { type FontFamilyChoice } from "@/lib/api";
import { usePreview } from "@/lib/hooks/usePreview";

interface MarkdownPreviewProps {
  content: string;
  pageType?: "letter" | "a4" | "a3";
  fontFamily?: FontFamilyChoice;
  isDark?: boolean;
}

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const spec = PAGE_SPECS[pageType];
  const { html, loading } = usePreview(content, fontFamily);

  const recalculatePageCount = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    try {
      const doc = iframeRef.current.contentDocument;
      const height = Math.max(doc.body?.scrollHeight || 0, doc.documentElement?.scrollHeight || 0);
      if (height > 0) {
        iframeRef.current.style.height = `${height + 40}px`;
        const pages = Math.ceil((height - spec.marginVert * 2) / spec.printableHeight);
        setTotalPages(Math.max(pages, 1));
      }
    } catch {
      // In case of any cross-origin sandboxing catch
    }
  };

  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;

    const handleIframeLoad = () => {
      recalculatePageCount();
      // inject theme preference styling if dark mode is active
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.body) {
          if (isDark) {
            doc.body.style.filter = "invert(0.9) hue-rotate(180deg)";
            const imgs = doc.querySelectorAll("img, pre, svg");
            imgs.forEach((el) => {
              (el as HTMLElement).style.filter = "invert(1) hue-rotate(180deg)";
            });
          } else {
            doc.body.style.filter = "none";
          }
        }
      } catch {
        // safe sandbox
      }
    };

    iframe.addEventListener("load", handleIframeLoad);
    // Also trigger shortly after html updates
    const timer = setTimeout(handleIframeLoad, 100);

    return () => {
      iframe.removeEventListener("load", handleIframeLoad);
      clearTimeout(timer);
    };
  }, [html, isDark, pageType, fontFamily, spec.marginVert, spec.printableHeight]);

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
            Start typing markdown or upload a file to preview your rendered document with 100% server-accurate layout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background transition-colors duration-200 w-full min-w-0">
      {/* Preview toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-border bg-surface px-3 sm:px-4 text-xs text-muted transition-colors duration-200 flex-shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px] sm:text-xs">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Server Proof
          </span>
          {loading && (
            <span className="text-[10px] text-accent animate-pulse">Rendering...</span>
          )}
          <span className="text-muted-foreground">•</span>
          <span className="text-foreground font-medium text-[11px] sm:text-xs">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Page Breaks guide toggle */}
          <button
            type="button"
            onClick={() => setShowPageGuides(!showPageGuides)}
            className={`flex items-center gap-1 text-[10px] sm:text-[11px] transition-colors px-1.5 sm:px-2 py-1 rounded border ${
              showPageGuides
                ? "bg-accent/15 border-accent/40 text-accent font-medium"
                : "bg-elevated border-border text-muted hover:text-foreground"
            }`}
            title="Toggle visible page break lines"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8m-8 5h8" />
            </svg>
            <span className="hidden sm:inline">Page Breaks: {showPageGuides ? "ON" : "OFF"}</span>
            <span className="sm:hidden">{showPageGuides ? "Breaks ON" : "Breaks OFF"}</span>
          </button>

          <span className="font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] bg-elevated px-1.5 sm:px-2 py-0.5 rounded border border-border flex-shrink-0">
            {pageType}
          </span>
        </div>
      </div>

      {/* Scrollable Printable document container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 flex justify-center bg-background relative transition-colors duration-200 w-full min-w-0"
      >
        {/* Paper Container */}
        <div 
          style={{ maxWidth: `${spec.width}px` }} 
          className="w-full relative transition-all duration-200 min-w-0"
        >
          <div
            className={`min-h-[500px] sm:min-h-[750px] rounded-xl shadow-paper border transition-all duration-200 relative w-full min-w-0 box-border overflow-hidden ${
              isDark ? "bg-surface border-border" : "bg-white border-slate-200"
            }`}
          >
            {/* Mathematical Page Break Guidelines Overlay */}
            {showPageGuides &&
              pageBreakLines.map((topPx, idx) => (
                <div
                  key={idx}
                  style={{ top: `${topPx}px` }}
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center justify-between px-2 -translate-y-1/2"
                >
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 opacity-60 border-t-2 border-dashed border-indigo-500" />
                  <span className="mx-2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-md uppercase tracking-wider whitespace-nowrap">
                    ✂ PAGE {idx + 2} BREAK
                  </span>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 opacity-60 border-t-2 border-dashed border-indigo-500" />
                </div>
              ))}

            {/* Sandboxed Server-rendered HTML Iframe */}
            <iframe
              ref={iframeRef}
              srcDoc={html}
              title="Proof Preview"
              sandbox="allow-same-origin"
              className="w-full border-0 block"
              style={{ minHeight: "750px", overflow: "hidden" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
