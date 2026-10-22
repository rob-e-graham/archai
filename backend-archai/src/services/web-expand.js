// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
// Proprietary during the doctoral research period — see LICENSE.
//
// Optional public-knowledge expansion for Collection Intelligence. Off by default; only runs when
// the visitor switches it on or presses "Expand with public web". Uses DuckDuckGo's Instant Answer
// API (encyclopaedia-style summaries, not a full web search), the same source as the FAMTEC local AI
// and the Evidence Lens demo. Results are always labelled as web material, never as archival evidence.

const CACHE = new Map();
const CACHE_TTL = 30 * 60 * 1000;

async function ddg(q) {
  const hit = CACHE.get(q);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.out;
  let out = [];
  try {
    const r = await fetch('https://api.duckduckgo.com/?' + new URLSearchParams({ q, format: 'json', no_html: '1', skip_disambig: '1' }), {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'ARCHAI-research-demo/1.0 (fineartmedia.tech)' },
    });
    const d = JSON.parse(await r.text());
    if (d.AbstractText) out.push({ text: d.AbstractText, url: d.AbstractURL || '', source: d.AbstractSource || 'DuckDuckGo', query: q });
    if (d.Answer && typeof d.Answer === 'string') out.push({ text: d.Answer, url: '', source: 'DuckDuckGo', query: q });
    const flat = (d.RelatedTopics || []).flatMap((t) => t.Topics || [t]);
    flat.filter((t) => t.Text).slice(0, 3).forEach((t) => out.push({ text: t.Text, url: t.FirstURL || '', source: 'DuckDuckGo related', query: q }));
  } catch { out = []; }
  CACHE.set(q, { at: Date.now(), out });
  return out;
}

const FILLER = /\b(?:tell me (?:more )?about|what (?:is|are|was|were)|who (?:is|was|were)|can you|could you|please|show me|find me|find|do you have|are there any|is there|give me|explain|describe|in the collection|more about|expand|public|web|information on|info on)\b/gi;

function cleanQuestion(message) {
  return String(message).replace(FILLER, ' ').replace(/[?!.,"“”]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);
}

const firstMaker = (m) => String(m || '').split(/[\n;|]/)[0].replace(/\(.*?\)/g, '').replace(/\b\d{3,4}\b.*$/, '').trim();
const cleanTitle = (t) => String(t || '').replace(/[\[\]]/g, '').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);

/**
 * Build a few short entity queries. Instant Answer works on names and topics, not on whole questions,
 * so we try the cleaned question plus the makers and titles of the strongest records.
 */
export function buildWebQueries(message, objects = []) {
  const question = cleanQuestion(message);
  const qs = [question];
  // Only use a record's maker or title as a web query if it shares a word with what was asked,
  // so a loosely related record cannot steer the search somewhere else.
  const words = new Set(question.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const related = objects.filter((o) => `${o.maker} ${o.title}`.toLowerCase().split(/\W+/).some((w) => words.has(w)));
  for (const o of related.slice(0, 3)) {
    const maker = firstMaker(o.maker);
    if (maker.length > 3 && !/^(unknown|anonymous|unidentified)/i.test(maker)) qs.push(maker);
    const t = cleanTitle(o.title);
    if (t.length > 3) qs.push(t);
  }
  return [...new Set(qs.filter((q) => q && q.length > 2))].slice(0, 4);
}

export async function webExpand(message, objects = []) {
  const queries = buildWebQueries(message, objects);
  const sets = await Promise.all(queries.map(ddg));
  const seen = new Set();
  const results = [];
  for (const set of sets) {
    for (const r of set) {
      const key = r.url || r.text.slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ ...r, text: r.text.slice(0, 600) });
    }
  }
  return { queries, results: results.slice(0, 6) };
}
