"use client";

import { useEffect, useRef, useState } from "react";
import {
  saveDocument,
  loadDocument,
  deriveDocumentTitle,
  type DocumentSettings,
  type StoredDocument,
} from "../store";

export function useAutosave(
  content: string,
  settings: DocumentSettings,
  docId: string | null
): { saved: boolean; error: string | null } {
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!docId) return;

    setSaved(false);
    setError(null);

    const timer = setTimeout(() => {
      const existing = loadDocument(docId);
      const updated: StoredDocument = {
        id: docId,
        title: deriveDocumentTitle(content),
        content,
        settings,
        lastModified: Date.now(),
        createdAt: existing?.createdAt || Date.now(),
      };

      const success = saveDocument(updated);
      if (success) {
        setSaved(true);
        setError(null);
      } else {
        setSaved(false);
        setError("Storage quota exceeded. Changes cannot be autosaved locally.");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, settings, docId]);

  return { saved, error };
}
