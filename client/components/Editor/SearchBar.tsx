"use client";

import React, { useState } from "react";

interface SearchBarProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (newValue: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function SearchBar({
  open,
  onClose,
  value,
  onChange,
  textareaRef,
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [isRegex, setIsRegex] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  if (!open) return null;

  const findNext = () => {
    if (!searchTerm || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const startPos = textarea.selectionEnd;
    const textToSearch = value.slice(startPos);

    let matchIdx = -1;
    let matchLen = 0;

    if (isRegex) {
      try {
        const regex = new RegExp(searchTerm, "i");
        const match = regex.exec(textToSearch);
        if (match) {
          matchIdx = startPos + match.index;
          matchLen = match[0].length;
        } else {
          // Wrap around to start
          const wrapMatch = regex.exec(value);
          if (wrapMatch) {
            matchIdx = wrapMatch.index;
            matchLen = wrapMatch[0].length;
          }
        }
      } catch {
        // invalid regex
      }
    } else {
      const idx = textToSearch.toLowerCase().indexOf(searchTerm.toLowerCase());
      if (idx !== -1) {
        matchIdx = startPos + idx;
        matchLen = searchTerm.length;
      } else {
        // Wrap around
        const wrapIdx = value.toLowerCase().indexOf(searchTerm.toLowerCase());
        if (wrapIdx !== -1) {
          matchIdx = wrapIdx;
          matchLen = searchTerm.length;
        }
      }
    }

    if (matchIdx !== -1) {
      textarea.focus();
      textarea.setSelectionRange(matchIdx, matchIdx + matchLen);
    }
  };

  const handleReplace = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    if (selected.toLowerCase() === searchTerm.toLowerCase()) {
      const updated = value.slice(0, start) + replaceTerm + value.slice(end);
      onChange(updated);
      setTimeout(() => {
        textarea.setSelectionRange(start, start + replaceTerm.length);
        findNext();
      }, 0);
    } else {
      findNext();
    }
  };

  const handleReplaceAll = () => {
    if (!searchTerm) return;
    let updated = value;
    if (isRegex) {
      try {
        const regex = new RegExp(searchTerm, "g");
        updated = value.replace(regex, replaceTerm);
      } catch {
        return;
      }
    } else {
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      updated = value.replace(regex, replaceTerm);
    }
    onChange(updated);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-elevated/70 px-4 py-2 text-xs">
      <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && findNext()}
          className="rounded border border-border bg-surface px-2 py-1 text-foreground focus:outline-none focus:border-accent flex-1"
        />
        <button
          type="button"
          onClick={() => setIsRegex(!isRegex)}
          className={`px-1.5 py-1 rounded text-[10px] font-mono border transition-colors ${
            isRegex
              ? "bg-accent text-white border-accent"
              : "bg-surface border-border text-muted hover:text-foreground"
          }`}
          title="Regular Expression Search"
        >
          .*
        </button>
        <button
          type="button"
          onClick={findNext}
          className="rounded border border-border bg-surface px-2 py-1 text-muted hover:text-foreground hover:bg-surface-hover"
        >
          Find
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Replace..."
          value={replaceTerm}
          onChange={(e) => setReplaceTerm(e.target.value)}
          className="rounded border border-border bg-surface px-2 py-1 text-foreground focus:outline-none focus:border-accent flex-1"
        />
        <button
          type="button"
          onClick={handleReplace}
          className="rounded border border-border bg-surface px-2 py-1 text-muted hover:text-foreground hover:bg-surface-hover"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={handleReplaceAll}
          className="rounded border border-border bg-surface px-2 py-1 text-muted hover:text-foreground hover:bg-surface-hover"
        >
          All
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-muted hover:text-foreground text-xs ml-auto"
      >
        ✕
      </button>
    </div>
  );
}
