"use client";

import React from "react";

interface LineGutterProps {
  lineCount: number;
  scrollTop: number;
  lineHeight?: number;
}

export default function LineGutter({ lineCount, scrollTop, lineHeight = 22.4 }: LineGutterProps) {
  const lines = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div className="w-12 flex-shrink-0 select-none overflow-hidden bg-elevated/40 border-r border-border text-right text-[11px] font-mono text-muted-foreground/60 py-6 pr-2">
      <div style={{ transform: `translateY(-${scrollTop}px)` }}>
        {lines.map((num) => (
          <div key={num} style={{ height: `${lineHeight}px`, lineHeight: `${lineHeight}px` }}>
            {num}
          </div>
        ))}
      </div>
    </div>
  );
}
