#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Brasiliana Museus Harvester
// Brazilian museum-object onboarding via Brasiliana Museus /
// Tainacan JSON API.
//
// Terms:
//   - Brasiliana Museus presents open data, but item-level
//     reproduction conditions still govern image reuse
//   - This harvester only keeps image-backed items with clearly
//     public/open-friendly reproduction terms for the demo
//
// Docs:
//   https://brasiliana.museus.gov.br/dados-abertos/
//   https://brasiliana.museus.gov.br/sobre-a-brasiliana-museus/
//
// Usage:
//   node brasiliana-harvester.js --dry-run
//   node brasiliana-harvester.js --limit 120
// ══════════════════════════════════════════════════════════════════

import {
  normalizeMultilingualField,
  pickBestLanguage,
  pickPrimaryLanguage,
  collectLanguages,
  buildDisplayTexts
} from './lib/multilingual.js';

const BR_API = 'https://brasiliana.museus.gov.br/wp-json/tainacan/v2/items';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_brasiliana';
const EMBED_MODEL = 'nomic-embed-text';
const POINT_ID_OFFSET = 12000000;
const COLLECTION_ID = '5';

const SEARCH_QUERIES = [
  { q: 'pintura', focus: 'painting' },
  { q: 'fotografia', focus: 'photography' },
  { q: 'escultura', focus: 'sculpture' },
  { q: 'máscara', focus: 'mask' },
  { q: 'cerâmica', focus: 'ceramic' },
  { q: 'indígena', focus: 'indigenous' },
  { q: 'instrumento', focus: 'instrument' },
  { q: 'tecido', focus: 'textile' },
  { q: 'mobiliário', focus: 'furniture' },
  { q: 'mapa', focus: 'map' }
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const LIMIT = parseInt(getArg('limit', '120'), 10);
const QUERY_SIZE = parseInt(getArg('query-size', '25'), 10);
const MIN_RECORD_SCORE = parseInt(getArg('min-score', '10'), 10);
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

function slugToLabel(value = '') {
  return String(value)
    .replace(/^tnc_tax_\d+-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, m => m.toUpperCase())
    .trim();
}

function metadataValue(item, key) {
  return item?.metadata?.[key]?.value_as_string || item?.metadata?.[key]?.value || '';
}

function metadataObject(item, key) {
  return item?.metadata?.[key]?.value || null;
}

function parseMuseum(item) {
  const classes = item?.class_list || [];
  const museumClass = classes.find(entry => String(entry).startsWith('tnc_tax_34-'));
  return museumClass ? slugToLabel(museumClass) : 'Brasiliana Museus';
}

function isOpenRights(text = '') {
  const value = String(text).toLowerCase();
  return (
    value.includes('domínio público') ||
    value.includes('dominio publico') ||
    value.includes('creative commons') ||
    value.includes('acesso aberto')
  );
}

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'ARCHAI Brasiliana Harvester' } });
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

function buildQueryUrl({ search, page }) {
  const params = new URLSearchParams({
    collection_id: COLLECTION_ID,
    search,
    perpage: String(QUERY_SIZE),
    paged: String(page || 1)
  });
  return `${BR_API}?${params.toString()}`;
}

function scoreRecord(item, focus) {
  const title = firstNonEmpty(item.title, metadataValue(item, 'title'), metadataValue(item, 'denominacao'));
  const description = firstNonEmpty(item.description, metadataValue(item, 'description'));
  const rights = metadataValue(item, 'condicoes-de-reproducao');
  const classification = metadataObject(item, 'classificacao')?.name || '';
  const image = item.document || '';

  let score = 0;
  if (image) score += 5;
  if (title) score += 3;
  if (description) score += 2;
  if (classification) score += 2;
  if (rights) score += 2;
  if (focus.includes('indigenous') || focus.includes('instrument') || focus.includes('mask')) score += 1;
  return score;
}

