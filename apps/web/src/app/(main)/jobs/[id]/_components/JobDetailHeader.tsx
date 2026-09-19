'use client';

import { Play, RefreshCw, Square } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface JobDetailHeaderProps {
  id: string;
  structured?: {
    jobTitle?: string | null;
    seniority?: string | null;
    locationOrWorkMode?: string | null;
    yearsOfExperience?: string | null;
  } | null;
  isFetching: boolean;
  isStreaming: boolean;
  onRefresh: () => void;
  onRunPipeline: () => void;
  onCancelStream?: () => void;
}

export const JobDetailHeader: React.FC<JobDetailHeaderProps> = ({
  id,
  structured,
  isFetching,
  isStreaming,
  onRefresh,
  onRunPipeline,
  onCancelStream,
}) => {
  return (
    <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-border bg-card/80 backdrop-blur-md">
      <div>
        <div className="flex items-center gap-2.5">
          <Badge
            variant="outline"
            className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border-border"
          >
            JD #{id.slice(0, 8)}
          </Badge>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {structured?.jobTitle || 'Target Job Role'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
          {structured?.seniority && <span>Level: {structured.seniority}</span>}
          {structured?.locationOrWorkMode && <span>• {structured.locationOrWorkMode}</span>}
          {structured?.yearsOfExperience && <span>• {structured.yearsOfExperience}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching || isStreaming}
          className="text-foreground border-border bg-card hover:bg-muted"
          title="Refresh job data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        {isStreaming ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              disabled
              className="bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 font-semibold shadow-xs flex-1 sm:flex-initial cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Streaming Pipeline...</span>
            </Button>
            {onCancelStream && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelStream}
                className="text-destructive border-destructive/40 hover:bg-destructive/10"
                title="Stop execution stream"
              >
                <Square className="w-3.5 h-3.5 fill-destructive" />
                <span className="sr-only sm:not-sr-only sm:inline text-xs">Stop</span>
              </Button>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            onClick={onRunPipeline}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold shadow-sm shadow-brand-cyan/20 w-full sm:w-auto"
          >
            <Play className="w-4 h-4 fill-brand-dark" />
            <span>Run Full Pipeline</span>
          </Button>
        )}
      </div>
    </Card>
  );
};
