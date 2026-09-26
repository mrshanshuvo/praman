'use client';

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
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

const SAMPLE_ROLES = [
  {
    id: 'fullstack',
    title: 'Senior Full-Stack Engineer',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL'],
    content: `Title: Senior Full-Stack Engineer
Company: CloudScale AI
Location: Remote (US / Global)
Employment Type: Full-time
Salary: $140,000 - $185,000 + Equity

About the Role:
We are looking for a Senior Full-Stack Engineer to architect and build our next-generation developer platform. You will work across modern web technologies, scalable backend services, and real-time data pipelines.

Key Responsibilities:
- Architect and develop high-performance web applications using Next.js, React, and TypeScript.
- Design scalable REST and GraphQL APIs backed by PostgreSQL and Prisma ORM.
- Optimize database queries, caching strategies (Redis), and background task queues.
- Collaborate closely with product managers and designers to translate product vision into production-ready software.
- Establish automated testing (unit, integration, and E2E) with Vitest and Playwright.

Required Qualifications:
- 5+ years of software engineering experience building web applications at scale.
- Deep expertise in TypeScript, React, and Node.js ecosystems.
- Strong proficiency in relational databases (PostgreSQL) and schema modeling.
- Solid understanding of distributed systems, authentication, and RESTful API architecture.
- Demonstrated ownership of end-to-end features from conception to production deployment.

Preferred Qualifications:
- Experience with Docker, Kubernetes, and AWS infrastructure.
- Familiarity with TailwindCSS, Biome, and monorepo tooling (pnpm, Turborepo).
- Previous background working at a fast-moving, venture-backed startup.`,
  },
  {
    id: 'ai-ml',
    title: 'AI Platform Engineer',
    tags: ['Python', 'FastAPI', 'RAG / Vector DB'],
    content: `Title: AI Platform & Infrastructure Engineer
Company: Nexus Intelligence
Location: Remote / Hybrid
Employment Type: Full-time
Salary: $160,000 - $210,000 + Stock Options

About the Role:
Nexus Intelligence is building enterprise generative AI orchestration systems. We are seeking an AI Platform Engineer to build scalable model serving infrastructure, evaluation frameworks, and retrieval-augmented generation (RAG) pipelines.

Key Responsibilities:
- Build high-throughput LLM inference pipelines, prompt caching layers, and vector retrieval pipelines.
- Implement evaluation benchmarks to monitor model drift, hallucination rates, and latency.
- Integrate vector databases (Pinecone, pgvector, Qdrant) with high-dimensional embedding search.
- Design secure, multi-tenant API gateways connecting frontends to foundation models.
- Deploy and manage containerized AI workloads on cloud clusters using Docker and Kubernetes.

Required Qualifications:
- 4+ years of experience with Python, FastAPI, and asynchronous backend development.
- Hands-on experience developing with LLM APIs (OpenAI, Anthropic, Gemini) and embedding models.
- Practical knowledge of vector search, embedding indexing, and RAG architectures.
- Experience with PostgreSQL, Redis, and message brokers (Kafka or RabbitMQ).
- Strong computer science fundamentals in algorithms, data structures, and system design.

Preferred Qualifications:
- Experience with PyTorch, vLLM, or model fine-tuning techniques (LoRA/QLoRA).
- Background in high-scale ML pipelines or data engineering.
- Contributions to open-source AI or developer tooling projects.`,
  },
  {
    id: 'frontend',
    title: 'Lead Frontend Architect',
    tags: ['React 19', 'Design Systems', 'Performance'],
    content: `Title: Lead Frontend Architect
Company: Pulse Studio
Location: Remote
Employment Type: Full-time
Salary: $150,000 - $195,000

About the Role:
Pulse Studio is seeking a Lead Frontend Architect to spearhead our web architecture, design system engineering, and frontend performance standards across multiple enterprise SaaS products.

Key Responsibilities:
- Lead the architectural vision for our Next.js and React 19 web applications.
- Build and maintain our shared Design System token architecture and accessible UI component library.
- Drive web performance optimization (Core Web Vitals, zero-layout-shift hydration, code splitting).
- Mentor engineering teams on best practices for state management, accessibility (a11y), and responsive design.
- Define CI/CD pipelines, code quality standards, and automated visual regression testing.

Required Qualifications:
- 7+ years of experience specializing in frontend web application development.
- Master-level understanding of modern JavaScript/TypeScript, HTML5, and CSS architecture.
- In-depth experience with React 19, Next.js App Router, and server components.
- Proven track record of designing and scaling enterprise component libraries.
- Strong passion for micro-animations, UX micro-interactions, and visual polish.

Preferred Qualifications:
- Experience with WebSockets, real-time collaboration, or Canvas/WebGL.
- Familiarity with TailwindCSS, Radix UI, and modern build tooling.`,
  },
];

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Form & Editor (8 cols on lg) */}
      <div className="lg:col-span-8">
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <Card className="border-border bg-card/70 p-5 sm:p-6 backdrop-blur-md shadow-xl rounded-2xl border">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="jd-textarea"
                    className="text-sm font-semibold text-foreground block"
                  >
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
              rows={15}
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
              className="w-full bg-background/50 border-border/80 rounded-xl p-4 text-xs sm:text-sm text-foreground font-mono focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary leading-relaxed min-h-[340px] resize-y"
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
      </div>

      {/* Right Column: AI Pipeline Guide & Sample Presets (4 cols on lg) */}
      <div className="lg:col-span-4 space-y-5">
        {/* Sample Roles Selector */}
        <Card className="border-border bg-card/60 p-5 backdrop-blur-md rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Load Sample JD</span>
            </h3>
            <span className="text-2xs text-muted-foreground">1-Click Test</span>
          </div>

          <div className="space-y-2">
            {SAMPLE_ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => onTextChange(role.content)}
                disabled={loading}
                className="w-full text-left p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/80 hover:border-primary/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {role.title}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-2xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Pipeline Execution Stages */}
        <Card className="border-border bg-card/60 p-5 backdrop-blur-md rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Praman AI Pipeline</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs">
                <span className="font-semibold text-foreground block">
                  Deterministic Schema Extraction
                </span>
                <span className="text-muted-foreground">
                  Separates required skills, preferred bonuses, seniority, and responsibilities.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl border border-border/50 bg-card/40 opacity-75">
              <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs">
                <span className="font-medium text-foreground block">
                  Semantic Candidate Scoring
                </span>
                <span className="text-muted-foreground">
                  Evaluates your profile alignment and pinpoints missing keyword gaps.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl border border-border/50 bg-card/40 opacity-75">
              <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div className="text-xs">
                <span className="font-medium text-foreground block">Targeted ATS Resume</span>
                <span className="text-muted-foreground">
                  Generates tailoring strategies and optimized bullet points for the role.
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pro Tips */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/40 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-1.5 text-foreground font-semibold">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            <span>Extraction Pro Tip</span>
          </div>
          <p className="leading-relaxed">
            Praman automatically filters out company marketing fluff and isolates actionable
            qualification requirements.
          </p>
        </div>
      </div>
    </div>
  );
}
