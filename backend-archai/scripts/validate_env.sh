#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
FILE="${1:-.env}"

if [ ! -f "$FILE" ]; then
  echo "Missing $FILE"
  exit 1
fi

echo "Checking key config in $FILE"
for key in PORT QDRANT_URL OLLAMA_BASE_URL COLLECTIVEACCESS_BASE_URL RESOURCESPACE_BASE_URL; do
  if grep -q "^${key}=" "$FILE"; then
    echo "  ok: $key"
  else
    echo "  missing: $key"
  fi
done
