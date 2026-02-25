#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  echo "node_modules not found. Run: npm install"
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example (edit values as needed)"
fi

echo "Starting ARCHAI backend on http://localhost:8787"
npm run dev
