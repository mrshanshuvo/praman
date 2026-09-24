import { expect, test } from '@playwright/test';
import { loginAsDemoUser } from './helpers';

test.describe('Candidate Profile & Ground-Truth Ledger Suite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
    await page.goto('/profile');
  });

  test('profile page renders with tabs and header card', async ({ page }) => {
    // Verify navigation tabs (some contain count badges)
    await expect(page.getByRole('button', { name: 'Summary & Bio', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Experiences/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Projects/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Skills & Levels/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Education/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Certifications/ })).toBeVisible();
  });

  test('tab switching updates visible content cleanly', async ({ page }) => {
    // Click Skills tab
    const skillsTab = page.getByRole('button', { name: /^Skills & Levels/ });
    await skillsTab.click();

    // Verify Skills tab content appears
    await expect(page.locator('text=Skills & Competencies')).toBeVisible();

    // Click Experiences tab
    const expTab = page.getByRole('button', { name: /^Experiences/ });
    await expTab.click();

    // Verify Experiences tab content appears
    await expect(page.locator('text=Work Experience')).toBeVisible();

    // Click Summary & Bio tab
    const bioTab = page.getByRole('button', { name: 'Summary & Bio', exact: true });
    await bioTab.click();

    // Verify Professional Summary card appears
    await expect(page.locator('text=Professional Summary')).toBeVisible();
  });

  test('edit profile dialog can be opened and closed', async ({ page }) => {
    // Find and click Edit Details button
    const editBtn = page.getByRole('button', { name: 'Edit Details' });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Verify dialog is open
    await expect(page.locator('text=Edit Candidate Identity & Details')).toBeVisible();

    // Click Cancel to close
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    await cancelBtn.click();

    // Dialog should be dismissed
    await expect(page.locator('text=Edit Candidate Identity & Details')).not.toBeVisible();
  });
});
