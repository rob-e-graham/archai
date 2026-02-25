#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"

PORT="${1:-8000}"

echo "Serving ARCHAI prototype at http://localhost:${PORT}/"
echo "Open http://localhost:${PORT}/ARCHAI_v6.html"
echo "Press Ctrl+C to stop."

python3 -m http.server "$PORT"
