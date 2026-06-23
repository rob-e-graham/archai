import { env } from '../config/env.js';

function withIdentifyQuery(value) {
  const url = new URL(value);
  url.searchParams.set('verb', 'Identify');
  return url;
}

export class EaasiAdapter {
  constructor() {
    this.configured = Boolean(env.eaasi.baseUrl || env.eaasi.oaiUrl);
  }

  async health() {
    const base = {
      configured: this.configured,
      mode: this.configured ? 'institutional-node' : 'not-configured',
      baseUrl: env.eaasi.baseUrl || null,
      oaiUrl: env.eaasi.oaiUrl || null,
      tenantId: env.eaasi.tenantId || null,
      sessionLaunchConfigured: Boolean(env.eaasi.baseUrl && env.eaasi.apiToken),
    };

    if (!env.eaasi.oaiUrl) return { ...base, online: null };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(withIdentifyQuery(env.eaasi.oaiUrl), {
        headers: { Accept: 'application/xml, text/xml' },
        signal: controller.signal,
      });
      const body = await response.text();
      const identifiesAsOai = /<OAI-PMH[\s>]|<Identify[\s>]/i.test(body);
      return {
        ...base,
        online: response.ok && identifiesAsOai,
        status: response.status,
        error: response.ok && identifiesAsOai ? null : 'Endpoint did not return an OAI-PMH Identify response',
      };
    } catch (error) {
      return { ...base, online: false, error: error.message };
    } finally {
      clearTimeout(timer);
    }
  }

  buildReference({ environmentId, contentId, softwareId, accessPolicy = 'staff_review' }) {
    if (!environmentId) throw new Error('EaaSI environmentId is required');
    return {
      provider: 'eaasi',
      tenantId: env.eaasi.tenantId || null,
      environmentId,
      contentId: contentId || null,
      softwareId: softwareId || null,
      accessPolicy,
    };
  }
}

export const eaasiAdapter = new EaasiAdapter();
