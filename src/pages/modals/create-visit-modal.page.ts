import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { config } from '../../config/config.interface';
import { NomenclaturePanelWidget } from '../components/organisms/nomenclature/nomenclature-panel.widget';

/**
 * CreateVisitModal Page Object
 *
 * Handles the "Записать пациента" modal opened from the Все визиты page.
 *
 * Cascade logic:
 *  Patient selected  → План лечения, Этап auto-fill
 *  Doctor selected   → Филиал, Мед. специализация, Мед. должность auto-fill
 *  Day card clicked  → Выбрать время визита section appears
 *  Time slot clicked → От/До fills, Кабинет dropdown appears
 */
export class CreateVisitModal extends BasePage {
  // ─── Modal root ──────────────────────────────────────────────────────────────
  readonly modal: Locator;
  readonly closeButton: Locator;

  // ─── Patient section ─────────────────────────────────────────────────────────
  readonly patientDropdown: Locator;
  readonly treatmentPlanDropdown: Locator;
  readonly stageDropdown: Locator;
  readonly treatmentPlanInput: Locator; // for new patient flow
  readonly stageInput: Locator; // for new patient flow

  // ─── Visit type ───────────────────────────────────────────────────────────────
  // Field is an input (fill-able), NOT a click+option dropdown.
  readonly visitTypeInput: Locator;

  // ─── Visit purpose ────────────────────────────────────────────────────────────
  readonly visitPurposeTextarea: Locator;

  // ─── Doctor assignment mode ───────────────────────────────────────────────────
  readonly byDoctorRadio: Locator;
  readonly bySpecialityRadio: Locator;

  // ─── Doctor section ───────────────────────────────────────────────────────────
  readonly doctorDropdown: Locator;
  readonly branchDropdown: Locator;
  readonly medSpecDropdown: Locator;
  readonly medPositionDropdown: Locator;

  // ─── Nomenclature ─────────────────────────────────────────────────────────────
  readonly addNomenclatureButton: Locator;

  /** Reusable panel widget — owns all "Добавить номенклатуру" interactions. */
  readonly nomenclature: NomenclaturePanelWidget;

  // ─── Date & time section ──────────────────────────────────────────────────────
  readonly desiredDateFromInput: Locator;
  readonly desiredDateToInput: Locator;
  readonly desiredTimeFromInput: Locator;
  readonly desiredTimeToInput: Locator;
  readonly dateSlider: Locator;
  readonly timeSlotsHeader: Locator;
  readonly timeSlotsSection: Locator;
  readonly timeFromDisplay: Locator;
  readonly timeToDisplay: Locator;
  readonly roomDropdown: Locator;

  // ─── Form actions ─────────────────────────────────────────────────────────────
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  // ─── List-page trigger ───────────────────────────────────────────────────────
  readonly addVisitButton: Locator;

