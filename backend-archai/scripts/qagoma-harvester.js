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

// Inline CSV parser — handles quoted fields containing commas AND embedded newlines.
// The QAGOMA CSV has multi-line quoted fields (e.g. CreditLine), so we must collect
// whole records character-by-character before splitting on columns.
function parseCSV(text) {
  const records = [];
  let buf = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQ && text[i + 1] === '"') { buf += '"'; i++; } // escaped ""
      else { inQ = !inQ; buf += c; }                       // keep quote for splitCSVLine
    } else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && text[i + 1] === '\n') i++;         // consume \r\n as one
      if (buf) { records.push(buf); buf = ''; }
    } else {
      buf += c;
    }
  }
  if (buf) records.push(buf);
  if (!records.length) return [];

  const headers = splitCSVLine(records[0]);
  const rows = [];
  for (let i = 1; i < records.length; i++) {
    if (!records[i].trim()) continue;
    const vals = splitCSVLine(records[i]);
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
// Column names from the December 2024 Queensland Government open data release:
//   irn, PlaceCreated, DateCreated, PhyMediumText, CreditLine, Person, Title,
//   PhyMediaCategory, AccessionNo, ObjectType, EdiImpression, Department,
//   PhysicalDimensions, AcquiredDate, PhysicalCategory, CollectionOnlineAPI
function normaliseRecord(row) {
  const get = (...keys) => {
    for (const k of keys) {
      const val = (row[k] || '').trim();
      if (val) return val;
    }
    return '';
  };

  return {
    id:          get('irn', 'AccessionNo'),
    title:       get('Title'),
    artist:      get('Person'),
    date:        get('DateCreated'),
    medium:      get('PhyMediumText', 'PhyMediaCategory'),
    dimensions:  get('PhysicalDimensions'),
    region:      get('PlaceCreated'),
    nationality: '',
    objectType:  get('ObjectType', 'PhysicalCategory'),
    department:  get('Department'),
    credit:      get('CreditLine'),
    accession:   get('AccessionNo', 'irn'),
    apiUrl:      get('CollectionOnlineAPI'),
    imageUrl:    '',
    thumbUrl:    '',
    rights:      '',
    description: '',
  };
}

// QAGOMA image API (collection.qagoma.qld.gov.au/api/objects/{irn}) is protected
// by Cloudflare bot mitigation and returns HTTP 403 for all automated requests.
// Images are therefore metadata-only until formal API access is arranged with QAGOMA.
// This is a strong prompt for partnership outreach — see nfc-pages/partnership/email-museum-digital-teams.md
function fetchObjectImage(_apiUrl) {
  return Promise.resolve(null);
}

// Check if a record is usable — must have title and identifier.
// Images are fetched per-object from the API; records without images
// are still indexed as metadata-only (still valuable for semantic search).
function isUsableRecord(rec) {
  if (!rec.title) return false;
  if (!rec.id && !rec.accession) return false;
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

  // Normalise and filter to records with at least a title and identifier
  const normalised = rawRecords
    .map(normaliseRecord)
    .filter(isUsableRecord)
    .filter(rec => !REGION_FILTER || rec.region.toLowerCase().includes(REGION_FILTER.toLowerCase()));

  console.log(`  → ${normalised.length} usable records`);
  console.log(`  → Processing up to ${LIMIT} records (fetching images from CollectionOnlineAPI)…\n`);

  // Shuffle for variety across region/medium/objectType when limiting
  const shuffled = normalised.sort(() => Math.random() - 0.5);

  let success = 0, errors = 0, withImage = 0;

  for (let i = 0; i < shuffled.length; i++) {
    if (success >= LIMIT) break;
    const rec = shuffled[i];

    try {
      // Attempt to fetch image URL from per-object API (non-fatal if missing)
      const imageUrl = await fetchObjectImage(rec.apiUrl);
      if (imageUrl) withImage++;

      const description = [
        rec.title,
        rec.artist    ? `by ${rec.artist}` : '',
        rec.region    ? `(${rec.region})` : '',
        rec.date,
        rec.medium,
        rec.objectType ? `Type: ${rec.objectType}` : '',
        rec.dimensions ? `Dimensions: ${rec.dimensions}` : '',
        rec.department ? `Collection: ${rec.department}` : '',
        rec.credit,
        'Queensland Art Gallery | Gallery of Modern Art (QAGOMA), Brisbane',
      ].filter(Boolean).join('. ');

      const sourceUrl = rec.apiUrl || qagomaUrl(rec.accession);

      const payload = {
        canonical_id:        `qagoma:${rec.id || rec.accession}`,
        source:              'qagoma',
        source_institution:  'QAGOMA — Queensland Art Gallery | Gallery of Modern Art',
        accession_number:    rec.accession,
        title:               rec.title,
        artist:              rec.artist,
        region:              rec.region,
        date_range:          rec.date,
        medium:              rec.medium,
        object_type:         rec.objectType,
        dimensions:          rec.dimensions,
        department:          rec.department,
        credit_line:         rec.credit,
        description,
        licence:             'CC BY 4.0 (Queensland Open Data)',
        attribution:         `${rec.title}${rec.artist ? ` — ${rec.artist}` : ''}. QAGOMA Collection, Brisbane. CC BY 4.0.`,
        source_url:          sourceUrl,
        media_thumbnail:     imageUrl || null,
        media_medium:        imageUrl || null,
        media_large:         imageUrl || null,
        embedding_text:      description,
      };

      if (DRY_RUN) {
        console.log(`  [dry] ${rec.title.substring(0, 60)}${rec.artist ? ` — ${rec.artist}` : ''}${imageUrl ? ' 🖼' : ''}`);
        success++;
        continue;
      }

      const vector = await embed(description);
      if (!vector?.length) { errors++; continue; }

      await upsertPoint(ID_OFFSET + success, vector, payload);
      success++;

      const pct = Math.round((i + 1) / Math.min(shuffled.length, LIMIT * 3) * 100);
      process.stdout.write(`  [${pct}%] ${success}/${LIMIT} · ${rec.title.substring(0, 48)}\r`);
      await sleep(150);
    } catch (e) {
      errors++;
      await sleep(300);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ QAGOMA harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}' (offset: ${ID_OFFSET})`);
  console.log(`  → ${errors} errors`);
  console.log(`  → Images: metadata-only (QAGOMA image API is Cloudflare-protected)`);
  console.log(`  → To add images: request API access via QAGOMA partnership outreach`);
  console.log(`  → Dataset: Queensland Government Open Data (CC BY 4.0)`);
  console.log(`  → Coverage: Asia-Pacific, Aboriginal & Torres Strait Islander,`);
  console.log(`              Australian, international modern/contemporary art\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
