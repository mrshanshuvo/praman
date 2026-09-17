'use client';

import {
  Check,
  Code2,
  Columns2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  Palette,
  RotateCcw,
  Save,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUpdateResumeLatex } from '@/hooks/usePramanApi';
import { DocumentPreviewSheet } from './DocumentPreviewSheet';

export const TEMPLATES = [
  {
    id: 'modern-developer',
    name: 'Modern Developer',
    badge: 'Tech & Engineering',
    color: 'text-brand-cyan border-brand-cyan/30 bg-brand-cyan/10',
    description: 'Clean Helvetica sans-serif, primary blue accents (#004F90), itemized highlights.',
  },
  {
    id: 'classic-academic',
    name: 'Classic Academic',
    badge: 'Formal & Research',
    color: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    description: 'Traditional Computer Modern serif, small-caps section titles, academic rules.',
  },
  {
    id: 'compact-executive',
    name: 'Compact Executive',
    badge: '1-Page Senior',
    color: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
    description: 'Condensed high-density layout with 0.5cm margins and bold leadership styling.',
  },
];

interface LatexViewerProps {
  jobId: string;
  latex: string;
  selectedTemplate?: string;
  onSelectTemplate?: (templateId: string) => void;
  downloadUrl?: string | null;
  candidateName?: string;
  resumeData?: any;
}

export function LatexViewer({
  jobId,
  latex,
  selectedTemplate = 'modern-developer',
  onSelectTemplate,
  downloadUrl,
  candidateName = 'resume',
  resumeData,
}: LatexViewerProps) {
  const [code, setCode] = useState(latex);
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('code');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const updateLatexMutation = useUpdateResumeLatex(jobId);

  useEffect(() => {
    setCode(latex);
  }, [latex]);

  const isDirty = code !== latex;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    try {
      await updateLatexMutation.mutateAsync({
        latex: code,
        templateId: selectedTemplate,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save LaTeX to R2:', err);
    }
  };

  const handleReset = () => {
    setCode(latex);
  };

  const handleDownload = () => {
    if (downloadUrl && !isDirty) {
      window.open(downloadUrl, '_blank');
      return;
    }

    const blob = new Blob([code], { type: 'application/x-tex;charset=utf-8' });
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

  const handleOpenOverleaf = () => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.overleaf.com/docs';
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'snip';
    input.value = code;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode = `${code.substring(0, start)}  ${code.substring(end)}`;
      setCode(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <Card className="p-0 border-border bg-card/90 overflow-hidden shadow-lg space-y-0 gap-0">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-muted/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-mono font-semibold text-foreground">resume.tex</span>
          </div>

          <Badge
            variant="outline"
            className={`text-[11px] font-mono font-semibold px-2 py-0.5 ${
              isDirty
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isDirty ? 'Unsaved Edits' : 'Synced with R2'}
          </Badge>

          {saveSuccess && (
            <span className="text-xs font-semibold text-brand-cyan flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Synced to R2
            </span>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setViewMode('code')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'code'
                ? 'bg-brand-pink/15 text-brand-pink dark:bg-brand-cyan/15 dark:text-brand-cyan font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'split'
                ? 'bg-brand-pink/15 text-brand-pink dark:bg-brand-cyan/15 dark:text-brand-cyan font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-brand-pink/15 text-brand-pink dark:bg-brand-cyan/15 dark:text-brand-cyan font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 text-xs border-border bg-background hover:bg-muted gap-1"
                title="Revert edits to generated template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateLatexMutation.isPending}
                className="h-8 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {updateLatexMutation.isPending ? 'Saving to R2...' : 'Save & Sync to R2'}
                </span>
              </Button>
            </>
          )}

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
            className="h-8 text-xs font-semibold bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark shadow-sm gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .tex</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenOverleaf}
            className="h-8 text-xs font-medium border-border bg-background hover:bg-muted gap-1 text-foreground"
            title="Open in Overleaf editor"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>Overleaf</span>
          </Button>
        </div>
      </div>

      {/* Template Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-muted/20 border-b border-border text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Palette className="w-3.5 h-3.5 text-brand-cyan" />
          <span className="text-xs font-semibold text-foreground">LaTeX Style:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {TEMPLATES.map((tpl) => {
              const isActive = (selectedTemplate || 'modern-developer') === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onSelectTemplate?.(tpl.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-background font-bold text-foreground border-brand-cyan/50 shadow-xs ring-1 ring-brand-cyan/30'
                      : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-brand-cyan' : 'bg-muted-foreground'}`}
                  />
                  <span>{tpl.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-[11px] font-sans text-muted-foreground hidden md:inline">
          {TEMPLATES.find((t) => t.id === (selectedTemplate || 'modern-developer'))?.description}
        </span>
      </div>

      {/* Main Workspace: Code, Split, or Preview */}
      <div
        className={`w-full ${
          viewMode === 'split'
            ? 'grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border'
            : ''
        }`}
      >
        {/* Code Editor Pane */}
        {(viewMode === 'code' || viewMode === 'split') && (
          <div className="relative flex bg-slate-950 text-slate-100 font-mono text-xs overflow-hidden h-155">
            {/* Gutter / Line Numbers */}
            <div
              ref={lineNumbersRef}
              aria-hidden="true"
              className="w-12 py-4 pr-3 pl-2 bg-slate-900/90 text-slate-500 font-mono text-right select-none overflow-hidden shrink-0 border-r border-slate-800 leading-relaxed"
            >
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>

            {/* Editable Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              className="flex-1 p-4 bg-transparent text-slate-200 font-mono text-xs leading-relaxed outline-none resize-none overflow-y-auto whitespace-pre tab-size-2"
              placeholder="LaTeX source code..."
            />
          </div>
        )}

        {/* Live Document Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="p-4 bg-muted/20 overflow-y-auto h-155 flex justify-center items-start">
            <DocumentPreviewSheet resume={resumeData} />
          </div>
        )}
      </div>
    </Card>
  );
}
