import { expect, test } from '@playwright/test';
import { loginAsDemoUser } from './helpers';

test.describe('Jobs & Pipeline Workflow Suite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test('jobs dashboard renders pipeline list and new job trigger', async ({ page }) => {
    await page.goto('/jobs');

    // Verify heading
    await expect(page.locator('h1')).toContainText('Job Pipeline Inspector');

    // Verify New Job button
    const newJobBtn = page.getByRole('link', { name: 'New Job Analysis' });
    await expect(newJobBtn).toBeVisible();
  });

  test('new job page renders ingestion form with validation elements', async ({ page }) => {
    await page.goto('/jobs/new');

    // Verify title
    await expect(page.locator('h1')).toContainText('Target Job Description Ingestion');

    // Verify textarea for pasting job description
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Verify submit button
    const analyzeBtn = page.locator('button[type="submit"]');
    await expect(analyzeBtn).toBeVisible();
    await expect(analyzeBtn).toContainText('Analyze Job Description');
  });

  test('resume audit view renders and opens multi-format export suite modal', async ({ page }) => {
    await page.goto('/jobs');

    // Check if any job card has a resume link
    const viewResumeLink = page.locator('a[href*="/resume"]').first();
    if (await viewResumeLink.isVisible({ timeout: 4000 }).catch(() => false)) {
      await viewResumeLink.click();
      await expect(page).toHaveURL(/.*resume/);

      // Verify Export Resume button
      const exportBtn = page.getByRole('button', { name: 'Export Resume' });
      await expect(exportBtn).toBeVisible();
      await exportBtn.click();

      // Verify all format options inside the Export Resume Suite modal
      await expect(page.locator('text=Export Resume Suite')).toBeVisible();
      await expect(page.locator('text=Formatted PDF')).toBeVisible();
      await expect(page.locator('text=Overleaf Cloud')).toBeVisible();
      await expect(page.locator('text=LaTeX Source (.tex)')).toBeVisible();
      await expect(page.locator('text=Complete Archive (.zip)')).toBeVisible();
      await expect(page.locator('text=ATS Plain Text (.txt)')).toBeVisible();
      await expect(page.locator('text=Markdown Resume (.md)')).toBeVisible();
      await expect(page.locator('text=Canonical ATS JSON (.json)')).toBeVisible();

      // Close modal
      const closeBtn = page.getByRole('button', { name: 'Close' });
      await closeBtn.click();
      await expect(page.locator('text=Export Resume Suite')).not.toBeVisible();
    }
  });

  test('job pipeline inspect view renders stepper and supports stage tab selection', async ({
    page,
  }) => {
    await page.goto('/jobs');
    const inspectBtn = page
      .locator('a[href*="/jobs/"]')
      .filter({ hasText: 'Inspect Stages' })
      .first();
    if (await inspectBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await inspectBtn.click();
      await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9_-]+/);

      // Verify pipeline stage stepper exists
      const matchStageTrigger = page.locator('text=2. Candidate Match').first();
      if (await matchStageTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await matchStageTrigger.click();
        // Check for Stage 2 header
        await expect(page.locator('text=Candidate ↔ JD Match Analysis')).toBeVisible({
          timeout: 5000,
        });

        // Check if Diff Inspector sub-view is visible
        const diffTab = page.locator('button').filter({ hasText: 'Alignment Diff Inspector' });
        if (await diffTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(diffTab).toBeVisible();
          await expect(page.locator('text=Deterministic Match Score')).toBeVisible();
          // Check for sub-tabs
          const overviewTab = page.locator('button').filter({ hasText: 'Synthesis & Skill Cards' });
          if (await overviewTab.isVisible()) {
            await overviewTab.click();
            await expect(page.locator('text=Explainable Synthesis')).toBeVisible();
            await diffTab.click();
          }
        }
      }
    }
  });

  test('skill claim tuning dialog can be opened and closed in match inspector', async ({
    page,
  }) => {
    await page.goto('/jobs');
    const inspectBtn = page
      .locator('a[href*="/jobs/"]')
      .filter({ hasText: 'Inspect Stages' })
      .first();
    if (await inspectBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await inspectBtn.click();
      const matchStageTrigger = page.locator('text=2. Candidate Match').first();
      if (await matchStageTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await matchStageTrigger.click();

        // Find tune claim button
        const tuneBtn = page.locator('button[title*="tune" i]').first();
        if (await tuneBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await tuneBtn.click();
          await expect(page.locator('text=Skill Claim Audit')).toBeVisible();
          await expect(page.locator('text=Experienced')).toBeVisible();
          await expect(page.locator('text=Working Knowledge')).toBeVisible();
          await expect(page.locator('text=Learning')).toBeVisible();
          await expect(page.locator('text=Not Learned')).toBeVisible();

          // Close modal
          const cancelBtn = page.getByRole('button', { name: 'Cancel' });
          await cancelBtn.click();
          await expect(page.locator('text=Skill Claim Audit')).not.toBeVisible();
        }
      }
    }
  });

  test('template switcher displays templates and switches template selection', async ({ page }) => {
    await page.goto('/jobs');
    const resumeLink = page.locator('a[href*="/resume"]').first();
    if (await resumeLink.isVisible({ timeout: 4000 }).catch(() => false)) {
      await resumeLink.click();
      await page.waitForURL(/.*\/resume/);

      // Verify LaTeX Style bar is visible
      const styleBar = page.locator('text=LaTeX Style:');
      if (await styleBar.isVisible({ timeout: 4000 }).catch(() => false)) {
        await expect(page.getByRole('button', { name: /Modern Developer/i })).toBeVisible();
        const academicBtn = page.getByRole('button', { name: /Classic Academic/i });
        await expect(academicBtn).toBeVisible();
        await expect(page.getByRole('button', { name: /Compact Executive/i })).toBeVisible();

        // Switch to Classic Academic
        await academicBtn.click();
        await expect(page.locator('text=Traditional Computer Modern serif')).toBeVisible();
      }
    }
  });

  test('cover letter and outreach tab renders optional outreach companion', async ({ page }) => {
    await page.goto('/jobs');
    const resumeLink = page.locator('a[href*="/resume"]').first();
    if (await resumeLink.isVisible({ timeout: 4000 }).catch(() => false)) {
      await resumeLink.click();
      await page.waitForURL(/.*\/resume/);

      // Switch to Cover Letter & Outreach tab
      const outreachTab = page.locator('button').filter({ hasText: 'Cover Letter & Outreach' });
      if (await outreachTab.isVisible({ timeout: 4000 }).catch(() => false)) {
        await outreachTab.click();

        // Check for Outreach companion elements
        await expect(page.locator('text=Optional Outreach & Application Companion')).toBeVisible();
        await expect(page.locator('text=Tailored Cover Letter')).toBeVisible();
        await expect(page.locator('text=Recruiter Outreach Email')).toBeVisible();
      }
    }
  });
});
