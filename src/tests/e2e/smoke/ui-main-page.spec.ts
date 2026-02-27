import { test, expect } from '@playwright/test';
import { MainPage } from '../../../pages/main.page';
import { getConfig } from '../../../config/env-loader';

/**
 * Smoke Test: Main Page UI Validation
 * 
 * Prerequisites:
 * - Requires 'setup' project (auth.setup.ts) to run first
 * - Cookies/auth tokens pre-injected via storageState in playwright.config.ts
 * - Config must have mainPageUrl set to valid dashboard/home path (e.g., '/dashboard')
 */
test.describe('Smoke: Main Page UI', () => {
  test('should load main page and display logo', async ({ page }) => {
    const config = getConfig();
    
    // Validate mainPageUrl is set
    if (!config.features.mainPageUrl) {
      test.skip();
      throw new Error(
        'mainPageUrl is not configured. Set MAIN_PAGE_URL env var or update dev.config.ts. ' +
        'Example: MAIN_PAGE_URL=/dashboard'
      );
    }

    const mainPage = new MainPage(page, config);

    // 1. Navigate to main page (auth cookies already injected by setup project)
    await mainPage.goto();

    // 2. Verify logo is visible, has correct text, and is in viewport
    await mainPage.checkLogo();

    // 3. Additional smoke checks—URL should contain mainPageUrl path
    await expect(page).toHaveURL(new RegExp(config.features.mainPageUrl));
  });

  test('should redirect unauthenticated users to login', async ({ browser }) => {
    // Create a fresh context WITHOUT auth state
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    const config = getConfig();
    const mainPage = new MainPage(freshPage, config);

    try {
      await mainPage.goto();
      
      // Should redirect to login instead of loading main page
      await expect(freshPage).toHaveURL(/login|auth/i, { timeout: 5000 });
    } finally {
      await freshContext.close();
    }
  });
});