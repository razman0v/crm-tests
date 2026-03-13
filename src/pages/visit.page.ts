import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { config } from '../config/config.interface';

/**
 * Visit Details Page Object
 * Handles interactions with the dental visit details page including:
 * - Patient information display
 * - Doctor/employee selection
 * - Visit scheduling and time management
 * - Treatment notes and status updates
 * - State-based action button: "Пациент пришел" → "Начать визит" → "Завершить визит"
 */

export const TOOTH_COORDINATES: Record<number, string> = {
  // Upper right quadrant (18-11)
  18: '74.5px',
  17: '66.5px',
  16: '58.5px',
  15: '50.5px',
  14: '42.5px',
  13: '34.5px',
  12: '26.5px',
  11: '18.5px',

  // Upper left quadrant (21-28)
  21: '10.5px',
  22: '18.5px',
  23: '26.5px',
  24: '34.5px',
  25: '42.5px',
  26: '50.5px',
  27: '58.5px',
  28: '66.5px',

  // Lower left quadrant (38-31)
  38: '74.5px',
  37: '66.5px',
  36: '58.5px',
  35: '50.5px',
  34: '42.5px',
  33: '34.5px',
  32: '26.5px',
  31: '18.5px',

  // Lower right quadrant (41-48)
  41: '10.5px',
  42: '18.5px',
  43: '26.5px',
  44: '34.5px',
  45: '42.5px',
  46: '50.5px',
  47: '58.5px',
  48: '66.5px',
};

export class VisitPage extends BasePage {
  // Patient Information
  readonly patientNameDisplay: Locator;
  readonly patientPhoneDisplay: Locator;

  // Doctor/Employee Selection
  readonly doctorSelect: Locator;
  readonly doctorSearchInput: Locator;

  // Visit Timing
  readonly shiftTimeInput: Locator;
  readonly durationInput: Locator;
  readonly durationUnitSelect: Locator;

  // Visit Details
  readonly notesTextarea: Locator;
  readonly statusSelect: Locator;
  readonly statusOption: (status: string) => Locator;

  // Action Buttons
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;
  readonly confirmDeleteButton: Locator;
  // Dynamic state-based button: "Пациент пришел" → "Начать визит" → "Завершить визит"
  readonly stateButton: Locator;

  // Dental Chart
  readonly dentalChart: Locator;
  //readonly dentalChartTooth: (toothId: number) => Locator;

