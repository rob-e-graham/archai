#!/usr/bin/env node
// Standalone checks for the verification layer and accession CMS path.
// Runs without the database/native deps — it exercises the repo-backed services
// directly. Point AUX_WORKBENCH_FILE at a throwaway path so the real workbench
// is never touched.
//
//   AUX_WORKBENCH_FILE=$(mktemp) node scripts/test-verification-accession.js

import { repo } from '../src/services/objectRepository.js';
import { deriveVerification, setVerification, verificationSummary } from '../src/services/verificationService.js';
import { accessionReadiness, listAccessionQueue, commitAccession } from '../src/services/accessionService.js';

let failed = 0;
function check(label, cond) {
  if (cond) {
    console.log(`OK   ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL ${label}`);
  }
}

// ── Verification summary reflects the seeded tiers ───────────────────
const summary = verificationSummary();
check('summary counts every object', summary.total === repo.state.objects.length);
check('summary reports both verified and unverified records', summary.verified > 0 && summary.unverified > 0);
check('Echo Circuit (in review) reads as unverified',
  deriveVerification(repo.getObject('FAMTEC_1997_0234')).verified === false);
check('Synthetic Garden reads as a verified institutional record',
  deriveVerification(repo.getObject('FAMTEC_2022_0087')).verified === true);

// ── Accession gate: unverified records cannot enter the CMS ──────────
const echoReadiness = accessionReadiness(repo.getObject('FAMTEC_1997_0234'));
check('unverified record is blocked from accession',
  !echoReadiness.ready && echoReadiness.blockers.includes('not_verified'));
const echoCommit = commitAccession({ objectId: 'FAMTEC_1997_0234', actorEmail: 'curator@famtec.au' });
check('commitAccession refuses an unverified record (409 + blocker)',
  echoCommit.error && echoCommit.status === 409 && echoCommit.blockers.includes('not_verified'));

// ── Accession queue holds verified + approved, not-yet-accessioned ───
const queue = listAccessionQueue();
check('born-digital ARCHAI demonstrator is queued for accession',
  queue.some((r) => r.objectId === 'FAMTEC_2026_ARCHAI_WEB'));
check('already-accessioned record is not queued',
  !queue.some((r) => r.objectId === 'FAMTEC_2022_0087'));

// ── Committing a queued record assigns an accession number + CMS id ──
const before = repo.getObject('FAMTEC_2026_ARCHAI_WEB');
check('queued record starts with no CMS id', !before.source?.collectiveAccessId);
const commit = commitAccession({ objectId: 'FAMTEC_2026_ARCHAI_WEB', actorEmail: 'curator@famtec.au' });
check('commitAccession succeeds for a ready record', Boolean(commit.accession) && !commit.error);
check('accession number matches FAMTEC.YYYY.NNNN',
  /^FAMTEC\.\d{4}\.\d{4}$/.test(commit.accession?.accessionNumber || ''));
check('CMS record id is written back onto source.collectiveAccessId',
  repo.getObject('FAMTEC_2026_ARCHAI_WEB').source.collectiveAccessId === commit.accession.cmsRecordId);
check('re-committing an accessioned record is blocked',
  commitAccession({ objectId: 'FAMTEC_2026_ARCHAI_WEB' }).blockers?.includes('already_accessioned'));

// ── Full path: verify → approve → accession a previously blocked record
setVerification({ objectId: 'FAMTEC_1997_0234', tier: 'institutional_record', verified: true, actorEmail: 'curator@famtec.au' });
check('setVerification flips Echo Circuit to verified',
  deriveVerification(repo.getObject('FAMTEC_1997_0234')).verified === true);
check('still blocked while workflow is not approved/published',
  accessionReadiness(repo.getObject('FAMTEC_1997_0234')).blockers.includes('workflow_review'));
repo.updateObject('FAMTEC_1997_0234', { workflow: { state: 'approved', updatedBy: 'curator@famtec.au', updatedAt: new Date().toISOString() } });
// Echo Circuit already carries a legacy CMS id, so it is treated as accessioned;
// clearing it lets us prove the verify → approve → commit path end to end.
repo.updateObject('FAMTEC_1997_0234', {
  source: { ...repo.getObject('FAMTEC_1997_0234').source, collectiveAccessId: null },
  accession: { status: 'not_accessioned', accessionNumber: null, cmsTarget: 'collectiveaccess', cmsRecordId: null, accessionedBy: null, accessionedAt: null, notes: '' },
});
const echoCommit2 = commitAccession({ objectId: 'FAMTEC_1997_0234', actorEmail: 'curator@famtec.au' });
check('verified + approved record now accessions successfully',
  Boolean(echoCommit2.accession) && !echoCommit2.error);

if (failed) {
  console.error(`\n${failed} verification/accession check(s) failed.`);
  process.exit(1);
}
console.log('\nAll verification/accession checks passed.');
