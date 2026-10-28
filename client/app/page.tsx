"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import StatusBar from "@/components/StatusBar";
import MarkdownEditor from "@/components/MarkdownEditor";
import MarkdownPreview from "@/components/MarkdownPreview";
import SettingsPanel from "@/components/Panels/SettingsPanel";
import DocumentsPanel from "@/components/Panels/DocumentsPanel";
import ExportToast, { type ExportToastProps } from "@/components/ExportToast";
import { type FontFamilyChoice } from "@/lib/api";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { registerShortcut, unregisterShortcut } from "@/lib/keyboard";

type ThemeMode = "light" | "dark" | "system";

const INITIAL_MANUSCRIPT = `# The Typesetter

A dedicated **Markdown-to-PDF Studio** designed around print-accurate proofs and distraction-free composition.

[toc]

## Architectural Principles

1. **True-to-Print Proofs**: What you see in the right-hand proof is the identical HTML structure sent to the headless Chromium PDF compiler.
2. **Subtle Chrome**: Controls remain quiet until called upon.
3. **Continuous Autosave**: Every edit is kept safely in browser storage.

### Data Composition Demonstration

| Field | Format | Status |
| :--- | :---: | ---: |
| GFM Tables | Strict | Ready |
| Code Typography | JetBrains Mono | Calibrated |
| PDF Margins | 2.0 cm Uniform | Protected |

\`\`\`typescript
function exportDocument(content: string): Promise<Blob> {
  return convertToPdf(content, "a4", "sans");
}
\`\`\`

<!-- pagebreak -->

# Page 2: Manual Break Verified

This text begins on **Page 2** via the \`<!-- pagebreak -->\` manual tag. All diagrams and preformatted code blocks will never split awkwardly down the middle.
`;

