#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Internet Archive Harvester
// Openly-licensed image items from archive.org (CC / public domain),
// filtered by licenseurl. No API key required.
//
// Usage:
//   node internetarchive-harvester.js                 # dry-run by default
//   node internetarchive-harvester.js --apply --limit 200
//
// API: https://archive.org/advancedsearch.php  (Solr-style query)
// Image thumbnail is derived: https://archive.org/services/img/<identifier>
// Licence: per-item licenseurl; only CC/public-domain items are marked
//          public-display, everything else is held.
// ══════════════════════════════════════════════════════════════════

const IA_SEARCH = 'https://archive.org/advancedsearch.php';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const COLLECTION = 'archai_internetarchive';
const EMBED_MODEL = 'nomic-embed-text';
const ID_OFFSET = 3400000;

const args = process.argv.slice(2);
const getArg = (name, fallback) => { const i = args.indexOf('--' + name); return i !== -1 && args[i + 1] ? args[i + 1] : fallback; };
const LIMIT = parseInt(getArg('limit', '150'), 10);
const APPLY = args.includes('--apply');
const DRY_RUN = !APPLY;
const SINGLE_QUERY = getArg('query', '');

const SEARCH_QUERIES = SINGLE_QUERY ? [SINGLE_QUERY] : [
  'museum artwork', 'historical photograph', 'vintage illustration',
  'poster design', 'scientific illustration', 'antique map',
  'natural history print', 'portrait engraving', 'architecture drawing',
  'decorative arts', 'manuscript page', 'botanical illustration',
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

function normaliseRights(licenseurl) {
  const v = String(licenseurl || '').toLowerCase();
  if (!v) return { open: false, status: 'unknown', label: 'Not stated — check source' };
  if (v.includes('publicdomain') || v.includes('/mark/')) return { open: true, status: 'open', label: 'Public Domain (IA licenseurl)' };
  if (v.includes('creativecommons.org/licenses/by')) return { open: true, status: 'open', label: 'CC BY / BY-SA (IA licenseurl)' };
  if (v.includes('creativecommons.org/licenses/')) return { open: true, status: 'open', label: 'Creative Commons (IA licenseurl)' };
  return { open: false, status: 'check-source', label: String(licenseurl) };
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
  const id = doc.identifier;
  const title = first(doc.title) || id;
  const rights = normaliseRights(doc.licenseurl);
  const description = first(doc.description);
  const creator = first(doc.creator);
  const date = first(doc.date);
  const thumb = `https://archive.org/services/img/${encodeURIComponent(id)}`;
  const embedding_text = [title, creator ? `by ${creator}` : '', date, description, 'Internet Archive'].filter(Boolean).join('. ');
  return {
    ok: Boolean(id && title),
    open: rights.open,
    payload: {
      canonical_id: `internetarchive:${id}`,
      source: 'internetarchive',
      source_institution: 'Internet Archive',
      source_record_id: String(id),
      title: String(title),
      object_type: first(doc.mediatype) || 'image',
      category: first(doc.subject) || '',
      date_range: String(date || ''),
      artist: String(creator || ''),
      description: String(description || ''),
      licence: rights.label,
      legal_status_normalised: rights.status,
      media_thumbnail: thumb,
      media_medium: thumb,
      media_large: thumb,
      media_available: true,
      media_public_display_allowed: rights.open,
      poster_download_allowed: false,
      source_url: `https://archive.org/details/${encodeURIComponent(id)}`,
      harvested_at: new Date().toISOString(),
      harvester: 'internetarchive-harvester.js',
      embedding_text,
    },
  };
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Internet Archive              ║');
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
      const solr = `(${q}) AND mediatype:image AND licenseurl:[* TO *]`;
      const fl = ['identifier', 'title', 'description', 'creator', 'date', 'mediatype', 'licenseurl', 'subject'];
      const url = `${IA_SEARCH}?q=${encodeURIComponent(solr)}&${fl.map((f) => `fl[]=${f}`).join('&')}&rows=80&page=1&output=json`;
      const data = await fetchJSON(url);
      const docs = data?.response?.docs || [];
      let added = 0;
      for (const doc of docs) {
        if (success >= LIMIT) break;
        if (seen.has(doc.identifier)) continue;
        seen.add(doc.identifier);
        const rec = mapDoc(doc);
        if (!rec.ok) continue;
        if (!rec.open) { skippedNoOpen++; continue; }
        if (DRY_RUN) { console.log(`  [dry] ${rec.payload.title.substring(0, 55)} — ${rec.payload.licence}`); success++; added++; continue; }
        try { const vector = await embed(rec.payload.embedding_text); if (!vector?.length) { errors++; continue; } await upsertPoint(ID_OFFSET + success, vector, rec.payload); success++; added++; await sleep(120); }
        catch (_) { errors++; await sleep(300); }
      }
      console.log(`  → "${q}" — ${docs.length} docs, ${added} admitted (total: ${success})`);
      await sleep(400);
    } catch (e) { console.warn(`  ⚠ "${q}" — ${e.message}`); }
  }

  console.log(`\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Internet Archive harvest ${DRY_RUN ? '(dry-run) ' : ''}complete`);
  console.log(`  → ${success} open-licensed image records ${DRY_RUN ? 'would be' : ''} embedded into '${COLLECTION}'`);
  console.log(`  → ${skippedNoOpen} skipped (licence not CC/PD)`);
  console.log(`  → ${errors} errors\n`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
