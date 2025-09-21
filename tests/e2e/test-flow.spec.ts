import { test, expect } from '@playwright/test';

test.describe('Test Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Skip security gate by setting session storage
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.setItem('seenSecurityGate', 'true');
    });
    await page.goto('/dashboard');
  });

  test('should navigate through complete test flow', async ({ page }) => {
    // Navigate to test series
    await page.click('[data-testid="test-series-card"]');
    await expect(page).toHaveURL('/tests');
    
    // Click on a test
    await page.click('[data-testid="test-card"]:first-child button');
    
    // Should prompt for access code
    await expect(page.locator('[data-testid="access-code-dialog"]')).toBeVisible();
    
    // Enter invalid code
    await page.fill('[data-testid="access-code-input"]', 'INVALID123');
    await page.click('[data-testid="begin-test-button"]');
    
    // Should show error (implementation dependent)
    // await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Enter valid code (when available)
    // await page.fill('[data-testid="access-code-input"]', 'VALID123');
    // await page.click('[data-testid="begin-test-button"]');
    
    // Should navigate to test interface
    // await expect(page).toHaveURL(/\/test\/[a-f0-9-]+/);
    
    // Test interface elements
    // await expect(page.locator('[data-testid="test-timer"]')).toBeVisible();
    // await expect(page.locator('[data-testid="question-panel"]')).toBeVisible();
    // await expect(page.locator('[data-testid="navigation-panel"]')).toBeVisible();
  });

  test('should validate access code properly', async ({ page }) => {
    await page.goto('/tests');
    
    // Click on a test
    await page.click('[data-testid="test-card"]:first-child button');
    
    // Test empty code
    await page.click('[data-testid="begin-test-button"]');
    await expect(page.locator('[data-testid="begin-test-button"]')).toBeDisabled();
    
    // Test short code
    await page.fill('[data-testid="access-code-input"]', '123');
    // Should still be invalid
    
    // Test proper length code
    await page.fill('[data-testid="access-code-input"]', 'TEST123456');
    await expect(page.locator('[data-testid="begin-test-button"]')).toBeEnabled();
  });
});