export default function Home() {
  const { documents, activeDoc, setActiveDoc, create, switchTo, remove, refreshList } =
    useDocuments(INITIAL_MANUSCRIPT);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("dark");

  const [toastState, setToastState] = useState<{
    status: ExportToastProps["status"];
    filename?: string;
    error?: string;
  }>({
    status: "idle",
  });

  const markdown = activeDoc?.content || "";
  const pageType = activeDoc?.settings.pageType || "a4";
  const fontFamily = activeDoc?.settings.fontFamily || "sans";
  const toc = Boolean(activeDoc?.settings.toc);
  const headerText = activeDoc?.settings.headerText || "";
  const footerText = activeDoc?.settings.footerText || "";
  const title = activeDoc?.title || "Untitled Manuscript";

  const { saved, error: saveError } = useAutosave(
    markdown,
    { pageType, fontFamily, toc, headerText, footerText },
    activeDoc?.id || null
  );

  const applyTheme = useCallback((mode: ThemeMode) => {
    let isDark = false;
    if (mode === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = mode === "dark";
    }

    setEffectiveTheme(isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") as ThemeMode | null;
    const initialMode: ThemeMode = savedTheme || "system";
    setThemeMode(initialMode);
    applyTheme(initialMode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentSaved = localStorage.getItem("theme_mode") as ThemeMode | null;
      if (!currentSaved || currentSaved === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [applyTheme]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    registerShortcut("Ctrl+H", () => setSearchOpen((prev) => !prev));
    registerShortcut("Ctrl+,", () => setSettingsOpen((prev) => !prev));
    registerShortcut("Escape", () => {
      setMenuOpen(false);
      setSettingsOpen(false);
      setSearchOpen(false);
    });

    return () => {
      unregisterShortcut("Ctrl+H");
      unregisterShortcut("Ctrl+,");
      unregisterShortcut("Escape");
    };
  }, []);

  const cycleTheme = () => {
    const next: ThemeMode =
      themeMode === "system" ? "light" : themeMode === "light" ? "dark" : "system";
    setThemeMode(next);
    localStorage.setItem("theme_mode", next);
    applyTheme(next);
  };

  const cyclePageType = () => {
    if (!activeDoc) return;
    const types: ("a4" | "letter" | "a3")[] = ["a4", "letter", "a3"];
    const next = types[(types.indexOf(pageType) + 1) % types.length];
    setActiveDoc({
      ...activeDoc,
      settings: { ...activeDoc.settings, pageType: next },
    });
  };

  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const charCount = markdown.length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-150">
      {/* 48px Typesetter Header */}
      <Header
        title={title}
        onTitleChange={(newTitle) => {
          if (activeDoc) {
            setActiveDoc({ ...activeDoc, title: newTitle });
          }
        }}
        onMenuToggle={() => setMenuOpen(!menuOpen)}
        onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
        markdown={markdown}
        pageType={pageType}
        fontFamily={fontFamily}
        exportOptions={{ toc, headerText, footerText }}
        onExportStatusChange={(status, name, err) => {
          setToastState({ status, filename: name, error: err });
        }}
      />

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden relative">
        <DocumentsPanel
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          documents={documents}
          activeId={activeDoc?.id || null}
          onSelect={switchTo}
          onCreate={() => create()}
          onDelete={remove}
          onImport={(content, name) => {
            create(content);
            refreshList();
          }}
        />

        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          fontFamily={fontFamily}
          onFontChange={(newFont) => {
            if (activeDoc) {
              setActiveDoc({
                ...activeDoc,
                settings: { ...activeDoc.settings, fontFamily: newFont },
              });
            }
          }}
          pageType={pageType}
          onPageTypeChange={(newPage) => {
            if (activeDoc) {
              setActiveDoc({
                ...activeDoc,
                settings: { ...activeDoc.settings, pageType: newPage },
              });
            }
          }}
          previewMode="split"
          onPreviewModeChange={() => {}}
          toc={toc}
          onTocChange={(newToc) => {
            if (activeDoc) {
              setActiveDoc({
                ...activeDoc,
                settings: { ...activeDoc.settings, toc: newToc },
              });
            }
          }}
          headerText={headerText}
          onHeaderTextChange={(newHeader) => {
            if (activeDoc) {
              setActiveDoc({
                ...activeDoc,
                settings: { ...activeDoc.settings, headerText: newHeader },
              });
            }
          }}
          footerText={footerText}
          onFooterTextChange={(newFooter) => {
            if (activeDoc) {
              setActiveDoc({
                ...activeDoc,
                settings: { ...activeDoc.settings, footerText: newFooter },
              });
            }
          }}
        />

        {/* Editor Pane */}
        <section
          className={`flex flex-1 flex-col border-r border-border ${
            mobileTab === "preview" ? "hidden md:flex" : "flex"
          }`}
        >
          <MarkdownEditor
            value={markdown}
            onChange={(val) => {
              if (activeDoc) {
                setActiveDoc({ ...activeDoc, content: val });
              }
            }}
            onUpload={(content) => {
              if (activeDoc) {
                setActiveDoc({ ...activeDoc, content });
              }
            }}
            onCursorChange={(line, col) => setCursorPos({ line, col })}
            searchOpen={searchOpen}
            onSearchClose={() => setSearchOpen(false)}
          />
        </section>

        {/* Proof Preview Pane */}
        <section
          className={`flex flex-1 flex-col ${
            mobileTab === "editor" ? "hidden md:flex" : "flex"
          }`}
        >
          <MarkdownPreview
            content={markdown}
            pageType={pageType}
            fontFamily={fontFamily}
            isDark={effectiveTheme === "dark"}
            toc={toc}
          />
        </section>
      </main>

      {/* Mobile Tab Switcher: 44px HIG height touch target */}
      <div className="flex md:hidden border-t border-border bg-surface text-xs min-h-[44px] z-20">
        <button
          onClick={() => setMobileTab("editor")}
          className={`flex-1 flex items-center justify-center font-medium ${
            mobileTab === "editor" ? "text-accent border-t-2 border-accent" : "text-muted"
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 flex items-center justify-center font-medium ${
            mobileTab === "preview" ? "text-accent border-t-2 border-accent" : "text-muted"
          }`}
        >
          Server Proof
        </button>
      </div>

      {/* 28px Typesetter Status Bar */}
      <StatusBar
        line={cursorPos.line}
        col={cursorPos.col}
        wordCount={wordCount}
        charCount={charCount}
        pageType={pageType}
        onPageTypeCycle={cyclePageType}
        themeMode={themeMode}
        onThemeCycle={cycleTheme}
        saved={saved}
        saveError={saveError}
      />

      <ExportToast
        status={toastState.status}
        filename={toastState.filename}
        error={toastState.error}
        onDismiss={() => setToastState((prev) => ({ ...prev, status: "idle" }))}
      />
    </div>
  );
}
