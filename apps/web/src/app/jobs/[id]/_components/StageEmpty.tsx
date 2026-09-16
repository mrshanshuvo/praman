'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface StageEmptyProps {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function StageEmpty({ message, ctaLabel, onCta }: StageEmptyProps) {
  return (
    <Card className="p-8 border-border bg-card/50 text-center items-center">
      <p className="text-xs text-muted-foreground mb-3">{message}</p>
      {ctaLabel && onCta && (
        <Button
          size="sm"
          onClick={onCta}
          className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium shadow-sm shadow-brand-cyan/20"
        >
          {ctaLabel}
        </Button>
      )}
    </Card>
  );
}
