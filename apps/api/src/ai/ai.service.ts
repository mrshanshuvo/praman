import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { z } from 'zod';
import type { EnvConfig } from '../config/env.validation.js';

export interface StructuredCallParams<T> {
  systemPrompt: string;
  userPrompt: string;
  outputSchema: z.ZodType<T, any, any>;
  schemaName?: string;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly models: string[];
  private activeModelIndex = 0;

  constructor(@Optional() private readonly configService?: ConfigService<EnvConfig, true>) {
    this.apiKey =
      this.configService?.get('OPENAI_API_KEY', { infer: true }) ||
      this.configService?.get('AI_API_KEY', { infer: true }) ||
      process.env.OPENAI_API_KEY ||
      process.env.AI_API_KEY;

    const rawBaseUrl =
      this.configService?.get('OPENAI_BASE_URL', { infer: true }) ||
      process.env.OPENAI_BASE_URL ||
      'https://api.openai.com/v1';
    this.baseUrl = rawBaseUrl.replace(/\/+$/, '');

    this.models = this.resolveModels();
  }

  get currentModel(): string {
    return this.models[this.activeModelIndex] || 'groq/compound-mini';
  }

  get configuredModels(): string[] {
    return [...this.models];
  }

  private resolveModels(): string[] {
    const rawList =
      this.configService?.get('AI_MODELS', { infer: true }) || process.env.AI_MODELS;
    if (rawList?.trim()) {
      const parsed = rawList
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    const single =
      this.configService?.get('AI_MODEL', { infer: true }) || process.env.AI_MODEL;
    if (single?.trim()) {
      return [single.trim()];
    }
    return ['groq/compound-mini', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];
  }


  async runStructuredCall<T>(params: StructuredCallParams<T>): Promise<T> {
    const { schemaName = 'output' } = params;

    // If an API key is provided, use the OpenAI-compatible endpoint
    if (this.apiKey) {
      this.logger.log(
        `Running structured call [${schemaName}] using model: ${this.currentModel} (cascade: ${this.models.join(' -> ')})`,
      );
      return this.callLlmWithRetry(params, 2);
    }

    // Deterministic offline pipeline engine (when API key is not yet set in .env)
    this.logger.warn(
      `No OPENAI_API_KEY detected in environment. Using deterministic rule-based engine for [${schemaName}].`,
    );
    return this.fallbackDeterministicEngine(params);
  }

  private async callLlmWithRetry<T>(
    params: StructuredCallParams<T>,
    remainingRetries: number,
    previousError?: string,
  ): Promise<T> {
    const {
      systemPrompt,
      userPrompt,
      outputSchema,
      schemaName,
      temperature = 0.1,
      maxTokens = 3000,
    } = params;

    let promptToSend = userPrompt;
    if (previousError) {
      promptToSend += `\n\nCRITICAL FIX REQUIRED: Your previous response failed schema validation with errors:\n${previousError}\nYou MUST correct this and return strict valid JSON matching the exact schema.`;
    }

    const currentAttemptModel = this.currentModel;

    const payload: Record<string, any> = {
      model: currentAttemptModel,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptToSend },
      ],
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();

      // If rate limited (429), distinguish TPD (daily limit) vs TPM (per-minute)
      if (response.status === 429) {
        let waitMs = 5000;
        try {
          const minSecMatch = errText.match(/try again in (?:(\d+)m)?([\d.]+)s/i);
          if (minSecMatch) {
            const minutes = minSecMatch[1] ? parseFloat(minSecMatch[1]) : 0;
            const seconds = minSecMatch[2] ? parseFloat(minSecMatch[2]) : 0;
            waitMs = Math.ceil((minutes * 60 + seconds) * 1000) + 1000;
          }
        } catch {
          // fallback default
        }

        const isTpd = /TPD|tokens per day|requests per day/i.test(errText) || waitMs > 60000;

        // If daily limit (TPD) is reached, immediately cascade to next model
        if (isTpd) {
          if (this.activeModelIndex + 1 < this.models.length) {
            const previousModel = this.currentModel;
            this.activeModelIndex++;
            const nextModel = this.currentModel;
            this.logger.warn(
              `[Cascade] Daily quota (TPD) reached for [${previousModel}]. Auto-switching to fallback model [${nextModel}].`,
            );
            return this.callLlmWithRetry(params, 2);
          }
          this.logger.error(
            `[Cascade] All models in cascade exhausted their daily limit: ${this.models.join(', ')}`,
          );
        }

        // TPM limit (short wait): auto-wait and retry on same model
        if (remainingRetries > 0) {
          const sleepMs = Math.min(waitMs, 30000);
          this.logger.warn(
            `Rate limit (429 TPM) hit on [${schemaName}] using [${currentAttemptModel}]. Auto-waiting ${sleepMs}ms before retry...`,
          );
          await new Promise((resolve) => setTimeout(resolve, sleepMs));
          return this.callLlmWithRetry(params, remainingRetries - 1);
        }

        // Retries exhausted for this model on rate limits: cascade to next model if available
        if (this.activeModelIndex + 1 < this.models.length) {
          const previousModel = this.currentModel;
          this.activeModelIndex++;
          const nextModel = this.currentModel;
          this.logger.warn(
            `[Cascade] Retries exhausted for [${previousModel}] on rate limit. Switching to [${nextModel}].`,
          );
          return this.callLlmWithRetry(params, 2);
        }
      }

      this.logger.error(`LLM call failed (${response.status}): ${errText}`);
      throw new Error(`LLM call failed with status ${response.status}: ${errText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('LLM returned an empty content message');
    }

    try {
      const parsedJson = JSON.parse(content);
      const schemaCheck = outputSchema.safeParse(parsedJson);

      if (schemaCheck.success) {
        return schemaCheck.data;
      }

      const errors = schemaCheck.error.errors
        .map((e: any) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');

      if (remainingRetries > 0) {
        this.logger.warn(
          `Schema validation failed for [${schemaName}] using [${currentAttemptModel}], retrying with error feedback: ${errors}`,
        );
        return this.callLlmWithRetry(params, remainingRetries - 1, errors);
      }

      // If schema validation retries are exhausted on this model, cascade to next model
      if (this.activeModelIndex + 1 < this.models.length) {
        const previousModel = this.currentModel;
        this.activeModelIndex++;
        const nextModel = this.currentModel;
        this.logger.warn(
          `[Cascade] Schema validation failed repeatedly on [${previousModel}] for [${schemaName}]. Switching to fallback model [${nextModel}].`,
        );
        return this.callLlmWithRetry(params, 2);
      }

      throw new Error(`LLM output failed schema validation: ${errors}`);
    } catch (e: any) {
      if (remainingRetries > 0 && !e.message?.includes('schema validation')) {
        return this.callLlmWithRetry(params, remainingRetries - 1, e.message);
      }
      throw e;
    }
  }

  /**
   * Deterministic engine for testing the entire 4-stage pipeline offline.
   * Extracts real keywords from the JD and maps them strictly to candidate profile records.
   */
  private fallbackDeterministicEngine<T>(params: StructuredCallParams<T>): T {
    const { schemaName, userPrompt } = params;

    let parsedUserPrompt: any = {};
    try {
      parsedUserPrompt = JSON.parse(userPrompt);
    } catch {
      parsedUserPrompt = { rawText: userPrompt };
    }

    if (schemaName === 'StructuredJd') {
      const raw =
        typeof parsedUserPrompt === 'string' ? parsedUserPrompt : parsedUserPrompt.rawText || '';
      const text = raw.toLowerCase();

      const extractedSkills: string[] = [];
      const commonTech = [
        'Next.js',
        'React.js',
        'React',
        'TypeScript',
        'JavaScript',
        'Node.js',
        'NestJS',
        'PostgreSQL',
        'MongoDB',
        'Prisma',
        'Tailwind CSS',
        'Docker',
        'REST APIs',
        'GraphQL',
        'AWS',
        'Redis',
        'Kafka',
        'Python',
        'Kubernetes',
        'Solidity',
      ];
      for (const tech of commonTech) {
        if (text.includes(tech.toLowerCase())) {
          // Normalize React to React.js if needed or keep both
          if (!extractedSkills.includes(tech)) {
            extractedSkills.push(tech);
          }
        }
      }

      const lines = raw
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);
      const title = lines[0]?.slice(0, 60) || 'Full-Stack Software Engineer';

      const mockJd = {
        jobTitle: title,
        seniority: text.includes('senior')
          ? 'Senior'
          : text.includes('junior')
            ? 'Junior'
            : 'Mid-Level',
        requiredSkills:
          extractedSkills.length > 0
            ? extractedSkills.slice(0, 6)
            : ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL'],
        preferredSkills: extractedSkills.slice(6),
        yearsOfExperience: text.includes('3+') ? '3+ years' : '2+ years',
        responsibilities: [
          'Develop and maintain production web applications with high reliability and performance.',
          'Architect robust backend services, secure RESTful APIs, and database schemas.',
          'Collaborate with product and design teams to build responsive user experiences.',
        ],
        educationRequirements: ['B.Sc. in Computer Science or equivalent practical experience'],
        locationOrWorkMode: text.includes('remote') ? 'Remote' : 'Hybrid / On-site',
        salary: 'Competitive industry benchmark',
        mustHave: extractedSkills.slice(0, 4),
        niceToHave: extractedSkills.slice(4, 7),
        otherNotes: ['Emphasis on code quality, testing, and truthful engineering capability'],
      };
      return params.outputSchema.parse(mockJd);
    }

    if (schemaName === 'MatchAnalysis') {
      const profile = parsedUserPrompt.candidateProfile || {};
      const structuredJd = parsedUserPrompt.structuredJd || {};

      const candidateSkills: any[] = profile.skills || [];
      const expList: any[] = profile.experiences || [];
      const projList: any[] = profile.projects || [];

      const strongMatches: string[] = [];
      const missingSkills: string[] = [];
      const doNotClaim: string[] = [];

      const candidateSkillMap = new Map(candidateSkills.map((s) => [s.name.toLowerCase(), s]));

      for (const reqSkill of [
        ...(structuredJd.requiredSkills || []),
        ...(structuredJd.preferredSkills || []),
      ]) {
        const found = candidateSkillMap.get(reqSkill.toLowerCase());
        if (found && (found.level === 'EXPERIENCED' || found.level === 'WORKING_KNOWLEDGE')) {
          strongMatches.push(found.name);
        } else if (found && (found.level === 'LEARNING' || found.level === 'NOT_LEARNED')) {
          doNotClaim.push(`${found.name} (Candidate level is ${found.level})`);
          missingSkills.push(reqSkill);
        } else {
          missingSkills.push(reqSkill);
          doNotClaim.push(`${reqSkill} (Not found in profile)`);
        }
      }

      const match = {
        strongMatches: Array.from(new Set(strongMatches)),
        partialMatches: ['Modern Web Architecture', 'RESTful API Design'],
        missingSkills: Array.from(new Set(missingSkills)),
        experienceGaps: [],
        educationGaps: [],
        relevantExperience: expList.map((e) => e.id),
        relevantProjects: projList.map((p) => p.id),
        emphasize: [
          'Production Next.js and TypeScript experience',
          'Full-stack REST API development with NestJS and PostgreSQL',
          'Database optimization and authentication workflows',
        ],
        doNotClaim: Array.from(new Set(doNotClaim)),
        explanation: `Candidate demonstrates strong, verified alignment across core stack (${strongMatches.slice(0, 4).join(', ')}). All recommended bullets strictly reference confirmed experiences and projects.`,
      };
      return params.outputSchema.parse(match);
    }

    if (schemaName === 'ResumeStrategy') {
      const match = parsedUserPrompt.matchAnalysis || {};

      const strategy = {
        emphasizedExperienceIds: match.relevantExperience || [],
        emphasizedProjectIds: match.relevantProjects || [],
        prioritizedSkills: match.strongMatches || ['TypeScript', 'Next.js', 'NestJS', 'PostgreSQL'],
        gaps: match.missingSkills || [],
        forbiddenClaims: match.doNotClaim || [],
        narrativeGuidance:
          'Emphasize end-to-end full-stack capabilities, clean architecture, and verified production delivery. Keep all metrics and responsibilities strictly faithful to confirmed records.',
      };
      return params.outputSchema.parse(strategy);
    }

    if (schemaName === 'Resume') {
      const profile = parsedUserPrompt.candidateProfile || {};

      const expList: any[] = profile.experiences || [];
      const projList: any[] = profile.projects || [];
      const eduList: any[] = profile.educations || [];
      const certList: any[] = profile.certifications || [];

      // Skills: ONLY candidate skills that are EXPERIENCED or WORKING_KNOWLEDGE, curated by prioritizedSkills if provided
      const candidateAllowedSkills = (profile.skills || [])
        .filter((s: any) => s.level === 'EXPERIENCED' || s.level === 'WORKING_KNOWLEDGE')
        .map((s: any) => s.name);

      let finalSkills = candidateAllowedSkills;
      const prioritized = parsedUserPrompt.resumeStrategy?.prioritizedSkills;
      if (Array.isArray(prioritized) && prioritized.length > 0) {
        const prioritizedSet = new Set(prioritized.map((s: string) => s.toLowerCase()));
        finalSkills = candidateAllowedSkills.filter((s: string) =>
          prioritizedSet.has(s.toLowerCase()),
        );
      }

      const resumeData = {
        personal: {
          name: profile.personal?.name || 'Shahid Hasan Shovu',
          contact: profile.personal?.contact || {},
        },
        summary:
          profile.personal?.summary ||
          'Full-Stack Developer specializing in Next.js, TypeScript, Node.js, and NestJS, with proven experience delivering production-ready web applications and secure RESTful APIs.',
        summaryClaims: [],
        experience: expList.map((exp) => ({
          sourceExperienceId: exp.id,
          company: exp.company,
          title: exp.title,
          bullets:
            exp.responsibilities && exp.responsibilities.length > 0
              ? exp.responsibilities
              : [`Developed production features at ${exp.company}`],
        })),
        projects: projList.map((proj) => ({
          sourceProjectId: proj.id,
          name: proj.name,
          bullets:
            proj.outcomes && proj.outcomes.length > 0
              ? proj.outcomes
              : [proj.description || `Built ${proj.name} using modern technologies`],
        })),
        skills: finalSkills.slice(0, 16),
        education: eduList.map((edu) => ({
          sourceEducationId: edu.id,
          institution: edu.institution,
          degree: edu.degree,
        })),
        certifications: certList.map((cert) => ({
          sourceCertificationId: cert.id,
          name: cert.name,
        })),
      };

      return params.outputSchema.parse(resumeData);
    }

    throw new Error(`Unknown schema name for fallback engine: ${schemaName}`);
  }
}
