# MD to PDF v2 — "The Typesetter" Design

> Written after reading every line of the current codebase. This is not a feature wishlist — it's a surgery plan for the parts that don't work and an architecture for the parts that are missing.

---

## What's Actually Wrong Right Now

### The Editor Problem
The editor is a raw `<textarea>`. No line numbers, no syntax highlighting, no undo history beyond the browser's built-in one, no indentation awareness, no bracket matching. For a tool that calls itself "Professional Markdown Studio", this is the biggest gap between the promise and the reality.

But — and this matters — the current simplicity has a virtue: zero loading time, zero dependencies, instant feedback. A CodeMirror or Monaco integration adds 200-400KB of JavaScript. The design must not lose what the textarea gets right.

### The Preview Problem
The preview uses `react-markdown` for the live pane but `marked` + Puppeteer on the server for the actual PDF. These are two different rendering engines with different parsing behaviors. What you see is not guaranteed to be what you get. The page break indicators are approximations based on CSS pixel math — they drift as content grows. Tables render differently. Code blocks have different fonts.

### The Export Problem
Export is a round-trip to the server. The markdown gets sent as JSON, the server renders it with `marked`, launches a headless Chromium page, generates a PDF, and sends back the binary. This works but:
- It's slow (cold Puppeteer launch is 2-5 seconds)
- It can't work offline
- The Puppeteer browser instance is a singleton with no request queuing — concurrent users will race
- The HTML template on the server (`services/markdown.ts`) duplicates the entire styling logic that also exists in the preview component

### The Layout Problem
The header is a toolbar soup. Theme switcher, font picker, page format, export button — all jammed into one 64px-high bar. On mobile, the font and page selectors hide entirely. The editor sub-toolbar adds another 40px row of buttons. That's 104px of chrome before a single line of content.

### The State Problem
Nothing persists. Reload the page and your document is gone. There's no localStorage save, no file system access, no "recent documents". For a tool where people write multi-page documents, losing work is the worst possible UX failure.

---

## Design Philosophy: "The Typesetter"

This isn't a code editor. This isn't Notion. This isn't Google Docs. It's a **typesetting tool** — the user writes raw text on the left, and a **print-accurate proof** appears on the right. The metaphor is a compositor at a printing press: raw manuscript in, typeset pages out.

### Three principles:

1. **The proof is the product.** The preview pane is not a "nice to have" — it IS the application. Everything else exists to serve it. The editor is a text input. The export is a "send to press" button.

2. **The writing surface disappears.** Chrome (toolbars, buttons, settings) should be invisible during writing. The user sees text and proof, nothing else. Controls surface on hover or through keyboard shortcuts.

3. **The machine remembers.** Every keystroke autosaves. The last session restores on load. Settings persist across visits. The user never thinks about saving.

---

## Architecture Changes

### A. Unified Rendering Pipeline

**The single biggest technical change.** Both preview and export must use the same renderer.

**Approach: Server-Side Rendering for Both**

Keep `marked` as the single Markdown→HTML engine. The server already has the canonical HTML template with print CSS. Instead of the client using `react-markdown` for preview:

1. Client sends markdown to server endpoint `POST /api/preview` (new)
2. Server returns rendered HTML string (no PDF, just the HTML)
3. Client renders the HTML in a sandboxed `<iframe>` with `srcdoc`
4. For export, client hits existing `POST /api/convert` which runs the same HTML through Puppeteer

**Why iframe instead of `dangerouslySetInnerHTML`:** The HTML contains a full `<!DOCTYPE html>` document with `<style>` tags. An iframe gives proper document isolation — CSS doesn't leak, viewport is contained, scrolling is natural.

**Why not move rendering to client:** `marked` is lighter than `react-markdown` + `remark-gfm` + all the custom components. But the real reason is **fidelity** — the PDF comes from this exact HTML. If the preview shows the same HTML, the preview matches the PDF. Period.

**Performance:** Debounce the preview request to 300ms after last keystroke. Cache the last response. Show a subtle "rendering..." indicator in the preview toolbar only if the request takes >500ms. For offline mode (future), bundle `marked` on the client as a fallback.

### B. Editor: Lightweight Enhancement, Not Replacement

Don't add CodeMirror. Instead, build a thin enhancement layer over the textarea:

1. **Line numbers gutter** — A `<div>` alongside the textarea that mirrors line count. Synced via scroll event. Pure CSS + JS, no library.

