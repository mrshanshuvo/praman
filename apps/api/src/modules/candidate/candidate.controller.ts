import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  type BatchImportProfileRequest,
  BatchImportProfileRequestSchema,
  type CreateCertificationDto,
  CreateCertificationDtoSchema,
  type CreateEducationDto,
  CreateEducationDtoSchema,
  type CreateExperienceDto,
  CreateExperienceDtoSchema,
  type CreateProjectDto,
  CreateProjectDtoSchema,
  type CreateSkillDto,
  CreateSkillDtoSchema,
  type ParseResumeRequest,
  ParseResumeRequestSchema,
  type UpdateCandidatePersonal,
  UpdateCandidatePersonalSchema,
  type UpdateCertificationDto,
  UpdateCertificationDtoSchema,
  type UpdateEducationDto,
  UpdateEducationDtoSchema,
  type UpdateExperienceDto,
  UpdateExperienceDtoSchema,
  type UpdateProjectDto,
  UpdateProjectDtoSchema,
  type UpdateSkillDto,
  UpdateSkillDtoSchema,
} from '@praman/schemas';
import { type AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CandidateService } from './candidate.service.js';
import { ResumeParserService } from './resume-parser.service.js';

@ApiTags('Candidates')
@ApiBearerAuth()
@Controller('candidate-profile')
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly resumeParserService: ResumeParserService,
  ) {}

  @Post('parse-resume')
  @ApiOperation({ summary: 'Parse raw resume text heuristically offline' })
  @ApiResponse({ status: 200, description: 'Parsed resume data returned' })
  async parseResume(
    @Body(new ZodValidationPipe(ParseResumeRequestSchema)) dto: ParseResumeRequest,
  ) {
    return this.resumeParserService.parse(dto.rawText);
  }

  @Post('import')
  @ApiOperation({ summary: 'Batch import parsed resume into candidate profile' })
  @ApiResponse({ status: 200, description: 'Profile imported successfully' })
  async importProfile(
    @Body(new ZodValidationPipe(BatchImportProfileRequestSchema)) dto: BatchImportProfileRequest,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.candidateService.batchImportProfile(dto, user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user candidate profile' })
  @ApiResponse({ status: 200, description: 'Profile returned successfully' })
  async getProfile(@CurrentUser() user?: AuthUser) {
    return this.candidateService.getProfile(user?.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update personal contact details and links' })
  @ApiResponse({ status: 200, description: 'Personal details updated' })
  async updatePersonal(
    @Body(new ZodValidationPipe(UpdateCandidatePersonalSchema)) dto: UpdateCandidatePersonal,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.candidateService.updatePersonal(dto, user?.id);
  }

  @Put('personal')
  @ApiOperation({ summary: 'Update personal contact details and links (alias)' })
  @ApiResponse({ status: 200, description: 'Personal details updated' })
  async updatePersonalAlias(
    @Body(new ZodValidationPipe(UpdateCandidatePersonalSchema)) dto: UpdateCandidatePersonal,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.updatePersonal(dto, user);
  }

  @Patch()
  @ApiOperation({ summary: 'Partially update personal details and links' })
  @ApiResponse({ status: 200, description: 'Personal details updated' })
  async patchPersonal(
    @Body(new ZodValidationPipe(UpdateCandidatePersonalSchema)) dto: UpdateCandidatePersonal,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.updatePersonal(dto, user);
  }

  @Patch('personal')
  @ApiOperation({ summary: 'Partially update personal details and links (alias)' })
  @ApiResponse({ status: 200, description: 'Personal details updated' })
  async patchPersonalAlias(
    @Body(new ZodValidationPipe(UpdateCandidatePersonalSchema)) dto: UpdateCandidatePersonal,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.updatePersonal(dto, user);
  }

  // Experiences
  @Post('experiences')
  @ApiOperation({ summary: 'Add a work experience entry' })
  @ApiResponse({ status: 201, description: 'Experience added' })
  async addExperience(
    @Body(new ZodValidationPipe(CreateExperienceDtoSchema)) dto: CreateExperienceDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.candidateService.addExperience(dto, user?.id);
  }

  @Put('experiences/:id')
  @ApiOperation({ summary: 'Update an existing work experience entry' })
  async updateExperience(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateExperienceDtoSchema)) dto: UpdateExperienceDto,
  ) {
    return this.candidateService.updateExperience(id, dto);
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
  async addProject(
    @Body(new ZodValidationPipe(CreateProjectDtoSchema)) dto: CreateProjectDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.candidateService.addProject(dto, user?.id);
  }

  @Put('projects/:id')
  @ApiOperation({ summary: 'Update an existing project entry' })
  async updateProject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProjectDtoSchema)) dto: UpdateProjectDto,
  ) {
    return this.candidateService.updateProject(id, dto);
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
  async addSkill(
    @Body(new ZodValidationPipe(CreateSkillDtoSchema)) dto: CreateSkillDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.candidateService.addSkill(dto, user?.id);
  }

  @Put('skills/:id')
  @ApiOperation({ summary: 'Update a skill entry' })
  async updateSkill(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSkillDtoSchema)) dto: UpdateSkillDto,
  ) {
    return this.candidateService.updateSkill(id, dto);
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
  async addEducation(
    @Body(new ZodValidationPipe(CreateEducationDtoSchema)) dto: CreateEducationDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.candidateService.addEducation(dto, user?.id);
  }

  @Put('educations/:id')
  @ApiOperation({ summary: 'Update an education entry' })
  async updateEducation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateEducationDtoSchema)) dto: UpdateEducationDto,
  ) {
    return this.candidateService.updateEducation(id, dto);
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
  async addCertification(
    @Body(new ZodValidationPipe(CreateCertificationDtoSchema)) dto: CreateCertificationDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.candidateService.addCertification(dto, user?.id);
  }

  @Put('certifications/:id')
  @ApiOperation({ summary: 'Update a certification entry' })
  async updateCertification(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCertificationDtoSchema)) dto: UpdateCertificationDto,
  ) {
    return this.candidateService.updateCertification(id, dto);
  }

  @Delete('certifications/:id')
  @ApiOperation({ summary: 'Delete a certification entry' })
  async deleteCertification(@Param('id') id: string) {
    return this.candidateService.deleteCertification(id);
  }
}
