#!/usr/bin/env node
// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
//
// Offline test for the community cultural protocol layer. No Ollama, Qdrant, or
// running server required — it exercises the enforcement service directly, so it
// can run anywhere. Proves the answer to: "Does your system have a mechanism for
// a source community to say don't let it answer that — a restriction the AI
// actually honors, not just a staff review after the fact?"

import assert from 'node:assert';
import {
  resolveProtocol,
  evaluateAccess,
  screenResponse,
  applyVoiceConstraint,
  publicNotice,
  upsertProtocol,
  _reloadForTests,
} from '../src/services/culturalProtocol.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`OK   ${name}`);
    passed += 1;
  } catch (e) {
    console.log(`FAIL ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

// Keep the test hermetic: don't read a steward's persisted overlay from disk.
process.env.CULTURAL_PROTOCOL_FILE = '/nonexistent/cultural-protocols.test.json';
_reloadForTests();

// ── Seeded taonga protocol (restricted access + restricted topics) ──────
const taonga = { collection: 'archai_tepapa', culturalContext: 'Taonga Māori' };

test('seeded taonga protocol resolves for its collection + cultural context', () => {
  const p = resolveProtocol(taonga);
  assert.ok(p, 'expected a protocol to resolve');
  assert.strictEqual(p.access, 'restricted');
  assert.ok(p.noVoice, 'taonga protocol should forbid ventriloquising');
});

test('an ordinary materials question on a restricted object is allowed', () => {
  const p = resolveProtocol(taonga);
  const d = evaluateAccess({ protocol: p, prompt: 'What materials are you made from?' });
  assert.strictEqual(d.allowed, true);
});

test('a restricted-topic question is blocked BEFORE the model runs', () => {
  const p = resolveProtocol(taonga);
  const d = evaluateAccess({ protocol: p, prompt: 'Who is buried with this and where is the burial site?' });
  assert.strictEqual(d.allowed, false);
  assert.strictEqual(d.layer, 'topic.restricted');
  assert.ok(d.declineMessage.length > 0, 'community decline message should be present');
  assert.notStrictEqual(d.declineMessage, undefined);
});

test('restricted knowledge leaking into model output is caught after the fact', () => {
  const p = resolveProtocol(taonga);
  const leaked = 'This object marks a burial and the human remains of...';
  const s = screenResponse({ protocol: p, responseText: leaked });
  assert.strictEqual(s.allowed, false);
  assert.strictEqual(s.layer, 'output.restricted');
  assert.notStrictEqual(s.responseText, leaked, 'leaked text must be replaced with the decline');
});

test('noVoice rewrites the system prompt to forbid first-person ventriloquism', () => {
  const p = resolveProtocol(taonga);
  const base = 'You are the object. Speak in first person.';
  const constrained = applyVoiceConstraint(base, p);
  assert.ok(constrained.includes('VOICE CONSTRAINT'));
  assert.ok(/third person/i.test(constrained));
  assert.ok(constrained.length > base.length);
});

// ── Seeded closed (secret/sacred) protocol ──────────────────────────────
test('a secret/sacred flag closes the object entirely', () => {
  const p = resolveProtocol({ restrictions: ['secret-sacred'] });
  assert.ok(p, 'expected the secret/sacred protocol to resolve');
  assert.strictEqual(p.access, 'closed');
  const d = evaluateAccess({ protocol: p, prompt: 'Tell me anything about this.' });
  assert.strictEqual(d.allowed, false);
  assert.strictEqual(d.layer, 'access.closed');
});

// ── Ungoverned objects are unaffected ───────────────────────────────────
test('an object with no community protocol is unaffected (open by default)', () => {
  const p = resolveProtocol({ collection: 'archai_met', canonicalId: 'archai_met:12345' });
  assert.strictEqual(p, null);
  const d = evaluateAccess({ protocol: p, prompt: 'anything at all' });
  assert.strictEqual(d.allowed, true);
});

// ── Community steward registration is authoritative and binding ──────────
test('a steward can register a new binding protocol that then enforces', () => {
  upsertProtocol({
    id: 'test_runtime_closed',
    match: { collection: 'archai_pilot', registration: 'TEST-CLOSED-1' },
    access: 'closed',
    noVoice: true,
    tkLabels: ['TK_S'],
    declineMessage: 'The source community has closed this record.',
    community: { name: 'Test community', authority: 'Test law-holders', benefitFlowsBack: true },
  }, 'steward:test');

  const p = resolveProtocol({ collection: 'archai_pilot', registration: 'TEST-CLOSED-1' });
  assert.ok(p, 'registered protocol should resolve');
  assert.strictEqual(p.access, 'closed');
  assert.ok(p.communityAuthoritative, 'steward-set protocol must be community-authoritative');
  const d = evaluateAccess({ protocol: p, prompt: 'hello' });
  assert.strictEqual(d.allowed, false);
});

test('overlapping protocols resolve to the STRICTER access, never weaker', () => {
  // Register an item-specific closed rule that overlaps the restricted taonga
  // collection rule; the object must end up closed, not restricted.
  upsertProtocol({
    id: 'test_taonga_item_closed',
    match: { collection: 'archai_tepapa', registration: 'TAONGA-ITEM-9' },
    access: 'closed',
    declineMessage: 'Closed by the item-level protocol.',
  }, 'steward:test');
  const p = resolveProtocol({ collection: 'archai_tepapa', culturalContext: 'Taonga Māori', registration: 'TAONGA-ITEM-9' });
  assert.strictEqual(p.access, 'closed');
});

test('public notice exposes governance without leaking restricted topics', () => {
  const p = resolveProtocol(taonga);
  const n = publicNotice(p);
  assert.ok(n.tkLabels.length > 0);
  assert.ok(!('restrictedTopics' in n), 'the restricted-topic list must not be exposed publicly');
  assert.ok(Array.isArray(n.governance) && n.governance.length > 0);
});

console.log(`\n${passed} cultural protocol checks passed.`);
if (process.exitCode) console.error('\nSome cultural protocol checks FAILED.');
