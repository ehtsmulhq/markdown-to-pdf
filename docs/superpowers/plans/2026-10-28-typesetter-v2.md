# MD to PDF v2 "The Typesetter" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the MD to PDF app from a generic SaaS dashboard into a focused typesetting tool with unified rendering, autosave, minimal chrome, and keyboard-first workflow.

**Architecture:** Server becomes the single rendering authority — both preview and PDF export use the same `markdownToHtml` output. Client replaces `react-markdown` with an iframe showing server-rendered HTML. localStorage provides document persistence. UI chrome shrinks from 104px to 76px with a new header/status-bar layout.

**Tech Stack:** Next.js 15, React 19, TailwindCSS, Express 5, Puppeteer, marked, TypeScript

**Spec:** `docs/design/2026-10-28-md-to-pdf-v2-design.md`

## Global Constraints

- Node.js 20+, TypeScript strict mode, ESM on server
- No new runtime dependencies on client (no CodeMirror, no Monaco, no editor libraries)
- No new npm packages on server except `nanoid` for document IDs
- All existing keyboard shortcuts must continue working
- Puppeteer PDF export must produce identical output to current version
- Build must pass `npm run build` (server tsc + client next build) after every task

## Review Focus

1. **Concurrent PDF exports** — two rapid Export clicks should queue, not race on the singleton browser instance. Pin with a test in Task 2 that fires two concurrent `htmlToPdf` calls.
2. **localStorage quota exceeded** — saving a 5MB document should show a user-facing warning, not silently fail. Pin with a test in Task 3 that mocks `localStorage.setItem` throwing.
3. **Preview iframe XSS** — server-rendered HTML in `srcdoc` must not execute user-injected `<script>` tags. Pin with a verification step in Task 1 that includes a `<script>alert(1)</script>` in the markdown.
4. **Empty document restore** — app loaded with an empty localStorage store should show the sample markdown, not a blank editor. Pin in Task 3.
5. **Mobile bottom tab bar touch targets** — each tab must be ≥44px tall per iOS HIG. Pin with a CSS measurement step in Task 4.

---

### Task 1: Unified Preview Pipeline

**Files:**
- Create: `server/src/routes/preview.ts`
- Modify: `server/src/index.ts` (add preview route, ~3 lines)
- Modify: `client/lib/api.ts` (add `fetchPreview` function)
- Create: `client/lib/hooks/usePreview.ts`
- Modify: `client/components/MarkdownPreview.tsx` (replace ReactMarkdown with iframe)
- Modify: `client/app/page.tsx` (remove `react-markdown`/`remark-gfm` imports, pass new props)

**Interfaces:**
- Consumes: `markdownToHtml(markdown, fontFamily)` from `server/src/services/markdown.ts` (existing)
- Produces:
  - `POST /api/preview` route: `(req: {markdown: string, fontFamily: FontFamilyChoice}) => res.json({html: string})`
  - `fetchPreview(markdown: string, fontFamily: FontFamilyChoice): Promise<string>` in `client/lib/api.ts`
  - `usePreview(markdown: string, fontFamily: FontFamilyChoice): {html: string, loading: boolean}` in `client/lib/hooks/usePreview.ts`

- [ ] **Step 1: Create `server/src/routes/preview.ts`**

Route handler that accepts `{markdown, fontFamily}` in the body, calls `markdownToHtml`, and returns `{html}` as JSON. Validate that `markdown` is a non-empty string; return 400 otherwise. Strip any `<script>` tags from the HTML output before returning (use a regex replace on the rendered HTML: `/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi`).

- [ ] **Step 2: Register the route in `server/src/index.ts`**

Import `previewRouter` and mount at `/api/preview`, same pattern as the existing `/api/convert`.

- [ ] **Step 3: Build server and verify**

Run: `npm --prefix server run build`
Expected: exit code 0, no type errors.

- [ ] **Step 4: Add `fetchPreview` to `client/lib/api.ts`**

