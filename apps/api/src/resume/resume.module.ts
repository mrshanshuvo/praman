import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { CandidateModule } from '../candidate/candidate.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { ValidationModule } from '../validation/validation.module.js';
import { LatexService } from './latex.service.js';
import { ResumeService } from './resume.service.js';

@Module({
  imports: [PrismaModule, AiModule, CandidateModule, ValidationModule, StorageModule],
  providers: [ResumeService, LatexService],
  exports: [ResumeService, LatexService],
})
export class ResumeModule {}

