import { repo } from './objectRepository.js';
import { workflowTransitionsByRole } from '../policies/roleCapabilities.js';

function getWorkflowMap(role) {
  return workflowTransitionsByRole[role] || {};
}

export function listWorkflows() {
  return repo.state.objects.map((o) => ({
    objectId: o.id,
    title: o.title,
    workflow: o.workflow || { state: 'draft', updatedBy: 'system', updatedAt: o.updatedAt },
  }));
}

export function transitionWorkflow({ objectId, toState, actorRole, actorEmail, notes = '' }) {
  const objectRecord = repo.getObject(objectId);
  if (!objectRecord) return { error: 'Object not found', status: 404 };

  const currentState = objectRecord.workflow?.state || 'draft';
  const allowed = getWorkflowMap(actorRole)[currentState] || [];
  if (!allowed.includes(toState)) {
    return { error: `Transition ${currentState} -> ${toState} not allowed for role ${actorRole}`, status: 403 };
  }

  const workflow = {
    state: toState,
    notes,
    updatedBy: actorEmail,
    updatedAt: new Date().toISOString(),
  };

  const updated = repo.updateObject(objectId, { workflow });
  repo.audit({ type: 'workflow.transition', actor: actorEmail, summary: `${objectId} ${currentState} -> ${toState}` });
  return { object: updated, workflow };
}
