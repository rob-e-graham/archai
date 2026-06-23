#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Street Art & Public Murals Harvester
// Aggregates from multiple open-data city portals, all releasing
// their street art / public art datasets under open licences with
// no API key required.
//
// Sources included:
//   1. Vancouver Open Data — public art & murals (OGL Canada / CC BY)
//   2. Brussels Street Art Trail (opendata.brussels.be) — CC BY 2.0
//   3. NYC Parks Art in the Parks (NYC Open Data) — CC0 / public
//   4. City of Melbourne — Outdoor Artworks (CC BY 4.0)
//   5. San Francisco — Civic Art Collection (Public Domain)
//   6. City of Chicago — Public Art (Public Domain)
//
// Usage:
//   node streetart-harvester.js
//   node streetart-harvester.js --limit 200
//   node streetart-harvester.js --source vancouver
//   node streetart-harvester.js --source melbourne
//   node streetart-harvester.js --source sfgov
//   node streetart-harvester.js --source chicago
//   node streetart-harvester.js --dry-run
//
// Each source is flagged in the Qdrant payload so downstream filters
// can surface or suppress specific city datasets.
// ══════════════════════════════════════════════════════════════════

const QDRANT_URL  = 'http://localhost:6333';
const OLLAMA_URL  = 'http://localhost:11434';
const COLLECTION  = 'archai_streetart';
const EMBED_MODEL = 'nomic-embed-text';

// ── SOURCE DEFINITIONS ───────────────────────────────────────────
// All sources use the Socrata SODA API or equivalent open-data REST
// endpoints. Responses are JSON arrays or GeoJSON feature collections.
const SOURCES = {
  vancouver: {
    name:        'City of Vancouver — Public Art',
    country:     'Canada',
    licence:     'Open Government Licence – Canada / CC BY',
    sourceUrl:   'https://opendata.vancouver.ca/explore/dataset/public-art/',
    // Socrata JSON endpoint — all records, no key needed
    apiUrl:      'https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/public-art/records?limit=100',
    idPrefix:    'van',
    mapRecord:   mapVancouver,
  },
  brussels: {
    name:        'City of Brussels — Street Art Trail',
    country:     'Belgium',
    licence:     'Creative Commons Attribution 4.0 (CC BY 4.0)',
    licenceUrl:  'https://creativecommons.org/licenses/by/4.0/deed.en',
    mediaDisplayAllowed: true,
    mediaRightsBasis: 'Brussels Open Data dataset reports CC BY 4.0 and exposes image files; attribution preserved from record metadata',
    sourceUrl:   'https://opendata.brussels.be/explore/dataset/parcours_street_art/',
    apiUrl:      'https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/parcours_street_art/records?limit=100',
    idPrefix:    'bru',
    mapRecord:   mapBrussels,
  },
  nyc: {
    name:        'NYC Parks — Art in the Parks',
    country:     'USA',
    licence:     'NYC Open Data / Public Domain',
    sourceUrl:   'https://data.cityofnewyork.us/Recreation/Art-in-the-Parks/4pt5-3vv4',
    apiUrl:      'https://data.cityofnewyork.us/resource/8rj8-cwig.json?$limit=200',
    idPrefix:    'nyc',
    mapRecord:   mapNYC,
  },
  melbourne: {
    name:        'City of Melbourne — Outdoor Artworks',
    country:     'Australia',
    licence:     'Creative Commons Attribution 4.0 (CC BY 4.0)',
    sourceUrl:   'https://data.melbourne.vic.gov.au/explore/dataset/outdoor-artworks/',
    apiUrl:      'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/outdoor-artworks/records?limit=100',
    idPrefix:    'mel',
    mapRecord:   mapMelbourne,
  },
  sfgov: {
    name:        'San Francisco — Civic Art Collection',
    country:     'USA',
    licence:     'San Francisco Open Data / Public Domain',
    sourceUrl:   'https://data.sfgov.org/Culture-and-Recreation/Civic-Art-Collection/4hfa-5f7y',
    apiUrl:      'https://data.sfgov.org/resource/4hfa-5f7y.json?$limit=200',
    idPrefix:    'sf',
    mapRecord:   mapSFGov,
  },
  chicago: {
    name:        'City of Chicago — Public Art',
    country:     'USA',
    licence:     'Chicago Open Data / Public Domain',
    sourceUrl:   'https://data.cityofchicago.org/Parks-Recreation/Public-Art/sj6t-9cju',
    apiUrl:      'https://data.cityofchicago.org/resource/sj6t-9cju.json?$limit=200',
    idPrefix:    'chi',
    mapRecord:   mapChicago,
  },
};

