import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Middleware that ensures every incoming request has a unique correlation ID
 * for distributed tracing and structured logging.
 *
 * If the caller passes `x-correlation-id`, it will be preserved; otherwise,
 * a cryptographically secure UUIDv4 will be generated.
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID();
  req.headers[CORRELATION_ID_HEADER] = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}
