export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notImplemented = (feature) => new HttpError(501, `${feature} not configured yet`);
