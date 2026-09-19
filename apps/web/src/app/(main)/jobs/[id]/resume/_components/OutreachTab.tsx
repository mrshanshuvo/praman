'use client';

import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FileText,
  Hash,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  useGenerateCoverLetter,
  useGenerateRecruiterEmail,
  useJobOutreach,
} from '@/hooks/usePramanApi';
import { triggerFileDownload } from '@/lib/zip';

interface OutreachTabProps {
  jobId: string;
  candidateName?: string;
}

export function OutreachTab({ jobId, candidateName = 'Candidate' }: OutreachTabProps) {
  const { data: outreach } = useJobOutreach(jobId);
  const generateCoverLetterMutation = useGenerateCoverLetter(jobId);
  const generateEmailMutation = useGenerateRecruiterEmail(jobId);

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const coverLetter = outreach?.coverLetter;
  const coverLetterLatex = outreach?.coverLetterLatex;
  const recruiterEmail = outreach?.recruiterEmail;

  const safeCandidate = candidateName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  const handleDownloadTxt = () => {
    if (!coverLetter) return;
    const body = (coverLetter.bodyParagraphs || []).join('\n\n');
    const text = `To: ${coverLetter.recipientName}
Company: ${coverLetter.companyName}
Position: ${coverLetter.jobTitle}

Dear ${coverLetter.recipientName},

${coverLetter.opening}

${body}

${coverLetter.closing}

${coverLetter.signOff}
${coverLetter.senderName}
`;
    triggerFileDownload(`${safeCandidate}_cover_letter.txt`, text, 'text/plain');
  };

  const handleDownloadTex = () => {
    if (!coverLetterLatex) return;
    triggerFileDownload(`${safeCandidate}_cover_letter.tex`, coverLetterLatex, 'application/x-tex');
  };

  const handleOpenOverleaf = () => {
    if (!coverLetterLatex) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.overleaf.com/docs';
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'snip';
    input.value = coverLetterLatex;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <h3 className="text-sm font-semibold text-foreground">
              Optional Outreach & Application Companion
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-brand-cyan/30 text-brand-cyan bg-brand-cyan/10"
            >
              ON-DEMAND
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Generate an evidence-backed formal cover letter or a punchy cold email for hiring
            managers without blocking your resume.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============================================================ */}
        {/* Card 1: Tailored Cover Letter                                */}
        {/* ============================================================ */}
        <Card className="p-5 border-border bg-card/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Tailored Cover Letter</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Grounded in verified experience & anti-hallucination boundaries
                  </p>
                </div>
              </div>

              {coverLetter && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                >
                  Ready
                </Badge>
              )}
            </div>

            {!coverLetter ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Generate a tailored, formal cover letter addressing company challenges using
                  verified achievements from your ground-truth ledger.
                </p>
                <Button
                  size="sm"
                  onClick={() => generateCoverLetterMutation.mutate()}
                  disabled={generateCoverLetterMutation.isPending}
                  className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold text-xs gap-1.5 shadow-xs cursor-pointer"
                >
                  {generateCoverLetterMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Cover Letter...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Cover Letter (Optional)</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {/* Anti-Hallucination Validation Status */}
                {outreach?.coverLetterValidation && (
                  <div>
                    {outreach.coverLetterValidation.violations?.length === 0 &&
                    outreach.coverLetterValidation.numberFlags?.length === 0 ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>
                          Truth-Preserved: Zero discrepancies or unconfirmed claims detected.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>Audit Discrepancies Detected</span>
                        </div>
                        {outreach.coverLetterValidation.violations?.map((v: string, i: number) => (
                          <p key={i} className="text-[11px] text-amber-200/90 pl-5">
                            • {v}
                          </p>
                        ))}
                        {outreach.coverLetterValidation.numberFlags?.map((f: any, i: number) => (
                          <div
                            key={i}
                            className="text-[11px] text-amber-200/90 pl-5 flex items-center gap-1"
                          >
                            <Hash className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Unconfirmed metrics: {f.flaggedNumbers?.join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Letter Content Preview */}
                <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-3 text-xs text-foreground font-sans leading-relaxed max-h-96 overflow-y-auto">
                  <div className="border-b border-border/60 pb-2 text-muted-foreground font-mono text-[11px] space-y-0.5">
                    <div>
                      <strong className="text-foreground">To:</strong> {coverLetter.recipientName}
                    </div>
                    <div>
                      <strong className="text-foreground">Company:</strong>{' '}
                      {coverLetter.companyName}
                    </div>
                    <div>
                      <strong className="text-foreground">Role:</strong> {coverLetter.jobTitle}
                    </div>
                  </div>

                  <p className="font-semibold text-foreground">Dear {coverLetter.recipientName},</p>

                  <p>{coverLetter.opening}</p>

                  {coverLetter.bodyParagraphs?.map((para: string, idx: number) => (
                    <p key={idx}>{para}</p>
                  ))}

                  <p>{coverLetter.closing}</p>

                  <div className="pt-2">
                    <p>{coverLetter.signOff}</p>
                    <p className="font-bold text-foreground mt-1">{coverLetter.senderName}</p>
                  </div>
                </div>

                {/* Cover Letter Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const body = (coverLetter.bodyParagraphs || []).join('\n\n');
                      handleCopy(
                        `Dear ${coverLetter.recipientName},\n\n${coverLetter.opening}\n\n${body}\n\n${coverLetter.closing}\n\n${coverLetter.signOff}\n${coverLetter.senderName}`,
                        'cl_text',
                      );
                    }}
                    className="text-xs border-border gap-1 bg-card hover:bg-muted cursor-pointer"
                  >
                    {copiedSection === 'cl_text' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-brand-cyan" />
                        <span className="text-brand-cyan">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadTxt}
                    className="text-xs border-border gap-1 bg-card hover:bg-muted cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadTex}
                    className="text-xs border-border gap-1 bg-card hover:bg-muted cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>.tex</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenOverleaf}
                    className="text-xs border-border gap-1 bg-card hover:bg-muted cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Overleaf</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => generateCoverLetterMutation.mutate()}
                    disabled={generateCoverLetterMutation.isPending}
                    className="text-xs text-muted-foreground hover:text-foreground ml-auto gap-1"
                    title="Regenerate Cover Letter"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        generateCoverLetterMutation.isPending ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Re-run</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ============================================================ */}
        {/* Card 2: Recruiter Outreach Email                             */}
        {/* ============================================================ */}
        <Card className="p-5 border-border bg-card/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-pink/10 border border-brand-pink/30 flex items-center justify-center text-brand-pink">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Recruiter Outreach Email</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Short, punchy 3-paragraph message for LinkedIn or direct hiring outreach
                  </p>
                </div>
              </div>

              {recruiterEmail && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                >
                  Ready
                </Badge>
              )}
            </div>

            {!recruiterEmail ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Generate a high-converting cold outreach email with an optimized subject line and
                  2-3 bullet highlights from your verified history.
                </p>
                <Button
                  size="sm"
                  onClick={() => generateEmailMutation.mutate()}
                  disabled={generateEmailMutation.isPending}
                  className="bg-brand-pink hover:bg-brand-pink/90 text-white font-semibold text-xs gap-1.5 shadow-xs cursor-pointer"
                >
                  {generateEmailMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Formulating Cold Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Generate Outreach Email (Optional)</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {/* Subject Line Pill */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase">
                      Subject:
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {recruiterEmail.subject}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(recruiterEmail.subject, 'subj')}
                    className="h-7 px-2 text-[11px] border border-border/60 bg-card hover:bg-muted gap-1"
                  >
                    {copiedSection === 'subj' ? (
                      <>
                        <Check className="w-3 h-3 text-brand-pink" />
                        <span className="text-brand-pink">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Email Body Preview */}
                <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-3 text-xs text-foreground font-sans leading-relaxed max-h-96 overflow-y-auto">
                  <p className="font-semibold text-foreground">{recruiterEmail.salutation}</p>
                  <p>{recruiterEmail.hook}</p>

                  <div className="space-y-1 pl-2">
                    {recruiterEmail.highlights?.map((highlight: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-brand-pink font-bold">•</span>
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  <p>{recruiterEmail.callToAction}</p>

                  <div className="pt-2">
                    <p>{recruiterEmail.signOff}</p>
                    <p className="font-bold text-foreground mt-0.5">{recruiterEmail.senderName}</p>
                  </div>
                </div>

                {/* Email Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const fullEmail = `Subject: ${recruiterEmail.subject}\n\n${recruiterEmail.salutation}\n\n${recruiterEmail.hook}\n\n${(recruiterEmail.highlights || []).map((h: string) => `• ${h}`).join('\n')}\n\n${recruiterEmail.callToAction}\n\n${recruiterEmail.signOff}\n${recruiterEmail.senderName}`;
                      handleCopy(fullEmail, 'email_full');
                    }}
                    className="text-xs border-border gap-1 bg-card hover:bg-muted cursor-pointer"
                  >
                    {copiedSection === 'email_full' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-brand-pink" />
                        <span className="text-brand-pink">Copied Full Email!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Full Email</span>
                      </>
                    )}
                  </Button>

                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      recruiterEmail.subject,
                    )}&body=${encodeURIComponent(
                      `${recruiterEmail.salutation}\n\n${recruiterEmail.hook}\n\n${(
                        recruiterEmail.highlights || []
                      )
                        .map((h: string) => `• ${h}`)
                        .join('\n')}\n\n${recruiterEmail.callToAction}\n\n${
                        recruiterEmail.signOff
                      }\n${recruiterEmail.senderName}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-border gap-1 bg-card hover:bg-muted cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>Open Mail Client</span>
                    </Button>
                  </a>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => generateEmailMutation.mutate()}
                    disabled={generateEmailMutation.isPending}
                    className="text-xs text-muted-foreground hover:text-foreground ml-auto gap-1"
                    title="Regenerate Recruiter Email"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        generateEmailMutation.isPending ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Re-run</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
