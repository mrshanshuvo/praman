'use client';

import { Briefcase, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useJobIngestionModal } from '@/providers/JobIngestionModalProvider';

export function JobsEmptyState() {
  const { openJobIngestionModal } = useJobIngestionModal();

  return (
    <Card className="border-border bg-card/60 p-10 sm:p-12 text-center max-w-md w-full mx-auto backdrop-blur-md shadow-xl rounded-2xl border">
      <div className="p-0 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-5 shadow-inner">
          <Briefcase className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
          No Job Descriptions Yet
        </h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-sm">
          Add a job description to analyze requirements, evaluate alignment, and generate tailored
          resumes.
        </p>
        <Button
          size="default"
          onClick={() => openJobIngestionModal()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/20 text-sm px-5 py-2.5 rounded-xl gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Analyze Your First Job</span>
        </Button>
      </div>
    </Card>
  );
}
