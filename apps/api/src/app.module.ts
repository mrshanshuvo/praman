import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CandidateModule } from './candidate/candidate.module.js';
import { JobDescriptionModule } from './job-description/job-description.module.js';
import { MatchModule } from './match/match.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ResumeModule } from './resume/resume.module.js';
import { StrategyModule } from './strategy/strategy.module.js';
import { ValidationModule } from './validation/validation.module.js';

@Module({
  imports: [
    PrismaModule,
    CandidateModule,
    AiModule,
    ValidationModule,
    MatchModule,
    StrategyModule,
    ResumeModule,
    JobDescriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
