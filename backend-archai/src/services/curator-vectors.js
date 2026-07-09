// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
// Proprietary during the doctoral research period — see LICENSE.
import { env } from '../config/env.js';
import db from '../data/db.js';

const QDRANT_URL = env.qdrant.url;
const OLLAMA_URL = env.ollama.baseUrl;
const EMBED_MODEL = env.ollama.embedModel;
const CURATOR_COLLECTION = 'archai_curator';
const VECTOR_SIZE = 768;
const EXCLUDED_SOURCE_COLLECTIONS = new Set([
  // Specialist media lab material is useful for playback/R&D, but should not
  // dilute the core GLAM curator aggregate unless deliberately promoted.
  'archai_nasa',
]);

const getCommentsByObject = db.prepare(
  'SELECT text, author_type, ai_flag, created_at FROM comments WHERE object_id = ? ORDER BY created_at ASC'
);

// Institution / place metadata per source collection. Baked into the embedding
// text AND stored as structured facets so provenance queries ("objects from
// Melbourne", "at the V&A", "Dutch collection") work by both semantic match and
// filtering — not just object description, which often omits the holding museum.
const INSTITUTION_META = {
  archai_pilot:      { institution: 'Museums Victoria',                 city: 'Melbourne',  state: 'Victoria',     country: 'Australia' },
  archai_met:        { institution: 'The Metropolitan Museum of Art',   city: 'New York',   state: 'New York',     country: 'United States' },
  archai_va:         { institution: 'Victoria and Albert Museum',       city: 'London',     state: '',             country: 'United Kingdom' },
  archai_aic:        { institution: 'Art Institute of Chicago',         city: 'Chicago',    state: 'Illinois',     country: 'United States' },
  archai_cma:        { institution: 'Cleveland Museum of Art',          city: 'Cleveland',  state: 'Ohio',         country: 'United States' },
  archai_rijks:      { institution: 'Rijksmuseum',                      city: 'Amsterdam',  state: '',             country: 'Netherlands' },
  archai_europeana:  { institution: 'Europeana',                        city: '',           state: '',             country: 'Europe' },
  archai_auckland:   { institution: 'Auckland War Memorial Museum',     city: 'Auckland',   state: '',             country: 'New Zealand' },
  archai_tepapa:     { institution: 'Te Papa Tongarewa',               city: 'Wellington', state: '',             country: 'New Zealand' },
  archai_mplus:      { institution: 'M+',                               city: 'Hong Kong',  state: '',             country: 'Hong Kong' },
  archai_brasiliana: { institution: 'Brasiliana Museus',               city: '',           state: '',             country: 'Brazil' },
  archai_smithsonian:{ institution: 'Smithsonian Institution',         city: 'Washington', state: 'District of Columbia', country: 'United States' },
  archai_tate:       { institution: 'Tate',                             city: 'London',     state: '',             country: 'United Kingdom' },
  archai_streetart:  { institution: 'Public Street Art Open Data',     city: '',           state: '',             country: 'International' },
  archai_getty:      { institution: 'J. Paul Getty Museum',            city: 'Los Angeles',state: 'California',   country: 'United States' },
  archai_wellcome:   { institution: 'Wellcome Collection',             city: 'London',     state: '',             country: 'United Kingdom' },
  archai_qagoma:     { institution: 'QAGOMA',                          city: 'Brisbane',   state: 'Queensland',    country: 'Australia' },
  archai_rawg:       { institution: 'RAWG Video Games Database',       city: '',           state: '',             country: 'International' },
  archai_nga:        { institution: 'National Gallery of Art',         city: 'Washington', state: 'District of Columbia', country: 'United States' },
};

async function embed(text) {
  const resp = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 2000) }),
  });
  const data = await resp.json();
  return data.embedding;
}

