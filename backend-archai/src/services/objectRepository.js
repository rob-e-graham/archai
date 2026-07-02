import fs from 'node:fs';
import path from 'node:path';
import { mockObjects, mockNfcTags, mockUsers } from '../data/mockObjects.js';
import { thesaurusTerms } from '../data/mockThesaurus.js';
import { famtecInstitutions, famtecPosts, famtecThreads, famtecMessages, famtecEnquiries, famtecUploads } from '../data/mockFamtec.js';

// Durable workbench state: staff AUX.IO assignments, institution draft objects
// and the audit trail survive backend restarts (same pattern as media manifests).
const WORKBENCH_FILE = process.env.AUX_WORKBENCH_FILE || './data/runtime/aux-workbench.json';

function loadWorkbench() {
  try {
    const raw = JSON.parse(fs.readFileSync(WORKBENCH_FILE, 'utf8'));
    return {
      objects: Array.isArray(raw.objects) ? raw.objects : [],
      nfcTags: Array.isArray(raw.nfcTags) ? raw.nfcTags : [],
      auditLog: Array.isArray(raw.auditLog) ? raw.auditLog : [],
    };
  } catch {
    return { objects: [], nfcTags: [], auditLog: [] };
  }
}

let persistTimer = null;
function persistWorkbench() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      fs.mkdirSync(path.dirname(WORKBENCH_FILE), { recursive: true });
      fs.writeFileSync(WORKBENCH_FILE, JSON.stringify({
        savedAt: new Date().toISOString(),
        objects: runtime.objects.filter((o) => o.persisted),
        nfcTags: runtime.nfcTags.filter((t) => t.persisted),
        auditLog: runtime.auditLog.slice(0, 200),
      }, null, 2));
    } catch (e) {
      console.error('aux-workbench persist failed:', e.message);
    }
  }, 250);
}

const runtime = {
  objects: structuredClone(mockObjects),
  nfcTags: structuredClone(mockNfcTags),
  users: structuredClone(mockUsers),
  thesaurusTerms: structuredClone(thesaurusTerms),
  famtecInstitutions: structuredClone(famtecInstitutions),
  famtecPosts: structuredClone(famtecPosts),
  famtecThreads: structuredClone(famtecThreads),
  famtecMessages: structuredClone(famtecMessages),
  famtecEnquiries: structuredClone(famtecEnquiries),
  famtecUploads: structuredClone(famtecUploads),
  uploads: [],
  auditLog: [],
  vectorSyncBatches: [],
};

// Merge persisted staff work over the mock baseline at boot.
{
  const saved = loadWorkbench();
  for (const o of saved.objects) {
    const i = runtime.objects.findIndex((x) => x.id === o.id);
    if (i === -1) runtime.objects.unshift(o); else runtime.objects[i] = o;
  }
  for (const t of saved.nfcTags) {
    const i = runtime.nfcTags.findIndex((x) => x.tagId === t.tagId);
    if (i === -1) runtime.nfcTags.unshift(t); else runtime.nfcTags[i] = t;
  }
  if (saved.auditLog.length) runtime.auditLog = saved.auditLog;
}

