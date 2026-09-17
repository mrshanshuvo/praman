'use client';

import { FileText, RefreshCw, Sparkles } from 'lucide-react';
import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface JdIngestionFormProps {
  rawText: string;
  loading: boolean;
  onTextChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function JdIngestionForm({
  rawText,
  loading,
  onTextChange,
  onSubmit,
}: JdIngestionFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card className="border-border bg-card/80 p-5 backdrop-blur-md gap-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-cyan" />
            <span>Raw Job Description Text</span>
          </label>
          <Badge
            variant="outline"
            className="text-xs font-mono text-muted-foreground border-border px-2 py-0.5"
          >
            {rawText.length} characters
          </Badge>
        </div>

        <Textarea
          rows={14}
          required
          value={rawText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste the full job posting here (roles, responsibilities, requirements, preferred skills, etc.)..."
          className="w-full bg-muted/40 border-border rounded-xl p-4 text-sm text-foreground font-mono focus-visible:border-brand-cyan leading-relaxed min-h-64"
        />
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={loading || !rawText.trim()}
          className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold shadow-sm shadow-brand-cyan/20 text-sm px-5"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Requirements (Stage 1)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Analyze Job Description</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
