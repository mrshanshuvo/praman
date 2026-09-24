'use client';

import type { ResumeData } from '@praman/schemas';
import { cn } from 'cn';
import {
  Check,
  Code2,
  Columns2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  Maximize2,
  Minimize2,
  Palette,
  RefreshCw,
  RotateCcw,
  Save,
  WrapText,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUpdateResumeLatex } from '@/hooks/usePramanApi';
import { useUrlTab } from '@/hooks/useUrlParams';
import { downloadLatex, openInOverleaf, sanitizeFilename } from '@/lib/export-manager';
import { CompiledPdfPreview } from './CompiledPdfPreview';
import type { SheetSyncTarget } from './DocumentPreviewSheet';

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
    color: 'text-warning border-warning/30 bg-warning/10',
    description: 'Traditional Computer Modern serif, small-caps section titles, academic rules.',
  },
  {
    id: 'compact-executive',
    name: 'Compact Executive',
    badge: '1-Page Senior',
    color: 'text-success border-success/30 bg-success/10',
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
  resumeData?: ResumeData;
  version?: string;
}

export function LatexViewer({
  jobId,
  latex,
  selectedTemplate = 'modern-developer',
  onSelectTemplate,
  downloadUrl,
  candidateName = 'resume',
  resumeData,
  version,
}: LatexViewerProps) {
  const [code, setCode] = useState(latex);
  const [viewMode, setViewMode] = useUrlTab<'split' | 'code' | 'preview'>({
    paramName: 'editorView',
    defaultValue: 'code',
    validValues: ['code', 'split', 'preview'] as const,
  });
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [lineHeights, setLineHeights] = useState<number[]>([]);
  const [recompileKey, setRecompileKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSyncLine, setActiveSyncLine] = useState<number | null>(null);
  const [editorSyncTarget, setEditorSyncTarget] = useState<SheetSyncTarget | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const syncCountRef = useRef(0);

  const lines = code.split('\n');

  const updateLatexMutation = useUpdateResumeLatex(jobId);

  // Overleaf SyncTeX: Forward Sync (Editor -> Preview on Double-Click)
  const handleTextareaDoubleClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textUpToCursor = code.substring(0, cursorPos);
    const lineIndex = textUpToCursor.split('\n').length - 1;
    const currentLine = lines[lineIndex] || '';

    // Detect section
    let detectedSection = '';
    const sectionMatch = currentLine.match(/\\section\{([^}]+)\}/i);
    if (sectionMatch) {
      detectedSection = sectionMatch[1];
    } else {
      // Look backward for nearest \section
      for (let i = lineIndex; i >= 0; i--) {
        const m = lines[i].match(/\\section\{([^}]+)\}/i);
        if (m) {
          detectedSection = m[1];
          break;
        }
      }
    }

    const percentage = lines.length > 1 ? lineIndex / (lines.length - 1) : 0;

    setActiveSyncLine(lineIndex);
    setTimeout(() => setActiveSyncLine(null), 2500);

    setEditorSyncTarget({
      section: detectedSection,
      text: currentLine,
      percentage,
      timestamp: ++syncCountRef.current,
    });
  };

  // Overleaf SyncTeX: Inverse Sync (Preview -> Editor on Double-Click)
  const handleSyncFromPreview = (target: {
    section?: string;
    query?: string;
    timestamp: number;
  }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let matchedLineIdx = -1;

    // 1. If query provided (e.g. bullet snippet or job title), search lines
    if (target.query && target.query.length >= 6) {
      const cleanQ = target.query
        .slice(0, 30)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      matchedLineIdx = lines.findIndex((l) => {
        const cleanL = l.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanL.includes(cleanQ) || cleanQ.includes(cleanL);
      });
    }

    // 2. Fallback to section header
    if (matchedLineIdx === -1 && target.section) {
      matchedLineIdx = lines.findIndex((l) => {
        const match = l.match(/\\section\{([^}]+)\}/i);
        return match?.[1].toLowerCase().includes(target.section!.toLowerCase());
      });
    }

    if (matchedLineIdx !== -1) {
      let cumHeight = 0;
      for (let i = 0; i < matchedLineIdx; i++) {
        cumHeight += lineHeights[i] || 20;
      }
      const targetScroll = Math.max(0, cumHeight - textarea.clientHeight / 2 + 20);
      textarea.scrollTop = targetScroll;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = targetScroll;
      }

      setActiveSyncLine(matchedLineIdx);
      setTimeout(() => setActiveSyncLine(null), 2500);

      // Highlight line text in textarea
      let charStart = 0;
      for (let i = 0; i < matchedLineIdx; i++) {
        charStart += lines[i].length + 1;
      }
      textarea.selectionStart = charStart;
      textarea.selectionEnd = charStart + lines[matchedLineIdx].length;
      textarea.focus();
    }
  };

  // Exit fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll in fullscreen mode to prevent background jitter
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Global keyboard shortcuts (Escape exits fullscreen)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    setCode(latex);
  }, [latex]);

  useEffect(() => {
    if (!wordWrap) {
      setLineHeights([]);
      return;
    }

    const updateHeights = () => {
      if (!mirrorRef.current || !textareaRef.current) return;
      if (textareaRef.current.clientWidth) {
        mirrorRef.current.style.width = `${textareaRef.current.clientWidth}px`;
      }
      const children = mirrorRef.current.children;
      const heights: number[] = [];
      for (let i = 0; i < children.length; i++) {
        heights.push((children[i] as HTMLElement).offsetHeight);
      }
      setLineHeights(heights);
    };

    updateHeights();

    const textarea = textareaRef.current;
    if (!textarea) return;

    const observer = new ResizeObserver(() => {
      updateHeights();
    });
    observer.observe(textarea);

    return () => {
      observer.disconnect();
    };
  }, [code, wordWrap, viewMode]);

  const isDirty = code !== latex;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = useCallback(async () => {
    try {
      await updateLatexMutation.mutateAsync({
        latex: code,
        templateId: selectedTemplate,
      });
      setSaveSuccess(true);
      setRecompileKey((k) => k + 1);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save LaTeX to R2:', err);
    }
  }, [code, selectedTemplate, updateLatexMutation]);

  const handleReset = () => {
    setCode(latex);
  };

  const handleDownload = () => {
    if (downloadUrl && !isDirty) {
      window.open(downloadUrl, '_blank');
      return;
    }

    const safeName = sanitizeFilename(candidateName);
    downloadLatex(`${safeName}_resume.tex`, code);
  };

  const handleOpenOverleaf = () => {
    openInOverleaf(code);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+S / Cmd+S: Save and sync to Cloudflare R2
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSave();
      return;
    }

    // Ctrl+Enter / Cmd+Enter: Recompile live PDF preview
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      setRecompileKey((k) => k + 1);
      return;
    }

    // Escape: Exit fullscreen mode
    if (e.key === 'Escape' && isFullscreen) {
      e.preventDefault();
      setIsFullscreen(false);
      return;
    }

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

  return (
    <Card
      className={cn(
        'border-border bg-card/90 overflow-hidden shadow-lg space-y-0 gap-0 p-0 flex flex-col transition-all duration-200',
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-0 h-screen w-screen bg-background shadow-2xl'
          : 'h-[calc(100vh-14rem)] min-h-135',
      )}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border bg-muted/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-mono font-semibold text-foreground">resume.tex</span>
          </div>

          <Badge
            variant="outline"
            className={`text-xs font-mono font-semibold px-2 py-0.5 ${
              isDirty
                ? 'bg-warning/15 text-warning border-warning/30'
                : 'bg-success/15 text-success border-success/30'
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

        {/* View Mode & Word Wrap Toggles */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                viewMode === 'code'
                  ? 'bg-brand-pink/15 text-brand-pink dark:bg-brand-cyan/15 dark:text-brand-cyan font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                viewMode === 'split'
                  ? 'bg-brand-pink/15 text-brand-pink dark:bg-brand-cyan/15 dark:text-brand-cyan font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                viewMode === 'preview'
                  ? 'bg-brand-pink/15 text-brand-pink dark:bg-brand-cyan/15 dark:text-brand-cyan font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {(viewMode === 'code' || viewMode === 'split') && (
            <button
              type="button"
              onClick={() => setWordWrap((w) => !w)}
              className={cn(
                'px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer h-7.5',
                wordWrap
                  ? 'bg-brand-cyan/15 border-brand-cyan/40 text-brand-cyan font-semibold'
                  : 'bg-background/80 border-border text-muted-foreground hover:text-foreground',
              )}
              title={
                wordWrap
                  ? 'Word Wrap enabled (click to disable)'
                  : 'Word Wrap disabled (click to enable)'
              }
            >
              <WrapText className="w-3.5 h-3.5" />
              <span>Wrap</span>
            </button>
          )}
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
                className="h-8 text-xs font-semibold bg-success hover:bg-success/90 text-success-foreground shadow-sm gap-1.5 cursor-pointer"
                title="Save & Sync to Cloudflare R2 (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{updateLatexMutation.isPending ? 'Saving to R2...' : 'Save & Sync'}</span>
                <kbd className="hidden sm:inline-flex items-center text-2xs font-mono font-medium bg-success-foreground/20 text-success-foreground px-1 py-0.2 rounded border border-success-foreground/30">
                  Ctrl+S
                </kbd>
              </Button>
            </>
          )}

          {(viewMode === 'split' || viewMode === 'preview') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRecompileKey((k) => k + 1)}
              className="h-8 text-xs border-border bg-background hover:bg-muted gap-1.5 cursor-pointer text-foreground"
              title="Recompile PDF Preview (Ctrl+Enter)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="hidden sm:inline">Recompile</span>
              <kbd className="hidden md:inline-flex items-center text-2xs font-mono text-muted-foreground bg-muted px-1 py-0.2 rounded border border-border">
                Ctrl+↵
              </kbd>
            </Button>
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
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 text-xs font-medium border-border bg-background hover:bg-muted gap-1 text-foreground cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .tex</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenOverleaf}
            className="h-8 text-xs font-medium border-border bg-background hover:bg-muted gap-1 text-foreground cursor-pointer"
            title="Open in Overleaf editor"
          >
            <ExternalLink className="w-3.5 h-3.5 text-success" />
            <span>Overleaf</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className={cn(
              'h-8 text-xs font-medium border-border bg-background hover:bg-muted gap-1 text-foreground cursor-pointer',
              isFullscreen && 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40',
            )}
            title={isFullscreen ? 'Exit Fullscreen Studio (Esc)' : 'Open in Fullscreen Studio'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-brand-cyan" />
                <span className="hidden sm:inline">Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Focus</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Template Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-muted/20 border-b border-border text-xs shrink-0">
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

        <span className="text-xs font-sans text-muted-foreground hidden md:inline">
          {TEMPLATES.find((t) => t.id === (selectedTemplate || 'modern-developer'))?.description}
        </span>
      </div>

      {/* Main Workspace: Code, Split, or Preview */}
      <div
        className={cn(
          'w-full flex-1 min-h-0 overflow-hidden',
          viewMode === 'split'
            ? 'grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border h-full'
            : 'h-full flex flex-col',
        )}
      >
        {/* Code Editor Pane */}
        {(viewMode === 'code' || viewMode === 'split') && (
          <div className="relative flex bg-editor-bg text-foreground font-mono text-xs overflow-hidden h-full flex-1 min-h-0">
            {/* Hidden Mirror for Exact Word-Wrap Height Measurement */}
            {wordWrap && (
              <div
                ref={mirrorRef}
                aria-hidden="true"
                className="absolute left-12 right-0 top-0 invisible pointer-events-none p-4 font-mono text-xs leading-relaxed box-border"
              >
                {lines.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap wrap-break-word">
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
            )}

            {/* Gutter / Line Numbers */}
            <div
              ref={lineNumbersRef}
              aria-hidden="true"
              className="w-12 py-4 pr-3 pl-2 bg-editor-gutter text-muted-foreground font-mono text-right select-none overflow-hidden shrink-0 border-r border-editor-border leading-relaxed"
            >
              {lines.map((_, i) => (
                <div
                  key={i}
                  style={wordWrap && lineHeights[i] ? { height: `${lineHeights[i]}px` } : undefined}
                  className={cn(
                    'flex items-start justify-end transition-colors',
                    activeSyncLine === i &&
                      'text-brand-cyan font-bold bg-brand-cyan/25 px-1 rounded ring-1 ring-brand-cyan/50',
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Editable Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              onDoubleClick={handleTextareaDoubleClick}
              title="Double-click any line to jump preview to this section (Overleaf style)"
              spellCheck={false}
              className={cn(
                'flex-1 p-4 bg-transparent text-foreground/90 font-mono text-xs leading-relaxed outline-none resize-none overflow-y-auto tab-size-2',
                wordWrap
                  ? 'whitespace-pre-wrap wrap-break-word overflow-x-hidden'
                  : 'whitespace-pre overflow-x-auto',
              )}
              placeholder="LaTeX source code..."
            />
          </div>
        )}

        {/* Live Document Preview Pane (Overleaf-Style Compiled PDF) */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="p-3 bg-muted/20 overflow-hidden h-full flex-1 min-h-0 flex flex-col">
            <CompiledPdfPreview
              jobId={jobId}
              selectedTemplate={selectedTemplate}
              version={version}
              recompileTrigger={recompileKey}
              resumeData={resumeData}
              candidateName={candidateName}
              syncTarget={editorSyncTarget}
              onSyncToEditor={handleSyncFromPreview}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
