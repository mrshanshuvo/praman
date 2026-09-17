import * as path from 'node:path';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { configLoaders, validateEnv } from './config/env.config.js';
import { PrismaModule } from './database/prisma.module.js';
import { StorageModule } from './storage/storage.module.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')],
      validate: validateEnv,
      load: configLoaders,
    }),

    // Rate limiting: 60 requests per minute per IP by default.
    // Easily overridden per-route with @Throttle() or @SkipThrottle().
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000, // 1 minute window (ms)
          limit: process.env.NODE_ENV === 'production' ? 60 : 1000,
        },
      ],
    }),

    PrismaModule,
    StorageModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally so every route is rate-limited by default.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Apply JwtAuthGuard globally so all routes require authentication unless @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [ConfigModule, PrismaModule, StorageModule],
})
export class CoreModule {}
