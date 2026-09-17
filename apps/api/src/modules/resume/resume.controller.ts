import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ResumeService } from './resume.service.js';

@Controller('resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post(':jobDescriptionId')
  async runResume(@Param('jobDescriptionId') jobDescriptionId: string) {
    return this.resumeService.generateAndValidate(jobDescriptionId);
  }

  @Get(':jobDescriptionId')
  async getResume(@Param('jobDescriptionId') jobDescriptionId: string) {
    return this.resumeService.getLatestResume(jobDescriptionId);
  }

  @Get(':jobDescriptionId/latex')
  async getResumeLatex(@Param('jobDescriptionId') jobDescriptionId: string) {
    const latex = await this.resumeService.getLatexSource(jobDescriptionId);
    return { latex };
  }

  @Put(':jobDescriptionId/latex')
  async updateLatex(
    @Param('jobDescriptionId') jobDescriptionId: string,
    @Body('latex') latex: string,
  ) {
    return this.resumeService.updateLatexSource(jobDescriptionId, latex);
  }
}
