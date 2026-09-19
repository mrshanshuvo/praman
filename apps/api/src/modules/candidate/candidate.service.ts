import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CandidatePersonal,
  CreateCertificationDto,
  CreateEducationDto,
  CreateExperienceDto,
  CreateProjectDto,
  CreateSkillDto,
} from '@praman/schemas';
import { PrismaService } from '../../core/database/prisma.service.js';

@Injectable()
export class CandidateService {
  constructor(private readonly prisma: PrismaService) {}

  async getDefaultUser() {
    let user = await this.prisma.client.orm.public.User.where({
      email: 'mrshanshuvo@gmail.com',
    }).first();

    if (!user) {
      user = await this.prisma.client.orm.public.User.where({
        email: 'default@praman.dev',
      }).first();
    }

    if (!user) {
      const allUsers = await this.prisma.client.orm.public.User.all();
      if (allUsers.length > 0) {
        user = allUsers[0];
      }
    }

    if (!user) {
      user = await this.prisma.client.orm.public.User.create({
        email: 'mrshanshuvo@gmail.com',
        name: 'Shahid Hasan Shovu',
      });
    }

    return user;
  }

  async getProfile(targetUserId?: string) {
    let userId = targetUserId;
    if (!userId) {
      const user = await this.getDefaultUser();
      userId = user.id;
    }

    let profile = await this.prisma.client.orm.public.CandidateProfile.where({
      userId,
    })
      .include('experiences')
      .include('projects')
      .include('skills')
      .include('educations')
      .include('certifications')
      .first();

    if (!profile) {
      const userRecord = await this.prisma.client.orm.public.User.where({
        id: userId,
      }).first();

      const newProfile = await this.prisma.client.orm.public.CandidateProfile.create({
        userId,
        personal: {
          name: userRecord?.name ?? 'Candidate',
          contact: { email: userRecord?.email ?? '' },
          links: {},
        },
      });

      profile = await this.prisma.client.orm.public.CandidateProfile.where({
        id: newProfile.id,
      })
        .include('experiences')
        .include('projects')
        .include('skills')
        .include('educations')
        .include('certifications')
        .first();
    }

    if (!profile) {
      throw new NotFoundException('Candidate profile could not be retrieved or created');
    }

    return profile;
  }

