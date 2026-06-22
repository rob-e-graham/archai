#!/usr/bin/env node
// ARCHAI — National Gallery of Art Open Data harvester
//
// Metadata is CC0. Images are included only when published_images.csv marks
// the individual image openaccess=1. Images marked 0 are fair-use display
// derivatives and are deliberately excluded from ARCHAI's public demo.
//
// Usage:
//   node nga-harvester.js --dry-run --limit 30
//   node nga-harvester.js --limit 150

import { fetchCsvRows } from './lib/csv-stream.js';

const DATA_BASE = 'https://raw.githubusercontent.com/NationalGalleryOfArt/opendata/main/data';
const OBJECTS_URL = `${DATA_BASE}/objects.csv`;
const IMAGES_URL = `${DATA_BASE}/published_images.csv`;
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const COLLECTION = 'archai_nga';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const POINT_ID_OFFSET = 13000000;

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const inline = args.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const LIMIT = Number.parseInt(getArg('limit', '150'), 10);
const DRY_RUN = args.includes('--dry-run');

function text(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function integer(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stableTieBreaker(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function iiifSize(base, size) {
  return base ? `${base}/full/!${size},${size}/0/default.jpg` : '';
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
  const sample = await embed('National Gallery of Art');
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

async function collectOpenImages() {
  const images = new Map();
  let open = 0;
  let restricted = 0;

  for await (const row of await fetchCsvRows(IMAGES_URL, 'ARCHAI NGA Harvester')) {
    if (row.openaccess !== '1') {
      restricted++;
      continue;
    }
    const objectId = integer(row.depictstmsobjectid, -1);
    if (objectId < 0 || !row.iiifurl) continue;
    open++;
    const candidate = {
      uuid: row.uuid,
      iiifUrl: row.iiifurl,
      thumbnail: row.iiifthumburl || iiifSize(row.iiifurl, 200),
      assistiveText: text(row.assistivetext),
      viewType: row.viewtype,
      sequence: integer(row.sequence, 9999),
      width: integer(row.width),
      height: integer(row.height),
      openAccess: true,
    };
    const current = images.get(objectId);
    const candidateRank = (candidate.viewType === 'primary' ? 0 : 1) * 10000 + candidate.sequence;
    const currentRank = current ? (current.viewType === 'primary' ? 0 : 1) * 10000 + current.sequence : Infinity;
    if (!current || candidateRank < currentRank) images.set(objectId, candidate);
  }

  return { images, open, restricted };
}

function richness(row, image) {
  return [
    row.title,
    row.attribution,
    row.displaydate,
    row.medium,
    row.dimensions,
    row.classification,
    row.provenancetext,
    row.wikidataid,
    image.assistiveText,
  ].reduce((score, value) => score + (text(value) ? 1 : 0), 0);
}

function normalize(row, image) {
  const objectId = integer(row.objectid);
  const title = text(row.title) || 'Untitled';
  const classification = text(row.visualbrowserclassification || row.classification || row.subclassification) || 'Artwork';
  const artist = text(row.attribution);
  const description = image.assistiveText;
  const sourceUrl = `https://www.nga.gov/collection/art-object-page.${objectId}.html`;
  const embeddingText = [
    title,
    artist,
    text(row.displaydate),
    text(row.medium),
    classification,
    description,
    text(row.provenancetext),
    text(row.creditline),
  ].filter(Boolean).join('. ');

  return {
    canonical_id: `nga:${objectId}`,
    source: 'nga',
    source_record_id: String(objectId),
    source_institution: 'National Gallery of Art, Washington',
    source_country: 'United States',
    source_language: 'en',
    available_languages: ['en'],
    title,
    object_type: classification,
    discipline: text(row.departmentabbr || row.classification),
    category: classification,
    date_range: text(row.displaydate),
    begin_year: integer(row.beginyear) || null,
    end_year: integer(row.endyear) || null,
    registration_number: text(row.accessionnum) || String(objectId),
    museum_location: 'National Gallery of Art, Washington',
    description,
    medium: text(row.medium),
    artist,
    dimensions: text(row.dimensions),
    provenance: text(row.provenancetext),
    credit_line: text(row.creditline),
    inscription: text(row.inscription),
    markings: text(row.markings),
    wikidata_id: text(row.wikidataid),
    source_url: sourceUrl,
    media_thumbnail: image.thumbnail,
    media_medium: iiifSize(image.iiifUrl, 800),
    media_large: iiifSize(image.iiifUrl, 1600),
    media_iiif_base: image.iiifUrl,
    media_uuid: image.uuid,
    media_width: image.width,
    media_height: image.height,
    media_assistive_text: description,
    licence: 'CC0 — NGA Open Access',
    legal_status: 'open_access',
    metadata_licence: 'CC0 1.0',
    media_licence: 'NGA Open Access — openaccess=1',
    media_rights_mode: 'item-level published_images.openaccess flag',
    media_permission_type: ['openaccess=1'],
    rights_notes: [
      'Metadata released by the National Gallery of Art under CC0.',
      'Image included because published_images.csv explicitly marks openaccess=1.',
    ],
    source_collection_label: 'National Gallery of Art Open Data',
    source_type: 'image',
    embedding_text: embeddingText,
    richness_score: richness(row, image),
  };
}

function selectDiverse(buckets, limit) {
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => b.richness_score - a.richness_score || stableTieBreaker(a.canonical_id) - stableTieBreaker(b.canonical_id));
  }
  const ordered = [...buckets.keys()].sort((a, b) => (buckets.get(b)?.[0]?.richness_score || 0) - (buckets.get(a)?.[0]?.richness_score || 0));
  const selected = [];
  while (selected.length < limit) {
    let added = 0;
    for (const key of ordered) {
      const next = buckets.get(key)?.shift();
      if (!next) continue;
      selected.push(next);
      added++;
      if (selected.length >= limit) break;
    }
    if (!added) break;
  }
  return selected;
}

async function collectObjects(images) {
  const buckets = new Map();
  let eligible = 0;
  for await (const row of await fetchCsvRows(OBJECTS_URL, 'ARCHAI NGA Harvester')) {
    const objectId = integer(row.objectid, -1);
    const image = images.get(objectId);
    if (!image || row.isvirtual === '1') continue;
    eligible++;
    const payload = normalize(row, image);
    const bucketName = payload.category || 'Artwork';
    if (!buckets.has(bucketName)) buckets.set(bucketName, []);
    const bucket = buckets.get(bucketName);
    bucket.push(payload);
    if (bucket.length > Math.max(LIMIT * 2, 100)) {
      bucket.sort((a, b) => b.richness_score - a.richness_score || stableTieBreaker(a.canonical_id) - stableTieBreaker(b.canonical_id));
      bucket.length = Math.max(LIMIT, 50);
    }
  }
  return { selected: selectDiverse(buckets, LIMIT), eligible, categories: buckets.size };
}

async function main() {
  console.log('\n  ARCHAI — National Gallery of Art Open Data Harvester\n');
  console.log(`  Mode: ${DRY_RUN ? 'dry run' : 'live'} · limit ${LIMIT}`);
  console.log('  Legal gate: published_images.openaccess must equal 1\n');

  console.log('  Reading NGA image publication records...');
  const imageResult = await collectOpenImages();
  console.log(`  Open-access images: ${imageResult.open}`);
  console.log(`  Restricted/fair-use images excluded: ${imageResult.restricted}`);
  console.log(`  Objects with a preferred open image: ${imageResult.images.size}\n`);

  console.log('  Reading and joining NGA object records...');
  const objectResult = await collectObjects(imageResult.images);
  console.log(`  Eligible image-backed objects: ${objectResult.eligible}`);
  console.log(`  Classification buckets: ${objectResult.categories}`);
  console.log(`  Selected for ARCHAI: ${objectResult.selected.length}\n`);

  if (DRY_RUN) {
    for (const row of objectResult.selected.slice(0, 20)) {
      console.log(`  [DRY] ${row.title} · ${row.artist || 'Unknown artist'} · ${row.category}`);
    }
    console.log('\n  Dry run complete — no Qdrant writes.\n');
    return;
  }

  await ensureCollection();
  let success = 0;
  let errors = 0;
  for (const payload of objectResult.selected) {
    try {
      const vector = await embed(payload.embedding_text);
      await upsertPoint(POINT_ID_OFFSET + integer(payload.source_record_id), vector, payload);
      success++;
      process.stdout.write(`  [${success}/${objectResult.selected.length}] ${payload.title.slice(0, 58)}\r`);
    } catch (error) {
      errors++;
      console.error(`\n  Skip ${payload.canonical_id}: ${error.message}`);
    }
  }
  console.log(`\n\n  Complete: ${success} upserted, ${errors} skipped → ${COLLECTION}\n`);
}

main().catch((error) => {
  console.error(`\n  NGA harvest failed: ${error.message}\n`);
  process.exit(1);
});
