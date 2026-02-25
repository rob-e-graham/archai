import { env } from '../config/env.js';
import { repo } from '../services/objectRepository.js';
import crypto from 'node:crypto';

export class ResourceSpaceAdapter {
  constructor() {
    this.configured = Boolean(env.resourceSpace.baseUrl && env.resourceSpace.apiUser && env.resourceSpace.privateKey);
  }

  async health() {
    return {
      configured: this.configured,
      mode: this.configured ? 'remote' : 'mock',
      baseUrl: env.resourceSpace.baseUrl || null,
    };
  }

  buildApiUrl(functionName, params = {}) {
    const base = env.resourceSpace.baseUrl.replace(/\/$/, '');
    const query = new URLSearchParams({ function: functionName, user: env.resourceSpace.apiUser, ...params });
    const signSource = query.toString();
    const sign = crypto.createHash('sha256').update(env.resourceSpace.privateKey + signSource).digest('hex');
    query.set('sign', sign);
    return `${base}/api/?${query.toString()}`;
  }

  async requestJson(functionName, params = {}) {
    if (!this.configured) throw new Error('ResourceSpace not configured');
    const url = this.buildApiUrl(functionName, params);
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    let data = text;
    try { data = JSON.parse(text); } catch {}
    if (!res.ok) throw new Error(`ResourceSpace API ${functionName} failed (${res.status})`);
    return data;
  }

  async fetchChangedAssets({ since }) {
    if (!this.configured) {
      const assets = repo.state.objects.flatMap((o, i) =>
        (o.media || []).map((m, j) => ({
          source: 'resourcespace',
          sourceId: `${o.source.resourceSpaceId}_${j + 1}`,
          resourceSpaceId: o.source.resourceSpaceId,
          objectId: o.id,
          updatedAt: o.updatedAt,
          mediaType: m.kind,
          thumbnailUrl: null,
          filename: `${o.id.toLowerCase()}_${j + 1}.${m.kind === 'video' ? 'mp4' : 'jpg'}`,
          checksums: { sha256: `mock-sha-${i + 1}-${j + 1}` },
          rights: { license: 'internal mock', usage: 'prototype only' },
        })),
      );
      return assets.filter((r) => !since || r.updatedAt >= since);
    }
    // TODO: Confirm exact RS metadata field IDs / custom fields for CA object linkage.
    // Starter flow: search updated resources, then request metadata for each.
    const changed = await this.requestJson('do_search', {
      search: '!hasdata',
      restypes: '',
      order_by: 'date',
      sort: 'DESC',
    });
    const rows = Array.isArray(changed) ? changed : [];
    return rows
      .map((r) => ({
        source: 'resourcespace',
        sourceId: String(r.ref || r.resource || ''),
        resourceSpaceId: String(r.ref || ''),
        objectId: String(r.field8 || r.ca_object_id || r.ca_linked_object || ''), // Replace with real linkage field mapping
        updatedAt: r.modified || r.creation_date || new Date().toISOString(),
        mediaType: r.file_extension && /mp4|mov|m4v|webm/i.test(r.file_extension) ? 'video' : 'image',
        thumbnailUrl: r.preview_extension ? `${env.resourceSpace.baseUrl}/pages/preview.php?ref=${r.ref}` : null,
        filename: r.file_path || r.file_name || `rs_${r.ref}`,
        checksums: {},
        rights: { license: r.access || 'internal', usage: 'institution controlled' },
      }))
      .filter((r) => (!since || r.updatedAt >= since) && r.objectId);
  }

  buildBatchUploadUrl() {
    if (!env.resourceSpace.baseUrl) return null;
    return `${env.resourceSpace.baseUrl.replace(/\/$/, '')}/pages/upload_batch.php`;
  }
}

export const resourceSpaceAdapter = new ResourceSpaceAdapter();
