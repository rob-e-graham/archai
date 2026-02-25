import { Router } from 'express';

export const nodelRouter = Router();

const devices = [
  { id: 'node_01', name: 'NFC-Kiosk-01', type: 'NFC kiosk', zone: 'Hall 3', status: 'online', uptimeHours: 6.2 },
  { id: 'node_02', name: 'Visitor Screen-01', type: 'HDMI display', zone: 'Screen Room', status: 'online', uptimeHours: 12.7 },
  { id: 'node_03', name: 'Rob Runtime', type: 'robot runtime', zone: 'Atrium', status: 'warning', uptimeHours: 3.1 },
];

nodelRouter.get('/devices', (_req, res) => res.json({ ok: true, devices }));
nodelRouter.get('/health', (_req, res) => res.json({ ok: true, summary: { online: 2, warning: 1, offline: 0 }, devices }));