2. **Soft tab handling** — Already exists (Tab inserts 2 spaces). Add Shift+Tab for dedent.

3. **Auto-indent** — On Enter, match the leading whitespace of the current line. If the line ends with `:`, `-`, `*`, `1.`, add one level of indent.

4. **Bracket/quote auto-close** — Type `(`, get `()` with cursor between. Same for `[`, `{`, `` ` ``, `"`, `*`, `**`. Only when the next character is whitespace or end-of-line.

5. **Markdown shortcuts** — `Ctrl+B` wraps selection in `**`, `Ctrl+I` in `*`, `Ctrl+K` in `[]()`. These are the only three formatting shortcuts.

6. **Search & Replace** — `Ctrl+H` opens an inline search bar above the textarea. Regex support. Highlight matches in the textarea using a transparent overlay div with marked spans.

**What we deliberately skip:** Syntax highlighting. It's the hardest textarea enhancement to build correctly (you need a synchronized overlay), it adds visual noise for markdown (which is already readable by design), and it's the primary reason people reach for CodeMirror. The tradeoff isn't worth it.

### C. Layout: The Disappearing Chrome

```
┌──────────────────────────────────────────────────────────────┐
│ [≡]  document.md                              [⚙] [Export]  │  ← 48px. Minimal.
├─────────────────────────┬────────────────────────────────────┤
│                         │                                    │
│   (editor with gutter)  │   (iframe preview — full page)     │
│                         │                                    │
│                         │                                    │
│                         │                                    │
│                         │                                    │
│                         │                                    │
├─────────────────────────┴────────────────────────────────────┤
│ Ln 42, Col 15 · 1,247 words · A4 · Sans-Serif         [☀/🌙]│  ← 28px status bar
└──────────────────────────────────────────────────────────────┘
```

**Header (48px):**
- Left: Hamburger menu `[≡]` → slides open a side panel with document management (recent docs, new, import, export as .md)
- Center: Document title (editable inline, derived from filename or first `# Heading`)
- Right: Settings gear `[⚙]` → opens a dropdown panel (theme, font, page size, margins). Export button — always visible.

**Status Bar (28px):**
- Left: Cursor position, word count
- Center: Page format badge (A4, Letter, A3) — clickable to cycle
- Right: Theme toggle (single icon, cycles light → dark → system)

**The editor sub-toolbar is gone.** Upload, page break insert, copy, clear — all move:
- Upload → hamburger menu
- Page break → keyboard shortcut `Ctrl+Enter` (with toolbar button removed)
- Copy → `Ctrl+Shift+C` copies raw markdown (standard `Ctrl+C` copies selection as usual)
- Clear → hamburger menu "New Document" (with confirmation)

**Mobile layout:**
- Full-screen single pane with bottom tab bar: `[Editor] [Preview] [Export]`
- Tab bar is 44px, matches iOS/Android bottom navigation conventions
- No hamburger menu on mobile — long press on title → document options sheet
- Settings accessible via swipe-down on the preview pane header

### D. The Settings Panel

Instead of cramming controls into the header, a settings panel drops down from the gear icon. Grouped into two sections:

**Document Settings** (affect the output):
```
Page Size:    ◉ A4    ○ Letter    ○ A3
Font Family:  [Sans-Serif ▾]
Margins:      [Standard (2cm) ▾]    ← NEW: configurable margins
```

**Editor Settings** (affect the workspace):
```
Theme:        ◉ System    ○ Light    ○ Dark
Editor Font:  [14px ▾]               ← NEW: editor font size
Word Wrap:    [On ▾]                 ← NEW
Preview:      ◉ Side-by-Side  ○ Below  ○ Hidden
```

All settings persist in `localStorage`.

### E. Autosave & Document Persistence

**localStorage-based document store:**

```typescript
interface StoredDocument {
  id: string;              // nanoid
  title: string;           // derived from first # heading or filename
  content: string;         // raw markdown
  settings: DocumentSettings;
  lastModified: number;    // timestamp
  createdAt: number;
}
```

- Autosave on every change, debounced 1 second
- On load, restore the last active document
- "New Document" creates a fresh entry
- "Recent Documents" in hamburger menu lists last 20 documents by lastModified
- Documents are stored as individual keys: `mdpdf_doc_{id}`
- Total storage budget: 5MB (localStorage limit). Show a warning at 4MB.

