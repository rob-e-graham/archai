#!/usr/bin/env node
// ARCHAI — NASA Image and Video Library harvester
//
// Adds rights-clean space/science media objects for testing image, video, and
// audio workflows. NASA media is generally not copyrighted, but ARCHAI still
// stores source URLs, attribution, and no-endorsement notes on every record.
//
// Usage:
//   node nasa-harvester.js --dry-run --limit 40
//   node nasa-harvester.js --limit 120
//   node nasa-harvester.js --media-type video --limit 40

const NASA_API = 'https://images-api.nasa.gov';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const COLLECTION = 'archai_nasa';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const POINT_ID_OFFSET = 18_000_000;

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const inline = args.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const LIMIT = Number.parseInt(getArg('limit', '120'), 10);
const MEDIA_TYPE_FILTER = getArg('media-type', 'all');
const DRY_RUN = args.includes('--dry-run');

const QUERY_PLAN = [
  { q: 'Earthrise Apollo', mediaTypes: ['image', 'video'] },
  { q: 'Apollo mission control', mediaTypes: ['image', 'video'] },
  { q: 'Voyager Golden Record', mediaTypes: ['image', 'audio'] },
  { q: 'Mars rover panorama', mediaTypes: ['image', 'video'] },
  { q: 'Hubble deep field', mediaTypes: ['image'] },
  { q: 'James Webb telescope image', mediaTypes: ['image'] },
  { q: 'space shuttle launch', mediaTypes: ['image', 'video', 'audio'] },
  { q: 'International Space Station Earth observation', mediaTypes: ['image', 'video'] },
  { q: 'mission control computer', mediaTypes: ['image'] },
  { q: 'Landsat satellite', mediaTypes: ['image', 'video'] },
  { q: 'NASA archival film', mediaTypes: ['video'] },
  { q: 'NASA sound space audio', mediaTypes: ['audio'] },
];

function text(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function safeUrl(url) {
  return text(url).replace(/^http:\/\//, 'https://');
}

function fnv1a(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shouldSkipRecord(data) {
  const blob = [
    data.title,
    data.description,
    data.description_508,
    ...(Array.isArray(data.keywords) ? data.keywords : []),
  ].join(' ').toLowerCase();

  return [
    'logo',
    'insignia',
    'seal',
    'patch',
    'emblem',
    'meatball',
  ].some((term) => blob.includes(term));
}

async function fetchJson(url, retries = 4) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ARCHAI/1.0 research prototype (rob@fineartmedia.tech)',
      },
    }).catch((error) => ({ ok: false, status: 0, error }));

    if (response.ok) return response.json();
    if (attempt === retries - 1) throw new Error(`NASA request failed (${response.status}): ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
  }
}

async function embed(value) {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: value.slice(0, 3000) }),
  });
  if (!response.ok) throw new Error(`Ollama embedding failed (${response.status})`);
  const payload = await response.json();
  if (!Array.isArray(payload.embedding) || !payload.embedding.length) throw new Error('Ollama returned no embedding');
  return payload.embedding;
}

async function ensureCollection() {
  const existing = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`).catch(() => null);
  if (existing?.ok) return;
  const sample = await embed('NASA Image and Video Library');
  const response = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors: { size: sample.length, distance: 'Cosine' } }),
  });
  if (!response.ok) throw new Error(`Could not create Qdrant collection (${response.status})`);
}

async function upsertPoint(id, vector, payload) {
  const response = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [{ id, vector, payload }] }),
  });
  if (!response.ok) throw new Error(`Qdrant upsert failed (${response.status})`);
}

function pickImageLinks(item) {
  const links = Array.isArray(item.links) ? item.links : [];
  const imageLinks = links.filter((link) => link.render === 'image' && link.href);
  const byRel = (rel) => imageLinks.find((link) => link.rel === rel)?.href;
  const byName = (needle) => imageLinks.find((link) => link.href.includes(needle))?.href;
  return {
    thumb: safeUrl(byRel('preview') || byName('~thumb') || byName('~small') || imageLinks[0]?.href),
    medium: safeUrl(byName('~medium') || byName('~large') || imageLinks[0]?.href),
    large: safeUrl(byName('~large') || byName('~orig') || byName('~medium') || imageLinks[0]?.href),
  };
}

async function pickAssetLinks(item, mediaType) {
  if (mediaType === 'image' || !item.href) return {};
  const manifest = await fetchJson(item.href).catch(() => []);
  if (!Array.isArray(manifest)) return {};
  const https = manifest.map(safeUrl);
  return {
    video: mediaType === 'video'
      ? (https.find((url) => url.includes('~preview.mp4')) || https.find((url) => url.includes('~small.mp4')) || https.find((url) => url.endsWith('.mp4')) || '')
      : '',
    audio: mediaType === 'audio'
      ? (https.find((url) => url.endsWith('.mp3')) || https.find((url) => url.endsWith('.m4a')) || https.find((url) => url.endsWith('.wav')) || '')
      : '',
    captions: https.find((url) => url.endsWith('.srt')) || '',
  };
}

