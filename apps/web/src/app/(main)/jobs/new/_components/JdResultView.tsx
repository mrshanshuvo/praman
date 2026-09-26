'use client';

import type { JobDescriptionRecord } from '@praman/schemas';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { JsonCard } from '@/components/JsonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface JdResultViewProps {
  createdJd: JobDescriptionRecord;
  onLaunchPipeline: () => void;
}

export function JdResultView({ createdJd, onLaunchPipeline }: JdResultViewProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-primary">
              Stage 1 Complete: Job Description Extracted & Saved
            </h3>
            <p className="text-sm text-muted-foreground">
              ID: <span className="font-mono text-foreground">{createdJd.id}</span>
            </p>
          </div>
        </div>

        <Button
          onClick={onLaunchPipeline}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm shadow-primary/20"
        >
          <span>Inspect & Run Pipeline</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border bg-card/80 p-4 gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Mandatory Required Skills ({createdJd.structured?.requiredSkills?.length || 0})
          </h4>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {createdJd.structured?.requiredSkills?.map((s: string, i: number) => (
              <Badge
                key={i}
                variant="outline"
                className="px-2.5 py-1 text-xs bg-primary/10 border-primary/30 text-primary font-mono"
              >
                {s}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card/80 p-4 gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Preferred / Bonus Skills ({createdJd.structured?.preferredSkills?.length || 0})
          </h4>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {createdJd.structured?.preferredSkills?.map((s: string, i: number) => (
              <Badge
                key={i}
                variant="outline"
                className="px-2.5 py-1 text-xs bg-muted border-border text-foreground font-mono"
              >
                {s}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <JsonCard
        title="Stage 1 Output: StructuredJd JSON"
        subtitle="Validated against StructuredJdSchema"
        data={createdJd.structured}
      />
    </div>
  );
}
