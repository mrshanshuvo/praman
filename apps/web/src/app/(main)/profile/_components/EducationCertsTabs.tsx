'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface EducationTabProps {
  educations: any[];
}

export function EducationTab({ educations }: EducationTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">Academic Education</h3>
      {educations.map((edu: any) => (
        <Card
          key={edu.id}
          className="p-5 border-border bg-card hover:border-brand-pink/50 dark:hover:border-brand-cyan/40 transition space-y-2 gap-0"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-semibold text-foreground">{edu.institution}</h4>
              <p className="text-xs text-brand-pink dark:text-brand-cyan font-medium">
                {edu.degree} in {edu.field}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs font-mono text-muted-foreground bg-muted/60 border-border"
            >
              {edu.startDate} — {edu.endDate}
            </Badge>
          </div>
          {edu.details && <p className="text-xs text-muted-foreground">{edu.details}</p>}
        </Card>
      ))}
    </div>
  );
}

interface CertificationsTabProps {
  certifications: any[];
}

export function CertificationsTab({ certifications }: CertificationsTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">Training & Certifications</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certifications.map((cert: any) => (
          <Card
            key={cert.id}
            className="p-4 border-border bg-card hover:border-brand-pink/50 dark:hover:border-brand-cyan/40 transition flex flex-row items-start justify-between gap-3"
          >
            <div>
              <h4 className="text-sm font-semibold text-foreground">{cert.name}</h4>
              {cert.issuer && (
                <p className="text-xs text-brand-pink dark:text-brand-cyan mt-0.5">
                  Issuer: {cert.issuer}
                </p>
              )}
            </div>
            {cert.date && (
              <Badge
                variant="outline"
                className="text-xs font-mono text-muted-foreground bg-muted/60 border-border shrink-0"
              >
                {cert.date}
              </Badge>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
