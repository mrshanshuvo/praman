import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware.js';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  correlationId: string;
  timestamp: string;
}

/**
 * Global HTTP exception filter that catches ALL exceptions (HttpException and
 * unknown errors) and returns a consistent, machine-readable JSON envelope
 * containing a correlation ID for end-to-end incident traceability.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId =
      (request.headers[CORRELATION_ID_HEADER] as string) ||
      (response.getHeader(CORRELATION_ID_HEADER) as string) ||
      'unknown';

    let statusCode: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
        error = exception.message;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const body = exResponse as { message?: string | string[]; error?: string };
        message = body.message ?? exception.message;
        error = body.error ?? exception.message;
      } else {
        message = exception.message;
        error = exception.message;
      }
    } else {
      // Unknown / internal server error — never leak stack traces in production
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      message = 'An unexpected error occurred. Please try again later.';

      this.logger.error(
        `[${correlationId}] Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponse = {
      statusCode,
      error,
      message,
      path: request.url,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }
}
