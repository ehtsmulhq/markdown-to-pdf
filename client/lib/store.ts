import { type FontFamilyChoice } from "./api";

export interface DocumentSettings {
  pageType: "letter" | "a4" | "a3";
  fontFamily: FontFamilyChoice;
}

export interface StoredDocument {
  id: string;
  title: string;
  content: string;
  settings: DocumentSettings;
  lastModified: number;
  createdAt: number;
}

const STORAGE_PREFIX = "mdpdf_doc_";
const ACTIVE_DOC_KEY = "mdpdf_active";

export function deriveDocumentTitle(markdown: string, fallback = "Untitled Manuscript"): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (match && match[1]) {
    return match[1].trim();
  }
  return fallback;
}

export function saveDocument(doc: StoredDocument): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = `${STORAGE_PREFIX}${doc.id}`;
    window.localStorage.setItem(key, JSON.stringify(doc));
    return true;
  } catch (err) {
    console.error("Storage quota or error saving document:", err);
    return false;
  }
}

export function loadDocument(id: string): StoredDocument | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDocument;
  } catch (err) {
    console.error("Error loading document:", err);
    return null;
  }
}

export function listDocuments(): StoredDocument[] {
  if (typeof window === "undefined") return [];
  const docs: StoredDocument[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          try {
            docs.push(JSON.parse(raw));
          } catch {
            // ignore corrupted entry
          }
        }
      }
    }
  } catch (err) {
    console.error("Error listing documents:", err);
  }
  return docs.sort((a, b) => b.lastModified - a.lastModified).slice(0, 20);
}

export function deleteDocument(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
    if (getActiveDocumentId() === id) {
      window.localStorage.removeItem(ACTIVE_DOC_KEY);
    }
  } catch (err) {
    console.error("Error deleting document:", err);
  }
}

export function getActiveDocumentId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_DOC_KEY);
}

export function setActiveDocumentId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_DOC_KEY, id);
}

export function createNewDocument(
  initialContent: string,
  settings: DocumentSettings = { pageType: "a4", fontFamily: "sans" }
): StoredDocument {
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `doc_${Date.now()}`;
  const now = Date.now();
  const doc: StoredDocument = {
    id,
    title: deriveDocumentTitle(initialContent),
    content: initialContent,
    settings,
    lastModified: now,
    createdAt: now,
  };
  saveDocument(doc);
  setActiveDocumentId(id);
  return doc;
}
