import { env } from '../config/env.js';

const inMemoryQdrant = new Map();
const VECTOR_CONFIG = { size: 768, distance: 'Cosine' };

function qdrantHeaders() {
  return env.qdrant.apiKey ? { 'api-key': env.qdrant.apiKey } : {};
}

export class QdrantAdapter {
  async health() {
    try {
      const resp = await fetch(`${env.qdrant.url}/collections`, { headers: qdrantHeaders() });
      if (!resp.ok) throw new Error(`Qdrant responded ${resp.status}`);
      const data = await resp.json();
      const availableCollections = (data.result?.collections || []).map((row) => row.name);
      const liveCounts = {};

      await Promise.all(availableCollections.map(async (name) => {
        try {
          const detailResp = await fetch(`${env.qdrant.url}/collections/${name}`, { headers: qdrantHeaders() });
          if (!detailResp.ok) return;
          const detail = await detailResp.json();
          liveCounts[name] = detail.result?.points_count || 0;
        } catch {}
      }));

      const totalPoints = Object.values(liveCounts).reduce((sum, count) => sum + count, 0);
      return {
        configured: Boolean(env.qdrant.url),
        mode: 'live',
        url: env.qdrant.url,
        collection: env.qdrant.collection,
        availableCollections,
        liveCounts,
        points: totalPoints,
      };
    } catch (error) {
      return {
        configured: Boolean(env.qdrant.url),
        mode: env.allowMocks ? 'mock-memory' : 'offline',
        url: env.qdrant.url,
        collection: env.qdrant.collection,
        availableCollections: [],
        liveCounts: {},
        points: inMemoryQdrant.size,
        error: error.message,
      };
    }
  }

  async ensureCollection() {
    try {
      const existing = await fetch(`${env.qdrant.url}/collections/${env.qdrant.collection}`, { headers: qdrantHeaders() });
      if (existing.ok) return { collection: env.qdrant.collection, ok: true, mode: 'live' };
      const create = await fetch(`${env.qdrant.url}/collections/${env.qdrant.collection}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...qdrantHeaders() },
        body: JSON.stringify({ vectors: VECTOR_CONFIG }),
      });
      if (!create.ok) throw new Error(`Qdrant responded ${create.status}`);
      return { collection: env.qdrant.collection, ok: true, mode: 'live-created' };
    } catch (error) {
      if (!env.allowMocks) throw error;
      return { collection: env.qdrant.collection, ok: true, mode: 'mock-memory', error: error.message };
    }
  }

  async upsertPoints(points) {
    try {
      const resp = await fetch(`${env.qdrant.url}/collections/${env.qdrant.collection}/points?wait=true`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...qdrantHeaders() },
        body: JSON.stringify({ points }),
      });
      if (!resp.ok) throw new Error(`Qdrant responded ${resp.status}`);
      await resp.json();
      return { upserted: points.length, mode: 'live', collection: env.qdrant.collection };
    } catch (error) {
      if (!env.allowMocks) throw error;
      for (const point of points) {
        inMemoryQdrant.set(point.id, point);
      }
      return { upserted: points.length, total: inMemoryQdrant.size, mode: 'mock-memory', error: error.message };
    }
  }

  async searchByVector(vector, { limit = 10 } = {}) {
    try {
      const resp = await fetch(`${env.qdrant.url}/collections/${env.qdrant.collection}/points/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...qdrantHeaders() },
        body: JSON.stringify({ vector, limit, with_payload: true }),
      });
      if (!resp.ok) throw new Error(`Qdrant responded ${resp.status}`);
      const data = await resp.json();
      return data.result || [];
    } catch (error) {
      if (!env.allowMocks) throw error;
      const rows = [...inMemoryQdrant.values()].slice(0, limit);
      return rows.map((row, idx) => ({ id: row.id, score: Number((0.99 - idx * 0.03).toFixed(3)), payload: row.payload }));
    }
  }
}

export const qdrantAdapter = new QdrantAdapter();
