import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url } = req;
    const correlationId =
      (req.headers[CORRELATION_ID_HEADER] as string) ||
      (res.getHeader(CORRELATION_ID_HEADER) as string) ||
      'unknown';

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const statusCode = res.statusCode;
        const duration = Date.now() - now;
        const user = (req as any).user ? ` user=${(req as any).user.id}` : '';
        this.logger.log(`[${correlationId}] ${method} ${url} ${statusCode} - ${duration}ms${user}`);
      }),
    );
  }
}
