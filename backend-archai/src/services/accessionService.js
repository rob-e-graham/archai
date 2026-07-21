// Accession path for ARCHAI object records.
//
// This is the explicit, enforced path by which a record enters the archival CMS
// (CollectiveAccess). The rule that makes the path legible is a single gate:
// a record is only ever accessioned once it is BOTH verified AND curatorially
// approved. That is what keeps "what the archive has heard" separate from
// "what the archive has confirmed and committed as a permanent record".
//
// Like verificationService, this module avoids native/database dependencies so
// it can be exercised directly in tests.
import { repo } from './objectRepository.js';
import { deriveVerification } from './verificationService.js';

export const ACCESSION_STATES = ['not_accessioned', 'ready', 'accessioned', 'returned'];

// Workflow states from which a record may be committed to the CMS.
const ACCESSIONABLE_WORKFLOW = new Set(['approved', 'published']);

const INSTITUTION_PREFIX = process.env.ARCHAI_ACCESSION_PREFIX || 'FAMTEC';

export function deriveAccession(record) {
  const a = record?.accession && typeof record.accession === 'object' ? record.accession : {};
  const cmsRecordId = a.cmsRecordId || record?.source?.collectiveAccessId || null;
  const status = ACCESSION_STATES.includes(a.status)
    ? a.status
    : (cmsRecordId ? 'accessioned' : 'not_accessioned');
  return {
    status,
    accessionNumber: a.accessionNumber || null,
    cmsTarget: a.cmsTarget || 'collectiveaccess',
    cmsRecordId,
    accessionedBy: a.accessionedBy || null,
    accessionedAt: a.accessionedAt || null,
    notes: a.notes || '',
  };
}

// Whether a record may enter the archival CMS, and if not, why not. The
// blockers array is the human-readable expression of the accession gate.
export function accessionReadiness(record) {
  const verification = deriveVerification(record);
  const accession = deriveAccession(record);
  const workflowState = record?.workflow?.state || 'draft';

  const blockers = [];
  if (!verification.verified) blockers.push('not_verified');
  if (!ACCESSIONABLE_WORKFLOW.has(workflowState)) blockers.push(`workflow_${workflowState}`);
  if (accession.status === 'accessioned') blockers.push('already_accessioned');

  return { ready: blockers.length === 0, blockers, verification, accession, workflowState };
}

function nextAccessionNumber() {
  const year = new Date().getFullYear();
  const prefix = `${INSTITUTION_PREFIX}.${year}.`;
  let max = 0;
  for (const o of repo.state.objects) {
    const n = o.accession?.accessionNumber;
    if (typeof n === 'string' && n.startsWith(prefix)) {
      const seq = parseInt(n.slice(prefix.length), 10);
      if (Number.isFinite(seq) && seq > max) max = seq;
    }
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

// Objects that are verified + approved and waiting to be committed to the CMS.
export function listAccessionQueue() {
  return repo.state.objects
    .map((o) => ({ objectId: o.id, title: o.title, ...accessionReadiness(o) }))
    .filter((r) => r.ready);
}

export function commitAccession({ objectId, actorEmail = 'system', notes = '' }) {
  const record = repo.getObject(objectId);
  if (!record) return { error: 'Object not found', status: 404 };

  const readiness = accessionReadiness(record);
  if (!readiness.ready) {
    return {
      error: `Object is not ready to accession: ${readiness.blockers.join(', ')}`,
      status: 409,
      blockers: readiness.blockers,
    };
  }

  const existing = deriveAccession(record);
  const accessionNumber = existing.accessionNumber || nextAccessionNumber();
  const cmsRecordId = existing.cmsRecordId
    || record.source?.collectiveAccessId
    || `ca_${accessionNumber.replace(/\W+/g, '_').toLowerCase()}`;

  const accession = {
    status: 'accessioned',
    accessionNumber,
    cmsTarget: 'collectiveaccess',
    cmsRecordId,
    accessionedBy: actorEmail,
    accessionedAt: new Date().toISOString(),
    notes,
  };

  // Provenance travels with the record: the CMS id is written back onto the
  // canonical source so downstream sync and chat resolve to the same object.
  const source = { ...(record.source || {}), collectiveAccessId: cmsRecordId };

  const updated = repo.updateObject(objectId, { accession, source });
  repo.audit({
    type: 'accession.commit',
    actor: actorEmail,
    summary: `${objectId} accessioned as ${accessionNumber} → collectiveaccess:${cmsRecordId}`,
  });
  return { object: updated, accession };
}
