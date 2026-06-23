#!/usr/bin/env bash
set -euo pipefail

BROWSERTRIX_IMAGE="webrecorder/browsertrix-crawler:1.12.4"
BACKEND_URL="${ARCHAI_BACKEND_URL:-http://127.0.0.1:8787}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CAPTURE_ROOT="${ARCHAI_CAPTURE_DIR:-$BACKEND_DIR/data/runtime/captures}"
MEDIA_CACHE_DIR="${MEDIA_CACHE_DIR:-$BACKEND_DIR/data/runtime/media-cache}"

URL=""
MEDIA_ID=""
OBJECT_ID=""
RIGHTS_HOLDER=""
RIGHTS_BASIS="institution_approved"
LICENCE=""
CREDIT_LINE=""
CAPTURED_BY="${ARCHAI_CAPTURED_BY:-ARCHAI collections workflow}"
REVIEWED_BY="${ARCHAI_REVIEWED_BY:-ARCHAI curator workflow}"
RIGHTS_CLEARED=false
SKIP_REGISTER=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url) URL="${2:-}"; shift 2 ;;
    --media-id) MEDIA_ID="${2:-}"; shift 2 ;;
    --object-id) OBJECT_ID="${2:-}"; shift 2 ;;
    --rights-holder) RIGHTS_HOLDER="${2:-}"; shift 2 ;;
    --rights-basis) RIGHTS_BASIS="${2:-}"; shift 2 ;;
    --licence) LICENCE="${2:-}"; shift 2 ;;
    --credit-line) CREDIT_LINE="${2:-}"; shift 2 ;;
    --captured-by) CAPTURED_BY="${2:-}"; shift 2 ;;
    --reviewed-by) REVIEWED_BY="${2:-}"; shift 2 ;;
    --rights-cleared) RIGHTS_CLEARED=true; shift ;;
    --skip-register) SKIP_REGISTER=true; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$URL" || -z "$MEDIA_ID" || -z "$OBJECT_ID" || -z "$RIGHTS_HOLDER" ]]; then
  echo "Usage: $0 --url URL --media-id ID --object-id ID --rights-holder NAME --rights-cleared [options]" >&2
  exit 2
fi
if [[ "$RIGHTS_CLEARED" != true ]]; then
  echo "Refusing capture: pass --rights-cleared only after permission or an applicable open licence is documented." >&2
  exit 3
fi
if [[ ! "$MEDIA_ID" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "media-id may contain only letters, numbers, dot, underscore, and hyphen." >&2
  exit 2
fi
case "$RIGHTS_BASIS" in
  institution_approved|artist_permission|open_licence|public_domain|contract) ;;
  *) echo "Unsupported rights basis: $RIGHTS_BASIS" >&2; exit 2 ;;
esac

mkdir -p "$CAPTURE_ROOT" "$MEDIA_CACHE_DIR"
rm -rf "$CAPTURE_ROOT/collections/$MEDIA_ID"

echo "Capturing $URL with $BROWSERTRIX_IMAGE"
docker run --rm \
  -v "$CAPTURE_ROOT:/crawls" \
  "$BROWSERTRIX_IMAGE" crawl \
  --url "$URL" \
  --limit 1 \
  --collection "$MEDIA_ID" \
  --text to-warc \
  --screenshot view \
  --generateWACZ

WACZ_SOURCE="$(find "$CAPTURE_ROOT/collections/$MEDIA_ID" -maxdepth 1 -type f -name '*.wacz' -print -quit)"
if [[ -z "$WACZ_SOURCE" ]]; then
  echo "Capture completed without producing a WACZ file." >&2
  exit 4
fi

WACZ_NAME="${MEDIA_ID}.wacz"
WACZ_TARGET="$MEDIA_CACHE_DIR/$WACZ_NAME"
cp "$WACZ_SOURCE" "$WACZ_TARGET"
SHA256="$(shasum -a 256 "$WACZ_TARGET" | awk '{print $1}')"
BYTE_SIZE="$(stat -f '%z' "$WACZ_TARGET")"
CAPTURED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

