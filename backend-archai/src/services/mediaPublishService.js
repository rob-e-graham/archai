import { repo } from './objectRepository.js';
import { publishedMediaSchema } from '../schemas/objectSchemas.js';

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
      manifestationLabel: media.kind === 'video' ? 'Approved playback derivative' : 'Documentation image',
      resourceSpaceId: obj.source?.resourceSpaceId || null,
      playbackUrl: media.kind === 'video' ? `/api/media/published/pub_${obj.id.toLowerCase()}/stream` : null,
      posterUrl: `/api/media/published/pub_${obj.id.toLowerCase()}/poster`,
      thumbUrl: `/api/media/published/pub_${obj.id.toLowerCase()}/thumb`,
      mimeType: media.kind === 'video' ? 'video/mp4' : 'image/jpeg',
      durationSeconds: media.kind === 'video' ? 180 : null,
      captionsUrl: null,
      rightsLabel: 'Prototype / local approved derivative',
      rights: {
        status: 'cleared',
        basis: 'institution_approved',
        licence: null,
        rightsHolder: 'FAMTEC prototype',
        creditLine: 'FAMTEC prototype / local approved derivative',
        sourceUrl: null,
        reviewedBy: 'system-seed',
        reviewedAt: new Date().toISOString(),
        notes: 'Mock record for local interface testing only.',
      },
      capture: null,
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

export function registerMediaManifest(input) {
  ensureSeeded();
  const row = publishedMediaSchema.parse(input);
  if (runtimeMedia.some((media) => media.mediaId === row.mediaId)) return null;
  runtimeMedia.unshift({ ...row, updatedAt: new Date().toISOString() });
  return runtimeMedia[0];
}

export function canPublishMedia(media) {
  if (!media) return { ok: false, reason: 'Published media record not found' };
  if (media.rights?.status !== 'cleared') {
    return { ok: false, reason: 'Media rights must be cleared before publication' };
  }
  if (media.kind === 'web_archive' && !media.capture) {
    return { ok: false, reason: 'Web archives require capture provenance before publication' };
  }
  return { ok: true };
}

export function publishMediaManifest({ objectId, mediaId, actor }) {
  ensureSeeded();
  const row = runtimeMedia.find((m) => m.mediaId === mediaId && m.objectId === objectId);
  if (!row) return null;
  const gate = canPublishMedia(row);
  if (!gate.ok) return { blocked: true, reason: gate.reason, media: row };
  row.publishedStatus = 'published';
  row.updatedAt = new Date().toISOString();
  repo.audit({ type: 'media.publish', actor, summary: `Published media ${mediaId} for ${objectId}` });
  return row;
}
