// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
// Proprietary during the doctoral research period - see LICENSE.

const AI_QUERY_PATTERN = /\b(?:artificial intelligence|machine learning|deep learning|neural networks?|large language models?|llms?|generative ai|computer vision|autonomous agents?)\b/i;
const AI_QUERY_ACRONYM_PATTERN = /(?:^|[^A-Za-z])A\.?I\.?(?:[^A-Za-z]|$)|\bai\b(?=\s+(?:art|artworks?|objects?|technology|systems?|generated|ethics|models?))/;
const IMAGE_QUERY_PATTERN = /\b(?:image|images|picture|pictures|visual|display|online exhibition|online show|digital exhibition|gallery show)\b/i;
const BROAD_QUERY_PATTERN = /\b(?:all collections?|across (?:the )?(?:collection|collections|archive|archives)|look through all|connected collections?)\b/i;

const AI_QUERY_VARIANTS = [
  'artificial intelligence machine learning neural networks generative AI computer vision autonomous agents',
  'computational art algorithmic art computer-generated art cybernetics robotics automation human-machine interaction',
  'digital systems software code data networks surveillance interactive media virtual simulation electronic technology',
];

const EXPLICIT_AI_SIGNALS = [
  ['artificial intelligence', /\bartificial intelligence\b/i],
  ['machine learning', /\bmachine learning\b/i],
  ['deep learning', /\bdeep learning\b/i],
  ['neural network', /\bneural networks?\b/i],
  ['large language model', /\blarge language models?\b|\bLLMs?\b/i],
  ['generative AI', /\bgenerative ai\b/i],
  ['computer vision', /\bcomputer vision\b/i],
];

const AI_ACRONYM_SIGNALS = [
  ['AI', /(?:^|[^A-Za-z])A\.?I\.?(?:[^A-Za-z]|$)/],
];

const COMPUTATIONAL_SIGNALS = [
  ['algorithmic', /\balgorithm(?:ic|s)?\b/i],
  ['computational', /\bcomputational\b/i],
  ['computer-generated', /\bcomputer[ -]generated\b/i],
  ['cybernetic', /\bcybernetics?\b|\bcybernetic\b/i],
  ['robotics', /\brobot(?:ic|ics|s)?\b/i],
  ['automation', /\bautomat(?:a|ed|ion|ous)\b/i],
  ['autonomous agent', /\bautonomous agents?\b/i],
];

const CONTEXTUAL_TECH_SIGNALS = [
  ['computer', /\bcomputers?\b/i],
  ['software', /\bsoftware\b/i],
  ['code', /\bcoding\b|\bsource code\b|\bcomputer code\b/i],
  ['data', /\bdata(?:base|set|sets)?\b/i],
  ['digital', /\bdigital\b/i],
  ['electronic', /\belectronic\b/i],
  ['interactive', /\binteractive\b|\binteractivity\b/i],
  ['network', /\bnetworks?\b/i],
  ['surveillance', /\bsurveillance\b|\bsousveillance\b/i],
  ['virtual', /\bvirtual\b/i],
  ['simulation', /\bsimulat(?:e|ed|ion|or|ors)\b/i],
  ['human-machine', /\bhuman[ -]machine\b/i],
  ['machine', /\bmachines?\b/i],
  ['information system', /\binformation systems?\b/i],
];

function textValue(value) {
  if (Array.isArray(value)) return value.join(' ');
  if (value && typeof value === 'object') return Object.values(value).join(' ');
  return String(value || '');
}

function payloadText(payload = {}, titleOnly = false) {
  const titleFields = [
    payload.title,
    payload.object_name,
    payload.category,
    payload.object_type,
    payload.type,
    payload.classification,
  ];
  if (titleOnly) return titleFields.map(textValue).join(' ');
  const description = textValue(payload.description || payload.ai || payload.embedding_text).slice(0, 2500);
  return [
    ...titleFields,
    description,
    payload.medium,
    payload.materials,
    payload.artist,
    payload.maker,
    payload.creator,
    payload.keywords,
    payload.themes,
    payload.discipline,
  ].map(textValue).join(' ');
}

function payloadExtendedText(payload = {}) {
  return textValue(payload.description || payload.ai || payload.embedding_text).slice(2500, 20000);
}

