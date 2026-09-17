import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { StrategyController } from './strategy.controller.js';
import { StrategyService } from './strategy.service.js';

@Module({
  imports: [AiModule],
  controllers: [StrategyController],
  providers: [StrategyService],
  exports: [StrategyService],
})
export class StrategyModule {}
