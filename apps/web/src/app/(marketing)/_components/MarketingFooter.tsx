import { BrandLogo } from '@/components/BrandLogo';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/40 backdrop-blur-md py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <BrandLogo href="/" size="sm" />
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Truth-Preserving AI Resume Pipeline. 100% verified candidate facts, zero hallucinations.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span>Prisma 8 PSL Engine</span>
          <span>•</span>
          <span>Deterministic Verification</span>
          <span>•</span>
          <span>ATS LaTeX & PDF</span>
        </div>
      </div>
    </footer>
  );
}
