import { Page, expect, Locator } from '@playwright/test';
import { TestConfig } from '../config/config.interface';
import { Logger } from '../utils/logger';

/**
 * Abstract base class for all Page Objects in the test suite.
 * Provides common navigation, wait, and assertion utilities.
 * 
 * All page classes should extend this class and define page-specific locators
 * and interaction methods.
 * 
 * @example
 * class VisitDetailsPage extends BasePage {
 *   readonly dentalChart: Locator;
 *   
 *   constructor(page: Page, config: TestConfig) {
 *     super(page, config);
 *     this.dentalChart = page.locator('[data-testid="dental-chart"]');
 *   }
 *   
 *   async selectTooth(toothId: number) {
 *     await this.dentalChart.locator(`[data-tooth-id="${toothId}"]`).click();
 *     await this.waitForNavigationComplete();
 *   }
 * }
 */
export abstract class BasePage {
  readonly page: Page;
  readonly config: TestConfig;
  protected readonly logger: Logger;

  /**
   * Constructor for BasePage.
   * @param page - Playwright Page object
   * @param config - Test configuration with credentials and feature flags
   */
  constructor(page: Page, config: TestConfig) {
    this.page = page;
    this.config = config;
    this.logger = new Logger();
  }

  /**
   * Navigate to a specific path within the application.
   * Uses baseUrl from TestConfig.
   * 
   * @param path - Path to navigate to (e.g., '/visits/123', '/dashboard')
   * @example
   * await page.goto('/visits/42');
   * await page.goto('/dashboard');
   */
  async goto(path: string = '/'): Promise<void> {
    const url = `${this.config.baseUrl}${path}`;
    this.logger.info('Navigating to URL', { url, path });
    await this.page.goto(url, { waitUntil: 'networkidle' });
    await this.waitForNavigationComplete();
  }

  /**
   * Wait for the page to complete navigation and be ready for interaction.
   * Waits for network idle state and DOM to stabilize.
   * 
   * @param timeout - Custom timeout in milliseconds (default: 10000)
   * @example
   * await this.waitForNavigationComplete();
   * // or with custom timeout
   * await this.waitForNavigationComplete(5000);
   */
  async waitForNavigationComplete(timeout: number = 10000): Promise<void> {
    this.logger.debug('Waiting for navigation to complete', { timeout });
    
    try {
      // Wait for network to become idle
      await this.page.waitForLoadState('networkidle', { timeout });
      this.logger.debug('Network idle achieved');
      
      // Optional: Wait for specific common elements to be visible if needed
      // This prevents false positives from premature readiness
      await this.page.waitForTimeout(100);
    } catch (error) {
      this.logger.warn('Navigation wait timeout exceeded', { timeout, error: String(error) });
      // Don't throw - sometimes navigation completes before networkidle check
    }
  }

