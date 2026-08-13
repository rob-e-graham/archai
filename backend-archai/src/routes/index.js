import { Router } from 'express';
import { healthRouter } from './health.js';
import { searchRouter } from './search.js';
import { objectsRouter } from './objects.js';
import { nfcRouter } from './nfc.js';
import { uploadRouter } from './upload.js';
import { vocabRouter } from './vocab.js';
import { nodelRouter } from './nodel.js';
import { adminRouter } from './admin.js';
import { famtecRouter } from './famtec.js';
import { chatRouter } from './chat.js';
import { pipelineRouter } from './pipeline.js';
import { integrationsRouter } from './integrations.js';
import { commentsRouter } from './comments.js';
import { mediaRouter } from './media.js';
import { workflowsRouter } from './workflows.js';
import { webhooksRouter } from './webhooks/index.js';
import { proxyRouter } from './proxy.js';
import { publicDemoGuard } from '../middleware/publicDemoGuard.js';

export const apiRouter = Router();

// Deny-by-default lockdown for public/demo traffic. Runs before every route so
// an unlisted write path is blocked, not exposed. No-op for staff requests.
apiRouter.use(publicDemoGuard);

apiRouter.use('/health', healthRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/objects', objectsRouter);
apiRouter.use('/nfc', nfcRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/vocab', vocabRouter);
apiRouter.use('/nodel', nodelRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/famtec', famtecRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/pipeline', pipelineRouter);
apiRouter.use('/integrations', integrationsRouter);
apiRouter.use('/comments', commentsRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/workflows', workflowsRouter);
apiRouter.use('/webhooks', webhooksRouter);
apiRouter.use('/proxy', proxyRouter);
