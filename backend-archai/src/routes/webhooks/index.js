import { Router } from 'express';
import { resourceSpaceWebhookRouter } from './resourcespace.js';
import { collectiveAccessWebhookRouter } from './collectiveaccess.js';
import { listWebhookEvents } from '../../services/webhookEventService.js';
import { requireRole } from '../../middleware/requireRole.js';

export const webhooksRouter = Router();

webhooksRouter.use('/resourcespace', resourceSpaceWebhookRouter);
webhooksRouter.use('/collectiveaccess', collectiveAccessWebhookRouter);
webhooksRouter.get('/events', requireRole('admin'), (_req, res) => res.json({ ok: true, events: listWebhookEvents() }));
