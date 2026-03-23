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

  /**
   * Click the three-dots (kebab) menu on a card in the "Recommended" section
   * and select "Set Diagnosis."
   *
   * Triggered after dental-chart condition selection when the CRM surfaces
   * recommended diagnosis cards in the side panel.
   *
   * @param name - Partial case-insensitive text on the card (e.g. 'Symptom complex TM1')
   */
  async addDiagnosis(name: string): Promise<void> {
    logger.info('TreatmentPlanWidget: setting diagnosis from recommended card', { name });

    const recommendedSection = this.page.locator(
      '.RecommendedSection, [data-testid="recommended-section"], .RecommendedDiagnoses',
    );
    await recommendedSection.waitFor({ state: 'visible', timeout: 8000 });

    const card = recommendedSection
      .locator('.RecommendedCard, .CardItem, [data-testid="recommended-card"]')
      .filter({ hasText: new RegExp(name, 'i') })
      .first();

    await card.waitFor({ state: 'visible', timeout: 5000 });

    const kebab = card.locator(
      '[data-testid="card-menu"], .KebabButton, .ThreeDotsButton, button[aria-label*="more" i]',
    ).first();
    await kebab.click();

    await this.page.getByRole('menuitem', {
      name: /Установить диагноз|Set Diagnosis/i,
    }).click();

    await this.page.waitForTimeout(300);
    logger.info('TreatmentPlanWidget: ✅ diagnosis set', { name });
  }

  /**
   * Click the three-dots menu next to a service in the "Recommended" section
   * and select "Add to Treatment Plan."
   *
   * @param name - Partial case-insensitive service name.
   *               Pass an empty string or omit to target the first available item.
   */
  async addServiceFromRecommended(name = ''): Promise<void> {
    logger.info('TreatmentPlanWidget: adding recommended service to plan', { name });

    const recommendedServicesSection = this.page.locator(
      '.RecommendedServicesSection, [data-testid="recommended-services"], .RecommendedServices',
    );
    await recommendedServicesSection.waitFor({ state: 'visible', timeout: 8000 });

    const allServiceItems = recommendedServicesSection.locator(
      '.ServiceItem, .RecommendedService, [data-testid="recommended-service"]',
    );

    const targetItem = name.length > 0
      ? allServiceItems.filter({ hasText: new RegExp(name, 'i') }).first()
      : allServiceItems.first();

    await targetItem.waitFor({ state: 'visible', timeout: 5000 });

    const kebab = targetItem.locator(
      '[data-testid="service-menu"], .KebabButton, .ThreeDotsButton, button[aria-label*="more" i]',
    ).first();
    await kebab.click();

    await this.page.getByRole('menuitem', {
      name: /Добавить в план лечения|Add to Treatment Plan/i,
    }).click();

    await this.page.waitForTimeout(300);
    logger.info('TreatmentPlanWidget: ✅ service added from recommended', { name });
  }

  /**
   * Click the three-dots menu in the "In Treatment Plan" section and select
   * "Add to Current Visit," then wait for the page to reflect the change.
   */
  async finalizeServiceToVisit(): Promise<void> {
    logger.info('TreatmentPlanWidget: finalizing service to current visit');

    const inPlanSection = this.page.locator(
      '.InTreatmentPlanSection, [data-testid="in-treatment-plan"], .InTreatmentPlan',
    );
    await inPlanSection.waitFor({ state: 'visible', timeout: 8000 });

    const kebab = inPlanSection.locator(
      '[data-testid="plan-menu"], .KebabButton, .ThreeDotsButton, button[aria-label*="more" i]',
    ).first();
    await kebab.click();

    await this.page.getByRole('menuitem', {
      name: /Добавить в текущий визит|Add to Current Visit/i,
    }).click();

    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(300);
    logger.info('TreatmentPlanWidget: ✅ service finalized to current visit');
  }
}
