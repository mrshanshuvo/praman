import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  CandidatePersonalSchema,
  CreateCertificationDtoSchema,
  CreateEducationDtoSchema,
  CreateExperienceDtoSchema,
  CreateProjectDtoSchema,
  CreateSkillDtoSchema,
} from '@praman/schemas';
import { CandidateService } from './candidate.service.js';

@Controller('candidate-profile')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get()
  async getProfile() {
    return this.candidateService.getProfile();
  }

  @Put()
  async updatePersonal(@Body() body: unknown) {
    const parse = CandidatePersonalSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updatePersonal(parse.data);
  }

  // Experiences
  @Post('experiences')
  async addExperience(@Body() body: unknown) {
    const parse = CreateExperienceDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.addExperience(parse.data);
  }

  @Put('experiences/:id')
  async updateExperience(@Param('id') id: string, @Body() body: unknown) {
    const parse = CreateExperienceDtoSchema.partial().safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updateExperience(id, parse.data);
  }

  @Delete('experiences/:id')
  async deleteExperience(@Param('id') id: string) {
    return this.candidateService.deleteExperience(id);
  }

  // Projects
  @Post('projects')
  async addProject(@Body() body: unknown) {
    const parse = CreateProjectDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.addProject(parse.data);
  }

  @Put('projects/:id')
  async updateProject(@Param('id') id: string, @Body() body: unknown) {
    const parse = CreateProjectDtoSchema.partial().safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updateProject(id, parse.data);
  }

  @Delete('projects/:id')
  async deleteProject(@Param('id') id: string) {
    return this.candidateService.deleteProject(id);
  }

  // Skills
  @Post('skills')
  async addSkill(@Body() body: unknown) {
    const parse = CreateSkillDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.addSkill(parse.data);
  }

  @Put('skills/:id')
  async updateSkill(@Param('id') id: string, @Body() body: unknown) {
    const parse = CreateSkillDtoSchema.partial().safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updateSkill(id, parse.data);
  }

  @Delete('skills/:id')
  async deleteSkill(@Param('id') id: string) {
    return this.candidateService.deleteSkill(id);
  }

  // Educations
  @Post('educations')
  async addEducation(@Body() body: unknown) {
    const parse = CreateEducationDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.addEducation(parse.data);
  }

  @Put('educations/:id')
  async updateEducation(@Param('id') id: string, @Body() body: unknown) {
    const parse = CreateEducationDtoSchema.partial().safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updateEducation(id, parse.data);
  }

  @Delete('educations/:id')
  async deleteEducation(@Param('id') id: string) {
    return this.candidateService.deleteEducation(id);
  }

  // Certifications
  @Post('certifications')
  async addCertification(@Body() body: unknown) {
    const parse = CreateCertificationDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.addCertification(parse.data);
  }

  @Put('certifications/:id')
  async updateCertification(@Param('id') id: string, @Body() body: unknown) {
    const parse = CreateCertificationDtoSchema.partial().safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updateCertification(id, parse.data);
  }

  @Delete('certifications/:id')
  async deleteCertification(@Param('id') id: string) {
    return this.candidateService.deleteCertification(id);
  }
}
