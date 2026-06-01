#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

PORT="${1:-8000}"
ENTRYPOINT="${2:-ARCHAI_v10_8.html}"

echo "Serving ARCHAI prototype at http://localhost:${PORT}/"
echo "Open http://localhost:${PORT}/${ENTRYPOINT}"
echo "Press Ctrl+C to stop."

python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$ROOT"
