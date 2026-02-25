import { env } from '../config/env.js';

function deterministicVector(text, dims = 16) {
  const vec = new Array(dims).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    vec[i % dims] += (text.charCodeAt(i) % 31) / 31;
  }
  return vec.map((v) => Number((v / Math.max(1, text.length / dims)).toFixed(6)));
}

export class EmbeddingAdapter {
  async embedText(text) {
    if (!text) return { model: env.ollama.embedModel, vector: [] };
    // Mock embedding until Ollama endpoint/API wiring is enabled.
    return { model: env.ollama.embedModel, vector: deterministicVector(text, 32), mode: 'mock' };
  }
}

export const embeddingAdapter = new EmbeddingAdapter();
