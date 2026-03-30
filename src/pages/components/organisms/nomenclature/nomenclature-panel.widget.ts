import { Page, expect } from '@playwright/test';
import { logger } from '../../../../utils/logger';

/**
 * NomenclaturePanelWidget — Organism
 *
 * Owns all interactions with the "Добавить номенклатуру" ButtonMenu that
 * appears on both the Visit Details page and inside the Create Visit modal.
 *
 * Confirmed DOM:
 *
 *  Trigger (ButtonMenu, NOT a regular button):
 *    <p class="ButtonMenu__text">Добавить номенклатуру</p>
 *
 *  Menu popup → "Из общего списка" → opens a SEPARATE modal window.
 *
 *  Nomenclature modal root:
 *    .AddNomenclatureFromStockModal  (unique — avoids strict-mode clash with
 *    create-visit modal, which also contains a "Добавить номенклатуру" button)
 *
 *  Inside nomenclature modal:
 *    Tabs: <span class="ButtonView__text">Услуги</span>
 *          <span class="ButtonView__text">Комплекты</span>
 *    Results: tr.StockNomenclatureRow
 *    Checkbox: td.StockNomenclatureRow__checkbox input[type="checkbox"]
 *    Confirm:  <span class="ButtonView__text">Добавить</span>
 *
 * @example
 * // on VisitDetailsPage
 * await visitDetails.nomenclature.addFromGeneralList('Консультация');
 *
 * // on CreateVisitModal
 * await createVisitModal.nomenclature.addFromGeneralList('Консультация');
 */
export class NomenclaturePanelWidget {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Add a nomenclature service via "Добавить номенклатуру → Из общего списка".
   *
   * Flow:
   *  1. Click the ButtonMenu trigger (p.ButtonMenu__text)
   *  2. Click "Из общего списка"
   *  3. Scope to nomenclature modal ([role="dialog"] ∋ /Добавить номенклатуру/)
   *  4. Click "Услуги" tab; wait for search input to be ready
   *  5. Fill search → wait for tr.StockNomenclatureRow
   *  6. Check checkbox in matching row (td.StockNomenclatureRow__checkbox)
   *  7. Click "Добавить" confirm scoped to nomenclature modal
   *  8. Wait for nomenclature modal to close
   *  9. Assert "Добавлено номенклатур: 1" toast on the page
   *
   * @param serviceName Partial or full service name visible in the list.
   */
  async addFromGeneralList(serviceName: string): Promise<void> {
    logger.info('NomenclaturePanelWidget: adding from general list', { serviceName });

    // ── 1. Click ButtonMenu trigger ──────────────────────────────────────────
    // Trigger text lives in <p class="ButtonMenu__text"> inside the button.
    const menuTrigger = this.page
      .locator('.ButtonMenu__text')
      .filter({ hasText: /Добавить номенклатуру/i });
    await menuTrigger.waitFor({ state: 'visible' });
    await menuTrigger.click();
    logger.info('NomenclaturePanelWidget: ButtonMenu trigger clicked');

    // ── 2. Click "Из общего списка" popup option ─────────────────────────────
    const fromListOption = this.page
      .getByRole('menuitem', { name: /Из общего списка/i })
      .or(this.page.getByText(/Из общего списка/i).first());
    await fromListOption.waitFor({ state: 'visible', timeout: 5_000 });
    await fromListOption.click();
    logger.info('NomenclaturePanelWidget: "Из общего списка" clicked');

    // ── 3. Scope to the nomenclature modal ───────────────────────────────────
    // IMPORTANT: the create-visit modal also contains the text "Добавить номенклатуру"
    // (as a button), so filtering [role="dialog"] by hasText would match 2 dialogs
    // and fail strict mode. Use the confirmed unique CSS class instead.
    const nomenclatureModal = this.page.locator('.AddNomenclatureFromStockModal');
    await nomenclatureModal.waitFor({ state: 'visible', timeout: 10_000 });
    logger.info('NomenclaturePanelWidget: nomenclature modal visible');

    // ── 4. Click "Услуги" tab; wait for search input to be interactive ───────
    const servicesTab = nomenclatureModal.getByRole('button', { name: /^Услуги$/i });
    await servicesTab.waitFor({ state: 'visible', timeout: 5_000 });
    await servicesTab.click();
    logger.info('NomenclaturePanelWidget: "Услуги" tab clicked');

    const searchInput = nomenclatureModal.getByPlaceholder(/Поиск|Search/i).first();
    await searchInput.waitFor({ state: 'visible', timeout: 8_000 });

    // Wait for the initial row list to load BEFORE filling the search.
    // Filling before initial load fires the search API while the tab is still
    // initialising, causing a frontend JS error (Cannot read .status of undefined).
    await nomenclatureModal
      .locator('tr.StockNomenclatureRow')
      .first()
      .waitFor({ state: 'visible', timeout: 8_000 });

    // ── 5. Search ────────────────────────────────────────────────────────────
    await searchInput.pressSequentially(serviceName, { delay: 50 });
    logger.info('NomenclaturePanelWidget: search filled', { serviceName });

    // ── 6. Check the matching row's checkbox ─────────────────────────────────
    const targetRow = nomenclatureModal
      .locator('tr.StockNomenclatureRow')
      .filter({ hasText: serviceName })
      .first();
    await targetRow.waitFor({ state: 'visible', timeout: 8_000 });
    // Click the label (for="checkboxN") — the correct interactive element for the
    // custom CheckboxFieldView; clicking it toggles the underlying input.
    await targetRow.locator('label.CheckboxFieldView__label').click();
    logger.info('NomenclaturePanelWidget: checkbox checked');

    // ── 7. Click confirm (if modal is still open) ────────────────────────────
    // Some checkbox selections auto-confirm and close the modal immediately.
    // Guard: only click Добавить if the modal is still visible.
    const modalStillOpen = await nomenclatureModal.isVisible();
    if (modalStillOpen) {
      const confirmBtn = nomenclatureModal.getByRole('button', { name: /Добавить/i });
      await confirmBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await confirmBtn.click();
      logger.info('NomenclaturePanelWidget: confirm clicked');

      // ── 8. Wait for nomenclature modal to close ────────────────────────────
      await nomenclatureModal.waitFor({ state: 'hidden', timeout: 10_000 });
      logger.info('NomenclaturePanelWidget: nomenclature modal closed');
    } else {
      logger.info('NomenclaturePanelWidget: modal auto-closed after checkbox — skipping confirm');
    }

    // ── 9. Assert backend confirmation toast on the page ─────────────────────
    await expect(
      this.page.getByText(/Добавлено номенклатур: 1/i),
    ).toBeVisible({ timeout: 8_000 });

    logger.info('NomenclaturePanelWidget: ✅ nomenclature added', { serviceName });
  }
}
