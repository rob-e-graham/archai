export const nowIso = () => new Date().toISOString();
export const hoursAgoIso = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString();
