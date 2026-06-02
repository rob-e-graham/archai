#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Tokyo Museum Collection (ToMuCo) Harvester
// Bilingual Japanese/English museum-object onboarding from the
// Tokyo Museum Collection open metadata API.
//
// Terms:
//   - Metadata is published as open data by ToMuCo
//   - Item-level image references and license URIs are preserved
//   - Source-provider content terms remain attached per record
//
// Docs:
//   https://museumcollection.tokyo/en/developer/
//   https://museumcollection.tokyo/en/terms/
//
// Usage:
//   node tomuco-harvester.js --dry-run
//   node tomuco-harvester.js --limit 120
// ══════════════════════════════════════════════════════════════════

import {
  normalizeMultilingualField,
  mergeLanguageMaps,
  pickBestLanguage,
  pickPrimaryLanguage,
  collectLanguages,
  buildDisplayTexts
} from './lib/multilingual.js';

const TOMUCO_API = 'https://museumcollection.tokyo/works/';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_tomuco';
const EMBED_MODEL = 'nomic-embed-text';
const POINT_ID_OFFSET = 10000000;

const SEARCH_QUERIES = [
  { museum: 'topmuseum', focus: 'photography' },
  { museum: 'mot-art-museum', focus: 'contemporary-art' },
  { museum: 'edo-tokyo-museum', focus: 'history-print' },
  { museum: 'tobikan', focus: 'art-museum' },
  { museum: 'teien-art-museum', focus: 'design-architecture' },
  { museum: 'tatemonoen', focus: 'architecture-history' }
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const LIMIT = parseInt(getArg('limit', '120'), 10);
const QUERY_SIZE = parseInt(getArg('query-size', '30'), 10);
const MIN_RECORD_SCORE = parseInt(getArg('min-score', '10'), 10);
const MAX_OFFSETS = parseInt(getArg('pages', '8'), 10);
const DRY_RUN = args.includes('--dry-run');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function uniq(values = []) {
  return [...new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean))];
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstNonEmpty(...value);
      if (nested) return nested;
    } else if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function langMap(entries = []) {
  const out = {};
  for (const entry of entries || []) {
    const lang = entry?.['@lang'] || entry?.lang || 'und';
    const value = entry?.['@value'] || entry?.value || '';
    if (!value) continue;
    out[String(lang).toLowerCase()] = String(value).trim();
  }
  return out;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'ARCHAI ToMuCo Harvester' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
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

async function ensureCollection() {
  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
    if (res.ok) {
      console.log(`  ✓ Collection '${COLLECTION}' exists`);
      return;
    }
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

function graphFromResponse(data) {
  if (Array.isArray(data?.['@graph'])) return data['@graph'];
  if (data?.['@type'] === 'schema:CreativeWork') return [data];
  return [];
}

function buildQueryUrl({ museum, keyword, limit, offset = 0 }) {
  const params = new URLSearchParams({
    output: 'json',
    limit: String(limit || QUERY_SIZE),
    offset: String(offset)
  });
  if (museum) params.append('museums[]', museum);
  if (keyword) params.set('keyword', keyword);
  return `${TOMUCO_API}?${params.toString()}`;
}

function extractIdentifier(row, name) {
  for (const ident of asArray(row['schema:identifier'])) {
    if (ident?.['schema:name'] === name) return ident?.['schema:value'] || '';
  }
  return '';
}

function scoreRecord(row, focus) {
  const image = asArray(row['schema:image'])[0];
  const title = pickBestLanguage(langMap(asArray(row['schema:name'])));
  const material = pickBestLanguage(langMap(asArray(row['schema:material'])));
  const genre = uniq(asArray(row['schema:genre']).map(entry => entry?.['skos:preflabel']?.['@value'] || ''));
  const desc = pickBestLanguage(langMap(asArray(row['schema:description'])));
  const license = firstNonEmpty(row['schema:license']);
  const creatorNames = langMap(asArray(row['schema:creator']?.['schema:name']));

  let score = 0;
  if (image?.['schema:contentUrl']) score += 5;
  if (license) score += 3;
  if (title) score += 3;
  if (material) score += 2;
  if (genre.length) score += 2;
  if (desc) score += 2;
  if (Object.keys(creatorNames).length) score += 2;
  if (firstNonEmpty(row['schema:dateCreated'])) score += 1;
  if (focus.includes('photography') || focus.includes('woodblock') || focus.includes('architecture')) score += 1;
  return score;
}

function normalizeSourceRecord(row, focus) {
  const titleTranslations = normalizeMultilingualField(langMap(asArray(row['schema:name'])));
  const descriptionTranslations = normalizeMultilingualField(langMap(asArray(row['schema:description'])));
  const creatorTranslations = normalizeMultilingualField(langMap(asArray(row['schema:creator']?.['schema:name'])));
  const mediumTranslations = normalizeMultilingualField(langMap(asArray(row['schema:material'])));
  const sizeTranslations = normalizeMultilingualField(langMap(asArray(row['schema:size'])));
  const genreTranslations = normalizeMultilingualField({
    ja: uniq(asArray(row['schema:genre']).map(entry => entry?.['skos:preflabel']?.['@value'] || '')).join(', ')
  });
  const licenseTranslations = normalizeMultilingualField({ und: firstNonEmpty(row['schema:license']) });

  const title = pickBestLanguage(titleTranslations) || 'Untitled';
  const description = pickBestLanguage(descriptionTranslations) || '';
  const medium = pickBestLanguage(mediumTranslations) || '';
  const creators = pickBestLanguage(creatorTranslations) || '';
  const dimensions = pickBestLanguage(sizeTranslations) || firstNonEmpty(row['schema:size']?.value, row['schema:size']);
  const license = pickBestLanguage(licenseTranslations) || 'License URI not supplied';
  const image = asArray(row['schema:image'])[0] || {};
  const imageUrl = image['schema:contentUrl'] || image['@id'] || '';
  const imageCredit = image['schema:creditText'] || '';
  const associatedMedia = asArray(row['schema:associatedMedia']).map(media => media?.['@id'] || media?.['schema:contentUrl'] || '').filter(Boolean);
  const institutionNames = [];
  for (const coll of asArray(row['schema:isPartOf'])) {
    for (const maintainer of asArray(coll?.['schema:maintainer'])) {
      const names = langMap(asArray(maintainer?.['schema:name']));
      if (names.en) institutionNames.push(names.en);
      else if (names.ja) institutionNames.push(names.ja);
    }
  }
  const institution = firstNonEmpty(...institutionNames) || 'Tokyo Museum Collection';
  const accession = extractIdentifier(row, 'accession number');
  const tmcId = extractIdentifier(row, 'TMC ID');
  const sourceUrl = row['@id'] || `${TOMUCO_API}${tmcId}/`;
  const genresJa = uniq(asArray(row['schema:genre']).map(entry => entry?.['skos:preflabel']?.['@value'] || ''));
  const availableLanguages = collectLanguages(titleTranslations, descriptionTranslations, creatorTranslations, mediumTranslations, sizeTranslations, genreTranslations);
  const sourceLanguage = pickPrimaryLanguage([titleTranslations, descriptionTranslations, creatorTranslations, mediumTranslations], 'ja');
  const displayTexts = buildDisplayTexts({
    titleMap: titleTranslations,
    descriptionMap: descriptionTranslations,
    primaryLanguage: sourceLanguage
  });

  const embeddingText = [
    title,
    titleTranslations.ja,
    creators,
    creatorTranslations.ja,
    medium,
    mediumTranslations.ja,
    description,
    descriptionTranslations.ja,
    genresJa.join(', '),
    row['schema:dateCreated'],
    dimensions,
    institution,
    focus
  ].filter(Boolean).join('. ');

  return {
    canonical_id: `tomuco:${tmcId || accession || sourceUrl}`,
    source: 'tomuco',
    source_record_id: tmcId || accession,
    source_institution: institution,
    source_country: 'Japan',
    source_language: sourceLanguage,
    available_languages: availableLanguages,
    title,
    object_type: firstNonEmpty(genresJa[0], focus, 'Museum object'),
    discipline: 'Museum Collection',
    category: firstNonEmpty(genresJa[0], focus, 'Museum object'),
    date_range: firstNonEmpty(row['schema:dateCreated']),
    registration_number: accession || tmcId,
    museum_location: institution,
    description,
    medium,
    artist: creators,
    culture: 'Japan',
    period: firstNonEmpty(row['schema:dateCreated']),
    place_of_origin: 'Tokyo / Japan',
    credit_line: imageCredit,
    dimensions,
    wall_description: description,
    tombstone: [title, creators, row['schema:dateCreated'], institution].filter(Boolean).join('. '),
    licence: license,
    source_url: sourceUrl,
    media_thumbnail: imageUrl,
    media_medium: imageUrl,
    media_large: imageUrl,
    associated_media: associatedMedia,
    title_translations: titleTranslations,
    description_translations: descriptionTranslations,
    creator_translations: creatorTranslations,
    medium_translations: mediumTranslations,
    size_translations: sizeTranslations,
    genre_translations: genreTranslations,
    display_texts: displayTexts,
    translation_status: availableLanguages.length > 1 ? 'source_multilingual' : 'source_single_language',
    translation_ready: availableLanguages.length > 0,
    classification_terms: genresJa,
    keyword_terms: uniq([focus, ...genresJa, institution]),
    rights_notes: uniq([
      'Metadata acquired via ToMuCo open-data API',
      'Source provider terms still apply to API-linked content',
      license,
      imageCredit
    ]),
    source_collection_label: institution,
    source_type: 'CreativeWork',
    focus_area: focus,
    media_rights_title: license,
    media_rights_mode: 'open_data_item_license',
    media_permission_type: ['item-license'],
    embedding_text: embeddingText
  };
}

function selectDiverseRecords(rows, limit) {
  const buckets = new Map();
  for (const row of rows) {
    const focus = row.focus || 'misc';
    if (!buckets.has(focus)) buckets.set(focus, []);
    buckets.get(focus).push(row);
  }

  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => b.recordScore - a.recordScore);
  }

  const orderedFocuses = [...buckets.keys()].sort((a, b) => {
    const aTop = buckets.get(a)?.[0]?.recordScore || 0;
    const bTop = buckets.get(b)?.[0]?.recordScore || 0;
    return bTop - aTop;
  });

  const selected = [];
  while (selected.length < limit) {
    let addedThisRound = 0;
    for (const focus of orderedFocuses) {
      const bucket = buckets.get(focus);
      if (!bucket?.length) continue;
      selected.push(bucket.shift());
      addedThisRound++;
      if (selected.length >= limit) break;
    }
    if (!addedThisRound) break;
  }

  return selected;
}

