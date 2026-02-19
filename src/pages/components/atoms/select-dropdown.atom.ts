import { Locator, Page } from '@playwright/test';
import { logger } from '../../../utils/logger';

/**
 * SelectDropdown Atom Component
 * 
 * Low-level reusable dropdown/select component for form interactions.
 * Encapsulates common dropdown patterns: opening, selecting by label, validation.
 * 
 * Supports both standard HTML <select> elements and custom dropdown implementations.
 * 
 * @example
 * const companySelect = new SelectDropdown(
 *   page.locator('.company-select'),
 *   page
 * );
 * await companySelect.selectByLabel('Acme Dental Clinic');
 * 
 * @example
 * const roleSelect = new SelectDropdown(
 *   page.getByLabel('Select Role'),
 *   page
 * );
 * const selectedValue = await roleSelect.getSelectedValue();
 */
export class SelectDropdown {
  private readonly locator: Locator;
  private readonly page: Page;
  private readonly logger = logger;

  /**
   * Constructor for SelectDropdown.
   * @param locator - Playwright Locator pointing to the dropdown trigger/container
   * @param page - Playwright Page object (needed for finding options)
   */
  constructor(locator: Locator, page: Page) {
    this.locator = locator;
    this.page = page;
  }

  /**
   * Open the dropdown by clicking the trigger element.
   * 
   * @param timeout - Optional custom timeout in milliseconds (default: 5000)
   * 
   * @example
   * await dropdown.open();
   */
  async open(timeout: number = 5000): Promise<void> {
    logger.debug('SelectDropdown: opening dropdown', { timeout });

    try {
      await this.locator.waitFor({ 
        state: 'visible', 
        timeout 
      });
      await this.locator.click();
      // Give dropdown animation time to complete
      await this.page.waitForTimeout(300);
      logger.debug('SelectDropdown: dropdown opened');
    } catch (error) {
      logger.error('SelectDropdown: failed to open dropdown', { 
        error: String(error),
        timeout
      });
      throw error;
    }
  }

