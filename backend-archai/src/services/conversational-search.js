// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
// Copyright (c) 2026 Rob Graham / FAMTEC
import { env } from '../config/env.js';
import { curatorSearch } from './curator-vectors.js';

const OLLAMA_URL = env.ollama.baseUrl;
const QDRANT_URL = env.qdrant.url;
const CURATOR_COLLECTION = 'archai_curator';
const CHAT_MODEL = env.ollama.curatorModel || env.ollama.chatModel || 'qwen2.5:32b';

// ── Collection overview ("one big brain") ──────────────────────────
// A cached, aggregate picture of the WHOLE collection so the AI reasons like a
// single mind that knows everything it holds — not just the objects retrieved
// for one query. Refreshes every 10 minutes (or call refreshCollectionOverview).
let _overviewCache = null;
let _overviewAt = 0;
const OVERVIEW_TTL = 10 * 60 * 1000;

export async function getCollectionOverview() {
  if (_overviewCache && Date.now() - _overviewAt < OVERVIEW_TTL) return _overviewCache;
  const byInstitution = {}, byCountry = {}, byTheme = {};
  let total = 0, tech = 0;
  let offset = null;
  try {
    do {
      const body = { limit: 500, with_payload: ['institution', 'institution_country', 'themes', 'is_technology'] };
      if (offset) body.offset = offset;
      const resp = await fetch(`${QDRANT_URL}/collections/${CURATOR_COLLECTION}/points/scroll`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await resp.json();
      const pts = data.result?.points || [];
      for (const p of pts) {
        const pl = p.payload || {};
        total++;
        if (pl.is_technology) tech++;
        const inst = pl.institution || 'Unknown';
        byInstitution[inst] = (byInstitution[inst] || 0) + 1;
        const ctry = pl.institution_country || 'Unknown';
        byCountry[ctry] = (byCountry[ctry] || 0) + 1;
        for (const t of (pl.themes || [])) byTheme[t] = (byTheme[t] || 0) + 1;
      }
      offset = data.result?.next_page_offset || null;
    } while (offset);
  } catch (e) {
    return _overviewCache || { total: 0, byInstitution: {}, byCountry: {}, byTheme: {}, tech: 0 };
  }
  _overviewCache = { total, byInstitution, byCountry, byTheme, tech };
  _overviewAt = Date.now();
  return _overviewCache;
}

export function refreshCollectionOverview() { _overviewCache = null; }

function overviewText(o) {
  if (!o || !o.total) return '';
  const top = (obj, n = 12) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([k, v]) => `${k} (${v})`).join(', ');
  return `\n\nWHOLE-COLLECTION OVERVIEW (you know all of this — use it for counts, comparisons, and "how many / which / what kinds" questions):
- Total objects: ${o.total}
- Institutions: ${top(o.byInstitution)}
- Countries: ${top(o.byCountry, 8)}
- Themes: ${top(o.byTheme)}
- Technology/devices: ${o.tech} objects flagged as technology.
When asked aggregate questions (how many, which museums, what themes, breakdowns), answer from this overview. When asked about specific objects, use the OBJECTS FOUND below.`;
}
const COLLECTION_INSTITUTIONS = {
  archai_pilot: 'Museums Victoria',
  archai_met: 'The Metropolitan Museum of Art',
  archai_va: 'Victoria and Albert Museum',
  archai_aic: 'Art Institute of Chicago',
  archai_cma: 'Cleveland Museum of Art',
  archai_rijks: 'Rijksmuseum',
  archai_europeana: 'Europeana',
  archai_auckland: 'Auckland Museum',
  archai_tepapa: 'Te Papa Tongarewa',
  archai_mplus: 'M+, Hong Kong',
  archai_brasiliana: 'Brasiliana Museus'
};

