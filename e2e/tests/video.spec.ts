import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should render properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should render without errors
    await expect(page.locator('body')).toBeVisible();

    // Check that heading is visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should render properly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should render properly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure on home page', async ({ page }) => {
    await page.goto('/');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should have proper heading structure on login page', async ({ page }) => {
    await page.goto('/login');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should have accessible form on login page', async ({ page }) => {
    await page.goto('/login');

    // Check that form inputs have labels
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should have focusable interactive elements', async ({ page }) => {
    await page.goto('/');

    // Verify there are interactive elements that can receive focus
    const links = page.getByRole('link');
    const buttons = page.getByRole('button');

    // Page should have at least one link or button
    const linkCount = await links.count();
    const buttonCount = await buttons.count();
    expect(linkCount + buttonCount).toBeGreaterThan(0);

    // Verify at least one interactive element is visible
    if (linkCount > 0) {
      await expect(links.first()).toBeVisible();
    } else {
      await expect(buttons.first()).toBeVisible();
    }
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.getByRole('button', { name: /sign in/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });
});

test.describe('Page Load', () => {
  test('home page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('login page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('register page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/register');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
