import { Module } from '@nestjs/common';
import { MatchModule } from '../match/match.module.js';
import { ResumeModule } from '../resume/resume.module.js';
import { StrategyModule } from '../strategy/strategy.module.js';
import { PipelineController } from './pipeline.controller.js';
import { PipelineService } from './pipeline.service.js';

@Module({
  imports: [MatchModule, StrategyModule, ResumeModule],
  controllers: [PipelineController],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
