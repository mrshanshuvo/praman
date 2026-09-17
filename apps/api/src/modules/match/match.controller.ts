import { Controller, Param, Post } from '@nestjs/common';
import { MatchService } from './match.service.js';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post(':jobDescriptionId')
  async runMatch(@Param('jobDescriptionId') jobDescriptionId: string) {
    return this.matchService.runMatch(jobDescriptionId);
  }
}
