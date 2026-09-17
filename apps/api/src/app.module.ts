import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'node:path';
import { AiModule } from './ai/ai.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CandidateModule } from './candidate/candidate.module.js';
import { validateEnv } from './config/env.validation.js';
import { JobDescriptionModule } from './job-description/job-description.module.js';
import { MatchModule } from './match/match.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ResumeModule } from './resume/resume.module.js';
import { StorageModule } from './storage/storage.module.js';
import { StrategyModule } from './strategy/strategy.module.js';
import { ValidationModule } from './validation/validation.module.js';

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
    CandidateModule,
    AiModule,
    ValidationModule,
    MatchModule,
    StrategyModule,
    ResumeModule,
    JobDescriptionModule,
    StorageModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
