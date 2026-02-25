const webhookEvents = [];

export function recordWebhookEvent({ source, eventType, payload }) {
  const event = {
    id: crypto.randomUUID(),
    source,
    eventType,
    payload,
    receivedAt: new Date().toISOString(),
    status: 'recorded',
  };
  webhookEvents.unshift(event);
  return event;
}

export function listWebhookEvents() {
  return webhookEvents;
}
