#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Europeana Harvester
// Access to millions of objects from 4000+ cultural institutions
// across Europe. Multilingual metadata in 30+ languages.
// Includes museums from France, Germany, Spain, Italy, Portugal,
// Poland, Scandinavia, and more.
//
// REQUIRES: Free API key from https://pro.europeana.eu/page/get-api
//   Set: EUROPEANA_API_KEY=your-key-here
//
// Usage:
//   EUROPEANA_API_KEY=xxxx node europeana-harvester.js
//   EUROPEANA_API_KEY=xxxx node europeana-harvester.js --limit 200
//   EUROPEANA_API_KEY=xxxx node europeana-harvester.js --dry-run
//
// API docs: https://pro.europeana.eu/page/search
// Licence: Varies per object (CC0, CC-BY, rights reserved)
// ══════════════════════════════════════════════════════════════════

const EUROPEANA_API = 'https://api.europeana.eu/record/v2/search.json';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_europeana';
const EMBED_MODEL = 'nomic-embed-text';
import {
  normalizeMultilingualField,
  mergeLanguageMaps,
  pickBestLanguage,
  pickPrimaryLanguage,
  collectLanguages,
  buildDisplayTexts
} from './lib/multilingual.js';

const API_KEY = process.env.EUROPEANA_API_KEY;
if (!API_KEY) {
  console.error('\n  ✗ EUROPEANA_API_KEY not set');
  console.error('  → Register free at https://pro.europeana.eu/page/get-api');
  console.error('  → Then: EUROPEANA_API_KEY=your-key node europeana-harvester.js\n');
  process.exit(1);
}

// Curated queries targeting diverse European institutions and rich objects
// Each query includes media=true to ensure images exist
const SEARCH_QUERIES = [
  // Technology & Science
  { q: 'scientific instrument', profile: 'rich', country: '*' },
  { q: 'automaton clock mechanism', profile: 'rich', country: '*' },
  { q: 'camera photography apparatus', profile: 'rich', country: '*' },
  { q: 'telescope microscope', profile: 'rich', country: '*' },
  // European art highlights
  { q: 'Musée du Louvre sculpture', profile: 'rich', country: 'france' },
  { q: 'Prado Museum painting', profile: 'rich', country: 'spain' },
  { q: 'Uffizi Gallery Florence', profile: 'rich', country: 'italy' },
  { q: 'Deutsches Museum technology', profile: 'rich', country: 'germany' },
  { q: 'Nationalmuseum Stockholm', profile: 'rich', country: 'sweden' },
  { q: 'Museu Nacional arte antiga', profile: 'rich', country: 'portugal' },
  // Diverse material culture
  { q: 'textile weaving loom', profile: 'rich', country: '*' },
  { q: 'ceramic porcelain', profile: 'rich', country: '*' },
  { q: 'armor medieval weapon', profile: 'rich', country: '*' },
  { q: 'musical instrument historical', profile: 'rich', country: '*' },
  { q: 'navigation maritime compass', profile: 'rich', country: '*' },
  { q: 'printing press typography', profile: 'rich', country: '*' },
  // Cross-cultural
  { q: 'colonial collection ethnographic', profile: 'rich', country: '*' },
  { q: 'Islamic art calligraphy', profile: 'rich', country: '*' },
  { q: 'Byzantine mosaic icon', profile: 'rich', country: '*' },
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT = parseInt(getArg('limit', '150'), 10);
const DRY_RUN = args.includes('--dry-run');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) { await sleep(5000); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000);
    }
  }
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 2000) })
  });
  return (await res.json()).embedding;
}

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

