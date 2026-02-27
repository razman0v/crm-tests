import { Page, Locator, expect } from '@playwright/test';
import { config } from 'process';

export class MainPage {
  readonly page: Page;
  readonly config: any;

  readonly logo: Locator;

  constructor(page: Page, config: any) {
    this.page = page;
    this.config = config;
    this.logo = page.getByText('Сlinicist', { exact: true });
  }

  async goto() {
    await this.page.goto(this.config.features.mainPageUrl);
  }

  async checkLogo() {
    // Try to find a visit or navigate to visits list
    const visitLink = this.logo;
    await expect(visitLink).toHaveText('Сlinicist');
  }
}