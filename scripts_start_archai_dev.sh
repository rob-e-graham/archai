#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "ARCHAI frontend: http://localhost:8000/ARCHAI_v6.html"
echo "ARCHAI backend:  http://localhost:8787"
echo

echo "Start frontend in terminal A:"
echo "  ./serve_local_archai.sh"
echo

echo "Start backend in terminal B:"
echo "  cd backend-archai && cp .env.example .env && npm install && npm run dev"