export const repo = {
  state: runtime,
  listObjects(query = '') {
    const q = query.trim().toLowerCase();
    const rows = runtime.objects.filter((o) => !q || [o.id, o.title, o.type, o.location, o.description, o.aiInterpretation, ...(o.tags || [])].join(' ').toLowerCase().includes(q));
    return rows;
  },
  getObject(id) {
    return runtime.objects.find((o) => o.id === id);
  },
  saveObject(record) {
    const idx = runtime.objects.findIndex((o) => o.id === record.id);
    const next = { ...record, persisted: true, updatedAt: new Date().toISOString() };
    if (idx === -1) {
      runtime.objects.unshift(next);
      persistWorkbench();
      return next;
    }
    runtime.objects[idx] = { ...runtime.objects[idx], ...next };
    persistWorkbench();
    return runtime.objects[idx];
  },
  updateObject(id, patch) {
    const idx = runtime.objects.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    runtime.objects[idx] = { ...runtime.objects[idx], ...patch, persisted: true, updatedAt: new Date().toISOString() };
    persistWorkbench();
    return runtime.objects[idx];
  },
  listNfcTags() {
    return runtime.nfcTags;
  },
  upsertNfcTag(record) {
    const idx = runtime.nfcTags.findIndex((t) => t.tagId === record.tagId);
    const next = { ...record, persisted: true, updatedAt: new Date().toISOString() };
    if (idx === -1) {
      runtime.nfcTags.unshift(next);
      persistWorkbench();
      return next;
    }
    runtime.nfcTags[idx] = { ...runtime.nfcTags[idx], ...next };
    persistWorkbench();
    return runtime.nfcTags[idx];
  },
  saveUpload(record) {
    runtime.uploads.unshift(record);
    return record;
  },
  listUploads() {
    return runtime.uploads;
  },
  searchThesaurus({ q = '', type, category }) {
    const lower = q.toLowerCase();
    return runtime.thesaurusTerms.filter((t) => (!type || t.type.toLowerCase() === type.toLowerCase()) && (!category || t.category.toLowerCase() === category.toLowerCase()) && (!q || [t.path, t.type, t.category].join(' ').toLowerCase().includes(lower)));
  },
  listUsers() { return runtime.users; },
  listFamtecInstitutions() { return runtime.famtecInstitutions; },
  getFamtecInstitution(id) { return runtime.famtecInstitutions.find((i) => i.id === id); },
  saveFamtecInstitution(row) { runtime.famtecInstitutions.unshift(row); return row; },
  updateFamtecInstitution(id, patch) {
    const idx = runtime.famtecInstitutions.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    runtime.famtecInstitutions[idx] = { ...runtime.famtecInstitutions[idx], ...patch, updatedAt: new Date().toISOString() };
    return runtime.famtecInstitutions[idx];
  },
  listFamtecPosts(filters = {}) {
    return runtime.famtecPosts.filter((p) =>
      (!filters.status || p.status === filters.status) &&
      (!filters.postType || p.postType === filters.postType) &&
      (!filters.institutionId || p.institutionId === filters.institutionId));
  },
  getFamtecPost(id) { return runtime.famtecPosts.find((p) => p.id === id); },
  saveFamtecPost(row) { runtime.famtecPosts.unshift(row); return row; },
  updateFamtecPost(id, patch) {
    const idx = runtime.famtecPosts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    runtime.famtecPosts[idx] = { ...runtime.famtecPosts[idx], ...patch, updatedAt: new Date().toISOString() };
    return runtime.famtecPosts[idx];
  },
  listFamtecThreads() { return runtime.famtecThreads; },
  getFamtecThread(id) { return runtime.famtecThreads.find((t) => t.id === id); },
  saveFamtecThread(row) { runtime.famtecThreads.unshift(row); return row; },
  listFamtecMessages(threadId) { return runtime.famtecMessages.filter((m) => m.threadId === threadId); },
  saveFamtecMessage(row) { runtime.famtecMessages.push(row); return row; },
  listFamtecEnquiries(filters = {}) { return runtime.famtecEnquiries.filter((e) => !filters.postId || e.postId === filters.postId); },
  saveFamtecEnquiry(row) { runtime.famtecEnquiries.unshift(row); return row; },
  updateFamtecEnquiry(id, patch) {
    const idx = runtime.famtecEnquiries.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    runtime.famtecEnquiries[idx] = { ...runtime.famtecEnquiries[idx], ...patch };
    return runtime.famtecEnquiries[idx];
  },
  listFamtecUploads() { return runtime.famtecUploads; },
  saveFamtecUpload(row) { runtime.famtecUploads.unshift(row); return row; },
  audit(entry) { runtime.auditLog.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), ...entry }); persistWorkbench(); },
  getAuditLog() { return runtime.auditLog; },
  saveSyncBatch(batch) { runtime.vectorSyncBatches.unshift(batch); },
  listSyncBatches() { return runtime.vectorSyncBatches; },
};