// ── RECORD MAPPERS ───────────────────────────────────────────────
// Each mapper receives one raw API record and returns a normalised
// payload object, or null to skip the record.

function mapVancouver(r, source) {
  const fields = r.fields || r;
  const title   = fields.title_of_work || fields.title || '';
  const artist  = [fields.primaryartistname, fields.artistprojectstatement]
    .filter(Boolean).join('; ') || 'Unknown';
  const address = fields.locationonsite || fields.geo_local_area || '';
  const year    = fields.yearofinstallation || fields.year_of_installation || '';
  const medium  = fields.type_of_art_work || fields.primarymaterial || fields.type || fields.medium || '';
  const desc    = fields.description_of_artwork || fields.descriptionofwork || '';
  const photo   = fields.photourl || fields.photo_url || '';
  const img     = typeof photo === 'object' ? (photo.url || '') : (photo || (fields.photos && fields.photos[0]) || '');
  const lat     = fields.geo_point_2d?.lat ?? '';
  const lon     = fields.geo_point_2d?.lon ?? '';

  if (!title) return null;

  const description = [
    title,
    artist !== 'Unknown' ? `by ${artist}` : '',
    address,
    year ? `(${year})` : '',
    medium,
    desc,
    'Vancouver Public Art Collection',
  ].filter(Boolean).join('. ');

  return {
    title, artist, address, date_range: String(year), medium, description,
    media_thumbnail: img, media_medium: img, media_large: img,
    lat: String(lat), lon: String(lon),
    source_url: fields.url || source.sourceUrl,
    media_credit: fields.photocredits || '',
  };
}

function mapBrussels(r, source) {
  const fields = r.fields || r;
  const title   = fields.name_en || fields.name_fr || fields.name_nl || fields.titre_oeuvre || fields.title || fields.naam_werk || '';
  const artist  = fields.artist_name || fields.artiste || fields.artist || fields.kunstenaar || 'Unknown';
  const address = fields.location_en || fields.address_fr || fields.address_nl || fields.adresse || fields.address || fields.adres || '';
  const year    = fields.real_date || fields.annee || fields.year || fields.jaar || '';
  const medium  = fields.technique || fields.medium || '';
  const desc    = fields.description_en || fields.description || fields.omschrijving || fields.description_fr || fields.description_nl || '';
  const image   = fields.url_image || fields.photo || fields.image || '';
  const img     = typeof image === 'object' ? (image.url || '') : (image || '');
  const mediaCredit = typeof image === 'object' && image.filename
    ? image.filename.replace(/^.*?©-?/, '').replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim()
    : '';
  const geo     = fields.geoloc || fields.geo_point_2d || {};
  const lat     = geo.lat ?? '';
  const lon     = geo.lon ?? '';

  if (!title && !artist) return null;

  const description = [
    title || 'Untitled',
    artist !== 'Unknown' ? `by ${artist}` : '',
    address,
    year ? `(${year})` : '',
    medium,
    desc,
    'Brussels Street Art Trail',
  ].filter(Boolean).join('. ');

  return {
    title: title || 'Untitled', artist, address, date_range: String(year), medium, description,
    media_thumbnail: img, media_medium: img, media_large: img,
    lat: String(lat), lon: String(lon),
    source_url: fields.url_en || fields.url_fr || fields.url_nl || source.sourceUrl,
    media_credit: mediaCredit || 'City of Brussels / source record',
  };
}

function mapNYC(r, source) {
  const title  = r.title || r.artwork_title || '';
  const artist = r.artist || r.artist_name || 'Unknown';
  const loc    = r.park_name || r.location || r.borough || '';
  const year   = r.year || r.installation_year || '';
  const medium = r.medium || r.artwork_medium || '';
  const desc   = r.description || '';
  const img    = r.photo_url || '';

  if (!title && !artist) return null;

  const description = [
    title || 'Untitled',
    artist !== 'Unknown' ? `by ${artist}` : '',
    loc,
    year ? `(${year})` : '',
    medium,
    desc,
    'NYC Parks Art in the Parks',
  ].filter(Boolean).join('. ');

  return {
    title: title || 'Untitled', artist, address: loc, date_range: String(year), medium, description,
    media_thumbnail: img, media_medium: img, media_large: img,
    lat: '', lon: '',
    source_url: source.sourceUrl,
  };
}

