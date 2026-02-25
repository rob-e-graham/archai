import { collectiveAccessAdapter } from '../adapters/collectiveAccessAdapter.js';
import { resourceSpaceAdapter } from '../adapters/resourceSpaceAdapter.js';
import { embeddingAdapter } from '../adapters/embeddingAdapter.js';
import { qdrantAdapter } from '../adapters/qdrantAdapter.js';
import { repo } from './objectRepository.js';
import { env } from '../config/env.js';
import { hoursAgoIso } from '../utils/time.js';

export function isRestrictedForEmbedding(record) {
  const flags = new Set(record.restrictions || []);
  for (const f of env.restrictedFlags) flags.add(f);
  return [...flags].some((f) => ['secret-sacred', 'community-restricted'].includes(f));
}

export function buildEmbeddingText(objectRecord, mediaAssets = []) {
  const mediaSummary = mediaAssets
    .map((m) => `${m.mediaType || m.kind || 'file'}:${m.filename || m.sourceId}`)
    .join(' | ');
  return [
    `ID: ${objectRecord.id}`,
    `Title: ${objectRecord.title}`,
    `Type: ${objectRecord.type}`,
    `Year: ${objectRecord.year}`,
    `Location: ${objectRecord.location}`,
    `Description: ${objectRecord.description}`,
    `AI Interpretation: ${objectRecord.aiInterpretation}`,
    `Tags: ${(objectRecord.tags || []).join(', ')}`,
    `Materials: ${(objectRecord.materials || []).join(', ')}`,
    `Verified Facts: ${(objectRecord.verifiedFacts || []).join(' | ')}`,
    `Media: ${mediaSummary}`,
  ].join('\n');
}

export async function runNightlySync({ since, initiatedBy = 'scheduler' } = {}) {
  const startedAt = new Date().toISOString();
  const effectiveSince = since || hoursAgoIso(env.sync.lookbackHours);

  const caRecords = await collectiveAccessAdapter.fetchChangedObjects({ since: effectiveSince });
  const rsAssets = await resourceSpaceAdapter.fetchChangedAssets({ since: effectiveSince });
  await qdrantAdapter.ensureCollection();

  const assetsByObject = rsAssets.reduce((acc, asset) => {
    if (!acc[asset.objectId]) acc[asset.objectId] = [];
    acc[asset.objectId].push(asset);
    return acc;
  }, {});

  const points = [];
  const skipped = [];

  for (const sourceRecord of caRecords) {
    const objectRecord = repo.getObject(sourceRecord.objectId);
    if (!objectRecord) {
      skipped.push({ objectId: sourceRecord.objectId, reason: 'Object not present in local repo' });
      continue;
    }
    if (isRestrictedForEmbedding(objectRecord)) {
      skipped.push({ objectId: objectRecord.id, reason: 'Restricted by cultural safety gate' });
      continue;
    }

    const text = buildEmbeddingText(objectRecord, assetsByObject[objectRecord.id] || []);
    const embedding = await embeddingAdapter.embedText(text);
    points.push({
      id: objectRecord.id,
      vector: embedding.vector,
      payload: {
        objectId: objectRecord.id,
        title: objectRecord.title,
        type: objectRecord.type,
        location: objectRecord.location,
        year: objectRecord.year,
        tags: objectRecord.tags,
        source: objectRecord.source,
        embeddingModel: embedding.model,
        embeddingMode: embedding.mode,
        updatedAt: objectRecord.updatedAt,
      },
    });
  }

  const upsert = await qdrantAdapter.upsertPoints(points);
  const batch = {
    id: crypto.randomUUID(),
    startedAt,
    finishedAt: new Date().toISOString(),
    initiatedBy,
    since: effectiveSince,
    counts: {
      caRecords: caRecords.length,
      rsAssets: rsAssets.length,
      embedded: points.length,
      skipped: skipped.length,
    },
    skipped,
    upsert,
    adapters: {
      collectiveAccess: await collectiveAccessAdapter.health(),
      resourceSpace: await resourceSpaceAdapter.health(),
      qdrant: await qdrantAdapter.health(),
    },
  };

  repo.saveSyncBatch(batch);
  repo.audit({ type: 'pipeline.nightly_sync', actor: initiatedBy, summary: `Embedded ${points.length} objects, skipped ${skipped.length}` });
  return batch;
}
