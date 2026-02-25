import { Router } from 'express';
import { z } from 'zod';
import { repo } from '../services/objectRepository.js';
import { requireRole } from '../middleware/requireRole.js';

export const famtecRouter = Router();

const postSchema = z.object({
  institutionId: z.string().min(1),
  postType: z.enum(['hardware_available', 'skills_available', 'hardware_request', 'skills_request', 'question']),
  listingType: z.enum(['loan', 'rental', 'booking', 'need_skills', 'available_crew', 'question']).optional().default('question'),
  category: z.string().optional().default('general'),
  title: z.string().min(3).max(180),
  body: z.string().min(3).max(4000),
  location: z.string().optional().default(''),
  availabilityText: z.string().optional().default(''),
  availabilityStart: z.string().optional(),
  availabilityEnd: z.string().optional(),
  quantity: z.number().int().min(1).optional().default(1),
  tags: z.array(z.string()).optional().default([]),
  pricing: z.object({ mode: z.string().optional(), amount: z.number().nullable().optional(), currency: z.string().optional(), bond: z.number().nullable().optional() }).optional().default({ mode: 'negotiable', amount: null, currency: 'AUD', bond: null }),
  attachments: z.array(z.object({ uploadId: z.string(), filename: z.string().optional() })).optional().default([]),
});

const institutionSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  city: z.string().min(1),
  region: z.string().optional().default(''),
  country: z.string().optional().default('AU'),
  contactEmail: z.string().email(),
  website: z.string().optional().default(''),
  focus: z.string().optional().default(''),
  capabilities: z.array(z.string()).optional().default([]),
});

const enquirySchema = z.object({
  postId: z.string().min(1),
  fromInstitutionId: z.string().min(1),
  message: z.string().min(3).max(2000),
});

const threadSchema = z.object({
  topic: z.string().min(3).max(200),
  institutionId: z.string().min(1),
});

const messageSchema = z.object({
  threadId: z.string().min(1),
  sender: z.string().min(1),
  senderInstitutionId: z.string().min(1),
  text: z.string().min(1).max(2000),
});

const publishSchema = z.object({ status: z.enum(['published', 'archived', 'draft']).default('published') });
const verifySchema = z.object({ verificationStatus: z.enum(['verified', 'pending', 'rejected']) });

function postToLegacyFeed(post, inst){
  const kind = post.listingType.replace(/_/g, ' ');
  return {
    id: post.id,
    kind,
    title: post.title,
    org: inst?.name || post.institutionId,
    timing: post.availabilityText || 'No date specified',
    body: post.body,
    tags: post.tags || [],
    status: post.status,
    moderationStatus: post.moderationStatus,
    postType: post.postType,
    institutionId: post.institutionId,
  };
}

function getModerationQueue() {
  return repo.listFamtecPosts().filter((p) => p.moderationStatus !== 'approved' || p.status !== 'published');
}

famtecRouter.get('/institutions', (_req, res) => {
  res.json({ ok: true, institutions: repo.listFamtecInstitutions() });
});

