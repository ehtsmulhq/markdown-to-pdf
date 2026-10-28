# 📄 The Typesetter — Professional Markdown Studio (v2)

An industry-grade **Markdown-to-PDF Studio** designed around print-accurate proofs and distraction-free composition. Built with **Next.js 15 (React 19)**, **TailwindCSS**, and **Express + Puppeteer**.

---

## ✨ Architectural Principles & Features

- ⚡ **True-to-Print Proofing Pipeline**: Live preview iframe renders using the *exact same* HTML & CSS engine as the headless Chromium PDF compiler.
- 🎨 **Ink & Paper Design Aesthetic**: Distinctive Warm Linen (light) and Darkroom (dark) palettes designed for readability.
- 💾 **Continuous Local Autosave & Library**: Never lose a keystroke with localStorage persistence, instant document switching, and multi-manuscript management.
- 📐 **Visual & Manual Page Breaks**: Visual page boundary guidelines with support for manual `<!-- pagebreak -->` tags.
- 🛡️ **Split Protection**: Automatic `break-inside: avoid` rules for tables, code blocks, blockquotes, and diagrams.
- 📑 **Dynamic Table of Contents (TOC)**: Automatically extracts headings and generates an anchored table of contents directory.
- 🏷️ **Custom Running Headers & Footers**: Configurable running headers and page number counters (`{page} / {pages}`).
- ⌨️ **Keyboard-First Workflow**: Full keyboard ergonomics for composition, navigation, and formatting.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + S` | Autosave manuscript to local storage |
| `Ctrl + H` | Toggle inline Search & Replace bar |
| `Ctrl + ,` | Open Typography & Composition Settings |
| `Ctrl + B` | Wrap selection in `**bold**` |
| `Ctrl + I` | Wrap selection in `*italic*` |
| `Ctrl + K` | Wrap selection in `[link](url)` |
| `Ctrl + Enter` | Insert manual `<!-- pagebreak -->` |
| `Tab` | Indent 2 spaces (auto-continuation on lists) |
| `Shift + Tab` | Dedent line |
| `Escape` | Dismiss open menus and panels |

---

## 🛠️ Tech Stack

- **Client**: Next.js 15, React 19, TailwindCSS, TypeScript.
- **Server**: Express 5, Puppeteer (Headless Chromium), Marked (GFM HTML compiler).
- **Tooling**: TypeScript, Concurrently, Docker.

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js `v20.x` or `v22.x`
- npm `v9+`

### Installation & Execution

```bash
# 1. Clone the repository
git clone https://github.com/ehtsmulhq/markdown-to-pdf.git
cd markdown-to-pdf

# 2. Install workspace dependencies
npm install

# 3. Start development servers concurrently (Client on :3000, Server on :4000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Production Deployment with Docker

### Using Docker Compose (Recommended)

```bash
# Build and run containers in detached mode
docker compose up -d --build
```

- **Client App**: `http://localhost:8089` (or host configured port)
- **Backend API**: `http://localhost:4000`

---

## 📜 License

MIT License. Designed with ❤️ for developers and technical documentation writers.
