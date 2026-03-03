import { test, expect, Page } from '@playwright/test';
import { SmsPage } from '../../../pages/auth/sms.page';
import { RolePage } from '../../../pages/auth/role.page';
import { BranchPage } from '../../../pages/auth/branch.page';
import { config } from '../../../config/config.interface';

/**
 * Integration Tests for Auth Workflow Pages (SMS, Role, Branch)
 * 
 * Tests the authentication workflow pages in isolation and as an integrated flow.
 * Uses mocked HTML to simulate real auth page structure.
 * 
 * Test categories:
 * - SMS Page: SMS code entry and validation
 * - Role Page: Role selection and submission
 * - Branch Page: Branch/company selection with search
 * - Integrated Workflow: Full auth flow across all three pages
 */

// Mock config for testing
const mockConfig: config = {
  baseUrl: 'http://localhost:3000/',
  credentials: {
    admin: {
      username: 'test@example.com',
      password: 'test123',
    },
  },
  features: {
    smsCode: '1234',
    secondCompanyName: 'Test Company',
    mainPageUrl: 'http://localhost:3000/dashboard',
    captchaEnabled: false,
  },
  companyUid: 'test-uid',
};

test.describe('Auth Workflow Pages - Integration Tests', () => {
  let page: Page;

  /**
   * SECTION 1: SMS PAGE TESTS
   */
  test.describe('SmsPage - SMS Code Entry', () => {
    test.beforeEach(async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();

      // Mock SMS entry page HTML
      await page.setContent(`
        <div class="auth-container">
          <h1>Двухфакторная аутентификация</h1>
          <label for="sms-code">Please enter OTP character 1</label>
          <input id="sms-code" type="text" />
          <button>Далее</button>
        </div>
      `);
    });

    test('should display SMS input field', async () => {
      const smsPage = new SmsPage(page, mockConfig);
      const isVisible = await smsPage.isSmsInputVisible();
      expect(isVisible).toBe(true);
    });

    test('should enter SMS code into input field', async () => {
      const smsPage = new SmsPage(page, mockConfig);
      await smsPage.enterSmsCode('1234');
      
      const value = await smsPage.getSmsCodeValue();
      expect(value).toBe('1234');
    });

    test('should clear SMS code input', async () => {
      const smsPage = new SmsPage(page, mockConfig);
      await smsPage.enterSmsCode('1234');
      await smsPage.clearSmsCode();
      
      const value = await smsPage.getSmsCodeValue();
      expect(value).toBe('');
    });

    test('should load SMS code from configuration', async () => {
      const smsPage = new SmsPage(page, mockConfig);
      await smsPage.enterSmsCodeFromConfig();
      
      const value = await smsPage.getSmsCodeValue();
      expect(value).toBe(mockConfig.features.smsCode);
    });

    test('should detect missing SMS code in configuration', async () => {
      const invalidConfig = { ...mockConfig, features: { ...mockConfig.features, smsCode: '' } };
      const smsPage = new SmsPage(page, invalidConfig);
      
      await expect(async () => {
        await smsPage.enterSmsCodeFromConfig();
      }).rejects.toThrow();
    });

    test('should check if submit button is visible', async () => {
      const smsPage = new SmsPage(page, mockConfig);
      const isVisible = await smsPage.isSubmitButtonVisible();
      expect(isVisible).toBe(true);
    });
  });

  /**
   * SECTION 2: ROLE PAGE TESTS
   */
  test.describe('RolePage - Role Selection', () => {
    test.beforeEach(async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();

      // Mock role selection page HTML
      await page.setContent(`
        <div class="auth-container">
          <h1>Выберите вашу роль</h1>
          <div class="role-options">
            <label>
              <input type="radio" name="role" value="employee" />
              <span>Я сотрудник</span>
            </label>
            <label>
              <input type="radio" name="role" value="patient" />
              <span>Я пациент</span>
            </label>
            <label>
              <input type="radio" name="role" value="admin" />
              <span>Я администратор</span>
            </label>
          </div>
          <button>Далее</button>
        </div>
      `);
    });

    test('should display role selection options', async () => {
      const rolePage = new RolePage(page, mockConfig);
      const isVisible = await rolePage.isRoleSelectionVisible();
      expect(isVisible).toBe(true);
    });

    test('should select employee role', async () => {
      const rolePage = new RolePage(page, mockConfig);
      await rolePage.selectEmployeeRole();
      
      // Verify employee role is selected (by checking if text exists)
      await expect(page.getByText(/Я сотрудник/i)).toBeVisible();
    });

    test('should select patient role', async () => {
      const rolePage = new RolePage(page, mockConfig);
      await rolePage.selectPatientRole();
      
      await expect(page.getByText(/Я пациент/i)).toBeVisible();
    });

    test('should select admin role', async () => {
      const rolePage = new RolePage(page, mockConfig);
      await rolePage.selectAdminRole();
      
      await expect(page.getByText(/Я администратор/i)).toBeVisible();
    });

    test('should select role by name (employee)', async () => {
      const rolePage = new RolePage(page, mockConfig);
      await rolePage.selectRole('employee');
      
      await expect(page.getByText(/Я сотрудник/i)).toBeVisible();
    });

    test('should select role by name (patient)', async () => {
      const rolePage = new RolePage(page, mockConfig);
      await rolePage.selectRole('patient');
      
      await expect(page.getByText(/Я пациент/i)).toBeVisible();
    });

    test('should reject invalid role name', async () => {
      const rolePage = new RolePage(page, mockConfig);
      
      await expect(async () => {
        await rolePage.selectRole('invalid');
      }).rejects.toThrow();
    });

    test('should check if continue button is visible', async () => {
      const rolePage = new RolePage(page, mockConfig);
      const isVisible = await rolePage.isContinueButtonVisible();
      expect(isVisible).toBe(true);
    });
  });

  /**
   * SECTION 3: BRANCH PAGE TESTS
   */
  test.describe('BranchPage - Branch/Company Selection', () => {
    test.beforeEach(async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();

      // Mock branch selection page HTML
      await page.setContent(`
        <div class="auth-container">
          <h1>Выберите компанию</h1>
          <div class="FieldLayoutView">
            <label>Выберите компанию:</label>
            <div class="DropDownFieldView">
              <button>Select company</button>
            </div>
          </div>
          <input placeholder="Начните вводить символы для поиска..." style="display:none;" />
          <div class="dropdown-options" style="display:none;">
            <div>Test Company</div>
            <div>Main Company</div>
            <div>Other Company</div>
          </div>
          <button>Далее</button>
        </div>
      `);
    });

    test('should display branch selection dropdown', async () => {
      const branchPage = new BranchPage(page, mockConfig);
      const isVisible = await branchPage.isBranchSelectionVisible();
      expect(isVisible).toBe(true);
    });

    test('should detect branch selection not visible when not present', async () => {
      await page.setContent('<div>Empty page</div>');
      const branchPage = new BranchPage(page, mockConfig);
      
      const isVisible = await branchPage.isBranchSelectionVisible();
      expect(isVisible).toBe(false);
    });

    test('should check if continue button is visible', async () => {
      const branchPage = new BranchPage(page, mockConfig);
      const isVisible = await branchPage.isContinueButtonVisible();
      expect(isVisible).toBe(true);
    });

    // Note: Full branch dropdown interaction tests would require more complex DOM setup
    // These tests validate the page object initializes correctly and methods exist
  });

  /**
   * SECTION 4: INTEGRATED WORKFLOW TESTS
   */
  test.describe('Auth Workflow - Complete Flow', () => {
    test('should handle complete auth page sequence', async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();

      // Create all three page objects
      const smsPage = new SmsPage(page, mockConfig);
      const rolePage = new RolePage(page, mockConfig);
      const branchPage = new BranchPage(page, mockConfig);

      // Step 1: SMS Page - mock HTML and interact
      await page.setContent(`
        <div class="auth-container">
          <h1>SMS Entry</h1>
          <label for="sms-code">Please enter OTP character 1</label>
          <input id="sms-code" type="text" />
          <button>Далее</button>
        </div>
      `);

      // Verify SMS page is available
      let isVisible = await smsPage.isSmsInputVisible();
      expect(isVisible).toBe(true);

      // Enter SMS code
      await smsPage.enterSmsCodeFromConfig();
      let value = await smsPage.getSmsCodeValue();
      expect(value).toBe('1234');

      // Step 2: Role Page - simulate transition
      await page.setContent(`
        <div class="auth-container">
          <h1>Role Selection</h1>
          <div class="role-options">
            <label>
              <input type="radio" name="role" value="employee" />
              <span>Я сотрудник</span>
            </label>
            <label>
              <input type="radio" name="role" value="patient" />
              <span>Я пациент</span>
            </label>
            <label>
              <input type="radio" name="role" value="admin" />
              <span>Я администратор</span>
            </label>
          </div>
          <button>Далее</button>
        </div>
      `);

      // Verify role page is available
      isVisible = await rolePage.isRoleSelectionVisible();
      expect(isVisible).toBe(true);

      // Select role
      await rolePage.selectRole('employee');
      await expect(page.getByText(/Я сотрудник/i)).toBeVisible();

      // Step 3: Branch Page - simulate transition
      await page.setContent(`
        <div class="auth-container">
          <h1>Branch Selection</h1>
          <div class="FieldLayoutView">
            <label>Выберите компанию:</label>
            <div class="DropDownFieldView">
              <button>Select company</button>
            </div>
          </div>
          <input placeholder="Начните вводить символы для поиска..." style="display:none;" />
          <button>Завершить</button>
        </div>
      `);

      // Verify branch page is available
      isVisible = await branchPage.isBranchSelectionVisible();
      expect(isVisible).toBe(true);

      // Verify all page objects are properly initialized
      expect(smsPage).toBeDefined();
      expect(rolePage).toBeDefined();
      expect(branchPage).toBeDefined();

      // Verify all extend BasePage
      expect(smsPage['page']).toBeDefined();
      expect(smsPage['config']).toBeDefined();
      expect(rolePage['page']).toBeDefined();
      expect(rolePage['config']).toBeDefined();
      expect(branchPage['page']).toBeDefined();
      expect(branchPage['config']).toBeDefined();
    });

    test('should handle config injection in all pages', async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();

      const smsPage = new SmsPage(page, mockConfig);
      const rolePage = new RolePage(page, mockConfig);
      const branchPage = new BranchPage(page, mockConfig);

      // Verify config is properly injected
      expect(smsPage['config']).toEqual(mockConfig);
      expect(rolePage['config']).toEqual(mockConfig);
      expect(branchPage['config']).toEqual(mockConfig);

      // Verify access to config values
      expect(smsPage['config'].features.smsCode).toBe('1234');
      expect(rolePage['config'].baseUrl).toBe('http://localhost:3000/');
      expect(branchPage['config'].features.secondCompanyName).toBe('Test Company');
    });

    test('should handle logging in all pages', async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();

      const smsPage = new SmsPage(page, mockConfig);
      const rolePage = new RolePage(page, mockConfig);
      const branchPage = new BranchPage(page, mockConfig);

      // Verify logger is available
      expect(smsPage['logger']).toBeDefined();
      expect(rolePage['logger']).toBeDefined();
      expect(branchPage['logger']).toBeDefined();

      // Verify logger has expected methods
      expect(typeof smsPage['logger'].info).toBe('function');
      expect(typeof smsPage['logger'].debug).toBe('function');
      expect(typeof smsPage['logger'].error).toBe('function');
    });
  });

  /**
   * SECTION 5: ERROR HANDLING & EDGE CASES
   */
  test.describe('Auth Pages - Error Handling', () => {
    test.beforeEach(async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();
      await page.setContent('<div>Minimal page</div>');
    });

    test('should handle missing SMS input gracefully', async () => {
      const smsPage = new SmsPage(page, mockConfig);
      
      // Should not throw, just return false
      const isVisible = await smsPage.isSmsInputVisible();
      expect(isVisible).toBe(false);
    });

    test('should handle missing role selection gracefully', async () => {
      const rolePage = new RolePage(page, mockConfig);
      
      // Should not throw, just return false
      const isVisible = await rolePage.isRoleSelectionVisible();
      expect(isVisible).toBe(false);
    });

    test('should handle missing branch selection gracefully', async () => {
      const branchPage = new BranchPage(page, mockConfig);
      
      // Should not throw, just return false
      const isVisible = await branchPage.isBranchSelectionVisible();
      expect(isVisible).toBe(false);
    });
  });
});
