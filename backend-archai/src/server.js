import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
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

// ── Serve AUX.IO pages statically ──────────────────────────────
const auxPagesDir = env.auxPagesDir
  ? path.resolve(env.auxPagesDir)
  : path.resolve(__dirname, '../../nfc-pages/v');
app.use('/aux', express.static(auxPagesDir));

function getAuxPages() {
  try {
    return fs.readdirSync(auxPagesDir)
      .filter((name) => /^NFC\d+\.html$/i.test(name))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/\d+/)?.[0] || '0', 10);
        const bNum = parseInt(b.match(/\d+/)?.[0] || '0', 10);
        return aNum - bNum;
      });
  } catch {
    return [];
  }
}

// ── Random AUX page redirect ────────────────────────────────────

app.get('/aux/random', (_req, res) => {
  const pages = getAuxPages();
  if (!pages.length) {
    return res.status(503).json({ ok: false, error: 'No AUX.IO pages available' });
  }
  const page = pages[Math.floor(Math.random() * pages.length)];
  res.redirect('/aux/' + page);
});

// ── Manifest endpoint for frontends ───────────────────────────
app.get('/api/aux-manifest', (_req, res) => {
  const pages = getAuxPages();
  const pageNumbers = pages
    .map((name) => parseInt(name.match(/\d+/)?.[0] || '0', 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  res.json({ pages: pageNumbers, count: pageNumbers.length });
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