MANIFEST_PATH="$MEDIA_CACHE_DIR/${MEDIA_ID}.manifest.json"
URL="$URL" MEDIA_ID="$MEDIA_ID" OBJECT_ID="$OBJECT_ID" RIGHTS_HOLDER="$RIGHTS_HOLDER" \
RIGHTS_BASIS="$RIGHTS_BASIS" LICENCE="$LICENCE" CREDIT_LINE="$CREDIT_LINE" \
CAPTURED_BY="$CAPTURED_BY" REVIEWED_BY="$REVIEWED_BY" CAPTURED_AT="$CAPTURED_AT" \
SHA256="$SHA256" BYTE_SIZE="$BYTE_SIZE" WACZ_NAME="$WACZ_NAME" MANIFEST_PATH="$MANIFEST_PATH" \
node --input-type=module <<'NODE'
import fs from 'node:fs';

const manifest = {
  mediaId: process.env.MEDIA_ID,
  objectId: process.env.OBJECT_ID,
  kind: 'web_archive',
  manifestationLabel: 'Archived interactive capture',
  archiveUrl: `/api/media/published/${process.env.MEDIA_ID}/archive`,
  entryUrl: process.env.URL,
  storageFilename: process.env.WACZ_NAME,
  mimeType: 'application/wacz+zip',
  byteSize: Number(process.env.BYTE_SIZE),
  rightsLabel: process.env.CREDIT_LINE || `Captured with permission of ${process.env.RIGHTS_HOLDER}`,
  rights: {
    status: 'cleared',
    basis: process.env.RIGHTS_BASIS,
    licence: process.env.LICENCE || null,
    rightsHolder: process.env.RIGHTS_HOLDER,
    creditLine: process.env.CREDIT_LINE || `Captured with permission of ${process.env.RIGHTS_HOLDER}`,
    sourceUrl: process.env.URL,
    reviewedBy: process.env.REVIEWED_BY,
    reviewedAt: process.env.CAPTURED_AT,
    notes: 'Rights declaration supplied by the ARCHAI capture operator.',
  },
  capture: {
    capturedAt: process.env.CAPTURED_AT,
    capturedBy: process.env.CAPTURED_BY,
    captureTool: 'Browsertrix Crawler',
    captureToolVersion: '1.12.4',
    originalUrl: process.env.URL,
    entryUrl: process.env.URL,
    sha256: process.env.SHA256,
    renderingNotes: 'Automated one-page pilot capture; complete manual replay QA before institutional publication.',
  },
  publishedStatus: 'approved',
};

fs.writeFileSync(process.env.MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
NODE

if [[ "$SKIP_REGISTER" != true ]]; then
  HTTP_CODE="$(curl -sS -o "$CAPTURE_ROOT/${MEDIA_ID}-register-response.json" -w '%{http_code}' \
    -H 'content-type: application/json' -H 'x-archai-role: curator' \
    --data-binary "@$MANIFEST_PATH" "$BACKEND_URL/api/media/published")"
  if [[ "$HTTP_CODE" != 201 && "$HTTP_CODE" != 409 ]]; then
    cat "$CAPTURE_ROOT/${MEDIA_ID}-register-response.json" >&2
    echo "Manifest registration failed (HTTP $HTTP_CODE)." >&2
    exit 5
  fi

  if [[ "$HTTP_CODE" == 201 ]]; then
    curl -fsS -H 'content-type: application/json' -H 'x-archai-role: curator' \
      -d "{\"objectId\":\"$OBJECT_ID\"}" \
      "$BACKEND_URL/api/media/published/$MEDIA_ID/publish" >/dev/null
  fi
fi

echo "WACZ: $WACZ_TARGET"
echo "SHA-256: $SHA256"
echo "Manifest: $MANIFEST_PATH"
echo "Replay: $BACKEND_URL/api/media/published/$MEDIA_ID/replay"
