import { Injectable, Logger } from '@nestjs/common';
import {
  type NumberFlag,
  type ResumeData,
  ResumeSchema,
  type SkillCheck,
  type SourceIdCheck,
  type ValidationReport,
} from '@praman/schemas';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  validateResume(resume: unknown, candidateProfile: any): ValidationReport {
    const violations: string[] = [];
    const sourceIdChecks: SourceIdCheck[] = [];
    const skillChecks: SkillCheck[] = [];
    const numberFlags: NumberFlag[] = [];

    // 1. Zod Schema Validation
    const parseResult = ResumeSchema.safeParse(resume);
    const schemaValid = parseResult.success;

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      violations.push(`Schema validation failed: ${errorMsg}`);
      this.logger.warn(`Resume schema validation failed: ${errorMsg}`);
    }

    const data: ResumeData = parseResult.success
      ? parseResult.data
      : (resume as ResumeData) || {
          personal: { name: '', contact: {} },
          summary: '',
          skills: [],
        };

    // Candidate records indexed for O(1) lookups
    const existingExpIds = new Set((candidateProfile?.experiences || []).map((e: any) => e.id));
    const expMap = new Map<string, any>(
      (candidateProfile?.experiences || []).map((e: any) => [e.id, e]),
    );

    const existingProjIds = new Set((candidateProfile?.projects || []).map((p: any) => p.id));
    const projMap = new Map<string, any>(
      (candidateProfile?.projects || []).map((p: any) => [p.id, p]),
    );

    const existingEduIds = new Set((candidateProfile?.educations || []).map((ed: any) => ed.id));
    const existingCertIds = new Set((candidateProfile?.certifications || []).map((c: any) => c.id));

    // Map candidate skills by lowercase name -> { level, name }
    const candidateSkillMap = new Map<string, { level: string; name: string }>();
    for (const sk of candidateProfile?.skills || []) {
      candidateSkillMap.set(sk.name.toLowerCase().trim(), {
        level: sk.level,
        name: sk.name,
      });
    }

    // 2. Source ID Traceability Checks
    // Experience IDs
    for (const exp of data.experience || []) {
      const exists = existingExpIds.has(exp.sourceExperienceId);
      sourceIdChecks.push({
        field: 'experience',
        sourceId: exp.sourceExperienceId,
        exists,
        details: exists ? `Mapped to ${expMap.get(exp.sourceExperienceId)?.company}` : undefined,
      });
      if (!exists) {
        violations.push(
          `Untraceable experience: sourceExperienceId "${exp.sourceExperienceId}" for "${exp.company}" does not exist in candidate profile`,
        );
      }

      // Check numbers in experience bullets against source bullets
      if (exists) {
        const sourceExp = expMap.get(exp.sourceExperienceId);
        const sourceText = [
          ...(sourceExp.responsibilities || []),
          ...(sourceExp.achievements || []),
        ].join(' ');

        for (const bullet of exp.bullets || []) {
          this.checkNumbersInBullet(bullet, sourceText, `Experience (${exp.company})`, numberFlags);
        }
      }
    }

    // Project IDs
    for (const proj of data.projects || []) {
      const exists = existingProjIds.has(proj.sourceProjectId);
      sourceIdChecks.push({
        field: 'project',
        sourceId: proj.sourceProjectId,
        exists,
        details: exists ? `Mapped to ${projMap.get(proj.sourceProjectId)?.name}` : undefined,
      });
      if (!exists) {
        violations.push(
          `Untraceable project: sourceProjectId "${proj.sourceProjectId}" for "${proj.name}" does not exist in candidate profile`,
        );
      }

      // Check numbers in project bullets against source outcomes
      if (exists) {
        const sourceProj = projMap.get(proj.sourceProjectId);
        const sourceText = [sourceProj.description || '', ...(sourceProj.outcomes || [])].join(' ');

        for (const bullet of proj.bullets || []) {
          this.checkNumbersInBullet(bullet, sourceText, `Project (${proj.name})`, numberFlags);
        }
      }
    }

    // Education IDs
    for (const edu of data.education || []) {
      const exists = existingEduIds.has(edu.sourceEducationId);
      sourceIdChecks.push({
        field: 'education',
        sourceId: edu.sourceEducationId,
        exists,
      });
      if (!exists) {
        violations.push(
          `Untraceable education: sourceEducationId "${edu.sourceEducationId}" does not exist in candidate profile`,
        );
      }
    }

    // Certification IDs
    for (const cert of data.certifications || []) {
      const exists = existingCertIds.has(cert.sourceCertificationId);
      sourceIdChecks.push({
        field: 'certification',
        sourceId: cert.sourceCertificationId,
        exists,
      });
      if (!exists) {
        violations.push(
          `Untraceable certification: sourceCertificationId "${cert.sourceCertificationId}" does not exist in candidate profile`,
        );
      }
    }

    // 2.5 Summary Ground Truth & Metric Checks (§0 P0 Fix)
    const candidateFullSourceText = this.buildCandidateFullSourceText(candidateProfile);

    if (data.summary) {
      // Check for unconfirmed metrics or numbers in summary
      this.checkNumbersInBullet(data.summary, candidateFullSourceText, 'Summary', numberFlags);

      // Check for unlearned skills claimed in summary
      for (const sk of candidateProfile?.skills || []) {
        if (sk.level === 'NOT_LEARNED') {
          const escaped = sk.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const skillRegex = new RegExp(`\\b${escaped}\\b`, 'i');
          if (skillRegex.test(data.summary)) {
            violations.push(
              `Forbidden skill claim in summary: candidate explicitly marked "${sk.name}" as NOT_LEARNED`,
            );
          }
        }
      }
    }

    // Check numbers in summaryClaims if present
    for (const claim of (data as any).summaryClaims || []) {
      this.checkNumbersInBullet(claim, candidateFullSourceText, 'Summary Claim', numberFlags);
    }

    // 3. Skill Truth-Preservation Checks
    for (const skill of data.skills || []) {
      const normalized = skill.toLowerCase().trim();
      const match = candidateSkillMap.get(normalized);

      if (!match) {
        // Skill not found in candidate profile at all
        violations.push(
          `Skill hallucination: "${skill}" is not registered in the candidate's confirmed profile`,
        );
        skillChecks.push({
          skill,
          existsInProfile: false,
          isAllowed: false,
          violation: 'Not in candidate profile',
        });
      } else if (match.level === 'NOT_LEARNED') {
        violations.push(
          `Forbidden skill claim: candidate explicitly marked "${match.name}" as NOT_LEARNED`,
        );
        skillChecks.push({
          skill,
          existsInProfile: true,
          candidateLevel: match.level,
          isAllowed: false,
          violation: 'Marked as NOT_LEARNED',
        });
      } else if (match.level === 'LEARNING') {
        violations.push(
          `Premature skill claim: "${match.name}" is only at LEARNING level and cannot be claimed as an established skill`,
        );
        skillChecks.push({
          skill,
          existsInProfile: true,
          candidateLevel: match.level,
          isAllowed: false,
          violation: 'Candidate is still LEARNING this skill',
        });
      } else {
        // EXPERIENCED or WORKING_KNOWLEDGE
        skillChecks.push({
          skill,
          existsInProfile: true,
          candidateLevel: match.level,
          isAllowed: true,
        });
      }
    }

    // 4. Determine Status
    const isRejected = violations.length > 0 || !schemaValid;
    const status = isRejected ? 'REJECTED' : 'VALIDATED';

    return {
      schemaValid,
      status,
      violations,
      sourceIdChecks,
      skillChecks,
      numberFlags,
      checkedAt: new Date().toISOString(),
    };
  }

  // Lightweight numeric check (§8: flag numbers not in source text for manual audit)
  private checkNumbersInBullet(
    bullet: string,
    sourceText: string,
    location: string,
    outFlags: NumberFlag[],
  ) {
    // Match numbers, percentages, rankings, currency, e.g. 50k, 12,000, 42%, $120k, 99.8%, #1
    const numberRegex =
      /(?:\$\s*\d+(?:,\d+)*(?:\.\d+)?(?:k|m|b)?|\b\d+(?:,\d+)*(?:\.\d+)?%|#\d+|\b\d+(?:,\d+)*(?:\.\d+)?(?:k|m|b)?\b)/gi;
    const bulletMatches = bullet.match(numberRegex) || [];

    // Extract all source numbers as normalized tokens to avoid false substring matches (e.g. "50" in "250000")
    const sourceNumbers = new Set<string>();
    const sourceMatches = sourceText.match(numberRegex) || [];
    for (const s of sourceMatches) {
      const cleanS = s.toLowerCase().replace(/[,]/g, '');
      sourceNumbers.add(cleanS);
      if (cleanS.endsWith('k')) {
        sourceNumbers.add(`${cleanS.slice(0, -1)}000`);
      } else if (cleanS.endsWith('000')) {
        sourceNumbers.add(`${cleanS.slice(0, -3)}k`);
      }
      if (cleanS.endsWith('m')) {
        sourceNumbers.add(`${cleanS.slice(0, -1)}000000`);
      } else if (cleanS.endsWith('000000')) {
        sourceNumbers.add(`${cleanS.slice(0, -6)}m`);
      }
    }

    const unconfirmedNumbers: string[] = [];
    for (const num of bulletMatches) {
      const cleanNum = num.toLowerCase().replace(/[,]/g, '');

      let matched = sourceNumbers.has(cleanNum);

      // Check shorthand expansion
      if (!matched && cleanNum.endsWith('k')) {
        matched = sourceNumbers.has(`${cleanNum.slice(0, -1)}000`);
      }
      if (!matched && cleanNum.endsWith('m')) {
        matched = sourceNumbers.has(`${cleanNum.slice(0, -1)}000000`);
      }

      if (!matched) {
        unconfirmedNumbers.push(num);
      }
    }

    if (unconfirmedNumbers.length > 0) {
      outFlags.push({
        location,
        bullet,
        flaggedNumbers: unconfirmedNumbers,
        reason:
          'Numbers not found verbatim in candidate source record; flagged for accuracy audit.',
      });
    }
  }

  buildCandidateFullSourceText(candidateProfile: any): string {
    return [
      candidateProfile?.personal?.summary || '',
      ...(candidateProfile?.experiences || []).flatMap((e: any) => [
        e.company || '',
        e.title || '',
        ...(e.responsibilities || []),
        ...(e.achievements || []),
      ]),
      ...(candidateProfile?.projects || []).flatMap((p: any) => [
        p.name || '',
        p.description || '',
        ...(p.outcomes || []),
      ]),
      ...(candidateProfile?.educations || []).flatMap((ed: any) => [
        ed.institution || '',
        ed.degree || '',
      ]),
      ...(candidateProfile?.certifications || []).map((c: any) => c.name || ''),
    ].join(' ');
  }

  validateFreeText(
    text: string,
    candidateProfile: any,
    contextLabel = 'Cover Letter',
  ): { numberFlags: NumberFlag[]; violations: string[] } {
    const numberFlags: NumberFlag[] = [];
    const violations: string[] = [];
    const candidateFullSourceText = this.buildCandidateFullSourceText(candidateProfile);

    // 1. Metric & number checks
    this.checkNumbersInBullet(text, candidateFullSourceText, contextLabel, numberFlags);

    // 2. Unlearned skill checks
    for (const sk of candidateProfile?.skills || []) {
      if (sk.level === 'NOT_LEARNED') {
        const escaped = sk.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const skillRegex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (skillRegex.test(text)) {
          violations.push(
            `Forbidden skill claim in ${contextLabel.toLowerCase()}: candidate explicitly marked "${sk.name}" as NOT_LEARNED`,
          );
        }
      }
    }

    return { numberFlags, violations };
  }
}
