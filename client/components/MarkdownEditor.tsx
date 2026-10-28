"use client";

import React, { useRef, useState } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUpload?: (content: string, name: string) => void;
  onError?: (message: string) => void;
  onCursorChange?: (line: number, col: number) => void;
}

export default function MarkdownEditor({
  value,
  onChange,
  onUpload,
  onError,
  onCursorChange,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateCursorPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea || !onCursorChange) return;

    const pos = textarea.selectionStart;
    const textBefore = value.substring(0, pos);
    const lines = textBefore.split("\n");
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    onCursorChange(line, col);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Basic Tab handling
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
        updateCursorPosition();
      }, 0);
    }
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
    if (
      !ext.endsWith(".md") &&
      !ext.endsWith(".markdown") &&
      file.type !== "text/markdown" &&
      file.type !== "text/plain"
    ) {
      onError?.("Please drop a valid .md or .markdown file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpload?.(reader.result, file.name);
      }
    };
    reader.onerror = () => {
      onError?.("Failed to read file");
    };
    reader.readAsText(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-1 flex-col overflow-hidden bg-surface relative ${
        isDragging ? "ring-2 ring-accent ring-inset bg-accent/5" : ""
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-30 bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent flex items-center justify-center text-accent mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h4 className="text-xs font-semibold text-foreground">Drop markdown file to load</h4>
        </div>
      )}

      {/* Raw typesetting manuscript surface */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          updateCursorPosition();
        }}
        onSelect={updateCursorPosition}
        onClick={updateCursorPosition}
        onKeyUp={updateCursorPosition}
        onKeyDown={handleKeyDown}
        placeholder="Type or paste your markdown manuscript here..."
        spellCheck={false}
        className="flex-1 w-full resize-none bg-surface p-6 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted focus:outline-none selection:bg-accent/20 transition-colors duration-150"
      />
    </div>
  );
}
