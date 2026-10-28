"use client";

import React from "react";
import ExportButton from "./ExportButton";
import { type FontFamilyChoice } from "@/lib/api";

interface HeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  onMenuToggle: () => void;
  onSettingsToggle: () => void;
  markdown: string;
  pageType: "letter" | "a4" | "a3";
  fontFamily: FontFamilyChoice;
  onExportStatusChange: (status: "idle" | "loading" | "success" | "error", filename?: string, error?: string) => void;
}

export default function Header({
  title,
  onTitleChange,
  onMenuToggle,
  onSettingsToggle,
  markdown,
  pageType,
  fontFamily,
  onExportStatusChange,
}: HeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4 z-30 transition-colors duration-150">
      {/* Left: Document menu + Typesetter branding */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-elevated text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title="Manuscript Library [≡]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        {/* Inline editable document title */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Document Title"
          className="bg-transparent text-xs font-semibold text-foreground tracking-tight max-w-[180px] sm:max-w-[280px] truncate focus:outline-none focus:bg-elevated/40 px-2 py-1 rounded transition-colors"
          title="Click to edit document title"
        />
      </div>

      {/* Right: Settings gear + Proof Export */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onSettingsToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-elevated text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title="Proof & Typography Settings [⚙]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <ExportButton
          markdown={markdown}
          filename={`${title}.pdf`}
          pageType={pageType}
          fontFamily={fontFamily}
          onStatusChange={onExportStatusChange}
        />
      </div>
    </header>
  );
}
