import { Controller, Param, Post } from '@nestjs/common';
import { StrategyService } from './strategy.service.js';

@Controller('strategies')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Post(':jobDescriptionId')
  async runStrategy(@Param('jobDescriptionId') jobDescriptionId: string) {
    return this.strategyService.runStrategy(jobDescriptionId);
  }
}
