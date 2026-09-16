import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { CandidateModule } from '../candidate/candidate.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MatchService } from './match.service.js';

@Module({
  imports: [PrismaModule, AiModule, CandidateModule],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