```typescript
export async function fetchPreview(
  markdown: string,
  fontFamily: FontFamilyChoice = "sans"
): Promise<string>
```

Same endpoint resolution logic as `convertToPdf`. Returns the HTML string from the JSON response.

- [ ] **Step 5: Create `client/lib/hooks/usePreview.ts`**

```typescript
export function usePreview(
  markdown: string,
  fontFamily: FontFamilyChoice
): { html: string; loading: boolean }
```

Debounce 300ms after last `markdown` or `fontFamily` change. Cache last successful response. Return cached HTML immediately while a new request is in flight. On error, keep showing the last successful HTML.

- [ ] **Step 6: Rewrite `client/components/MarkdownPreview.tsx`**

Remove all `react-markdown` and `remark-gfm` imports, the `remarkPageBreak` plugin, the `processedContent` logic, and the custom `components` prop. Replace the `<ReactMarkdown>` block with:

```tsx
<iframe
  srcDoc={html}
  title="PDF Preview"
  sandbox="allow-same-origin"
  className="w-full border-0"
  style={{ height: '100%' }}
/>
```

Keep the page break overlay, toolbar, and scroll tracking. The `usePreview` hook provides `html`. The `PAGE_SPECS`, `FONT_MAP`, page counting, and page break guide overlay remain — they operate on the outer container, not the iframe content.

- [ ] **Step 7: Update `client/app/page.tsx`**

Remove `react-markdown` and `remark-gfm` from any remaining imports. The `MarkdownPreview` component now only needs `content`, `pageType`, `fontFamily`, and `isDark` props (same interface, different internals).

- [ ] **Step 8: Build and verify**

Run: `npm run build`
Expected: exit code 0. No TypeScript errors. Next.js compiles successfully.

- [ ] **Step 9: Verify XSS safety**

Start dev server. Paste `<script>alert('xss')</script>` into the editor. Confirm the preview iframe shows the literal text `<script>alert('xss')</script>` (escaped) and no alert dialog fires.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: unified preview pipeline — server-rendered HTML in iframe"
```

---

### Task 2: PDF Export Queue & Improvements

**Files:**
- Create: `server/src/services/queue.ts`
- Modify: `server/src/services/pdf.ts` (wrap `htmlToPdf` with queue)
- Modify: `server/src/routes/convert.ts` (use fontFamily from markdownToHtml for filename)
- Modify: `client/components/ExportButton.tsx` (smart filename, toast feedback)
- Create: `client/components/ExportToast.tsx`
- Modify: `client/app/page.tsx` (add toast state)

**Interfaces:**
- Consumes: `htmlToPdf` from `server/src/services/pdf.ts`
- Produces:
  - `enqueue<T>(fn: () => Promise<T>): Promise<T>` in `server/src/services/queue.ts`
  - `ExportToast` component: `(props: {status: 'loading'|'success'|'error', filename?: string, error?: string, onRetry: () => void, onDismiss: () => void}) => JSX.Element`

- [ ] **Step 1: Create `server/src/services/queue.ts`**

```typescript
export function createQueue(): { enqueue: <T>(fn: () => Promise<T>) => Promise<T> }
```

FIFO queue. Each function runs only after the previous one resolves or rejects. No concurrency limit needed — the queue serializes access to the single Puppeteer browser.

- [ ] **Step 2: Integrate queue into `server/src/services/pdf.ts`**

Create a module-level queue instance. Wrap the `htmlToPdf` function body in `queue.enqueue(async () => { ... })`. Signature and return type of `htmlToPdf` remain unchanged.

- [ ] **Step 3: Build server and verify**

Run: `npm --prefix server run build`
Expected: exit code 0.

- [ ] **Step 4: Create `client/components/ExportToast.tsx`**

Fixed-position toast at bottom-right. Three states:
- `loading`: spinner + "Generating PDF..."
- `success`: checkmark + "Downloaded {filename}" — auto-dismisses after 3s
- `error`: red X + error message + "Retry" button

- [ ] **Step 5: Update `client/components/ExportButton.tsx`**

Extract the first `# Heading` from markdown for the PDF filename: `markdown.match(/^#\s+(.+)$/m)?.[1]` → slugify → `.pdf`. Fall back to the uploaded filename (`.md` → `.pdf`), then `"document.pdf"`. Wire the toast callbacks.

