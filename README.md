# 📄 MD to PDF — Professional Markdown Studio

An industry-grade **Markdown-to-PDF Studio** built with **Next.js 15 (React 19)**, **TailwindCSS**, and **Express + Puppeteer**. Features live 96 DPI paper preview, visual page break guides, custom font family selections, and high-fidelity PDF export.

---

## ✨ Key Features

- ⚡ **Real-Time Calibrated Preview**: Live GFM markdown rendering with 96 DPI pixel-for-pixel page break preview matching Puppeteer PDF output.
- 🎨 **Industry-Grade Theme Engine**: 3-way theme control (**Light ☀️**, **Dark 🌙**, and **System OS 💻** sync) with CSS design variable tokens.
- ✂ **Visual & Manual Page Breaks**: Visual page boundary guidelines + support for `<!-- pagebreak -->` manual page break tags.
- 🛡️ **Diagram & Table Protection**: Automatic `break-inside: avoid` rules for tables, code blocks, blockquotes, and diagrams to prevent awkward mid-element page cuts.
- 🔤 **Dynamic Font Family Selection**: Choose between **Sans-Serif**, **Serif**, **Monospace**, **Garamond**, and **Modern Sans** for live preview and exported PDFs.
- 📊 **Modern Table Styling**: Beautiful rounded tables with uppercase headers and zebra striping.
- 📁 **File Import & Drag & Drop**: Sub-toolbar upload button + direct `.md` file drag-and-drop onto the editor canvas.

---

## 🛠️ Tech Stack

- **Client**: Next.js 15, React 19, TailwindCSS, React-Markdown, Remark-GFM, Lucide / Heroicons.
- **Server**: Express 5, Puppeteer (Headless Chromium), Marked (GFM HTML compiler).
- **Tooling**: TypeScript, Concurrently, Docker.

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js `v18.x` or `v20.x`
- npm `v9+`

### Installation & Execution

```bash
# 1. Clone the repository
git clone http://192.168.0.127:3000/ehtsmulhq/MarkDown-to-PDF.git
cd MarkDown-to-PDF

# 2. Install workspace dependencies
npm install

# 3. Start development servers concurrently (Client on :3000, Server on :4000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Production Deployment with Docker

The fastest and most reliable way to deploy **MD to PDF** is using Docker.

### Using Docker Compose (Recommended)

```bash
# Build and run containers in detached mode
docker-compose up -d --build
```

- **Client App**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`

### Using Docker CLI

```bash
# Build the Docker image
docker build -t md-to-pdf:latest .

# Run the container
docker run -d -p 3000:3000 -p 4000:4000 --name md-to-pdf-app md-to-pdf:latest
```

---

## 💻 Manual Production Build & PM2 Deployment

```bash
# 1. Build client and server
npm run build

# 2. Start production servers
npm run start
```

Or using **PM2** on a Linux server:

```bash
# Start server API
pm2 start server/dist/index.js --name "md-pdf-api"

# Start Next.js client
pm2 start "npm --prefix client run start" --name "md-pdf-client"
```

---

## ⚙️ Environment Variables

### Client (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Server (`server/.env`)
```env
PORT=4000
# PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

---

## 📜 License

MIT License. Designed with ❤️ for developers and technical documentation writers.
