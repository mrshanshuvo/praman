'use client';

import { Award, CheckCircle2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface PersonalTabProps {
  personal: any;
}

export function PersonalTab({ personal }: PersonalTabProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-border bg-card/80 p-6 gap-0">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-success" />
          Professional Summary
        </h3>
        <p className="text-sm text-foreground/90 leading-relaxed font-sans">
          {personal.summary || 'No summary registered.'}
        </p>
      </Card>

      {personal.achievements && personal.achievements.length > 0 && (
        <Card className="rounded-xl border-border bg-card/80 p-6 gap-0">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-pink" />
            Key Achievements & Recognition
          </h3>
          <ul className="space-y-2">
            {personal.achievements.map((ach: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90"
              >
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>{ach}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {personal.languages && (
        <Card className="rounded-xl border-border bg-card/80 p-6 gap-0">
          <h3 className="text-sm font-semibold text-foreground mb-3">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {personal.languages.map((lang: string, i: number) => (
              <Badge
                key={i}
                variant="outline"
                className="px-3 py-1 text-xs bg-muted border-border text-muted-foreground"
              >
                {lang}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