famtecRouter.post('/institutions', requireRole('curator'), (req, res) => {
  const input = institutionSchema.parse(req.body || {});
  const row = {
    id: `inst_${input.slug.replace(/[^a-z0-9_]+/gi, '').toLowerCase()}`,
    ...input,
    verificationStatus: 'pending',
    logistics: { pickup: false, shipping: false, insuranceNote: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  repo.saveFamtecInstitution(row);
  repo.audit({ type: 'famtec.institution.create', actor: req.archai.user.email, summary: `FAMTEC institution ${row.name}` });
  res.status(201).json({ ok: true, institution: row });
});

famtecRouter.post('/institutions/:id/verify', requireRole('admin'), (req, res) => {
  const input = verifySchema.parse(req.body || {});
  const row = repo.updateFamtecInstitution(req.params.id, { verificationStatus: input.verificationStatus });
  if (!row) return res.status(404).json({ ok: false, error: 'Institution not found' });
  repo.audit({ type: 'famtec.institution.verify', actor: req.archai.user.email, summary: `${row.name} -> ${input.verificationStatus}` });
  res.json({ ok: true, institution: row });
});

famtecRouter.get('/posts', (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  const institutionId = req.query.institutionId ? String(req.query.institutionId) : undefined;
  const postType = req.query.postType ? String(req.query.postType) : undefined;
  const q = String(req.query.q || '').toLowerCase().trim();
  const posts = repo.listFamtecPosts({ status, institutionId, postType }).filter((p) => {
    if (!q) return true;
    const inst = repo.getFamtecInstitution(p.institutionId);
    const text = [p.title, p.body, p.location, p.availabilityText, ...(p.tags || []), inst?.name || ''].join(' ').toLowerCase();
    return text.includes(q);
  });
  const feed = posts.map((p) => postToLegacyFeed(p, repo.getFamtecInstitution(p.institutionId)));
  res.json({ ok: true, posts, feed });
});

famtecRouter.post('/posts', requireRole('collections'), (req, res) => {
  const input = postSchema.parse(req.body || {});
  const inst = repo.getFamtecInstitution(input.institutionId);
  if (!inst) return res.status(404).json({ ok: false, error: 'Institution not found' });

  const moderationStatus = inst.verificationStatus === 'verified' ? 'approved' : 'pending_review';
  const row = {
    id: `post_${crypto.randomUUID().slice(0, 8)}`,
    createdByUserId: req.archai.user.id,
    ...input,
    moderationStatus,
    status: moderationStatus === 'approved' ? 'published' : 'draft',
    visibility: 'network',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  repo.saveFamtecPost(row);
  repo.audit({ type: 'famtec.post.create', actor: req.archai.user.email, summary: `${row.title} (${row.listingType})` });
  res.status(201).json({ ok: true, post: row, feedItem: postToLegacyFeed(row, inst) });
});

famtecRouter.patch('/posts/:id', requireRole('collections'), (req, res) => {
  const patch = { ...req.body };
  delete patch.id;
  const row = repo.updateFamtecPost(req.params.id, patch);
  if (!row) return res.status(404).json({ ok: false, error: 'Post not found' });
  repo.audit({ type: 'famtec.post.update', actor: req.archai.user.email, summary: row.title });
  res.json({ ok: true, post: row });
});

famtecRouter.post('/posts/:id/publish', requireRole('curator'), (req, res) => {
  const input = publishSchema.parse(req.body || {});
  const row = repo.updateFamtecPost(req.params.id, { status: input.status, moderationStatus: 'approved' });
  if (!row) return res.status(404).json({ ok: false, error: 'Post not found' });
  repo.audit({ type: 'famtec.post.publish', actor: req.archai.user.email, summary: `${row.title} -> ${input.status}` });
  res.json({ ok: true, post: row });
});

famtecRouter.get('/moderation/queue', requireRole('curator'), (_req, res) => {
  res.json({ ok: true, queue: getModerationQueue() });
});

famtecRouter.post('/posts/:id/enquiry', requireRole('volunteer'), (req, res) => {
  const input = enquirySchema.parse({ ...req.body, postId: req.params.id });
  const post = repo.getFamtecPost(input.postId);
  if (!post) return res.status(404).json({ ok: false, error: 'Post not found' });
  const row = { id: `enq_${crypto.randomUUID().slice(0, 8)}`, ...input, status: 'pending', createdAt: new Date().toISOString() };
  repo.saveFamtecEnquiry(row);
  repo.audit({ type: 'famtec.enquiry.create', actor: req.archai.user.email, summary: `Enquiry on ${post.title}` });
  res.status(201).json({ ok: true, enquiry: row });
});

famtecRouter.get('/enquiries', requireRole('collections'), (req, res) => {
  const postId = req.query.postId ? String(req.query.postId) : undefined;
  res.json({ ok: true, enquiries: repo.listFamtecEnquiries({ postId }) });
});

famtecRouter.get('/threads', (_req, res) => {
  res.json({ ok: true, threads: repo.listFamtecThreads() });
});

famtecRouter.post('/threads', requireRole('collections'), (req, res) => {
  const input = threadSchema.parse(req.body || {});
  const inst = repo.getFamtecInstitution(input.institutionId);
  if (!inst) return res.status(404).json({ ok: false, error: 'Institution not found' });
  const row = {
    id: `thr_${crypto.randomUUID().slice(0, 8)}`,
    topic: input.topic,
    institutionId: input.institutionId,
    createdBy: inst.name,
    lastMessageAt: new Date().toISOString(),
    messagesCount: 0,
  };
  repo.saveFamtecThread(row);
  repo.audit({ type: 'famtec.thread.create', actor: req.archai.user.email, summary: row.topic });
  res.status(201).json({ ok: true, thread: row });
});

famtecRouter.get('/threads/:id/messages', (_req, res) => {
  const thread = repo.getFamtecThread(req.params.id);
  if (!thread) return res.status(404).json({ ok: false, error: 'Thread not found' });
  res.json({ ok: true, thread, messages: repo.listFamtecMessages(req.params.id) });
});

famtecRouter.post('/threads/:id/messages', requireRole('volunteer'), (req, res) => {
  const input = messageSchema.parse({ ...req.body, threadId: req.params.id });
  const thread = repo.getFamtecThread(req.params.id);
  if (!thread) return res.status(404).json({ ok: false, error: 'Thread not found' });
  const msg = { id: `msg_${crypto.randomUUID().slice(0, 8)}`, ...input, createdAt: new Date().toISOString() };
  repo.saveFamtecMessage(msg);
  repo.updateFamtecInstitution(input.senderInstitutionId, {});
  const updatedThread = { ...thread, lastMessageAt: msg.createdAt, messagesCount: (thread.messagesCount || 0) + 1 };
  // simple replace using generic patch path
  const idx = repo.state.famtecThreads.findIndex((t) => t.id === thread.id);
  repo.state.famtecThreads[idx] = updatedThread;
  repo.audit({ type: 'famtec.thread.message', actor: req.archai.user.email, summary: `Thread ${thread.id}` });
  res.status(201).json({ ok: true, message: msg, thread: updatedThread });
});

famtecRouter.post('/uploads/presign', requireRole('collections'), (req, res) => {
  const body = req.body || {};
  const uploadId = `up_${crypto.randomUUID().slice(0, 8)}`;
  const row = {
    id: uploadId,
    institutionId: String(body.institutionId || 'inst_famtec'),
    kind: String(body.kind || 'attachment'),
    filename: String(body.filename || 'upload.bin'),
    mimeType: String(body.mimeType || 'application/octet-stream'),
    status: 'presigned',
    createdAt: new Date().toISOString(),
  };
  repo.saveFamtecUpload(row);
  res.status(201).json({
    ok: true,
    upload: row,
    uploadMode: 'local-placeholder',
    instructions: 'Implement object storage/local upload target in FAMTEC production service.',
    localFormFields: { uploadId, path: `/tmp/famtec/${uploadId}/${row.filename}` },
  });
});

famtecRouter.get('/uploads', requireRole('collections'), (_req, res) => {
  res.json({ ok: true, uploads: repo.listFamtecUploads() });
});

famtecRouter.post('/import/csv', requireRole('collections'), (req, res) => {
  const csvText = String(req.body?.csv || '');
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return res.status(400).json({ ok: false, error: 'No CSV rows supplied' });
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim(); });
    return obj;
  });
  res.json({
    ok: true,
    importMode: 'preview',
    rowsParsed: rows.length,
    headers,
    sample: rows.slice(0, 5),
    next: 'Map CSV columns to FAMTEC post schema and confirm import',
  });
});

// Legacy compatibility endpoints used by prototype UI
famtecRouter.get('/listings', (_req, res) => {
  const feed = repo.listFamtecPosts({ status: 'published' }).map((p) => postToLegacyFeed(p, repo.getFamtecInstitution(p.institutionId)));
  const listings = feed.filter((f) => ['loan', 'rental', 'booking', 'available crew'].includes(String(f.kind).toLowerCase()));
  res.json({ ok: true, listings });
});

famtecRouter.get('/requests', (_req, res) => {
  const posts = repo.listFamtecPosts({ status: 'published' }).filter((p) => ['hardware_request', 'skills_request', 'question'].includes(p.postType));
  const requests = posts.map((p) => ({ id: p.id, institution: repo.getFamtecInstitution(p.institutionId)?.name || p.institutionId, kind: p.listingType, title: p.title, timeframe: p.availabilityText, status: 'open' }));
  res.json({ ok: true, requests });
});