async function qdrantPost(path, body) {
  const resp = await fetch(`${QDRANT_URL}${path}`, {
    method: 'POST' in path ? 'POST' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function listSourceCollections() {
  const resp = await fetch(`${QDRANT_URL}/collections`);
  const data = await resp.json();
  return (data.result?.collections || [])
    .map((row) => row.name)
    .filter((name) => name.startsWith('archai_') && name !== CURATOR_COLLECTION)
    .filter((name) => !EXCLUDED_SOURCE_COLLECTIONS.has(name));
}

function buildCuratorText(payload, comments, meta) {
  const parts = [];

  const title = payload.title || payload.object_name || '';
  const type = payload.type || payload.object_type || payload.classification || '';
  const date = payload.date || payload.date_display || payload.production_date || '';
  const desc = payload.description || payload.ai || '';
  const location = payload.location || payload.gallery || '';
  const materials = payload.materials || payload.medium || '';
  const maker = payload.maker || payload.artist || payload.creator || '';
  const reg = payload.registration_number || payload.accession_number || '';

  // Provenance first — so "objects from Melbourne / at the V&A / Dutch" match.
  if (meta) {
    const place = [meta.city, meta.state, meta.country].filter(Boolean).join(', ');
    if (meta.institution) parts.push(`Held by: ${meta.institution}${place ? ` (${place})` : ''}`);
  }
  if (title) parts.push(`Title: ${title}`);
  if (type) parts.push(`Type: ${type}`);
  if (date) parts.push(`Date: ${date}`);
  if (maker) parts.push(`Maker: ${maker}`);
  if (materials) parts.push(`Materials: ${materials}`);
  if (location) parts.push(`Location: ${location}`);
  if (reg) parts.push(`Registration: ${reg}`);
  if (desc) parts.push(`Description: ${desc.substring(0, 800)}`);

  if (comments.length) {
    parts.push(`Visitor comments (${comments.length}):`);
    for (const c of comments.slice(0, 10)) {
      parts.push(`  [${c.author_type}] ${c.text}`);
    }
  }

  return parts.join('\n');
}

export async function buildCuratorCollection({ onProgress } = {}) {
  const log = onProgress || console.log;
  const sourceCollections = await listSourceCollections();
  if (!sourceCollections.length) {
    throw new Error('No live source collections found in Qdrant');
  }

  // Create or recreate the curator collection
  await fetch(`${QDRANT_URL}/collections/${CURATOR_COLLECTION}`, { method: 'DELETE' }).catch(() => {});
  await fetch(`${QDRANT_URL}/collections/${CURATOR_COLLECTION}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    }),
  });
  log(`Created collection: ${CURATOR_COLLECTION}`);

  let totalPoints = 0;

  log(`Source collections: ${sourceCollections.join(', ')}`);

  for (const col of sourceCollections) {
    log(`Reading ${col}...`);

    let offset = null;
    let allPoints = [];

    // Scroll through all points
    do {
      const body = { limit: 200, with_payload: true };
      if (offset) body.offset = offset;

      const resp = await fetch(`${QDRANT_URL}/collections/${col}/points/scroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      const points = data.result?.points || [];
      allPoints = allPoints.concat(points);
      offset = data.result?.next_page_offset || null;
    } while (offset);

    log(`  ${allPoints.length} objects from ${col}`);

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < allPoints.length; i += batchSize) {
      const batch = allPoints.slice(i, i + batchSize);
      const upsertPoints = [];

      for (const point of batch) {
        const p = point.payload || {};
        const objectId = p.registration_number || p.accession_number || String(point.id);
        const comments = getCommentsByObject.all(objectId);

        const meta = INSTITUTION_META[col] || null;
        const curatorText = buildCuratorText(p, comments, meta);
        const vector = await embed(curatorText);

        if (!vector || vector.length !== VECTOR_SIZE) continue;

        upsertPoints.push({
          id: totalPoints + upsertPoints.length + 1,
          vector,
          payload: {
            ...p,
            _source_collection: col,
            _source_id: point.id,
            _curator_text: curatorText,
            _comment_count: comments.length,
            _has_flagged: comments.some(c => c.ai_flag === 'harmful' || c.ai_flag === 'suspicious'),
            // Structured provenance facets for filtering
            institution: meta?.institution || p.source_institution || '',
            institution_city: meta?.city || '',
            institution_state: meta?.state || '',
            institution_country: meta?.country || '',
          },
        });
      }

      if (upsertPoints.length) {
        await fetch(`${QDRANT_URL}/collections/${CURATOR_COLLECTION}/points`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: upsertPoints }),
        });
        totalPoints += upsertPoints.length;
      }

      log(`  Vectorised ${Math.min(i + batchSize, allPoints.length)}/${allPoints.length} from ${col}`);
    }
  }

  log(`
Done — ${totalPoints} objects in ${CURATOR_COLLECTION}`);
  return { collection: CURATOR_COLLECTION, totalPoints };
}