- [ ] **Step 6: Wire toast state in `client/app/page.tsx`**

Add `exportStatus` state: `{status, filename, error}`. Pass to `ExportToast`. Render toast below the main layout.

- [ ] **Step 7: Build and verify**

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: export queue, smart filenames, and toast feedback"
```

---

### Task 3: Autosave & Document Persistence

**Files:**
- Create: `client/lib/store.ts`
- Create: `client/lib/hooks/useAutosave.ts`
- Create: `client/lib/hooks/useDocuments.ts`
- Modify: `client/app/page.tsx` (integrate autosave, restore on load)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces:
  - `StoredDocument` type: `{id: string, title: string, content: string, settings: {pageType, fontFamily}, lastModified: number, createdAt: number}`
  - `saveDocument(doc: StoredDocument): boolean` — returns false if quota exceeded
  - `loadDocument(id: string): StoredDocument | null`
  - `listDocuments(): StoredDocument[]` — sorted by lastModified desc
  - `deleteDocument(id: string): void`
  - `getActiveDocumentId(): string | null`
  - `setActiveDocumentId(id: string): void`
  - `useAutosave(content: string, settings: DocumentSettings, docId: string): {saved: boolean, error: string | null}`
  - `useDocuments(): {documents: StoredDocument[], activeDoc: StoredDocument | null, create: () => string, switchTo: (id: string) => void, remove: (id: string) => void}`

- [ ] **Step 1: Create `client/lib/store.ts`**

All functions are synchronous wrappers around `localStorage`. Keys use prefix `mdpdf_doc_`. Active document ID stored at `mdpdf_active`. `saveDocument` wraps `setItem` in try/catch — if it throws (quota exceeded), return `false`. `listDocuments` iterates all `mdpdf_doc_*` keys, parses each, sorts by `lastModified` descending, returns max 20.

Generate IDs with `crypto.randomUUID()` (no nanoid dependency needed — all modern browsers support this).

- [ ] **Step 2: Create `client/lib/hooks/useAutosave.ts`**

Debounces 1 second after last change. Calls `saveDocument` from store. Sets `saved` to true on success, sets `error` to a quota warning message on failure. Resets `saved` to false on next content change.

- [ ] **Step 3: Create `client/lib/hooks/useDocuments.ts`**

Wrapper hook that provides `documents` list, `activeDoc`, and mutation functions. `create()` generates a new `StoredDocument` with the sample markdown, saves it, sets it active, returns the ID. `switchTo(id)` loads a doc and sets it active. `remove(id)` deletes from store; if it was active, switches to the most recent remaining doc or creates a new one.

- [ ] **Step 4: Integrate into `client/app/page.tsx`**

On mount: call `getActiveDocumentId()`. If an ID exists and the document loads, restore its `content`, `pageType`, `fontFamily`. If not, create a new document with sample markdown. Wire `useAutosave` with current content and settings.

Show a subtle "Saved ✓" indicator in the UI (status bar, Task 4) when autosave fires. Show "⚠ Storage full" if autosave returns an error.

- [ ] **Step 5: Verify empty localStorage behavior**

Clear localStorage. Reload app. Confirm the sample markdown appears, a new document is created in storage, and the app is fully functional.

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: autosave and document persistence with localStorage"
```

---

### Task 4: Layout Surgery — Header, Status Bar, Mobile