function normalizeSourceRecord(item, focus) {
  const title = firstNonEmpty(item.title, metadataValue(item, 'title'), metadataValue(item, 'denominacao')) || 'Sem título';
  const description = firstNonEmpty(item.description, metadataValue(item, 'description'));
  const classification = metadataObject(item, 'classificacao');
  const rights = metadataValue(item, 'condicoes-de-reproducao');
  const productionDate = metadataValue(item, 'data-de-producao');
  const place = metadataValue(item, 'local-de-producao');
  const museum = parseMuseum(item);
  const dimensions = [
    metadataValue(item, 'dimensoes-altura') && `altura ${metadataValue(item, 'dimensoes-altura')} cm`,
    metadataValue(item, 'dimensoes-largura') && `largura ${metadataValue(item, 'dimensoes-largura')} cm`,
    metadataValue(item, 'dimensoes-profundidade-comprimento') && `profundidade/comprimento ${metadataValue(item, 'dimensoes-profundidade-comprimento')} cm`,
    metadataValue(item, 'dimensoes-diametro') && `diâmetro ${metadataValue(item, 'dimensoes-diametro')} cm`,
    metadataValue(item, 'dimensoes-peso') && `peso ${metadataValue(item, 'dimensoes-peso')}`
  ].filter(Boolean).join(' · ');
  const category = firstNonEmpty(classification?.name, focus, 'Objeto museológico');

  const titleTranslations = normalizeMultilingualField({ pt: title });
  const descriptionTranslations = normalizeMultilingualField({ pt: description });
  const mediumTranslations = normalizeMultilingualField({ pt: category });
  const rightsTranslations = normalizeMultilingualField({ pt: rights });
  const availableLanguages = collectLanguages(titleTranslations, descriptionTranslations, mediumTranslations, rightsTranslations);
  const sourceLanguage = pickPrimaryLanguage([titleTranslations, descriptionTranslations], 'pt');
  const displayTexts = buildDisplayTexts({
    titleMap: titleTranslations,
    descriptionMap: descriptionTranslations,
    primaryLanguage: sourceLanguage
  });

  const embeddingText = [
    title,
    description,
    category,
    productionDate,
    place,
    museum,
    focus
  ].filter(Boolean).join('. ');

  return {
    canonical_id: `brasiliana:${item.id}`,
    source: 'brasiliana',
    source_record_id: String(item.id),
    source_institution: museum,
    source_country: 'Brazil',
    source_language: sourceLanguage,
    available_languages: availableLanguages,
    title,
    object_type: category,
    discipline: 'Brasiliana Museus',
    category,
    date_range: productionDate,
    registration_number: item.slug || String(item.id),
    museum_location: museum,
    description,
    medium: category,
    artist: '',
    culture: 'Brazil',
    period: productionDate,
    place_of_origin: place,
    credit_line: museum,
    dimensions,
    wall_description: description,
    tombstone: [title, productionDate, museum].filter(Boolean).join('. '),
    licence: rights,
    source_url: item.url,
    media_thumbnail: item.document || '',
    media_medium: item.document || '',
    media_large: item.document || '',
    title_translations: titleTranslations,
    description_translations: descriptionTranslations,
    medium_translations: mediumTranslations,
    rights_translations: rightsTranslations,
    display_texts: displayTexts,
    translation_status: 'source_single_language',
    translation_ready: availableLanguages.length > 0,
    classification_terms: uniq([category, classification?.hierarchy_path || '']),
    keyword_terms: uniq([focus, category, museum, place]),
    rights_notes: uniq([
      'Metadata acquired through Brasiliana Museus / Tainacan API',
      rights
    ]),
    source_collection_label: museum,
    source_type: item.document_mimetype || 'image',
    focus_area: focus,
    media_rights_title: rights,
    media_rights_mode: 'item-level reproduction conditions',
    media_permission_type: ['public-domain-or-open-friendly'],
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
  console.log('  ║   ARCHAI — Brasiliana Harvester              ║');
  console.log('  ║   Brazil · open-data aware · image-safe       ║');
  console.log('  ╚════════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('  ⚙ DRY RUN — no writes to Qdrant');
  console.log(`  ⚙ Limit: ${LIMIT}`);
  console.log(`  ⚙ Query size: ${QUERY_SIZE}`);
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
  let skippedRights = 0;
  let skippedLowScore = 0;

  console.log('\n  Searching Brasiliana…\n');

  for (const search of SEARCH_QUERIES) {
    try {
      const data = await fetchJSON(buildQueryUrl({ search: search.q, page: 1 }));
      const rows = Array.isArray(data?.items) ? data.items : [];
      let added = 0;

      for (const item of rows) {
        if (!item?.id || seen.has(item.id)) continue;
        if (!item.document_options?.is_image || !item.document) {
          skippedNoImage++;
          continue;
        }

        const rights = metadataValue(item, 'condicoes-de-reproducao');
        if (!isOpenRights(rights)) {
          skippedRights++;
          continue;
        }

        const recordScore = scoreRecord(item, search.focus);
        if (recordScore < MIN_RECORD_SCORE) {
          skippedLowScore++;
          continue;
        }

        seen.set(item.id, { item, focus: search.focus, recordScore });
        added++;
      }

      process.stdout.write(`  → "${search.q}" — ${rows.length} rows, ${added} kept (total: ${seen.size})\n`);
      await sleep(220);
    } catch (err) {
      process.stdout.write(`  ⚠ "${search.q}" — ${err.message}\n`);
    }
  }

  const ranked = selectDiverseRecords([...seen.values()], LIMIT);

  console.log(`\n  ✓ ${seen.size} suitable Brasiliana records found`);
  console.log(`  → Skipped no image: ${skippedNoImage}`);
  console.log(`  → Skipped rights: ${skippedRights}`);
  console.log(`  → Skipped low score: ${skippedLowScore}`);
  console.log(`  → Processing ${ranked.length}\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < ranked.length; i++) {
    const row = ranked[i];
    try {
      const payload = normalizeSourceRecord(row.item, row.focus);

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

      await sleep(160);
    } catch {
      errors++;
      await sleep(240);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Brasiliana harvest complete`);
  console.log(`  → ${success} objects into '${COLLECTION}'`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → Portuguese source text and item rights preserved\n`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
