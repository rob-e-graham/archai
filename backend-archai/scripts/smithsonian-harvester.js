#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Smithsonian Open Access Harvester
// Covers Smithsonian American Art Museum (SAAM) and Cooper Hewitt
// National Design Museum (CHSDM) — modern American art, industrial
// design, graphic design, and applied arts.
//
// REQUIRES: Free API key from https://api.data.gov/signup
//   Set: SMITHSONIAN_API_KEY=your-key-here
//
// Usage:
//   SMITHSONIAN_API_KEY=xxx node smithsonian-harvester.js
//   SMITHSONIAN_API_KEY=xxx node smithsonian-harvester.js --limit 200
//   SMITHSONIAN_API_KEY=xxx node smithsonian-harvester.js --unit CHSDM --limit 100
//
// API docs:  https://edan.si.edu/openaccess/docs/
//            https://www.si.edu/openaccess/devtools
// Licence:   CC0 — items filtered to usage.access === "CC0" only.
//            You may use, modify, and distribute without attribution,
//            including for commercial purposes.
// ══════════════════════════════════════════════════════════════════

import { execSync } from 'child_process';

const SI_API    = 'https://api.si.edu/openaccess/api/v1.0';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_smithsonian';
const EMBED_MODEL = 'nomic-embed-text';

// Key resolution: env var → macOS Keychain (same pattern as europeana-harvester)
function resolveApiKey() {
  if (process.env.SMITHSONIAN_API_KEY) return process.env.SMITHSONIAN_API_KEY;
  try {
    const k = execSync('security find-generic-password -s famtec -a SMITHSONIAN_API_KEY -w', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    if (k) { console.log('  ✓ Smithsonian key loaded from Keychain (KeyTec)'); return k; }
  } catch (_) {}
  return '';
}

const API_KEY = resolveApiKey();
if (!API_KEY) {
  console.error('\n  ✗ SMITHSONIAN_API_KEY not set');
  console.error('  → Register free at https://api.data.gov/signup');
  console.error('  → Store it: famtec add smithsonian   (or)');
  console.error('  → Pass inline: SMITHSONIAN_API_KEY=xxx node smithsonian-harvester.js\n');
  process.exit(1);
}

// Search terms targeting SAAM (modern American art) and CHSDM (design)
// Each term is paired with a unitCode preference for logging context.
// The SI API CC0 filter (`online_media_type:Images`) returns records
// that have at least one media item — we then verify CC0 at item level.
const SEARCH_QUERIES = [
  // American modern & contemporary art (SAAM)
  'American painting modern',
  'American sculpture twentieth century',
  'Abstract Expressionism',
  'American Impressionism',
  'folk art American',
  'photography American modern',
  'watercolor American',
  'printmaking lithograph American',
  // Design, craft, applied arts (CHSDM / Cooper Hewitt)
  'industrial design product',
  'graphic design poster',
  'textile design pattern',
  'furniture design modern',
  'ceramic design contemporary',
  'wallpaper decorative design',
  'jewellery design craft',
  'glass design',
  // Technology & innovation objects (NASM / NMAH)
  'aviation aircraft technology',
  'computing digital technology',
  // Breadth
  'illustration drawing',
  'decorative arts American',
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT    = parseInt(getArg('limit', '200'), 10);
const UNIT     = getArg('unit', '');    // optional: SAAM, CHSDM, NASM, NMAH…
const DRY_RUN  = args.includes('--dry-run');

// ── HELPERS ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)', 'Accept': 'application/json' }
      });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

// ── EXTRACT HELPERS ──────────────────────────────────────────────
// Smithsonian's freetext fields are arrays of {label, content} objects.
function pickFreetext(freetext, label) {
  if (!freetext) return '';
  const fields = freetext[label];
  if (!Array.isArray(fields) || !fields.length) return '';
  return fields.map(f => f.content).filter(Boolean).join('; ');
}

// Find the first CC0 image in a record's media array.
// Returns { thumbnail, full } or null if no CC0 image found.
function extractCC0Image(content) {
  const media = content?.descriptiveNonRepeating?.online_media?.media;
  if (!Array.isArray(media)) return null;
  for (const m of media) {
    if (m.type !== 'Images') continue;
    const access = m.usage?.access || '';
    if (access.toUpperCase() !== 'CC0') continue;
    const full = m.content || m.guid || '';
    const thumb = m.thumbnail || full;
    if (!thumb && !full) continue;
    return { thumbnail: thumb, full };
  }
  return null;
}

// Build the canonical Smithsonian object URL
function siUrl(id) {
  return `https://www.si.edu/object/${encodeURIComponent(id)}`;
}

// ── EMBEDDING ────────────────────────────────────────────────────
async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 2000) })
  });
  return (await res.json()).embedding;
}

// ── QDRANT ───────────────────────────────────────────────────────
async function ensureCollection() {
  try {
    const r = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
    if (r.ok) { console.log(`  ✓ Collection '${COLLECTION}' exists`); return; }
  } catch (_) {}
  const testVec = await embed('test');
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors: { size: testVec.length, distance: 'Cosine' } })
  });
  console.log(`  ✓ Created collection '${COLLECTION}' (dim: ${testVec.length})`);
}

