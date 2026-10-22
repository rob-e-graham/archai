// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
// Proprietary during the doctoral research period — see LICENSE.
import { env } from '../config/env.js';
import { curatorSearch } from './curator-vectors.js';
import { analyzeCuratorQuery } from './curator-search-ranking.js';
import {
  selectRelevant, notRecordedLine, checkReply, trimToSentence, logProvenance,
  crisisReply, wantsLongAnswer,
} from './converse-guard.js';
import { webExpand } from './web-expand.js';
import { randomUUID } from 'node:crypto';

const OLLAMA_URL = env.ollama.baseUrl;
const QDRANT_URL = env.qdrant.url;
const CURATOR_COLLECTION = 'archai_curator';
const CHAT_MODEL = env.ollama.curatorModel || env.ollama.chatModel || 'qwen2.5:14b';

// Models the visitor may choose between. Only these ids are accepted from the page.
export const CONVERSE_MODELS = [
  { id: 'qwen2.5:14b', label: 'Fast', size: '14B', note: 'About 5-20 seconds. Good for demos and quick questions.' },
  { id: 'qwen2.5:32b', label: 'Deeper', size: '32B', note: 'Slower (roughly 15-40 seconds, longer on first use). Better at following the rules and comparing records.' },
];
export function resolveModel(id) {
  return CONVERSE_MODELS.some((m) => m.id === id) ? id : CHAT_MODEL;
}
// Load a model into memory ahead of the first question. Ollama keeps one large model resident at a time,
// so switching costs a reload; doing it when the visitor picks the model hides that wait.
export async function warmConverseModel(id) {
  const model = resolveModel(id);
  try {
    await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: '', stream: false, keep_alive: '15m' }),
      signal: AbortSignal.timeout(240000),
    });
  } catch { /* the first real question will load it instead */ }
}
export async function listConverseModels() {
  let installed = null;
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(4000) });
    installed = new Set(((await r.json()).models || []).map((m) => m.name));
  } catch { /* leave null: report all as available */ }
  return {
    default: CHAT_MODEL,
    models: CONVERSE_MODELS.map((m) => ({ ...m, available: installed ? installed.has(m.id) : true })),
  };
}

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
13. Name only objects that appear under OBJECTS FOUND. Copy each title and registration number exactly as supplied. Never write a registration number, date, maker or measurement that is not in the supplied record. Do not add summary claims about a group of records (for example "all are in storage") unless every one of those records says so.
14. Each record lists "Not recorded" fields. If the user asks about one of them, say plainly that the record does not give it. Do not guess, and do not fill the gap from general knowledge. Write only what a record states: no background, purpose, series, history or symbolism of your own.
15. Length: answer in about 120 to 220 words unless the user asks for a full list or more detail. Always finish on a complete sentence. If you cannot cover every record, say how many more are in the result cards instead of stopping mid-list.
17. Format: when listing objects, number them from 1 and write each as one or two natural sentences (title in bold, maker, date, institution, and a short plain description if the record has one). Do not copy field labels such as "Type:" or "Materials:", do not print raw codes (for example "edanmdm"), and leave out any field the record does not have rather than writing "none recorded".
16. If PUBLIC WEB RESULTS are supplied, they are not museum records. Keep them in their own final paragraph that starts "From public sources (not part of the museum records):" and mark each statement with its marker, for example [W1]. Use only what the web results say. Never attach a web fact to a museum record as if the record stated it. If the web results do not help, say so in one sentence.

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


// ── Follow-ups: "5 more bird artworks", "show me others" ─────────────
const FOLLOWUP_RE = /\b(more|another|others?|different|else|next|additional|further|again)\b/i;
const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const normKey = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function requestedCount(message) {
  const m = String(message).match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\b(?=\s+(?:more|other|different|new|further|additional|bird|artworks?|objects?|items?|works?|pieces?|examples?|records?|\w+s\b))/i);
  if (!m) return 0;
  const n = /^\d/.test(m[1]) ? parseInt(m[1], 10) : NUMBER_WORDS[m[1].toLowerCase()];
  return n >= 1 && n <= 12 ? n : 0;
}

