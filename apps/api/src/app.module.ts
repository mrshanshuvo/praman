import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CoreModule } from './core/core.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { CandidateModule } from './modules/candidate/candidate.module.js';
import { JobDescriptionModule } from './modules/job-description/job-description.module.js';
import { MatchModule } from './modules/match/match.module.js';
import { PipelineModule } from './modules/pipeline/pipeline.module.js';
import { ResumeModule } from './modules/resume/resume.module.js';
import { StrategyModule } from './modules/strategy/strategy.module.js';
import { ValidationModule } from './modules/validation/validation.module.js';

@Module({
  imports: [
    CoreModule,
    CandidateModule,
    AiModule,
    ValidationModule,
    MatchModule,
    StrategyModule,
    ResumeModule,
    JobDescriptionModule,
    PipelineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
