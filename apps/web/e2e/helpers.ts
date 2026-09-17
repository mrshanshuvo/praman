import { expect, type Page } from '@playwright/test';

export async function loginAsDemoUser(page: Page) {
  await page.goto('/login');

  const demoBtn = page.getByRole('button', { name: /Fill Seeded Demo Credentials/i });
  await expect(demoBtn).toBeVisible({ timeout: 5000 });
  await demoBtn.click();

  const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });
  await expect(signInBtn).toBeVisible();
  await signInBtn.click();

  // Wait for authenticated redirect to profile
  await expect(page).toHaveURL(/.*profile/, { timeout: 15000 });
}
