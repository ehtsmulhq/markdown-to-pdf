"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listDocuments,
  loadDocument,
  createNewDocument,
  deleteDocument,
  getActiveDocumentId,
  setActiveDocumentId,
  type StoredDocument,
  type DocumentSettings,
} from "../store";

export function useDocuments(sampleMarkdown: string) {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<StoredDocument | null>(null);

  const refreshList = useCallback(() => {
    setDocuments(listDocuments());
  }, []);

  useEffect(() => {
    const list = listDocuments();
    setDocuments(list);

    let activeId = getActiveDocumentId();
    let currentDoc: StoredDocument | null = null;

    if (activeId) {
      currentDoc = loadDocument(activeId);
    }

    if (!currentDoc) {
      if (list.length > 0) {
        currentDoc = list[0];
        setActiveDocumentId(currentDoc.id);
      } else {
        currentDoc = createNewDocument(sampleMarkdown);
      }
    }

    setActiveDoc(currentDoc);
    refreshList();
  }, [sampleMarkdown, refreshList]);

  const create = useCallback(
    (initialContent?: string, settings?: DocumentSettings) => {
      const newDoc = createNewDocument(initialContent || sampleMarkdown, settings);
      refreshList();
      setActiveDoc(newDoc);
      return newDoc.id;
    },
    [sampleMarkdown, refreshList]
  );

  const switchTo = useCallback(
    (id: string) => {
      const doc = loadDocument(id);
      if (doc) {
        setActiveDocumentId(id);
        setActiveDoc(doc);
      }
    },
    []
  );

  const remove = useCallback(
    (id: string) => {
      deleteDocument(id);
      const remaining = listDocuments();
      setDocuments(remaining);

      if (activeDoc?.id === id) {
        if (remaining.length > 0) {
          const next = remaining[0];
          setActiveDocumentId(next.id);
          setActiveDoc(next);
        } else {
          const fresh = createNewDocument(sampleMarkdown);
          setDocuments([fresh]);
          setActiveDoc(fresh);
        }
      }
    },
    [activeDoc?.id, sampleMarkdown]
  );

  return {
    documents,
    activeDoc,
    setActiveDoc,
    create,
    switchTo,
    remove,
    refreshList,
  };
}
