#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Digital Public Library of America (DPLA) Harvester
// Aggregated US cultural-heritage items with thumbnails.
//
// REQUIRES: free API key — https://pro.dp.la/developers/policies (request by email)
//   Set: DPLA_API_KEY=your-key   (or store via KeyTec: famtec add dpla)
//
// Usage:
//   DPLA_API_KEY=xxx node dpla-harvester.js            # dry-run by default
//   DPLA_API_KEY=xxx node dpla-harvester.js --apply --limit 200
//
// API: https://pro.dp.la/developers/api-codex
// Rights: DPLA aggregates many providers; rights vary. Only records whose
//         sourceResource.rights matches the open allow-list are public-display.
// ══════════════════════════════════════════════════════════════════

import { execSync } from 'child_process';

const DPLA_API = 'https://api.dp.la/v2/items';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const COLLECTION = 'archai_dpla';
const EMBED_MODEL = 'nomic-embed-text';
const ID_OFFSET = 3300000;
const EXCLUDE_PATTERNS = [/national communication museum/i];

function resolveApiKey() {
  if (process.env.DPLA_API_KEY) return process.env.DPLA_API_KEY;
  try {
    const k = execSync('security find-generic-password -s famtec -a DPLA_API_KEY -w', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (k) { console.log('  ✓ DPLA key loaded from Keychain (KeyTec)'); return k; }
  } catch (_) {}
  return '';
}
const API_KEY = resolveApiKey();
if (!API_KEY) {
  console.error('\n  ✗ DPLA_API_KEY not set');
  console.error('  → Request a free key: https://pro.dp.la/developers/policies');
  console.error('  → Then: famtec add dpla   (or)  DPLA_API_KEY=xxx node dpla-harvester.js\n');
  process.exit(1);
}

const args = process.argv.slice(2);
const getArg = (name, fallback) => { const i = args.indexOf('--' + name); return i !== -1 && args[i + 1] ? args[i + 1] : fallback; };
const LIMIT = parseInt(getArg('limit', '150'), 10);
const APPLY = args.includes('--apply');
const DRY_RUN = !APPLY;
const SINGLE_QUERY = getArg('query', '');

const OPEN_RIGHTS = ['publicdomain', 'public domain', 'no known copyright', 'cc0', 'creativecommons.org/publicdomain', 'creativecommons.org/licenses/by', 'nkc', 'no copyright'];
const SEARCH_QUERIES = SINGLE_QUERY ? [SINGLE_QUERY] : [
  'painting', 'photograph portrait', 'poster', 'map', 'sculpture', 'textile',
  'ceramic', 'illustration', 'print engraving', 'decorative arts', 'costume',
  'natural history',
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function fetchJSON(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)', 'Accept': 'application/json' } });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { if (i === retries - 1) throw e; await sleep(2000 * (i + 1)); }
  }
}
const first = (v) => Array.isArray(v) ? (v[0] || '') : (v || '');

function normaliseRights(raw) {
  const v = String(Array.isArray(raw) ? raw.join(' ') : (raw || '')).toLowerCase();
  if (!v) return { open: false, status: 'unknown' };
  const open = OPEN_RIGHTS.some((r) => v.includes(r));
  return { open, status: open ? 'open' : 'check-source' };
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

function mapDoc(doc) {
  const sr = doc.sourceResource || {};
  const image = first(doc.object);
  if (!image) return null;
  const title = first(sr.title) || 'Untitled';
  const rights = normaliseRights(sr.rights || doc.rights);
  const description = first(sr.description);
  const creator = first(sr.creator);
  const date = sr.date ? (sr.date.displayDate || first(sr.date)) : '';
  const provider = (doc.dataProvider && first(doc.dataProvider)) || (doc.provider && doc.provider.name) || 'DPLA partner';
  const subject = Array.isArray(sr.subject) ? sr.subject.map((s) => s && (s.name || s)).filter(Boolean).slice(0, 4).join(', ') : '';
  const embedding_text = [title, creator ? `by ${creator}` : '', date, description, subject, provider].filter(Boolean).join('. ');
  return {
    ok: Boolean(title && image),
    payload: {
      canonical_id: `dpla:${doc.id}`,
      source: 'dpla',
      source_institution: provider,
      aggregator: 'Digital Public Library of America',
      source_record_id: String(doc.id || ''),
      title: String(title),
      object_type: first(sr.type) || 'Image',
      category: subject,
      date_range: String(date || ''),
      artist: String(creator || ''),
      description: String(description || ''),
      licence: String(Array.isArray(sr.rights) ? sr.rights.join(' · ') : (sr.rights || 'See DPLA record')),
      legal_status_normalised: rights.status,
      media_thumbnail: image,
      media_medium: image,
      media_large: image,
      media_available: true,
      media_public_display_allowed: rights.open,
      poster_download_allowed: false,
      source_url: first(doc.isShownAt) || `https://dp.la/item/${doc.id}`,
      harvested_at: new Date().toISOString(),
      harvester: 'dpla-harvester.js',
      embedding_text,
    },
  };
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — DPLA                          ║');
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
      const url = `${DPLA_API}?q=${encodeURIComponent(q)}&page_size=100&api_key=${encodeURIComponent(API_KEY)}`;
      const data = await fetchJSON(url);
      const docs = data?.docs || [];
      let added = 0;
      for (const doc of docs) {
        if (success >= LIMIT) break;
        if (seen.has(doc.id)) continue;
        seen.add(doc.id);
        const rec = mapDoc(doc);
        if (!rec || !rec.ok) continue;
        if (EXCLUDE_PATTERNS.some((re) => re.test(`${rec.payload.title} ${rec.payload.description}`))) { skippedNoOpen++; continue; }
        if (!rec.payload.media_public_display_allowed) { skippedNoOpen++; continue; }
        if (DRY_RUN) { console.log(`  [dry] ${rec.payload.title.substring(0, 50)} — ${rec.payload.source_institution}`); success++; added++; continue; }
        try { const vector = await embed(rec.payload.embedding_text); if (!vector?.length) { errors++; continue; } await upsertPoint(ID_OFFSET + success, vector, rec.payload); success++; added++; await sleep(120); }
        catch (_) { errors++; await sleep(300); }
      }
      console.log(`  → "${q}" — ${docs.length} docs, ${added} admitted (total: ${success})`);
      await sleep(400);
    } catch (e) { console.warn(`  ⚠ "${q}" — ${e.message}`); }
  }

  console.log(`\n  ════════════════════════════════════════════`);
  console.log(`  ✓ DPLA harvest ${DRY_RUN ? '(dry-run) ' : ''}complete`);
  console.log(`  → ${success} open-rights image records ${DRY_RUN ? 'would be' : ''} embedded into '${COLLECTION}'`);
  console.log(`  → ${skippedNoOpen} skipped (rights not on the open allow-list)`);
  console.log(`  → ${errors} errors\n`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
