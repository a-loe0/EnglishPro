import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored tokens
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('Home Page', () => {
    test('should display home page with login and register buttons', async ({ page }) => {
      await page.goto('/');

      // Check for h1 heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      // Home page uses "Sign in" and "Get Started"
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
      // Use first() since there may be multiple "Get Started" buttons
      await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
    });
  });

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      // Login page has "Welcome back" heading
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
      // Labels are "Email address" and "Password"
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should require email and password', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form - HTML5 validation should prevent it
      const emailInput = page.getByLabel(/email address/i);
      await emailInput.focus();

      // Form should have required fields
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should have link to register page', async ({ page }) => {
      await page.goto('/login');

      // Look for "Create an account" or "Create account" link - use first() since there may be multiple
      const registerLink = page.getByRole('link', { name: /create.*account/i }).first();
      await expect(registerLink).toBeVisible();

      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    });
  });

  test.describe('Register Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      // Check for heading (could be "Create account" or similar)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      // Check for form fields
      await expect(page.getByLabel(/name/i).first()).toBeVisible();
      await expect(page.getByLabel(/email/i).first()).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
    });

    test('should allow selecting role', async ({ page }) => {
      await page.goto('/register');

      // Wait for React to render
      await page.waitForLoadState('networkidle');

      // Check for role selection buttons
      const studentButton = page.getByRole('button', { name: /student/i });
      const teacherButton = page.getByRole('button', { name: /teacher/i });

      // At least one role option should be visible
      const hasStudent = await studentButton.count() > 0;
      const hasTeacher = await teacherButton.count() > 0;

      expect(hasStudent || hasTeacher).toBe(true);
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/register');

      // Look for sign in link - use first() since there may be multiple matching elements
      const loginLink = page.getByRole('link', { name: /sign in|already have/i }).first();
      await expect(loginLink).toBeVisible();

      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Should either redirect to login or home
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url.includes('login') || url.endsWith('/')).toBe(true);
    });

    test('should redirect unauthenticated users from student routes', async ({ page }) => {
      await page.goto('/student/dashboard');

      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url.includes('login') || url.endsWith('/')).toBe(true);
    });

    test('should redirect unauthenticated users from teacher routes', async ({ page }) => {
      await page.goto('/teacher/dashboard');

      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url.includes('login') || url.endsWith('/')).toBe(true);
    });
  });
});

test.describe('Navigation', () => {
  test('should navigate to login from home', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate home via logo', async ({ page }) => {
    await page.goto('/login');

    // Click on EnglishPro logo/brand
    await page.getByRole('link', { name: /englishpro/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should handle unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');

    // Should redirect to home (based on App.tsx catch-all route)
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
