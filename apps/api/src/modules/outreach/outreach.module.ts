import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { CandidateModule } from '../candidate/candidate.module.js';
import { ValidationModule } from '../validation/validation.module.js';
import { OutreachController } from './outreach.controller.js';
import { OutreachService } from './outreach.service.js';

@Module({
  imports: [AiModule, CandidateModule, ValidationModule],
  controllers: [OutreachController],
  providers: [OutreachService],
  exports: [OutreachService],
})
export class OutreachModule {}
