import { env } from '../config/env.js';

const inMemoryQdrant = new Map();

export class QdrantAdapter {
  async health() {
    return {
      configured: Boolean(env.qdrant.url),
      mode: env.qdrant.apiKey ? 'remote-ready' : 'mock-memory',
      url: env.qdrant.url,
      collection: env.qdrant.collection,
      points: inMemoryQdrant.size,
    };
  }

  async ensureCollection() {
    return { collection: env.qdrant.collection, ok: true, mode: 'mock-memory' };
  }

  async upsertPoints(points) {
    for (const point of points) {
      inMemoryQdrant.set(point.id, point);
    }
    return { upserted: points.length, total: inMemoryQdrant.size, mode: 'mock-memory' };
  }

  async searchByVector(_vector, { limit = 10 } = {}) {
    const rows = [...inMemoryQdrant.values()].slice(0, limit);
    return rows.map((row, idx) => ({ id: row.id, score: Number((0.99 - idx * 0.03).toFixed(3)), payload: row.payload }));
  }
}

export const qdrantAdapter = new QdrantAdapter();
