'use client';

import type { BatchImportProfileRequest, ParsedResumeData } from '@praman/schemas';
import {
  AlertCircle,
  Briefcase,
  Check,
  Code2,
  GraduationCap,
  RefreshCw,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useImportProfile, useParseResume } from '@/hooks/usePramanApi';

interface ResumeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SAMPLE_RESUME = `# Alex Mercer
Senior Full-Stack Engineer
San Francisco, CA | alex.mercer@example.com | (555) 234-5678
https://github.com/alexmercer | https://linkedin.com/in/alex-mercer

## Professional Summary
Passionate software architect with 8+ years building high-scale SaaS products and distributed web applications.

## Technical Skills
Languages: TypeScript, JavaScript, Python, Go, SQL
Frameworks & Libraries: React, Next.js, Node.js, NestJS, TailwindCSS, GraphQL
Cloud & Tools: PostgreSQL, Redis, Docker, Kubernetes, AWS, Git, CI/CD pipelines

## Experience

Acme Corporation - Senior Software Engineer
Jan 2021 - Present
• Architected event-driven microservices handling 10M daily transactions with 99.99% uptime
• Reduced query latency by 45% through Redis caching and PostgreSQL schema optimizations
• Mentored 5 junior and mid-level engineers and established unified TypeScript code standards
Stack: TypeScript, Node.js, PostgreSQL, Redis, Docker

Beta Solutions, Full Stack Developer
03/2018 – 12/2020
• Developed responsive user dashboards in React and Next.js used by over 50,000 monthly active users
• Integrated Stripe payment gateways and robust webhook reconciliation systems
• Implemented automated CI/CD deployment pipelines on AWS ECS
Technologies: React, GraphQL, Node.js, AWS

## Education
University of California, Berkeley
Bachelor of Science in Computer Science
2014 - 2018

## Certifications
AWS Certified Solutions Architect - Associate (2022)
Google Cloud Professional Cloud Architect
`;

