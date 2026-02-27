import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { TestConfig } from '../config/config.interface';

export class MainPage extends BasePage {
  readonly logo: Locator;

  constructor(page: Page, config: TestConfig) {
    super(page, config);
    this.logo = page.getByText('Сlinicist', { exact: true });
  }

  async goto() {
    this.logger.info('Navigating to main page');
    await super.goto(this.config.features.mainPageUrl || '/');
  }

  async checkLogo() {
    this.logger.info('Verifying logo is visible');
    await expect(this.logo).toHaveText('Сlinicist');
    this.logger.info('✅ Logo verified');
  }
}