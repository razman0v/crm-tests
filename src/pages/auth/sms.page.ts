import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';
import { config } from '../../config/config.interface';

/**
 * SMS Code Entry Page Object
 * Handles the SMS two-factor authentication step in the login workflow.
 * 
 * Displayed after username/password submission.
 * User enters 6-digit SMS code from authenticator.
 * 
 * @example
 * const smsPage = new SmsPage(page, config);
 * await smsPage.enterSmsCode('123456');
 */
export class SmsPage extends BasePage {
  readonly smsCodeInputs: Locator;
  readonly smsInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page, config: config) {
    super(page, config);

    // SMS input fields (OTP character entry)
    // Supports both single input and multiple character inputs
    this.smsCodeInputs = page.locator('input[type="text"]:has-text("OTP")');
    this.smsInput = page.getByLabel(/Please enter OTP character|SMS code|otpcode/i);
    
    // Submit/Continue button after SMS entry
    this.submitButton = page.getByRole('button', { name: /Далее|Войти|Continue|Next|Confirm|Send/i });
  }

  /**
   * Check if the SMS code input is visible on the page.
   * Used to verify we're on the SMS entry step.
   * 
   * @returns true if SMS input is visible
   */
  async isSmsInputVisible(): Promise<boolean> {
    this.logger.debug('Checking if SMS input is visible');
    try {
      await this.smsInput.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for SMS input to appear on page.
   * 
   * @param timeout - Custom timeout in milliseconds (default: 5000)
   */
  async waitForSmsInput(timeout: number = 5000): Promise<void> {
    this.logger.info('Waiting for SMS code input to appear');
    await this.waitForElement(this.smsInput, timeout);
  }

  /**
   * Enter the SMS code.
   * Automatically fills the SMS input field with the provided code.
   * 
   * The SMS code should be a 6-digit numeric string.
   * Gets code from config.features.smsCode by default.
   * 
   * @param code - SMS code to enter (e.g., '123456')
   * @example
   * await smsPage.enterSmsCode('123456');
   */
  async enterSmsCode(code: string): Promise<void> {
    this.logger.info('Entering SMS code', { code });
    
    // Wait for SMS input to be visible and actionable
    await this.waitForElement(this.smsInput, 5000);
    
    // Fill the SMS input field
    await this.smsInput.fill(code);
    
    this.logger.debug('SMS code entered successfully');
  }

  /**
   * Enter SMS code from configuration.
   * Uses config.features.smsCode for the code value.
   * 
   * @example
   * await smsPage.enterSmsCodeFromConfig();
   */
  async enterSmsCodeFromConfig(): Promise<void> {
    const smsCode = this.config.features.smsCode;
    
    if (!smsCode) {
      this.logger.error('SMS code not configured', { 
        featurePath: 'config.features.smsCode' 
      });
      throw new Error('SMS code not configured in config.features.smsCode');
    }
    
    await this.enterSmsCode(smsCode);
  }

  /**
   * Get the current SMS code value from the input field.
   * 
   * @returns SMS code currently in the input field
   */
  async getSmsCodeValue(): Promise<string> {
    this.logger.debug('Getting current SMS code value');
    const value = await this.smsInput.inputValue();
    return value;
  }

  /**
   * Clear the SMS code input field.
   * 
   * @example
   * await smsPage.clearSmsCode();
   */
  async clearSmsCode(): Promise<void> {
    this.logger.info('Clearing SMS code input');
    await this.smsInput.clear();
  }

  /**
   * Check if submit/continue button is visible.
   * 
   * @returns true if submit button is visible, false otherwise
   */
  async isSubmitButtonVisible(): Promise<boolean> {
    this.logger.debug('Checking if submit button is visible');
    try {
      await this.submitButton.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click the submit/continue button.
   * Should be done after entering SMS code.
   * 
   * @example
   * await smsPage.clickSubmit();
   */
  async clickSubmit(): Promise<void> {
    this.logger.info('Clicking SMS submit/continue button');
    await this.submitButton.click();
    await this.waitForNavigationComplete();
  }

  /**
   * Complete the SMS entry step (enter code + click submit).
   * Complete workflow: enters SMS code and clicks continue button.
   * 
   * @param code - SMS code to enter (uses config if not provided)
   * @example
   * await smsPage.submitSmsCode('123456');
   */
  async submitSmsCode(code?: string): Promise<void> {
    this.logger.info('Submitting SMS code');
    
    if (code) {
      await this.enterSmsCode(code);
    } else {
      await this.enterSmsCodeFromConfig();
    }
    
    await this.clickSubmit();
  }
}