  constructor(page: Page, config: config) {
    super(page, config);

    this.modal = page.locator('[role="dialog"]').filter({ hasText: /Записать пациента/i });

    // Close button: icon button (no text) at the top-right of the modal header
    this.closeButton = this.modal.locator('.IconView.ModalView__close');

    // Exisiting Patient
    this.patientDropdown = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /^Пациент/i })
      .locator('.DropDownFieldView');

    this.treatmentPlanDropdown = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /^План лечения:$/i })
      .locator('.DropDownFieldView');

    this.stageDropdown = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /^Этап:$/i })
      .locator('.DropDownFieldView');

    // New Patient
    this.treatmentPlanInput = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /Название плана лечения/i })
      .locator('input');

    this.stageInput = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /Название этапа/i })
      .locator('input');

    // Visit type — DropDownFieldView (same pattern as patient/doctor)
    this.visitTypeInput = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /Тип визита/i })
      .locator('.DropDownFieldView');

    // Purpose
    this.visitPurposeTextarea = this.modal.getByPlaceholder(/Цель визита/i);

    // Doctor assignment mode
    this.byDoctorRadio = this.modal.getByRole('radio', { name: /По врачу/i });
    this.bySpecialityRadio = this.modal.getByRole('radio', { name: /По специальности/i });

    // Doctor section
    this.doctorDropdown = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /^Врач/i })
      .locator('.DropDownFieldView');

    this.branchDropdown = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /^Филиал/i })
      .locator('.DropDownFieldView');

    this.medSpecDropdown = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /Мед\.?\s*специализация/i })
      .locator('.DropDownFieldView');

    this.medPositionDropdown = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /Мед\.?\s*должность/i })
      .locator('.DropDownFieldView');

    // Nomenclature
    this.addNomenclatureButton = this.modal.getByRole('button', {
      name: /Добавить номенклатуру/i,
    });

    // Desired dates inputs (two separate date inputs inside one FieldLayoutView)
    const desiredDatesField = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /Желаемые даты/i });
    this.desiredDateFromInput = desiredDatesField.locator('input').first();
    this.desiredDateToInput = desiredDatesField.locator('input').last();

    // Desired times inputs (two separate time inputs inside one FieldLayoutView)
    const desiredTimesField = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /Желаемое время:/i });
    this.desiredTimeFromInput = desiredTimesField.locator('input').first();
    this.desiredTimeToInput = desiredTimesField.locator('input').last();

    // DateSlider — day cards strip (active slides have .DateSlider__slide_active)
    this.dateSlider = this.modal.locator('.DateSlider');

    // Time section (appears after a day card is selected)
    this.timeSlotsHeader = this.modal.locator('text=Выбрать время визита:');
    this.timeSlotsSection = this.modal.locator('.VisitTimeAndCabinetBlock__time-slots');

    // From / To time displays (filled automatically when time slot is chosen)
    const fromField = this.modal.locator('.FieldLayoutView').filter({ hasText: /^От/i });
    const toField = this.modal.locator('.FieldLayoutView').filter({ hasText: /^До/i });
    this.timeFromDisplay = fromField.locator('input');
    this.timeToDisplay = toField.locator('input');

    // Кабинет (visible only after time slot is selected)
    this.roomDropdown = this.modal
      .locator('.FieldLayoutView')
      .filter({ hasText: /^Кабинет/i })
      .locator('.DropDownFieldView');

    // Actions
    this.submitButton = this.modal.getByRole('button', { name: /Создать визит/i });
    this.cancelButton = this.modal.getByRole('button', { name: /Отмена/i });

    // Trigger (lives outside the modal on the visits-list page)
    this.addVisitButton = page.getByRole('button', { name: /Добавить визит|Add visit/i });

    // Nomenclature panel widget (shared with VisitDetailsPage)
    this.nomenclature = new NomenclaturePanelWidget(page);
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  /** Navigate to the visits list and open the modal. */
  async openFromVisitsList(): Promise<void> {
    this.logger.info('CreateVisitModal: navigating to visits list');
    await super.goto('/schedule/visits');
    await this.addVisitButton.waitFor({ state: 'visible' });
    this.logger.info('CreateVisitModal: clicking "Add visit" button');
    await this.addVisitButton.click();
    await this.modal.waitFor({ state: 'visible' });
    this.logger.info('CreateVisitModal: ✅ modal opened');
  }

  /** Close the modal via the × button. */
  async close(): Promise<void> {
    this.logger.info('CreateVisitModal: closing modal');
    await this.closeButton.click();
    await this.modal.waitFor({ state: 'hidden' });
    this.logger.info('CreateVisitModal: ✅ modal closed');
  }

  // ─── Patient ─────────────────────────────────────────────────────────────────

  /**
   * Select a patient from the dropdown.
   * Types the search term, then clicks the matching option.
   * Waits for the cascade auto-fill (Plan лечения / Этап).
   * @param searchTerm Partial or full patient name
   */
  async selectPatient(searchTerm: string): Promise<void> {
    this.logger.info('CreateVisitModal: selecting patient', { searchTerm });
    await this.patientDropdown.click();
    const searchInput = this.page.locator('.DropDownFieldView__search-input');
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill(searchTerm);
    const option = this.page
      .locator('.DropDownItemView__option')
      .filter({ hasText: searchTerm })
      .first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    await searchInput.waitFor({ state: 'hidden' });
    this.logger.info('CreateVisitModal: ✅ patient selected', { searchTerm });
  }

  // ─── Visit type ───────────────────────────────────────────────────────────────

  /**
   * Select a visit type via the autocomplete input.
   * Flow: click input → fill search term → click matching option → wait for dismiss.
   * @param visitType Visible option text, e.g. "Первичный"
   */
  async selectVisitType(visitType: string): Promise<void> {
    this.logger.info('CreateVisitModal: selecting visit type', { visitType });
    await this.visitTypeInput.waitFor({ state: 'visible' });
    await this.visitTypeInput.click();
    const searchInput = this.page.locator('.DropDownFieldView__search-input');
    await searchInput.waitFor({ state: 'visible', timeout: 5_000 });
    await searchInput.fill(visitType);
    const option = this.page
      .locator('.DropDownItemView__option')
      .filter({ hasText: new RegExp(visitType, 'i') })
      .first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click();
    await searchInput.waitFor({ state: 'hidden' });
    this.logger.info('CreateVisitModal: ✅ visit type selected', { visitType });
  }

  // ─── Purpose ─────────────────────────────────────────────────────────────────

  async fillVisitPurpose(purpose: string): Promise<void> {
    this.logger.info('CreateVisitModal: filling visit purpose');
    await this.visitPurposeTextarea.fill(purpose);
    this.logger.info('CreateVisitModal: ✅ visit purpose filled');
  }

  // ─── Doctor ───────────────────────────────────────────────────────────────────

  /**
   * Select the first doctor from the dropdown without typing a search term.
   * Opens the dropdown, waits for options to appear, and clicks the first one.
   * Returns the doctor name text.
   */
  async selectFirstAvailableDoctor(): Promise<string> {
    this.logger.info('CreateVisitModal: selecting first available doctor');
    await this.doctorDropdown.click();
    const searchInput = this.page.getByPlaceholder(/Начните вводить символы для поиска|Search/i).first();
    await searchInput.waitFor({ state: 'visible' });
    const firstOption = this.page.locator('.DropDownItemView__option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 10_000 });
    const doctorName = (await firstOption.textContent())?.trim() ?? '';
    await firstOption.click();
    await this.page.waitForTimeout(300);
    this.logger.info('CreateVisitModal: ✅ first available doctor selected', { doctorName });
    return doctorName;
  }

  /**
   * Select a doctor from the dropdown.
   * Waits for the cascade auto-fill (Филиал / Мед. специализация / Мед. должность).
   * @param searchTerm Partial or full doctor name
   */
  async selectDoctor(searchTerm: string): Promise<void> {
    this.logger.info('CreateVisitModal: selecting doctor', { searchTerm });
    await this.doctorDropdown.click();
    const searchInput = this.page.getByPlaceholder(/Начните вводить символы для поиска|Search/i).first();
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.pressSequentially(searchTerm, { delay: 50 });
    await searchInput.fill(searchTerm);
    await this.page.getByText(searchTerm, { exact: false }).first().click();
    await this.page.waitForTimeout(300);
    this.logger.info('CreateVisitModal: ✅ doctor selected', { searchTerm });
  }

  // ─── Date range ────────────────────────────────────────────────────────────

  /**
   * Fill the desired date range inputs.
   * @param from Date string in DD.MM.YYYY format
   * @param to   Date string in DD.MM.YYYY format
   */
  async fillDateRange(from: string, to: string): Promise<void> {
    this.logger.info('CreateVisitModal: filling date range', { from, to });
    await this.desiredDateFromInput.fill(from);
    await this.desiredDateToInput.fill(to);
    await this.page.keyboard.press('Enter'); // to close open datepicker
    this.logger.info('CreateVisitModal: ✅ date range filled');
  }

  // ─── Day card selection ───────────────────────────────────────────────────────

  /**
   * Click a specific day card in the DateSlider strip.
   * @param dayLabel Visible day text, e.g. "12 мар"
   */
  async selectDay(dayLabel: string): Promise<void> {
    this.logger.info('CreateVisitModal: selecting day card', { dayLabel });
    const dayCard = this.dateSlider
      .locator('.DateSlider__slide')
      .filter({ hasText: dayLabel })
      .first();
    await dayCard.waitFor({ state: 'visible' });
    await dayCard.click();
    this.logger.info('CreateVisitModal: ✅ day selected', { dayLabel });
  }

  /**
   * Click the first active (available) day slide in the DateSlider.
   * Active slides have class .DateSlider__slide_active.
   * Returns the text content of the clicked slide.
   */
  async selectFirstAvailableDay(): Promise<string> {
    this.logger.info('CreateVisitModal: selecting first available day');
    await this.dateSlider.waitFor({ state: 'visible', timeout: 10000 });
    const activeSlides = this.dateSlider.locator('.splide__slide.is-active.is-visible');
    await expect(activeSlides).toBeVisible({ timeout: 10000 });
    const dayLabel = ((await activeSlides.textContent()) ?? '').trim();
    await activeSlides.click();
    this.logger.info('CreateVisitModal: ✅ first available day selected', { dayLabel });
    return dayLabel;
  }

  // ─── Time slot ────────────────────────────────────────────────────────────────

  /**
   * Click a specific time slot button.
   * Waits for Кабинет dropdown to appear after selection.
   * @param time Exact time string, e.g. "09:00"
   */
  async selectTimeSlot(time: string): Promise<void> {
    this.logger.info('CreateVisitModal: selecting time slot', { time });
    const slot = this.timeSlotsSection.locator('.RadioFieldView__label', { hasText: time });
    await slot.waitFor({ state: 'visible' });
    await slot.click();
    await expect(this.timeFromDisplay).toHaveValue(time);
    //await this.page.waitForTimeout(300);
    this.logger.info('CreateVisitModal: ✅ time slot selected', { time });
  }

  /**
   * Click the first available (not disabled) time slot.
   * Returns the time text of the clicked slot.
   */
  async selectFirstAvailableTimeSlot(): Promise<string> {
    this.logger.info('CreateVisitModal: selecting first available time slot');
    await this.timeSlotsSection.waitFor({ state: 'visible' });

    const slotContainers = this.timeSlotsSection.locator('.RadioFieldView');
    const count = await slotContainers.count();

    for (let i = 0; i < count; i++) {
      const container = slotContainers.nth(i);
      const input = container.locator('input');
      if (!(await input.isDisabled())) {
        const label = container.locator('.RadioFieldView__label');
        const timeText = (await label.textContent())?.trim() ?? '';
        await label.click();
        await this.page.waitForTimeout(300);
        this.logger.info('CreateVisitModal: ✅ first available slot selected', { time: timeText });
        return timeText;
      }
    }

    throw new Error('CreateVisitModal: no available (enabled) time slots found');
  }

  // ─── Room ─────────────────────────────────────────────────────────────────────

  /**
   * Select a room from the Кабинет dropdown.
   * Requires a time slot to be selected first.
   * @param roomName Visible room label, e.g. "каб 201"
   */
  async selectRoom(roomName: string): Promise<void> {
    this.logger.info('CreateVisitModal: selecting room', { roomName });
    await this.roomDropdown.waitFor({ state: 'visible' });
    await this.roomDropdown.click();
    await this.page
      .getByRole('option', { name: roomName })
      .or(this.page.getByText(roomName, { exact: false }).first())
      .click();
    this.logger.info('CreateVisitModal: ✅ room selected', { roomName });
  }

  /**
   * Select the first available room from the Кабинет dropdown.
   * Returns the room label text.
   */
  async selectFirstAvailableRoom(): Promise<string> {
    this.logger.info('CreateVisitModal: selecting first available room');
    await this.roomDropdown.waitFor({ state: 'visible' });
    await this.roomDropdown.click();

    // Options render as a DOM portal outside [role="dialog"] — must scope to page
    const firstOption = this.page
      .locator('.DropDownItemView__option')
      .first();
    await firstOption.waitFor({ state: 'visible', timeout: 5_000 });
    const roomName = (await firstOption.textContent())?.trim() ?? '';
    await firstOption.click();
    this.logger.info('CreateVisitModal: ✅ first available room selected', { roomName });
    return roomName;
  }

  // ─── Nomenclature ─────────────────────────────────────────────────────────────

  /**
   * Add a nomenclature service via the "Из общего списка" sub-menu.
   * Works both inside the create-visit modal and on the visit-details page.
   *
   * Flow: Добавить номенклатуру → Из общего списка → search → check → Добавить
   *
   * @param serviceName Partial or full service name to search for and select.
   */
  /**
   * @deprecated Call `this.nomenclature.addFromGeneralList(serviceName)` directly.
   * Kept for backward compatibility with existing tests against the modal.
   */
  async addNomenclatureFromGeneralList(serviceName: string): Promise<void> {
    return this.nomenclature.addFromGeneralList(serviceName);
  }

  // ─── Submit / Cancel ─────────────────────────────────────────────────────────

  async submit(): Promise<void> {
    this.logger.info('CreateVisitModal: submitting');
    await this.submitButton.click();
    await this.modal.waitFor({ state: 'hidden', timeout: 10_000 });
    this.logger.info('CreateVisitModal: ✅ form submitted and modal closed');
  }

  async cancel(): Promise<void> {
    this.logger.info('CreateVisitModal: cancelling');
    await this.cancelButton.click();
    await this.modal.waitFor({ state: 'hidden' });
    this.logger.info('CreateVisitModal: ✅ cancelled');
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async assertVisible(): Promise<void> {
    await expect(this.modal).toBeVisible();
    this.logger.info('CreateVisitModal: ✅ modal is visible');
  }

  async assertHidden(): Promise<void> {
    await expect(this.modal).toBeHidden();
    this.logger.info('CreateVisitModal: ✅ modal is hidden');
  }

  /** Assert Plan лечения was auto-filled after patient selection. */
  async assertTreatmentPlanFilled(): Promise<void> {
    await this.treatmentPlanInput
      .or(this.treatmentPlanDropdown)
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });

    let value = '';
    if (await this.treatmentPlanInput.isVisible()) {
      value = await this.treatmentPlanInput.inputValue();
    } else {
      value = (await this.treatmentPlanDropdown.textContent())?.trim() ?? '';
    }
    expect(value).not.toBe('');
    this.logger.info('CreateVisitModal: ✅ treatment plan is filled', { value });
  }

  /** Assert Этап was auto-filled after patient selection. */
  async assertStageFilled(): Promise<void> {
    await this.stageInput
      .or(this.stageDropdown)
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });

    let value = '';
    if (await this.stageInput.isVisible()) {
      value = await this.stageInput.inputValue();
    } else {
      value = (await this.stageDropdown.textContent())?.trim() ?? '';
    }
    expect(value).not.toBe('');
    this.logger.info('CreateVisitModal: ✅ stage is filled', { value });
  }

  /** Assert Филиал was auto-filled after doctor selection. */
  async assertBranchFilled(): Promise<void> {
    const text = (await this.branchDropdown.textContent())?.trim() ?? '';
    expect(text).not.toBe('');
    this.logger.info('CreateVisitModal: ✅ branch is filled', { text });
  }

  /** Assert Мед. специализация was auto-filled after doctor selection. */
  async assertMedSpecFilled(): Promise<void> {
    const text = (await this.medSpecDropdown.textContent())?.trim() ?? '';
    expect(text).not.toBe('');
    this.logger.info('CreateVisitModal: ✅ med spec is filled', { text });
  }

  /** Assert Мед. должность was auto-filled after doctor selection. */
  async assertMedPositionFilled(): Promise<void> {
    const text = (await this.medPositionDropdown.textContent())?.trim() ?? '';
    expect(text).not.toBe('');
    this.logger.info('CreateVisitModal: ✅ med position is filled', { text });
  }

  /** Assert the time-slot section is visible (appears after a day card is clicked). */
  async assertTimeSlotsVisible(): Promise<void> {
    await expect(this.timeSlotsSection).toBeVisible();
    await expect(this.timeSlotsSection.locator('.RadioFieldView').first()).toBeVisible();
    this.logger.info('CreateVisitModal: ✅ time slots grid is visible');
  }

  /** Assert the Кабинет dropdown is visible (appears after a time slot is selected). */
  async assertRoomDropdownVisible(): Promise<void> {
    await expect(this.roomDropdown).toBeVisible();
    this.logger.info('CreateVisitModal: ✅ room dropdown is visible');
  }

  /** Assert the Кабинет dropdown is NOT yet visible. */
  async assertRoomDropdownHidden(): Promise<void> {
    await expect(this.roomDropdown).toBeHidden();
    this.logger.info('CreateVisitModal: ✅ room dropdown is hidden');
  }
}