/** For a follow-up, search on the topic of the earlier question; drop counts and "more" words from the new one. */
export function followUpQuery(message, history) {
  const msg = String(message);
  if (!FOLLOWUP_RE.test(msg) || msg.length > 120) return { query: msg, followUp: false };
  const topic = msg
    .replace(/\b(show|give|find|get|tell|list)\b( me| us)?/gi, ' ')
    .replace(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, ' ')
    .replace(FOLLOWUP_RE, ' ')
    .replace(/\b(please|some|any|artworks?|objects?|items?|works?|pieces?|examples?|records?|of|the|that|these|those|can|you|could|i|would|like|to|see|about)\b/gi, ' ')
    .replace(/\s+/g, ' ').trim();
  const prev = [...history].reverse().find((h) => h.role === 'user' && !FOLLOWUP_RE.test(h.content));
  if (topic.length >= 3) return { query: topic + (prev && !normKey(prev.content).includes(normKey(topic)) ? '' : ''), followUp: true };
  return { query: prev ? prev.content : msg, followUp: !!prev };
}

const WEB_FORMAT_REMINDER = `

(Format reminder: answer from the museum records first. Then add a new paragraph that begins exactly "From public sources (not part of the museum records):" with two or three sentences that use only the PUBLIC WEB RESULTS, each sentence ending with its marker such as [W1]. If the web results are empty or unrelated, write that paragraph as one sentence saying no useful public sources were found.)`;

function buildObjectRecord(result) {
  const p = result.payload || {};
  const title = p.title || p.object_name || 'Untitled';
  const col = p._source_collection || 'unknown';
  const institution = COLLECTION_INSTITUTIONS[col] || 'ARCHAI collection';
  const reg = p.registration_number || p.accession_number || '';
  const date = p.date || p.date_display || p.production_date || '';
  const maker = p.maker || p.artist || p.creator || '';
  const materials = p.materials || p.medium || '';
  const type = p.type || p.object_type || p.classification || '';
  const rawDesc = p.description || p.ai || '';
  const score = result.score || 0;
  const imageAllowed = p.media_available !== false
    && p.media_placeholder !== true
    && p.media_public_display_allowed !== false;
  const image = imageAllowed
    ? (p.image_url || p.primaryImageSmall || p.media_thumbnail || p.media_medium || p.media_large || '')
    : '';

  const card = {
    title, institution, registration: reg, collection: col, score, image, date, maker, type,
    match: result.match || null,
    // Fields so the front-end can open a full object detail directly from chat
    _source_collection: col,
    canonical_id: p.canonical_id || '',
    registration_number: reg,
    object_type: type,
    medium: materials,
    description: rawDesc,
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
  };

  // The text the model is allowed to use. Layer 2: catalogue fields only. Layer 3: gaps stated.
  const relationship = result.match?.relationship || 'semantic';
  const evidence = result.match?.evidence || [];
  let text = `\n---\nTitle: ${title}\nInstitution: ${institution}\n${reg ? `Registration: ${reg}\n` : ''}`;
  if (date) text += `Date: ${date}\n`;
  if (maker) text += `Maker: ${maker}\n`;
  if (type) text += `Type: ${type}\n`;
  if (materials) text += `Materials: ${materials}\n`;
  if (rawDesc) text += `Description: ${String(rawDesc).substring(0, 500)}\n`;
  if ((p._comment_count || 0) > 0) text += `Visitor comments: ${p._comment_count}\n`;
  // Many source records carry the date and maker only inside the description text, so look there too.
  text += notRecordedLine({
    date: date || /\b\d{3,4}\b/.test(rawDesc),
    maker: maker || /\bmade by\b|\bby [A-Z]/.test(rawDesc),
    materials: materials || /\b(?:made (?:of|out of)|wood|metal|plastic|ceramic|glass|paper|silver|bronze|oil|canvas|ink|gelatin)\b/i.test(rawDesc),
    description: rawDesc,
  });
  text += `Match relationship: ${relationship}\n`;
  if (evidence.length) text += `Match evidence in metadata: ${evidence.join(', ')}\n`;
  text += `Relevance: ${(score * 100).toFixed(0)}%\n`;
  return { card, text };
}