  /**
   * Close the dropdown by pressing Escape or clicking outside.
   * 
   * @param timeout - Optional custom timeout in milliseconds (default: 5000)
   * 
   * @example
   * await dropdown.close();
   */
  async close(timeout: number = 5000): Promise<void> {
    logger.debug('SelectDropdown: closing dropdown', { timeout });

    try {
      // Try pressing Escape first
      await this.page.keyboard.press('Escape');
      // Fallback: click top-left corner of the page for dropdowns requiring an outside click
      await this.page.mouse.click(0, 0);
      // Give closing animation time
      await this.page.waitForTimeout(200);
      logger.debug('SelectDropdown: dropdown closed');
    } catch (error) {
      logger.error('SelectDropdown: failed to close dropdown', { 
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Select an option by its visible text label.
   * 
   * Pattern: open → find option with matching text → click
   * Searches for options within the dropdown menu using partial text matching.
   * 
   * @param label - Visible text of the option to select
   * @param timeout - Optional custom timeout in milliseconds (default: 5000)
   * 
   * @example
   * await dropdown.selectByLabel('Option 1');
   * 
   * @example
   * await dropdown.selectByLabel('Acme Dental Clinic');
   */
  async selectByLabel(label: string, timeout: number = 5000): Promise<void> {
    logger.info('SelectDropdown: selecting option by label', { label });

    try {
      // Open dropdown
      await this.open(timeout);

      // Try to find and click the option with matching text
      // Try multiple selectors for different dropdown implementations
      const optionSelectors = [
        // Common list item pattern
        this.page.getByText(label, { exact: false }).first(),
        // Aria-selected pattern
        this.page.locator(`[role="option"]:has-text("${label}")`).first(),
      ];

      let optionFound = false;
      for (const optionLocator of optionSelectors) {
        try {
          await optionLocator.waitFor({ state: 'visible', timeout: 1000 });
          await optionLocator.click();
          optionFound = true;
          logger.debug('SelectDropdown: option selected successfully', { label });
          break;
        } catch {
          // Try next selector
          continue;
        }
      }

      if (!optionFound) {
        throw new Error(`Option with label "${label}" not found in dropdown`);
      }

      // Give selection animation time
      await this.page.waitForTimeout(300);
    } catch (error) {
      logger.error('SelectDropdown: failed to select option', { 
        error: String(error),
        label,
        timeout
      });
      throw error;
    }
  }

  /**
   * Select an option from a standard HTML <select> element by value attribute.
   * 
   * Only works for <select> elements, not custom dropdowns.
   * 
   * @param value - Value attribute of the option to select
   * @param timeout - Optional custom timeout in milliseconds (default: 5000)
   * 
   * @example
   * await dropdown.selectByValue('option-123');
   */
  async selectByValue(value: string, timeout: number = 5000): Promise<void> {
    logger.info('SelectDropdown: selecting option by value', { value });

    try {
      await this.locator.selectOption(value, { timeout });
      logger.debug('SelectDropdown: option selected by value', { value });
    } catch (error) {
      logger.error('SelectDropdown: failed to select by value', { 
        error: String(error),
        value,
        timeout
      });
      throw error;
    }
  }

  /**
   * Get the currently selected option label/text.
   * 
   * @returns Selected option text
   * 
   * @example
   * const selected = await dropdown.getSelectedLabel();
   * expect(selected).toBe('Option 1');
   */
  async getSelectedLabel(): Promise<string> {
    logger.debug('SelectDropdown: getting selected label');

    try {
      // For <select> elements
      const selectedValue = await this.locator.evaluate((el: any) => {
        if (el.tagName === 'SELECT') {
          const selectedOption = el.options[el.selectedIndex];
          return selectedOption?.textContent || '';
        }
        return el.textContent || '';
      });

      logger.debug('SelectDropdown: selected label retrieved', { 
        label: selectedValue 
      });
      return selectedValue.trim();
    } catch (error) {
      logger.error('SelectDropdown: failed to get selected label', { 
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Get the value attribute of the currently selected option.
   * 
   * @returns Selected option value
   * 
   * @example
   * const value = await dropdown.getSelectedValue();
   */
  async getSelectedValue(): Promise<string> {
    logger.debug('SelectDropdown: getting selected value');

    try {
      const selectedValue = await this.locator.evaluate((el: any) => {
        if (el.tagName === 'SELECT') {
          return el.value || '';
        }
        return el.getAttribute('data-value') || el.textContent || '';
      });

      logger.debug('SelectDropdown: selected value retrieved', { value: selectedValue });
      return selectedValue;
    } catch (error) {
      logger.error('SelectDropdown: failed to get selected value', { 
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Check if the dropdown is visible.
   * 
   * @returns True if visible, false otherwise
   * 
   * @example
   * if (await dropdown.isVisible()) {
   *   await dropdown.selectByLabel('Option 1');
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
   * Check if the dropdown is enabled.
   * 
   * @returns True if enabled, false otherwise
   * 
   * @example
   * const isEnabled = await dropdown.isEnabled();
   */
  async isEnabled(): Promise<boolean> {
    try {
      // Check if element has disabled attribute
      const isDisabled = await this.locator.evaluate((el: any) => {
        return el.disabled === true || el.getAttribute('aria-disabled') === 'true';
      });
      return !isDisabled;
    } catch {
      return true; // Assume enabled if check fails
    }
  }

  /**
   * Check if the dropdown is disabled.
   * 
   * @returns True if disabled, false otherwise
   * 
   * @example
   * const isDisabled = await dropdown.isDisabled();
   */
  async isDisabled(): Promise<boolean> {
    return !(await this.isEnabled());
  }

  /**
   * Get all available option labels in the dropdown.
   * 
   * Note: Dropdown must be opened first.
   * 
   * @returns Array of option labels
   * 
   * @example
   * await dropdown.open();
   * const options = await dropdown.getAllOptions();
   * expect(options).toContain('Option 1');
   */
  async getAllOptions(): Promise<string[]> {
    logger.debug('SelectDropdown: getting all options');

    try {
      // For <select> elements
      const options = await this.locator.evaluate((el: any) => {
        if (el.tagName === 'SELECT') {
          return Array.from(el.options).map((opt: any) => opt.textContent?.trim() || '');
        }
        // For custom dropdowns, try common selectors
        const optionElements = Array.from(
          el.querySelectorAll('[role="option"], .option, .dropdown-item')
        );
        return optionElements.map((opt: any) => opt.textContent?.trim() || '');
      });

      logger.debug('SelectDropdown: options retrieved', { count: options.length });
      return options;
    } catch (error) {
      logger.error('SelectDropdown: failed to get all options', { 
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Get the number of available options in the dropdown.
   * 
   * @returns Number of options
   * 
   * @example
   * const count = await dropdown.getOptionCount();
   * expect(count).toBeGreaterThan(0);
   */
  async getOptionCount(): Promise<number> {
    logger.debug('SelectDropdown: getting option count');

    try {
      const options = await this.getAllOptions();
      logger.debug('SelectDropdown: option count retrieved', { count: options.length });
      return options.length;
    } catch (error) {
      logger.error('SelectDropdown: failed to get option count', { 
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Check if a specific option label exists in the dropdown.
   * 
   * Note: Dropdown must be opened first for custom dropdowns.
   * 
   * @param label - Option label to search for
   * @returns True if option exists, false otherwise
   * 
   * @example
   * const hasOption = await dropdown.hasOption('Option 1');
   */
  async hasOption(label: string): Promise<boolean> {
    logger.debug('SelectDropdown: checking if option exists', { label });

    try {
      const options = await this.getAllOptions();
      const exists = options.some(opt => opt.includes(label));
      logger.debug('SelectDropdown: option check completed', { label, exists });
      return exists;
    } catch (error) {
      logger.error('SelectDropdown: failed to check option existence', { 
        error: String(error),
        label
      });
      return false;
    }
  }
}
