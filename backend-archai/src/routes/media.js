import { Router } from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { requireRole } from '../middleware/requireRole.js';
import { ZodError } from 'zod';
import { listPublishedMedia, getPublishedMedia, publishMediaManifest, registerMediaManifest } from '../services/mediaPublishService.js';
import { repo } from '../services/objectRepository.js';
import { env } from '../config/env.js';

export const mediaRouter = Router();

function safeMediaCachePath(media, fallbackExtension = ''){
  const requested = media.storageFilename || `${media.mediaId}${fallbackExtension}`;
  const safe = path.basename(String(requested)).replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.resolve(process.cwd(), env.media.cacheDir, safe);
}

async function statOrNull(p){
  try { return await fsp.stat(p); } catch { return null; }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

mediaRouter.get('/published', (req, res) => {
  const objectId = req.query.objectId ? String(req.query.objectId) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  res.json({ ok: true, media: listPublishedMedia({ objectId, status }) });
});

mediaRouter.post('/published', requireRole('curator'), (req, res) => {
  try {
    const media = registerMediaManifest(req.body);
    if (!media) return res.status(409).json({ ok: false, error: 'mediaId already exists' });
    repo.audit({ type: 'media.register', actor: req.archai.user.email, summary: `Registered media ${media.mediaId} for ${media.objectId}` });
    res.status(201).json({ ok: true, media });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ ok: false, error: 'Invalid media manifest', issues: error.issues });
    }
    throw error;
  }
});

mediaRouter.get('/published/:mediaId/manifest', (req, res) => {
  const media = getPublishedMedia(req.params.mediaId);
  if (!media) return res.status(404).json({ ok: false, error: 'Published media not found' });
  res.json({ ok: true, media });
});

mediaRouter.post('/published/:mediaId/publish', requireRole('curator'), (req, res) => {
  const objectId = String(req.body?.objectId || '');
  const media = publishMediaManifest({ objectId, mediaId: req.params.mediaId, actor: req.archai.user.email });
  if (!media) return res.status(404).json({ ok: false, error: 'Published media record not found' });
  if (media.blocked) return res.status(409).json({ ok: false, error: media.reason, media: media.media });
  const objectRecord = repo.getObject(objectId);
  if (objectRecord) {
    const publishedMedia = listPublishedMedia({ objectId });
    repo.updateObject(objectId, { publishedMedia });
  }
  res.json({ ok: true, media });
});

