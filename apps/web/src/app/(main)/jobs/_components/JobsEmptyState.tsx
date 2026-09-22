'use client';

import { Briefcase, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function JobsEmptyState() {
  return (
    <Card className="border-border bg-card/60 p-12 text-center max-w-lg mx-auto backdrop-blur-md">
      <div className="p-0 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-pink/10 border border-brand-pink/30 flex items-center justify-center text-brand-pink mb-4">
          <Briefcase className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1.5">No Job Descriptions Yet</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-sm">
          Add a job description to analyze requirements, evaluate alignment, and generate tailored
          resumes.
        </p>
        <Link
          href="/jobs/new"
          className={buttonVariants({
            size: 'sm',
            className:
              'bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium shadow-sm shadow-brand-cyan/20 text-sm px-4 py-2',
          })}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Analyze Your First Job</span>
        </Link>
      </div>
    </Card>
  );
}
