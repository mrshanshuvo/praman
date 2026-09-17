import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateJobDescriptionDtoSchema } from '@praman/schemas';
import { type AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { MatchService } from '../match/match.service.js';
import { PipelineService } from '../pipeline/pipeline.service.js';
import { ResumeService } from '../resume/resume.service.js';
import { StrategyService } from '../strategy/strategy.service.js';
import { JobDescriptionService } from './job-description.service.js';

@ApiTags('Job Descriptions')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Create and analyze a raw job description' })
  @ApiResponse({ status: 201, description: 'JD created and parsed into structured format' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createJd(@Body() body: unknown, @CurrentUser() user?: AuthUser) {
    const parse = CreateJobDescriptionDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.jdService.createAndAnalyze(parse.data.rawText, user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all job descriptions for current user' })
  @ApiResponse({ status: 200, description: 'List of job descriptions' })
  async listJds(@CurrentUser() user?: AuthUser) {
    return this.jdService.getAllJds(user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single job description by ID with analysis tree' })
  @ApiResponse({ status: 200, description: 'Job description details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getJd(@Param('id') id: string) {
    return this.jdService.getJdById(id);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'Run candidate ↔ JD match analysis' })
  @ApiResponse({ status: 201, description: 'Match analysis generated' })
  async runMatch(@Param('id') id: string) {
    return this.matchService.runMatch(id);
  }

  @Post(':id/strategy')
  @ApiOperation({ summary: 'Generate strategic resume positioning recommendations' })
  @ApiResponse({ status: 201, description: 'Strategy generated' })
  async runStrategy(@Param('id') id: string) {
    return this.strategyService.runStrategy(id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Generate and validate tailored resume JSON' })
  @ApiResponse({ status: 201, description: 'Resume generated and validated' })
  async runResume(@Param('id') id: string) {
    return this.resumeService.generateAndValidate(id);
  }

  @Get(':id/resume')
  @ApiOperation({ summary: 'Get latest generated resume for this JD' })
  @ApiResponse({ status: 200, description: 'Latest resume record' })
  async getResume(@Param('id') id: string) {
    return this.resumeService.getLatestResume(id);
  }

  @Get(':id/resume/latex')
  @ApiOperation({ summary: 'Get compiled LaTeX source for latest resume' })
  @ApiResponse({ status: 200, description: 'LaTeX string wrapped in object' })
  async getResumeLatex(@Param('id') id: string, @Query('template') templateId?: string) {
    const latex = await this.resumeService.getLatexSource(id, templateId);
    return { latex, templateId: templateId || 'modern-developer' };
  }

  @Put(':id/resume/latex')
  @ApiOperation({ summary: 'Update and persist custom edited LaTeX source to Cloudflare R2' })
  @ApiResponse({ status: 200, description: 'LaTeX source updated and synced to R2' })
  async updateResumeLatex(
    @Param('id') id: string,
    @Body('latex') latex: string,
    @Query('template') templateId?: string,
  ) {
    return this.resumeService.updateLatexSource(id, latex, templateId);
  }

  // Orchestrator delegate (§4)
  @Post(':id/run-pipeline')
  @ApiOperation({
    summary:
      'Trigger full end-to-end tailoring pipeline (Match -> Strategy -> Resume -> Validation)',
  })
  @ApiResponse({ status: 201, description: 'Pipeline execution complete' })
  async runFullPipeline(@Param('id') id: string) {
    return this.pipelineService.runFullPipeline(id);
  }
}
