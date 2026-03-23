import { Page, expect } from '@playwright/test';
import { logger } from '../../../../utils/logger';

/**
 * NomenclaturePanelWidget — Organism
 *
 * Owns all interactions with the "Добавить номенклатуру" panel that appears
 * on both the Visit Details page and inside the Create Visit modal.
 *
 * Because the panel uses `this.page` (not a locked modal root), this widget is
 * reusable in any page context — compose it wherever the panel can appear.
 *
 * Known DOM (confirmed):
 *   tr.StockNomenclatureRow
 *     td.StockNomenclatureRow__checkbox
 *       div.StockNomenclatureRow__checkbox-wrapper
 *         div.CheckboxFieldView
 *           input[type="checkbox"]
 *           label.CheckboxFieldView__label
 *
 * @example
 * // VisitDetailsPage
 * await visitDetails.nomenclature.addFromGeneralList('Консультация');
 *
 * // CreateVisitModal — delegates to the same widget
 * await createVisitModal.nomenclature.addFromGeneralList('Консультация');
 */
export class NomenclaturePanelWidget {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Add a nomenclature service via the "Из общего списка" sub-menu.
   *
   * Flow:
   *  1. Click "Добавить номенклатуру"
   *  2. Click "Из общего списка"
   *  3. Scope to the panel that opens
   *  4. Search → wait for `tr.StockNomenclatureRow` rows
   *  5. Check the matching row's checkbox via `td.StockNomenclatureRow__checkbox`
   *  6. Click "Добавить" inside the panel
   *  7. Assert "Добавлено номенклатур: 1" toast
   *
   * @param serviceName Partial or full service name visible in the list.
   */
  async addFromGeneralList(serviceName: string): Promise<void> {
    logger.info('NomenclaturePanelWidget: adding from general list', { serviceName });

    // Trigger the nomenclature menu — present on both visit page and modal
    const addBtn = this.page
      .getByRole('button', { name: /Добавить номенклатуру/i })
      .first();
    await addBtn.waitFor({ state: 'visible' });
    await addBtn.click();

    // Click "Из общего списка" menu entry (role may vary by CRM version)
    const fromListOption = this.page
      .getByRole('menuitem', { name: /Из общего списка/i })
      .or(this.page.getByRole('option', { name: /Из общего списка/i }))
      .or(this.page.getByText(/Из общего списка/i).first());
    await fromListOption.waitFor({ state: 'visible', timeout: 5_000 });
    await fromListOption.click();

    // Scope to the panel that opened — identified by its search input.
    // Using .last() because the create-visit modal may already have one open.
    const panel = this.page
      .locator(
        '[role="dialog"], [role="complementary"], [class*="Panel"], [class*="Modal"], [class*="Drawer"], [class*="Sidebar"]',
      )
      .filter({ has: this.page.getByPlaceholder(/Поиск|Search/i) })
      .last();
    await panel.waitFor({ state: 'visible', timeout: 5_000 });

    // Search — no fixed debounce; wait for real DOM feedback instead
    const searchInput = panel.getByPlaceholder(/Поиск|Search/i).first();
    await searchInput.fill(serviceName);

    // Wait for results (DOM: tr.StockNomenclatureRow confirmed from real DOM)
    await panel
      .locator('tr.StockNomenclatureRow')
      .first()
      .waitFor({ state: 'visible', timeout: 8_000 });

    // Find the matching row and check its checkbox via the BEM cell selector
    const targetRow = panel
      .locator('tr.StockNomenclatureRow')
      .filter({ has: panel.getByText(serviceName, { exact: false }) })
      .first();
    await targetRow.waitFor({ state: 'visible', timeout: 5_000 });
    await targetRow
      .locator('td.StockNomenclatureRow__checkbox input[type="checkbox"]')
      .check();

    // Confirm — scoped to panel to avoid hitting page-level "Добавить" buttons
    const confirmBtn = panel
      .getByRole('button', { name: /^Добавить$/i })
      .first();
    await confirmBtn.waitFor({ state: 'visible' });
    await confirmBtn.click();

    // Backend confirmation toast
    await expect(
      this.page.getByText(/Добавлено номенклатур: 1/i),
    ).toBeVisible({ timeout: 8_000 });

    logger.info('NomenclaturePanelWidget: ✅ nomenclature added', { serviceName });
  }
}