function mapMelbourne(r, source) {
  const fields = r.fields || r;
  const title  = fields.title || fields.artwork_title || fields.name || '';
  const artist = fields.artist || fields.artist_name || fields.creator || 'Unknown';
  const loc    = fields.location_description || fields.address || fields.suburb || '';
  const year   = fields.year_installed || fields.year || fields.date_installed || '';
  const medium = fields.medium || fields.type || fields.artwork_type || '';
  const desc   = fields.description || fields.artwork_description || '';
  const geo    = fields.geo_point_2d || {};
  const lat    = geo.lat ?? fields.latitude ?? '';
  const lon    = geo.lon ?? fields.longitude ?? '';
  // Melbourne typically serves images via a photo_url or image field
  const img    = fields.photo_url || fields.image_url || (fields.images && fields.images[0]?.url) || '';

  if (!title && !artist) return null;

  const description = [
    title || 'Untitled',
    artist !== 'Unknown' ? `by ${artist}` : '',
    loc,
    year ? `(${year})` : '',
    medium,
    desc,
    'City of Melbourne Outdoor Artworks',
  ].filter(Boolean).join('. ');

  return {
    title: title || 'Untitled', artist, address: loc, date_range: String(year), medium, description,
    media_thumbnail: img, media_medium: img, media_large: img,
    lat: String(lat), lon: String(lon),
    source_url: source.sourceUrl,
  };
}

function mapSFGov(r, source) {
  const title  = r.title || r.artwork_title || '';
  const artist = r.artist || r.artist_name || 'Unknown';
  const loc    = r.location || r.address || r.neighborhood || '';
  const year   = r.year_installed || r.year || '';
  const medium = r.medium || r.artwork_medium || '';
  const desc   = r.description || r.artwork_description || '';
  const img    = r.image_url || r.photo_url || '';

  if (!title && !artist) return null;

  const description = [
    title || 'Untitled',
    artist !== 'Unknown' ? `by ${artist}` : '',
    loc,
    year ? `(${year})` : '',
    medium,
    desc,
    'San Francisco Civic Art Collection',
  ].filter(Boolean).join('. ');

  return {
    title: title || 'Untitled', artist, address: loc, date_range: String(year), medium, description,
    media_thumbnail: img, media_medium: img, media_large: img,
    lat: '', lon: '',
    source_url: source.sourceUrl,
  };
}

function mapChicago(r, source) {
  const title  = r.title || r.artwork_title || '';
  const artist = r.artist_name || r.artist || 'Unknown';
  const loc    = r.address || r.park || r.location_description || '';
  const year   = r.year || r.date_installed || '';
  const medium = r.medium || r.type || '';
  const desc   = r.description || '';
  const img    = r.image_url || r.photo_url || '';

  if (!title && !artist) return null;

  const description = [
    title || 'Untitled',
    artist !== 'Unknown' ? `by ${artist}` : '',
    loc,
    year ? `(${year})` : '',
    medium,
    desc,
    'City of Chicago Public Art',
  ].filter(Boolean).join('. ');

  return {
    title: title || 'Untitled', artist, address: loc, date_range: String(year), medium, description,
    media_thumbnail: img, media_medium: img, media_large: img,
    lat: '', lon: '',
    source_url: source.sourceUrl,
  };
}

// ── HELPERS ─────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const getArg  = (name, fallback) => { const i = args.indexOf('--' + name); return i !== -1 && args[i + 1] ? args[i + 1] : fallback; };
const LIMIT   = parseInt(getArg('limit', '300'), 10);
const SOURCE  = getArg('source', '');   // optional: restrict to one source key
const DRY_RUN = args.includes('--dry-run');

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

