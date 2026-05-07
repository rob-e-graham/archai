#!/bin/bash
# ══════════════════════════════════════════════════════════════════
# ARCHAI — Start & Verify Stack
# Run this from the ARCHAI APP directory to bring everything up
# and confirm all services are healthy.
# ══════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  ARCHAI — Sovereign Heritage AI Infrastructure${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""

TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "not available")
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "unknown")

echo -e "  LAN IP:       ${YELLOW}${LAN_IP}${NC}"
echo -e "  Tailscale IP: ${YELLOW}${TAILSCALE_IP}${NC}"
echo ""

# ── 1. Docker (Qdrant, Directus, Redis, MySQL) ───────────────────
echo -e "${CYAN}[1/5]${NC} Docker services..."
if docker compose ps --format '{{.State}}' 2>/dev/null | grep -q "running"; then
  echo -e "  ${GREEN}✓${NC} Docker containers already running"
else
  echo -e "  ${YELLOW}→${NC} Starting Docker containers..."
  docker compose up -d 2>&1 | tail -3
  sleep 3
fi

# ── 2. Ollama ─────────────────────────────────────────────────────
echo -e "${CYAN}[2/5]${NC} Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} Ollama already running"
else
  echo -e "  ${YELLOW}→${NC} Starting Ollama (bound to all interfaces)..."
  # Kill GUI app if running
  pkill -f "Ollama" 2>/dev/null || true
  sleep 1
  OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" \
    /Applications/Ollama.app/Contents/Resources/ollama serve > /dev/null 2>&1 &
  sleep 3
fi

# ── 3. Backend ────────────────────────────────────────────────────
echo -e "${CYAN}[3/5]${NC} Backend API..."
if curl -s http://localhost:8787/api/health > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} Backend already running on :8787"
else
  echo -e "  ${YELLOW}→${NC} Starting backend..."
  cd backend-archai && npm run dev > /dev/null 2>&1 &
  cd ..
  sleep 3
fi

# ── 4. Frontend server ────────────────────────────────────────────
echo -e "${CYAN}[4/5]${NC} Frontend (static server)..."
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} Frontend already serving on :8000"
else
  echo -e "  ${YELLOW}→${NC} Starting Python HTTP server on :8000..."
  python3 -m http.server 8000 > /dev/null 2>&1 &
  sleep 2
fi

# ── 5. Health checks ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}[5/5]${NC} Verifying all services..."
echo ""

PASS=0
FAIL=0

check() {
  local name="$1" url="$2"
  if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} ${name}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} ${name} — ${url}"
    FAIL=$((FAIL + 1))
  fi
}

check "Qdrant"           "http://localhost:6333/collections"
check "Ollama"           "http://localhost:11434/api/tags"
check "Backend API"      "http://localhost:8787/api/health"
check "Frontend"         "http://localhost:8000/ARCHAI_v10_8.html"
check "Comments API"     "http://localhost:8787/api/comments?objectId=test"
check "Proxy (Qdrant)"   "http://localhost:8787/api/proxy/qdrant/health"
check "Proxy (Ollama)"   "http://localhost:8787/api/proxy/ollama/health"

# Check Ollama models
MODELS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  print(', '.join(m['name'] for m in d.get('models',[])))
except: print('none detected')
" 2>/dev/null || echo "check failed")

echo ""
echo -e "  Models loaded: ${YELLOW}${MODELS}${NC}"

# Check Qdrant collections
COLLECTIONS=$(curl -s http://localhost:6333/collections 2>/dev/null | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  cols=d.get('result',{}).get('collections',[])
  print(', '.join(c['name'] for c in cols))
except: print('none')
" 2>/dev/null || echo "check failed")

echo -e "  Qdrant collections: ${YELLOW}${COLLECTIONS}${NC}"

# SQLite check
DB_PATH="backend-archai/data/archai.db"
if [ -f "$DB_PATH" ]; then
  COMMENT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM comments;" 2>/dev/null || echo "?")
  echo -e "  Comments in DB: ${YELLOW}${COMMENT_COUNT}${NC}"
else
  echo -e "  Comments DB: ${YELLOW}will be created on first request${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
if [ $FAIL -eq 0 ]; then
  echo -e "  ${GREEN}All ${PASS} services online ✓${NC}"
else
  echo -e "  ${GREEN}${PASS} online${NC}, ${RED}${FAIL} failed${NC}"
fi
echo ""
echo -e "  ${CYAN}Local:${NC}     http://localhost:8000/ARCHAI_v10_8.html"
echo -e "  ${CYAN}Tailscale:${NC} http://${TAILSCALE_IP}:8000/ARCHAI_v10_8.html"
echo -e "  ${CYAN}NFC Pages:${NC} http://${TAILSCALE_IP}:8000/nfc-pages/v/index.html"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
