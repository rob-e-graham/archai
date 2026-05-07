import { Router } from 'express';
import { z } from 'zod';
import db from '../data/db.js';
import { moderateComment } from '../services/moderation.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const commentsRouter = Router();

const commentLimiter = rateLimit({ maxPerMinute: 10 });

const postSchema = z.object({
  objectId: z.string().min(1),
  collection: z.string().default('archai_pilot'),
  text: z.string().min(1).max(500),
  authorType: z.enum(['visitor', 'volunteer', 'staff']).default('visitor'),
  authorName: z.string().max(100).default(''),
  parentId: z.string().optional(),
});

const insert = db.prepare(`
  INSERT INTO comments (id, parent_id, object_id, collection, text, author_type, author_name, status, ai_flag, ai_reason, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const getPublicByObject = db.prepare(`
  SELECT * FROM comments WHERE object_id = ? AND status = 'visible' ORDER BY created_at ASC LIMIT 100
`);

const getAllByObject = db.prepare(`
  SELECT * FROM comments WHERE object_id = ? ORDER BY created_at ASC LIMIT 200
`);

const getAll = db.prepare(`
  SELECT * FROM comments ORDER BY created_at DESC LIMIT ?
`);

const getByStatus = db.prepare(`
  SELECT * FROM comments WHERE status = ? ORDER BY created_at DESC LIMIT ?
`);

const getFlagged = db.prepare(`
  SELECT * FROM comments WHERE status = 'hidden' AND ai_flag IN ('suspicious', 'harmful') ORDER BY created_at DESC LIMIT ?
`);

const updateStatus = db.prepare(`
  UPDATE comments SET status = ?, moderated_at = datetime('now'), moderated_by = ? WHERE id = ?
`);

const getStats = db.prepare(`
  SELECT status, ai_flag, COUNT(*) as count FROM comments GROUP BY status, ai_flag
`);

const getObjectsWithComments = db.prepare(`
  SELECT object_id, collection, COUNT(*) as total,
    SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) as flagged
  FROM comments GROUP BY object_id, collection ORDER BY total DESC
`);

function nestThreads(flat) {
  const map = new Map();
  const roots = [];
  for (const c of flat) {
    c.replies = [];
    map.set(c.id, c);
  }
  for (const c of flat) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id).replies.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

// ── Public: get visible comments for an object (threaded) ────────
commentsRouter.get('/', (req, res) => {
  const objectId = String(req.query.objectId || '');
  const includeHidden = req.query.curator === 'true';

  if (objectId) {
    const rows = includeHidden ? getAllByObject.all(objectId) : getPublicByObject.all(objectId);
    return res.json({ ok: true, comments: nestThreads(rows) });
  }

  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const status = req.query.status;
  const rows = status ? getByStatus.all(status, limit) : getAll.all(limit);
  res.json({ ok: true, comments: rows });
});

// ── Public: post a comment or reply (AI moderated) ───────────────
commentsRouter.post('/', commentLimiter, async (req, res) => {
  try {
    const input = postSchema.parse(req.body || {});
    const id = crypto.randomUUID();

    const moderation = await moderateComment(input.text);

    // safe → visible immediately; suspicious/harmful → hidden for curator review
    const status = moderation.flag === 'safe' ? 'visible' : 'hidden';

    insert.run(id, input.parentId || null, input.objectId, input.collection, input.text, input.authorType, input.authorName, status, moderation.flag, moderation.reason);

    if (status === 'hidden') {
      return res.status(201).json({
        ok: true,
        comment: { id, status: 'pending_review', message: 'Your comment is being reviewed by a curator.' },
      });
    }

    res.status(201).json({
      ok: true,
      comment: { id, objectId: input.objectId, text: input.text, authorType: input.authorType, authorName: input.authorName, status, parentId: input.parentId || null, createdAt: new Date().toISOString() },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ ok: false, error: 'Invalid comment', details: e.errors });
    }
    res.status(500).json({ ok: false, error: 'Could not save comment' });
  }
});

// ── Curator: flagged queue (hidden comments needing human review) ─
commentsRouter.get('/flagged', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const rows = getFlagged.all(limit);
  res.json({ ok: true, comments: rows });
});

// ── Curator: approve (make visible) or remove a comment ──────────
commentsRouter.patch('/:id', (req, res) => {
  const { status } = req.body || {};
  if (!['visible', 'removed'].includes(status)) {
    return res.status(400).json({ ok: false, error: 'Status must be "visible" or "removed"' });
  }
  const moderator = req.body.moderator || 'curator';
  const result = updateStatus.run(status, moderator, req.params.id);
  if (result.changes === 0) return res.status(404).json({ ok: false, error: 'Comment not found' });
  res.json({ ok: true, updated: req.params.id, status });
});

// ── Curator: which objects have comments ─────────────────────────
commentsRouter.get('/objects', (_req, res) => {
  const rows = getObjectsWithComments.all();
  res.json({ ok: true, objects: rows });
});

// ── Curator: stats ───────────────────────────────────────────────
commentsRouter.get('/stats', (_req, res) => {
  const rows = getStats.all();
  const stats = {};
  for (const r of rows) {
    if (!stats[r.status]) stats[r.status] = {};
    stats[r.status][r.ai_flag || 'unknown'] = r.count;
  }
  res.json({ ok: true, stats });
});
