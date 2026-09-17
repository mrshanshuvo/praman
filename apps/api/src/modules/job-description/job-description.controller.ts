import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateJobDescriptionDtoSchema } from '@praman/schemas';
import { MatchService } from '../match/match.service.js';
import { PipelineService } from '../pipeline/pipeline.service.js';
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
    private readonly pipelineService: PipelineService,
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

  @Get(':id/resume/latex')
  async getResumeLatex(@Param('id') id: string) {
    const latex = await this.resumeService.getLatexSource(id);
    return { latex };
  }

  // Orchestrator delegate (§4)
  @Post(':id/run-pipeline')
  async runFullPipeline(@Param('id') id: string) {
    return this.pipelineService.runFullPipeline(id);
  }
}
