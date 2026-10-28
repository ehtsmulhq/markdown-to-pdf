"use client";

import React, { useEffect } from "react";

export interface ExportToastProps {
  status: "idle" | "loading" | "success" | "error";
  filename?: string;
  error?: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export default function ExportToast({
  status,
  filename = "document.pdf",
  error,
  onRetry,
  onDismiss,
}: ExportToastProps) {
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [status, onDismiss]);

  if (status === "idle") return null;

  return (
    <div className="fixed bottom-10 right-6 z-50 animate-slide-up flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-2xl backdrop-blur-md">
      {status === "loading" && (
        <>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <svg
              className="h-4 w-4 animate-spin"
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
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-foreground">Composing Typeset PDF...</span>
            <span className="text-[11px] text-muted">Rendering &amp; queuing headless Chromium proof</span>
          </div>
        </>
      )}

      {status === "success" && (
        <>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-foreground">Export Completed</span>
            <span className="text-[11px] text-muted">Downloaded as {filename}</span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-2 text-muted hover:text-foreground text-xs"
          >
            ✕
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex flex-col text-xs max-w-xs">
            <span className="font-semibold text-foreground">Export Failed</span>
            <span className="text-[11px] text-muted truncate">{error || "Could not generate PDF proof"}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-2 rounded bg-accent px-2 py-1 text-[11px] font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="ml-1 text-muted hover:text-foreground text-xs"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}