async function main() {
  console.log('\n  ╔════════════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — ToMuCo Harvester                  ║');
  console.log('  ║   Tokyo museums · bilingual · image-aware     ║');
  console.log('  ╚════════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('  ⚙ DRY RUN — no writes to Qdrant');
  console.log(`  ⚙ Limit: ${LIMIT}`);
  console.log(`  ⚙ Query size: ${QUERY_SIZE}`);
  console.log(`  ⚙ Offset windows per museum: ${MAX_OFFSETS}`);
  console.log(`  ⚙ Min source record score: ${MIN_RECORD_SCORE}\n`);

  if (!DRY_RUN) {
    try {
      await fetch(`${OLLAMA_URL}/api/tags`);
      console.log('  ✓ Ollama online');
    } catch {
      console.error('  ✗ Ollama not reachable');
      process.exit(1);
    }

    try {
      await fetch(`${QDRANT_URL}/collections`);
      console.log('  ✓ Qdrant online');
    } catch {
      console.error('  ✗ Qdrant not reachable');
      process.exit(1);
    }

    await ensureCollection();
  }

  const seen = new Map();
  let skippedNoImage = 0;
  let skippedLowScore = 0;

  console.log('\n  Searching ToMuCo…\n');

  for (const search of SEARCH_QUERIES) {
    for (let pageIndex = 0; pageIndex < MAX_OFFSETS; pageIndex++) {
      const offset = pageIndex * QUERY_SIZE;
      try {
        const rows = graphFromResponse(await fetchJSON(buildQueryUrl({
          museum: search.museum,
          keyword: search.keyword,
          limit: QUERY_SIZE,
          offset
        })));
        let added = 0;

        for (const row of rows) {
          const sourceId = extractIdentifier(row, 'TMC ID') || row['@id'];
          if (!sourceId || seen.has(sourceId)) continue;
          if (!asArray(row['schema:image']).length) {
            skippedNoImage++;
            continue;
          }

          const recordScore = scoreRecord(row, search.focus);
          if (recordScore < MIN_RECORD_SCORE) {
            skippedLowScore++;
            continue;
          }

          seen.set(sourceId, { row, focus: search.focus, recordScore });
          added++;
        }

        process.stdout.write(`  → ${search.museum} · offset ${offset} — ${rows.length} rows, ${added} kept (total: ${seen.size})\n`);
        await sleep(220);
      } catch (err) {
        process.stdout.write(`  ⚠ ${search.museum} · offset ${offset} — ${err.message}\n`);
      }
    }
  }

  const ranked = selectDiverseRecords([...seen.values()], LIMIT);

  console.log(`\n  ✓ ${seen.size} suitable ToMuCo records found`);
  console.log(`  → Skipped no image: ${skippedNoImage}`);
  console.log(`  → Skipped low score: ${skippedLowScore}`);
  console.log(`  → Processing ${ranked.length}\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < ranked.length; i++) {
    const row = ranked[i];
    try {
      const payload = normalizeSourceRecord(row.row, row.focus);

      if (DRY_RUN) {
        success++;
        process.stdout.write(`  [DRY] ${payload.title.substring(0, 56)} — ${payload.source_institution} · ${payload.licence}\n`);
      } else {
        const vector = await embed(payload.embedding_text);
        if (!vector || !vector.length) {
          errors++;
          continue;
        }
        await upsertPoint(POINT_ID_OFFSET + i, vector, payload);
        success++;
        const pct = Math.round(((i + 1) / ranked.length) * 100);
        process.stdout.write(`  [${pct}%] ${success}/${i + 1} · ${payload.title.substring(0, 48)}${payload.title.length > 48 ? '…' : ''}\r`);
      }

      await sleep(150);
    } catch {
      errors++;
      await sleep(240);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ ToMuCo harvest complete`);
  console.log(`  → ${success} objects into '${COLLECTION}'`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → Bilingual Japanese/English fields preserved\n`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
