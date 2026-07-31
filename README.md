# MD to PDF

A minimal markdown-to-PDF converter with a Next.js frontend and Express API backend.

## Features

- Split-view editor with live markdown preview
- Upload `.md` files or paste markdown directly
- Export styled PDF via Puppeteer

## Setup

1. Install dependencies (from the project root):

   ```bash
   npm install
   ```

2. Copy environment examples:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.local.example client/.env.local
   ```

3. Start both the client and server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

> **Note:** The first PDF export downloads Chromium via Puppeteer (~150MB).

## Project Structure

| Package  | Description        | Port |
|----------|--------------------|------|
| `client` | Next.js UI         | 3000 |
| `server` | Express PDF API    | 4000 |

## API

`POST /api/convert`

```json
{ "markdown": "# Hello\n\nWorld" }
```

Returns `application/pdf`.
