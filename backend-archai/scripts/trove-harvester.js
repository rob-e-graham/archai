#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Trove / National Library of Australia Harvester
// Australian cultural-heritage images aggregated by Trove (v3 API).
//
// REQUIRES: free API key — https://trove.nla.gov.au/about/create-something/using-api
//   Set: TROVE_API_KEY=your-key   (or store via KeyTec: famtec add trove)
//
// Usage:
//   TROVE_API_KEY=xxx node trove-harvester.js            # dry-run by default
//   TROVE_API_KEY=xxx node trove-harvester.js --apply --limit 200
//
// API: https://trove.nla.gov.au/about/create-something/using-api/v3
// Rights: Trove aggregates many partners; rights vary and are often free-text.
//         Records are HELD unless a rights string clearly indicates open reuse.
// ══════════════════════════════════════════════════════════════════

import { execSync } from 'child_process';

const TROVE_API = 'https://api.trove.nla.gov.au/v3/result';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const COLLECTION = 'archai_trove';
const EMBED_MODEL = 'nomic-embed-text';
const ID_OFFSET = 3200000;
const EXCLUDE_PATTERNS = [/national communication museum/i];

function resolveApiKey() {
  if (process.env.TROVE_API_KEY) return process.env.TROVE_API_KEY;
  try {
    const k = execSync('security find-generic-password -s famtec -a TROVE_API_KEY -w', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (k) { console.log('  ✓ Trove key loaded from Keychain (KeyTec)'); return k; }
  } catch (_) {}
  return '';
}
const API_KEY = resolveApiKey();
if (!API_KEY) {
  console.error('\n  ✗ TROVE_API_KEY not set');
  console.error('  → Request a free key: https://trove.nla.gov.au/about/create-something/using-api');
  console.error('  → Then: famtec add trove   (or)  TROVE_API_KEY=xxx node trove-harvester.js\n');
  process.exit(1);
}

const args = process.argv.slice(2);
const getArg = (name, fallback) => { const i = args.indexOf('--' + name); return i !== -1 && args[i + 1] ? args[i + 1] : fallback; };
const LIMIT = parseInt(getArg('limit', '150'), 10);
const APPLY = args.includes('--apply');
const DRY_RUN = !APPLY;
const SINGLE_QUERY = getArg('query', '');

const OPEN_RIGHTS = ['no known copyright', 'public domain', 'out of copyright', 'cc0', 'creative commons', 'cc by', 'nkc', 'free'];
const SEARCH_QUERIES = SINGLE_QUERY ? [SINGLE_QUERY] : [
  'photograph', 'painting', 'poster', 'map', 'portrait', 'building architecture',
  'ship maritime', 'mining industry', 'landscape', 'costume dress', 'railway',
  'aboriginal art',
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function fetchJSON(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'X-API-KEY': API_KEY, 'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)', 'Accept': 'application/json' } });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { if (i === retries - 1) throw e; await sleep(2000 * (i + 1)); }
  }
}

const asArr = (v) => Array.isArray(v) ? v : (v == null ? [] : [v]);
function normaliseRights(rightsArr) {
  const v = asArr(rightsArr).join(' ').toLowerCase();
  if (!v) return { open: false, status: 'unknown' };
  const open = OPEN_RIGHTS.some((r) => v.includes(r));
  return { open, status: open ? 'open' : 'check-source' };
}
function pickThumb(identifiers) {
  const ids = asArr(identifiers);
  const thumb = ids.find((i) => i && i.linktype === 'thumbnail' && i.value);
  return thumb ? thumb.value : '';
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: EMBED_MODEL, prompt: String(text).substring(0, 2000) }) });
  return (await res.json()).embedding;
}
async function ensureCollection() {
  try { const r = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`); if (r.ok) { console.log(`  ✓ Collection '${COLLECTION}' exists`); return; } } catch (_) {}
  const testVec = await embed('test');
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vectors: { size: testVec.length, distance: 'Cosine' } }) });
  console.log(`  ✓ Created collection '${COLLECTION}' (dim: ${testVec.length})`);
}
async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ points: [{ id, vector, payload }] }) });
}

function mapWork(w) {
  const thumb = pickThumb(w.identifier);
  if (!thumb) return null;
  const title = (Array.isArray(w.title) ? w.title[0] : w.title) || 'Untitled';
  const rights = normaliseRights(w.rights);
  const contributor = asArr(w.contributor).join(', ');
  const date = w.issued ? String(w.issued) : '';
  const type = asArr(w.type).join(', ');
  const embedding_text = [title, contributor ? `by ${contributor}` : '', date, type, 'Trove National Library of Australia'].filter(Boolean).join('. ');
  return {
    ok: Boolean(title && thumb),
    payload: {
      canonical_id: `trove:${w.id}`,
      source: 'trove',
      source_institution: 'Trove · National Library of Australia',
      source_record_id: String(w.id || ''),
      title: String(title),
      object_type: type || 'Image',
      category: '',
      date_range: date,
      artist: contributor,
      description: '',
      licence: asArr(w.rights).join(' · ') || 'See Trove record',
      legal_status_normalised: rights.status,
      media_thumbnail: thumb,
      media_medium: thumb,
      media_large: thumb,
      media_available: true,
      media_public_display_allowed: rights.open,
      poster_download_allowed: false,
      source_url: w.troveUrl || `https://trove.nla.gov.au/work/${w.id}`,
      harvested_at: new Date().toISOString(),
      harvester: 'trove-harvester.js',
      embedding_text,
    },
  };
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Trove / NLA                   ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes; pass --apply to write]\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }
  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }
  if (!DRY_RUN) await ensureCollection();

  const seen = new Set();
  let success = 0, skippedNoOpen = 0, errors = 0;

  for (const q of SEARCH_QUERIES) {
    if (success >= LIMIT) break;
    try {
      const url = `${TROVE_API}?q=${encodeURIComponent(q)}&category=image&encoding=json&n=100&include=links&s=*`;
      const data = await fetchJSON(url);
      const works = data?.category?.[0]?.records?.work || [];
      let added = 0;
      for (const w of works) {
        if (success >= LIMIT) break;
        if (seen.has(w.id)) continue;
        seen.add(w.id);
        const rec = mapWork(w);
        if (!rec || !rec.ok) continue;
        if (EXCLUDE_PATTERNS.some((re) => re.test(`${rec.payload.title} ${rec.payload.description}`))) { skippedNoOpen++; continue; }
        if (!rec.payload.media_public_display_allowed) { skippedNoOpen++; continue; }
        if (DRY_RUN) { console.log(`  [dry] ${rec.payload.title.substring(0, 55)} — ${rec.payload.licence.substring(0, 30)}`); success++; added++; continue; }
        try { const vector = await embed(rec.payload.embedding_text); if (!vector?.length) { errors++; continue; } await upsertPoint(ID_OFFSET + success, vector, rec.payload); success++; added++; await sleep(120); }
        catch (_) { errors++; await sleep(300); }
      }
      console.log(`  → "${q}" — ${works.length} works, ${added} admitted (total: ${success})`);
      await sleep(500);
    } catch (e) { console.warn(`  ⚠ "${q}" — ${e.message}`); }
  }

  console.log(`\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Trove harvest ${DRY_RUN ? '(dry-run) ' : ''}complete`);
  console.log(`  → ${success} open-rights image records ${DRY_RUN ? 'would be' : ''} embedded into '${COLLECTION}'`);
  console.log(`  → ${skippedNoOpen} skipped (rights not clearly open)`);
  console.log(`  → ${errors} errors\n`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
