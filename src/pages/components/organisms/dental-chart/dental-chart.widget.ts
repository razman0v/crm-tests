import { Page, Locator } from '@playwright/test';
import { logger } from '../../../../utils/logger';
import { SelectDropdown } from '../../atoms';

/**
 * FDI tooth number → CSS left-offset in the TeethMap SVG grid.
 * Mirrors the mapping in visit.page.ts; the widget is the canonical owner.
 */
export const TOOTH_COORDINATES: Record<number, string> = {
  // Upper right quadrant (18–11)
  18: '74.5px', 17: '66.5px', 16: '58.5px', 15: '50.5px',
  14: '42.5px', 13: '34.5px', 12: '26.5px', 11: '18.5px',
  // Upper left quadrant (21–28)
  21: '10.5px', 22: '18.5px', 23: '26.5px', 24: '34.5px',
  25: '42.5px', 26: '50.5px', 27: '58.5px', 28: '66.5px',
  // Lower left quadrant (38–31)
  38: '74.5px', 37: '66.5px', 36: '58.5px', 35: '50.5px',
  34: '42.5px', 33: '34.5px', 32: '26.5px', 31: '18.5px',
  // Lower right quadrant (41–48)
  41: '10.5px', 42: '18.5px', 43: '26.5px', 44: '34.5px',
  45: '42.5px', 46: '50.5px', 47: '58.5px', 48: '66.5px',
};

/**
 * DentalChart Organism Widget
 *
 * Encapsulates all interactions with the interactive teeth map on the
 * Visit Details page: tooth selection, condition marking, and chart save.
 *
 * Optionally call `isolate()` in tests that do not need real chart API calls
 * – it mounts page.route() stubs so the widget works in full visual isolation.
 *
 * @example
 * const chart = new DentalChartWidget(page);
 * await chart.selectTooth(16);
 * await chart.markCondition('Кариес');
 * await chart.saveChart();
 */
export class DentalChartWidget {
  private readonly page: Page;

  // Root container for the interactive teeth grid
  private readonly teethSvgRoot: Locator;

  // Panel that appears after a tooth is selected
  private readonly conditionPanel: Locator;

  // Condition selector inside the panel (custom dropdown)
  private readonly conditionDropdown: SelectDropdown;

  // Save button scoped inside the dental chart section
  private readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.teethSvgRoot = page.locator('.TeethMap__teeth-svg');

    // Panel rendered next to the chart after tooth selection
    this.conditionPanel = page.locator(
      '.ToothConditionPanel, [data-testid="tooth-condition-panel"]',
    );

    // Custom dropdown inside the condition panel
    this.conditionDropdown = new SelectDropdown(
      this.conditionPanel.locator('.DropDownFieldView').first(),
      page,
    );

    // Chart save is scoped inside the dental chart card, not the page-level save
    this.saveButton = page
      .locator('.DentalChartView, [data-testid="dental-chart"]')
      .getByRole('button', { name: /Сохранить|Save/i })
      .first();
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Returns the SVG path locator for a given FDI tooth number.
   * Uses the coordinate-based grid strategy for cross-browser stability.
   */
  private getToothLocator(toothNumber: number): Locator {
    const leftCoord = TOOTH_COORDINATES[toothNumber];
    if (!leftCoord) {
      const available = Object.keys(TOOTH_COORDINATES).join(', ');
      throw new Error(
        `Tooth number ${toothNumber} is not in TOOTH_COORDINATES. Available: ${available}`,
      );
    }
    // Match both "left: 74.5px" and "left:74.5px" (spaces vary by browser)
    return this.teethSvgRoot
      .locator(
        `div[style*="left: ${leftCoord}"], div[style*="left:${leftCoord}"]`,
      )
      .locator('svg path')
      .first();
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Click a tooth by its FDI number (11–48).
   * After clicking, the condition panel becomes visible.
   *
   * @param toothNumber - FDI tooth number (e.g. 16 for upper-left first molar)
   */
  async selectTooth(toothNumber: number): Promise<void> {
    logger.info('DentalChartWidget: selecting tooth', { toothNumber });

    const tooth = this.getToothLocator(toothNumber);
    await tooth.waitFor({ state: 'visible', timeout: 5000 });
    await tooth.click();
    // Allow the condition panel animation to complete
    await this.page.waitForTimeout(300);

    logger.info('DentalChartWidget: ✅ tooth selected', { toothNumber });
  }

  /**
   * Mark a condition on the currently selected tooth.
   * Requires `selectTooth()` to have been called first.
   *
   * @param condition - Condition label as shown in the dropdown (e.g. 'Кариес')
   */
  async markCondition(condition: string): Promise<void> {
    logger.info('DentalChartWidget: marking condition', { condition });

    await this.conditionPanel.waitFor({ state: 'visible', timeout: 5000 });
    await this.conditionDropdown.selectByLabel(condition);

    logger.info('DentalChartWidget: ✅ condition marked', { condition });
  }

  /**
   * Save the current state of the dental chart.
   * Waits for any loading indicators to disappear after clicking save.
   */
  async saveChart(): Promise<void> {
    logger.info('DentalChartWidget: saving chart');

    await this.saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.saveButton.click();

    // Wait for the save loading state to clear
    const loadingIndicator = this.page.locator(
      '[data-testid="loading"], .LoadingView',
    );
    await loadingIndicator
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {
        // Loading indicator may not be present for synchronous saves
      });

    logger.info('DentalChartWidget: ✅ chart saved');
  }

  /**
   * Mount page.route() stubs for dental chart API endpoints.
   * Call this in tests where visual chart rendering must be decoupled
   * from real backend state (e.g. smoke tests, component-level assertions).
   *
   * @example
   * const chart = new DentalChartWidget(page);
   * await chart.isolate();           // stubs out API before navigating
   * await visitDetailsPage.goto(visitId);
   */
  async isolate(): Promise<void> {
    logger.info('DentalChartWidget: mounting route stubs for visual isolation');

    await this.page.route('**/api/v1/health/teeth/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await this.page.route('**/api/v1/health/dental-chart/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ teeth: [] }),
      }),
    );

    logger.info('DentalChartWidget: ✅ route stubs active');
  }
}