function matchedSignals(text, signals) {
  return signals.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function sourceCollection(result) {
  return result.payload?._source_collection || result.payload?.source_collection || result.payload?.source || 'unknown';
}

function stableResultKey(result) {
  const payload = result.payload || {};
  return String(payload.canonical_id || `${sourceCollection(result)}:${payload._source_id || payload.source_record_id || payload.registration_number || result.id}`);
}

function resultFamily(result) {
  const payload = result.payload || {};
  const maker = textValue(payload.artist || payload.maker || payload.creator).trim().toLowerCase();
  const type = textValue(payload.object_type || payload.type || payload.classification || payload.category).trim().toLowerCase();
  return `${sourceCollection(result)}:${maker || 'unknown'}:${type || 'unclassified'}`;
}

export function exhibitionImageUrl(payload = {}) {
  if (payload.media_available === false || String(payload.media_available).toLowerCase() === 'false') return '';
  if (payload.media_placeholder === true || String(payload.media_placeholder).toLowerCase() === 'true') return '';
  if (payload.media_public_display_allowed === false || String(payload.media_public_display_allowed).toLowerCase() === 'false') return '';

  const source = String(payload.source || payload._source_collection || '').toLowerCase();
  if (source === 'tate' || source === 'getty' || source === 'archai_tate' || source === 'archai_getty') return '';

  const image = payload.media_large
    || payload.media_medium
    || payload.media_thumbnail
    || payload.image_url
    || payload.primaryImageSmall
    || payload.primaryImage
    || '';
  if (/digital image not yet created|no[ _-]?image|placeholder/i.test(String(image))) return '';
  return String(image).trim();
}

export function analyzeCuratorQuery(query) {
  const value = String(query || '');
  return {
    ai: AI_QUERY_PATTERN.test(value) || AI_QUERY_ACRONYM_PATTERN.test(value),
    imageIntent: IMAGE_QUERY_PATTERN.test(value),
    broad: BROAD_QUERY_PATTERN.test(value),
  };
}

export function buildCuratorQueryVariants(query) {
  const value = String(query || '').trim();
  const intent = analyzeCuratorQuery(value);
  return intent.ai ? [value, ...AI_QUERY_VARIANTS] : [value];
}

export function mergeCuratorResultSets(resultSets = []) {
  const merged = new Map();
  for (const results of resultSets) {
    results.forEach((result, index) => {
      const key = stableResultKey(result);
      const existing = merged.get(key) || {
        ...result,
        _semantic_score: 0,
        _rrf_score: 0,
        _query_hits: 0,
      };
      existing._semantic_score = Math.max(existing._semantic_score, Number(result.score) || 0);
      existing._rrf_score += 1 / (60 + index + 1);
      existing._query_hits += 1;
      if (!existing.payload && result.payload) existing.payload = result.payload;
      merged.set(key, existing);
    });
  }
  return [...merged.values()];
}

export function buildMetadataCandidate(result) {
  return {
    ...result,
    score: Number(result.score) || 0.54,
    _semantic_score: Number(result.score) || 0.54,
    _rrf_score: 0,
    _query_hits: 1,
  };
}

function classifyResult(result, intent) {
  const payload = result.payload || {};
  const titleText = payloadText(payload, true);
  const fullText = payloadText(payload, false);
  const extendedText = payloadExtendedText(payload);
  const explicitTitle = matchedSignals(titleText, EXPLICIT_AI_SIGNALS);
  const explicit = matchedSignals(fullText, EXPLICIT_AI_SIGNALS);
  const acronymTitle = matchedSignals(titleText, AI_ACRONYM_SIGNALS);
  const acronym = matchedSignals(fullText, AI_ACRONYM_SIGNALS);
  const extendedExplicit = matchedSignals(extendedText, [...EXPLICIT_AI_SIGNALS, ...AI_ACRONYM_SIGNALS]);
  const computationalTitle = matchedSignals(titleText, COMPUTATIONAL_SIGNALS);
  const computational = matchedSignals(fullText, COMPUTATIONAL_SIGNALS);
  const contextualTitle = matchedSignals(titleText, CONTEXTUAL_TECH_SIGNALS);
  const contextual = matchedSignals(fullText, CONTEXTUAL_TECH_SIGNALS);
  const image = exhibitionImageUrl(payload);

  let relationship = 'semantic';
  let evidence = [];
  if (explicit.length || acronymTitle.length) {
    relationship = 'direct';
    evidence = [...new Set([...explicit, ...acronymTitle])];
  } else if (computational.length) {
    relationship = 'related';
    evidence = computational;
  } else if (acronym.length || contextual.length) {
    relationship = 'contextual';
    evidence = [...new Set([...acronym.map(() => 'AI reference'), ...contextual])];
  }
  if (relationship === 'contextual') evidence = contextual;
  if (relationship === 'contextual' && acronym.length) {
    evidence = [...new Set(['AI reference', ...contextual])];
  }
  if (relationship === 'semantic' && extendedExplicit.length) {
    relationship = 'contextual';
    evidence = ['AI mentioned in extended description'];
  }

  let score = Number(result._semantic_score ?? result.score) || 0;
  score += Math.min(0.2, explicitTitle.length * 0.1);
  score += Math.min(0.16, explicit.length * 0.045);
  score += Math.min(0.13, computationalTitle.length * 0.065);
  score += Math.min(0.1, computational.length * 0.035);
  score += Math.min(0.07, contextual.length * 0.018);
  score += Math.min(0.06, Math.max(0, (result._query_hits || 1) - 1) * 0.025);
  if (image) score += payload.media_large ? 0.045 : payload.media_medium ? 0.035 : 0.015;

  return {
    ...result,
    score: Math.min(0.99, score),
    match: {
      relationship,
      evidence,
      imageReady: Boolean(image),
      queryVariantsMatched: result._query_hits || 1,
    },
    _ranking_score: score,
    _source: sourceCollection(result),
    _keepForAi: !intent.ai
      || relationship === 'direct'
      || relationship === 'related'
      || acronym.length > 0
      || extendedExplicit.length > 0
      || contextualTitle.length > 0
      || contextual.length >= 2
      || (result._query_hits || 1) >= 2,
  };
}

function diversify(results, limit) {
  const pool = [...results];
  const selected = [];
  const sourceCounts = new Map();
  const familyCounts = new Map();

  while (pool.length && selected.length < limit) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    pool.forEach((result, index) => {
      const count = sourceCounts.get(result._source) || 0;
      const family = resultFamily(result);
      const familyCount = familyCounts.get(family) || 0;
      const diversityPenalty = (count * 0.04) + (familyCount * 0.13);
      const adjusted = result._ranking_score - diversityPenalty;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIndex = index;
      }
    });
    const [next] = pool.splice(bestIndex, 1);
    selected.push(next);
    sourceCounts.set(next._source, (sourceCounts.get(next._source) || 0) + 1);
    const family = resultFamily(next);
    familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
  }
  return selected;
}

