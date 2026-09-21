"use client";

import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function LandingHero() {
  return (
    <div className="py-12 sm:py-20 relative overflow-hidden text-center space-y-8">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-150 h-96 bg-brand-cyan/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-xs font-semibold shadow-2xs">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Truth-Preserving Resume Engine</span>
        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
      </div>

      {/* Hero Headline */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
          Stop letting AI hallucinate your career accomplishments.
        </h1>
        <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Praman parses job descriptions, cross-audits candidate facts, and
          crafts tailored, ATS-compliant resumes backed by strict source-ID
          evidence validation.
        </p>
      </div>

      {/* Call to Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/register"
          className={buttonVariants({
            size: "lg",
            className:
              "bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-bold text-sm h-11 px-6 rounded-xl shadow-md transition cursor-pointer",
          })}
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Link>

        <a
          href="#pipeline"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className:
              "border-border hover:bg-muted font-semibold text-sm h-11 px-6 rounded-xl transition cursor-pointer",
          })}
        >
          <span>See How It Works</span>
        </a>
      </div>

      {/* Interactive Fact-Check Preview Card */}
      <div className="max-w-2xl mx-auto pt-6">
        <div className="p-5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-xl text-left space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-foreground">
                Anti-Hallucination Proof
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold"
            >
              Audited & Traceable
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                Target JD Requirement
              </span>
              <p className="text-foreground/90 font-medium mt-0.5">
                &ldquo;Experience building event-driven architectures with Kafka
                and Go.&rdquo;
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold">
                <span>Tailored Resume Bullet</span>
                <span className="font-mono">Ref: Experience #3 (Zensoft)</span>
              </div>
              <p className="text-foreground/90 mt-1 leading-relaxed">
                &ldquo;Architected event-driven streaming pipeline in Go using
                Kafka, reducing message latency by 35%.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero fabricated skills or unverified metrics</span>
            </div>
            <span className="font-mono text-[10px]">
              Deterministic Audit Passed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