function noMatchReply(message, webRequested) {
  const q = String(message).replace(/\s+/g, ' ').trim().slice(0, 80);
  return `I could not find records in the connected collection that match "${q}". `
    + 'The nearest items were only weak matches, so I have not listed them as if they answered your question. '
    + (webRequested
      ? ''
      : 'You could try different words (a material, a maker, a place or a period), or press "Expand with public web" to see what public sources say. Public web material is kept separate from the museum records.');
}

/**
 * Conversational search: interpret the user's question, search the collection,
 * and respond as a curatorial intelligence with the objects as context.
 *
 * Hallucination controls (see converse-guard.js): relevance cut-off before the model,
 * stated gaps in every record, a reply check after the model, and a provenance log.
 * `options.web` adds DuckDuckGo public-knowledge results, labelled as web material.
 */
export async function conversationalSearch(userMessage, history = [], options = {}) {
  const started = Date.now();
  const webRequested = options.web === true;
  const model = resolveModel(options.model);

  const crisis = crisisReply(userMessage);
  if (crisis) {
    logProvenance({ mode: 'crisis-route', queryChars: String(userMessage).length });
    return { message: crisis, objects: [], model: 'deterministic-safety-route', searchCount: 0, grounding: { mode: 'crisis-route' } };
  }

  // Step 1: Search the collection using the user's message as query
  const evidenceDiscovery = isEvidenceDiscoveryRequest(userMessage);
  const { query: searchQuery, followUp } = followUpQuery(userMessage, history);
  const wanted = requestedCount(userMessage);
  const exclude = Array.isArray(options.exclude) ? options.exclude.slice(0, 40) : [];
  const seenReg = new Set(exclude.map((e) => normKey(e.registration)).filter(Boolean));
  const seenTitle = new Set(exclude.map((e) => normKey(e.title)).filter(Boolean));
  let searchResults = await curatorSearch(searchQuery, followUp ? 12 + exclude.length : 12, null, {
    imageReady: evidenceDiscovery ? true : undefined,
    diversify: true,
  });
  if (followUp && exclude.length) {
    // "More" means different records: remove everything already shown earlier in this conversation.
    searchResults = searchResults.filter((r) => {
      const p = r.payload || {};
      const reg = normKey(p.registration_number || p.accession_number);
      const title = normKey(p.title || p.object_name);
      return !(reg && seenReg.has(reg)) && !(title && seenTitle.has(title));
    });
  }

  // Step 2 (layer 1): only records that really match reach the model.
  const { strong, weak, mode, top } = evidenceDiscovery
    ? { strong: searchResults, weak: [], mode: 'records', top: 0 }
    : selectRelevant(searchResults, userMessage);

  const built = strong.slice(0, Math.max(8, wanted + 2)).map(buildObjectRecord);
  const citedObjects = built.map((b) => b.card);
  let objectContext = '';
  if (built.length) {
    objectContext = '\n\nOBJECTS FOUND IN COLLECTION:\n' + built.map((b) => b.text).join('');
  } else if (mode === 'aggregate') {
    objectContext = '\n\nNo individual records were retrieved. Answer only from the whole-collection overview above.';
  } else {
    objectContext = '\n\nNo records in the collection match this question. Say so plainly. Do not name or describe any object.';
  }

  if (evidenceDiscovery) {
    const out = {
      message: discoverySummary(citedObjects),
      objects: citedObjects,
      model: 'deterministic-evidence-summary',
      searchCount: searchResults.length,
    };
    logProvenance({ mode: 'evidence-discovery', results: citedObjects.length, ms: Date.now() - started });
    return out;
  }

  // Optional: public-knowledge expansion (only when requested).
  let web = null;
  if (webRequested) {
    try { web = await webExpand(userMessage, citedObjects); } catch { web = { queries: [], results: [] }; }
  }
  const webContext = web
    ? '\n\nPUBLIC WEB RESULTS (DuckDuckGo; NOT museum records):\n'
      + (web.results.length
        ? web.results.map((r, i) => `[W${i + 1}] (${r.source}) ${r.text}`).join('\n')
        : '(No public web results were found for this question.)')
    : '';

  // No match and no web: answer deterministically. No model call, nothing to invent, and it is instant.
  if (mode === 'none' && !webRequested) {
    const message = noMatchReply(userMessage, false);
    logProvenance({ mode: 'no-match', top, retrieved: searchResults.length, ms: Date.now() - started });
    return { message, objects: [], weakCount: weak.length, model: 'deterministic-no-match', searchCount: searchResults.length, noMatch: true, grounding: { mode: 'no-match', top } };
  }

  // Step 3: Build messages for LLM — inject whole-collection overview so the
  // assistant reasons as one mind that knows the entire collection.
  const overview = overviewText(await getCollectionOverview());
  const countNote = wanted
    ? `\n\nThe user asked for ${wanted} items. List exactly ${wanted} different records from OBJECTS FOUND, or fewer if fewer are relevant, and say so.`
    : '';
  const followNote = followUp
    ? '\n\nThis is a follow-up asking for more. Every record in OBJECTS FOUND is new to the user, so do not repeat records from earlier in the conversation.'
    : '';
  if (followUp && !built.length && mode !== 'aggregate') {
    const message = 'I have shown you the strongest matches for that already, and I cannot find further records in the collection that fit as well. You could widen the topic (for example a related subject, material or period), or press "Expand with public web".';
    logProvenance({ mode: 'followup-exhausted', excluded: exclude.length, ms: Date.now() - started });
    return { message, objects: [], model: 'deterministic-no-more', searchCount: searchResults.length, noMatch: true, grounding: { mode: 'followup-exhausted' } };
  }
  const contextForCheck = overview + objectContext + webContext + ' ' + userMessage + ' ' + history.map((h) => h.content).join(' ');
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + overview + objectContext + webContext + countNote + followNote },
    ...history.slice(-8).map((h) => ({ role: h.role, content: String(h.content).slice(0, 1500) })),
    { role: 'user', content: userMessage + (web ? WEB_FORMAT_REMINDER : '') },
  ];
  const evidenceText = overview + objectContext + webContext;

  // Step 4: Generate response
  const longAnswer = wantsLongAnswer(userMessage);
  const numPredict = longAnswer ? 1400 : 900;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 240000); // cold model load plus a longer answer
    const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        keep_alive: '15m', // keep the model resident — avoids slow cold reloads between questions
        options: { num_predict: numPredict, temperature: 0.2 },
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
    let reply = data.message?.content || 'I could not formulate a response.';

    // Reached the token limit: cut at a clean sentence and let the page offer "Continue".
    const truncated = data.done_reason === 'length';
    if (truncated) reply = trimToSentence(reply);

    // Layer 4: check the reply against what the model was actually given.
    const checked = checkReply(reply, contextForCheck, { webCount: web ? web.results.length : 0, evidenceText });
    reply = checked.text;

    const grounding = {
      mode, top: Number(top.toFixed(3)),
      usedRecords: citedObjects.length, withheldWeakMatches: weak.length,
      removedClaims: checked.removed.length, unsupportedYears: checked.unsupportedYears,
      clean: checked.clean, truncated,
    };
    const answerId = randomUUID().slice(0, 8);
    grounding.answerId = answerId;
    logProvenance({
      answerId, ...grounding, model, web: web ? { queries: web.queries, results: web.results.length } : false,
      records: citedObjects.map((o) => ({ reg: o.registration, title: o.title.slice(0, 60), score: Number(o.score.toFixed(3)) })),
      removed: checked.removed, ms: Date.now() - started,
    });

    return {
      message: reply,
      objects: citedObjects,
      weakCount: weak.length,
      model,
      searchCount: searchResults.length,
      truncated,
      grounding,
      web: web ? { used: true, queries: web.queries, results: web.results.map(({ text, url, source }) => ({ text, url, source })) } : { used: false },
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
