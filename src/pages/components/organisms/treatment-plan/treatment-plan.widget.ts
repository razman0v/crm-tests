import { Page, Locator } from '@playwright/test';
import { logger } from '../../../../utils/logger';
import { InputField } from '../../atoms';

/**
 * TreatmentPlan Organism Widget
 *
 * Encapsulates interactions with the Treatment Plan (План лечения) section
 * on the Visit Details page: adding services from the catalog and transferring
 * the plan into the active visit.
 *
 * @example
 * const plan = new TreatmentPlanWidget(page);
 * await plan.addService('Профессиональная чистка');
 * await plan.transferToVisit();
 */
export class TreatmentPlanWidget {
  private readonly page: Page;

  // Root panel container
  private readonly root: Locator;

  // Button that opens the "add service" dialog / inline form
  private readonly addServiceButton: Locator;

  // Search input inside the add-service panel
  private readonly serviceSearchInput: InputField;

  // Confirm / save inside the panel
  private readonly addConfirmButton: Locator;

  // "Transfer to visit" action button
  private readonly transferToVisitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.root = page.locator(
      '.TreatmentPlanView, [data-testid="treatment-plan"]',
    );

    this.addServiceButton = this.root.getByRole('button', {
      name: /Добавить услугу|Add Service/i,
    });

    this.serviceSearchInput = new InputField(
      page.getByPlaceholder(/Поиск услуги|Search service/i),
    );

    this.addConfirmButton = page
      .locator('.ServicePickerPanel, [data-testid="service-picker"]')
      .getByRole('button', { name: /Добавить|Add/i })
      .first();

    this.transferToVisitButton = this.root.getByRole('button', {
      name: /Перенести в визит|Transfer to visit/i,
    });
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Add a service to the treatment plan by searching for it in the catalog.
   *
   * Flow: click "Add service" → type in search → click the matching option → confirm.
   *
   * @param serviceName - Display name of the service as shown in the catalog
   */
  async addService(serviceName: string): Promise<void> {
    logger.info('TreatmentPlanWidget: adding service', { serviceName });

    await this.root.waitFor({ state: 'visible', timeout: 5000 });
    await this.addServiceButton.click();

    // Type the service name to filter the catalog
    await this.serviceSearchInput.fill(serviceName);

    // Click the first matching option in the result list
    const serviceOption = this.page
      .locator('.ServicePickerPanel, [data-testid="service-picker"]')
      .locator('.DropDownItemView__option, [role="option"]')
      .filter({ hasText: new RegExp(serviceName, 'i') })
      .first();

    await serviceOption.waitFor({ state: 'visible', timeout: 5000 });
    await serviceOption.click();

    // Confirm add if a separate confirm button is present
    const confirmVisible = await this.addConfirmButton.isVisible().catch(() => false);
    if (confirmVisible) {
      await this.addConfirmButton.click();
    }

    await this.page.waitForTimeout(300);
    logger.info('TreatmentPlanWidget: ✅ service added', { serviceName });
  }

  /**
   * Transfer the current treatment plan into the active visit.
   * Waits for the page to stabilize after the action.
   */
  async transferToVisit(): Promise<void> {
    logger.info('TreatmentPlanWidget: transferring plan to visit');

    await this.root.waitFor({ state: 'visible', timeout: 5000 });
    await this.transferToVisitButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.transferToVisitButton.click();

    // Allow the page to update after transfer
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(200);

    logger.info('TreatmentPlanWidget: ✅ plan transferred to visit');
  }
}
