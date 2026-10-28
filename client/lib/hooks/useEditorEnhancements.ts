import React from "react";

export function useEditorEnhancements(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  onChange: (newValue: string) => void
) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    // 1. Markdown shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        const replacement = `**${selected || "bold text"}**`;
        const updated = value.slice(0, start) + replacement + value.slice(end);
        onChange(updated);
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2 + (selected ? selected.length : 9));
        }, 0);
        return;
      }

      if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        const replacement = `*${selected || "italic text"}*`;
        const updated = value.slice(0, start) + replacement + value.slice(end);
        onChange(updated);
        setTimeout(() => {
          textarea.setSelectionRange(start + 1, start + 1 + (selected ? selected.length : 11));
        }, 0);
        return;
      }

      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        const replacement = `[${selected || "link text"}](url)`;
        const updated = value.slice(0, start) + replacement + value.slice(end);
        onChange(updated);
        setTimeout(() => {
          const urlStart = start + (selected ? selected.length : 9) + 3;
          textarea.setSelectionRange(urlStart, urlStart + 3);
        }, 0);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const tag = "\n\n<!-- pagebreak -->\n\n";
        const updated = value.slice(0, start) + tag + value.slice(end);
        onChange(updated);
        setTimeout(() => {
          textarea.setSelectionRange(start + tag.length, start + tag.length);
        }, 0);
        return;
      }
    }

    // 2. Tab & Shift+Tab handling
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        // Dedent current line
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const currentLine = value.slice(lineStart);
        if (currentLine.startsWith("  ")) {
          const updated = value.slice(0, lineStart) + currentLine.slice(2);
          onChange(updated);
          setTimeout(() => {
            const newPos = Math.max(lineStart, start - 2);
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        }
      } else {
        // Soft tab 2 spaces
        const updated = value.slice(0, start) + "  " + value.slice(end);
        onChange(updated);
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      }
      return;
    }

    // 3. Auto-indent on Enter
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const currentLine = value.slice(lineStart, start);
      const indentMatch = currentLine.match(/^(\s+)/);
      let indent = indentMatch ? indentMatch[1] : "";

      // List or block auto-continuation
      if (/^\s*[-*]\s+/.test(currentLine)) {
        indent += "";
        const updated = value.slice(0, start) + "\n" + indent + "- " + value.slice(end);
        onChange(updated);
        setTimeout(() => {
          textarea.setSelectionRange(start + 1 + indent.length + 2, start + 1 + indent.length + 2);
        }, 0);
        return;
      }

      const updated = value.slice(0, start) + "\n" + indent + value.slice(end);
      onChange(updated);
      setTimeout(() => {
        textarea.setSelectionRange(start + 1 + indent.length, start + 1 + indent.length);
      }, 0);
      return;
    }

    // 4. Bracket/quote auto-close
    const PAIRS: Record<string, string> = {
      "(": ")",
      "[": "]",
      "{": "}",
      "`": "`",
      '"': '"',
    };

    if (PAIRS[e.key] && !selected) {
      const nextChar = value[start] || "";
      if (/\s|$/.test(nextChar)) {
        e.preventDefault();
        const close = PAIRS[e.key];
        const updated = value.slice(0, start) + e.key + close + value.slice(end);
        onChange(updated);
        setTimeout(() => {
          textarea.setSelectionRange(start + 1, start + 1);
        }, 0);
      }
    }
  };

  return { handleKeyDown };
}
