import { env } from '../config/env.js';
import { repo } from '../services/objectRepository.js';

export class CollectiveAccessAdapter {
  constructor() {
    this.configured = Boolean(env.collectiveAccess.baseUrl && (env.collectiveAccess.apiKey || env.collectiveAccess.username));
  }

  async health() {
    return {
      configured: this.configured,
      mode: this.configured ? 'remote' : 'mock',
      baseUrl: env.collectiveAccess.baseUrl || null,
    };
  }

  authMode() {
    if (env.collectiveAccess.apiKey) return 'api-key';
    if (env.collectiveAccess.username && env.collectiveAccess.password) return 'basic';
    return 'mock';
  }

  async requestJson(pathname, { method = 'GET', query, body } = {}) {
    if (!this.configured) throw new Error('CollectiveAccess not configured');
    const base = env.collectiveAccess.baseUrl.replace(/\/$/, '');
    const url = new URL(base + pathname);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v != null && v !== '') url.searchParams.set(k, String(v));
      });
    }

    const headers = { Accept: 'application/json' };
    if (env.collectiveAccess.apiKey) {
      headers['x-api-key'] = env.collectiveAccess.apiKey;
    }
    if (body) headers['Content-Type'] = 'application/json';
    if (env.collectiveAccess.profile) {
      headers['x-ca-profile'] = env.collectiveAccess.profile;
    }

    const init = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };
    if (!env.collectiveAccess.apiKey && env.collectiveAccess.username && env.collectiveAccess.password) {
      init.headers.Authorization = `Basic ${Buffer.from(`${env.collectiveAccess.username}:${env.collectiveAccess.password}`).toString('base64')}`;
    }

    const res = await fetch(url, init);
    const text = await res.text();
    let data = text;
    try { data = JSON.parse(text); } catch {}
    if (!res.ok) {
      throw new Error(`CollectiveAccess ${method} ${pathname} failed (${res.status})`);
    }
    return data;
  }

  async fetchChangedObjects({ since }) {
    if (!this.configured) {
      return repo.state.objects.map((o) => ({
        source: 'collectiveaccess',
        sourceId: o.source.collectiveAccessId,
        objectId: o.id,
        updatedAt: o.updatedAt,
        metadata: {
          idno: o.id,
          title: o.title,
          type: o.type,
          date: String(o.year),
          location: o.location,
          description: o.description,
          tags: o.tags,
          materials: o.materials,
        },
      })).filter((r) => !since || r.updatedAt >= since);
    }
    // TODO: Replace endpoint/pathnames with the institution's exact CA API contract.
    // Starter assumption: object search endpoint can filter by modification timestamp.
    const data = await this.requestJson('/service.php/find/ca_objects', {
      query: {
        modified_after: since,
        profile: env.collectiveAccess.profile,
        format: 'json',
      },
    });

    const rows = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    return rows.map((row) => ({
      source: 'collectiveaccess',
      sourceId: String(row.object_id || row.id || row.ca_object_id || ''),
      objectId: String(row.idno || row.objectId || row.object_identifier || ''),
      updatedAt: row.lastModified || row.updated || row.modified || new Date().toISOString(),
      metadata: row,
    }));
  }
}

export const collectiveAccessAdapter = new CollectiveAccessAdapter();
