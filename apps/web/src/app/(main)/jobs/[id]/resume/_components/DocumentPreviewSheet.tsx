import { cn } from 'cn';
import { Printer, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface SheetSyncTarget {
  section?: string;
  text?: string;
  percentage?: number;
  timestamp?: number;
}

interface DocumentPreviewSheetProps {
  resume: any;
  syncTarget?: SheetSyncTarget | null;
  onSyncToEditor?: (target: { section?: string; query?: string; timestamp: number }) => void;
}

export const DocumentPreviewSheet: React.FC<DocumentPreviewSheetProps> = ({
  resume,
  syncTarget,
  onSyncToEditor,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  // React to forward sync from LaTeX editor double-click
  useEffect(() => {
    if (!syncTarget) return;

    const section = syncTarget.section?.toLowerCase();
    if (section) {
      setHighlightedSection(section);
      const el = document.getElementById(`sheet-sec-${section}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const timer = setTimeout(() => setHighlightedSection(null), 2200);
      return () => clearTimeout(timer);
    }

    if (typeof syncTarget.percentage === 'number') {
      const container = document.getElementById('sheet-scroll-viewport');
      if (container) {
        const targetScroll =
          syncTarget.percentage * (container.scrollHeight - container.clientHeight);
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  }, [syncTarget]);

  const personal = resume?.personal || {};
  const contact = personal.contact || {};
  const links = personal.links || {};

  return (
    <div id="sheet-scroll-viewport" className="flex flex-col items-center space-y-4 w-full">
      {/* Zoom & Print Toolbar */}
      <div className="flex items-center justify-between w-full max-w-3xl px-4 py-2 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            A4 Document Sheet
          </span>
          <span className="text-xs font-mono text-muted-foreground">({zoom}%)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.max(75, z - 15))}
            disabled={zoom <= 75}
            className="h-7 w-7 border-border"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(100)}
            className="h-7 px-2 text-xs font-mono border-border"
            title="Reset Zoom"
          >
            100%
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.min(125, z + 15))}
            disabled={zoom >= 125}
            className="h-7 w-7 border-border"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            size="sm"
            onClick={handlePrint}
            className="h-7 text-xs bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </Button>
        </div>
      </div>

      {/* Sheet Container with Scalable Zoom */}
      <div className="w-full flex justify-center overflow-x-auto py-2">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-200 ease-out"
        >
          <Card
            id="resume-printable-document"
            className="w-198.5 min-h-280.75 bg-white text-slate-900 font-sans p-12 shadow-2xl rounded-none border border-slate-200 select-text print:shadow-none print:border-none print:m-0 print:p-8"
          >
            {/* Document Header */}
            <div
              id="sheet-sec-header"
              onDoubleClick={() =>
                onSyncToEditor?.({
                  section: 'Personal',
                  query: personal.name,
                  timestamp: Date.now(),
                })
              }
              title="Double-click to jump to code in LaTeX editor (Overleaf style)"
              className="text-center border-b border-slate-300 pb-4 mb-5 cursor-pointer hover:bg-slate-50/80 p-2 rounded-lg transition-colors"
            >
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 uppercase">
                {personal.name || 'Candidate Name'}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-2 font-medium">
                {contact.email && <span>{contact.email}</span>}
                {contact.phone && <span>• {contact.phone}</span>}
                {personal.location && <span>• {personal.location}</span>}
                {Object.entries(links).map(([k, v]: [string, any]) => (
                  <span key={k}>
                    • <span className="capitalize">{k}:</span> {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Professional Summary */}
            {resume?.summary && (
              <div
                id="sheet-sec-summary"
                onDoubleClick={() =>
                  onSyncToEditor?.({
                    section: 'Summary',
                    query: resume.summary?.slice(0, 35),
                    timestamp: Date.now(),
                  })
                }
                title="Double-click to jump to code in LaTeX editor (Overleaf style)"
                className={cn(
                  'mb-5 p-2 rounded-lg transition-all cursor-pointer',
                  highlightedSection === 'summary' || highlightedSection === 'professionalsummary'
                    ? 'ring-2 ring-brand-cyan bg-brand-cyan/10'
                    : 'hover:bg-slate-50/80',
                )}
              >
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#004f90] border-b border-slate-300 pb-1 mb-2">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-800 leading-relaxed">{resume.summary}</p>
              </div>
            )}

            {/* Technical Skills */}
            {resume?.skills && resume.skills.length > 0 && (
              <div
                id="sheet-sec-skills"
                onDoubleClick={() =>
                  onSyncToEditor?.({
                    section: 'Skills',
                    query: resume.skills?.[0],
                    timestamp: Date.now(),
                  })
                }
                title="Double-click to jump to code in LaTeX editor (Overleaf style)"
                className={cn(
                  'mb-5 p-2 rounded-lg transition-all cursor-pointer',
                  highlightedSection === 'skills' || highlightedSection === 'technicalskills'
                    ? 'ring-2 ring-brand-cyan bg-brand-cyan/10'
                    : 'hover:bg-slate-50/80',
                )}
              >
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#004f90] border-b border-slate-300 pb-1 mb-2">
                  Technical Skills
                </h2>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {resume.skills.join(' • ')}
                </p>
              </div>
            )}

            {/* Work Experience */}
            {resume?.experience && resume.experience.length > 0 && (
              <div
                id="sheet-sec-experience"
                onDoubleClick={() =>
                  onSyncToEditor?.({
                    section: 'Experience',
                    query: resume.experience[0]?.title || 'Experience',
                    timestamp: Date.now(),
                  })
                }
                title="Double-click to jump to code in LaTeX editor (Overleaf style)"
                className={cn(
                  'mb-5 space-y-3 p-2 rounded-lg transition-all cursor-pointer',
                  highlightedSection === 'experience'
                    ? 'ring-2 ring-brand-cyan bg-brand-cyan/10'
                    : 'hover:bg-slate-50/80',
                )}
              >
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#004f90] border-b border-slate-300 pb-1 mb-2">
                  Work Experience
                </h2>
                {resume.experience.map((exp: any, i: number) => (
                  <div
                    key={i}
                    className="space-y-1"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onSyncToEditor?.({
                        section: 'Experience',
                        query: exp.title,
                        timestamp: Date.now(),
                      });
                    }}
                  >
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-slate-950">
                        {exp.title}{' '}
                        <span className="font-normal text-slate-600">— {exp.company}</span>
                      </span>
                    </div>
                    <ul className="pl-4 list-disc text-xs text-slate-800 space-y-1 leading-relaxed">
                      {exp.bullets?.map((b: string, idx: number) => (
                        <li
                          key={idx}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            onSyncToEditor?.({
                              section: 'Experience',
                              query: b.slice(0, 35),
                              timestamp: Date.now(),
                            });
                          }}
                          className="hover:text-brand-cyan transition-colors"
                          title="Double-click to jump to this bullet in LaTeX editor (Overleaf style)"
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Featured Projects */}
            {resume?.projects && resume.projects.length > 0 && (
              <div
                id="sheet-sec-projects"
                onDoubleClick={() =>
                  onSyncToEditor?.({
                    section: 'Projects',
                    query: resume.projects[0]?.name || 'Projects',
                    timestamp: Date.now(),
                  })
                }
                title="Double-click to jump to code in LaTeX editor (Overleaf style)"
                className={cn(
                  'mb-5 space-y-3 p-2 rounded-lg transition-all cursor-pointer',
                  highlightedSection === 'projects'
                    ? 'ring-2 ring-brand-cyan bg-brand-cyan/10'
                    : 'hover:bg-slate-50/80',
                )}
              >
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#004f90] border-b border-slate-300 pb-1 mb-2">
                  Featured Projects
                </h2>
                {resume.projects.map((proj: any, i: number) => (
                  <div
                    key={i}
                    className="space-y-1"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onSyncToEditor?.({
                        section: 'Projects',
                        query: proj.name,
                        timestamp: Date.now(),
                      });
                    }}
                  >
                    <div className="text-xs font-bold text-slate-950">{proj.name}</div>
                    <ul className="pl-4 list-disc text-xs text-slate-800 space-y-1 leading-relaxed">
                      {proj.bullets?.map((b: string, idx: number) => (
                        <li
                          key={idx}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            onSyncToEditor?.({
                              section: 'Projects',
                              query: b.slice(0, 35),
                              timestamp: Date.now(),
                            });
                          }}
                          className="hover:text-brand-cyan transition-colors"
                          title="Double-click to jump to this bullet in LaTeX editor (Overleaf style)"
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {resume?.education && resume.education.length > 0 && (
              <div
                id="sheet-sec-education"
                onDoubleClick={() =>
                  onSyncToEditor?.({
                    section: 'Education',
                    query: resume.education[0]?.degree || 'Education',
                    timestamp: Date.now(),
                  })
                }
                title="Double-click to jump to code in LaTeX editor (Overleaf style)"
                className={cn(
                  'mb-4 p-2 rounded-lg transition-all cursor-pointer',
                  highlightedSection === 'education'
                    ? 'ring-2 ring-brand-cyan bg-brand-cyan/10'
                    : 'hover:bg-slate-50/80',
                )}
              >
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#004f90] border-b border-slate-300 pb-1 mb-2">
                  Education
                </h2>
                {resume.education.map((edu: any, i: number) => (
                  <div key={i} className="text-xs text-slate-800">
                    <span className="font-bold text-slate-950">{edu.degree}</span>
                    {edu.institution && (
                      <span className="text-slate-600"> — {edu.institution}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
