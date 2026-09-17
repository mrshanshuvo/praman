import { Injectable, Logger } from '@nestjs/common';
import { MatchService } from '../match/match.service.js';
import { ResumeService } from '../resume/resume.service.js';
import { StrategyService } from '../strategy/strategy.service.js';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly matchService: MatchService,
    private readonly strategyService: StrategyService,
    private readonly resumeService: ResumeService,
  ) {}

  async runFullPipeline(jobDescriptionId: string) {
    this.logger.log(`Executing full end-to-end pipeline for JD: ${jobDescriptionId}`);

    const match = await this.matchService.runMatch(jobDescriptionId);
    const strategy = await this.strategyService.runStrategy(jobDescriptionId);
    const resume = await this.resumeService.generateAndValidate(jobDescriptionId);

    return {
      jobDescriptionId,
      match,
      strategy,
      resume,
    };
  }
}