function bestText(field) {
  return pickBestLanguage(normalizeMultilingualField(field));
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║  ARCHAI — Europeana Harvester                        ║');
  console.log('  ║  4000+ institutions · 30+ languages · All of Europe  ║');
  console.log('  ╚══════════════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('  ⚙ DRY RUN\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch { console.error('  ✗ Ollama not reachable'); process.exit(1); }

  if (!DRY_RUN) {
    try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
    catch { console.error('  ✗ Qdrant not reachable'); process.exit(1); }
    await ensureCollection();
  }

  const seen = new Map();
  const institutions = new Set();
  const countries = new Set();
  console.log(`\n  Searching Europeana…\n`);

  for (const search of SEARCH_QUERIES) {
    try {
      let url = `${EUROPEANA_API}?wskey=${API_KEY}&query=${encodeURIComponent(search.q)}&media=true&thumbnail=true&rows=50&profile=${search.profile || 'standard'}`;
      if (search.country && search.country !== '*') {
        url += `&qf=COUNTRY:${search.country}`;
      }
      url += '&qf=TYPE:IMAGE'; // Ensure we get objects with images

      const data = await fetchJSON(url);
      const items = data.items || [];
      let added = 0;

      for (const item of items) {
        const id = item.id;
        if (seen.has(id)) continue;

        // Check for image
        const img = item.edmPreview?.[0] || item.edmIsShownBy?.[0] || '';
        if (!img) continue;

        // Score data richness
        const hasTitle = !!bestText(item.title);
        const hasDesc = !!(bestText(item.dcDescription) || bestText(item.dctermsAlternative));
        const hasCreator = !!bestText(item.dcCreator);
        const hasDate = !!bestText(item.year || item.dctermsCreated);
        const hasProvider = !!item.dataProvider?.[0];
        const richness = [hasTitle, hasDesc, hasCreator, hasDate, hasProvider].filter(Boolean).length;

        if (richness >= 3) {
          seen.set(id, { ...item, _img: img, _richness: richness });
          if (item.dataProvider?.[0]) institutions.add(item.dataProvider[0]);
          if (item.country?.[0]) countries.add(item.country[0]);
          added++;
        }
      }
      process.stdout.write(`  → "${search.q}" — ${items.length} results, ${added} rich (total: ${seen.size})\n`);
      await sleep(400);
    } catch (e) {
      process.stdout.write(`  ⚠ "${search.q}" — ${e.message}\n`);
    }
  }

  console.log(`\n  ✓ ${seen.size} rich objects from ${institutions.size} institutions in ${countries.size} countries`);
  console.log(`  → Countries: ${[...countries].join(', ')}`);

  const objects = [...seen.values()]
    .sort((a, b) => b._richness - a._richness)
    .slice(0, LIMIT);

  console.log(`  → Processing ${objects.length}\n`);

  let success = 0, errors = 0;

  for (let i = 0; i < objects.length; i++) {
    const item = objects[i];
    try {
      const titleTranslations = normalizeMultilingualField(item.title);
      const descriptionTranslations = mergeLanguageMaps(
        normalizeMultilingualField(item.dcDescription),
        normalizeMultilingualField(item.dctermsAlternative)
      );
      const creatorTranslations = normalizeMultilingualField(item.dcCreator);
      const mediumTranslations = normalizeMultilingualField(item.dcFormat);
      const subjectTranslations = normalizeMultilingualField(item.dcSubject);
      const title = pickBestLanguage(titleTranslations) || 'Untitled';
      const desc = pickBestLanguage(descriptionTranslations) || '';
      const creator = pickBestLanguage(creatorTranslations) || '';
      const date = bestText(item.year) || bestText(item.dctermsCreated) || '';
      const provider = item.dataProvider?.[0] || '';
      const country = item.country?.[0] || '';
      const type = bestText(item.type) || '';
      const rights = item.rights?.[0] || '';
      const medium = pickBestLanguage(mediumTranslations) || '';
      const subject = pickBestLanguage(subjectTranslations) || '';
      const availableLanguages = collectLanguages(
        titleTranslations,
        descriptionTranslations,
        creatorTranslations,
        mediumTranslations,
        subjectTranslations
      );
      const sourceLanguage = pickPrimaryLanguage(
        [
          titleTranslations,
          descriptionTranslations,
          creatorTranslations,
          mediumTranslations,
          subjectTranslations
        ],
        item.language?.[0] || 'und'
      );
      const displayTexts = buildDisplayTexts({
        titleMap: titleTranslations,
        descriptionMap: descriptionTranslations,
        primaryLanguage: sourceLanguage
      });

      const embeddingParts = [title, desc, creator, medium, subject, provider, country, date].filter(Boolean).join('. ');

      const payload = {
        canonical_id: `europeana:${item.id}`,
        source: 'europeana',
        source_institution: provider,
        source_country: country,
        title,
        object_type: type,
        discipline: subject,
        category: type,
        date_range: Array.isArray(date) ? date[0] : date,
        registration_number: item.id,
        museum_location: provider,
        description: desc,
        medium,
        artist: creator,
        licence: rights,
        source_url: item.guid || `https://www.europeana.eu/item${item.id}`,
        media_thumbnail: item.edmPreview?.[0] || '',
        media_medium: item._img,
        media_large: item.edmIsShownBy?.[0] || item._img,
        language: item.language?.[0] || sourceLanguage || 'und',
        source_language: sourceLanguage,
        available_languages: availableLanguages,
        title_translations: titleTranslations,
        description_translations: descriptionTranslations,
        creator_translations: creatorTranslations,
        medium_translations: mediumTranslations,
        subject_translations: subjectTranslations,
        display_texts: displayTexts,
        translation_status: availableLanguages.length > 1 ? 'source_multilingual' : 'source_single_language',
        translation_ready: availableLanguages.length > 0,
        richness_score: item._richness,
        embedding_text: embeddingParts
      };

      if (DRY_RUN) {
        success++;
        process.stdout.write(`  [DRY] [${country}] ${title.substring(0, 50)} — ${provider.substring(0, 30)}\n`);
      } else {
        const vector = await embed(embeddingParts);
        if (!vector || !vector.length) { errors++; continue; }
        const pointId = 6000000 + i;
        await upsertPoint(pointId, vector, payload);
        success++;
        const pct = Math.round((i + 1) / objects.length * 100);
        process.stdout.write(`  [${pct}%] ${success}/${i + 1} · [${country}] ${title.substring(0, 40)}\r`);
      }

      await sleep(250);
    } catch (e) {
      errors++;
      await sleep(400);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Europeana harvest complete`);
  console.log(`  → ${success} objects from ${institutions.size} institutions`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → Countries: ${[...countries].join(', ')}`);
  console.log(`  → Multilingual metadata preserved`);
  console.log(`  → Europe's cultural heritage in ARCHAI 🇪🇺\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
