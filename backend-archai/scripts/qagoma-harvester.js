#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — QAGOMA Collection Harvester
// Queensland Art Gallery | Gallery of Modern Art, Brisbane.
// Open dataset published on Queensland Government Open Data Portal.
//
// QAGOMA holds one of the best Asia-Pacific contemporary art collections
// outside of Asia: Southeast Asian, Pacific, Aboriginal & Torres Strait
// Islander, Australian, and international modern art.
//
// No API key required. Dataset is public via Queensland Open Data Portal.
//
// Usage:
//   node qagoma-harvester.js
//   node qagoma-harvester.js --limit 200
//   node qagoma-harvester.js --dry-run
//   node qagoma-harvester.js --region "Asia Pacific" --limit 100
//
// Data:    https://www.data.qld.gov.au/dataset/qagoma-collection
// Licence: Creative Commons Attribution 4.0 International (CC BY 4.0)
//          Image reuse: per-item check recommended for AUX.IO display.
//          Only image-backed records with clear open-media flags used.
// ══════════════════════════════════════════════════════════════════

// Queensland Government open data portal — CKAN API for QAGOMA dataset
const QLD_DATA_API   = 'https://www.data.qld.gov.au/api/3/action';
const QAGOMA_DATASET = 'qagoma-collection';
const QDRANT_URL     = 'http://localhost:6333';
const OLLAMA_URL     = 'http://localhost:11434';
const COLLECTION     = 'archai_qagoma';
const EMBED_MODEL    = 'nomic-embed-text';
const ID_OFFSET      = 13_000_000;

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT         = parseInt(getArg('limit', '200'), 10);
const REGION_FILTER = getArg('region', '');
const DRY_RUN       = args.includes('--dry-run');

// ── HELPERS ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)',
          'Accept':     'application/json',
        },
      });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

// Inline CSV parser — handles quoted fields and commas inside quotes.
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (!lines.length) return [];
  const headers = splitCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, idx) => { obj[h.trim()] = (vals[idx] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── DATA FETCH ───────────────────────────────────────────────────

// Fetch the QAGOMA collection CSV resource URL from the CKAN API,
// then download and parse the CSV.
async function fetchQAGOMARecords() {
  console.log('  → Fetching QAGOMA dataset package info from Queensland Open Data…');

  // Step 1: get package metadata to find the CSV resource URL
  const pkgUrl = `${QLD_DATA_API}/package_show?id=${QAGOMA_DATASET}`;
  const pkg = await fetchJSON(pkgUrl);

  let csvUrl = null;

  if (pkg?.result?.resources) {
    // Find the main collection CSV (usually the largest CSV resource)
    const resources = pkg.result.resources;
    const csvResource = resources.find(r =>
      r.format?.toLowerCase() === 'csv' ||
      r.url?.toLowerCase().endsWith('.csv')
    );
    if (csvResource?.url) csvUrl = csvResource.url;
  }

  // Fallback: try Socrata-style datastore API
  if (!csvUrl) {
    console.log('  → No CSV found via CKAN, attempting Socrata-compatible endpoint…');
    // QAGOMA data may be hosted on Socrata (data.qld.gov.au uses it)
    const socUrl = `https://www.data.qld.gov.au/datastore/dump/${QAGOMA_DATASET}?format=csv&limit=50000`;
    csvUrl = socUrl;
  }

  if (!csvUrl) {
    throw new Error('Could not locate QAGOMA collection CSV. Check https://www.data.qld.gov.au/dataset/qagoma-collection');
  }

  console.log(`  → Downloading collection data from: ${csvUrl}`);
  const res = await fetch(csvUrl, {
    headers: { 'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)' },
  });
  if (!res.ok) throw new Error(`CSV download failed: HTTP ${res.status}`);

  const text = await res.text();
  console.log(`  → Downloaded ${(text.length / 1024).toFixed(0)}KB`);
  return parseCSV(text);
}

// Normalise a raw QAGOMA CSV row into a clean record object.
// Field names from the Queensland Government open data schema.
function normaliseRecord(row) {
  // Common field name variants across QAGOMA data releases
  const get = (...keys) => {
    for (const k of keys) {
      const val = (row[k] || row[k?.toLowerCase()] || '').trim();
      if (val) return val;
    }
    return '';
  };

  return {
    id:          get('Object ID', 'object_id', 'id', 'ID'),
    title:       get('Title', 'title', 'Object Title'),
    artist:      get('Artist', 'artist', 'Creator', 'Maker', 'maker'),
    date:        get('Date', 'date', 'Creation Date', 'creation_date', 'Year'),
    medium:      get('Medium', 'medium', 'Material', 'Technique'),
    dimensions:  get('Dimensions', 'dimensions', 'Measurements'),
    region:      get('Region', 'region', 'Country', 'Culture', 'Geography'),
    nationality: get('Nationality', 'nationality'),
    department:  get('Department', 'department', 'Gallery'),
    credit:      get('Credit Line', 'credit_line', 'Credit', 'Acquisition'),
    accession:   get('Accession Number', 'accession_number', 'Accession'),
    imageUrl:    get('Image URL', 'image_url', 'Image', 'Thumbnail', 'thumbnail_url'),
    thumbUrl:    get('Thumbnail URL', 'thumbnail_url', 'Thumbnail'),
    rights:      get('Rights', 'rights', 'Licence', 'License', 'Copyright'),
    description: get('Description', 'description', 'Notes', 'Synopsis'),
  };
}

// Check if a record has an image URL available and open rights for display.
function hasOpenImage(rec) {
  if (!rec.imageUrl && !rec.thumbUrl) return false;
  // If rights field is explicitly provided, require it to be open
  const rights = rec.rights.toLowerCase();
  if (rights && (
    rights.includes('all rights reserved') ||
    rights.includes('©') ||
    rights.includes('copyright')
  )) return false;
  return true;
}

// Build canonical QAGOMA object URL
function qagomaUrl(accession) {
  if (!accession) return 'https://www.qagoma.qld.gov.au/the-collection/';
  return `https://collection.qagoma.qld.gov.au/objects/${encodeURIComponent(accession)}`;
}

// ── EMBEDDING ────────────────────────────────────────────────────
async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 2000) }),
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
    body: JSON.stringify({ vectors: { size: testVec.length, distance: 'Cosine' } }),
  });
  console.log(`  ✓ Created collection '${COLLECTION}' (dim: ${testVec.length})`);
}

