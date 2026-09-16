'use client';

import { Check, ChevronDown, ChevronRight, Code2, Copy } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface JsonCardProps {
  title: string;
  data: unknown;
  subtitle?: string;
  defaultExpanded?: boolean;
  className?: string;
}

export const JsonCard: React.FC<JsonCardProps> = ({
  title,
  data,
  subtitle,
  defaultExpanded = true,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      className={`border-border bg-card/80 backdrop-blur-md rounded-xl overflow-hidden transition-all duration-200 gap-0 p-0 ${className}`}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border cursor-pointer hover:bg-muted/70 transition select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </Button>
          <Code2 className="w-4 h-4 text-brand-cyan shrink-0" />
          <div className="truncate">
            <h4 className="text-sm font-semibold text-foreground truncate">{title}</h4>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs text-muted-foreground border-border px-2 py-0.5 hidden sm:inline-flex"
          >
            {jsonString ? `${jsonString.split('\n').length} lines` : 'Empty'}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground border-border bg-muted/60 hover:bg-muted"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-cyan" />
                <span className="text-brand-cyan">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 overflow-x-auto max-h-130 scrollbar-thin scrollbar-thumb-border">
          <pre className="text-xs font-mono text-foreground/90 leading-relaxed">{jsonString}</pre>
        </div>
      )}
    </Card>
  );
};
