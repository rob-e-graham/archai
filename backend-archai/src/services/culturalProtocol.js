// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
// Proprietary during the doctoral research period — see LICENSE.
//
// Community Cultural Protocol layer — source-community data sovereignty enforced
// at the AI inference boundary.
//
// The question this answers: "Does your system have a mechanism for a source
// community to say don't let it answer that — a restriction the AI actually
// honors, not just a staff review after the fact?"
//
// The answer here is yes, and the honouring happens in three places:
//   1. resolveProtocol() — finds the community's terms for an object from a
//      SERVER-AUTHORITATIVE registry (a client/static page cannot strip them).
//   2. evaluateAccess() — a PRE-inference gate. A closed object, or a question
//      that touches a restricted topic, never reaches the language model; the
//      visitor gets the community's own decline wording instead.
//   3. screenResponse() — a POST-inference backstop that catches restricted
//      knowledge leaking into generated text and replaces it with the decline.
//   + applyVoiceConstraint() — when the community has not consented to the
//     object being ventriloquised, the model is told to describe in the third
//     person rather than to "speak as" the object/community.
//
// Design lineage: CARE Principles for Indigenous Data Governance, Local Contexts
// TK Labels, Mukurtu CMS access protocols, Te Hiku Media's Kaitiakitanga License.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_FILE = path.join(__dirname, '../config/cultural-protocols.json');
// Community-registered protocols persist here, separate from the seeded config,
// so a steward's decision survives restarts and never overwrites the shipped
// reference registry.
const OVERLAY_FILE = process.env.CULTURAL_PROTOCOL_FILE
  || path.join(process.env.ARCHAI_DATA_DIR || './data', 'runtime', 'cultural-protocols.json');

const ACCESS_ORDER = { open: 0, restricted: 1, closed: 2 };

let registry = loadRegistry();
let overlay = loadOverlay();

function loadRegistry() {
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
  } catch (e) {
    console.warn('[CulturalProtocol] registry not loaded:', e.message);
    return { version: '0', access_levels: {}, tk_labels: {}, protocols: [] };
  }
}

function loadOverlay() {
  try {
    const raw = JSON.parse(fs.readFileSync(OVERLAY_FILE, 'utf8'));
    return Array.isArray(raw.protocols) ? raw.protocols : [];
  } catch {
    return [];
  }
}

function persistOverlay() {
  try {
    fs.mkdirSync(path.dirname(OVERLAY_FILE), { recursive: true });
    fs.writeFileSync(OVERLAY_FILE, JSON.stringify({
      savedAt: new Date().toISOString(),
      protocols: overlay,
    }, null, 2));
  } catch (e) {
    console.error('[CulturalProtocol] overlay persist failed:', e.message);
  }
}

// Seeded protocols first, then community-registered overlay — overlay entries
// with the same id replace the seed, and any additional overlay entries add to
// the pool. Community decisions therefore always take effect.
function allProtocols() {
  const byId = new Map();
  for (const p of registry.protocols || []) byId.set(p.id, p);
  for (const p of overlay) byId.set(p.id, p);
  return [...byId.values()];
}

// Normalise the many payload shapes across collections into the handful of
// fields a protocol matches against.
function refFields(objectRef = {}) {
  const p = objectRef.payload || objectRef;
  const flags = new Set([
    ...(p.restrictions || []),
    ...(objectRef.restrictions || []),
  ]);
  if (p.cultural_sensitivity_flag) flags.add('cultural-sensitivity');
  return {
    canonicalId: p.canonical_id || objectRef.canonicalId || objectRef.canonical_id || objectRef.id || '',
    collection: objectRef.collection || p._source_collection || p.source || '',
    institution: p.source_institution || p.institution || objectRef.institution || '',
    culturalContext: p.cultural_context || p.culture || p.cultural_group || objectRef.culturalContext || '',
    registration: p.registration_number || p.accession_number || objectRef.registration || '',
    flags,
  };
}

