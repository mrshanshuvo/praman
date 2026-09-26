import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StageEmptyProps {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  isRunning?: boolean;
  loadingMessage?: string;
}

export function StageEmpty({
  message,
  ctaLabel,
  onCta,
  isRunning = false,
  loadingMessage = 'Processing stage...',
}: StageEmptyProps) {
  if (isRunning) {
    return (
      <Card className="p-8 border-border/80 bg-card/60 flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-brand-cyan/20 animate-ping absolute" />
          <div className="w-12 h-12 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-brand-cyan animate-spin" />
          </div>
        </div>
        <div className="space-y-1.5 max-w-md">
          <h4 className="text-sm font-medium text-foreground tracking-tight">{loadingMessage}</h4>
          <p className="text-xs text-muted-foreground">
            This may take a few moments. Streaming live logs in the terminal above.
          </p>
        </div>
        <div className="w-full max-w-sm space-y-2 pt-2">
          <Skeleton className="h-3 w-full rounded bg-muted/60" />
          <Skeleton className="h-3 w-4/5 mx-auto rounded bg-muted/40" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 border-border bg-card/50 text-center items-center">
      <p className="text-xs text-muted-foreground mb-3">{message}</p>
      {ctaLabel && onCta && (
        <Button
          size="sm"
          onClick={onCta}
          className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium shadow-sm shadow-brand-cyan/20 cursor-pointer"
        >
          {ctaLabel}
        </Button>
      )}
    </Card>
  );
}

