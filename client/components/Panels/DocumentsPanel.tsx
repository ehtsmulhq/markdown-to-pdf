"use client";

import React, { useRef } from "react";
import { type StoredDocument } from "@/lib/store";

interface DocumentsPanelProps {
  open: boolean;
  onClose: () => void;
  documents: StoredDocument[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onImport: (content: string, filename: string) => void;
}

export default function DocumentsPanel({
  open,
  onClose,
  documents,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onImport,
}: DocumentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onImport(reader.result, file.name);
        onClose();
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 bg-surface border-r border-border shadow-2xl flex flex-col animate-slide-up text-xs">
      {/* Panel Top Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4 flex-shrink-0">
        <span className="font-bold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Manuscript Library
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-foreground text-sm"
        >
          ✕
        </button>
      </div>

      {/* Action shortcuts */}
      <div className="p-3 border-b border-border flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            onCreate();
            onClose();
          }}
          className="flex-1 py-1.5 px-3 rounded bg-accent text-white font-semibold flex items-center justify-center gap-1.5 hover:bg-accent-hover transition-colors"
        >
          <span>+ New Document</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,text/markdown"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="py-1.5 px-3 rounded bg-elevated border border-border text-foreground hover:bg-surface-hover font-medium transition-colors"
          title="Import external .md"
        >
          Import
        </button>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {documents.map((doc) => {
          const isActive = doc.id === activeId;
          const dateStr = new Date(doc.lastModified).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={doc.id}
              onClick={() => {
                onSelect(doc.id);
                onClose();
              }}
              className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? "bg-accent/10 border-accent/40 text-foreground"
                  : "bg-surface border-border hover:bg-elevated text-muted hover:text-foreground"
              }`}
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-semibold truncate">{doc.title || "Untitled Manuscript"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{dateStr}</p>
              </div>

              {documents.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-1 text-muted transition-opacity"
                  title="Delete document"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