export function rankCuratorResults(results, query, options = {}) {
  const intent = { ...analyzeCuratorQuery(query), ...options.intent };
  const limit = Math.max(1, Number(options.limit) || 10);
  const imageReady = options.imageReady ?? intent.imageIntent;
  const shouldDiversify = options.diversify ?? (intent.broad || !options.collection);

  const ranked = results
    .map((result) => classifyResult(result, intent))
    .filter((result) => result._keepForAi)
    .filter((result) => !imageReady || result.match.imageReady)
    .sort((a, b) => b._ranking_score - a._ranking_score);

  let selected;
  if (!shouldDiversify) {
    selected = ranked.slice(0, limit);
  } else if (intent.ai) {
    const evidencePool = ranked.filter((result) => ['direct', 'related'].includes(result.match.relationship));
    const evidenceBacked = [];
    const evidenceFamilyCounts = new Map();
    const familyCap = options.familyCap ?? 3;
    const orderedEvidence = [
      ...diversify(evidencePool.filter((result) => result.match.relationship === 'direct'), evidencePool.length),
      ...diversify(evidencePool.filter((result) => result.match.relationship === 'related'), evidencePool.length),
    ];
    for (const result of orderedEvidence) {
      const family = resultFamily(result);
      const count = evidenceFamilyCounts.get(family) || 0;
      if (count >= familyCap) continue;
      evidenceBacked.push(result);
      evidenceFamilyCounts.set(family, count + 1);
      if (evidenceBacked.length >= limit) break;
    }
    const contextual = diversify(ranked.filter((result) => result.match.relationship === 'contextual'), limit - evidenceBacked.length);
    selected = [...evidenceBacked, ...contextual].slice(0, limit);
  } else {
    selected = diversify(ranked, limit);
  }
  return selected.map(({ _ranking_score, _source, _keepForAi, _semantic_score, _rrf_score, _query_hits, ...result }) => result);
}
