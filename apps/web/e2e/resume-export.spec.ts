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
    const newJobBtn = page.locator('a[href="/jobs/new"]');
    await expect(newJobBtn).toBeVisible();
    await expect(newJobBtn).toContainText('New Job Analysis');
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

      // Verify all 6 format options inside the Export Resume Suite modal
      await expect(page.locator('text=Export Resume Suite')).toBeVisible();
      await expect(page.locator('text=Formatted PDF')).toBeVisible();
      await expect(page.locator('text=Overleaf Cloud')).toBeVisible();
      await expect(page.locator('text=LaTeX Source (.tex)')).toBeVisible();
      await expect(page.locator('text=Project Bundle (.zip)')).toBeVisible();
      await expect(page.locator('text=ATS Plain Text (.txt)')).toBeVisible();
      await expect(page.locator('text=Verified Data (.json)')).toBeVisible();

      // Close modal
      const closeBtn = page.getByRole('button', { name: 'Close' });
      await closeBtn.click();
      await expect(page.locator('text=Export Resume Suite')).not.toBeVisible();
    }
  });
});
