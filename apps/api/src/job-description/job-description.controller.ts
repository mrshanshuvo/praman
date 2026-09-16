import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateJobDescriptionDtoSchema } from '@praman/schemas';
import { MatchService } from '../match/match.service.js';
import { ResumeService } from '../resume/resume.service.js';
import { StrategyService } from '../strategy/strategy.service.js';
import { JobDescriptionService } from './job-description.service.js';

@Controller('job-descriptions')
export class JobDescriptionController {
  constructor(
    private readonly jdService: JobDescriptionService,
    private readonly matchService: MatchService,
    private readonly strategyService: StrategyService,
    private readonly resumeService: ResumeService,
  ) {}

  @Post()
  async createJd(@Body() body: unknown) {
    const parse = CreateJobDescriptionDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.jdService.createAndAnalyze(parse.data.rawText);
  }

  @Get()
  async listJds() {
    return this.jdService.getAllJds();
  }

  @Get(':id')
  async getJd(@Param('id') id: string) {
    return this.jdService.getJdById(id);
  }

  @Post(':id/match')
  async runMatch(@Param('id') id: string) {
    return this.matchService.runMatch(id);
  }

  @Post(':id/strategy')
  async runStrategy(@Param('id') id: string) {
    return this.strategyService.runStrategy(id);
  }

  @Post(':id/resume')
  async runResume(@Param('id') id: string) {
    return this.resumeService.generateAndValidate(id);
  }

  @Get(':id/resume')
  async getResume(@Param('id') id: string) {
    return this.resumeService.getLatestResume(id);
  }

  // Convenience orchestrator endpoint (§4)
  @Post(':id/run-pipeline')
  async runFullPipeline(@Param('id') id: string) {
    const match = await this.matchService.runMatch(id);
    const strategy = await this.strategyService.runStrategy(id);
    const resume = await this.resumeService.generateAndValidate(id);

    return {
      jobDescriptionId: id,
      match,
      strategy,
      resume,
    };
  }
}