// Map free-text place/institution mentions in a query to structured facet
// filters. Provenance queries ("objects from Melbourne", "at the V&A", "Dutch
// collection") can't be answered reliably by embedding similarity, so when we
// detect a place/institution we filter the vector search to it.
const PROVENANCE_LEXICON = [
  { terms: ['museums victoria', 'museum victoria', 'melbourne'], match: { institution: 'Museums Victoria' } },
  { terms: ['metropolitan museum', 'the met', 'new york', 'nyc'], match: { institution: 'The Metropolitan Museum of Art' } },
  { terms: ['victoria and albert', 'v&a', 'v and a', 'va museum'], match: { institution: 'Victoria and Albert Museum' } },
  { terms: ['art institute of chicago', 'chicago'], match: { institution: 'Art Institute of Chicago' } },
  { terms: ['cleveland'], match: { institution: 'Cleveland Museum of Art' } },
  { terms: ['rijksmuseum', 'rijks', 'amsterdam', 'dutch', 'netherlands', 'holland'], match: { institution: 'Rijksmuseum' } },
  { terms: ['europeana'], match: { institution: 'Europeana' } },
  { terms: ['auckland'], match: { institution: 'Auckland War Memorial Museum' } },
  { terms: ['te papa', 'tepapa', 'wellington'], match: { institution: 'Te Papa Tongarewa' } },
  { terms: ['m+', 'mplus', 'hong kong'], match: { institution: 'M+' } },
  { terms: ['brasiliana', 'brazil', 'brazilian'], match: { institution: 'Brasiliana Museus' } },
  { terms: ['smithsonian', 'saam', 'cooper hewitt', 'washington dc'], match: { institution: 'Smithsonian Institution' } },
  { terms: ['tate'], match: { institution: 'Tate' } },
  { terms: ['street art', 'public mural', 'murals'], match: { institution: 'Public Street Art Open Data' } },
  { terms: ['getty'], match: { institution: 'J. Paul Getty Museum' } },
  { terms: ['wellcome'], match: { institution: 'Wellcome Collection' } },
  { terms: ['qagoma', 'queensland art gallery'], match: { institution: 'QAGOMA' } },
  { terms: ['rawg', 'video games', 'games collection'], match: { institution: 'RAWG Video Games Database' } },
  { terms: ['national gallery of art', 'nga', 'washington gallery'], match: { institution: 'National Gallery of Art' } },
  // Country-level (broader) — only used if no specific institution matched
  { terms: ['australia', 'australian'], match: { institution_country: 'Australia' }, country: true },
  { terms: ['new zealand', 'aotearoa'], match: { institution_country: 'New Zealand' }, country: true },
  { terms: ['united states', 'american', 'usa'], match: { institution_country: 'United States' }, country: true },
];

export function detectProvenanceFilter(query) {
  const q = ' ' + String(query).toLowerCase() + ' ';
  const institutionHits = [];
  const countryHits = [];
  for (const entry of PROVENANCE_LEXICON) {
    if (entry.terms.some(t => q.includes(t))) {
      (entry.country ? countryHits : institutionHits).push(entry.match);
    }
  }
  // Prefer specific institution matches; fall back to country.
  const hits = institutionHits.length ? institutionHits : countryHits;
  if (!hits.length) return null;
  return {
    should: hits.map(m => {
      const [key, value] = Object.entries(m)[0];
      return { key, match: { value } };
    }),
  };
}

export async function curatorSearch(query, limit = 10, collection = null) {
  const vector = await embed(query);
  if (!vector) return [];

  const filter = collection
    ? { must: [{ key: '_source_collection', match: { value: collection } }] }
    : detectProvenanceFilter(query);
  const body = { vector, limit, with_payload: true };
  if (filter) body.filter = filter;

  const resp = await fetch(`${QDRANT_URL}/collections/${CURATOR_COLLECTION}/points/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  return data.result || [];
}