**Files:**
- Create: `client/components/Header.tsx`
- Create: `client/components/StatusBar.tsx`
- Create: `client/components/Panels/SettingsPanel.tsx`
- Create: `client/components/Panels/DocumentsPanel.tsx`
- Modify: `client/app/page.tsx` (replace header/toolbar with new components)
- Modify: `client/app/globals.css` (new theme tokens)
- Modify: `client/components/MarkdownEditor.tsx` (remove sub-toolbar, keep textarea)
- Delete toolbar from: `client/components/FileUpload.tsx` (move trigger to DocumentsPanel)

**Interfaces:**
- Consumes:
  - `useDocuments()` from Task 3
  - `useAutosave()` status from Task 3
- Produces:
  - `Header` component: `(props: {title: string, onTitleChange, onMenuToggle, onSettingsToggle, onExport, exportDisabled}) => JSX.Element`
  - `StatusBar` component: `(props: {line, col, wordCount, pageType, onPageTypeCycle, theme, onThemeCycle, saved, saveError}) => JSX.Element`
  - `SettingsPanel` component: `(props: {open, fontFamily, onFontChange, pageType, onPageTypeChange, editorFontSize, onFontSizeChange, previewMode, onPreviewModeChange}) => JSX.Element`
  - `DocumentsPanel` component: `(props: {open, documents, activeId, onSelect, onCreate, onDelete, onImport}) => JSX.Element`

- [ ] **Step 1: Create `client/components/Header.tsx`**

48px height. Left: hamburger icon button → toggles `DocumentsPanel`. Center: editable document title (contentEditable span, blur to save). Right: gear icon → toggles `SettingsPanel`, then Export button (reuse existing `ExportButton` logic).

- [ ] **Step 2: Create `client/components/StatusBar.tsx`**

28px height. Fixed to bottom. Left: `Ln {line}, Col {col} · {wordCount} words`. Center: page type badge (clickable, cycles A4 → Letter → A3). Right: theme toggle icon (cycles ☀ → 🌙 → 💻), autosave status indicator.

- [ ] **Step 3: Create `client/components/Panels/SettingsPanel.tsx`**

Dropdown panel that animates down from the gear icon. Two groups: "Document" (page size radio, font family select, margins select) and "Editor" (theme radio, editor font size select, preview mode radio: side-by-side / below / hidden). Closes on outside click or Escape.

- [ ] **Step 4: Create `client/components/Panels/DocumentsPanel.tsx`**

Side panel that slides in from the left. Lists recent documents with title and last-modified time. "New Document" button at top. "Import .md" button (reuses FileUpload logic internally). Each doc has a delete icon on hover. Click switches to that document. Closes on outside click or Escape.

- [ ] **Step 5: Simplify `client/components/MarkdownEditor.tsx`**

Remove the entire sub-toolbar div (lines 131-207 in current file). The editor becomes just the textarea with drag-and-drop support. Upload, page break, copy, clear buttons are removed from here — upload moves to DocumentsPanel, page break becomes `Ctrl+Enter` only, copy/clear move to keyboard shortcuts.

- [ ] **Step 6: Rewrite `client/app/page.tsx` layout**

```
<div flex-col h-screen>
  <Header />                    ← 48px
  <main flex-1 flex>
    <DocumentsPanel />          ← conditional slide-in
    <EditorPane />              ← flex-1
    <PreviewPane />             ← flex-1
    <SettingsPanel />           ← conditional dropdown
  </main>
  <StatusBar />                 ← 28px
  <ExportToast />               ← fixed position
</div>
```

Mobile: single pane with bottom tab bar (Editor / Preview / Export), 44px tab height.

- [ ] **Step 7: Update `client/app/globals.css` with "Ink & Paper" tokens**

Replace current color variables with the Linen (light) and Darkroom (dark) palettes from the design spec. Keep `@layer components` rules intact, update color references.

- [ ] **Step 8: Build and verify**

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 9: Verify mobile bottom tab touch targets**

