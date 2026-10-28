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
}: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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
    <div className="absolute right-4 top-14 z-40 w-72 rounded-xl border border-border bg-surface p-4 shadow-2xl backdrop-blur-md animate-fade-in text-xs">
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
        {/* Document Group */}
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

        {/* Workspace Layout */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
            Workspace Panes
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(["split", "editor", "preview"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onPreviewModeChange(mode)}
                className={`py-1 rounded text-center capitalize font-medium border transition-colors ${
                  previewMode === mode
                    ? "bg-accent text-white border-accent"
                    : "bg-elevated border-border text-muted hover:text-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
