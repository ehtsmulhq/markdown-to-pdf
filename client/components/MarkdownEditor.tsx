"use client";

import React, { useRef, useState } from "react";
import FileUpload from "@/components/FileUpload";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUpload: (content: string, name: string) => void;
  onError: (message: string) => void;
}

export default function MarkdownEditor({
  value,
  onChange,
  onUpload,
  onError,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);

      onChange(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleInsertPageBreak = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const tag = "\n\n<!-- pagebreak -->\n\n";
    const newValue = value.substring(0, start) + tag + value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tag.length;
    }, 0);
  };

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    onChange("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".md") && !ext.endsWith(".markdown") && file.type !== "text/markdown" && file.type !== "text/plain") {
      onError("Please drop a valid .md or .markdown file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpload(reader.result, file.name);
      }
    };
    reader.onerror = () => {
      onError("Failed to read file");
    };
    reader.readAsText(file);
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const lineCount = value ? value.split("\n").length : 0;
  const charCount = value.length;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-1 flex-col overflow-hidden bg-surface transition-colors duration-200 relative ${
        isDragging ? "ring-2 ring-accent ring-inset bg-accent/5" : ""
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-30 bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent flex items-center justify-center text-accent mb-3 shadow-glow">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-foreground">Drop .md file to load into editor</h4>
        </div>
      )}

      {/* Touch-Friendly & Fully Visible Editor Sub-Toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-border bg-background/50 px-2 sm:px-4 text-xs text-muted transition-colors duration-200 overflow-x-auto no-scrollbar gap-2 flex-shrink-0">
        {/* Editor Info & Statistics Badges */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <span className="font-semibold text-foreground flex items-center gap-1 whitespace-nowrap text-[11px] sm:text-xs">
            <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden xs:inline">Editor</span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="whitespace-nowrap text-[10px] sm:text-xs bg-elevated/80 px-1.5 py-0.5 rounded border border-border/60">{lineCount}L</span>
          <span className="whitespace-nowrap text-[10px] sm:text-xs bg-elevated/80 px-1.5 py-0.5 rounded border border-border/60">{wordCount}W</span>
          <span className="hidden sm:inline-block whitespace-nowrap text-[10px] sm:text-xs bg-elevated/80 px-1.5 py-0.5 rounded border border-border/60">{charCount}C</span>
        </div>

        {/* 100% Mobile Visible Action Toolbar */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* File Upload Button */}
          <FileUpload onUpload={onUpload} onError={onError} />

          {/* Page Break Pill Button */}
          <button
            type="button"
            onClick={handleInsertPageBreak}
            className="flex-shrink-0 whitespace-nowrap h-7 flex items-center gap-1 hover:text-foreground active:scale-95 touch-manipulation transition-all px-2 sm:px-2.5 py-1 rounded bg-accent/10 border border-accent/30 text-accent text-[10px] sm:text-[11px] font-medium"
            title="Insert a manual page break tag"
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>+ Break</span>
          </button>

          <div className="w-[1px] h-4 bg-border mx-0.5 flex-shrink-0" />

          {/* Icon Utilities (Copy & Clear) */}
          <div className="flex items-center gap-0.5 bg-elevated/60 p-0.5 rounded-lg border border-border flex-shrink-0">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={!value}
              className={`h-6 w-6 flex items-center justify-center rounded transition-colors active:scale-95 touch-manipulation ${
                copied
                  ? "text-green-500 bg-green-500/10"
                  : "text-muted hover:text-foreground hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
              }`}
              title={copied ? "Copied!" : "Copy markdown"}
            >
              {copied ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              disabled={!value}
              className="h-6 w-6 flex items-center justify-center rounded text-muted hover:text-danger hover:bg-danger-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95 touch-manipulation"
              title="Clear editor canvas"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Textarea - 16px font-size on mobile prevents Safari auto-zoom */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write or paste your markdown content here..."
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        className="flex-1 w-full resize-none bg-surface p-3 sm:p-4 font-mono text-base sm:text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none selection:bg-accent/30 selection:text-foreground transition-colors duration-200"
      />
    </div>
  );
}