// Paginate a Socrata v2.1 catalog endpoint until we have enough records.
async function paginateSocrata(baseUrl, maxRecords = 500) {
  const records = [];
  let offset = 0;
  const batchSize = 100;
  while (records.length < maxRecords) {
    const url = `${baseUrl}&offset=${offset}`;
    const data = await fetchJSON(url);
    const results = data.results || data;
    if (!Array.isArray(results) || !results.length) break;
    records.push(...results);
    if (results.length < batchSize) break;
    offset += batchSize;
    await sleep(300);
  }
  return records;
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
  console.log('  ║   ARCHAI — Street Art & Murals           ║');
  console.log('  ║   Vancouver · Brussels · NYC             ║');
  console.log('  ║   Melbourne · San Francisco · Chicago    ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes]\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }

  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }

  if (!DRY_RUN) await ensureCollection();

  const activeSources = SOURCE
    ? Object.entries(SOURCES).filter(([k]) => k === SOURCE)
    : Object.entries(SOURCES);

  let globalSuccess = 0, globalErrors = 0;
  let pointId = 5000000;

  for (const [key, source] of activeSources) {
    if (globalSuccess >= LIMIT) break;

    console.log(`\n  ── ${source.name} ──`);
    console.log(`     Licence: ${source.licence}`);

    let rawRecords = [];
    try {
      const perSourceLimit = Math.ceil(LIMIT / activeSources.length) + 50;
      rawRecords = await paginateSocrata(source.apiUrl, perSourceLimit);
      console.log(`  → Fetched ${rawRecords.length} raw records`);
    } catch (e) {
      console.error(`  ✗ Failed to fetch ${key}: ${e.message}`);
      continue;
    }

    let sourceSuccess = 0, sourceSkipped = 0;

    for (const raw of rawRecords) {
      if (globalSuccess >= LIMIT) break;

      try {
        const mapped = source.mapRecord(raw, source);
        if (!mapped) { sourceSkipped++; continue; }

        const payload = {
          canonical_id:       `streetart:${key}:${pointId}`,
          source:             `streetart_${key}`,
          source_institution: source.name,
          source_country:     source.country,
          title:              mapped.title,
          object_type:        'Street Art / Public Mural',
          discipline:         'Street Art',
          category:           'Public Art',
          date_range:         mapped.date_range,
          artist:             mapped.artist,
          medium:             mapped.medium,
          location:           mapped.address,
          lat:                mapped.lat,
          lon:                mapped.lon,
          description:        mapped.description,
          licence:            source.licence,
          licence_url:         source.licenceUrl || '',
          media_public_display_allowed: Boolean(source.mediaDisplayAllowed && mapped.media_thumbnail),
          poster_download_allowed: false,
          media_rights_basis: source.mediaDisplayAllowed && mapped.media_thumbnail
            ? source.mediaRightsBasis
            : 'Municipal metadata only; artist and photographer media rights require item-level review',
          attribution:         mapped.media_credit || source.name,
          media_credit:        mapped.media_credit || '',
          source_url:         mapped.source_url,
          media_thumbnail:    mapped.media_thumbnail,
          media_medium:       mapped.media_medium,
          media_large:        mapped.media_large,
          embedding_text:     mapped.description,
        };

        if (DRY_RUN) {
          console.log(`  [dry] ${mapped.title.substring(0, 60)}`);
          sourceSuccess++; globalSuccess++; pointId++;
          continue;
        }

        const vector = await embed(mapped.description);
        if (!vector?.length) { globalErrors++; continue; }

        await upsertPoint(pointId, vector, payload);
        sourceSuccess++; globalSuccess++; pointId++;

        process.stdout.write(`  ${sourceSuccess} objects · ${mapped.title.substring(0, 40)}\r`);
        await sleep(120);
      } catch (e) {
        globalErrors++;
        await sleep(300);
      }
    }

    console.log(`\n  ✓ ${sourceSuccess} objects from ${source.name} (${sourceSkipped} skipped)`);
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Street art harvest complete`);
  console.log(`  → ${globalSuccess} total objects embedded into '${COLLECTION}'`);
  console.log(`  → ${globalErrors} errors`);
  console.log(`  → Sources: Vancouver (OGL), Brussels (CC BY 4.0), NYC Parks,`);
  console.log(`             Melbourne (CC BY 4.0), San Francisco (Public Domain), Chicago (Public Domain)\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
