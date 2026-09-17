'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ResumeViewerProps {
  resume: any;
}

export function ResumeViewer({ resume }: ResumeViewerProps) {
  return (
    <Card className="p-6 sm:p-8 border-border bg-card/80 backdrop-blur-md space-y-6 gap-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          {resume.personal?.name}
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
          {Object.entries(resume.personal?.contact || {}).map(([k, v]: [string, any]) => (
            <span key={k}>
              <span className="capitalize text-muted-foreground/80">{k}:</span> {v}
            </span>
          ))}
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Summary */}
      {resume.summary && (
        <div>
          <h3 className="text-xs font-semibold text-brand-pink dark:text-brand-cyan uppercase tracking-wider mb-2">
            Professional Summary
          </h3>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{resume.summary}</p>
        </div>
      )}

      {/* Verified Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-brand-pink dark:text-brand-cyan uppercase tracking-wider mb-2">
            Technical Skills
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {resume.skills.map((sk: string, i: number) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs font-mono px-2.5 py-1 bg-muted/70 border-border text-foreground hover:border-brand-pink/50 hover:text-brand-pink dark:hover:border-brand-cyan/40 dark:hover:text-foreground transition-colors"
              >
                {sk}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-brand-pink dark:text-brand-cyan uppercase tracking-wider mb-2">
            Work Experience
          </h3>
          {resume.experience.map((exp: any, i: number) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-semibold text-foreground">{exp.title}</h4>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-mono text-muted-foreground bg-muted/50 border-border px-2 py-0.5"
                >
                  {exp.sourceExperienceId?.slice(0, 8)}...
                </Badge>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-sm text-foreground/90 leading-relaxed">
                {exp.bullets?.map((b: string, bIdx: number) => (
                  <li key={bIdx}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-brand-pink dark:text-brand-cyan uppercase tracking-wider">
            Featured Projects
          </h3>
          {resume.projects.map((proj: any, i: number) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-start justify-between">
                <h4 className="text-base font-semibold text-foreground">{proj.name}</h4>
                <Badge
                  variant="outline"
                  className="text-xs font-mono text-muted-foreground bg-muted/50 border-border px-2 py-0.5"
                >
                  {proj.sourceProjectId?.slice(0, 8)}...
                </Badge>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-sm text-foreground/90 leading-relaxed">
                {proj.bullets?.map((b: string, bIdx: number) => (
                  <li key={bIdx}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-brand-cyan uppercase tracking-wider mb-2">
            Education
          </h3>
          {resume.education.map((edu: any, i: number) => (
            <div key={i} className="text-xs text-foreground/90">
              <span className="font-semibold text-foreground">{edu.degree}</span>
              {edu.institution && <span> — {edu.institution}</span>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
