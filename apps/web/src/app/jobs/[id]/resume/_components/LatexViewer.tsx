'use client';

import { Check, Copy, Download, ExternalLink, FileCode } from 'lucide-react';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';


interface LatexViewerProps {
  latex: string;
  downloadUrl?: string | null;
  candidateName?: string;
}

export function LatexViewer({ latex, downloadUrl, candidateName = 'resume' }: LatexViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Use presigned direct download from Cloudflare R2
      window.open(downloadUrl, '_blank');
      return;
    }

    // Client-side fallback download
    const blob = new Blob([latex], { type: 'application/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.href = url;
    link.download = `${safeName}_resume.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-0 border-border bg-card/90 overflow-hidden shadow-lg">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-brand-cyan" />
          <span className="text-xs font-mono font-semibold text-foreground">
            resume.tex (Cloudflare R2 Ready)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 text-xs font-medium border-border bg-background hover:bg-muted"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-cyan" />
                <span className="text-brand-cyan">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleDownload}
            className="h-8 text-xs font-semibold bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .tex</span>
          </Button>

          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'h-8 text-xs font-medium border-border bg-background hover:bg-muted gap-1.5',
              })}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>R2 Link</span>
            </a>
          )}

        </div>
      </div>

      {/* Syntax/Code Box */}
      <div className="p-6 bg-slate-950/90 text-slate-100 font-mono text-xs overflow-x-auto max-h-[600px] leading-relaxed select-text">
        <pre className="font-mono">
          <code>{latex}</code>
        </pre>
      </div>
    </Card>
  );
}
