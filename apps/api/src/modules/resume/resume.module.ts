import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { CandidateModule } from '../candidate/candidate.module.js';
import { ValidationModule } from '../validation/validation.module.js';
import { LatexService } from './latex.service.js';
import { ResumeController } from './resume.controller.js';
import { ResumeService } from './resume.service.js';

@Module({
  imports: [AiModule, CandidateModule, ValidationModule],
  controllers: [ResumeController],
  providers: [ResumeService, LatexService],
  exports: [ResumeService, LatexService],
})
export class ResumeModule {}
