import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { CandidateModule } from '../candidate/candidate.module.js';
import { MatchModule } from '../match/match.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ResumeModule } from '../resume/resume.module.js';
import { StrategyModule } from '../strategy/strategy.module.js';
import { JobDescriptionController } from './job-description.controller.js';
import { JobDescriptionService } from './job-description.service.js';

@Module({
  imports: [PrismaModule, AiModule, CandidateModule, MatchModule, StrategyModule, ResumeModule],
  controllers: [JobDescriptionController],
  providers: [JobDescriptionService],
  exports: [JobDescriptionService],
})
export class JobDescriptionModule {}
