#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Met Museum (NYC) Harvester
// Fetches modern/contemporary art + technology objects from the Met's
// Open Access API, embeds via Ollama, stores in Qdrant.
//
// Usage:
//   node met-harvester.js
//   node met-harvester.js --limit 100
//   node met-harvester.js --limit 200 --offset 0
//
// API docs: https://metmuseum.github.io/
// Licence: CC0 (public domain)
// ══════════════════════════════════════════════════════════════════

const MET_API = 'https://collectionapi.metmuseum.org/public/collection/v1';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_met';
const EMBED_MODEL = 'nomic-embed-text';

// Search terms targeting digital, electronic, modern/contemporary art
const SEARCH_QUERIES = [
  'electronic art',
  'digital art',
  'video art',
  'computer',
  'installation art',
  'kinetic sculpture',
  'new media',
  'contemporary photography',
  'television',
  'radio',
  'telephone',
  'technology',
  'scientific instrument',
  'projection',
  'sound art',
  'neon art',
  'light art',
  'interactive',
  'generative',
  'robot',
  'circuit',
  'synthesizer',
  'camera',
  'film projector',
  'modern sculpture',
  'contemporary art'
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT = parseInt(getArg('limit', '150'), 10);
const OFFSET = parseInt(getArg('offset', '0'), 10);

// ── HELPERS ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) { await sleep(2000); continue; }
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
    if (res.ok) {
      console.log(`  ✓ Collection '${COLLECTION}' exists`);
      return;
    }
  } catch (e) {}

  // Get vector dimension from a test embedding
  const testVec = await embed('test');
  const dim = testVec.length;

  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vectors: { size: dim, distance: 'Cosine' }
    })
  });
  console.log(`  ✓ Created collection '${COLLECTION}' (dim: ${dim})`);
}

async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: [{ id, vector, payload }]
    })
  });
}

// ── MAIN ────────────────────────────────────────────────────────
async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Met Museum Harvester          ║');
  console.log('  ╚══════════════════════════════════════════╝\n');

  // Check Ollama
  try {
    await fetch(`${OLLAMA_URL}/api/tags`);
    console.log('  ✓ Ollama online');
  } catch (e) {
    console.error('  ✗ Ollama not reachable at', OLLAMA_URL);
    process.exit(1);
  }

  // Check Qdrant
  try {
    await fetch(`${QDRANT_URL}/collections`);
    console.log('  ✓ Qdrant online');
  } catch (e) {
    console.error('  ✗ Qdrant not reachable at', QDRANT_URL);
    process.exit(1);
  }

  await ensureCollection();

  // Collect unique object IDs across all search queries
  const allIds = new Set();
  console.log(`\n  Searching Met API for digital/electronic/modern art…\n`);

  for (const query of SEARCH_QUERIES) {
    try {
      const data = await fetchJSON(`${MET_API}/search?hasImages=true&q=${encodeURIComponent(query)}`);
      const ids = data.objectIDs || [];
      ids.forEach(id => allIds.add(id));
      process.stdout.write(`  → "${query}" — ${ids.length} results (total unique: ${allIds.size})\n`);
      await sleep(200); // Be polite to the API
    } catch (e) {
      process.stdout.write(`  ⚠ "${query}" — failed: ${e.message}\n`);
    }
  }

  console.log(`\n  ✓ ${allIds.size} unique object IDs found`);

  // Slice to limit
  const idsToFetch = [...allIds].slice(OFFSET, OFFSET + LIMIT);
  console.log(`  → Fetching ${idsToFetch.length} objects (offset ${OFFSET}, limit ${LIMIT})\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < idsToFetch.length; i++) {
    const objId = idsToFetch[i];
    try {
      const obj = await fetchJSON(`${MET_API}/objects/${objId}`);
      if (!obj || !obj.objectID) { errors++; continue; }

      // Build payload
      const title = obj.title || 'Untitled';
      const description = [
        obj.title,
        obj.objectName,
        obj.medium,
        obj.department,
        obj.culture,
        obj.period,
        obj.artistDisplayName ? `by ${obj.artistDisplayName}` : '',
        obj.classification,
        obj.objectDate
      ].filter(Boolean).join('. ');

      const payload = {
        canonical_id: `met:${obj.objectID}`,
        source: 'met',
        source_institution: 'The Metropolitan Museum of Art',
        title: title,
        object_type: obj.objectName || obj.classification || '',
        discipline: obj.department || '',
        category: obj.classification || '',
        date_range: obj.objectDate || '',
        registration_number: String(obj.objectID),
        museum_location: obj.GalleryNumber ? `Gallery ${obj.GalleryNumber}` : 'The Met, New York',
        description: description,
        medium: obj.medium || '',
        artist: obj.artistDisplayName || '',
        artist_bio: obj.artistDisplayBio || '',
        culture: obj.culture || '',
        period: obj.period || '',
        dimensions: obj.dimensions || '',
        licence: 'CC0 — Public Domain',
        source_url: obj.objectURL || `https://www.metmuseum.org/art/collection/search/${obj.objectID}`,
        media_thumbnail: obj.primaryImageSmall || '',
        media_medium: obj.primaryImage || '',
        media_large: obj.primaryImage || '',
        embedding_text: description
      };

      // Embed
      const vector = await embed(description);
      if (!vector || !vector.length) { errors++; continue; }

      // Upsert
      // Use a numeric ID for Qdrant (offset to avoid collision)
      const pointId = 1000000 + i;
      await upsertPoint(pointId, vector, payload);

      success++;
      const pct = Math.round((i + 1) / idsToFetch.length * 100);
      process.stdout.write(`  [${pct}%] ${success}/${i + 1} · ${title.substring(0, 50)}${title.length > 50 ? '…' : ''}\r`);

      // Rate limiting — be polite
      await sleep(150);
    } catch (e) {
      errors++;
      await sleep(300);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Met harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}'`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → Licence: CC0 — Public Domain`);
  console.log(`  → Search alongside MV: update ARCHAI to query '${COLLECTION}'\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
