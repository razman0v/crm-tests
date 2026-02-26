import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';
import { TestConfig } from '../../config/config.interface';

/**
 * Role Selection Page Object
 * Handles the role selection step in the login workflow.
 * 
 * Displayed after SMS verification.
 * User selects their role in the system (e.g., Employee, Manager, Admin).
 * 
 * Supported roles:
 * - "Я сотрудник" (Employee)
 * - "Я пациент" (Patient)
 * - "Я администратор" (Administrator)
 * 
 * @example
 * const rolePage = new RolePage(page, config);
 * await rolePage.selectRole('employee');
 * await rolePage.clickContinue();
 */
export class RolePage extends BasePage {
  readonly employeeRole: Locator;
  readonly patientRole: Locator;
  readonly adminRole: Locator;
  readonly continueButton: Locator;

  constructor(page: Page, config: TestConfig) {
    super(page, config);

    // Role radio buttons/selection options
    // "Я сотрудник" = "I am an employee"
    this.employeeRole = page.getByText(/Я сотрудник|I am employee|Employee/i);
    
    // "Я пациент" = "I am a patient"
    this.patientRole = page.getByText(/Я пациент|I am patient|Patient/i);
    
    // "Я администратор" = "I am an administrator"
    this.adminRole = page.getByText(/Я администратор|I am administrator|Administrator/i);
    
    // Continue/Submit button after role selection
    this.continueButton = page.getByRole('button', { name: /Далее|Continue|Next|Confirm/i });
  }

  /**
   * Check if the role selection UI is visible.
   * Used to verify we're on the role selection step.
   * 
   * @returns true if any role option is visible
   */
  async isRoleSelectionVisible(): Promise<boolean> {
    this.logger.debug('Checking if role selection is visible');
    try {
      await this.employeeRole.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for role selection UI to appear on page.
   * 
   * @param timeout - Custom timeout in milliseconds (default: 5000)
   */
  async waitForRoleSelection(timeout: number = 5000): Promise<void> {
    this.logger.info('Waiting for role selection to appear');
    await this.waitForElement(this.employeeRole, timeout);
  }

  /**
   * Select employee role.
   * Clicks the "Я сотрудник" (Employee) option.
   * 
   * @example
   * await rolePage.selectEmployeeRole();
   */
  async selectEmployeeRole(): Promise<void> {
    this.logger.info('Selecting employee role');
    
    // Ensure role selection is visible
    await this.waitForElement(this.employeeRole, 5000);
    
    // Click the employee role option
    await this.employeeRole.click();
    
    this.logger.debug('Employee role selected');
  }

  /**
   * Select patient role.
   * Clicks the "Я пациент" (Patient) option.
   * 
   * @example
   * await rolePage.selectPatientRole();
   */
  async selectPatientRole(): Promise<void> {
    this.logger.info('Selecting patient role');
    
    // Ensure role selection is visible
    await this.waitForElement(this.patientRole, 5000);
    
    // Click the patient role option
    await this.patientRole.click();
    
    this.logger.debug('Patient role selected');
  }

  /**
   * Select admin role.
   * Clicks the "Я администратор" (Administrator) option.
   * 
   * @example
   * await rolePage.selectAdminRole();
   */
  async selectAdminRole(): Promise<void> {
    this.logger.info('Selecting admin role');
    
    // Ensure role selection is visible
    await this.waitForElement(this.adminRole, 5000);
    
    // Click the admin role option
    await this.adminRole.click();
    
    this.logger.debug('Admin role selected');
  }

  /**
   * Select a role by name.
   * Flexible method that accepts role names as strings.
   * 
   * Supported role names:
   * - 'employee' or 'сотрудник'
   * - 'patient' or 'пациент'
   * - 'admin' or 'администратор'
   * 
   * @param roleName - Role name to select (case-insensitive)
   * @example
   * await rolePage.selectRole('employee');
   * await rolePage.selectRole('patient');
   * await rolePage.selectRole('admin');
   */
  async selectRole(roleName: string): Promise<void> {
    const normalizedRole = roleName.toLowerCase().trim();
    
    this.logger.info('Selecting role', { roleName, normalized: normalizedRole });
    
    switch (normalizedRole) {
      case 'employee':
      case 'сотрудник':
        await this.selectEmployeeRole();
        break;
      case 'patient':
      case 'пациент':
        await this.selectPatientRole();
        break;
      case 'admin':
      case 'администратор':
        await this.selectAdminRole();
        break;
      default:
        this.logger.error('Unknown role', { roleName });
        throw new Error(`Unknown role: ${roleName}. Supported roles: employee, patient, admin`);
    }
  }

  /**
   * Get the selected role.
   * Returns which role is currently selected (if any).
   * 
   * @returns Selected role name or null if none selected
   */
  async getSelectedRole(): Promise<string | null> {
    this.logger.debug('Getting selected role');
    
    // Check which role is selected (may need locator adjustments based on actual UI)
    // This is a placeholder - actual implementation depends on UI structure
    try {
      const employeeChecked = await this.employeeRole.isChecked().catch(() => false);
      if (employeeChecked) return 'employee';
      
      const patientChecked = await this.patientRole.isChecked().catch(() => false);
      if (patientChecked) return 'patient';
      
      const adminChecked = await this.adminRole.isChecked().catch(() => false);
      if (adminChecked) return 'admin';
      
      return null;
    } catch (error) {
      this.logger.warn('Could not determine selected role', { error: String(error) });
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
   * Should be done after selecting a role.
   * 
   * @example
   * await rolePage.clickContinue();
   */
  async clickContinue(): Promise<void> {
    this.logger.info('Clicking role selection continue button');
    await this.continueButton.click();
    await this.waitForNavigationComplete();
  }

  /**
   * Complete the role selection step (select role + click continue).
   * Complete workflow: selects a role and clicks continue button.
   * 
   * @param roleName - Role to select ('employee', 'patient', 'admin')
   * @example
   * await rolePage.submitRoleSelection('employee');
   */
  async submitRoleSelection(roleName: string = 'employee'): Promise<void> {
    this.logger.info('Submitting role selection', { roleName });
    
    await this.selectRole(roleName);
    await this.clickContinue();
  }
}
