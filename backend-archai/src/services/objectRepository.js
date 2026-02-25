import { mockObjects, mockNfcTags, mockUsers } from '../data/mockObjects.js';
import { thesaurusTerms } from '../data/mockThesaurus.js';
import { famtecInstitutions, famtecPosts, famtecThreads, famtecMessages, famtecEnquiries, famtecUploads } from '../data/mockFamtec.js';

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
  updateObject(id, patch) {
    const idx = runtime.objects.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    runtime.objects[idx] = { ...runtime.objects[idx], ...patch, updatedAt: new Date().toISOString() };
    return runtime.objects[idx];
  },
  listNfcTags() {
    return runtime.nfcTags;
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
  audit(entry) { runtime.auditLog.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), ...entry }); },
  getAuditLog() { return runtime.auditLog; },
  saveSyncBatch(batch) { runtime.vectorSyncBatches.unshift(batch); },
  listSyncBatches() { return runtime.vectorSyncBatches; },
};