In the built output, confirm the bottom tab bar buttons have `min-height: 44px` (or equivalent Tailwind class `min-h-[44px]`).

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: new layout — header, status bar, settings/documents panels, mobile tabs"
```

---

### Task 5: Editor Enhancements

**Files:**
- Create: `client/lib/hooks/useEditorEnhancements.ts`
- Create: `client/lib/keyboard.ts`
- Modify: `client/components/MarkdownEditor.tsx` (wire enhancements, add line gutter)
- Create: `client/components/Editor/LineGutter.tsx`
- Create: `client/components/Editor/SearchBar.tsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces:
  - `useEditorEnhancements(textareaRef, value, onChange)` — hook that attaches keydown handlers for auto-indent, bracket close, markdown shortcuts
  - `KeyboardShortcutRegistry` — global shortcut map, registers/unregisters on mount/unmount
  - `LineGutter` component: `(props: {lineCount: number, scrollTop: number, lineHeight: number}) => JSX.Element`
  - `SearchBar` component: `(props: {open, value, textareaRef, onClose}) => JSX.Element`

- [ ] **Step 1: Create `client/lib/keyboard.ts`**

Global keyboard shortcut registry. Maps key combos (`Ctrl+B`, `Ctrl+Shift+E`, etc.) to callbacks. Attaches a single `keydown` listener on `document`. Provides `register(combo, callback)` and `unregister(combo)`. Prevents default on matched combos.

- [ ] **Step 2: Create `client/lib/hooks/useEditorEnhancements.ts`**

Hook that takes `textareaRef`, `value`, `onChange`. Attaches `keydown` handler to the textarea (not global — editor-specific). Implements:
- **Shift+Tab**: dedent (remove up to 2 leading spaces from current line)
- **Enter**: auto-indent (match leading whitespace of current line; add 2 spaces if line ends with `:`, `-`, `*`, or `1.`)
- **Auto-close**: `(` → `()`, `[` → `[]`, `` ` `` → ` `` ` `` `, `"` → `""`, `*` → `**` cursor `**` (only for double-star bold). Only when next char is whitespace or EOL.
- **Ctrl+B**: wrap selection in `**`
- **Ctrl+I**: wrap selection in `*`
- **Ctrl+K**: wrap selection in `[](url)` with cursor on "url"
- **Ctrl+Enter**: insert `\n\n<!-- pagebreak -->\n\n` at cursor

- [ ] **Step 3: Create `client/components/Editor/LineGutter.tsx`**

A `<div>` that renders line numbers 1..N. Styled with the same font-size and line-height as the textarea. Receives `scrollTop` from the textarea's scroll event and applies matching `transform: translateY(-${scrollTop}px)` via a container with `overflow: hidden`.

- [ ] **Step 4: Create `client/components/Editor/SearchBar.tsx`**

Inline bar above the textarea. Shown via `Ctrl+H`. Input for search term, input for replace term, "Next", "Replace", "Replace All" buttons, "Regex" toggle, close button. Uses `textarea.setSelectionRange` to highlight matches. Manages its own state.

- [ ] **Step 5: Wire into `client/components/MarkdownEditor.tsx`**

Add `LineGutter` beside the textarea in a flex row. Wire `useEditorEnhancements`. Add `SearchBar` above the textarea (conditionally rendered). Track cursor position (line, col) from `selectionStart` on `click`, `keyup`, `select` events — expose via a callback prop for the `StatusBar`.

- [ ] **Step 6: Register global shortcuts in `client/app/page.tsx`**

Using `keyboard.ts`, register:
- `Ctrl+S`: force save (flash "Saved ✓")
- `Ctrl+Shift+E`: trigger export
- `Ctrl+,`: toggle settings panel
- `Ctrl+\`: toggle preview visibility
- `Escape`: close any open panel

- [ ] **Step 7: Build and verify**

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: editor enhancements — line gutter, auto-indent, shortcuts, search"
```

---

