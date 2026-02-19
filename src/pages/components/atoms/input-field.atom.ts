import { Locator } from '@playwright/test';
import { logger } from '../../../utils/logger';

/**
 * InputField Atom Component
 * 
 * Low-level reusable input field component for form interactions.
 * Encapsulates common input patterns: fill, type, clear, validation.
 * 
 * Uses semantic HTML (getByLabel, getByPlaceholder) for robustness.
 * 
 * @example
 * const usernameField = new InputField(page.getByLabel('Username'));
 * await usernameField.fill('john.doe@example.com');
 * 
 * const searchField = new InputField(page.getByPlaceholder('Search...'));
 * await searchField.type('dentist', 50); // 50ms delay between keystrokes
 */
export class InputField {
  private readonly locator: Locator;

  /**
   * Constructor for InputField.
   * @param locator - Playwright Locator pointing to the input element
   */
  constructor(locator: Locator) {
    this.locator = locator;
  }

  /**
   * Fill the input field with a value.
   * 
   * Pattern: wait for actionable → clear → fill
   * Ensures the input is ready, clears any existing content, then fills with new value.
   * 
   * @param value - Value to fill into the input
   * @param timeout - Optional custom timeout in milliseconds (default: 5000)
   * 
   * @example
   * await inputField.fill('john.doe@example.com');
   */
  async fill(value: string, timeout: number = 5000): Promise<void> {
    logger.debug('InputField: filling with value', { 
      timeout, 
      valueLength: value.length 
    });

    try {
      // Wait for element to be actionable (visible + enabled)
      await this.locator.waitFor({ 
        state: 'visible', 
        timeout 
      });

      // Clear any existing content
      await this.locator.clear();

      // Fill with new value
      await this.locator.fill(value);

      logger.debug('InputField: fill completed successfully');
    } catch (error) {
      logger.error('InputField: fill operation failed', { 
        error: String(error),
        timeout 
      });
      throw error;
    }
  }

  /**
   * Type text character-by-character into the input field.
   * 
   * Useful for triggering keystroke event listeners (e.g., search autocomplete).
   * Uses a delay between keystrokes to allow the application to respond.
   * 
   * @param text - Text to type
   * @param delayMs - Delay between keystrokes in milliseconds (default: 50)
   * @param timeout - Optional custom timeout in milliseconds (default: 5000)
   * 
   * @example
   * // Type with default 50ms delay
   * await inputField.type('search query');
   * 
   * // Type with custom delay for slow autocomplete
   * await inputField.type('patient name', 100);
   */
  async type(text: string, delayMs: number = 50, timeout: number = 5000): Promise<void> {
    logger.debug('InputField: typing text', { 
      textLength: text.length,
      delayMs,
      timeout
    });

    try {
      // Wait for element to be actionable
      await this.locator.waitFor({ 
        state: 'visible', 
        timeout 
      });

      // Type character by character with delay
      await this.locator.type(text, { delay: delayMs });

      logger.debug('InputField: type completed successfully');
    } catch (error) {
      logger.error('InputField: type operation failed', {
        error: String(error),
        textLength: text.length,
        delayMs,
        timeout
      });
      throw error;
    }
  }

  /**
   * Get the current value of the input field.
   * 
   * @returns Current input value
   * 
   * @example
   * const username = await inputField.getValue();
   * expect(username).toBe('john.doe@example.com');
   */
  async getValue(): Promise<string> {
    logger.debug('InputField: getting value');
    const value = await this.locator.inputValue();
    logger.debug('InputField: value retrieved', { length: value.length });
    return value;
  }

  /**
   * Clear the input field completely.
   * 
   * @param timeout - Optional custom timeout in milliseconds (default: 5000)
   * 
   * @example
   * await inputField.clear();
   */
  async clear(timeout: number = 5000): Promise<void> {
    logger.debug('InputField: clearing');

    try {
      await this.locator.waitFor({ 
        state: 'visible', 
        timeout 
      });
      await this.locator.clear();
      logger.debug('InputField: clear completed');
    } catch (error) {
      logger.error('InputField: clear operation failed', { error: String(error) });
      throw error;
    }
  }

  /**
   * Click the input field to focus it.
   * 
   * @param timeout - Optional custom timeout in milliseconds (default: 5000)
   * 
   * @example
   * await inputField.click();
   */
  async click(timeout: number = 5000): Promise<void> {
    logger.debug('InputField: clicking');

    try {
      await this.locator.waitFor({ 
        state: 'visible', 
        timeout 
      });
      await this.locator.click();
      logger.debug('InputField: click completed');
    } catch (error) {
      logger.error('InputField: click operation failed', { error: String(error) });
      throw error;
    }
  }

  /**
   * Check if the input field is visible.
   * 
   * @returns True if visible, false otherwise
   * 
   * @example
   * if (await inputField.isVisible()) {
   *   await inputField.fill('value');
   * }
   */
  async isVisible(): Promise<boolean> {
    try {
      await this.locator.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the input field is enabled.
   * 
   * @returns True if enabled, false otherwise
   * 
   * @example
   * const isEnabled = await inputField.isEnabled();
   */
  async isEnabled(): Promise<boolean> {
    try {
      return await this.locator.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Check if the input field is disabled.
   * 
   * @returns True if disabled, false otherwise
   * 
   * @example
   * const isDisabled = await inputField.isDisabled();
   */
  async isDisabled(): Promise<boolean> {
    return !(await this.isEnabled());
  }

  /**
   * Get the placeholder text of the input field.
   * 
   * @returns Placeholder text or empty string if not present
   * 
   * @example
   * const placeholder = await inputField.getPlaceholder();
   */
  async getPlaceholder(): Promise<string> {
    const placeholder = await this.locator.getAttribute('placeholder');
    return placeholder || '';
  }

  /**
   * Focus the input field (without clicking).
   * 
   * @param timeout - Optional custom timeout in milliseconds (default: 5000)
   * 
   * @example
   * await inputField.focus();
   */
  async focus(timeout: number = 5000): Promise<void> {
    logger.debug('InputField: focusing');

    try {
      await this.locator.waitFor({ 
        state: 'visible', 
        timeout 
      });
      await this.locator.focus();
      logger.debug('InputField: focus completed');
    } catch (error) {
      logger.error('InputField: focus operation failed', { error: String(error) });
      throw error;
    }
  }

  /**
   * Blur the input field (remove focus).
   * 
   * @param timeout - Optional custom timeout in milliseconds (default: 5000)
   * 
   * @example
   * await inputField.blur();
   */
  async blur(timeout: number = 5000): Promise<void> {
    logger.debug('InputField: blurring');

    try {
      await this.locator.waitFor({ 
        state: 'visible', 
        timeout 
      });
      await this.locator.blur();
      logger.debug('InputField: blur completed');
    } catch (error) {
      logger.error('InputField: blur operation failed', { error: String(error) });
      throw error;
    }
  }
}
