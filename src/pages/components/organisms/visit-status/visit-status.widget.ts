import { Page, Locator } from '@playwright/test';
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
 * await status.changeStatus('Пациент пришел');
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
      name: /Пациент пришел|Начать визит|Завершить визит|Завершить прием|Patient Arrived|Start Visit|Complete Visit|Complete Reception/i,
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
   * Click the status button that currently shows `label`.
   *
   * Handles any life-cycle label dynamically in both RU and EN
   * (case-insensitive partial match):
   *   - "Пациент пришел" / "Patient Arrived"
   *   - "Начать визит"   / "Start Visit"
   *   - "Завершить визит"/ "Complete Visit"
   *
   * Call sequentially for multi-step transitions:
   *   await changeStatus('Пациент пришел');
   *   await changeStatus('Начать визит');
   *
   * @param label - Visible button label to click (partial, case-insensitive)
   */
  async changeStatus(label: string): Promise<void> {
    logger.info('VisitStatusWidget: clicking status button', { label });

    const button = this.page.getByRole('button', {
      name: new RegExp(label, 'i'),
    });

    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();

    logger.info('VisitStatusWidget: ✅ status button clicked', { label });
  }
}