### Task 6: PDF Headers/Footers & TOC

**Files:**
- Modify: `server/src/services/markdown.ts` (add TOC generation)
- Modify: `server/src/services/pdf.ts` (add headerTemplate/footerTemplate)
- Modify: `server/src/routes/convert.ts` (accept header/footer/toc options)
- Modify: `server/src/routes/preview.ts` (accept TOC option, render inline)
- Modify: `client/lib/api.ts` (pass new options)
- Modify: `client/components/Panels/SettingsPanel.tsx` (add TOC toggle, header/footer inputs)

**Interfaces:**
- Consumes: `markdownToHtml` from `server/src/services/markdown.ts`, `htmlToPdf` from `server/src/services/pdf.ts`
- Produces:
  - Extended `markdownToHtml(markdown, fontFamily, options?: {toc?: boolean}): Promise<string>` — when `toc` is true, parses headings and prepends a styled TOC block to the HTML body
  - Extended `htmlToPdf(html, pageType, options?: {headerText?: string, footerText?: string}): Promise<Buffer>` — passes templates to Puppeteer's `page.pdf()` using `headerTemplate`/`footerTemplate` with `displayHeaderFooter: true`

- [ ] **Step 1: Add TOC generation to `server/src/services/markdown.ts`**

After `marked.parse()`, if `toc` option is true: regex-extract all `<h1>` through `<h3>` tags from the rendered HTML, build a `<nav class="toc">` block with nested `<ul>/<li>` and `<a href="#heading-id">` links. Prepend to the body. Add CSS for `.toc` in the `PRINT_STYLES` (page break after TOC, indented list, no bullets).

Add `id` attributes to headings: slugify heading text → `id="heading-slug"`. Apply during `marked.parse` via a custom renderer override for headings.

- [ ] **Step 2: Add header/footer templates to `server/src/services/pdf.ts`**

When `options.headerText` or `options.footerText` is provided, set `displayHeaderFooter: true` on the `page.pdf()` call. Build `headerTemplate` and `footerTemplate` HTML strings. Support variables: replace `{title}` with document title (from first `<h1>`), `{page}` with `<span class="pageNumber"></span>`, `{pages}` with `<span class="totalPages"></span>`, `{date}` with current date string. Default margin adjustment: add `margin-top: 1cm` to existing `2cm` when header is present.

- [ ] **Step 3: Update `server/src/routes/convert.ts` and `preview.ts`**

Accept `toc`, `headerText`, `footerText` in request body. Pass through to service functions.

- [ ] **Step 4: Update `client/lib/api.ts`**

Add optional `toc`, `headerText`, `footerText` params to both `fetchPreview` and `convertToPdf`.

- [ ] **Step 5: Add controls to `client/components/Panels/SettingsPanel.tsx`**

Under "Document" group: "Table of Contents" toggle, "Page Header" text input, "Page Footer" text input (with placeholder showing `{page} / {pages}`).

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: PDF table of contents, page headers and footers"
```

---

### Task 7: Final Polish & Push

**Files:**
- Modify: `README.md` (update screenshots description, feature list, keyboard shortcuts)
- Modify: `.github/workflows/deploy.yml` (ensure CI still works)
- Modify: `Dockerfile` (no changes expected, verify build)

**Interfaces:**
- Consumes: everything from Tasks 1-6
- Produces: final commit and push

- [ ] **Step 1: Update `README.md`**

Rewrite feature list to match v2 capabilities. Add keyboard shortcuts section. Update Quick Start instructions. Remove any stale references.

- [ ] **Step 2: Full build verification**

Run: `npm run build`
Expected: exit code 0, no warnings.

- [ ] **Step 3: Verify dev mode works**

Run: `npm run dev` (start and quickly verify both client and server start without errors, then stop).

- [ ] **Step 4: Commit and push**

```bash
git add -A && git commit -m "docs: update README for v2 release"
git push origin main
```
