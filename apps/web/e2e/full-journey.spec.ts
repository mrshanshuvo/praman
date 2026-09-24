import { expect, test } from '@playwright/test';
import { loginAsDemoUser } from './helpers';

test.describe('End-to-End Full User Journey Suite', () => {
  test.setTimeout(180000);

  test('complete journey: JD ingestion -> 4-stage pipeline streaming -> resume audit studio -> PDF export', async ({
    page,
  }) => {
    // ─── Phase 1: Authentication ───────────────────────────────────────────
    await loginAsDemoUser(page);

    // ─── Phase 2: Target JD Ingestion (Stage 1) ───────────────────────────
    await page.goto('/jobs/new');
    await expect(page.locator('h1')).toContainText('Target Job Description Ingestion');

    const uniqueId = Date.now();
    const targetJobTitle = `Staff Distributed Systems Engineer (Run-${uniqueId})`;
    const sampleJdText = `
Job Title: ${targetJobTitle}
Company: CloudScale Infrastructure Inc.
Location: Remote (US/Canada)
Seniority: Staff / Principal

About the Role:
We are looking for a Staff Distributed Systems Engineer to design, architect, and optimize
our high-throughput distributed event streaming platform and Kubernetes-native microservices.

Core Responsibilities:
- Architect and scale low-latency distributed systems processing 500k+ events/sec
- Design resilient TypeScript, Go, and Node.js microservices with gRPC and REST APIs
- Lead database architecture and schema modeling with PostgreSQL, Redis, and Kafka
- Ensure 99.99% system reliability, automated CI/CD deployment, and observability

Requirements & Technical Skills:
- 7+ years of experience building mission-critical scalable backend architectures
- Deep mastery of TypeScript, Node.js, NestJS, and modern full-stack web platforms
- Production expertise with PostgreSQL, Redis, Kafka, and distributed data systems
- Strong background in Docker, Kubernetes, Terraform, and cloud infrastructure (AWS/GCP)
- Proven track record of zero-downtime database migrations and automated testing
    `.trim();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill(sampleJdText);

    const submitBtn = page.getByRole('button', { name: 'Analyze Job Description' });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify Stage 1 completion and result display
    await expect(
      page.locator('text=Stage 1 Complete: Job Description Extracted & Saved'),
    ).toBeVisible({ timeout: 20000 });

    // Launch pipeline / inspect stages
    const inspectBtn = page.getByRole('button', { name: 'Inspect & Run Pipeline' });
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // ─── Phase 3: 4-Stage Pipeline Inspection & Streaming ─────────────────
    await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9_-]+/, { timeout: 15000 });

    // Verify Job Header renders
    await expect(page.locator('h1')).toBeVisible();

    // Explicitly click Run Full Pipeline to trigger the SSE streaming pipeline
    const runPipelineBtn = page.getByRole('button', { name: /Run Full Pipeline/i });
    await expect(runPipelineBtn).toBeVisible({ timeout: 15000 });
    await runPipelineBtn.click();

    // Wait for pipeline stream to finish and automatically reveal the "Full Audit Page" link
    const fullAuditLink = page.getByRole('link', { name: /Full Audit Page/i });
    await expect(fullAuditLink).toBeVisible({ timeout: 120000 });

    // ─── Phase 4: Resume Audit Studio ─────────────────────────────────────
    await fullAuditLink.click();
    await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9_-]+\/resume/, { timeout: 15000 });

    // Verify Resume Audit Header elements
    await expect(page.locator('text=LaTeX Style:')).toBeVisible({ timeout: 10000 });
    const downloadPdfBtn = page.getByRole('button', { name: 'Download PDF' });
    await expect(downloadPdfBtn).toBeVisible();

    // Test LaTeX Template Switcher
    const academicTmplBtn = page.getByRole('button', { name: /Classic Academic/i });
    if (await academicTmplBtn.isVisible()) {
      await academicTmplBtn.click();
      await expect(page.locator('text=Traditional Computer Modern serif')).toBeVisible();
    }

    const developerTmplBtn = page.getByRole('button', { name: /Modern Developer/i });
    if (await developerTmplBtn.isVisible()) {
      await developerTmplBtn.click();
      await expect(page.locator('text=Clean Helvetica sans-serif')).toBeVisible();
    }

    // Verify Tab Navigation (Evidence Audit, Outreach)
    const outreachTab = page
      .locator('button[role="tab"]')
      .filter({ hasText: /Cover Letter & Outreach/i })
      .first();
    if (await outreachTab.isVisible()) {
      await outreachTab.click();
      await expect(page.locator('text=Optional Outreach & Application Companion')).toBeVisible();
    }

    // Return to Resume Studio Tab
    const studioTab = page
      .locator('button[role="tab"]')
      .filter({ hasText: /Resume Studio/i })
      .first();
    if (await studioTab.isVisible()) {
      await studioTab.click();
    }

    // ─── Phase 5: Multi-Format PDF Export Suite ───────────────────────────
    const exportOptionsBtn = page.getByRole('button', { name: 'Export options' });
    await expect(exportOptionsBtn).toBeVisible();
    await exportOptionsBtn.click();

    // Select "All Export Formats..." from the dropdown menu
    const allFormatsItem = page.getByRole('menuitem', { name: /All Export Formats/i });
    await expect(allFormatsItem).toBeVisible();
    await allFormatsItem.click();

    // Verify Export Suite Modal is presented with all export formats
    const modal = page.getByRole('dialog', { name: 'Export Resume Suite' });
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByRole('heading', { name: 'ATS Resume PDF' })).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Overleaf Cloud' })).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'LaTeX Source (.tex)' })).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Complete Archive (.zip)' })).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'ATS Plain Text (.txt)' })).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Markdown Resume (.md)' })).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Canonical ATS JSON (.json)' })).toBeVisible();

    // Test ATS Plain Text copy action inside modal
    const copyTxtBtn = modal.getByRole('button', { name: 'Copy Plain Text' });
    await expect(copyTxtBtn).toBeVisible();
    await copyTxtBtn.click();

    // Close the export suite modal
    const closeBtn = modal.getByRole('button', { name: 'Close' }).first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
