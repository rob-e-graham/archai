import { Router } from 'express';
import { recordWebhookEvent } from '../../services/webhookEventService.js';

export const collectiveAccessWebhookRouter = Router();

collectiveAccessWebhookRouter.post('/', (req, res) => {
  const event = recordWebhookEvent({
    source: 'collectiveaccess',
    eventType: String(req.body?.event || 'record.changed'),
    payload: req.body || {},
  });
  res.status(202).json({ ok: true, event, next: 'Queue incremental sync for affected object(s)' });
});
