// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
// Proprietary during the doctoral research period — see LICENSE.
import { env } from '../config/env.js';
import { curatorSearch } from './curator-vectors.js';
import { analyzeCuratorQuery } from './curator-search-ranking.js';

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
  archai_brasiliana: 'Brasiliana Museus',
  archai_smithsonian: 'Smithsonian Institution',
  archai_tate: 'Tate',
  archai_streetart: 'Public Street Art',
  archai_getty: 'J. Paul Getty Museum',
  archai_wellcome: 'Wellcome Collection',
  archai_qagoma: 'QAGOMA',
  archai_rawg: 'RAWG Video Games Database',
  archai_nga: 'National Gallery of Art',
  archai_acmi: 'Australian Centre for the Moving Image (ACMI)',
  archai_wikimedia: 'Wikimedia Commons',
  archai_internetarchive: 'Internet Archive',
  archai_loc: 'Library of Congress',
  archai_dpla: 'Digital Public Library of America',
  archai_trove: 'Trove · National Library of Australia',
  archai_nasa: 'NASA Image and Video Library',
};

const SYSTEM_PROMPT = `You are ARCHAI — Augmented Reanimation of Cultural Heritage through Artificial Intelligence. You are the collection intelligence: a curatorial AI that helps staff examine connected cultural records as one governed research layer. You have access to the connected sources named in the object context and whole-collection overview. Treat source metadata as evidence, preserve institutional provenance, and never imply that a connected source endorses ARCHAI.

If asked who or what you are, say you are ARCHAI — Augmented Reanimation of Cultural Heritage AI — sovereign infrastructure that helps people search and interpret connected collection records. You search semantically and respond conversationally. You are not an institutional spokesperson, and you must not claim that an institution, community, artist, or object literally speaks through you.

RULES:
1. Answer based ONLY on the object records provided in context. If objects are provided, discuss them specifically with titles, dates, materials, and makers.
2. When discussing objects, be specific — cite the title, registration number, and institution.
3. Separate evidence levels exactly as supplied. "direct" means the metadata explicitly names AI. "related" means it names computational, algorithmic, cybernetic, robotic or automated practice. "contextual" is a broader curatorial lead.
4. If no relevant objects are found, say so honestly. Do not invent objects.
5. Keep responses conversational but scholarly. You're a knowledgeable curator, not a search engine.
6. Suggest follow-up questions or related avenues when appropriate.
7. If the user asks something completely outside museum collections, redirect gently to collection-related topics.
8. Refer to "the connected collection" or the named source institution. Do not use "our collection" or imply that ARCHAI owns or speaks for source records.
9. Treat the supplied Match relationship and evidence as a hard boundary. Never manufacture a connection to the user's topic when the record is marked contextual, and say when only adjacent material was found.
10. Never infer appearance, meaning, intent, symbolism or significance from a title or object type. Do not write that a work "explores", "evokes", "features" or "represents" something unless the supplied Description explicitly states that claim. If the record only supplies title, maker and type, report only those fields.
11. Do not call every result an AI artwork. Explain that an exhibition search can include explicit AI works, computational precedents and contextual material, and keep those categories distinct.
12. When many objects are supplied, summarise the evidence levels and discuss no more than six of the strongest examples unless the user explicitly asks for a complete list. The object cards provide the fuller result set.

PERSONALITY: Knowledgeable, curious and clear. Use measured museum language. Prefer evidence and useful distinctions over decorative interpretation.`;

function isEvidenceDiscoveryRequest(message) {
  const intent = analyzeCuratorQuery(message);
  return intent.ai && /\b(?:find|show|list|looking for|search|exhibition|online show|artworks?|objects?|pictures?|images?)\b/i.test(String(message));
}

