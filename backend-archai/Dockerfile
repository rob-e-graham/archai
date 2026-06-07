FROM node:22-slim

WORKDIR /app

# Install build deps for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install deps first (cache layer)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy app
COPY src/ src/
RUN mkdir -p data/runtime/media-cache

EXPOSE 8787

CMD ["node", "src/server.js"]