  async getSanitizedProfile(targetUserId?: string) {
    const profile = await this.getProfile(targetUserId);
    return {
      personal: profile.personal,
      skills: profile.skills?.map((s) => ({
        name: s.name,
        level: s.level,
        evidence: s.evidence,
      })),
      experiences: profile.experiences?.map((e) => ({
        id: e.id,
        title: e.title,
        company: e.company,
        startDate: e.startDate,
        endDate: e.endDate,
        isCurrent: e.isCurrent,
        responsibilities: e.responsibilities,
        achievements: e.achievements,
        technologies: e.technologies,
      })),
      projects: profile.projects?.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        role: p.role,
        outcomes: p.outcomes,
        technologies: p.technologies,
        link: p.link,
      })),
      educations: profile.educations?.map((ed) => ({
        id: ed.id,
        institution: ed.institution,
        degree: ed.degree,
        field: ed.field,
        details: ed.details,
        startDate: ed.startDate,
        endDate: ed.endDate,
      })),
      certifications: profile.certifications?.map((c) => ({
        id: c.id,
        name: c.name,
        issuer: c.issuer,
        date: c.date,
      })),
    };
  }

  async updatePersonal(personal: CandidatePersonal) {
    const profile = await this.getProfile();
    return this.prisma.client.orm.public.CandidateProfile.where({
      id: profile.id,
    }).update({ personal });
  }

  // Experience CRUD
  async addExperience(dto: CreateExperienceDto) {
    const profile = await this.getProfile();
    return this.prisma.client.orm.public.Experience.create({
      candidateProfileId: profile.id,
      company: dto.company,
      title: dto.title,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      isCurrent: dto.isCurrent ?? false,
      responsibilities: dto.responsibilities ?? [],
      technologies: dto.technologies ?? [],
      achievements: dto.achievements ?? [],
    });
  }

  async updateExperience(id: string, dto: Partial<CreateExperienceDto>) {
    const exp = await this.prisma.client.orm.public.Experience.where({
      id,
    }).first();
    if (!exp) throw new NotFoundException(`Experience with ID ${id} not found`);

    return this.prisma.client.orm.public.Experience.where({ id }).update({
      ...(dto.company !== undefined ? { company: dto.company } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.startDate !== undefined ? { startDate: dto.startDate } : {}),
      ...(dto.endDate !== undefined ? { endDate: dto.endDate } : {}),
      ...(dto.isCurrent !== undefined ? { isCurrent: dto.isCurrent } : {}),
      ...(dto.responsibilities !== undefined ? { responsibilities: dto.responsibilities } : {}),
      ...(dto.technologies !== undefined ? { technologies: dto.technologies } : {}),
      ...(dto.achievements !== undefined ? { achievements: dto.achievements } : {}),
    });
  }

  async deleteExperience(id: string) {
    const exp = await this.prisma.client.orm.public.Experience.where({
      id,
    }).first();
    if (!exp) throw new NotFoundException(`Experience with ID ${id} not found`);
    return this.prisma.client.orm.public.Experience.where({ id }).delete();
  }

  // Project CRUD
  async addProject(dto: CreateProjectDto) {
    const profile = await this.getProfile();
    return this.prisma.client.orm.public.Project.create({
      candidateProfileId: profile.id,
      name: dto.name,
      description: dto.description,
      technologies: dto.technologies ?? [],
      role: dto.role ?? null,
      outcomes: dto.outcomes ?? [],
      link: dto.link ?? null,
    });
  }

  async updateProject(id: string, dto: Partial<CreateProjectDto>) {
    const proj = await this.prisma.client.orm.public.Project.where({
      id,
    }).first();
    if (!proj) throw new NotFoundException(`Project with ID ${id} not found`);

    return this.prisma.client.orm.public.Project.where({ id }).update({
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.technologies !== undefined ? { technologies: dto.technologies } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.outcomes !== undefined ? { outcomes: dto.outcomes } : {}),
      ...(dto.link !== undefined ? { link: dto.link } : {}),
    });
  }

  async deleteProject(id: string) {
    const proj = await this.prisma.client.orm.public.Project.where({
      id,
    }).first();
    if (!proj) throw new NotFoundException(`Project with ID ${id} not found`);
    return this.prisma.client.orm.public.Project.where({ id }).delete();
  }

  // Skill CRUD
  async addSkill(dto: CreateSkillDto) {
    const profile = await this.getProfile();
    return this.prisma.client.orm.public.Skill.create({
      candidateProfileId: profile.id,
      name: dto.name,
      level: dto.level,
      evidence: dto.evidence ?? null,
    });
  }

  async updateSkill(id: string, dto: Partial<CreateSkillDto>) {
    const skill = await this.prisma.client.orm.public.Skill.where({
      id,
    }).first();
    if (!skill) throw new NotFoundException(`Skill with ID ${id} not found`);

    return this.prisma.client.orm.public.Skill.where({ id }).update({
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.level !== undefined ? { level: dto.level } : {}),
      ...(dto.evidence !== undefined ? { evidence: dto.evidence } : {}),
    });
  }

  async deleteSkill(id: string) {
    const skill = await this.prisma.client.orm.public.Skill.where({
      id,
    }).first();
    if (!skill) throw new NotFoundException(`Skill with ID ${id} not found`);
    return this.prisma.client.orm.public.Skill.where({ id }).delete();
  }

  // Education CRUD
  async addEducation(dto: CreateEducationDto) {
    const profile = await this.getProfile();
    return this.prisma.client.orm.public.Education.create({
      candidateProfileId: profile.id,
      institution: dto.institution,
      degree: dto.degree,
      field: dto.field ?? null,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      details: dto.details ?? null,
    });
  }

  async updateEducation(id: string, dto: Partial<CreateEducationDto>) {
    const edu = await this.prisma.client.orm.public.Education.where({
      id,
    }).first();
    if (!edu) throw new NotFoundException(`Education with ID ${id} not found`);

    return this.prisma.client.orm.public.Education.where({ id }).update({
      ...(dto.institution !== undefined ? { institution: dto.institution } : {}),
      ...(dto.degree !== undefined ? { degree: dto.degree } : {}),
      ...(dto.field !== undefined ? { field: dto.field } : {}),
      ...(dto.startDate !== undefined ? { startDate: dto.startDate } : {}),
      ...(dto.endDate !== undefined ? { endDate: dto.endDate } : {}),
      ...(dto.details !== undefined ? { details: dto.details } : {}),
    });
  }

  async deleteEducation(id: string) {
    const edu = await this.prisma.client.orm.public.Education.where({
      id,
    }).first();
    if (!edu) throw new NotFoundException(`Education with ID ${id} not found`);
    return this.prisma.client.orm.public.Education.where({ id }).delete();
  }

  // Certification CRUD
  async addCertification(dto: CreateCertificationDto) {
    const profile = await this.getProfile();
    return this.prisma.client.orm.public.Certification.create({
      candidateProfileId: profile.id,
      name: dto.name,
      issuer: dto.issuer ?? null,
      date: dto.date ?? null,
    });
  }

  async updateCertification(id: string, dto: Partial<CreateCertificationDto>) {
    const cert = await this.prisma.client.orm.public.Certification.where({
      id,
    }).first();
    if (!cert) throw new NotFoundException(`Certification with ID ${id} not found`);

    return this.prisma.client.orm.public.Certification.where({ id }).update({
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.issuer !== undefined ? { issuer: dto.issuer } : {}),
      ...(dto.date !== undefined ? { date: dto.date } : {}),
    });
  }

  async deleteCertification(id: string) {
    const cert = await this.prisma.client.orm.public.Certification.where({
      id,
    }).first();
    if (!cert) throw new NotFoundException(`Certification with ID ${id} not found`);
    return this.prisma.client.orm.public.Certification.where({ id }).delete();
  }
}
