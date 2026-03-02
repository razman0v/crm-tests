import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { TestConfig } from '../../config/config.interface';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly smsInput: Locator;
  readonly roleEmployeeRadio: Locator;
  readonly companySelect: Locator;
  readonly companySearchInput: Locator;
  readonly companyOption: Locator;

  constructor(page: Page, config: TestConfig) {
    super(page, config);

    this.usernameInput = page.getByLabel(/login|email|phone/i);
    this.passwordInput = page.getByLabel(/Пароль|password/i);
    this.loginButton = page.getByText('Войти', { exact: true });

    this.smsInput = page.getByLabel(/Please enter OTP character 1/i);

    this.roleEmployeeRadio = page.getByText(/Я сотрудник/i);

    this.companySelect = page.locator('.FieldLayoutView')
      .filter({ hasText: 'Выберите компанию:' })
      .locator('.DropDownFieldView');
    this.companySearchInput = page.getByPlaceholder(/Начните вводить символы для поиска.../i);
    this.companyOption = page.getByText(this.config.features.secondCompanyName);
  }

  async goto() {
    this.logger.debug('LoginPage: navigating to login');
    await super.goto();
  }

  async performLogin() {
    this.logger.info('LoginPage: starting login flow');

    this.logger.debug('LoginPage: filling credentials');
    await this.usernameInput.fill(this.config.credentials.admin.username);
    await this.passwordInput.fill(this.config.credentials.admin.password);
    await this.loginButton.click();

    this.logger.debug('LoginPage: waiting for SMS input');
    await this.smsInput.waitFor();
    await this.smsInput.fill(this.config.features.smsCode);

    this.logger.debug('LoginPage: selecting role');
    await this.roleEmployeeRadio.waitFor();
    await this.roleEmployeeRadio.click();

    this.logger.debug('LoginPage: selecting company');
    await this.companySelect.waitFor();
    await this.companySelect.click();
    await this.companySearchInput.fill(this.config.features.secondCompanyName);
    await this.companyOption.click();

    this.logger.debug('LoginPage: finalizing login');
    await this.loginButton.click();
    this.logger.info('LoginPage: ✅ login successful');
  }
}
