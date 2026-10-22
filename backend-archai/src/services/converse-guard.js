// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
// Proprietary during the doctoral research period — see LICENSE.
//
// Hallucination controls for Collection Intelligence (Converse), mapped to the
// five ARCHAI layers. The language model never gets the last word: what it may
// see is limited before it runs (layers 1-3), and what it says is checked after
// it runs (layer 4), then written to a provenance log (layer 5).
//
//  1. Metadata boundary      relevance cut-off — only records that really match reach the model
//  2. Verified-facts gate    the model sees catalogue fields only, copied from the record
//  3. Unknowns stated as gaps each record lists the fields it does NOT record
//  4. Prohibited claims      the reply is checked: invented identifiers removed, unsupported dates flagged
//  5. Provenance record      every turn is appended to data/runtime/converse-provenance.jsonl
import fs from 'node:fs';
import path from 'node:path';

// Scores from nomic-embed-text sit around 0.58-0.72 for a real match and 0.42-0.50 when the
// collection holds nothing on the topic (checked on live queries: "clock" tops out at 0.48).
export const RELEVANCE_FLOOR = 0.5;
export const RELEVANCE_BAND = 0.15;
export const MAX_CONTEXT_OBJECTS = 8;

const AGGREGATE_RE = /\b(how many|how much|which (?:museums?|institutions?|countries|themes?)|what (?:kinds?|types?|themes?|museums?|institutions?|countries)|breakdown|overview|statistics|in total|count of|the whole collection|entire collection|across the collection)\b/i;
const EXPAND_RE = /\b(all of (?:them|these)|every one|full list|complete list|list (?:them )?all|in detail|detailed|elaborate|expand|tell me more|more detail|more about|explain fully|continue|go on|keep going)\b/i;
const CRISIS_RE = /\b(kill myself|killing myself|end my life|want to die|suicid\w*|self[- ]harm|hurt myself|no reason to live)\b/i;

export function isAggregateQuestion(message) { return AGGREGATE_RE.test(String(message || '')); }
export function wantsLongAnswer(message) { return EXPAND_RE.test(String(message || '')); }

export function crisisReply(message) {
  if (!CRISIS_RE.test(String(message || ''))) return null;
  return 'It sounds like things may be very hard right now, and that matters more than any collection question. '
    + 'If you are in Australia, Lifeline is available any time on 13 11 14, and in an emergency please call 000. '
    + 'If you are elsewhere, please contact your local emergency number or a crisis line. '
    + 'I am a collection search tool, not a counsellor, so I will not carry on with the museum search here, but I am glad to pick it up whenever you want.';
}

/**
 * Layer 1. Split retrieved records into those the model may use and those that are weak matches.
 * `mode` is 'none' when nothing in the collection really matches the question.
 */
export function selectRelevant(results, message) {
  const scored = results.map((r) => ({ r, score: r.score || 0 }));
  const top = scored.reduce((m, x) => Math.max(m, x.score), 0);
  const aggregate = isAggregateQuestion(message);
  if (!scored.length || (top < RELEVANCE_FLOOR && !aggregate)) {
    return { strong: [], weak: results, mode: aggregate ? 'aggregate' : 'none', top };
  }
  const cut = Math.max(RELEVANCE_FLOOR, top - RELEVANCE_BAND);
  const strong = [];
  const weak = [];
  for (const x of scored) {
    (x.score >= cut && strong.length < MAX_CONTEXT_OBJECTS ? strong : weak).push(x.r);
  }
  return { strong, weak, mode: aggregate && !strong.length ? 'aggregate' : 'records', top };
}

/** Layer 3. Name the catalogue fields a record leaves empty, so silence is stated rather than filled. */
export function notRecordedLine(fields) {
  const missing = Object.entries(fields).filter(([, v]) => !v).map(([k]) => k);
  return missing.length ? `Not recorded: ${missing.join(', ')}\n` : '';
}

const ID_RE = /\b(?:[A-Z]{1,6}[ \-]?\d[\w.\-/]{1,}|\d{1,4}\.\d+(?:\.\d+)*[A-Za-z]?)\b/g;
const YEAR_RE = /\b(1[0-9]{3}|20[0-4][0-9])\b/g;

// Interpretation the catalogue text has to state before the reply may say it (ARCHAI rule 10).
const INTERP_RE = /\b(symbol\w*|evok\w*|represent(?:s|ing|ed)?|signif\w*|embod\w*|reminiscent|convey\w*|intended to|meant to|suggest\w*|express(?:es|ing|ed)?|reflect(?:s|ing|ed)?|aesthetic\w*|blend\w*|intersect\w*|showcas\w*|interesting example|combin(?:es|ed) functionality)\b/i;
const HEDGE_RE = /\b(not|no|nor|never|cannot|without|unclear|unknown|does not|do not|doesn't|don't)\b/i;

