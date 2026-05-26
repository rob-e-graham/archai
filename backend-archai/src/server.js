import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { requestContext } from './middleware/requestContext.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { log } from './utils/logger.js';
import { runNightlySync } from './services/vectorPipelineService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(requestContext);

// ── Serve AUX/NFC pages statically ──────────────────────────────
app.use('/aux', express.static(path.resolve(__dirname, '../../nfc-pages/v')));

// ── Random AUX page redirect (only pages with working images) ──
const PAGES_WITH_IMAGES = [2,12,13,17,19,20,21,37,38,41,43,44,46,47,51,52,55,56,58,59,60,61,65,66,70,71,73,77,79,80,83,87,88,96,99,102,109,113,116,118,120,123,125,130,132,135,141,149,154,155,158,162,168,170,175,182,184,185,188,194,195,197];

app.get('/aux/random', (_req, res) => {
  const n = PAGES_WITH_IMAGES[Math.floor(Math.random() * PAGES_WITH_IMAGES.length)];
  const page = 'NFC' + String(n).padStart(3, '0') + '.html';
  res.redirect('/aux/' + page);
});

// ── Manifest endpoint for frontends ───────────────────────────
app.get('/api/aux-manifest', (_req, res) => {
  res.json({ pages: PAGES_WITH_IMAGES, count: PAGES_WITH_IMAGES.length });
});

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'ARCHAI backend scaffold',
    docs: ['/api/health', '/api/integrations', '/api/search', '/api/nfc/tags', '/aux/random'],
  });
});

app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);

if (process.env.ARCHAI_DISABLE_CRON !== 'true') {
  cron.schedule(env.sync.cron, async () => {
    try {
      const batch = await runNightlySync({ initiatedBy: 'scheduler' });
      log.info('Nightly sync complete', batch.counts);
    } catch (err) {
      log.error('Nightly sync failed', err);
    }
  });
}

app.listen(env.port, () => {
  log.info(`Backend listening on ${env.baseUrl}`);
  log.info(`Mock mode: ${env.allowMocks ? 'enabled' : 'disabled'}`);
});