  /**
   * Wait for an element to be visible on the page.
   * 
   * @param locator - Playwright Locator to wait for
   * @param timeout - Custom timeout in milliseconds (default: 5000)
   * @example
   * const button = this.page.getByRole('button', { name: 'Submit' });
   * await this.waitForElement(button);
   */
  async waitForElement(locator: Locator, timeout: number = 5000): Promise<void> {
    this.logger.debug('Waiting for element', { timeout });
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if an element is visible on the page.
   * 
   * @param locator - Playwright Locator to check
   * @returns True if element is visible, false otherwise
   * @example
   * const isVisible = await this.isElementVisible(this.submitButton);
   */
  async isElementVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Assert that the current page URL matches the expected path.
   * 
   * @param expectedPath - Expected path (will be appended to baseUrl)
   * @example
   * await this.assertUrlContains('/visits/42');
   */
  async assertUrlContains(expectedPath: string): Promise<void> {
    this.logger.info('Asserting URL contains path', { expectedPath });
    const expectedUrl = `${this.config.baseUrl}${expectedPath}`;
    await expect(this.page).toHaveURL(new RegExp(expectedPath));
  }

  /**
   * Assert that a locator is visible with proper error context.
   * 
   * @param locator - Playwright Locator to assert
   * @param message - Optional custom assertion message
   * @example
   * await this.assertElementVisible(this.successMessage, 'Success message should be visible');
   */
  async assertElementVisible(locator: Locator, message?: string): Promise<void> {
    const msg = message || 'Element should be visible';
    this.logger.info('Asserting element visibility', { message: msg });
    await expect(locator).toBeVisible();
  }

  /**
   * Assert that a locator is NOT visible.
   * 
   * @param locator - Playwright Locator to assert
   * @param message - Optional custom assertion message
   * @example
   * await this.assertElementHidden(this.loadingSpinner, 'Loading spinner should disappear');
   */
  async assertElementHidden(locator: Locator, message?: string): Promise<void> {
    const msg = message || 'Element should be hidden';
    this.logger.info('Asserting element hidden', { message: msg });
    await expect(locator).not.toBeVisible();
  }

  /**
   * Assert that a locator has specific text content.
   * 
   * @param locator - Playwright Locator to assert
   * @param expectedText - Expected text (exact match)
   * @example
   * await this.assertElementText(this.title, 'Patient Details');
   */
  async assertElementText(locator: Locator, expectedText: string): Promise<void> {
    this.logger.info('Asserting element text', { expectedText });
    await expect(locator).toHaveText(expectedText);
  }

  /**
   * Assert that a locator contains specific text (partial match).
   * 
   * @param locator - Playwright Locator to assert
   * @param expectedText - Text that should be contained (case-sensitive)
   * @example
   * await this.assertElementContainsText(this.errorMessage, 'Error');
   */
  async assertElementContainsText(locator: Locator, expectedText: string): Promise<void> {
    this.logger.info('Asserting element contains text', { expectedText });
    await expect(locator).toContainText(expectedText);
  }

  /**
   * Assert that a locator is enabled (not disabled).
   * 
   * @param locator - Playwright Locator to assert
   * @param message - Optional custom assertion message
   * @example
   * await this.assertElementEnabled(this.submitButton, 'Submit button should be enabled');
   */
  async assertElementEnabled(locator: Locator, message?: string): Promise<void> {
    const msg = message || 'Element should be enabled';
    this.logger.info('Asserting element enabled', { message: msg });
    await expect(locator).toBeEnabled();
  }

  /**
   * Assert that a locator is disabled.
   * 
   * @param locator - Playwright Locator to assert
   * @param message - Optional custom assertion message
   * @example
   * await this.assertElementDisabled(this.submitButton, 'Submit button should be disabled');
   */
  async assertElementDisabled(locator: Locator, message?: string): Promise<void> {
    const msg = message || 'Element should be disabled';
    this.logger.info('Asserting element disabled', { message: msg });
    await expect(locator).toBeDisabled();
  }

  /**
   * Get the text content of a locator.
   * Useful for assertions and data validation.
   * 
   * @param locator - Playwright Locator to extract text from
   * @returns Text content of the element
   * @example
   * const errorText = await this.getElementText(this.errorMessage);
   */
  async getElementText(locator: Locator): Promise<string> {
    const text = await locator.textContent();
    this.logger.debug('Retrieved element text', { text });
    return text || '';
  }

  /**
   * Get the value of an input element.
   * 
   * @param locator - Playwright Locator (should be input element)
   * @returns Value of the input
   * @example
   * const inputValue = await this.getInputValue(this.usernameInput);
   */
  async getInputValue(locator: Locator): Promise<string> {
    const value = await locator.inputValue();
    this.logger.debug('Retrieved input value', { placeholder: 'redacted' });
    return value;
  }

  /**
   * Reload the current page.
   * 
   * @example
   * await this.reload();
   */
  async reload(): Promise<void> {
    this.logger.info('Reloading page');
    await this.page.reload({ waitUntil: 'networkidle' });
    await this.waitForNavigationComplete();
  }

  /**
   * Go back in browser history.
   * 
   * @example
   * await this.goBack();
   */
  async goBack(): Promise<void> {
    this.logger.info('Going back in browser history');
    await this.page.goBack({ waitUntil: 'networkidle' });
    await this.waitForNavigationComplete();
  }

  /**
   * Take a screenshot for debugging purposes.
   * Screenshots are automatically attached to Allure reports on failure.
   * 
   * @param filename - Name of the screenshot file
   * @example
   * await this.takeScreenshot('visit-details-state');
   */
  async takeScreenshot(filename: string): Promise<void> {
    this.logger.info('Taking screenshot', { filename });
    await this.page.screenshot({ 
      path: `./test-results/screenshots/${filename}-${Date.now()}.png` 
    });
  }
}
