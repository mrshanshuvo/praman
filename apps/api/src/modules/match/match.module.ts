import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { CandidateModule } from '../candidate/candidate.module.js';
import { MatchController } from './match.controller.js';
import { MatchService } from './match.service.js';

@Module({
  imports: [AiModule, CandidateModule],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
