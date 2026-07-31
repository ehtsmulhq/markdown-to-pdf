"use client";

import { useRef } from "react";

const ACCEPTED_EXTENSIONS = [".md", ".markdown"];
const ACCEPTED_MIME_TYPES = ["text/markdown", "text/plain", ""];

interface FileUploadProps {
  onUpload: (content: string, filename: string) => void;
  onError: (message: string) => void;
}

function isValidMarkdownFile(file: File): boolean {
  return (
    ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)) ||
    ACCEPTED_MIME_TYPES.includes(file.type)
  );
}

export default function FileUpload({ onUpload, onError }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidMarkdownFile(file)) {
      onError("Please upload a valid .md or .markdown file");
      e.target.value = "";
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
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex-shrink-0 whitespace-nowrap h-7 flex items-center gap-1 hover:text-foreground transition-colors px-2.5 py-1 rounded bg-elevated border border-border text-muted text-[11px] font-medium"
        title="Upload .md file"
      >
        <svg
          className="h-3 w-3 text-accent flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <span>Upload .md</span>
      </button>
    </>
  );
}
