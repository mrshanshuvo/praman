import { expect, test } from '@playwright/test';

test.describe('Authentication & Navigation Suite', () => {
  test('login page renders with brand identity, inputs, and demo fill button', async ({ page }) => {
    await page.goto('/login');

    // Verify brand identity logo
    await expect(page.locator('text=praman')).toBeVisible();

    // Verify description text
    await expect(page.locator('text=Access your verified candidate profile')).toBeVisible();

    // Verify input fields
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Verify submit button & demo credentials button
    const submitBtn = page.getByRole('button', { name: 'Sign In', exact: true });
    await expect(submitBtn).toBeVisible();

    const demoBtn = page.getByRole('button', { name: /Fill Seeded Demo Credentials/i });
    await expect(demoBtn).toBeVisible();

    // Verify link to register
    const registerLink = page.getByRole('link', { name: /Create an account/i });
    await expect(registerLink).toBeVisible();
  });

  test('register page renders with account creation inputs', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('text=praman')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(2); // Password + Confirm Password

    const loginLink = page.getByRole('link', { name: /Sign In/i });
    await expect(loginLink).toBeVisible();
  });

  test('unauthenticated route access redirects to login', async ({ page }) => {
    await page.goto('/jobs');
    // AuthProvider should redirect unauthenticated session to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('login with demo credentials successfully authenticates and redirects to profile', async ({
    page,
  }) => {
    await page.goto('/login');

    const demoBtn = page.getByRole('button', { name: /Fill Seeded Demo Credentials/i });
    await demoBtn.click();

    const submitBtn = page.getByRole('button', { name: 'Sign In', exact: true });
    await submitBtn.click();

    await expect(page).toHaveURL(/.*profile/, { timeout: 15000 });
  });

  test('non-existent route gracefully displays branded 404 error page', async ({ page }) => {
    await page.goto('/some-invalid-page-that-does-not-exist');

    // Verify 404 badge
    await expect(page.locator('text=Error 404')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Page Not Found');

    // Verify navigation links
    await expect(page.locator('a[href="/jobs"]')).toBeVisible();
    await expect(page.locator('a[href="/profile"]')).toBeVisible();
  });
});
