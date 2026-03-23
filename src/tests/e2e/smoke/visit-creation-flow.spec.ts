import { test, expect, PatientFactory } from '../../../lib/fixtures';
import { Logger, logger } from '../../../utils/logger';

/**
 * Smoke: Visit Creation Flow — complete business-process lifecycle
 *
 *  beforeEach (API — Discovery Sweep)
 *   1. Discover Branch, Cabinet, Doctor via their services (no hardcoded IDs).
 *   2. Discover a valid service ID via NomenclatureService (type=service, scoped to patient).
 *   3. Create patient via API.
 *
 *  Test (UI — Full Lifecycle)
 *   Stage 1   — Open visits list, open "Записать пациента" modal.
 *   Stage 2   — Fill modal: patient → doctor → date range → day → time → room.
 *   Stage 3   — Add nomenclature inside modal via "Из общего списка".
 *   Stage 4   — Submit modal → assert redirect to visit details page.
 *   Stage 5   — Assert patient name, treatment plan, stage auto-filled by backend.
 *   Stage 6   — Assert nomenclature visible on visit details page.
 *   Stage 7   — Save visit, assert success notification.
 */
test.describe('Smoke: Visit Creation Flow with Nomenclature', () => {
  let patientFullName: string;
  let doctorFullName: string;
  let discoveredNomenclatureName: string;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function toRuDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}.${m}.${date.getFullYear()}`;
  }

  // ─── beforeEach: API Discovery Sweep ────────────────────────────────────────

  test.beforeEach(async ({
    patientService,
    branchService,
    employeeService,
    scheduleService,
    nomenclatureService,
  }) => {
    Logger.setTestContext('Visit Creation Flow', 'beforeEach — discovery sweep');

    const branch = await branchService.create();
    const cabinetId = branch.companyBranchCabinets![0].id;
    logger.info('beforeEach: branch + cabinet ready', { branchId: branch.id, cabinetId });

    const doctor = await employeeService.create(branch.id);
    const doctorBranchId = doctor.employeeBranchId;
    doctorFullName = `${doctor.user.surname} ${doctor.user.name}`;
    logger.info('beforeEach: doctor ready', { doctorId: doctor.id, doctorBranchId, doctorFullName });

    const now = new Date();
    await scheduleService.createSimpleShift(doctorBranchId, cabinetId, now.toISOString());
    logger.info('beforeEach: schedule created');

    const patient = await patientService.create(PatientFactory.createRandom());
    expect(patient.id).toBeGreaterThan(0);
    patientFullName = `${patient.user.surname} ${patient.user.name}`;
    logger.info('beforeEach: patient created', { patientId: patient.id, patientFullName });

    const nomenclature = await nomenclatureService.getFirstActive(patient.id);
    discoveredNomenclatureName = nomenclature.title ?? nomenclature.name ?? String(nomenclature.id);
    logger.info('beforeEach: nomenclature discovered', {
      id: nomenclature.id,
      name: discoveredNomenclatureName,
    });
  });

  // ─── Test: Full Lifecycle ────────────────────────────────────────────────────

  test('should create visit via modal, add nomenclature, and save', async ({
    createVisitModal,
    visitDetailsPage,
    page,
  }) => {
    test.setTimeout(120_000);
    Logger.setTestContext('Visit Creation Flow', 'UI lifecycle');

    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expectedPlanName = `План лечения от ${toRuDate(today)}`;

    // ── Stage 1: Open modal ───────────────────────────────────────────────────
    logger.info('Stage 1: open create visit modal');
    await createVisitModal.openFromVisitsList();
    await createVisitModal.assertVisible();
    logger.info('Stage 1 ✅ modal open');

    // ── Stage 2: Fill modal fields ────────────────────────────────────────────
    logger.info('Stage 2: fill modal fields');

    await createVisitModal.selectPatient(patientFullName);
    await createVisitModal.assertTreatmentPlanFilled();
    await createVisitModal.assertStageFilled();

    await createVisitModal.selectDoctor(doctorFullName);
    await createVisitModal.assertBranchFilled();
    await createVisitModal.assertMedSpecFilled();
    await createVisitModal.assertMedPositionFilled();

    await createVisitModal.fillDateRange(
      toRuDate(today),
      toRuDate(thirtyDaysLater),
    );

    await createVisitModal.selectFirstAvailableDay();
    await createVisitModal.assertTimeSlotsVisible();

    await createVisitModal.selectFirstAvailableTimeSlot();
    await createVisitModal.assertRoomDropdownVisible();

    await createVisitModal.selectFirstAvailableRoom();
    logger.info('Stage 2 ✅ modal fields filled');

    // ── Stage 3: Add nomenclature inside modal ────────────────────────────────
    logger.info('Stage 3: add nomenclature inside modal', { serviceName: discoveredNomenclatureName });
    await createVisitModal.nomenclature.addFromGeneralList(discoveredNomenclatureName);
    logger.info('Stage 3 ✅ nomenclature added inside modal');

    // ── Stage 4: Submit modal → land on visit details ─────────────────────────
    logger.info('Stage 4: submit modal');
    await createVisitModal.submit();
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    logger.info('Stage 4 ✅ modal submitted, on visit details page');

    // ── Stage 5: Assert patient name, plan, stage auto-filled ─────────────────
    logger.info('Stage 5: assert visit details content');
    await expect(
      page.getByText(patientFullName, { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(expectedPlanName, { exact: false }),
    ).toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByText(/Первичный этап/i),
    ).toBeVisible({ timeout: 5_000 });
    logger.info('Stage 5 ✅ patient, plan, stage all visible', { expectedPlanName });

    // ── Stage 6: Assert nomenclature visible on details page ──────────────────
    logger.info('Stage 6: assert nomenclature visible', { serviceName: discoveredNomenclatureName });
    await expect(
      page.getByText(discoveredNomenclatureName, { exact: false }),
    ).toBeVisible({ timeout: 8_000 });
    logger.info('Stage 6 ✅ nomenclature visible on visit details page');

    // ── Stage 7: Save and assert success ─────────────────────────────────────
    logger.info('Stage 7: save visit');
    const saveButton = page
      .getByRole('button', { name: /Сохранить|Save/i })
      .first();
    await saveButton.waitFor({ state: 'visible' });
    await saveButton.click();
    await expect(
      page.getByText(/(?:Визит|visit).*(?:сохранен|saved)|успешно сохранен/i),
    ).toBeVisible({ timeout: 8_000 });
    logger.info('Stage 7 ✅ success notification visible');

    logger.info('✅ Smoke: Visit Creation Flow — COMPLETE');
  });
});