mediaRouter.get('/published/:mediaId/thumb', (req, res) => {
  const media = getPublishedMedia(req.params.mediaId);
  if (!media) return res.status(404).send('Not found');
  // Placeholder image endpoint while RS/local cache is not wired.
  res.type('svg').send(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#2a3f52"/><stop offset="1" stop-color="#5b79c2"/></linearGradient></defs><rect width="100%" height="100%" fill="#08090a"/><rect x="10" y="10" width="780" height="430" fill="url(#g)" opacity="0.95"/><text x="36" y="54" fill="#eef2ef" font-family="monospace" font-size="18">ARCHAI published media thumbnail</text><text x="36" y="84" fill="#c8d6d1" font-family="monospace" font-size="14">${media.mediaId} · ${media.kind}</text></svg>`);
});

mediaRouter.get('/published/:mediaId/poster', (req, res) => {
  const media = getPublishedMedia(req.params.mediaId);
  if (!media) return res.status(404).send('Not found');
  res.type('svg').send(`<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1280\" height=\"720\"><defs><linearGradient id=\"g\" x1=\"0\" x2=\"1\"><stop stop-color=\"#283146\"/><stop offset=\"1\" stop-color=\"#6278bd\"/></linearGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(#g)\"/><rect x=\"26\" y=\"26\" width=\"1228\" height=\"668\" fill=\"none\" stroke=\"#cfe3de\" opacity=\"0.5\"/><text x=\"56\" y=\"74\" fill=\"#eef2ef\" font-family=\"Georgia\" font-size=\"30\">ARCHAI visitor poster</text><text x=\"56\" y=\"112\" fill=\"#d0dbd7\" font-family=\"monospace\" font-size=\"16\">${media.mediaId} · ${media.kind}</text></svg>`);
});

mediaRouter.get('/published/:mediaId/stream', async (req, res) => {
  const media = getPublishedMedia(req.params.mediaId);
  if (!media) return res.status(404).json({ ok: false, error: 'Published media not found' });
  if (media.kind !== 'video' && media.kind !== 'audio') {
    return res.status(400).json({ ok: false, error: `Streaming endpoint is for video/audio. Use poster/thumb for ${media.kind}.`, media });
  }

  const localPath = safeMediaCachePath(media, media.kind === 'audio' ? '.mp3' : '.mp4');
  const st = await statOrNull(localPath);
  if (!st || !st.isFile()) {
    return res.status(404).json({
      ok: false,
      error: 'Local cached derivative not found',
      media,
      streamMode: env.media.streamMode,
      expectedLocalPath: localPath,
      guidance: [
        'Place an approved MP4 derivative in MEDIA_CACHE_DIR named <mediaId>.mp4',
        'Or implement ResourceSpace proxy/signed redirect in this route',
      ],
    });
  }

  const range = req.headers.range;
  const mime = media.kind === 'audio' ? (media.mimeType || 'audio/mpeg') : (media.mimeType || 'video/mp4');
  if (!range) {
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': st.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=60',
    });
    fs.createReadStream(localPath).pipe(res);
    return;
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  if (!match) {
    return res.status(416).end();
  }
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : st.size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end >= st.size) {
    return res.status(416).set('Content-Range', `bytes */${st.size}`).end();
  }

  res.writeHead(206, {
    'Content-Type': mime,
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${st.size}`,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=60',
  });
  fs.createReadStream(localPath, { start, end }).pipe(res);
});

mediaRouter.get('/published/:mediaId/archive', async (req, res) => {
  const media = getPublishedMedia(req.params.mediaId);
  if (!media) return res.status(404).json({ ok: false, error: 'Published media not found' });
  if (media.kind !== 'web_archive') {
    return res.status(400).json({ ok: false, error: 'Archive delivery is only available for web_archive manifestations' });
  }
  if (media.publishedStatus !== 'published' || media.rights?.status !== 'cleared') {
    return res.status(403).json({ ok: false, error: 'Archived manifestation is not cleared and published for access' });
  }

  const localPath = safeMediaCachePath(media, '.wacz');
  const st = await statOrNull(localPath);
  if (!st || !st.isFile()) {
    return res.status(404).json({ ok: false, error: 'Local WACZ capture not found', expectedLocalPath: localPath });
  }

  const range = req.headers.range;
  res.set({
    'Content-Type': 'application/wacz+zip',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=60',
    'Content-Disposition': `inline; filename="${path.basename(localPath)}"`,
  });
  if (!range) {
    res.set('Content-Length', String(st.size));
    fs.createReadStream(localPath).pipe(res);
    return;
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  if (!match) return res.status(416).end();
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : st.size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end >= st.size) {
    return res.status(416).set('Content-Range', `bytes */${st.size}`).end();
  }
  res.status(206).set({
    'Content-Length': String(end - start + 1),
    'Content-Range': `bytes ${start}-${end}/${st.size}`,
  });
  fs.createReadStream(localPath, { start, end }).pipe(res);
});

mediaRouter.get('/published/:mediaId/replay', (req, res) => {
  const media = getPublishedMedia(req.params.mediaId);
  if (!media) return res.status(404).send('Published media not found');
  if (media.kind !== 'web_archive' || media.publishedStatus !== 'published' || media.rights?.status !== 'cleared') {
    return res.status(403).send('Archived manifestation is not cleared and published for access');
  }
  const archiveUrl = `/api/media/published/${encodeURIComponent(media.mediaId)}/archive`;
  const entryUrl = escapeHtml(media.entryUrl || media.capture?.entryUrl || media.capture?.originalUrl || '');
  res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(media.manifestationLabel || 'ARCHAI archived interactive capture')}</title>
<style>html,body{width:100%;height:100%;margin:0;background:#080908;color:#e7e2d8}replay-web-page{display:block;width:100%;height:100%}</style>
<script src="/replay-assets/ui.js"></script></head><body>
<replay-web-page replayBase="/replay-assets/" source="${archiveUrl}" url="${entryUrl}" embed="replay-with-info" sandbox></replay-web-page>
</body></html>`);
});
