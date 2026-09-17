'use client';

import { Printer, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DocumentPreviewSheetProps {
  resume: any;
}

export const DocumentPreviewSheet: React.FC<DocumentPreviewSheetProps> = ({ resume }) => {
  const [zoom, setZoom] = useState<number>(100);

  const handlePrint = () => {
    window.print();
  };

  const personal = resume?.personal || {};
  const contact = personal.contact || {};
  const links = personal.links || {};

  return (
    <div className="flex flex-col items-center space-y-4">
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
          <Card className="w-198.5 min-h-280.75 bg-white text-slate-900 font-sans p-12 shadow-2xl rounded-none border border-slate-200 select-text print:shadow-none print:border-none print:m-0 print:p-8">
            {/* Document Header */}
            <div className="text-center border-b border-slate-300 pb-4 mb-5">
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
              <div className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#004f90] border-b border-slate-300 pb-1 mb-2">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-800 leading-relaxed">{resume.summary}</p>
              </div>
            )}

            {/* Technical Skills */}
            {resume?.skills && resume.skills.length > 0 && (
              <div className="mb-5">
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
              <div className="mb-5 space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#004f90] border-b border-slate-300 pb-1 mb-2">
                  Work Experience
                </h2>
                {resume.experience.map((exp: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-slate-950">
                        {exp.title}{' '}
                        <span className="font-normal text-slate-600">— {exp.company}</span>
                      </span>
                    </div>
                    <ul className="pl-4 list-disc text-xs text-slate-800 space-y-1 leading-relaxed">
                      {exp.bullets?.map((b: string, idx: number) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Featured Projects */}
            {resume?.projects && resume.projects.length > 0 && (
              <div className="mb-5 space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#004f90] border-b border-slate-300 pb-1 mb-2">
                  Featured Projects
                </h2>
                {resume.projects.map((proj: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="text-xs font-bold text-slate-950">{proj.name}</div>
                    <ul className="pl-4 list-disc text-xs text-slate-800 space-y-1 leading-relaxed">
                      {proj.bullets?.map((b: string, idx: number) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {resume?.education && resume.education.length > 0 && (
              <div className="mb-4">
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