**File System Access API (progressive enhancement):**
- If the browser supports `showOpenFilePicker` / `showSaveFilePicker`:
  - "Open" opens a system file dialog instead of the hidden input hack
  - "Save" writes back to the original file on disk (with permission)
  - Show a "saved to disk" indicator vs "saved locally"
- Falls back to the current FileReader approach in unsupported browsers

### F. Export Improvements

**Filename Intelligence:**
- Default PDF filename = document title (from first `# heading`) + `.pdf`
- If loaded from a file, replace `.md` → `.pdf`
- No more generic "document.pdf"

**Export Feedback:**
- Replace the current loading spinner with a progress toast:
  ```
  ┌─────────────────────────────┐
  │ ◐  Generating PDF...        │
  │     Rendering • Exporting   │
  └─────────────────────────────┘
  ```
- On success, the toast updates to "✓ Downloaded document.pdf" and fades after 3s
- On failure, toast persists with error message and a "Retry" button

**Queued Server Processing:**
- Add a simple request queue in `pdf.ts` to prevent race conditions:
  ```typescript
  const queue: Array<() => Promise<void>> = [];
  let processing = false;

  async function enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      queue.push(async () => {
        try { resolve(await fn()); }
        catch (e) { reject(e); }
      });
      processQueue();
    });
  }
  ```

### G. New Features (Earned, Not Bolted On)

These features exist because they fill gaps that real users hit:

**1. Table of Contents Generation**
- Toggle in settings: "Generate TOC"
- Server-side: parse headings from the HTML, inject a TOC block at the top of the PDF with page-anchored links
- Preview: show the TOC in real-time

**2. Custom CSS Injection**
- Settings panel gets a "Custom CSS" textarea
- Appended after the base print styles
- Stored per-document in the document settings
- Lets power users override fonts, colors, spacing without forking the codebase

**3. Header/Footer for PDF Pages**
- Settings: "Page Header" and "Page Footer" text inputs
- Support variables: `{title}`, `{page}`, `{pages}`, `{date}`
- Rendered via Puppeteer's `headerTemplate` / `footerTemplate` options (already supported by the API)
- Default: no header, footer shows `{page} / {pages}` centered

**4. Multi-file Awareness**
- Drop or open multiple `.md` files → they appear as tabs below the header
- Click a tab to switch documents
- Each tab has its own preview
- Export button gets a dropdown: "Export Current" or "Export All (merged)"

**5. Keyboard-First Workflow**
```
Ctrl+S          → Force save (shows "Saved ✓" flash)
Ctrl+Shift+E    → Export PDF
Ctrl+B          → Bold selection
Ctrl+I          → Italic selection
Ctrl+K          → Insert link
Ctrl+Enter      → Insert page break at cursor
Ctrl+\          → Toggle preview pane
Ctrl+Shift+\    → Toggle editor pane
Ctrl+,          → Open settings
Ctrl+P          → Focus preview (then arrow keys scroll)
Escape          → Close any open panel/dropdown
```

---

## Visual Design Tokens — "Ink & Paper"

The current theme is "generic SaaS dashboard". The new theme leans into the **printing/typesetting** metaphor:

### Light Theme: "Linen"
```css
--background: #f5f3ef;    /* warm paper, not clinical white */
--surface: #fdfcfa;       /* the writing surface — slightly warm */
--elevated: #eae7e1;      /* buttons, toolbars — parchment tone */
--border: #d8d3cb;        /* warm gray borders */
--foreground: #1a1a1a;    /* near-black ink */
--muted: #6b6560;         /* faded ink for secondary text */
--accent: #2563eb;        /* compositor's blue — the markup color */
--accent-hover: #3b82f6;
```

### Dark Theme: "Darkroom"
```css
--background: #121212;    /* true dark, not navy */
--surface: #1a1a1a;       /* slight lift for surfaces */
--elevated: #262626;      /* toolbar backgrounds */
--border: #333333;        /* subtle separation */
--foreground: #e5e5e5;    /* soft white, not blinding */
--muted: #737373;         /* dimmed for secondary */
--accent: #60a5fa;        /* lighter blue for dark bg contrast */
--accent-hover: #93c5fd;
```

### Typography
- **Editor font:** JetBrains Mono (already loaded) at 14px, line-height 1.7
- **UI font:** Inter (already loaded) at 13px for controls, 11px for status bar
- **Preview fonts:** Unchanged — they match the PDF output

