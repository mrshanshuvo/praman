import { Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service.js';

@ApiTags('Pipeline')
@ApiBearerAuth()
@Controller('pipelines')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post(':jobDescriptionId')
  @ApiOperation({
    summary: 'Execute full automated pipeline for given Job Description ID',
    description:
      'Sequentially runs Match Analysis, Resume Strategy, Resume Generation, and Schema Validation.',
  })
  @ApiResponse({ status: 201, description: 'Pipeline execution succeeded' })
  @ApiResponse({ status: 404, description: 'Job description not found' })
  async runPipeline(@Param('jobDescriptionId') jobDescriptionId: string) {
    return this.pipelineService.runFullPipeline(jobDescriptionId);
  }
}
