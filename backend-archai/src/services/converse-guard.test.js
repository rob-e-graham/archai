import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectRelevant, checkReply, trimToSentence, crisisReply, wantsLongAnswer, isAggregateQuestion,
  notRecordedLine, RELEVANCE_FLOOR, MAX_CONTEXT_OBJECTS,
} from './converse-guard.js';
import { buildWebQueries } from './web-expand.js';
import { followUpQuery, requestedCount } from './conversational-search.js';

const r = (score, title = 't') => ({ score, payload: { title } });

// ── Layer 1: relevance cut-off ──────────────────────────────────────
test('no match when nothing reaches the floor', () => {
  const out = selectRelevant([r(0.48), r(0.44), r(0.43)], 'do you have any clocks?');
  assert.equal(out.mode, 'none');
  assert.equal(out.strong.length, 0);
  assert.equal(out.weak.length, 3);
});

test('keeps records within the band and withholds the rest', () => {
  const out = selectRelevant([r(0.72), r(0.70), r(0.60), r(0.52)], 'radios');
  assert.equal(out.mode, 'records');
  assert.deepEqual(out.strong.map((x) => x.score), [0.72, 0.70, 0.60]);   // cut = max(0.5, 0.72 - 0.15) = 0.57
  assert.equal(out.weak.length, 1);                                         // 0.52 falls below the cut
});

test('band includes records within 0.15 of the top', () => {
  const out = selectRelevant([r(0.72), r(0.60), r(0.56)], 'radios');
  assert.deepEqual(out.strong.map((x) => x.score), [0.72, 0.60]);
  assert.equal(out.weak.length, 1);
});

test('aggregate questions are never treated as no-match', () => {
  const out = selectRelevant([r(0.40)], 'How many objects are in the whole collection?');
  assert.equal(out.mode, 'aggregate');
});

test('never passes more than the context limit to the model', () => {
  const many = Array.from({ length: 20 }, () => r(0.7));
  assert.equal(selectRelevant(many, 'radios').strong.length, MAX_CONTEXT_OBJECTS);
  assert.ok(RELEVANCE_FLOOR >= 0.5);
});

test('empty result set is a no-match', () => {
  assert.equal(selectRelevant([], 'anything').mode, 'none');
});

// ── Layer 3: stated gaps ────────────────────────────────────────────
test('missing fields are listed as not recorded', () => {
  assert.equal(notRecordedLine({ date: '1932', maker: '', materials: '', description: 'x' }), 'Not recorded: maker, materials\n');
  assert.equal(notRecordedLine({ date: 'a', maker: 'b' }), '');
});

// ── Layer 4: reply check ────────────────────────────────────────────
const CTX = 'Title: Radio\nRegistration: CIRC.43-1977\nDescription: Made by Ultra Radios. 1932. Made in England.\nTitle: RCA model 40X-56 Registration: W.27-1992 1938-1939';

test('a supported reply passes untouched', () => {
  const out = checkReply('1. **Radio** (CIRC.43-1977) was made by Ultra Radios in 1932.', CTX);
  assert.equal(out.clean, true);
  assert.match(out.text, /Ultra Radios/);
});

test('an invented registration number removes the sentence and adds a note', () => {
  const out = checkReply('The first radio is CIRC.43-1977, made in 1932. A second, registered ZZ-999, was made in 1950.', CTX);
  assert.ok(!out.text.includes('ZZ-999'));
  assert.match(out.text, /could not be matched/);
  assert.ok(out.removed.some((x) => x.kind === 'identifier'));
});

test('an interpretive clause is trimmed and the facts are kept', () => {
  const out = checkReply('1. **Radio** (CIRC.43-1977) - Made by Ultra Radios in 1932, this radio represents British design of the era.', CTX);
  assert.match(out.text, /Ultra Radios in 1932\./);
  assert.ok(!/represents/.test(out.text));
});

test('an interpretive sentence is kept when the record itself uses the word', () => {
  const out = checkReply('The description says it represents a household radio.', CTX + ' It represents a household radio.');
  assert.match(out.text, /represents/);
});

