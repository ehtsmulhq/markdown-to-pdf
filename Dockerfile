# Multi-stage production build for Node.js + Express + Next.js + Puppeteer
FROM node:20-slim

# Install Chromium and required font/rendering libraries for Puppeteer PDF export
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Point Puppeteer to system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy dependency declarations
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build Arguments & Environment Variables for Next.js build step
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build production assets
RUN npm run build

# Expose ports
EXPOSE 3000 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["npm", "start"]
