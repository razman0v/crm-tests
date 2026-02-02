import { Page, Locator, expect } from '@playwright/test';
import { TestConfig } from '../../config/config.interface';

export class LoginPage {
  readonly page: Page;
  readonly config: TestConfig;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  
  readonly smsInput: Locator;
  
  readonly roleEmployeeRadio: Locator;
  
  readonly companySelect: Locator;
  readonly companySearchInput: Locator;
  readonly companyOption: Locator;

  constructor(page: Page, config: TestConfig) {
    this.page = page;
    this.config = config;

    this.usernameInput = page.getByLabel(/login|email|phone/i); 
    this.passwordInput = page.getByLabel(/Пароль|password/i);
    this.loginButton = page.locator('button[type="submit"]');

    this.smsInput = page.locator('input[type="number"]').first();

    this.roleEmployeeRadio = page.getByText(/сотрудник/i);

    this.companySelect = page.locator('.DropDownFieldView__selected-items').first();
    this.companySearchInput = page.locator('input[type="search"]');
    this.companyOption = page.getByText(this.config.features.secondCompanyName);
    this.loginButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto(this.config.baseUrl);
  }

  async performLogin() {
   
    console.log('Filling credentials...');
    await this.usernameInput.fill(this.config.credentials.admin.username);
    await this.passwordInput.fill(this.config.credentials.admin.password);
    await this.loginButton.click();

    console.log('Waiting for SMS input...');
    await this.smsInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.smsInput.fill(this.config.features.smsCode);
    

    console.log('Selecting Role...');
    await this.roleEmployeeRadio.waitFor(); 
    await this.roleEmployeeRadio.click();

    console.log('Selecting Company...');
    await this.companySelect.waitFor();
    await this.companySelect.click();
    await this.companySearchInput.fill(this.config.features.secondCompanyName);
    await this.companyOption.click();

    console.log('Finalizing login...');
    await expect(this.page).toHaveURL(this.config.features.mainPageUrl);
    console.log('Login successful!');
  }
}
