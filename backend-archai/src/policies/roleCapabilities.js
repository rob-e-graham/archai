export const roleCapabilities = {
  admin: ['*'],
  curator: ['objects.read', 'objects.write', 'workflow.transition', 'nfc.publish', 'media.publish', 'vocab.read', 'search', 'export'],
  collections: ['objects.read', 'objects.write-limited', 'upload.queue', 'workflow.submit-review', 'vocab.read', 'search'],
  technician: ['nodel.read', 'runtime.read', 'media.validate', 'objects.read-tech'],
  volunteer: ['objects.read', 'notes.create', 'visitor.preview'],
  visitor: ['nfc.public', 'chat.object', 'comments.create'],
};

export const workflowTransitionsByRole = {
  collections: { draft: ['review'] },
  curator: { review: ['approved'], approved: ['published'], published: ['review'] },
  admin: { draft: ['review', 'archived'], review: ['approved', 'draft'], approved: ['published', 'review'], published: ['review', 'archived'], archived: ['draft'] },
};
