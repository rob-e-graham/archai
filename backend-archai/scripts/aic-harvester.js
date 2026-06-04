#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Art Institute of Chicago Harvester
// Fetches technology, science, modern/contemporary art objects from
// AIC's Open Access API, embeds via Ollama, stores in Qdrant.
//
// Usage:
//   node aic-harvester.js
//   node aic-harvester.js --limit 100
//   node aic-harvester.js --dry-run
//
// API docs: https://api.artic.edu/docs/
// Licence: CC0 (public domain) for qualifying works
// ══════════════════════════════════════════════════════════════════

const AIC_API = 'https://api.artic.edu/api/v1';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_aic';
const EMBED_MODEL = 'nomic-embed-text';
const IIIF_BASE = 'https://www.artic.edu/iiif/2';

// Fields we need from the API
const FIELDS = [
  'id', 'title', 'image_id', 'artist_display', 'date_display',
  'medium_display', 'dimensions', 'classification_title',
  'department_title', 'artwork_type_title', 'credit_line',
  'is_public_domain', 'thumbnail', 'place_of_origin',
  'style_title', 'description', 'publication_history',
  'provenance_text', 'gallery_title', 'gallery_id'
].join(',');

// Search terms targeting technology, science, modern/contemporary
// Targeted at the Art Institute of Chicago's deep PUBLIC-DOMAIN holdings (the
// API filter restricts to PD; these queries spread across its open strengths
// while keeping some technology/design-adjacent terms).
const SEARCH_QUERIES = [
  'painting', 'portrait', 'landscape', 'print', 'drawing', 'etching',
  'photograph', 'sculpture', 'textile', 'ceramic', 'porcelain', 'glass',
  'metalwork', 'furniture', 'decorative arts', 'arms armor', 'clock',
  'scientific instrument', 'japanese woodblock', 'chinese bronze',
  'silver', 'jewelry', 'costume', 'architecture drawing', 'industrial design',
  'still life', 'impressionism', 'modernism', 'ancient', 'manuscript'
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT = parseInt(getArg('limit', '150'), 10);
const DRY_RUN = args.includes('--dry-run');

// ── HELPERS ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) { await sleep(3000); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000);
    }
  }
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 2000) })
  });
  const data = await res.json();
  return data.embedding;
}

// ── QDRANT SETUP ────────────────────────────────────────────────
async function ensureCollection() {
  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
    if (res.ok) { console.log(`  ✓ Collection '${COLLECTION}' exists`); return; }
  } catch {}

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

// ── MAIN ────────────────────────────────────────────────────────
async function main() {
  console.log('\n  ╔══════════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Art Institute of Chicago Harvester ║');
  console.log('  ╚══════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('  ⚙ DRY RUN — no writes to Qdrant\n');

  // Check Ollama
  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch { console.error('  ✗ Ollama not reachable'); process.exit(1); }

  if (!DRY_RUN) {
    try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
    catch { console.error('  ✗ Qdrant not reachable'); process.exit(1); }
    await ensureCollection();
  }

  // Collect unique artwork IDs across search queries
  const seen = new Map(); // id -> artwork data
  console.log(`\n  Searching AIC API…\n`);

  for (const query of SEARCH_QUERIES) {
    try {
      // Filter to public-domain at the API level — AIC's modern/contemporary works
      // are mostly in-copyright; only PD works are legally publishable.
      const url = `${AIC_API}/artworks/search?q=${encodeURIComponent(query)}&query[term][is_public_domain]=true&limit=100&fields=${FIELDS}`;
      const data = await fetchJSON(url);
      const artworks = data.data || [];
      let added = 0;
      for (const a of artworks) {
        if (a.image_id && !seen.has(a.id)) {
          seen.set(a.id, a);
          added++;
        }
      }
      process.stdout.write(`  → "${query}" — ${artworks.length} results, ${added} new w/images (total: ${seen.size})\n`);
      await sleep(250);
    } catch (e) {
      process.stdout.write(`  ⚠ "${query}" — ${e.message}\n`);
    }
  }

  console.log(`\n  ✓ ${seen.size} unique artworks with images found`);

  const artworks = [...seen.values()].slice(0, LIMIT);
  console.log(`  → Processing ${artworks.length} (limit ${LIMIT})\n`);

  let success = 0, errors = 0;

  for (let i = 0; i < artworks.length; i++) {
    const a = artworks[i];
    try {
      const title = a.title || 'Untitled';
      const description = [
        a.title,
        a.artwork_type_title,
        a.medium_display,
        a.department_title,
        a.artist_display,
        a.classification_title,
        a.date_display,
        a.place_of_origin,
        a.style_title,
        a.description
      ].filter(Boolean).join('. ');

      // LEGAL GATE: AIC marks non-public-domain works "All rights reserved".
      // Never ingest those — we cannot publish copyrighted media.
      if (!a.is_public_domain) { errors++; continue; }

      const imgUrl = `${IIIF_BASE}/${a.image_id}/full/843,/0/default.jpg`;
      const thumbUrl = `${IIIF_BASE}/${a.image_id}/full/200,/0/default.jpg`;

      const payload = {
        canonical_id: `aic:${a.id}`,
        source: 'aic',
        source_institution: 'Art Institute of Chicago',
        title,
        object_type: a.artwork_type_title || a.classification_title || '',
        discipline: a.department_title || '',
        category: a.classification_title || '',
        date_range: a.date_display || '',
        registration_number: String(a.id),
        museum_location: a.gallery_title || 'Art Institute of Chicago',
        description,
        medium: a.medium_display || '',
        artist: a.artist_display || '',
        artist_bio: '',
        culture: a.place_of_origin || '',
        period: a.style_title || '',
        dimensions: a.dimensions || '',
        licence: a.is_public_domain ? 'CC0 — Public Domain' : 'All rights reserved',
        source_url: `https://www.artic.edu/artworks/${a.id}`,
        media_thumbnail: thumbUrl,
        media_medium: imgUrl,
        media_large: imgUrl,
        embedding_text: description
      };

      if (DRY_RUN) {
        success++;
        process.stdout.write(`  [DRY] ${title.substring(0, 55)}\r`);
      } else {
        const vector = await embed(description);
        if (!vector || !vector.length) { errors++; continue; }
        const pointId = 3000000 + i; // Offset to avoid collision w/ Met (1M) and MV (2M)
        await upsertPoint(pointId, vector, payload);
        success++;
        const pct = Math.round((i + 1) / artworks.length * 100);
        process.stdout.write(`  [${pct}%] ${success}/${i + 1} · ${title.substring(0, 50)}\r`);
      }

      await sleep(200);
    } catch (e) {
      errors++;
      await sleep(300);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ AIC harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}'`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → Licence: CC0 for public domain works`);
  console.log(`  → 131,000+ total artworks available\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
