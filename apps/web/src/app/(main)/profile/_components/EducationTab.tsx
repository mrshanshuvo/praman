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
