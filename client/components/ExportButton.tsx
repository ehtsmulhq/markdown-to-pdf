"use client";

import { useState } from "react";
import { convertToPdf, downloadBlob, type FontFamilyChoice } from "@/lib/api";

interface ExportButtonProps {
  markdown: string;
  filename?: string;
  pageType: "letter" | "a4" | "a3";
  fontFamily?: FontFamilyChoice;
  onError: (message: string) => void;
}

export default function ExportButton({
  markdown,
  filename,
  pageType,
  fontFamily = "sans",
  onError,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const isEmpty = !markdown.trim();

  const handleExport = async () => {
    if (isEmpty || loading) return;

    setLoading(true);
    try {
      const blob = await convertToPdf(markdown, pageType, fontFamily);
      const pdfName = filename
        ? filename.replace(/\.(md|markdown)$/i, ".pdf")
        : "document.pdf";
      downloadBlob(blob, pdfName);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isEmpty || loading}
      className="btn-primary h-9 flex items-center justify-center gap-2 text-xs font-semibold px-4"
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
          <span>Exporting...</span>
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
          <span>Export PDF</span>
        </>
      )}
    </button>
  );
}