function discoverySummary(objects) {
  const groups = {
    direct: objects.filter((object) => object.match?.relationship === 'direct'),
    related: objects.filter((object) => object.match?.relationship === 'related'),
    contextual: objects.filter((object) => object.match?.relationship === 'contextual'),
  };
  const lines = [
    `I found ${objects.length} image-ready records and separated them by the strength of their source metadata.`,
  ];

  const addGroup = (heading, records, limit, explanation) => {
    if (!records.length) return;
    lines.push('', heading, explanation);
    records.slice(0, limit).forEach((record, index) => {
      const details = [record.maker, record.date, record.institution].filter(Boolean).join(', ');
      const evidence = record.match?.evidence?.join(', ') || 'semantic match';
      lines.push(`${index + 1}. ${record.title}${details ? ` (${details})` : ''}. Metadata evidence: ${evidence}.`);
    });
  };

  addGroup(
    'Explicit AI metadata',
    groups.direct,
    4,
    'These records explicitly name artificial intelligence in their catalogue text or title.',
  );
  addGroup(
    'Computational and robotic precedents',
    groups.related,
    6,
    'These records name computational, computer-generated, robotic or automated practice. They are relevant precedents, but the source metadata does not describe them as AI artworks.',
  );
  if (!groups.direct.length && !groups.related.length) {
    lines.push('', 'No records with explicit AI or computational evidence were found in the current index.');
  }
  if (groups.contextual.length) {
    lines.push('', `${groups.contextual.length} broader contextual leads are included in the result cards. They should be reviewed by a curator before entering an exhibition.`);
  }
  lines.push('', 'The current explicit evidence is concentrated in a small number of connected sources, so the result set should be treated as a research shortlist rather than a finished exhibition selection.');
  return lines.join('\n');
}

/**
 * Conversational search: interpret the user's question, search the collection,
 * and respond as a curatorial intelligence with the objects as context.
 */
export async function conversationalSearch(userMessage, history = []) {
  // Step 1: Search the collection using the user's message as query
  const evidenceDiscovery = isEvidenceDiscoveryRequest(userMessage);
  const searchResults = await curatorSearch(userMessage, 12, null, {
    imageReady: evidenceDiscovery ? true : undefined,
    diversify: true,
  });

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
      const relationship = result.match?.relationship || 'semantic';
      const evidence = result.match?.evidence || [];
      const imageAllowed = p.media_available !== false
        && p.media_placeholder !== true
        && p.media_public_display_allowed !== false;
      const image = imageAllowed
        ? (p.image_url || p.primaryImageSmall || p.media_thumbnail || p.media_medium || p.media_large || '')
        : '';

      objectContext += `\n---\nTitle: ${title}\nInstitution: ${institution}\nRegistration: ${reg}\n`;
      if (date) objectContext += `Date: ${date}\n`;
      if (maker) objectContext += `Maker: ${maker}\n`;
      if (type) objectContext += `Type: ${type}\n`;
      if (materials) objectContext += `Materials: ${materials}\n`;
      if (desc) objectContext += `Description: ${desc}\n`;
      if (commentCount > 0) objectContext += `Visitor comments: ${commentCount}\n`;
      objectContext += `Match relationship: ${relationship}\n`;
      if (evidence.length) objectContext += `Match evidence in metadata: ${evidence.join(', ')}\n`;
      objectContext += `Relevance: ${(score * 100).toFixed(0)}%\n`;

      citedObjects.push({
        title,
        institution,
        registration: reg,
        collection: col,
        score,
        image,
        date,
        maker,
        type,
        match: result.match || null,
        // Fields so the front-end can open a full object detail directly from chat
        _source_collection: col,
        canonical_id: p.canonical_id || '',
        registration_number: reg,
        object_type: type,
        medium: materials,
        description: p.description || p.ai || '',
        source_url: p.source_url || '',
        media_medium: p.media_medium || '',
        media_large: p.media_large || '',
        media_thumbnail: p.media_thumbnail || '',
        image_url: p.image_url || p.primaryImageSmall || '',
        media_available: p.media_available,
        media_placeholder: p.media_placeholder,
        media_placeholder_reason: p.media_placeholder_reason || '',
        media_public_display_allowed: p.media_public_display_allowed,
        // Rights fields so the detail view shows the legal status when opened from chat
        licence: p.licence || '',
        media_rights_title: p.media_rights_title || '',
        media_rights_mode: p.media_rights_mode || '',
        rights_notes: p.rights_notes || '',
      });
    }
  } else {
    objectContext = '\n\nNo objects found matching this query. Let the user know and suggest alternative search terms or broader concepts.';
  }

  if (evidenceDiscovery) {
    return {
      message: discoverySummary(citedObjects),
      objects: citedObjects,
      model: 'deterministic-evidence-summary',
      searchCount: searchResults.length,
    };
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
        keep_alive: '15m', // keep the model resident — avoids slow cold reloads between questions
        options: { num_predict: 420, temperature: 0.25 },
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