const SYSTEM_PROMPT = `You are the ARCHAI™ collection intelligence — a curatorial AI that has deep knowledge of every object across eleven live collection sources: Museums Victoria (Melbourne), The Metropolitan Museum of Art (NYC), the Victoria and Albert Museum (London), the Art Institute of Chicago, the Cleveland Museum of Art, the Rijksmuseum (Amsterdam), Europeana, Auckland Museum (Aotearoa New Zealand), Te Papa Tongarewa (Aotearoa New Zealand), M+ (Hong Kong), and Brasiliana Museus (Brazil).

You search the collection semantically and respond conversationally. You are NOT a generic chatbot. You are the voice of the collection itself.

RULES:
1. Answer based ONLY on the object records provided in context. If objects are provided, discuss them specifically with titles, dates, materials, and makers.
2. When discussing objects, be specific — cite the title, registration number, and institution.
3. Draw connections between objects when relevant — material similarities, temporal overlaps, cultural links.
4. If no relevant objects are found, say so honestly. Do not invent objects.
5. Keep responses conversational but scholarly. You're a knowledgeable curator, not a search engine.
6. Suggest follow-up questions or related avenues when appropriate.
7. If the user asks something completely outside museum collections, redirect gently to collection-related topics.
8. Use first person plural — "we have", "in our collection" — to position yourself as the institutional voice.

PERSONALITY: Knowledgeable, curious, slightly poetic. You love finding unexpected connections. You speak with the authority of thousands of objects and centuries of cultural knowledge. Think: a curator who's had one glass of wine at a gallery opening — warm, engaged, making connections others miss.`;

/**
 * Conversational search: interpret the user's question, search the collection,
 * and respond as a curatorial intelligence with the objects as context.
 */
export async function conversationalSearch(userMessage, history = []) {
  // Step 1: Search the collection using the user's message as query
  const searchResults = await curatorSearch(userMessage, 8);

  // Step 2: Build context from search results
  let objectContext = '';
  const citedObjects = [];

  if (searchResults.length > 0) {
    objectContext = '\n\nOBJECTS FOUND IN COLLECTION:\n';
    for (const result of searchResults) {
      const p = result.payload || {};
      const title = p.title || p.object_name || 'Untitled';
      const col = p._source_collection || 'unknown';
      const institution = COLLECTION_INSTITUTIONS[col] || 'ARCHAI collection';
      const reg = p.registration_number || p.accession_number || '';
      const date = p.date || p.date_display || p.production_date || '';
      const maker = p.maker || p.artist || p.creator || '';
      const materials = p.materials || p.medium || '';
      const type = p.type || p.object_type || p.classification || '';
      const desc = (p.description || p.ai || '').substring(0, 300);
      const score = result.score || 0;
      const commentCount = p._comment_count || 0;

      objectContext += `\n---\nTitle: ${title}\nInstitution: ${institution}\nRegistration: ${reg}\n`;
      if (date) objectContext += `Date: ${date}\n`;
      if (maker) objectContext += `Maker: ${maker}\n`;
      if (type) objectContext += `Type: ${type}\n`;
      if (materials) objectContext += `Materials: ${materials}\n`;
      if (desc) objectContext += `Description: ${desc}\n`;
      if (commentCount > 0) objectContext += `Visitor comments: ${commentCount}\n`;
      objectContext += `Relevance: ${(score * 100).toFixed(0)}%\n`;

      citedObjects.push({
        title,
        institution,
        registration: reg,
        collection: col,
        score,
        image: p.image_url || p.primaryImageSmall || p.media_thumbnail || '',
        date,
        maker,
        type,
      });
    }
  } else {
    objectContext = '\n\nNo objects found matching this query. Let the user know and suggest alternative search terms or broader concepts.';
  }

  // Step 3: Build messages for LLM — inject whole-collection overview so the
  // assistant reasons as one mind that knows the entire collection.
  const overview = overviewText(await getCollectionOverview());
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + overview + objectContext },
    ...history.slice(-8),
    { role: 'user', content: userMessage },
  ];

  // Step 4: Generate response
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000); // 2 min for cold model load
    const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages,
        stream: false,
        options: { num_predict: 600, temperature: 0.75 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      return {
        message: 'The collection intelligence is temporarily unavailable. Here are the objects I found:',
        objects: citedObjects,
        fallback: true,
      };
    }

    const data = await resp.json();
    const reply = data.message?.content || 'I could not formulate a response.';

    return {
      message: reply,
      objects: citedObjects,
      model: CHAT_MODEL,
      searchCount: searchResults.length,
    };
  } catch (e) {
    return {
      message: 'Connection to the language model failed. Showing search results instead.',
      objects: citedObjects,
      fallback: true,
      error: e.message,
    };
  }
}
