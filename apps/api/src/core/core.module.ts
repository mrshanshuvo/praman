import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'node:path';
import { validateEnv } from './config/env.validation.js';
import { PrismaModule } from './database/prisma.module.js';
import { StorageModule } from './storage/storage.module.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
      ],
      validate: validateEnv,
    }),
    PrismaModule,
    StorageModule,
  ],
  exports: [ConfigModule, PrismaModule, StorageModule],
})
export class CoreModule {}
