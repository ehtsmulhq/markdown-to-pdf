"use client";

import { useState, useEffect, useCallback } from "react";
import ExportButton from "@/components/ExportButton";
import MarkdownEditor from "@/components/MarkdownEditor";
import MarkdownPreview from "@/components/MarkdownPreview";
import { type FontFamilyChoice } from "@/lib/api";

type ThemeMode = "light" | "dark" | "system";

const SAMPLE_MARKDOWN = `# Modern Markdown to PDF

Welcome to **MD → PDF**, a simple and powerful document converter with visual page break indicators and custom font family controls.

## Features

- **Real-Time Preview**: Live rendering with GFM support
- **Custom Font Choice**: Sans-Serif, Serif, Monospace, Garamond, and Modern Sans
- **Industry-Grade Theme System**: Light, Dark, and System OS preference modes
- **Visual Page Breaks**: Clear line guides for page 1, page 2, etc.
- **Diagram & Table Protection**: Diagrams and tables automatically avoid splitting awkwardly across pages

> "Markdown allows you to write using an easy-to-read, easy-to-write plain text format."

### Formatting Example

| Feature | Support | Status |
| :--- | :---: | ---: |
| Code Syntax | Yes | ✅ Ready |
| Custom Tables | Yes | ✅ Ready |
| Blockquotes | Yes | ✅ Ready |
| Font Choice | Yes | ✅ Selectable |

\`\`\`javascript
// Example JavaScript code snippet
function generatePdf(markdown) {
  console.log("Converting markdown to PDF...");
  return true;
}
\`\`\`

<!-- pagebreak -->

# Page 2: Advanced Documentation

This section is forced onto **Page 2** using the manual \`<!-- pagebreak -->\` tag!

### Page Break Protection Demonstration

The table and code block below are protected with \`break-inside: avoid\` rules so they will never cut awkwardly down the middle when exporting to PDF:

| Section | Description | Page |
| :--- | :--- | :--- |
| Overview | Intro to PDF layout | Page 1 |
| Advanced | Manual page breaks & diagrams | Page 2 |
| Export | High quality Puppeteer export | Page 2 |

\`\`\`json
{
  "pageBreakProtection": true,
  "supportedTags": ["<!-- pagebreak -->", "\\pagebreak", "[[pagebreak]]"],
  "status": "ready"
}
\`\`\`
`;

export default function Home() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [filename, setFilename] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pageType, setPageType] = useState<"letter" | "a4" | "a3">("a4");
  const [fontFamily, setFontFamily] = useState<FontFamilyChoice>("sans");
  const [activeTab, setActiveTab] = useState<"editor" | "preview" | "split">("split");

  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("dark");

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

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem("theme_mode", mode);
    applyTheme(mode);
  };

  const handleUpload = (content: string, name: string) => {
    setMarkdown(content);
    setFilename(name);
    setError(null);
  };

  const handleMarkdownChange = (value: string) => {
    setMarkdown(value);
    setError(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Premium Top Header Navbar */}
      <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4 md:px-6 z-20 transition-colors duration-200">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-indigo-600 to-purple-700 shadow-glow flex-shrink-0 ring-1 ring-white/20">
            <svg
              className="h-5 w-5 text-white flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-foreground">MD</span>
              <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span className="bg-accent/15 text-accent border border-accent/30 px-1.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider">
                PDF
              </span>
            </div>
            <p className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted truncate max-w-[160px] sm:max-w-[220px]" title={filename ? filename : "Markdown Studio"}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="truncate">{filename ? filename : "Markdown Studio"}</span>
            </p>
          </div>
        </div>

        {/* Output & Global Settings Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Segmented Industry-Grade Theme Switcher */}
          <div className="flex items-center p-0.5 rounded-lg border border-border bg-elevated text-xs font-medium flex-shrink-0">
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all duration-150 whitespace-nowrap ${
                themeMode === "light"
                  ? "bg-surface text-foreground shadow-sm font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
              title="Light Theme"
            >
              <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden lg:inline">Light</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all duration-150 whitespace-nowrap ${
                themeMode === "dark"
                  ? "bg-surface text-foreground shadow-sm font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
              title="Dark Theme"
            >
              <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              <span className="hidden lg:inline">Dark</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange("system")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all duration-150 whitespace-nowrap ${
                themeMode === "system"
                  ? "bg-surface text-foreground shadow-sm font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
              title="System Preferred Theme"
            >
              <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden lg:inline">System</span>
            </button>
          </div>

          {/* Font Choice Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-xs flex-shrink-0">
            <span className="text-muted font-medium whitespace-nowrap">Font:</span>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as FontFamilyChoice)}
              className="bg-transparent font-medium text-foreground hover:text-accent focus:outline-none cursor-pointer"
            >
              <option value="sans">Sans-Serif</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
              <option value="garamond">Garamond</option>
              <option value="modern">Modern Sans</option>
            </select>
          </div>

          {/* Page Format Selector Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-xs flex-shrink-0">
            <span className="text-muted font-medium whitespace-nowrap">Page:</span>
            <select
              value={pageType}
              onChange={(e) =>
                setPageType(e.target.value as "letter" | "a4" | "a3")
              }
              className="bg-transparent font-medium text-foreground hover:text-accent focus:outline-none cursor-pointer"
            >
              <option value="letter">Letter</option>
              <option value="a4">A4</option>
              <option value="a3">A3</option>
            </select>
          </div>

          <ExportButton
            markdown={markdown}
            filename={filename}
            pageType={pageType}
            fontFamily={fontFamily}
            onError={setError}
          />
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden border-b border-border bg-surface px-4 py-1.5 justify-around text-xs flex-shrink-0">
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors ${
            activeTab === "editor"
              ? "bg-elevated text-accent border border-border"
              : "text-muted hover:text-foreground"
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors ${
            activeTab === "preview"
              ? "bg-elevated text-accent border border-border"
              : "text-muted hover:text-foreground"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between border-b border-danger-border bg-danger-bg px-4 py-2 text-xs text-danger animate-fade-in z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="hover:opacity-75 text-danger"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Grid */}
      <main className="flex flex-1 overflow-hidden">
        {/* Editor Pane */}
        <section
          className={`flex flex-1 flex-col border-r border-border ${
            activeTab === "preview" ? "hidden md:flex" : "flex"
          }`}
        >
          <MarkdownEditor
            value={markdown}
            onChange={handleMarkdownChange}
            onUpload={handleUpload}
            onError={setError}
          />
        </section>

        {/* Preview Pane */}
        <section
          className={`flex flex-1 flex-col ${
            activeTab === "editor" ? "hidden md:flex" : "flex"
          }`}
        >
          <MarkdownPreview
            content={markdown}
            pageType={pageType}
            fontFamily={fontFamily}
            isDark={effectiveTheme === "dark"}
          />
        </section>
      </main>
    </div>
  );
}
