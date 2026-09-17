'use client';

import { ArrowLeft, Check, Copy, Download, Play, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';

interface ResumeAuditHeaderProps {
  id: string;
  status?: string;
  downloadUrl?: string | null;
  resumeJson?: any;
  isFetching: boolean;
  isRegenerating: boolean;
  onRefresh: () => void;
  onRegenerate: () => void;
}

export const ResumeAuditHeader: React.FC<ResumeAuditHeaderProps> = ({
  id,
  status,
  downloadUrl,
  resumeJson,
  isFetching,
  isRegenerating,
  onRefresh,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    if (!resumeJson) return;
    navigator.clipboard.writeText(JSON.stringify(resumeJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValidated = status === 'VALIDATED';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/jobs/${id}`}
          className={buttonVariants({
            variant: 'outline',
            size: 'icon',
            className: 'border-border bg-card text-muted-foreground hover:text-foreground h-9 w-9',
          })}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Resume & Evidence Audit
            </h1>
            <Badge
              variant="outline"
              className={`text-xs font-mono font-bold px-2.5 py-0.5 uppercase ${
                isValidated
                  ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan'
                  : 'bg-brand-pink/10 border-brand-pink/30 text-brand-pink'
              }`}
            >
              {status || 'DRAFT'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Audited against confirmed candidate profile records with zero hallucinations.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              size: 'sm',
              className:
                'bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold shadow-sm gap-1.5',
            })}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .tex</span>
          </a>
        )}

        <Button
          size="sm"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="bg-card hover:bg-muted text-foreground border border-border gap-1.5"
        >
          {isRegenerating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-cyan" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching || isRegenerating}
          className="text-foreground border-border bg-card hover:bg-muted"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyJson}
          className="text-foreground border-border bg-card hover:bg-muted"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="text-brand-cyan">Copied JSON</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
