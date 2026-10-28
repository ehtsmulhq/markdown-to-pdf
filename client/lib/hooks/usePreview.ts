"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPreview, type FontFamilyChoice } from "@/lib/api";

export function usePreview(
  markdown: string,
  fontFamily: FontFamilyChoice = "sans"
): { html: string; loading: boolean } {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const lastHtmlRef = useRef<string>("");

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      if (!markdown || !markdown.trim()) {
        if (active) {
          setHtml("");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const rendered = await fetchPreview(markdown, fontFamily);
        if (active) {
          lastHtmlRef.current = rendered;
          setHtml(rendered);
        }
      } catch (err) {
        // Keep last successful render on temporary errors
        console.warn("Live preview refresh skipped:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [markdown, fontFamily]);

  return {
    html: html || lastHtmlRef.current,
    loading,
  };
}
