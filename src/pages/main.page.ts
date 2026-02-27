import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { TestConfig } from '../config/config.interface';

export class MainPage extends BasePage {
  readonly logo: Locator;

  constructor(page: Page, config: TestConfig) {
    super(page, config);
    // Use semantic role selector + regex for i18n compatibility
    // Matches both 'Clinicist' (English) and 'Клиницист' (Russian)
    this.logo = page.getByRole('heading', { name: /clinicist|клиницист/i });
  }

  async goto() {
    // mainPageUrl should be a path (e.g., '/dashboard'), not full URL
    // BasePage.goto() will prepend baseUrl automatically
    const targetPath = this.config.features.mainPageUrl || '/dashboard';
    this.logger.debug('MainPage: navigating', { path: targetPath });
    
    try {
      // Call parent goto with PATH only, not full URL
      await super.goto(targetPath);
      this.logger.info('MainPage: navigation successful', { path: targetPath });
    } catch (error) {
      this.logger.error('MainPage: navigation failed', {
        error: String(error),
        attemptedPath: targetPath,
      });
      throw error;
    }
  }

  async checkLogo() {
    this.logger.info('MainPage: verifying logo is visible and contains expected text');
    
    try {
      // 1. Wait for logo to be visible (not just in DOM)
      await expect(this.logo).toBeVisible({ timeout: 5000 });
      this.logger.debug('MainPage: logo is visible');
      
      // 2. Verify it has the expected text (i18n-safe)
      await expect(this.logo).toHaveText(/clinicist|клиницист/i);
      this.logger.debug('MainPage: logo text verified');
      
      // 3. Verify it's in the viewport (accessibility)
      const box = await this.logo.boundingBox();
      if (!box) {
        throw new Error('Logo bounding box is null (element may be hidden or detached)');
      }
      this.logger.info('MainPage: ✅ logo fully verified', { 
        logoBox: { width: box.width, height: box.height } 
      });
    } catch (error) {
      this.logger.error('MainPage: logo verification failed', {
        error: String(error),
      });
      throw error;
    }
  }
}