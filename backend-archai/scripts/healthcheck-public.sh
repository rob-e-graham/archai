#!/usr/bin/env bash
set -euo pipefail

check() {
  local label="$1"
  local url="$2"
  printf "%-28s" "$label"
  if curl -fsS -m 12 "$url" >/dev/null; then
    printf "OK  %s\n" "$url"
  else
    printf "FAIL  %s\n" "$url"
    return 1
  fi
}

check "Local backend" "http://127.0.0.1:8787/api/health"
check "Public backend tunnel" "https://archai-api.fineartmedia.tech/api/health"
check "AUX manifest" "https://archai-api.fineartmedia.tech/api/aux-manifest"
check "Public ARCHAI page" "https://fineartmedia.tech/archai"
check "Public AUX page" "https://fineartmedia.tech/aux"
check "Dark Plates" "https://darkplates.art"
