import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OutreachService } from './outreach.service.js';

@ApiTags('Outreach Suite')
@ApiBearerAuth()
@Controller('job-descriptions/:id/outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  @Get()
  @ApiOperation({ summary: 'Get generated cover letter and recruiter email for a job' })
  @ApiResponse({ status: 200, description: 'Saved outreach materials' })
  async getOutreach(@Param('id') id: string) {
    return this.outreachService.getOutreach(id);
  }

  @Post('cover-letter')
  @ApiOperation({ summary: 'Generate a tailored, truth-preserving cover letter' })
  @ApiResponse({ status: 201, description: 'Cover letter generated successfully' })
  async generateCoverLetter(@Param('id') id: string) {
    return this.outreachService.generateCoverLetter(id);
  }

  @Post('email')
  @ApiOperation({ summary: 'Generate a high-converting recruiter cold outreach email' })
  @ApiResponse({ status: 201, description: 'Recruiter email generated successfully' })
  async generateRecruiterEmail(@Param('id') id: string) {
    return this.outreachService.generateRecruiterEmail(id);
  }
}
