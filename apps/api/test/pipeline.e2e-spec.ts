import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Pipeline E2E Integration Test', () => {
  let app: INestApplication;
  let httpServer: any;
  let candidateProfile: any;
  let jobDescriptionId: string;

  beforeAll(async () => {
    // Ensure deterministic offline AI engine for tests
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('Step 1: GET /candidate-profile retrieves seeded candidate records', async () => {
    const res = await request(httpServer).get('/candidate-profile').expect(200);

    candidateProfile = res.body;
    expect(candidateProfile).toBeDefined();
    expect(candidateProfile.personal?.name).toBeDefined();
    expect(Array.isArray(candidateProfile.experiences)).toBe(true);
    expect(candidateProfile.experiences.length).toBeGreaterThan(0);
    expect(Array.isArray(candidateProfile.skills)).toBe(true);
  });

  it('Step 2: POST /job-descriptions creates and parses a structured JD', async () => {
    const jdText = `
Senior Full Stack Engineer
Location: Remote
Experience: 3+ years
We need a Senior Full Stack Engineer proficient in TypeScript, Next.js, Node.js, and PostgreSQL.
Must have: Production Next.js experience, RESTful APIs, and database performance tuning.
Nice to have: Docker, Prisma ORM.
    `.trim();

    const res = await request(httpServer)
      .post('/job-descriptions')
      .send({ rawText: jdText })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('structured');
    expect(res.body.structured.jobTitle).toBeDefined();
    expect(Array.isArray(res.body.structured.requiredSkills)).toBe(true);

    jobDescriptionId = res.body.id;
  });

  it('Step 3: POST /job-descriptions/:id/match runs Stage 2 Match Analysis', async () => {
    const res = await request(httpServer)
      .post(`/job-descriptions/${jobDescriptionId}/match`)
      .expect(201);

    expect(res.body).toHaveProperty('result');
    const match = res.body.result;
    expect(Array.isArray(match.strongMatches)).toBe(true);
    expect(Array.isArray(match.doNotClaim)).toBe(true);
    expect(typeof match.explanation).toBe('string');
  });

  it('Step 4: POST /job-descriptions/:id/strategy runs Stage 3 Strategy formulation', async () => {
    const res = await request(httpServer)
      .post(`/job-descriptions/${jobDescriptionId}/strategy`)
      .expect(201);

    expect(res.body).toHaveProperty('result');
    const strategy = res.body.result;
    expect(Array.isArray(strategy.emphasizedExperienceIds)).toBe(true);
    expect(Array.isArray(strategy.forbiddenClaims)).toBe(true);
    expect(typeof strategy.narrativeGuidance).toBe('string');
  });

  it(
    'Step 5: POST /job-descriptions/:id/resume runs Stage 4 Generation + Evidence Validation',
    async () => {
      const res = await request(httpServer)
        .post(`/job-descriptions/${jobDescriptionId}/resume`)
        .expect(201);

      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('resumeJson');
      expect(res.body).toHaveProperty('validationReport');

      const { status, resumeJson, validationReport } = res.body;

      // Must be VALIDATED
      expect(status).toBe('VALIDATED');
      expect(validationReport.status).toBe('VALIDATED');
      expect(validationReport.schemaValid).toBe(true);
      expect(validationReport.violations).toHaveLength(0);

      // Absolute Traceability Verification against real Candidate Profile
      const realExpIds = new Set(candidateProfile.experiences.map((e: any) => e.id));
      const realProjIds = new Set(candidateProfile.projects.map((p: any) => p.id));
      const realEduIds = new Set(candidateProfile.educations.map((e: any) => e.id));
      const realCertIds = new Set(candidateProfile.certifications.map((c: any) => c.id));

      for (const exp of resumeJson.experience || []) {
        expect(realExpIds.has(exp.sourceExperienceId)).toBe(true);
      }
      for (const proj of resumeJson.projects || []) {
        expect(realProjIds.has(proj.sourceProjectId)).toBe(true);
      }
      for (const edu of resumeJson.education || []) {
        expect(realEduIds.has(edu.sourceEducationId)).toBe(true);
      }
      for (const cert of resumeJson.certifications || []) {
        expect(realCertIds.has(cert.sourceCertificationId)).toBe(true);
      }

      // Skills verification: No disallowed skills
      const candidateSkillMap = new Map(
        (candidateProfile.skills || []).map((s: any) => [s.name.toLowerCase(), s.level]),
      );
      for (const skill of resumeJson.skills || []) {
        const level = candidateSkillMap.get(skill.toLowerCase());
        expect(['EXPERIENCED', 'WORKING_KNOWLEDGE']).toContain(level);
      }
    },
    15000,
  );

  it('Step 6: GET /job-descriptions/:id/resume retrieves the latest validated resume', async () => {
    const res = await request(httpServer)
      .get(`/job-descriptions/${jobDescriptionId}/resume`)
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.status).toBe('VALIDATED');
    expect(res.body.resumeJson).toBeDefined();
  });

  it(
    'Step 7: POST /job-descriptions/:id/run-pipeline executes orchestrated pipeline in one call',
    async () => {
      const res = await request(httpServer)
        .post(`/job-descriptions/${jobDescriptionId}/run-pipeline`)
        .expect(201);

      expect(res.body).toHaveProperty('jobDescriptionId', jobDescriptionId);
      expect(res.body).toHaveProperty('match');
      expect(res.body).toHaveProperty('strategy');
      expect(res.body).toHaveProperty('resume');
      expect(res.body.resume.status).toBe('VALIDATED');
    },
    15000,
  );

  it('Step 8: POST /pipelines/:id executes via new dedicated PipelineController', async () => {
    const res = await request(httpServer)
      .post(`/pipelines/${jobDescriptionId}`)
      .expect(201);

    expect(res.body).toHaveProperty('jobDescriptionId', jobDescriptionId);
    expect(res.body).toHaveProperty('match');
    expect(res.body).toHaveProperty('strategy');
    expect(res.body).toHaveProperty('resume');
  }, 15000);
});