async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [{ id, vector, payload }] })
  });
}

// ── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Smithsonian Open Access       ║');
  console.log('  ║   SAAM + Cooper Hewitt (CHSDM)           ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes]\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }

  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }

  if (!DRY_RUN) await ensureCollection();

  // Collect unique record IDs across all queries
  const seen = new Set();
  const candidates = [];

  for (const q of SEARCH_QUERIES) {
    try {
      // online_media_type:Images ensures records with media; we verify CC0 per item below.
      let url = `${SI_API}/search?api_key=${API_KEY}&q=${encodeURIComponent(q)}&online_media_type=Images&rows=100`;
      if (UNIT) url += `&unit_code=${encodeURIComponent(UNIT)}`;

      const data = await fetchJSON(url);
      const rows = data?.response?.rows || [];

      let added = 0;
      for (const row of rows) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        candidates.push(row);
        added++;
      }
      console.log(`  → "${q}" — ${rows.length} results, ${added} new (total: ${candidates.length})`);
      await sleep(400);
    } catch (e) {
      console.warn(`  ⚠ "${q}" — ${e.message}`);
    }
  }

  console.log(`\n  ✓ ${candidates.length} candidate records`);
  console.log(`  → Filtering to CC0 image-backed objects, target: ${LIMIT}\n`);

  let success = 0, skippedNoCC0 = 0, errors = 0;

  for (let i = 0; i < candidates.length; i++) {
    if (success >= LIMIT) break;
    const row = candidates[i];

    try {
      const content   = row.content || {};
      const dnr       = content.descriptiveNonRepeating || {};
      const freetext  = content.freetext || {};

      // Must have at least one CC0 image
      const img = extractCC0Image(content);
      if (!img) { skippedNoCC0++; continue; }

      const title     = dnr.title?.content || row.title || 'Untitled';
      const unitCode  = row.unitCode || '';
      const institution = unitLabel(unitCode);

      const artist    = pickFreetext(freetext, 'name');
      const date      = pickFreetext(freetext, 'date');
      const medium    = pickFreetext(freetext, 'medium') || pickFreetext(freetext, 'physicalDescription');
      const topic     = pickFreetext(freetext, 'topic');
      const notes     = pickFreetext(freetext, 'notes');
      const type      = row.type || '';

      const description = [
        title,
        artist   ? `by ${artist}` : '',
        date,
        medium,
        topic,
        notes,
        institution,
      ].filter(Boolean).join('. ');

      const payload = {
        canonical_id:        `smithsonian:${row.id}`,
        source:              'smithsonian',
        source_institution:  institution,
        unit_code:           unitCode,
        title,
        object_type:         type,
        discipline:          unitCode,
        category:            topic || '',
        date_range:          date || '',
        artist,
        medium,
        description,
        licence:             'CC0 — Public Domain',
        media_public_display_allowed: true,
        poster_download_allowed: true,
        media_rights_basis:  'item-level Smithsonian usage.access=CC0',
        source_url:          siUrl(row.id),
        media_thumbnail:     img.thumbnail,
        media_medium:        img.full,
        media_large:         img.full,
        embedding_text:      description,
      };

      if (DRY_RUN) {
        console.log(`  [dry] ${title.substring(0, 60)} (${unitCode})`);
        success++;
        continue;
      }

      const vector = await embed(description);
      if (!vector?.length) { errors++; continue; }

      await upsertPoint(2000000 + success, vector, payload);
      success++;

      const pct = Math.round((i + 1) / candidates.length * 100);
      process.stdout.write(`  [${pct}%] ${success}/${i + 1} · ${title.substring(0, 50)}\r`);
      await sleep(150);
    } catch (e) {
      errors++;
      await sleep(300);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Smithsonian harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}'`);
  console.log(`  → ${skippedNoCC0} skipped (no CC0 image)`);
  console.log(`  → ${errors} errors`);
  console.log(`  → Licence: CC0 — Public Domain (SI Open Access, CC0-flagged items only)`);
  console.log(`  → Units covered: SAAM (American Art), CHSDM (Cooper Hewitt / Design)\n`);
}

// Human-readable unit name for payload
function unitLabel(code) {
  const map = {
    SAAM:   'Smithsonian American Art Museum',
    CHSDM:  'Cooper Hewitt, Smithsonian Design Museum',
    NASM:   'Smithsonian National Air and Space Museum',
    NMAH:   'Smithsonian National Museum of American History',
    NMNH:   'Smithsonian National Museum of Natural History',
    NPG:    'Smithsonian National Portrait Gallery',
    FSG:    'Smithsonian Freer and Sackler Galleries',
    HMSG:   'Smithsonian Hirshhorn Museum and Sculpture Garden',
    AAA:    'Smithsonian Archives of American Art',
  };
  return map[code] || `Smithsonian (${code})`;
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