function normalize(item, assetLinks = {}) {
  const data = item.data?.[0] || {};
  const nasaId = text(data.nasa_id);
  const mediaType = text(data.media_type || 'image').toLowerCase();
  const imageLinks = pickImageLinks(item);
  const description = text(data.description || data.description_508);
  const title = text(data.title) || nasaId || 'NASA media record';
  const keywords = Array.isArray(data.keywords) ? data.keywords.map(text).filter(Boolean) : [];
  const date = text(data.date_created || '').slice(0, 10);
  const center = text(data.center);
  const sourceUrl = `https://images.nasa.gov/details/${encodeURIComponent(nasaId)}`;
  const embeddingText = [
    title,
    description,
    keywords.join(', '),
    date,
    center,
    mediaType,
    'NASA Image and Video Library',
  ].filter(Boolean).join('. ');

  return {
    canonical_id: `nasa:${nasaId || fnv1a(title)}`,
    source: 'nasa',
    source_record_id: nasaId,
    source_institution: 'NASA Image and Video Library',
    source_country: 'United States',
    source_language: 'en',
    available_languages: ['en'],
    title,
    object_type: mediaType === 'video' ? 'Moving image' : mediaType === 'audio' ? 'Sound recording' : 'Image',
    discipline: 'Science and technology media',
    category: 'Space exploration media',
    date_range: date,
    begin_year: Number.parseInt(date.slice(0, 4), 10) || null,
    registration_number: nasaId,
    museum_location: center ? `NASA ${center}` : 'NASA',
    description,
    medium: mediaType,
    artist: 'NASA',
    creator: center ? `NASA ${center}` : 'NASA',
    keywords,
    source_url: sourceUrl,
    source_manifest_url: safeUrl(item.href),
    media_thumbnail: imageLinks.thumb,
    media_medium: imageLinks.medium || imageLinks.thumb,
    media_large: imageLinks.large || imageLinks.medium || imageLinks.thumb,
    media_video: assetLinks.video || '',
    media_audio: assetLinks.audio || '',
    media_captions: assetLinks.captions || '',
    media_type: mediaType,
    source_type: mediaType,
    licence: 'NASA media usage guidelines — generally not copyrighted; no endorsement implied',
    legal_status: 'open_access',
    metadata_licence: 'NASA public metadata',
    media_licence: 'NASA media usage guidelines',
    media_rights_mode: 'official NASA Image and Video Library API',
    media_public_display_allowed: true,
    poster_download_allowed: mediaType === 'image',
    media_rights_basis: 'NASA content is generally not copyrighted; ARCHAI preserves NASA attribution and no-endorsement context',
    media_permission_type: ['nasa-media-usage-guidelines'],
    rights_notes: [
      'NASA material is generally not copyrighted unless otherwise noted.',
      'NASA names, initials, emblems, and logos may not be used to imply endorsement.',
      'ARCHAI excludes obvious logo, insignia, seal, patch, and emblem records from this harvest.',
    ],
    source_collection_label: 'NASA Image and Video Library',
    embedding_text: embeddingText,
  };
}

async function searchItems(query, mediaType) {
  const params = new URLSearchParams({
    q: query,
    media_type: mediaType,
    page_size: '80',
  });
  const response = await fetchJson(`${NASA_API}/search?${params.toString()}`);
  return response.collection?.items || [];
}

async function main() {
  console.log('\n  ╔════════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — NASA Media Harvester            ║');
  console.log('  ║   Images · video · audio · public media    ║');
  console.log('  ╚════════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes]\n');

  await fetch(`${QDRANT_URL}/collections`).then((res) => {
    if (!res.ok) throw new Error(`Qdrant not reachable (${res.status})`);
  });
  console.log('  ✓ Qdrant online');

  await fetch(`${OLLAMA_URL}/api/tags`).then((res) => {
    if (!res.ok) throw new Error(`Ollama not reachable (${res.status})`);
  });
  console.log('  ✓ Ollama online');

  if (!DRY_RUN) await ensureCollection();

  const seen = new Set();
  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (const plan of QUERY_PLAN) {
    if (success >= LIMIT) break;
    const mediaTypes = MEDIA_TYPE_FILTER === 'all'
      ? plan.mediaTypes
      : plan.mediaTypes.filter((type) => type === MEDIA_TYPE_FILTER);
    for (const mediaType of mediaTypes) {
      if (success >= LIMIT) break;
      console.log(`  → ${plan.q} · ${mediaType}`);
      const items = await searchItems(plan.q, mediaType).catch((error) => {
        console.warn(`    search failed: ${error.message}`);
        return [];
      });

      for (const item of items) {
        if (success >= LIMIT) break;
        const data = item.data?.[0] || {};
        const nasaId = text(data.nasa_id);
        if (!nasaId || seen.has(nasaId) || shouldSkipRecord(data)) {
          skipped++;
          continue;
        }

        try {
          const assets = await pickAssetLinks(item, mediaType);
          const payload = normalize(item, assets);
          if (!payload.media_thumbnail) {
            skipped++;
            continue;
          }
          seen.add(nasaId);

          if (DRY_RUN) {
            console.log(`    [dry] ${payload.media_type.padEnd(5)} ${payload.title.slice(0, 76)}`);
            success++;
            continue;
          }

          const vector = await embed(payload.embedding_text);
          const id = POINT_ID_OFFSET + (fnv1a(payload.canonical_id) % 900_000);
          await upsertPoint(id, vector, payload);
          success++;
          process.stdout.write(`    ${success}/${LIMIT} ${payload.media_type.padEnd(5)} ${payload.title.slice(0, 68)}\r`);
          await new Promise((resolve) => setTimeout(resolve, 110));
        } catch (error) {
          errors++;
        }
      }
    }
  }

  console.log('\n\n  ════════════════════════════════════════════');
  console.log(`  ✓ NASA harvest ${DRY_RUN ? 'dry-run' : 'complete'}`);
  console.log(`  → ${success} records ${DRY_RUN ? 'selected' : `embedded into '${COLLECTION}'`}`);
  console.log(`  → ${skipped} skipped (duplicates, logos/patches, missing preview)`);
  console.log(`  → ${errors} errors`);
  console.log('  → Media policy: NASA public media with attribution + no-endorsement context\n');
}

main().catch((error) => {
  console.error('\n  ✗ NASA harvester failed');
  console.error(`  → ${error.message}\n`);
  process.exit(1);
});
