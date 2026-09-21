import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateJobDescriptionDtoSchema,
  CreateMilestoneDtoSchema,
  CreateNoteDtoSchema,
  PaginationQuerySchema,
  UpdateApplicationTrackerDtoSchema,
  UpdateJobStatusDtoSchema,
  UpdateMilestoneDtoSchema,
  UpdateNoteDtoSchema,
} from '@praman/schemas';
import type { Response } from 'express';
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
    return this.jdService.createAndAnalyze(parse.data.rawText, user?.id, parse.data.force);
  }

  @Get()
  @ApiOperation({ summary: 'List all job descriptions for current user (supports pagination)' })
  @ApiResponse({ status: 200, description: 'List of job descriptions or paginated response' })
  async listJds(@Query() query: unknown, @CurrentUser() user?: AuthUser) {
    const parse = PaginationQuerySchema.safeParse(query);
    const pagination = parse.success ? parse.data : undefined;
    return this.jdService.getAllJds(user?.id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single job description by ID with analysis tree' })
  @ApiResponse({ status: 200, description: 'Job description details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getJd(@Param('id') id: string) {
    return this.jdService.getJdById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job description and all derived pipeline results' })
  @ApiResponse({ status: 200, description: 'Job description and derived pipeline results deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async deleteJd(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.jdService.deleteJd(id, user?.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update job description application status' })
  @ApiResponse({ status: 200, description: 'Application status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status provided' })
  @ApiResponse({ status: 404, description: 'Job description not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthUser,
  ) {
    const parse = UpdateJobStatusDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.jdService.updateStatus(id, parse.data.status, user?.id);
  }

  // --- Tracker & Milestones Endpoints ---

  @Get(':id/tracker')
  @ApiOperation({ summary: 'Get application tracker, milestones, and notes for a job' })
  @ApiResponse({ status: 200, description: 'Application tracker data' })
  async getTracker(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.jdService.getTracker(id, user?.id);
  }

  @Patch(':id/tracker/dossier')
  @ApiOperation({
    summary: 'Update application dossier (applied date, salary, recruiter info, portal)',
  })
  @ApiResponse({ status: 200, description: 'Application tracker updated' })
  async updateTrackerDossier(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthUser,
  ) {
    const parse = UpdateApplicationTrackerDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.jdService.updateTrackerDossier(id, parse.data, user?.id);
  }

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Add an interview milestone to job tracker' })
  @ApiResponse({ status: 201, description: 'Interview milestone created' })
  async addMilestone(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthUser,
  ) {
    const parse = CreateMilestoneDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.jdService.addMilestone(id, parse.data, user?.id);
  }

  @Patch(':id/milestones/:milestoneId')
  @ApiOperation({ summary: 'Update an interview milestone (status, questions, date, notes)' })
  @ApiResponse({ status: 200, description: 'Interview milestone updated' })
  async updateMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthUser,
  ) {
    const parse = UpdateMilestoneDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.jdService.updateMilestone(id, milestoneId, parse.data, user?.id);
  }

  @Delete(':id/milestones/:milestoneId')
  @ApiOperation({ summary: 'Delete an interview milestone' })
  @ApiResponse({ status: 200, description: 'Interview milestone deleted' })
  async deleteMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.jdService.deleteMilestone(id, milestoneId, user?.id);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a timestamped application note' })
  @ApiResponse({ status: 201, description: 'Note added' })
  async addNote(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user?: AuthUser) {
    const parse = CreateNoteDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.jdService.addNote(id, parse.data, user?.id);
  }

  @Patch(':id/notes/:noteId')
  @ApiOperation({ summary: 'Update or pin an application note' })
  @ApiResponse({ status: 200, description: 'Note updated' })
  async updateNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthUser,
  ) {
    const parse = UpdateNoteDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.jdService.updateNote(id, noteId, parse.data, user?.id);
  }

  @Delete(':id/notes/:noteId')
  @ApiOperation({ summary: 'Delete an application note' })
  @ApiResponse({ status: 200, description: 'Note deleted' })
  async deleteNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.jdService.deleteNote(id, noteId, user?.id);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'Run candidate ↔ JD match analysis' })
  @ApiResponse({ status: 201, description: 'Match analysis generated' })
  async runMatch(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.matchService.runMatch(id, user?.id);
  }

  @Post(':id/strategy')
  @ApiOperation({ summary: 'Generate strategic resume positioning recommendations' })
  @ApiResponse({ status: 201, description: 'Strategy generated' })
  async runStrategy(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.strategyService.runStrategy(id, user?.id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Generate and validate tailored resume JSON' })
  @ApiResponse({ status: 201, description: 'Resume generated and validated' })
  async runResume(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.resumeService.generateAndValidate(id, user?.id);
  }

  @Get(':id/resume')
  @ApiOperation({ summary: 'Get latest or specific version of generated resume for this JD' })
  @ApiResponse({ status: 200, description: 'Resume record' })
  async getResume(
    @Param('id') id: string,
    @Query('version') versionOrId?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.resumeService.getLatestResume(id, versionOrId, user?.id);
  }

  @Get(':id/resume/versions')
  @ApiOperation({ summary: 'List all historical resume versions for this JD' })
  @ApiResponse({ status: 200, description: 'List of resume versions' })
  async getResumeVersions(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.resumeService.getResumeVersions(id, user?.id);
  }

  @Get(':id/resume/latex')
  @ApiOperation({ summary: 'Get compiled LaTeX source for resume' })
  @ApiResponse({ status: 200, description: 'LaTeX string wrapped in object' })
  async getResumeLatex(
    @Param('id') id: string,
    @Query('template') templateId?: string,
    @Query('version') versionOrId?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    const latex = await this.resumeService.getLatexSource(id, templateId, versionOrId, user?.id);
    return { latex, templateId: templateId || 'modern-developer' };
  }

  @Put(':id/resume/latex')
  @ApiOperation({ summary: 'Update and persist custom edited LaTeX source to Cloudflare R2' })
  @ApiResponse({ status: 200, description: 'LaTeX source updated and synced to R2' })
  async updateResumeLatex(
    @Param('id') id: string,
    @Body('latex') latex: string,
    @Query('template') templateId?: string,
    @Query('version') versionOrId?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.resumeService.updateLatexSource(id, latex, templateId, versionOrId, user?.id);
  }

  @Get(':id/resume/pdf')
  @ApiOperation({ summary: 'Generate and download ATS-optimized resume PDF' })
  @ApiResponse({ status: 200, description: 'Binary PDF file stream' })
  async getResumePdf(
    @Param('id') id: string,
    @Query('template') templateId: string | undefined,
    @Query('version') versionOrId: string | undefined,
    @Res() res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    const { buffer, filename } = await this.resumeService.generateResumePdf(
      id,
      templateId,
      versionOrId,
      user?.id,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  // Orchestrator delegate (§4)
  @Post(':id/run-pipeline')
  @ApiOperation({
    summary:
      'Trigger full end-to-end tailoring pipeline (Match -> Strategy -> Resume -> Validation)',
  })
  @ApiResponse({ status: 201, description: 'Pipeline execution complete' })
  async runFullPipeline(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.pipelineService.runFullPipeline(id, user?.id);
  }
}