export const ResumeImportModal: React.FC<ResumeImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [rawText, setRawText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'experiences' | 'skills' | 'education' | 'personal'>(
    'experiences',
  );

  const parseMutation = useParseResume();
  const importMutation = useImportProfile();

  const handleReset = () => {
    setStep('input');
    setRawText('');
    setParsedData(null);
    setErrorMessage(null);
    setActiveTab('experiences');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_RESUME);
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.pdf')) {
      setErrorMessage(
        'For PDF files, copy and paste the resume text into the text area below for 100% accurate, zero-cost parsing.',
      );
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        setErrorMessage(null);
      }
    };
    reader.readAsText(file);
  };

  const handleParse = async () => {
    if (!rawText.trim() || rawText.trim().length < 20) {
      setErrorMessage('Please provide at least 20 characters of resume content to parse.');
      return;
    }

    setErrorMessage(null);
    try {
      const result = await parseMutation.mutateAsync({ rawText });
      setParsedData(result);
      setStep('review');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse resume. Please check the text format.');
    }
  };

  const handleRemoveSkill = (skillIndex: number) => {
    if (!parsedData) return;
    const updatedSkills = parsedData.skills.filter((_, idx) => idx !== skillIndex);
    setParsedData({
      ...parsedData,
      skills: updatedSkills,
    });
  };

  const handleRemoveExperience = (expIndex: number) => {
    if (!parsedData) return;
    const updated = parsedData.experiences.filter((_, idx) => idx !== expIndex);
    setParsedData({
      ...parsedData,
      experiences: updated,
    });
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    setErrorMessage(null);
    try {
      const payload: BatchImportProfileRequest = {
        mode: importMode,
        data: parsedData,
      };

      await importMutation.mutateAsync(payload);
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import profile data.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : null)}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border bg-card text-card-foreground shadow-2xl rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {step === 'input' ? 'Import & Parse Resume' : 'Review & Confirm Facts'}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {step === 'input'
                    ? 'Extract contact info, experience, skills, and education without paid AI.'
                    : 'Verify extracted facts before applying them to your candidate profile.'}
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="hidden sm:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium"
            >
              $0 Cost • 100% Offline
            </Badge>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {step === 'input' && (
            <div className="space-y-4">
              {/* File Upload Trigger */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-dashed border-border/80 bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-background border border-border shrink-0">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Upload Resume File</p>
                    <p className="text-xs text-muted-foreground">Supported: .txt, .md, .json</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="resume-file-input"
                    className="hidden"
                    accept=".txt,.md,.json,.pdf"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs cursor-pointer"
                    onClick={() => document.getElementById('resume-file-input')?.click()}
                  >
                    Browse File
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={handleLoadSample}
                  >
                    Load Sample
                  </Button>
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <label htmlFor="resume-raw-text" className="font-medium text-foreground">
                    Or Paste Resume Plain Text
                  </label>
                  <span>{rawText.length} characters</span>
                </div>
                <Textarea
                  id="resume-raw-text"
                  placeholder="Paste raw resume text here (e.g. contact info, work experiences, skills, education)..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="min-h-65 font-mono text-xs leading-relaxed resize-y bg-muted/20 border-border"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Runs completely on your local server. No data is sent to OpenAI or third-party
                  APIs.
                </span>
              </div>
            </div>
          )}

          {step === 'review' && parsedData && (
            <div className="space-y-6">
              {/* Parse Metrics Banner */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/30 font-semibold"
                  >
                    Parsed in {parsedData.meta.parsingTimeMs}ms
                  </Badge>
                  <span className="text-muted-foreground">
                    {parsedData.meta.detectedSections.length} sections recognized:
                  </span>
                  <span className="font-medium text-foreground capitalize">
                    {parsedData.meta.detectedSections.join(', ')}
                  </span>
                </div>
                <span className="text-muted-foreground font-mono">
                  {parsedData.meta.characterCount} chars analyzed
                </span>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Import Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setImportMode('merge')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'merge'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        Merge into Profile
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-primary/10 text-primary border-primary/30"
                      >
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Appends detected experiences, education, and merges skills without deleting
                      existing facts.
                    </p>
                  </div>

                  <div
                    onClick={() => setImportMode('replace')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'border-destructive bg-destructive/5 ring-1 ring-destructive'
                        : 'border-border bg-card hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Replace Profile</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-destructive/10 text-destructive border-destructive/30"
                      >
                        Overwrite
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wipes current experiences, educations, and skills, replacing them cleanly with
                      this resume.
                    </p>
                  </div>
                </div>
              </div>

              {/* Extracted Facts Review Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(v: any) => setActiveTab(v)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 w-full bg-muted/40 p-1 rounded-xl">
                  <TabsTrigger value="experiences" className="text-xs gap-1.5 rounded-lg">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Experience ({parsedData.experiences.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="text-xs gap-1.5 rounded-lg">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Skills ({parsedData.skills.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="education" className="text-xs gap-1.5 rounded-lg">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Education ({parsedData.educations.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="text-xs gap-1.5 rounded-lg">
                    <User className="w-3.5 h-3.5" />
                    <span>Personal</span>
                  </TabsTrigger>
                </TabsList>

                {/* Experiences Tab */}
                <TabsContent value="experiences" className="mt-4 space-y-3">
                  {parsedData.experiences.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">
                      No experience entries detected.
                    </p>
                  ) : (
                    parsedData.experiences.map((exp, idx) => (
                      <Card
                        key={idx}
                        className="p-4 rounded-xl border-border bg-muted/20 relative group"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(idx)}
                          className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Remove experience"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="pr-8">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">{exp.title}</h4>
                            {exp.isCurrent && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              >
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {exp.company} • {exp.startDate || 'Unknown'} -{' '}
                            {exp.endDate || (exp.isCurrent ? 'Present' : 'Unknown')}
                          </p>

                          {exp.responsibilities && exp.responsibilities.length > 0 && (
                            <ul className="mt-2.5 space-y-1">
                              {exp.responsibilities.slice(0, 3).map((resp, rIdx) => (
                                <li
                                  key={rIdx}
                                  className="text-xs text-foreground/80 flex items-start gap-2"
                                >
                                  <span className="text-primary mt-1">•</span>
                                  <span>{resp}</span>
                                </li>
                              ))}
                              {exp.responsibilities.length > 3 && (
                                <li className="text-[11px] text-muted-foreground italic">
                                  +{exp.responsibilities.length - 3} more bullet points
                                </li>
                              )}
                            </ul>
                          )}

                          {exp.technologies && exp.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-border/50">
                              {exp.technologies.map((tech, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-muted border border-border text-foreground/80"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Skills Tab */}
                <TabsContent value="skills" className="mt-4">
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Click <X className="inline w-3 h-3 text-destructive" /> to discard any
                        incorrect or unwanted skill:
                      </p>
                      <Badge variant="outline" className="text-xs font-mono">
                        {parsedData.skills.length} skills
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {parsedData.skills.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          No skills detected.
                        </p>
                      ) : (
                        parsedData.skills.map((sk, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs px-2.5 py-1 rounded-lg gap-1.5 bg-background border border-border group"
                          >
                            <span>{sk.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(idx)}
                              className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="mt-4 space-y-3">
                  {parsedData.educations.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">
                      No education entries detected.
                    </p>
                  ) : (
                    parsedData.educations.map((edu, idx) => (
                      <Card key={idx} className="p-4 rounded-xl border-border bg-muted/20">
                        <h4 className="text-sm font-semibold text-foreground">{edu.degree}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {edu.institution}{' '}
                          {edu.startDate || edu.endDate
                            ? `• ${edu.startDate || ''} - ${edu.endDate || ''}`
                            : ''}
                        </p>
                        {edu.field && (
                          <p className="text-xs text-foreground/80 mt-1">Field: {edu.field}</p>
                        )}
                      </Card>
                    ))
                  )}

                  {parsedData.certifications.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                        Certifications ({parsedData.certifications.length})
                      </h4>
                      <div className="space-y-2">
                        {parsedData.certifications.map((cert, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg border border-border bg-muted/10 text-xs flex items-center justify-between"
                          >
                            <span className="font-medium text-foreground">{cert.name}</span>
                            <span className="text-muted-foreground">
                              {cert.issuer || ''} {cert.date ? `(${cert.date})` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Personal Tab */}
                <TabsContent value="personal" className="mt-4">
                  <Card className="p-4 rounded-xl border-border bg-muted/20 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Full Name:</span>
                        <span className="font-semibold text-foreground">
                          {parsedData.personal.name || 'Not detected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Target Title:</span>
                        <span className="font-semibold text-foreground">
                          {parsedData.personal.title || 'Not detected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Email:</span>
                        <span className="text-foreground">
                          {parsedData.personal.contact?.email || 'Not detected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Phone:</span>
                        <span className="text-foreground">
                          {parsedData.personal.contact?.phone || 'Not detected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Location:</span>
                        <span className="text-foreground">
                          {parsedData.personal.location || 'Not detected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">GitHub / LinkedIn:</span>
                        <span className="text-foreground truncate block">
                          {parsedData.personal.links?.github ||
                            parsedData.personal.links?.linkedin ||
                            'None'}
                        </span>
                      </div>
                    </div>

                    {parsedData.personal.summary && (
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground block mb-1">
                          Professional Summary:
                        </span>
                        <p className="text-xs text-foreground/85 leading-relaxed bg-background/50 p-2.5 rounded-lg border border-border/60">
                          {parsedData.personal.summary}
                        </p>
                      </div>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 sm:p-6 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          {step === 'input' ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleParse}
                disabled={parseMutation.isPending || !rawText.trim()}
                className="text-xs gap-1.5"
              >
                {parseMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing Resume...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Parse & Review Facts</span>
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep('input')}
                disabled={importMutation.isPending}
                className="text-xs"
              >
                Back to Edit Text
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={importMutation.isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleConfirmImport}
                  disabled={importMutation.isPending}
                  className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {importMutation.isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Apply to Profile</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
