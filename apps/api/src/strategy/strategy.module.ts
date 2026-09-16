import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StrategyService } from './strategy.service.js';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [StrategyService],
  exports: [StrategyService],
})
export class StrategyModule {}
