import { repo } from './objectRepository.js';

const runtimeMedia = [];

function ensureSeeded() {
  if (runtimeMedia.length) return;
  for (const obj of repo.state.objects) {
    const media = obj.media?.[0];
    if (!media) continue;
    runtimeMedia.push({
      mediaId: `pub_${obj.id.toLowerCase()}`,
      objectId: obj.id,
      kind: media.kind === 'video' ? 'video' : 'image',
      resourceSpaceId: obj.source?.resourceSpaceId || null,
      playbackUrl: media.kind === 'video' ? `/api/media/published/pub_${obj.id.toLowerCase()}/stream` : null,
      posterUrl: `/api/media/published/pub_${obj.id.toLowerCase()}/poster`,
      thumbUrl: `/api/media/published/pub_${obj.id.toLowerCase()}/thumb`,
      mimeType: media.kind === 'video' ? 'video/mp4' : 'image/jpeg',
      durationSeconds: media.kind === 'video' ? 180 : null,
      captionsUrl: null,
      rightsLabel: 'Prototype / local approved derivative',
      publishedStatus: obj.workflow?.state === 'published' ? 'published' : 'approved',
      autoplayMuted: true,
      loop: media.kind === 'video',
      updatedAt: new Date().toISOString(),
    });
  }
}

export function listPublishedMedia({ objectId, status } = {}) {
  ensureSeeded();
  return runtimeMedia.filter((m) => (!objectId || m.objectId === objectId) && (!status || m.publishedStatus === status));
}

export function getPublishedMedia(mediaId) {
  ensureSeeded();
  return runtimeMedia.find((m) => m.mediaId === mediaId);
}

export function publishMediaManifest({ objectId, mediaId, actor }) {
  ensureSeeded();
  const row = runtimeMedia.find((m) => m.mediaId === mediaId && m.objectId === objectId);
  if (!row) return null;
  row.publishedStatus = 'published';
  row.updatedAt = new Date().toISOString();
  repo.audit({ type: 'media.publish', actor, summary: `Published media ${mediaId} for ${objectId}` });
  return row;
}
