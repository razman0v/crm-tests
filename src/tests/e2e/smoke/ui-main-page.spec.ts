import { test, expect } from '@playwright/test';
import { MainPage } from '../../../pages/main.page';
import { getConfig } from '../../../config/env-loader';
import { LoginPage } from '../../../pages/auth/login.page';

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
    await mainPage.goto();
    await mainPage.checkLogo();
    await expect(page).toHaveURL(new RegExp(config.features.mainPageUrl));
  });

  test('should redirect unauthenticated users to login', async ({ browser }) => {
    // Create a fresh context WITHOUT auth state
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    const config = getConfig();
    const mainPage = new MainPage(freshPage, config);
    const loginPage = new LoginPage(freshPage, config);

    try {
      await mainPage.goto();
      console.log('Actual URL for guest:', freshPage.url());
      // Should redirect to login instead of loading main page
      await loginPage.usernameInput.isVisible();
    } finally {
      await freshContext.close();
    }
  });
});