import dotenv from 'dotenv';

dotenv.config();

const bool = (v, d = false) => (v == null ? d : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()));
const int = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 8787),
  allowMocks: bool(process.env.ARCHAI_ALLOW_MOCKS, true),
  baseUrl: process.env.ARCHAI_BASE_URL || 'http://localhost:8787',
  publicUrl: process.env.ARCHAI_PUBLIC_URL || 'http://localhost:8787',
  famtecUrl: process.env.ARCHAI_FAMTEC_URL || './FAMTEC_exchange.html',
  githubUrl: process.env.ARCHAI_GITHUB_URL || '',
  collectiveAccess: {
    baseUrl: process.env.COLLECTIVEACCESS_BASE_URL || '',
    apiKey: process.env.COLLECTIVEACCESS_API_KEY || '',
    username: process.env.COLLECTIVEACCESS_USERNAME || '',
    password: process.env.COLLECTIVEACCESS_PASSWORD || '',
    profile: process.env.COLLECTIVEACCESS_PROFILE || 'archai',
  },
  resourceSpace: {
    baseUrl: process.env.RESOURCESPACE_BASE_URL || '',
    apiUser: process.env.RESOURCESPACE_API_USER || '',
    privateKey: process.env.RESOURCESPACE_API_PRIVATE_KEY || '',
    uploadCollection: process.env.RESOURCESPACE_UPLOAD_COLLECTION || '',
  },
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY || '',
    collection: process.env.QDRANT_COLLECTION || 'archai_objects',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
    chatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.2',
  },
  media: {
    cacheDir: process.env.MEDIA_CACHE_DIR || './data/runtime/media-cache',
    streamMode: process.env.MEDIA_STREAM_MODE || 'local-cache',
  },
  headlessCms: {
    provider: process.env.HEADLESS_CMS_PROVIDER || 'ghost',
    url: process.env.HEADLESS_CMS_URL || '',
    token: process.env.HEADLESS_CMS_TOKEN || '',
  },
  sync: {
    cron: process.env.SYNC_CRON || '30 2 * * *',
    batchSize: int(process.env.SYNC_BATCH_SIZE, 100),
    lookbackHours: int(process.env.SYNC_LOOKBACK_HOURS, 28),
  },
  restrictedFlags: (process.env.RESTRICTED_FLAGS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
