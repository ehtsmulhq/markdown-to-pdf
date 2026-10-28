"use client";

import React from "react";

interface StatusBarProps {
  line: number;
  col: number;
  wordCount: number;
  charCount: number;
  pageType: "letter" | "a4" | "a3";
  onPageTypeCycle: () => void;
  themeMode: "light" | "dark" | "system";
  onThemeCycle: () => void;
  saved: boolean;
  saveError: string | null;
}

export default function StatusBar({
  line,
  col,
  wordCount,
  charCount,
  pageType,
  onPageTypeCycle,
  themeMode,
  onThemeCycle,
  saved,
  saveError,
}: StatusBarProps) {
  return (
    <footer className="flex h-7 items-center justify-between border-t border-border bg-surface px-4 text-[11px] text-muted select-none transition-colors duration-150 z-20">
      {/* Left: Position & Metrics */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span>
          Ln {line}, Col {col}
        </span>
        <span className="text-muted-foreground">•</span>
        <span>{wordCount} words</span>
        <span className="text-muted-foreground hidden sm:inline">•</span>
        <span className="hidden sm:inline">{charCount} chars</span>
        <span className="text-muted-foreground">•</span>
        {saveError ? (
          <span className="text-rose-500 font-medium">⚠ {saveError}</span>
        ) : saved ? (
          <span className="text-emerald-500 font-medium">Saved ✓</span>
        ) : (
          <span className="text-muted font-medium animate-pulse">Saving...</span>
        )}
      </div>

      {/* Right: Page format badge + Theme cycle toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPageTypeCycle}
          className="uppercase font-semibold text-foreground hover:text-accent transition-colors bg-elevated px-1.5 py-0.5 rounded border border-border"
          title="Click to cycle page format (A4 / Letter / A3)"
        >
          {pageType}
        </button>

        <button
          type="button"
          onClick={onThemeCycle}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          title={`Current Theme: ${themeMode}. Click to toggle.`}
        >
          {themeMode === "light" && <span>☀️ Light</span>}
          {themeMode === "dark" && <span>🌙 Dark</span>}
          {themeMode === "system" && <span>💻 System</span>}
        </button>
      </div>
    </footer>
  );
}
