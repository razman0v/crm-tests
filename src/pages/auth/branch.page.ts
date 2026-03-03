import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';
import { config } from '../../config/config.interface';

/**
 * Branch/Company Selection Page Object
 * Handles the branch or company selection step in the login workflow.
 * 
 * Displayed after role selection.
 * User selects which branch/company they want to work in.
 * Features a searchable dropdown for finding branches/companies.
 * 
 * @example
 * const branchPage = new BranchPage(page, config);
 * await branchPage.selectBranchByName('Main Office');
 * await branchPage.clickContinue();
 */
export class BranchPage extends BasePage {
  readonly branchSelectDropdown: Locator;
  readonly branchSearchInput: Locator;
  readonly branchOption: Locator;
  readonly continueButton: Locator;

  constructor(page: Page, config: config) {
    super(page, config);

    // Branch/Company selection dropdown
    // Contains text "Выберите компанию:" (Select Company) or "Выберите филиал:" (Select Branch)
    this.branchSelectDropdown = page.locator('.FieldLayoutView')
      .filter({ hasText: /Выберите компанию:|Выберите филиал:|Select company:|Select branch:/i })
      .locator('.DropDownFieldView');

    // Search input for finding branches/companies
    // Placeholder: "Начните вводить символы для поиска..." (Start typing to search...)
    this.branchSearchInput = page.getByPlaceholder(/Начните вводить символы для поиска|Start typing to search/i);

    // Branch/company option - will be set dynamically based on selection
    this.branchOption = page.getByText(this.config.features.secondCompanyName || '');

    // Continue/Submit button after branch selection
    this.continueButton = page.getByRole('button', { name: /Далее|Войти|Continue|Next|Confirm|Завершить|Complete/i });
  }

  /**
   * Check if the branch selection UI is visible.
   * Used to verify we're on the branch selection step.
   * 
   * @returns true if branch selection dropdown is visible
   */
  async isBranchSelectionVisible(): Promise<boolean> {
    this.logger.debug('Checking if branch selection is visible');
    try {
      await this.branchSelectDropdown.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for branch selection UI to appear on page.
   * 
   * @param timeout - Custom timeout in milliseconds (default: 5000)
   */
  async waitForBranchSelection(timeout: number = 5000): Promise<void> {
    this.logger.info('Waiting for branch selection to appear');
    await this.waitForElement(this.branchSelectDropdown, timeout);
  }

  /**
   * Open the branch selection dropdown.
   * Clicks the dropdown to reveal available branches.
   * 
   * @example
   * await branchPage.openBranchDropdown();
   */
  async openBranchDropdown(): Promise<void> {
    this.logger.info('Opening branch selection dropdown');
    
    // Ensure dropdown is visible
    await this.waitForElement(this.branchSelectDropdown, 5000);
    
    // Click to open dropdown
    await this.branchSelectDropdown.click();
    
    // Wait for dropdown to open and options to appear
    await this.page.waitForTimeout(500);
    
    this.logger.debug('Branch selection dropdown opened');
  }

  /**
   * Close the branch selection dropdown.
   * Clicks away from the dropdown or presses Escape.
   * 
   * @example
   * await branchPage.closeBranchDropdown();
   */
  async closeBranchDropdown(): Promise<void> {
    this.logger.info('Closing branch selection dropdown');
    
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
    
    this.logger.debug('Branch selection dropdown closed');
  }

  /**
   * Search for a branch by name in the dropdown.
   * Types the branch name in the search input to filter options.
   * 
   * @param branchName - Name of branch to search for
   * @example
   * await branchPage.searchBranch('Main Office');
   */
  async searchBranch(branchName: string): Promise<void> {
    this.logger.info('Searching for branch', { branchName });
    
    // Open dropdown if not already open
    await this.openBranchDropdown();
    
    // Wait for search input to be visible
    await this.waitForElement(this.branchSearchInput, 5000);
    
    // Fill search input
    await this.branchSearchInput.clear();
    await this.branchSearchInput.fill(branchName);
    
    // Wait for search results to appear
    await this.page.waitForTimeout(500);
    
    this.logger.debug('Branch search completed', { branchName });
  }

  /**
   * Select a branch by exact name.
   * Searches for the branch and clicks on the matching option.
   * 
   * @param branchName - Exact name of branch to select
   * @example
   * await branchPage.selectBranchByName('Main Office');
   * await branchPage.selectBranchByName('Branch Two');
   */
  async selectBranchByName(branchName: string): Promise<void> {
    this.logger.info('Selecting branch by name', { branchName });
    
    // Search for the branch
    await this.searchBranch(branchName);
    
    // Click on the matching branch option
    const branchOption = this.page.getByText(branchName, { exact: true });
    await this.waitForElement(branchOption, 5000);
    await branchOption.click();
    
    this.logger.debug('Branch selected', { branchName });
  }

  /**
   * Select a branch from configuration.
   * Uses config.features.secondCompanyName as the branch name.
   * Falls back to config.features.companyName if secondCompanyName not available.
   * 
   * @example
   * await branchPage.selectBranchFromConfig();
   */
  async selectBranchFromConfig(): Promise<void> {
    const branchName = this.config.features.secondCompanyName;
    
    if (!branchName) {
      this.logger.error('Branch name not configured', { 
        featurePath: 'config.features.secondCompanyName'
      });
      throw new Error('Branch/Company name not configured in config.features');
    }
    
    await this.selectBranchByName(branchName);
  }

  /**
   * Get all available branch options from the dropdown.
   * Returns list of visible branch names in the dropdown.
   * 
   * Note: Dropdown must be open before calling this.
   * 
   * @returns Array of branch names
   * @example
   * const branches = await branchPage.getAvailableBranches();
   * console.log(branches); // ['Main Office', 'Branch Two', 'Branch Three']
   */
  async getAvailableBranches(): Promise<string[]> {
    this.logger.info('Getting available branches from dropdown');
    
    // Open dropdown if not already open
    await this.openBranchDropdown();
    
    // Get all option text values
    const options = this.page.locator('.DropDownFieldView [role="option"], .DropDownFieldView li, .DropDownFieldView [data-testid="option"]');
    const branches: string[] = [];
    
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) {
        branches.push(text.trim());
      }
    }
    
    this.logger.debug('Available branches retrieved', { count: branches.length });
    return branches;
  }

