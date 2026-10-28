"use client";

import React, { useRef, useState } from "react";
import LineGutter from "./Editor/LineGutter";
import SearchBar from "./Editor/SearchBar";
import { useEditorEnhancements } from "@/lib/hooks/useEditorEnhancements";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUpload?: (content: string, name: string) => void;
  onError?: (message: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  searchOpen?: boolean;
  onSearchClose?: () => void;
}

export default function MarkdownEditor({
  value,
  onChange,
  onUpload,
  onError,
  onCursorChange,
  searchOpen = false,
  onSearchClose,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { handleKeyDown: handleEnhanceKeyDown } = useEditorEnhancements(
    textareaRef,
    value,
    onChange
  );

  const lineCount = value.split("\n").length;

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

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
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
      {/* Inline Search & Replace Bar */}
      <SearchBar
        open={searchOpen}
        onClose={onSearchClose || (() => {})}
        value={value}
        onChange={onChange}
        textareaRef={textareaRef}
      />

      {/* Editor Surface with Line Gutter */}
      <div className="flex flex-1 overflow-hidden relative">
        <LineGutter lineCount={lineCount} scrollTop={scrollTop} />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            updateCursorPosition();
          }}
          onScroll={handleScroll}
          onSelect={updateCursorPosition}
          onClick={updateCursorPosition}
          onKeyUp={updateCursorPosition}
          onKeyDown={(e) => {
            handleEnhanceKeyDown(e);
            setTimeout(updateCursorPosition, 0);
          }}
          placeholder="Type or paste your markdown manuscript here..."
          spellCheck={false}
          className="flex-1 w-full resize-none bg-surface p-6 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted focus:outline-none selection:bg-accent/20 transition-colors duration-150 overflow-y-auto"
        />
      </div>
    </div>
  );
}
