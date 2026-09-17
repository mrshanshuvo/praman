import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import type { EnvConfig } from './core/config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor());

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
      if (!origin) {
        return callback(null, true);
      }

      try {
        const parsed = new URL(origin);
        if (allowedOrigins.has(origin) || parsed.hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch {
        if (allowedOrigins.has(origin)) {
          return callback(null, true);
        }
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  });

  const port = configService.get('PORT', { infer: true }) || 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
}
await bootstrap();
