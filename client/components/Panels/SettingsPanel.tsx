"use client";

import React, { useRef, useEffect } from "react";
import { type FontFamilyChoice } from "@/lib/api";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  fontFamily: FontFamilyChoice;
  onFontChange: (f: FontFamilyChoice) => void;
  pageType: "letter" | "a4" | "a3";
  onPageTypeChange: (p: "letter" | "a4" | "a3") => void;
  previewMode: "split" | "editor" | "preview";
  onPreviewModeChange: (m: "split" | "editor" | "preview") => void;
  toc: boolean;
  onTocChange: (toc: boolean) => void;
  headerText: string;
  onHeaderTextChange: (h: string) => void;
  footerText: string;
  onFooterTextChange: (f: string) => void;
}

export default function SettingsPanel({
  open,
  onClose,
  fontFamily,
  onFontChange,
  pageType,
  onPageTypeChange,
  previewMode,
  onPreviewModeChange,
  toc,
  onTocChange,
  headerText,
  onHeaderTextChange,
  footerText,
  onFooterTextChange,
}: SettingsPanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute right-4 top-14 z-40 w-80 rounded-xl border border-border bg-surface p-4 shadow-2xl backdrop-blur-md animate-fade-in text-xs">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <span className="font-bold text-foreground">Proof &amp; Composition Settings</span>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-foreground text-sm"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Document Geometry */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
            Document Geometry
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(["a4", "letter", "a3"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onPageTypeChange(type)}
                className={`py-1 rounded text-center uppercase font-medium border transition-colors ${
                  pageType === type
                    ? "bg-accent text-white border-accent"
                    : "bg-elevated border-border text-muted hover:text-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Font Family Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
            Typography Style
          </label>
          <select
            value={fontFamily}
            onChange={(e) => onFontChange(e.target.value as FontFamilyChoice)}
            className="w-full rounded border border-border bg-elevated px-2 py-1.5 text-foreground focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="sans">Editorial Sans</option>
            <option value="serif">Literary Serif</option>
            <option value="mono">Technical Monospace</option>
            <option value="garamond">Classical Garamond</option>
            <option value="modern">Modern Sans</option>
          </select>
        </div>

        {/* Table of Contents Toggle */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-foreground">Table of Contents</span>
              <p className="text-[10px] text-muted">Generate anchored heading directory</p>
            </div>
            <button
              type="button"
              onClick={() => onTocChange(!toc)}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                toc ? "bg-accent" : "bg-elevated border border-border"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  toc ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <p className="text-[10px] text-muted mt-1.5 italic">
            Tip: You can also place <code className="bg-elevated px-1 py-0.5 rounded font-mono text-foreground">[toc]</code> anywhere in your document to position it manually.
          </p>
        </div>

        {/* Page Header Template */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
            Header Template
          </label>
          <input
            type="text"
            value={headerText}
            onChange={(e) => onHeaderTextChange(e.target.value)}
            placeholder="e.g. Confidential · 2026"
            className="w-full rounded border border-border bg-elevated px-2 py-1 text-foreground focus:outline-none focus:border-accent"
          />
        </div>

        {/* Page Footer Template */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
            Footer Template
          </label>
          <input
            type="text"
            value={footerText}
            onChange={(e) => onFooterTextChange(e.target.value)}
            placeholder="{page} / {pages}"
            className="w-full rounded border border-border bg-elevated px-2 py-1 text-foreground focus:outline-none focus:border-accent"
          />
        </div>
      </div>
    </div>
  );
}
