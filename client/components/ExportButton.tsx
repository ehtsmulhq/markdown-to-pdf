"use client";

import { useState } from "react";
import { convertToPdf, downloadBlob, type FontFamilyChoice, type ConvertOptions } from "@/lib/api";

interface ExportButtonProps {
  markdown: string;
  filename?: string;
  pageType: "letter" | "a4" | "a3";
  fontFamily?: FontFamilyChoice;
  options?: ConvertOptions;
  onError?: (message: string) => void;
  onStatusChange?: (status: "idle" | "loading" | "success" | "error", filename?: string, error?: string) => void;
}

export function getCleanExportFilename(markdown: string, providedFilename?: string): string {
  if (providedFilename && providedFilename.trim()) {
    return providedFilename.replace(/\.(md|markdown)$/i, ".pdf");
  }

  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  if (headingMatch && headingMatch[1]) {
    const slug = headingMatch[1]
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
    if (slug) return `${slug}.pdf`;
  }

  return "document.pdf";
}

export default function ExportButton({
  markdown,
  filename,
  pageType,
  fontFamily = "sans",
  options = {},
  onError,
  onStatusChange,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const isEmpty = !markdown.trim();

  const handleExport = async () => {
    if (isEmpty || loading) return;

    setLoading(true);
    const targetFilename = getCleanExportFilename(markdown, filename);
    onStatusChange?.("loading", targetFilename);

    try {
      const blob = await convertToPdf(markdown, pageType, fontFamily, options);
      downloadBlob(blob, targetFilename);
      onStatusChange?.("success", targetFilename);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Export failed";
      onError?.(msg);
      onStatusChange?.("error", targetFilename, msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isEmpty || loading}
      className="btn-primary h-8 flex items-center justify-center gap-1.5 text-xs font-semibold px-3"
    >
      {loading ? (
        <>
          <svg
            className="h-3.5 w-3.5 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Typesetting...</span>
        </>
      ) : (
        <>
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Export Proof</span>
        </>
      )}
    </button>
  );
}
