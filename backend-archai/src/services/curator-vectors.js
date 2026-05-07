import { env } from '../config/env.js';
import db from '../data/db.js';

const QDRANT_URL = env.qdrant.url;
const OLLAMA_URL = env.ollama.baseUrl;
const EMBED_MODEL = env.ollama.embedModel;
const CURATOR_COLLECTION = 'archai_curator';
const SOURCE_COLLECTIONS = ['archai_pilot', 'archai_met', 'archai_va'];
const VECTOR_SIZE = 768;

const getCommentsByObject = db.prepare(
  'SELECT text, author_type, ai_flag, created_at FROM comments WHERE object_id = ? ORDER BY created_at ASC'
);

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

function buildCuratorText(payload, comments) {
  const parts = [];

  const title = payload.title || payload.object_name || '';
  const type = payload.type || payload.object_type || payload.classification || '';
  const date = payload.date || payload.date_display || payload.production_date || '';
  const desc = payload.description || payload.ai || '';
  const location = payload.location || payload.gallery || '';
  const materials = payload.materials || payload.medium || '';
  const maker = payload.maker || payload.artist || payload.creator || '';
  const reg = payload.registration_number || payload.accession_number || '';

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

  for (const col of SOURCE_COLLECTIONS) {
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

        const curatorText = buildCuratorText(p, comments);
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

  log(`\nDone — ${totalPoints} objects in ${CURATOR_COLLECTION}`);
  return { collection: CURATOR_COLLECTION, totalPoints };
}

export async function curatorSearch(query, limit = 10) {
  const vector = await embed(query);
  if (!vector) return [];

  const resp = await fetch(`${QDRANT_URL}/collections/${CURATOR_COLLECTION}/points/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vector, limit, with_payload: true }),
  });
  const data = await resp.json();
  return data.result || [];
}
