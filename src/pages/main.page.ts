import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { config } from '../config/config.interface';

export class MainPage extends BasePage {
  readonly logo: Locator;

  constructor(page: Page, config: config) {
    super(page, config);
    this.logo = page.getByRole('link');
  }

  async goto() {
    const targetPath = this.config.features.mainPageUrl || '/';
    this.logger.debug('MainPage: navigating', { path: targetPath });
    
    try {
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
      await expect(this.logo).toHaveText('Сlinicist');
      this.logger.debug('MainPage: logo', { text: await this.logo.textContent() });
      
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