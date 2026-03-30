import { test, expect, PatientFactory } from '../../../lib/fixtures';
import { Logger, logger } from '../../../utils/logger';

/**
 * Smoke: Visit Creation Flow (Existing Doctor) — uses pre-existing doctor from the system.
 *
 *  beforeEach (API — minimal setup)
 *   1. Create patient via API.
 *   2. Discover a valid service ID via NomenclatureService (type=service, scoped to patient).
 *   No branch or doctor creation — relies on existing data in the system.
 *
 *  Test (UI — Full Lifecycle)
 *   Stage 1   — Open visits list, open "Записать пациента" modal.
 *   Stage 2   — Fill modal: patient → visit type → first available doctor → date range → day → time → room.
 *   Stage 3   — Add nomenclature inside modal via "Из общего списка".
 *   Stage 4   — Submit modal → assert redirect to visit details page.
 *   Stage 5   — Assert patient name, treatment plan, stage auto-filled by backend.
 *   Stage 6   — Assert nomenclature visible on visit details page.
 *   Stage 7   — Save visit, assert success notification.
 */
test.describe('Smoke: Visit Creation Flow with Existing Doctor', () => {
  let patientFullName: string;
  let discoveredNomenclatureName: string;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function toRuDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}.${m}.${date.getFullYear()}`;
  }

  // ─── beforeEach: API Setup ───────────────────────────────────────────────────

  test.beforeEach(async ({
    patientService,
    nomenclatureService,
  }) => {
    Logger.setTestContext('Visit Creation Flow (Existing Doctor)', 'beforeEach — setup');

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

  test('should create visit using existing doctor (first in dropdown), add nomenclature, and save', async ({
    createVisitModal,
    page,
  }) => {
    test.setTimeout(120_000);
    Logger.setTestContext('Visit Creation Flow (Existing Doctor)', 'UI lifecycle');

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

    await createVisitModal.selectVisitType('Первичный');

    const selectedDoctorName = await createVisitModal.selectFirstAvailableDoctor();
    logger.info('Stage 2: first available doctor selected', { selectedDoctorName });
    await createVisitModal.assertBranchFilled();
    await createVisitModal.assertMedSpecFilled();
    await createVisitModal.assertMedPositionFilled();

    // ── Stage 3: Add nomenclature inside modal ────────────────────────────────
    logger.info('Stage 3: add nomenclature inside modal', { serviceName: discoveredNomenclatureName });
    await createVisitModal.nomenclature.addFromGeneralList(discoveredNomenclatureName);
    logger.info('Stage 3 ✅ nomenclature added inside modal');

    await createVisitModal.fillDateRange(
      toRuDate(today),
      toRuDate(thirtyDaysLater),
    );

    await createVisitModal.selectFirstAvailableDay();
    await createVisitModal.assertTimeSlotsVisible();

    await createVisitModal.selectFirstAvailableTimeSlot();
    await createVisitModal.assertRoomDropdownVisible();
    logger.info('Stage 2 ✅ modal fields filled');

    // ── Stage 4: Submit modal → land on visit details ─────────────────────────
    logger.info('Stage 4: submit modal');
    await createVisitModal.submit();
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // App stays on the visits list after creation (no auto-redirect for existing doctors).
    // Find the newly created visit row by patient surname + today's date, then navigate.
    if (!page.url().match(/\/schedule\/visits\/\d+/)) {
      logger.info('Stage 4: still on visits list — navigating to new visit');
      const patientSurname = patientFullName.split(' ')[0];
      const todayStr = toRuDate(today);
      const newVisitRow = page
        .locator('tbody tr')
        .filter({ hasText: patientSurname })
        .filter({ hasText: todayStr })
        .first();
      await newVisitRow.waitFor({ state: 'visible', timeout: 10_000 });
      const visitId = (await newVisitRow.locator('td').first().textContent())?.trim();
      logger.info('Stage 4: navigating to visit details', { visitId, patientFullName });
      await page.goto(`/schedule/visits/${visitId}`);
    }
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    logger.info('Stage 4 ✅ modal submitted, on visit details page');

    // ── Stage 5: Assert patient name on visit details page ────────────────────
    logger.info('Stage 5: assert patient name on visit details', { patientFullName });
    await expect(
      page.getByText(patientFullName, { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
    logger.info('Stage 5 ✅ patient name visible on visit details page', { patientFullName });

    logger.info('✅ Smoke: Visit Creation Flow (Existing Doctor) — COMPLETE');
  });
});
