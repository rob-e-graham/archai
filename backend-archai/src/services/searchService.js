import { repo } from './objectRepository.js';

function scoreObject(obj, q) {
  if (!q) return 0.5;
  const text = [obj.title, obj.type, obj.location, obj.description, obj.aiInterpretation, ...(obj.tags || [])].join(' ').toLowerCase();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = terms.reduce((n, t) => n + (text.includes(t) ? 1 : 0), 0);
  return Number((hits / Math.max(terms.length, 1)).toFixed(3));
}

export async function searchObjects({ q = '', limit = 20, dataSource = 'local_mock' }) {
  const rows = repo.listObjects(q)
    .map((o) => ({ ...o, score: scoreObject(o, q) }))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);

  return {
    query: q,
    dataSource,
    total: rows.length,
    results: rows,
  };
}
