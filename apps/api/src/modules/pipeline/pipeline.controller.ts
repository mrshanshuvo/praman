import { Controller, Param, Post } from '@nestjs/common';
import { PipelineService } from './pipeline.service.js';

@Controller('pipelines')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post(':jobDescriptionId')
  async runPipeline(@Param('jobDescriptionId') jobDescriptionId: string) {
    return this.pipelineService.runFullPipeline(jobDescriptionId);
  }
}
