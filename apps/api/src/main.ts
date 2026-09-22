import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { correlationIdMiddleware } from './common/middleware/correlation-id.middleware.js';
import type { EnvConfig } from './core/config/env.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── 1. Graceful Shutdown ─────────────────────────────────────────────────
  // Listens for termination signals (SIGTERM, SIGINT) and drains connections cleanly.
  app.enableShutdownHooks();

  // ─── 2. Correlation ID & Observability ────────────────────────────────────
  // Attaches or generates a unique x-correlation-id for every request/response.
  app.use(correlationIdMiddleware);

  // ─── 3. Security: Helmet ──────────────────────────────────────────────────
  // Sets security-related HTTP response headers (XSS, Clickjacking, MIME-sniff, etc.)
  app.use(
    helmet({
      // Allow Swagger UI to load its assets in development
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    }),
  );

  // ─── 4. Global Exception Filter ───────────────────────────────────────────
  // Normalises ALL errors (HttpException + unknowns) into a consistent JSON envelope
  // with an embedded correlation ID.
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ─── 5. Logging Interceptor ───────────────────────────────────────────────
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ─── 6. CORS ──────────────────────────────────────────────────────────────
  const configService = app.get(ConfigService<EnvConfig, true>);
  const frontendUrl = configService.get('FRONTEND_URL', { infer: true }) || '';
  const configuredOrigins = frontendUrl
    .split(',')
    .map((url: string) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedOrigins = new Set(['http://localhost:3000', ...configuredOrigins]);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow server-to-server, curl, mobile, or same-origin requests without an Origin header
      if (!origin) return callback(null, true);

      try {
        const parsed = new URL(origin);
        if (allowedOrigins.has(origin) || parsed.hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch {
        if (allowedOrigins.has(origin)) return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  });

  // ─── 7. Swagger / OpenAPI ────────────────────────────────────────────────
  // Only mount Swagger in non-production environments unless explicitly enabled.
  const nodeEnv = configService.get('NODE_ENV', { infer: true });
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Praman API')
      .setDescription(
        'AI-powered resume tailoring platform API. ' +
          'Manages candidates, job descriptions, resume analysis, and AI-driven strategy generation.',
      )
      .setVersion('0.2.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token retrieved from /auth/login or /auth/register',
      })
      .addTag('Health', 'Liveness & readiness probes')
      .addTag('Auth', 'User registration, login, and token issuance')
      .addTag('Candidates', 'Candidate profile management')
      .addTag('Job Descriptions', 'Job description ingestion & retrieval')
      .addTag('Pipeline', 'Full end-to-end resume tailoring pipeline')
      .addTag('Resume', 'AI-generated resume operations')
      .addTag('Strategy', 'Resume strategy generation')
      .addTag('Match', 'Candidate ↔ JD analysis & scoring')
      .addTag('Validation', 'AI output validation')
      .addTag('AI', 'LLM configuration & fallback management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Praman API Docs',
    });

    console.log(
      `📚  Swagger UI available at: http://0.0.0.0:${configService.get('PORT', { infer: true }) || 5000}/api/docs`,
    );
  }

  // ─── Start ────────────────────────────────────────────────────────────────
  const port = configService.get('PORT', { infer: true }) || 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀  Application is running on: http://0.0.0.0:${port}`);
  console.log(`🏥  Health check at: http://0.0.0.0:${port}/healthz`);
}
await bootstrap();