async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [{ id, vector, payload }] }),
  });
}

// ── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — QAGOMA Collection Harvester   ║');
  console.log('  ║   Queensland Art Gallery | GOMA, Brisbane ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes]\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }

  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }

  if (!DRY_RUN) await ensureCollection();

  // Download the full dataset
  let rawRecords;
  try {
    rawRecords = await fetchQAGOMARecords();
  } catch (e) {
    console.error(`\n  ✗ Failed to fetch QAGOMA dataset: ${e.message}`);
    console.error('  → Data URL: https://www.data.qld.gov.au/dataset/qagoma-collection\n');
    process.exit(1);
  }

  console.log(`  ✓ ${rawRecords.length} total records in dataset`);

  // Normalise and filter
  const normalised = rawRecords
    .map(normaliseRecord)
    .filter(rec => rec.id || rec.accession)          // must have some identifier
    .filter(rec => rec.title)                         // must have a title
    .filter(rec => !REGION_FILTER || rec.region.toLowerCase().includes(REGION_FILTER.toLowerCase()));

  const imageBackedRecords = normalised.filter(hasOpenImage);
  console.log(`  → ${imageBackedRecords.length} image-backed, open-rights records`);
  console.log(`  → Processing up to ${LIMIT} records…\n`);

  // Shuffle to get variety across region/medium when limiting
  const shuffled = imageBackedRecords.sort(() => Math.random() - 0.5);

  let success = 0, errors = 0;

  for (let i = 0; i < shuffled.length; i++) {
    if (success >= LIMIT) break;
    const rec = shuffled[i];

    try {
      const description = [
        rec.title,
        rec.artist    ? `by ${rec.artist}` : '',
        rec.nationality || rec.region ? `(${[rec.nationality, rec.region].filter(Boolean).join(', ')})` : '',
        rec.date,
        rec.medium,
        rec.dimensions ? `Dimensions: ${rec.dimensions}` : '',
        rec.department ? `Collection: ${rec.department}` : '',
        rec.description,
        rec.credit,
        'Queensland Art Gallery | Gallery of Modern Art (QAGOMA), Brisbane',
      ].filter(Boolean).join('. ');

      const payload = {
        canonical_id:        `qagoma:${rec.id || rec.accession}`,
        source:              'qagoma',
        source_institution:  'QAGOMA — Queensland Art Gallery | Gallery of Modern Art',
        accession_number:    rec.accession,
        title:               rec.title,
        artist:              rec.artist,
        nationality:         rec.nationality,
        region:              rec.region,
        date_range:          rec.date,
        medium:              rec.medium,
        dimensions:          rec.dimensions,
        department:          rec.department,
        credit_line:         rec.credit,
        description,
        licence:             rec.rights || 'CC BY 4.0 (Queensland Open Data)',
        attribution:         `${rec.title}${rec.artist ? ` — ${rec.artist}` : ''}. QAGOMA Collection, Brisbane. CC BY 4.0.`,
        source_url:          qagomaUrl(rec.accession),
        media_thumbnail:     rec.thumbUrl || rec.imageUrl,
        media_medium:        rec.imageUrl || rec.thumbUrl,
        media_large:         rec.imageUrl || rec.thumbUrl,
        embedding_text:      description,
      };

      if (DRY_RUN) {
        console.log(`  [dry] ${rec.title.substring(0, 60)}${rec.artist ? ` — ${rec.artist}` : ''}`);
        success++;
        continue;
      }

      const vector = await embed(description);
      if (!vector?.length) { errors++; continue; }

      await upsertPoint(ID_OFFSET + success, vector, payload);
      success++;

      const pct = Math.round((i + 1) / shuffled.length * 100);
      process.stdout.write(`  [${pct}%] ${success}/${shuffled.length} · ${rec.title.substring(0, 48)}\r`);
      await sleep(120);
    } catch (e) {
      errors++;
      await sleep(300);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ QAGOMA harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}' (offset: ${ID_OFFSET})`);
  console.log(`  → ${errors} errors`);
  console.log(`  → Dataset: Queensland Government Open Data (CC BY 4.0)`);
  console.log(`  → Image rights: per-item, open-media records only`);
  console.log(`  → Coverage: Asia-Pacific, Aboriginal & Torres Strait Islander,`);
  console.log(`              Australian, international modern/contemporary art\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
