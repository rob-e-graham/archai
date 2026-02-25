import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cron from 'node-cron';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { requestContext } from './middleware/requestContext.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { log } from './utils/logger.js';
import { runNightlySync } from './services/vectorPipelineService.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(requestContext);

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'ARCHAI backend scaffold',
    docs: ['/api/health', '/api/integrations', '/api/search', '/api/nfc/tags', '/api/pipeline/nightly-sync'],
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
