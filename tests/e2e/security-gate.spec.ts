import { test, expect } from '@playwright/test';

test.describe('Security Gate', () => {
  test('should display security gate for 5-6 seconds then redirect to dashboard', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Should see the security gate
    await expect(page.locator('[data-testid="security-gate"]')).toBeVisible();
    
    // Should see IST clock
    await expect(page.locator('[data-testid="ist-clock"]')).toBeVisible();
    await expect(page.locator('[data-testid="ist-clock"]')).toContainText('IST');
    
    // Should see session timer
    await expect(page.locator('[data-testid="session-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-timer"]')).toContainText('Time on site:');
    
    // Wait for auto-redirect (6 seconds + buffer)
    await page.waitForTimeout(7000);
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Security gate should not show again in same session
    await page.goto('/');
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should show security gate again in new session', async ({ page, context }) => {
    // First visit
    await page.goto('/');
    await page.waitForTimeout(7000);
    await expect(page).toHaveURL('/dashboard');
    
    // Close context (simulates browser close)
    await context.close();
    
    // New context/session
    const newContext = await page.context().browser()?.newContext();
    const newPage = await newContext?.newPage();
    
    if (newPage) {
      await newPage.goto('/');
      await expect(newPage.locator('[data-testid="security-gate"]')).toBeVisible();
    }
  });
});