test('saying the record is silent is allowed', () => {
  const out = checkReply('The record does not say what it symbolises.', CTX);
  assert.match(out.text, /symbolises/);
});

test('a year that is not in the records is flagged, not deleted', () => {
  const out = checkReply('It was made in 1920.', CTX);
  assert.deepEqual(out.unsupportedYears, ['1920']);
  assert.match(out.text, /1920/);
  assert.match(out.text, /Check against the record/);
});

test('a web marker that does not exist is removed', () => {
  const out = checkReply('Muybridge was English [W1]. He was also Martian [W9].', CTX + ' Muybridge', { webCount: 2 });
  assert.ok(!out.text.includes('[W9]'));
  assert.match(out.text, /\[W1\]/);
});

test('list markers are not left dangling when a line is removed', () => {
  const out = checkReply('1. Radio CIRC.43-1977, 1932.\n2. A piece registered ZZ-999.', CTX);
  assert.ok(!/^2\.\s*$/m.test(out.text));
});

test('years supplied by the user count as supported', () => {
  const out = checkReply('You asked about 1920.', CTX + ' 1920');
  assert.equal(out.unsupportedYears.length, 0);
});

// ── truncation ──────────────────────────────────────────────────────
test('trimToSentence cuts at the last complete sentence', () => {
  assert.equal(trimToSentence('First sentence. Second sentence. Third is cut off mid'), 'First sentence. Second sentence.');
  assert.equal(trimToSentence('Complete sentence.'), 'Complete sentence.');
  assert.match(trimToSentence('no full stop at all here'), /…$/);
});

// ── safety route ────────────────────────────────────────────────────
test('crisis wording is routed to support, ordinary talk is not', () => {
  assert.match(crisisReply('I want to kill myself'), /13 11 14/);
  assert.equal(crisisReply('I killed it at the talk today'), null);
  assert.equal(crisisReply('Tell me about the radios'), null);
});

// ── intent helpers ──────────────────────────────────────────────────
test('length and aggregate intent', () => {
  assert.equal(wantsLongAnswer('List all the radios in detail'), true);
  assert.equal(wantsLongAnswer('Who made the panther?'), false);
  assert.equal(isAggregateQuestion('Which museums contribute the most objects?'), true);
  assert.equal(isAggregateQuestion('Tell me about the panther'), false);
});

// ── follow-ups ──────────────────────────────────────────────────────
test('"5 more bird artworks" searches the topic and asks for five', () => {
  const out = followUpQuery('Show me 5 more bird artworks', [{ role: 'user', content: 'Show me some bird artworks' }]);
  assert.equal(out.followUp, true);
  assert.match(out.query, /bird/);
  assert.ok(!/more|5/.test(out.query));
  assert.equal(requestedCount('Show me 5 more bird artworks'), 5);
});

test('a bare "more" falls back to the earlier question', () => {
  const out = followUpQuery('show me more', [{ role: 'user', content: 'Tell me about radios' }, { role: 'assistant', content: 'x' }]);
  assert.equal(out.followUp, true);
  assert.equal(out.query, 'Tell me about radios');
});

test('a normal question is not a follow-up', () => {
  assert.equal(followUpQuery('Tell me about the Reclining Tunisian Panther', []).followUp, false);
});

test('requested counts', () => {
  assert.equal(requestedCount('give me three more'), 3);
  assert.equal(requestedCount('tell me about radios'), 0);
});

// ── public web queries ──────────────────────────────────────────────
test('web queries come from the question, and only related records add more', () => {
  const objs = [
    { title: 'Eadweard Muybridge portrait', maker: 'Unknown' },
    { title: 'SEEMLY YOU', maker: 'Frederick Hammersley' },
  ];
  const q = buildWebQueries('Tell me about Eadweard Muybridge', objs);
  assert.ok(q.includes('Eadweard Muybridge'));
  assert.ok(!q.includes('Frederick Hammersley'));
  assert.ok(q.length <= 4);
});
