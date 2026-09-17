import { Controller, MessageEvent, Param, Post, Sse } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Observable } from 'rxjs';
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

  @Sse(':jobDescriptionId/stream')
  @ApiOperation({
    summary: 'Stream full automated pipeline events (SSE) for given Job Description ID',
    description:
      'Emits real-time Server-Sent Events as Match, Strategy, and Resume generation progress in real time.',
  })
  @ApiResponse({ status: 200, description: 'Server-Sent Events stream initiated' })
  @ApiResponse({ status: 404, description: 'Job description not found' })
  streamPipeline(@Param('jobDescriptionId') jobDescriptionId: string): Observable<MessageEvent> {
    return this.pipelineService.streamFullPipeline(jobDescriptionId);
  }
}