### The Preview Pane Background
Currently the preview sits on the same `--background` as the rest of the app. In v2:
- **Light mode:** Preview pane background is `#e8e5df` (darker linen) with the paper surface being pure white with a subtle `box-shadow` — mimicking paper on a desk
- **Dark mode:** Preview background is `#0a0a0a` (near-black) with the paper being `#1a1a1a` with a soft glow shadow — mimicking a backlit proof

---

## Component Architecture

```
app/
├── layout.tsx                    # Root layout (unchanged structure)
├── globals.css                   # Theme tokens + base styles
├── page.tsx                      # Main orchestrator (simplified)
│
components/
├── Header.tsx                    # 48px top bar: menu, title, settings, export
├── StatusBar.tsx                 # 28px bottom bar: cursor, words, page, theme
├── Editor/
│   ├── EditorPane.tsx            # Editor container + gutter + textarea
│   ├── LineGutter.tsx            # Line numbers column
│   ├── SearchBar.tsx             # Ctrl+H search/replace overlay
│   └── useEditorEnhancements.ts  # Hook: auto-indent, bracket close, shortcuts
├── Preview/
│   ├── PreviewPane.tsx           # iframe-based preview container
│   └── PageBreakOverlay.tsx      # Page break guides (overlay on the iframe)
├── Panels/
│   ├── SettingsPanel.tsx         # Dropdown settings panel
│   ├── DocumentsPanel.tsx        # Side panel for recent documents
│   └── ExportToast.tsx           # Export progress/success/error toast
├── MobileLayout.tsx              # Mobile-specific single-pane + bottom tabs
│
lib/
├── api.ts                        # API calls (preview + convert)
├── store.ts                      # localStorage document persistence
├── keyboard.ts                   # Keyboard shortcut registry
└── hooks/
    ├── useAutosave.ts            # Debounced autosave to localStorage
    ├── useDocuments.ts           # Document CRUD operations
    └── usePreview.ts             # Debounced preview fetch + caching
│
server/
├── src/
│   ├── index.ts                  # Express app (add /api/preview route)
│   ├── routes/
│   │   ├── convert.ts            # POST /api/convert (existing, add queue)
│   │   └── preview.ts            # POST /api/preview (new — HTML only)
│   └── services/
│       ├── markdown.ts           # markdownToHtml (shared by both routes)
│       ├── pdf.ts                # htmlToPdf (add request queue)
│       └── queue.ts              # Generic async request queue
```

---

## Migration Path

This is not a rewrite. It's a renovation. The steps, in order:

| Phase | What Changes | What Stays |
|-------|-------------|-----------|
| **1. Unified Preview** | Add `/api/preview`, replace `ReactMarkdown` with iframe | Server rendering, export flow |
| **2. Autosave** | Add localStorage persistence, restore on load | Everything else |
| **3. Layout Surgery** | New header/statusbar, kill editor toolbar, settings panel | Editor textarea, preview iframe |
| **4. Editor Polish** | Line gutter, auto-indent, shortcuts, search | Textarea as base input |
| **5. Visual Theme** | New color tokens, typography adjustments | Component structure |
| **6. New Features** | TOC, custom CSS, headers/footers, multi-file | All existing features |

Each phase ships independently. Each phase makes the app better even if you stop there.

---

## Anti-Goals

Things this design explicitly does NOT do:

- **No collaborative editing.** This is a single-user tool. Adding multiplayer would triple the complexity for a feature most markdown-to-PDF users don't need.
- **No cloud sync.** Documents stay in the browser. If you want sync, use a file on a synced folder and the File System Access API.
- **No plugin system.** Custom CSS covers 90% of what plugins would do. The rest isn't worth the architecture.
- **No WYSIWYG editing.** The split-pane model is the product. If you want WYSIWYG, use Google Docs.
- **No AI features.** No "AI autocomplete", no "AI formatting". The user writes markdown. The tool typesets it. That's the contract.

---

## Success Criteria

The redesign succeeds if:

1. A user can open the app, paste markdown, and export a PDF in under 5 seconds — including the first visit
2. The preview matches the PDF output exactly, every time
3. No work is ever lost to a page reload
4. The UI has less than 80px of non-content chrome on desktop
5. All primary actions are reachable by keyboard
6. The app loads in under 1.5 seconds on a 4G connection
7. Someone looking at a screenshot can tell this is a typesetting tool, not a generic SaaS dashboard
