import { env } from '../config/env.js';
import {
  resolveProtocol,
  evaluateAccess,
  applyVoiceConstraint,
} from './culturalProtocol.js';

export function evaluateHallucinationRisk(objectRecord, prompt) {
  const restrictedFlags = new Set([...(objectRecord.restrictions || []), ...env.restrictedFlags]);
  const reasons = [];

  // Cultural authority is checked through the shared community protocol layer so
  // the staff path and the public AUXIO path honour exactly the same source
  // community decision. Legacy per-object restriction flags are still respected.
  const protocol = resolveProtocol({ ...objectRecord, restrictions: [...restrictedFlags] });
  const access = evaluateAccess({ protocol, prompt });
  if (!access.allowed) {
    reasons.push(access.layer === 'topic.restricted'
      ? `Community protocol: restricted topic (${access.restrictedTopicMatched})`
      : 'Community protocol: object closed to AI interpretation');
  }
  if ([...restrictedFlags].some((f) => ['secret-sacred', 'community-restricted'].includes(f))) {
    reasons.push('Restricted cultural content flag present');
  }
  if (!objectRecord.verifiedFacts?.length) {
    reasons.push('No verified facts available');
  }
  if ((prompt || '').length > 500) {
    reasons.push('Prompt length exceeds visitor prompt guideline');
  }

  const allowed = reasons.length === 0;
  return {
    allowed,
    protocol: protocol
      ? {
          access: protocol.access,
          tkLabels: protocol.tkLabels,
          noVoice: protocol.noVoice,
          communityAuthoritative: protocol.communityAuthoritative,
          declineMessage: access.allowed ? undefined : access.declineMessage,
        }
      : null,
    layers: {
      layer0_communityAuthority: access.allowed,
      layer1_metadataBoundary: Boolean(objectRecord),
      layer2_verifiedFactsRequired: Boolean(objectRecord.verifiedFacts?.length),
      layer3_unknownsExplicit: Boolean(objectRecord.unknownFields?.length),
      layer4_prohibitedClaimsFilter: Boolean(objectRecord.prohibitedStatements?.length),
      layer5_provenanceLogging: true,
    },
    reasons,
  };
}

export function buildBoundedSystemPrompt(objectRecord) {
  const protocol = resolveProtocol(objectRecord);
  const content = [
    `You are speaking as the collection object: ${objectRecord.title}.`,
    'Answer only from the provided verified metadata context.',
    `Verified facts: ${(objectRecord.verifiedFacts || []).join(' | ') || 'None supplied'}`,
    `Unknown fields (must acknowledge when relevant): ${(objectRecord.unknownFields || []).join(' | ') || 'None supplied'}`,
    `Curator-approved statements (may quote): ${(objectRecord.curatorApproved || []).join(' | ') || 'None supplied'}`,
    `Prohibited statements (never claim): ${(objectRecord.prohibitedStatements || []).join(' | ') || 'None supplied'}`,
    'If asked beyond scope, say what you do not know and suggest speaking with staff/curator.',
  ].join('\n');
  return {
    role: 'system',
    // A community "do not ventriloquise" decision applies to staff previews too.
    content: applyVoiceConstraint(content, protocol),
  };
}
