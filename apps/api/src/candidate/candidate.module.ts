import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CandidateController } from './candidate.controller.js';
import { CandidateService } from './candidate.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CandidateController],
  providers: [CandidateService],
  exports: [CandidateService],
})
export class CandidateModule {}
