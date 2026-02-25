import { Router } from 'express';
import { recordWebhookEvent } from '../../services/webhookEventService.js';

export const resourceSpaceWebhookRouter = Router();

resourceSpaceWebhookRouter.post('/', (req, res) => {
  const event = recordWebhookEvent({
    source: 'resourcespace',
    eventType: String(req.body?.event || 'asset.changed'),
    payload: req.body || {},
  });
  res.status(202).json({ ok: true, event, next: 'Queue incremental sync for affected object(s)' });
});