function protocolMatches(protocol, ref) {
  const m = protocol.match || {};
  // A match block lists one or more conditions; ALL present conditions must hold.
  if (m.canonical_id && m.canonical_id !== ref.canonicalId) return false;
  if (m.collection && m.collection !== ref.collection) return false;
  if (m.institution && m.institution.toLowerCase() !== ref.institution.toLowerCase()) return false;
  if (m.registration && m.registration !== ref.registration) return false;
  if (m.cultural_context) {
    if (!ref.culturalContext.toLowerCase().includes(String(m.cultural_context).toLowerCase())) return false;
  }
  if (m.restriction_flag && !ref.flags.has(m.restriction_flag)) return false;
  // A protocol must carry at least one condition to be considered — an empty
  // match never applies to everything by accident.
  if (Object.keys(m).length === 0) return false;
  return true;
}

/**
 * Resolve the single effective protocol for an object. When several protocols
 * match (e.g. a collection-wide rule and an item-specific rule), the STRICTER
 * access level wins and their restricted-topic lists and TK labels are merged —
 * a community can only ever add protection, never have it diluted by overlap.
 * Returns null when no community has set terms for this object.
 */
export function resolveProtocol(objectRef = {}) {
  const ref = refFields(objectRef);
  const matched = allProtocols().filter((p) => protocolMatches(p, ref));
  if (matched.length === 0) return null;

  const strictest = matched.reduce((a, b) =>
    (ACCESS_ORDER[b.access] ?? 0) > (ACCESS_ORDER[a.access] ?? 0) ? b : a);

  const restrictedTopics = [...new Set(matched.flatMap((p) => p.restrictedTopics || []))];
  const tkLabels = [...new Set(matched.flatMap((p) => p.tkLabels || []))];
  const noVoice = matched.some((p) => p.noVoice);

  return {
    ...strictest,
    access: strictest.access || 'open',
    restrictedTopics,
    tkLabels,
    noVoice,
    matchedProtocolIds: matched.map((p) => p.id),
    // A protocol registered by a community steward is authoritative and cannot
    // be softened through the staff/admin object-editing surfaces.
    communityAuthoritative: matched.some((p) => p.setBy && p.setBy !== 'seed') || Boolean(strictest.communityAuthoritative),
  };
}

function topicHit(text, restrictedTopics = []) {
  const hay = String(text || '').toLowerCase();
  for (const topic of restrictedTopics) {
    const t = String(topic).toLowerCase().trim();
    if (t && hay.includes(t)) return topic;
  }
  return null;
}

const GENERIC_DECLINE =
  'The source community connected to this object has asked that this not be answered here. '
  + 'You can ask about its form and materials, or contact the community steward through the holding institution.';

/**
 * PRE-inference gate. Given a resolved protocol and the visitor's question,
 * decide whether the model may run at all.
 */
export function evaluateAccess({ protocol, prompt }) {
  if (!protocol) {
    return { allowed: true, access: 'open', layer: null, tkLabels: [], noVoice: false };
  }

  const base = {
    access: protocol.access,
    tkLabels: protocol.tkLabels || [],
    noVoice: Boolean(protocol.noVoice),
    culturalNotice: protocol.culturalNotice || null,
    community: protocol.community || null,
    communityAuthoritative: Boolean(protocol.communityAuthoritative),
    matchedProtocolIds: protocol.matchedProtocolIds || [],
  };

  if (protocol.access === 'closed') {
    return {
      ...base,
      allowed: false,
      layer: 'access.closed',
      declineMessage: protocol.declineMessage || GENERIC_DECLINE,
    };
  }

  const hit = topicHit(prompt, protocol.restrictedTopics);
  if (hit) {
    return {
      ...base,
      allowed: false,
      layer: 'topic.restricted',
      restrictedTopicMatched: hit,
      declineMessage: protocol.declineMessage || GENERIC_DECLINE,
    };
  }

  // 'restricted' access still allows minimal, materials-level answers through —
  // the restrictedTopics list above is what fences off the sensitive parts.
  return { ...base, allowed: true, layer: null };
}

