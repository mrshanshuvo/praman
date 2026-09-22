'use client';

import type { StructuredJd } from '@praman/schemas';
import { JsonCard } from '@/components/JsonCard';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Stage1StructuredProps {
  structured?: StructuredJd;
}

export function Stage1Structured({ structured }: Stage1StructuredProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Stage 1: Structured Job Description
        </h3>
        <p className="text-xs text-muted-foreground">
          Extracted requirements and qualifications using JD Analyzer prompt v1.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border-border bg-card/60 gap-2">
          <h4 className="text-xs font-semibold text-brand-cyan mb-1">
            Required Skills ({structured?.requiredSkills?.length || 0})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {structured?.requiredSkills?.map((sk: string, i: number) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30"
              >
                {sk}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-4 border-border bg-card/60 gap-2">
          <h4 className="text-xs font-semibold text-brand-pink mb-1">
            Preferred Skills ({structured?.preferredSkills?.length || 0})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {structured?.preferredSkills?.map((sk: string, i: number) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-brand-pink/10 text-brand-pink border-brand-pink/30"
              >
                {sk}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <JsonCard
        title="Structured JD JSON"
        subtitle="Schema: StructuredJdSchema"
        data={structured}
      />
    </div>
  );
}