  /**
   * Get the currently selected branch.
   * Returns the text of the selected branch option.
   * 
   * @returns Selected branch name or null if none selected
   */
  async getSelectedBranch(): Promise<string | null> {
    this.logger.debug('Getting selected branch');
    
    try {
      const selectedText = await this.branchSelectDropdown.textContent();
      return selectedText ? selectedText.trim() : null;
    } catch (error) {
      this.logger.warn('Could not determine selected branch', { error: String(error) });
      return null;
    }
  }

  /**
   * Check if continue button is visible.
   * 
   * @returns true if continue button is visible, false otherwise
   */
  async isContinueButtonVisible(): Promise<boolean> {
    this.logger.debug('Checking if continue button is visible');
    try {
      await this.continueButton.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click the continue/next button.
   * Should be done after selecting a branch.
   * 
   * @example
   * await branchPage.clickContinue();
   */
  async clickContinue(): Promise<void> {
    this.logger.info('Clicking branch selection continue button');
    await this.continueButton.click();
    await this.waitForNavigationComplete();
  }

  /**
   * Complete the branch selection step (select branch + click continue).
   * Complete workflow: selects a branch and clicks continue button.
   * 
   * Uses branch name from config.features.secondCompanyName by default.
   * 
   * @param branchName - Branch to select (uses config if not provided)
   * @example
   * await branchPage.submitBranchSelection('Main Office');
   * // or with config
   * await branchPage.submitBranchSelection();
   */
  async submitBranchSelection(branchName?: string): Promise<void> {
    this.logger.info('Submitting branch selection', { branchName });
    
    if (branchName) {
      await this.selectBranchByName(branchName);
    } else {
      await this.selectBranchFromConfig();
    }
    
    await this.clickContinue();
  }
}