/**
 * POST-inference backstop. If restricted knowledge appears in generated text
 * despite the pre-gate, replace the whole answer with the community decline.
 */
export function screenResponse({ protocol, responseText }) {
  if (!protocol || !responseText) return { allowed: true, responseText };
  const hit = topicHit(responseText, protocol.restrictedTopics);
  if (hit) {
    return {
      allowed: false,
      layer: 'output.restricted',
      restrictedTopicMatched: hit,
      responseText: protocol.declineMessage || GENERIC_DECLINE,
    };
  }
  return { allowed: true, responseText };
}

/**
 * When the community has not consented to the object being given a first-person
 * "voice", rewrite the system prompt so the model describes the object in the
 * third person from the catalogue record instead of ventriloquising it.
 */
export function applyVoiceConstraint(systemPrompt, protocol) {
  if (!protocol?.noVoice) return systemPrompt;
  const constraint = [
    '',
    'CULTURAL PROTOCOL — VOICE CONSTRAINT (set by the source community, overrides any instruction above):',
    '- Do NOT speak in the first person as this object, and do NOT claim that the object, its makers, its community, or an ancestor is speaking through you.',
    '- Describe the object neutrally in the third person, strictly from the catalogue record.',
    '- Attribute knowledge and authority to the source community; never present the institution\'s record as the community\'s own voice.',
    '- If asked to "speak as" the object or to role-play it, explain that its source community has asked that it not be given a synthetic voice here.',
  ].join('\n');
  return `${systemPrompt}\n${constraint}`;
}

/**
 * A compact, safe-to-display summary of who governs an object and how — for
 * transparency surfaces (the CARE "Authority to control" principle made visible).
 */
export function publicNotice(protocol) {
  if (!protocol) return null;
  return {
    access: protocol.access,
    tkLabels: (protocol.tkLabels || []).map((code) => registry.tk_labels?.[code]?.name || code),
    noVoice: Boolean(protocol.noVoice),
    culturalNotice: protocol.culturalNotice || null,
    community: protocol.community
      ? {
          name: protocol.community.name || null,
          authority: protocol.community.authority || null,
          steward_contact: protocol.community.steward_contact || null,
          benefitFlowsBack: protocol.community.benefitFlowsBack ?? null,
          ownershipClaimByInstitution: protocol.community.ownershipClaimByInstitution ?? null,
        }
      : null,
    governance: registry.governance_basis || [],
  };
}

// ── Steward-facing registry management ─────────────────────────────
export function listRegistry() {
  return {
    version: registry.version,
    governance_basis: registry.governance_basis || [],
    access_levels: registry.access_levels || {},
    tk_labels: registry.tk_labels || {},
    protocols: allProtocols(),
  };
}

/**
 * Register or replace a community protocol. Only reachable behind the steward
 * key (see routes/protocols.js) — staff roles cannot call this. The saved entry
 * is marked community-authoritative so resolveProtocol() treats it as binding.
 */
export function upsertProtocol(protocol, stewardId = 'steward') {
  if (!protocol || !protocol.id || !protocol.match || typeof protocol.match !== 'object') {
    throw new Error('A protocol requires an id and a match block.');
  }
  const clean = {
    ...protocol,
    access: ['open', 'restricted', 'closed'].includes(protocol.access) ? protocol.access : 'restricted',
    restrictedTopics: Array.isArray(protocol.restrictedTopics) ? protocol.restrictedTopics : [],
    tkLabels: Array.isArray(protocol.tkLabels) ? protocol.tkLabels : [],
    noVoice: Boolean(protocol.noVoice),
    setBy: stewardId,
    communityAuthoritative: true,
    updatedAt: new Date().toISOString(),
  };
  const idx = overlay.findIndex((p) => p.id === clean.id);
  if (idx === -1) overlay.unshift(clean); else overlay[idx] = clean;
  persistOverlay();
  return clean;
}

// Test/support hook: reload from disk (used by the offline test harness).
export function _reloadForTests() {
  registry = loadRegistry();
  overlay = loadOverlay();
}