const norm = (s) => String(s).toLowerCase().replace(/[\s\-_.\/]+/g, '');

/**
 * Layer 4. Check the reply against everything the model was actually given.
 * - identifiers (registration numbers, model numbers) that appear nowhere in the context: the sentence is removed
 * - four-digit years that appear nowhere in the context or the question: flagged under the answer
 * - [W#] markers that point at web results which do not exist: the sentence is removed
 */
export function checkReply(reply, contextText, { webCount = 0, evidenceText = '' } = {}) {
  const ctx = norm(contextText);
  const ctxRaw = String(contextText);
  const evidenceLower = String(evidenceText || contextText).toLowerCase();
  const removed = [];
  const keptLines = [];
  const unsupportedYears = new Set();

  for (const s of String(reply).split(/(\n)/)) {
    if (s === '\n') { keptLines.push(s); continue; }
    const marker = (s.match(/^\s*(?:\d+[.)]|[-*•])\s+/) || [''])[0];
    const parts = s.slice(marker.length).split(/(?<=[.!?])\s+/);
    const keep = [];
    for (const part of parts) {
      let bad = null;
      for (const m of part.matchAll(ID_RE)) {
        const token = m[0];
        if (/^(?:mm|cm|kg|gb|mb)\b/i.test(token)) continue;
        if (!ctx.includes(norm(token))) { bad = token; break; }
      }
      if (!bad) {
        for (const m of part.matchAll(/\[W(\d+)\]/g)) {
          if (Number(m[1]) < 1 || Number(m[1]) > webCount) { bad = m[0]; break; }
        }
      }
      let trimmedPart = null;
      if (!bad) {
        const m = part.match(INTERP_RE);
        // An interpretive claim is kept only if the record text uses that word, or the sentence says the record is silent.
        if (m && !HEDGE_RE.test(part) && !evidenceLower.includes(m[1].toLowerCase().slice(0, 6))) {
          // Keep the factual head of the sentence (title, registration, date, maker) and cut the interpretation.
          const head = part.slice(0, m.index);
          const cutAt = Math.max(head.lastIndexOf(', '), head.lastIndexOf(' — '), head.lastIndexOf('; '), head.lastIndexOf(' - '));
          const kept = cutAt > 15 ? head.slice(0, cutAt).trimEnd() : '';
          removed.push({ kind: 'interpretation', token: m[1], sentence: part.slice(0, 160) });
          if (!kept) continue;
          trimmedPart = /[.!?]$/.test(kept) ? kept : kept + '.';
        }
      }
      if (bad) { removed.push({ kind: 'identifier', token: bad, sentence: part.slice(0, 160) }); continue; }
      const finalPart = trimmedPart ?? part;
      for (const m of finalPart.matchAll(YEAR_RE)) {
        if (!ctxRaw.includes(m[1])) unsupportedYears.add(m[1]);
      }
      keep.push(finalPart);
    }
    keptLines.push(keep.length ? marker + keep.join(' ') : '');
  }

  let text = keptLines.join('').replace(/\n{3,}/g, '\n\n').trim();
  const notes = [];
  if (removed.some((r) => r.kind === 'identifier')) notes.push('A detail that could not be matched to the supplied records was removed from this answer.');
  if (unsupportedYears.size) notes.push(`Check against the record: ${[...unsupportedYears].join(', ')} does not appear in the supplied catalogue text.`);
  if (notes.length) text += '\n\n' + notes.map((n) => `⚠ ${n}`).join('\n');

  return {
    text: text || String(reply),
    removed,
    unsupportedYears: [...unsupportedYears],
    clean: !removed.length && !unsupportedYears.size,
  };
}

/** If the model hit the token limit, cut at the last complete sentence or list item instead of mid-word. */
export function trimToSentence(text) {
  const t = String(text).trimEnd();
  if (/[.!?)"”]$/.test(t)) return t;
  const cut = Math.max(t.lastIndexOf('. '), t.lastIndexOf('.\n'), t.lastIndexOf('!'), t.lastIndexOf('?'), t.lastIndexOf('\n\n'));
  return cut > t.length * 0.4 ? t.slice(0, cut + 1).trimEnd() : t + '…';
}

// Layer 5. Append-only provenance log: what was asked, what was retrieved, what the checks did.
const LOG_FILE = path.resolve(process.cwd(), 'data', 'runtime', 'converse-provenance.jsonl');
export function logProvenance(entry) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch { /* logging must never break an answer */ }
}
