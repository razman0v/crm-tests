import { test, expect, PatientFactory, VisitFormFactory } from '../../../lib/fixtures';
import { Logger, logger } from '../../../utils/logger';

/**
 * Smoke: CreateVisitModal
 *
 * Covers:
 *  1. Modal Lifecycle   — open / close via × / close via Отмена
 *  2. Form Structure    — all key fields rendered, date range accepted
 *  3. Patient Cascade   — patient selected → Тип плана + Этап auto-fill
 *  4. Time Flow         — date range → day card → time slots → room dropdown
 *
 * Strategy: hybrid (API для создания пациента, UI для проверки поведения).
 */
test.describe('Smoke: CreateVisitModal', () => {

  // ─── 1. Modal Lifecycle ─────────────────────────────────────────────────────

  test.describe('Modal Lifecycle', () => {
    test('should open from the visits list page', async ({ createVisitModal }) => {
      Logger.setTestContext('CreateVisitModal Smoke', 'Modal opens');
      await createVisitModal.openFromVisitsList();
      await createVisitModal.assertVisible();
    });

    test('should close via the × button', async ({ createVisitModal }) => {
      Logger.setTestContext('CreateVisitModal Smoke', 'Close via ×');
      await createVisitModal.openFromVisitsList();
      await createVisitModal.close();
      await createVisitModal.assertHidden();
    });

    test('should close via the "Отмена" button', async ({ createVisitModal }) => {
      Logger.setTestContext('CreateVisitModal Smoke', 'Close via Отмена');
      await createVisitModal.openFromVisitsList();
      await createVisitModal.cancel();
      await createVisitModal.assertHidden();
    });
  });

  // ─── 2. Form Structure ──────────────────────────────────────────────────────

  test.describe('Form Structure', () => {
    test('should accept a desired date range', async ({ createVisitModal }) => {
      Logger.setTestContext('CreateVisitModal Smoke', 'Date range');
      const { dateFrom, dateTo } = VisitFormFactory.createDefault();

      await createVisitModal.openFromVisitsList();
      await createVisitModal.fillDateRange(dateFrom, dateTo);

      await expect(createVisitModal.desiredDateFromInput).toHaveValue(dateFrom);
      await expect(createVisitModal.desiredDateToInput).toHaveValue(dateTo);
    });

    test('should display the visit purpose textarea', async ({ createVisitModal }) => {
      Logger.setTestContext('CreateVisitModal Smoke', 'Purpose textarea');
      await createVisitModal.openFromVisitsList();
      await expect(createVisitModal.visitPurposeTextarea).toBeVisible();
      await createVisitModal.fillVisitPurpose('Профилактический осмотр');
      await expect(createVisitModal.visitPurposeTextarea).toHaveValue('Профилактический осмотр');
    });
  });

  // ─── 3. Patient Cascade ─────────────────────────────────────────────────────

  test.describe('Patient Cascade', () => {
    let patientSearchTerm: string;

    test.beforeAll(async ({ patientService }) => {
      Logger.setTestContext('CreateVisitModal Smoke', 'beforeAll — create patient');
      const patient = await patientService.create(PatientFactory.createRandom());
      expect(patient.id).toBeGreaterThan(0);
      patientSearchTerm = `${patient.user.surname} ${patient.user.name}`;
      logger.info('beforeAll: patient created for cascade tests', { patientSearchTerm });
    });

    test('patient selection should not crash the modal', async ({ createVisitModal }) => {
      Logger.setTestContext('CreateVisitModal Smoke', 'Patient selection');
      await createVisitModal.openFromVisitsList();
      await createVisitModal.selectPatient(patientSearchTerm);
      // Modal remains open and cascade dropdowns are rendered
      await createVisitModal.assertVisible();
      const isPlanVisible = await createVisitModal.treatmentPlanInput.isVisible() ||
        await createVisitModal.treatmentPlanDropdown.isVisible();
      const isStageVisible = await createVisitModal.stageInput.isVisible() ||
        await createVisitModal.stageDropdown.isVisible();

      expect(isPlanVisible, 'Поле "План лечения" должно быть видно').toBeTruthy();
      expect(isStageVisible, 'Поле "Этап" должно быть видно').toBeTruthy();
    });

    test('should auto-fill "План лечения" and "Этап" after patient selection', async ({
      createVisitModal,
    }) => {
      Logger.setTestContext('CreateVisitModal Smoke', 'Patient cascade fill');
      await createVisitModal.openFromVisitsList();
      await createVisitModal.selectPatient(patientSearchTerm);
      await createVisitModal.assertTreatmentPlanFilled();
      await createVisitModal.assertStageFilled();
    });
  });

  // ─── 4. Time Selection Flow ─────────────────────────────────────────────────

  //TO DO — эти тесты зависят от наличия открытых слотов в живом расписании, иначе падают с понятной ошибкой из selectFirstAvailableDay / selectFirstAvailableTimeSlot. Можно будет добавить API-шаг в beforeAll для создания такого слота, но пока оставим так, чтобы не плодить тестовые данные.

  test.describe('Time Selection Flow', () => {
    /**
     * These tests depend on the live schedule having at least one open slot
     * within the default 30-day window.  If none are found, the test fails
     * with a descriptive error from selectFirstAvailableDay / selectFirstAvailableTimeSlot.
     */
    let doctorSearchTerm: string;

    // test.beforeAll(async ({ branchService, employeeService, scheduleService }) => {
    //   Logger.setTestContext('CreateVisitModal Smoke', 'beforeAll — create doctor with schedule');
    //   const branch = await branchService.create();
    //   const cabinetId = branch.companyBranchCabinets![0].id;

    //   const doctor = await employeeService.create(branch.id);
    //   doctorSearchTerm = `${doctor.user.surname} ${doctor.user.name}`;

    //   const today = new Date();
    //   const dateFrom = today.toISOString().split('T')[0];
    //   const dateTo = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    //   await scheduleService.createSimpleShift(doctor.employeeBranchId, cabinetId, dateFrom, dateTo);

    //   logger.info('beforeAll: doctor + schedule created for time flow tests', { doctorSearchTerm });
    // });

    doctorSearchTerm = 'Пашеный Максим';

    test('day card selection should reveal the time slots section', async ({ createVisitModal }) => {
      Logger.setTestContext('CreateVisitModal Smoke', 'Day card → time slots');
      const { dateFrom, dateTo } = VisitFormFactory.createDefault();

      await createVisitModal.openFromVisitsList();
      await createVisitModal.selectDoctor(doctorSearchTerm);
      await createVisitModal.fillDateRange(dateFrom, dateTo);
      await createVisitModal.selectFirstAvailableDay();
      await createVisitModal.assertTimeSlotsVisible();
    });

    test('time slot selection should reveal the "Кабинет" dropdown', async ({ createVisitModal }) => {
      Logger.setTestContext('CreateVisitModal Smoke', 'Time slot → Кабинет');
      const { dateFrom, dateTo } = VisitFormFactory.createDefault();

      await createVisitModal.openFromVisitsList();
      await createVisitModal.selectDoctor(doctorSearchTerm);
      await createVisitModal.fillDateRange(dateFrom, dateTo);
      await createVisitModal.selectFirstAvailableDay();
      await createVisitModal.assertRoomDropdownHidden();
      await createVisitModal.selectFirstAvailableTimeSlot();
      await createVisitModal.roomDropdown.waitFor({ state: 'visible', timeout: 5000 });
      await createVisitModal.assertRoomDropdownVisible();
    });
  });
});
