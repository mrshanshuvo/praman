import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller.js';
import { CandidateService } from './candidate.service.js';
import { ResumeParserService } from './resume-parser.service.js';

@Module({
  controllers: [CandidateController],
  providers: [CandidateService, ResumeParserService],
  exports: [CandidateService, ResumeParserService],
})
export class CandidateModule {}
