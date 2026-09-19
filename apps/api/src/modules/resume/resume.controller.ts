import { Body, Controller, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get(':jobDescriptionId/pdf')
  async getResumePdf(
    @Param('jobDescriptionId') jobDescriptionId: string,
    @Query('template') templateId: string | undefined,
    @Query('version') version: string | undefined,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.resumeService.generateResumePdf(
      jobDescriptionId,
      templateId,
      version,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }
}
