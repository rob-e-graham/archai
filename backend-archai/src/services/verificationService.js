// Verification layer for ARCHAI object records.
//
// Verification is treated as a *layer*, not a gate on participation: anyone can
// offer a memory, but a record only crosses the verification line once the
// curatorial team has confirmed it. Visitors always see where a record sits on
// that spectrum via `verified`.
//
// This service is intentionally free of native/database dependencies so it can
// be exercised directly (see scripts/test-verification-accession.js).
import { repo } from './objectRepository.js';

export const VERIFICATION_TIERS = [
  'institutional_record',
  'verified_oral_history',
  'community_response',
];

// Tiers that count as having crossed the verification line.
const VERIFIED_TIERS = new Set(['institutional_record', 'verified_oral_history']);

// Read a record's verification, filling sensible defaults for legacy records
// that predate the verification field.
export function deriveVerification(record) {
  const v = record?.verification;
  if (v && typeof v === 'object') {
    const tier = VERIFICATION_TIERS.includes(v.tier) ? v.tier : 'institutional_record';
    return {
      tier,
      verified: typeof v.verified === 'boolean' ? v.verified : VERIFIED_TIERS.has(tier),
      verifiedBy: v.verifiedBy || null,
      verifiedAt: v.verifiedAt || null,
      method: v.method || null,
      notes: v.notes || '',
    };
  }
  // Legacy fallback: a published record is treated as a confirmed institutional
  // record; anything still moving through draft/review is not yet verified.
  const published = record?.workflow?.state === 'published';
  return {
    tier: 'institutional_record',
    verified: Boolean(published),
    verifiedBy: null,
    verifiedAt: null,
    method: published ? 'legacy_published' : null,
    notes: '',
  };
}

export function setVerification({ objectId, tier, verified, method = null, notes = '', actorEmail = 'system' }) {
  const record = repo.getObject(objectId);
  if (!record) return { error: 'Object not found', status: 404 };
  if (tier && !VERIFICATION_TIERS.includes(tier)) {
    return { error: `Unknown verification tier: ${tier}`, status: 400 };
  }

  const current = deriveVerification(record);
  const nextTier = tier || current.tier;
  const isVerified = typeof verified === 'boolean' ? verified : VERIFIED_TIERS.has(nextTier);

  const verification = {
    tier: nextTier,
    verified: isVerified,
    verifiedBy: isVerified ? actorEmail : null,
    verifiedAt: isVerified ? new Date().toISOString() : null,
    method: method || (isVerified ? 'curatorial_review' : null),
    notes: notes || current.notes || '',
  };

  const updated = repo.updateObject(objectId, { verification });
  repo.audit({
    type: 'verification.set',
    actor: actorEmail,
    summary: `${objectId} → ${nextTier} (${isVerified ? 'verified' : 'unverified'})`,
  });
  return { object: updated, verification };
}

export function verificationSummary() {
  const objects = repo.state.objects;
  const byTier = {};
  let verified = 0;
  let unverified = 0;
  for (const o of objects) {
    const v = deriveVerification(o);
    byTier[v.tier] = (byTier[v.tier] || 0) + 1;
    if (v.verified) verified += 1;
    else unverified += 1;
  }
  return { total: objects.length, verified, unverified, byTier };
}
