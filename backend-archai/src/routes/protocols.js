// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
// Proprietary during the doctoral research period — see LICENSE.
//
// Community cultural protocol API — how a source community sets and inspects the
// terms on which the AI may speak about an object connected to them. The write
// path is gated by a community steward key that sits OUTSIDE the staff role
// system: museum staff (including admin) cannot register or weaken a protocol.

import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import {
  listRegistry,
  resolveProtocol,
  publicNotice,
  upsertProtocol,
} from '../services/culturalProtocol.js';
import { repo } from '../services/objectRepository.js';

export const protocolsRouter = Router();

// Identify the community steward from their key. Returns the steward id, or null.
function stewardFrom(req) {
  const key = req.header('x-archai-steward-key') || '';
  return key && env.culturalStewardKeys[key] ? env.culturalStewardKeys[key] : null;
}

// ── Registry: labels catalog, access levels, and registered protocols ──
// Public and read-only — transparency is itself a CARE principle.
protocolsRouter.get('/', (_req, res) => {
  res.json({ ok: true, ...listRegistry() });
});

// ── Resolve the effective protocol / public notice for one object ──────
const resolveSchema = z.object({
  collection: z.string().max(64).optional(),
  canonicalId: z.string().max(200).optional(),
  id: z.string().max(200).optional(),
  institution: z.string().max(200).optional(),
  registration: z.string().max(200).optional(),
  culturalContext: z.string().max(200).optional(),
  restrictions: z.array(z.string().max(64)).max(20).optional(),
});

protocolsRouter.post('/resolve', (req, res) => {
  try {
    const ref = resolveSchema.parse(req.body || {});
    const protocol = resolveProtocol(ref);
    res.json({
      ok: true,
      governed: Boolean(protocol),
      access: protocol?.access || 'open',
      notice: publicNotice(protocol),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ ok: false, error: 'Invalid object reference', details: e.errors });
    }
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── Steward: register or update a community protocol ───────────────────
const protocolSchema = z.object({
  id: z.string().min(1).max(120),
  match: z.object({
    canonical_id: z.string().max(200).optional(),
    collection: z.string().max(64).optional(),
    institution: z.string().max(200).optional(),
    registration: z.string().max(200).optional(),
    cultural_context: z.string().max(200).optional(),
    restriction_flag: z.string().max(64).optional(),
  }).refine((m) => Object.keys(m).length > 0, { message: 'match must carry at least one condition' }),
  access: z.enum(['open', 'restricted', 'closed']).default('restricted'),
  tkLabels: z.array(z.string().max(16)).max(12).optional().default([]),
  noVoice: z.boolean().optional().default(false),
  restrictedTopics: z.array(z.string().max(120)).max(60).optional().default([]),
  declineMessage: z.string().max(600).optional(),
  culturalNotice: z.string().max(400).optional(),
  community: z.object({
    name: z.string().max(200).optional(),
    authority: z.string().max(200).optional(),
    steward_contact: z.string().max(200).optional(),
    benefitFlowsBack: z.boolean().optional(),
    ownershipClaimByInstitution: z.boolean().optional(),
  }).optional(),
});

protocolsRouter.post('/', (req, res) => {
  const stewardId = stewardFrom(req);
  if (!stewardId) {
    return res.status(403).json({
      ok: false,
      error: 'A community steward key is required to set a cultural protocol. '
        + 'This authority sits with the source community, not with museum staff.',
    });
  }
  try {
    const input = protocolSchema.parse(req.body || {});
    const saved = upsertProtocol(input, stewardId);
    repo.audit({
      type: 'cultural.protocol.set',
      actor: `steward:${stewardId}`,
      summary: `Set protocol ${saved.id} (${saved.access}${saved.noVoice ? ', noVoice' : ''})`,
    });
    res.json({ ok: true, protocol: saved });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ ok: false, error: 'Invalid protocol', details: e.errors });
    }
    res.status(400).json({ ok: false, error: e.message });
  }
});