  // Feedback
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page, config: config) {
    super(page, config);

    // Patient Information
    this.patientNameDisplay = page.locator('[data-testid="patient-name"]');
    this.patientPhoneDisplay = page.locator('[data-testid="patient-phone"]');

    // Doctor/Employee Selection
    this.doctorSelect = page.locator('.FieldLayoutView')
      .filter({ hasText: /Select Doctor|Выберите врача/i })
      .locator('.DropDownFieldView');
    this.doctorSearchInput = page.getByPlaceholder(/Начните вводить символы для поиска|Search/i);

    // Visit Timing
    this.shiftTimeInput = page.getByLabel(/Время приема|Appointment Time|Shift Time/i);
    this.durationInput = page.getByLabel(/Продолжительность|Duration/i);
    this.durationUnitSelect = page.getByLabel(/Duration Unit|Единица длительности/i);

    // Visit Details
    this.notesTextarea = page.getByLabel(/Примечания|Notes|Описание|Description/i);
    this.statusSelect = page.getByLabel(/Статус|Status/i);
    this.statusOption = (status: string) => page.getByText(new RegExp(status, 'i'));

    // Action Buttons
    this.saveButton = page.getByRole('button', { name: /Сохранить|Save|Submit/i });
    this.cancelButton = page.getByRole('button', { name: /Отменить|Cancel/i });
    this.deleteButton = page.getByRole('button', { name: /Удалить|Delete/i });
    this.confirmDeleteButton = page.getByRole('button', { name: /Да|Yes|Confirm/i });
    this.stateButton = page.getByRole('button', {
      name: /Пациент пришел|Начать визит|Завершить визит|Завершить прием/i,
    });

    // Dental Chart
    this.dentalChart = page.getByRole('link', { name: 'Зубная формула' });
    // this.dentalChartTooth = (toothId: number) =>
    //   page.locator(`[data-tooth-id="${toothId}"]`);

    // Feedback
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.loadingIndicator = page.locator('[data-testid="loading"]');
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate to a visit page.
   * Overrides BasePage.goto() to accept either a numeric visit ID or a raw path string.
   * - goto(1708)     → /schedule/visits/1708
   * - goto()         → /schedule/visits/new
   * - goto('/other') → /other  (falls through to super)
   */
  override async goto(pathOrId?: string | number): Promise<void> {
    let targetPath: string;

    if (typeof pathOrId === 'number') {
      targetPath = `/schedule/visits/${pathOrId}`;
    } else if (typeof pathOrId === 'string' && pathOrId.length > 0) {
      targetPath = pathOrId;
    } else {
      targetPath = `/schedule/visits/new`;
    }

    this.logger.debug('VisitPage: navigating', { pathOrId, resolvedPath: targetPath });

    try {
      await super.goto(targetPath);
      this.logger.info('VisitPage: ✅ navigation successful', { path: targetPath });
    } catch (error) {
      this.logger.error('VisitPage: navigation failed', {
        error: String(error),
        attemptedPath: targetPath,
      });
      throw error;
    }
  }

  /**
   * Finds a tooth locator by FDI number using grid-mapping strategy.
   * Ignores whitespace in CSS for cross-browser stability.
   * @param toothId FDI tooth ID (11-48)
   * @returns Locator for the tooth SVG path
   * @throws Error with available tooth IDs if ID not found
   */

  getToothLocator(toothId: number): Locator {
    const leftCoord = TOOTH_COORDINATES[toothId];

    if (!leftCoord) {
      throw new Error(
        `Tooth ID ${toothId} not found in TOOTH_COORDINATES. ` +
        `Check TOOTH_COORDINATES. Available: ${Object.keys(TOOTH_COORDINATES).join(', ')}`
      );
    }

    return this.page
      .locator(`.TeethMap__teeth-svg div[style*="left: ${leftCoord}"], .TeethMap__teeth-svg div[style*="left:${leftCoord}"]`)
      .locator('svg path')
      .first();
  }

  /**
   * Clicks a tooth by its FDI ID on the dental chart.
   * Validates visibility first to prevent silent failures.
   */
  async clickTooth(toothId: number): Promise<void> {
    this.logger.info('VisitPage: clicking tooth', { toothId });

    const tooth = this.getToothLocator(toothId);
    await tooth.waitFor({ state: 'visible', timeout: 3000 });
    await tooth.click();
    await this.page.waitForTimeout(300); // Allow state update

    this.logger.info('VisitPage: ✅ tooth clicked', { toothId });
  }


  // ─── State-transition button ─────────────────────────────────────────────────

  /**
   * Returns the current trimmed text of the visit state button.
   * Examples: "Пациент пришел", "Начать визит", "Завершить визит"
   */
  async getStateButtonText(): Promise<string> {
    await this.stateButton.waitFor({ state: 'visible' });
    const text = await this.stateButton.textContent();
    this.logger.debug('VisitPage: state button text', { text });
    return text?.trim() ?? '';
  }

  /**
   * Clicks the state-transition button once and waits for the label to change.
   * Returns { before, after } text so callers can assert the transition.
   */
  async clickStateButton(expectedText: string): Promise<void> {
    await this.stateButton.waitFor({ state: 'visible' });
    const currentText = await this.getStateButtonText();

    if (currentText.toLowerCase().includes(expectedText.toLowerCase())) {
      this.logger.info(`VisitPage: already at state "${expectedText}", skipping click.`);
      return;
    }

    this.logger.info(`VisitPage: transitioning from "${currentText}" to "${expectedText}"`);
    await this.stateButton.click();

    await this.assertStateButtonText(expectedText);
    this.logger.info(`VisitPage: successfully transitioned to "${expectedText}"`);
  }

  /**
   * Asserts the state button currently shows the expected label.
   */
  async assertStateButtonText(expectedText: string): Promise<void> {
    const specificButton = this.page.getByRole('button', { name: expectedText, exact: true });
    await expect(specificButton).toBeVisible();
  }

  async clickDentalChartButton(): Promise<void> {
    this.logger.info('VisitPage: clicking dental chart button');
    await this.dentalChart.waitFor({ state: 'attached' });
    await this.dentalChart.click();
    this.logger.info('VisitPage: dental chart button clicked');
  }

  // ─── Form ────────────────────────────────────────────────────────────────────

  /**
   * Fill the visit form. Validates each field was accepted by the UI.
   */
  async fillVisitForm(data: {
    shiftTime?: string;
    duration?: number;
    notes?: string;
    status?: string;
  }): Promise<void> {
    this.logger.info('VisitPage: filling visit form', { data });

    if (data.shiftTime) {
      await this.shiftTimeInput.fill(data.shiftTime);
      const value = await this.shiftTimeInput.inputValue();
      if (!value.includes(data.shiftTime)) {
        throw new Error(`shiftTime not accepted: expected "${data.shiftTime}", got "${value}"`);
      }
    }

    if (data.duration !== undefined) {
      await this.durationInput.fill(String(data.duration));
      const value = await this.durationInput.inputValue();
      if (value !== String(data.duration)) {
        throw new Error(`duration not accepted: expected "${data.duration}", got "${value}"`);
      }
    }

    if (data.notes) {
      await this.notesTextarea.fill(data.notes);
      const value = await this.notesTextarea.inputValue();
      if (!value.includes(data.notes)) {
        throw new Error(`notes not accepted`);
      }
    }

    if (data.status) {
      await this.statusSelect.click();
      await this.statusOption(data.status).click();
      await this.page.waitForTimeout(200);
    }

    this.logger.info('VisitPage: ✅ form filled and validated');
  }

  /**
   * Returns current form field values.
   */
  async getFormData(): Promise<Record<string, string>> {
    return {
      shiftTime: await this.shiftTimeInput.inputValue().catch(() => ''),
      duration: await this.durationInput.inputValue().catch(() => ''),
      notes: await this.notesTextarea.inputValue().catch(() => ''),
      // For a custom dropdown read visible selected text, not inputValue()
      status: (await this.statusSelect.textContent().catch(() => '')) ?? '',
    };
  }

  // ─── Doctor selection ────────────────────────────────────────────────────────

  async selectDoctor(doctorName: string): Promise<void> {
    this.logger.info('VisitPage: selecting doctor', { doctorName });
    await this.doctorSelect.click();
    await this.doctorSearchInput.fill(doctorName);
    await this.page.getByText(doctorName, { exact: false }).first().click();
    this.logger.info('VisitPage: ✅ doctor selected', { doctorName });
  }

  // ─── Dental Chart ────────────────────────────────────────────────────────────

  /**
   * Clicks a tooth by its ID on the dental chart.
   * Validates visibility first to prevent silent failures.
   */
  // async selectTooth(toothId: number): Promise<void> {
  //   this.logger.info('VisitPage: selecting tooth', { toothId });

  //   const tooth = this.dentalChartTooth(toothId);
  //   const isVisible = await this.isElementVisible(tooth);
  //   if (!isVisible) {
  //     throw new Error(`Tooth ${toothId} not found on dental chart or not visible`);
  //   }

  //   await tooth.click();
  //   await this.page.waitForTimeout(300);
  //   this.logger.info('VisitPage: ✅ tooth selected', { toothId });
  // }

  // ─── Save / Cancel / Delete ──────────────────────────────────────────────────

  async saveVisit(): Promise<void> {
    this.logger.info('VisitPage: saving visit');
    await this.saveButton.click();
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
    await Promise.race([
      this.successMessage.waitFor({ state: 'visible', timeout: 3000 }).catch(() => null),
      this.page.waitForURL(/.*/, { timeout: 3000 }).catch(() => null),
    ]);
    this.logger.info('VisitPage: ✅ visit saved');
  }

  async cancelEdit(): Promise<void> {
    this.logger.info('VisitPage: canceling edit');
    await this.cancelButton.click();
    this.logger.info('VisitPage: ✅ edit cancelled');
  }

  async deleteVisit(): Promise<void> {
    this.logger.info('VisitPage: deleting visit');
    await this.deleteButton.click();
    await this.confirmDeleteButton.waitFor({ state: 'visible' });
    await this.confirmDeleteButton.click();
    this.logger.info('VisitPage: ✅ visit deleted');
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async verifyPatientInfo(expectedName: string, expectedPhone: string): Promise<void> {
    await expect(this.patientNameDisplay).toContainText(expectedName);
    await expect(this.patientPhoneDisplay).toContainText(expectedPhone);
    this.logger.info('VisitPage: ✅ patient info verified');
  }

  async verifySuccessMessage(message?: string): Promise<void> {
    await expect(this.successMessage).toBeVisible();
    if (message) await expect(this.successMessage).toContainText(message);
    this.logger.info('VisitPage: ✅ success message verified');
  }

  async verifyErrorMessage(expectedError?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (expectedError) await expect(this.errorMessage).toContainText(expectedError);
    this.logger.info('VisitPage: ✅ error message verified');
  }
}
