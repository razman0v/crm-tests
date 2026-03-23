import { Page, Locator, expect } from '@playwright/test';
import { logger } from '../../../../utils/logger';

/**
 * VisitStatus Organism Widget
 *
 * Manages the visit life-cycle state button on the Visit Details page.
 * The button label changes as the visit progresses through states:
 *
 *   "Пациент пришел" → "Начать визит" → "Завершить визит" → "Завершить прием"
 *
 * @example
 * const status = new VisitStatusWidget(page);
 * const current = await status.getStatus();
 * await status.changeStatus('Начать визит');
 */
export class VisitStatusWidget {
  private readonly page: Page;

  /**
   * The single polymorphic button whose label reflects the current state.
   * Matches all known state labels in both RU and EN.
   */
  private readonly stateButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.stateButton = page.getByRole('button', {
      name: /Пациент пришел|Начать визит|Завершить визит|Завершить прием|Patient arrived|Start visit|Complete visit/i,
    });
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns the trimmed text of the current state button.
   * Examples: "Пациент пришел", "Начать визит", "Завершить визит"
   */
  async getStatus(): Promise<string> {
    logger.debug('VisitStatusWidget: reading current status');

    await this.stateButton.waitFor({ state: 'visible', timeout: 5000 });
    const text = (await this.stateButton.textContent()) ?? '';
    const status = text.trim();

    logger.info('VisitStatusWidget: current status', { status });
    return status;
  }

  /**
   * Transition visit to `to` by clicking the state button once.
   * If the button already shows `to`, skips the click.
   *
   * Note: This method performs a single transition. If multiple transitions
   * are needed (e.g. from "Пациент пришел" to "Завершить визит"), call it
   * sequentially for each step.
   *
   * @param to - Expected button label after the click (partial match, case-insensitive)
   */
  async changeStatus(to: string): Promise<void> {
    logger.info('VisitStatusWidget: changing status', { to });

    await this.stateButton.waitFor({ state: 'visible', timeout: 5000 });
    const currentText = await this.getStatus();

    if (currentText.toLowerCase().includes(to.toLowerCase())) {
      logger.info('VisitStatusWidget: already at target status, skipping click', { to });
      return;
    }

    logger.info('VisitStatusWidget: clicking transition button', {
      from: currentText,
      to,
    });
    await this.stateButton.click();

    // Assert the button now shows the desired label
    const updatedButton = this.page.getByRole('button', {
      name: new RegExp(to, 'i'),
    });
    await expect(updatedButton).toBeVisible({ timeout: 5000 });

    logger.info('VisitStatusWidget: ✅ status changed', { to });
  }
}
