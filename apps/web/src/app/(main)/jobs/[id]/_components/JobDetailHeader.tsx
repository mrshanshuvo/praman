'use client';

import type { JobDescriptionRecord } from '@praman/schemas';
import { Building2, Pencil, Play, RefreshCw, Square } from 'lucide-react';
import React, { useState } from 'react';
import { EditJobMetaModal } from '@/components/EditJobMetaModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AiTelemetryInspector } from './AiTelemetryInspector';

interface JobDetailHeaderProps {
  id: string;
  jd?: JobDescriptionRecord | null;
  structured?: {
    jobTitle?: string | null;
    company?: string | null;
    seniority?: string | null;
    locationOrWorkMode?: string | null;
    yearsOfExperience?: string | null;
  } | null;
  telemetry?: {
    totalTokens?: number | null;
    costUsd?: number | null;
    durationMs?: number | null;
    aiModel?: string | null;
  } | null;
  isStreaming: boolean;
  onRunPipeline: () => void;
  onCancelStream?: () => void;
}

export const JobDetailHeader: React.FC<JobDetailHeaderProps> = ({
  id,
  jd,
  structured,
  telemetry,
  isStreaming,
  onRunPipeline,
  onCancelStream,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  return (
    <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-border bg-card/80 backdrop-blur-md">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge
            variant="outline"
            className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border-border"
          >
            JD #{id.slice(0, 8)}
          </Badge>
          <AiTelemetryInspector
            jobId={id}
            defaultTokens={telemetry?.totalTokens}
            defaultCost={telemetry?.costUsd}
            defaultDuration={telemetry?.durationMs}
            defaultModel={telemetry?.aiModel}
          />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight w-full sm:w-auto mt-1 sm:mt-0">
            {structured?.jobTitle || 'Target Job Role'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
          {structured?.company && (
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              {structured.company}
            </span>
          )}
          {structured?.seniority && <span>{structured.company ? '•' : ''} Level: {structured.seniority}</span>}
          {structured?.locationOrWorkMode && <span>• {structured.locationOrWorkMode}</span>}
          {structured?.yearsOfExperience && <span>• {structured.yearsOfExperience}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditOpen(true)}
          className="border-border hover:bg-muted text-foreground gap-1.5 cursor-pointer text-xs w-full sm:w-auto"
        >
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Edit Info</span>
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

      {jd && (
        <EditJobMetaModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          jd={jd}
        />
      )}
    </Card>
  );
};
