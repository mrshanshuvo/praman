'use client';

import { CheckCircle2, ClipboardPaste, FileText, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
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
  const formRef = useRef<HTMLFormElement>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
  const isReady = rawText.trim().length >= 10;

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onTextChange(text);
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
      }
    } catch {
      // Clipboard API might be restricted by browser permission
    }
  };

  const handleClear = () => {
    onTextChange('');
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="w-full space-y-4">
      <Card className="border-border bg-card/70 p-5 sm:p-6 backdrop-blur-md shadow-xl rounded-2xl border">
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <label htmlFor="jd-textarea" className="text-sm font-semibold text-foreground block">
                Job Description Content
              </label>
              <span className="text-2xs text-muted-foreground">
                Paste raw text from LinkedIn, Greenhouse, Lever, or career pages
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePasteFromClipboard}
              className="h-8 px-2.5 text-xs border-border bg-card hover:bg-muted text-foreground cursor-pointer gap-1.5"
              title="Paste from clipboard"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-primary" />
              <span>{pasteSuccess ? 'Pasted!' : 'Paste Clipboard'}</span>
            </Button>

            {rawText.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={loading}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer gap-1"
                title="Clear content"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <Textarea
          id="jd-textarea"
          rows={16}
          required
          value={rawText}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isReady && !loading) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          placeholder="Paste the target job description here...&#10;&#10;Tip: Include role summary, responsibilities, required technical skills, qualifications, and company details for optimal analysis results."
          className="w-full bg-background/50 border-border/80 rounded-xl p-4 text-xs sm:text-sm text-foreground font-mono focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary leading-relaxed min-h-85 resize-y"
        />

        {/* Editor Footer / Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-border/60 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="font-mono">
              <strong className="text-foreground">{rawText.length}</strong> chars
            </span>
            <span className="text-border">•</span>
            <span className="font-mono">
              <strong className="text-foreground">{wordCount}</strong> words
            </span>
            <span className="text-border">•</span>
            {isReady ? (
              <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready</span>
              </span>
            ) : (
              <span className="text-muted-foreground/70">Min 10 characters required</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="default"
              disabled={loading || !isReady}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 text-xs sm:text-sm px-5 py-2 rounded-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Schema (Stage 1)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Job Description</span>
                  <kbd className="hidden md:inline-flex items-center text-2xs bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded font-mono font-normal">
                    ⌘↵
                  </kbd>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
