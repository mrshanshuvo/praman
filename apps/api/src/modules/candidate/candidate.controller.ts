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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CandidatePersonalSchema,
  CreateCertificationDtoSchema,
  CreateEducationDtoSchema,
  CreateExperienceDtoSchema,
  CreateProjectDtoSchema,
  CreateSkillDtoSchema,
} from '@praman/schemas';
import { type AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CandidateService } from './candidate.service.js';

@ApiTags('Candidates')
@ApiBearerAuth()
@Controller('candidate-profile')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user candidate profile' })
  @ApiResponse({ status: 200, description: 'Profile returned successfully' })
  async getProfile(@CurrentUser() user?: AuthUser) {
    return this.candidateService.getProfile(user?.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update personal contact details and links' })
  @ApiResponse({ status: 200, description: 'Personal details updated' })
  async updatePersonal(@Body() body: unknown, @CurrentUser() user?: AuthUser) {
    const parse = CandidatePersonalSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updatePersonal(parse.data, user?.id);
  }

  @Put('personal')
  @ApiOperation({ summary: 'Update personal contact details and links (alias)' })
  @ApiResponse({ status: 200, description: 'Personal details updated' })
  async updatePersonalAlias(@Body() body: unknown, @CurrentUser() user?: AuthUser) {
    return this.updatePersonal(body, user);
  }

  // Experiences
  @Post('experiences')
  @ApiOperation({ summary: 'Add a work experience entry' })
  @ApiResponse({ status: 201, description: 'Experience added' })
  async addExperience(@Body() body: unknown, @CurrentUser() user?: AuthUser) {
    const parse = CreateExperienceDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.addExperience(parse.data, user?.id);
  }

  @Put('experiences/:id')
  @ApiOperation({ summary: 'Update an existing work experience entry' })
  async updateExperience(@Param('id') id: string, @Body() body: unknown) {
    const parse = CreateExperienceDtoSchema.partial().safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updateExperience(id, parse.data);
  }

  @Delete('experiences/:id')
  @ApiOperation({ summary: 'Delete a work experience entry' })
  async deleteExperience(@Param('id') id: string) {
    return this.candidateService.deleteExperience(id);
  }

  // Projects
  @Post('projects')
  @ApiOperation({ summary: 'Add a project entry' })
  @ApiResponse({ status: 201, description: 'Project added' })
  async addProject(@Body() body: unknown, @CurrentUser() user?: AuthUser) {
    const parse = CreateProjectDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.addProject(parse.data, user?.id);
  }

  @Put('projects/:id')
  @ApiOperation({ summary: 'Update an existing project entry' })
  async updateProject(@Param('id') id: string, @Body() body: unknown) {
    const parse = CreateProjectDtoSchema.partial().safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updateProject(id, parse.data);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Delete a project entry' })
  async deleteProject(@Param('id') id: string) {
    return this.candidateService.deleteProject(id);
  }

  // Skills
  @Post('skills')
  @ApiOperation({ summary: 'Add a skill entry' })
  @ApiResponse({ status: 201, description: 'Skill added' })
  async addSkill(@Body() body: unknown, @CurrentUser() user?: AuthUser) {
    const parse = CreateSkillDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.addSkill(parse.data, user?.id);
  }

  @Put('skills/:id')
  @ApiOperation({ summary: 'Update a skill entry' })
  async updateSkill(@Param('id') id: string, @Body() body: unknown) {
    const parse = CreateSkillDtoSchema.partial().safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updateSkill(id, parse.data);
  }

  @Delete('skills/:id')
  @ApiOperation({ summary: 'Delete a skill entry' })
  async deleteSkill(@Param('id') id: string) {
    return this.candidateService.deleteSkill(id);
  }

  // Educations
  @Post('educations')
  @ApiOperation({ summary: 'Add an education entry' })
  @ApiResponse({ status: 201, description: 'Education added' })
  async addEducation(@Body() body: unknown, @CurrentUser() user?: AuthUser) {
    const parse = CreateEducationDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.addEducation(parse.data, user?.id);
  }

  @Put('educations/:id')
  @ApiOperation({ summary: 'Update an education entry' })
  async updateEducation(@Param('id') id: string, @Body() body: unknown) {
    const parse = CreateEducationDtoSchema.partial().safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updateEducation(id, parse.data);
  }

  @Delete('educations/:id')
  @ApiOperation({ summary: 'Delete an education entry' })
  async deleteEducation(@Param('id') id: string) {
    return this.candidateService.deleteEducation(id);
  }

  // Certifications
  @Post('certifications')
  @ApiOperation({ summary: 'Add a certification entry' })
  @ApiResponse({ status: 201, description: 'Certification added' })
  async addCertification(@Body() body: unknown, @CurrentUser() user?: AuthUser) {
    const parse = CreateCertificationDtoSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.addCertification(parse.data, user?.id);
  }

  @Put('certifications/:id')
  @ApiOperation({ summary: 'Update a certification entry' })
  async updateCertification(@Param('id') id: string, @Body() body: unknown) {
    const parse = CreateCertificationDtoSchema.partial().safeParse(body);
    if (!parse.success) {
      throw new BadRequestException(parse.error.flatten());
    }
    return this.candidateService.updateCertification(id, parse.data);
  }

  @Delete('certifications/:id')
  @ApiOperation({ summary: 'Delete a certification entry' })
  async deleteCertification(@Param('id') id: string) {
    return this.candidateService.deleteCertification(id);
  }
}
