#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Library of Congress Harvester
// Image-backed items from loc.gov (photos, prints, posters, maps).
// No API key required.
//
// Usage:
//   node loc-harvester.js                 # dry-run by default
//   node loc-harvester.js --apply --limit 200
//
// API: https://www.loc.gov/apis/json-and-yaml/  (append fo=json)
// Rights: LoC search results rarely carry a machine-readable licence, so
//         records are HELD by default (legal_status_normalised=check-source)
//         and only marked public-display when a result's rights text clearly
//         indicates "no known restrictions" / public domain. Everything is
//         still harvested and staff-searchable; a rights pass can flip more
//         to public later (Roadmap Milestone 3).
// ══════════════════════════════════════════════════════════════════

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const COLLECTION = 'archai_loc';
const EMBED_MODEL = 'nomic-embed-text';
const ID_OFFSET = 3000000;

const args = process.argv.slice(2);
const getArg = (name, fallback) => { const i = args.indexOf('--' + name); return i !== -1 && args[i + 1] ? args[i + 1] : fallback; };
const LIMIT = parseInt(getArg('limit', '150'), 10);
const APPLY = args.includes('--apply');
const DRY_RUN = !APPLY;
const SINGLE_QUERY = getArg('query', '');

// LoC format endpoints that are reliably image-backed.
const ENDPOINTS = SINGLE_QUERY
  ? [{ base: 'https://www.loc.gov/search/', q: SINGLE_QUERY }]
  : [
    { base: 'https://www.loc.gov/photos/', q: 'portrait' },
    { base: 'https://www.loc.gov/photos/', q: 'city street' },
    { base: 'https://www.loc.gov/photos/', q: 'industry work' },
    { base: 'https://www.loc.gov/prints-photographs/', q: 'poster' },
    { base: 'https://www.loc.gov/maps/', q: 'city plan' },
    { base: 'https://www.loc.gov/photos/', q: 'aviation' },
    { base: 'https://www.loc.gov/photos/', q: 'landscape' },
  ];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function fetchJSON(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)', 'Accept': 'application/json' } });
      if (res.status === 429) { await sleep(6000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { if (i === retries - 1) throw e; await sleep(2500 * (i + 1)); }
  }
}

const asText = (v) => Array.isArray(v) ? v.filter(Boolean).join('; ') : String(v || '');
const httpsify = (u) => String(u || '').replace(/^http:\/\//, 'https://');

function normaliseRights(rightsText) {
  const v = String(rightsText || '').toLowerCase();
  if (v.includes('no known restrictions') || v.includes('public domain') || v.includes('no known copyright')) {
    return { open: true, status: 'open' };
  }
  if (!v) return { open: false, status: 'unknown' };
  return { open: false, status: 'check-source' };
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

function mapResult(r) {
  // image_url is an array from smallest to largest; take the largest.
  const images = Array.isArray(r.image_url) ? r.image_url : (r.image_url ? [r.image_url] : []);
  const image = httpsify(images[images.length - 1] || '');
  if (!image) return null;
  const title = asText(r.title) || 'Untitled';
  const rightsText = asText(r.rights_advisory || r.rights || '');
  const rights = normaliseRights(rightsText);
  const description = asText(r.description);
  const date = asText(r.date);
  const subject = Array.isArray(r.subject) ? r.subject.slice(0, 4).join(', ') : asText(r.subject);
  const recordUrl = httpsify(r.id || r.url || '');
  const embedding_text = [title, date, description, subject, 'Library of Congress'].filter(Boolean).join('. ');
  return {
    ok: Boolean(title && image),
    payload: {
      canonical_id: `loc:${(r.id || title).toString().replace(/[^A-Za-z0-9]+/g, '').slice(-40)}`,
      source: 'loc',
      source_institution: 'Library of Congress',
      source_record_id: String(r.id || ''),
      title,
      object_type: asText(r.original_format) || 'Image',
      category: subject,
      date_range: date,
      description,
      licence: rightsText || 'Rights undetermined — see LoC item page',
      legal_status_normalised: rights.status,
      media_thumbnail: image,
      media_medium: image,
      media_large: image,
      media_available: true,
      media_public_display_allowed: rights.open,
      poster_download_allowed: false,
      source_url: recordUrl,
      harvested_at: new Date().toISOString(),
      harvester: 'loc-harvester.js',
      embedding_text,
    },
  };
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Library of Congress           ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes; pass --apply to write]\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }
  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }
  if (!DRY_RUN) await ensureCollection();

  const seen = new Set();
  let success = 0, held = 0, errors = 0;

  for (const ep of ENDPOINTS) {
    if (success >= LIMIT) break;
    try {
      const url = `${ep.base}?q=${encodeURIComponent(ep.q)}&fo=json&c=50&sp=1`;
      const data = await fetchJSON(url);
      const results = data?.results || [];
      let added = 0;
      for (const r of results) {
        if (success >= LIMIT) break;
        const key = r.id || r.url;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const rec = mapResult(r);
        if (!rec || !rec.ok) continue;
        if (!rec.payload.media_public_display_allowed) held++;
        if (DRY_RUN) { console.log(`  [dry] ${rec.payload.title.substring(0, 50)} — display:${rec.payload.media_public_display_allowed}`); success++; added++; continue; }
        try { const vector = await embed(rec.payload.embedding_text); if (!vector?.length) { errors++; continue; } await upsertPoint(ID_OFFSET + success, vector, rec.payload); success++; added++; await sleep(150); }
        catch (_) { errors++; await sleep(300); }
      }
      console.log(`  → ${ep.base} "${ep.q}" — ${results.length} results, ${added} admitted (total: ${success})`);
      await sleep(700);
    } catch (e) { console.warn(`  ⚠ ${ep.base} "${ep.q}" — ${e.message}`); }
  }

  console.log(`\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Library of Congress harvest ${DRY_RUN ? '(dry-run) ' : ''}complete`);
  console.log(`  → ${success} image-backed records ${DRY_RUN ? 'would be' : ''} embedded into '${COLLECTION}'`);
  console.log(`  → ${held} held (rights not clearly open — staff-searchable, not public-display)`);
  console.log(`  → ${errors} errors`);
  console.log(`  → Rights note: run a rights pass before flipping held LoC records to public display.\n`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
