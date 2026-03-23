import { test, expect, PatientFactory, VisitFormFactory } from '../../../lib/fixtures';
import { Logger, logger } from '../../../utils/logger';

/**
 * Smoke: Visit Execution & Dental Charting
 *
 * Stages:
 *  1. Entry      — navigate to the created visit and verify the patient name in the header.
 *  2. Check-in   — click "Patient Arrived," verify the success alert, and conditionally
 *                  execute any pending requests from the "Requests" tab (badge > 0).
 *  3. Initiation — click "Start Visit" and verify the "Dental Chart" tab appears.
 *  4. Charting   — open Dental Chart, select Tooth 12 checkbox, search "Intact tooth"
 *                  in the Condition column, and set a diagnosis from the Recommended cards.
 *  5. Finalize   — verify Recommended services appear, add one to the Treatment Plan,
 *                  transfer it to the current visit, and click Save.
 *
 * Strategy: hybrid — API for state setup (branch, doctor, schedule, patient, visit),
 * UI via VisitDetailsPage composition page for behaviour verification.
 */
test.describe('Smoke: Visit Execution & Dental Charting', () => {
  let visitId: number;
  let patientFullName: string;

  test.beforeEach(async ({
    patientService,
    branchService,
    employeeService,
    scheduleService,
    visitService,
    nomenclatureService,
  }) => {
    Logger.setTestContext('Visit Execution Smoke', 'beforeEach — create visit');

    // Create branch + doctor
    const branch = await branchService.create();
    const cabinetId = branch.companyBranchCabinets![0].id;
    const doctor = await employeeService.create(branch.id);
    const doctorBranchId = doctor.employeeBranchId;

    // Create work schedule so the visit can be booked
    const now = new Date();
    await scheduleService.createSimpleShift(doctorBranchId, cabinetId, now.toISOString());

    // Create patient
    const patientPayload = PatientFactory.createRandom();
    const patient = await patientService.create(patientPayload);
    expect(patient.id).toBeGreaterThan(0);
    patientFullName = `${patient.user.surname} ${patient.user.name}`;

    // Discover a valid service nomenclature ID (required by the visit creation API)
    const nomenclature = await nomenclatureService.getFirstActive(patient.id);
    logger.info('beforeEach: nomenclature discovered', { id: nomenclature.id });

    logger.debug('Using discovered nomenclature ID', { id: nomenclature.id });

    // Create visit — golden payload with all mandatory fields
    const wishStartDate = now.toISOString().split('T')[0];
    const wishEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const visit = await visitService.create(
      VisitFormFactory.create({
        patientId: patient.id,
        doctorId: doctorBranchId,
        companyBranchId: branch.id,
        companyBranchCabinetId: cabinetId,
        companyEmployeeId: doctor.id,
        shiftTime: now.toISOString(),
        wishStartDate,
        wishEndDate,
        doctorOrSpecialization: 'doctor',
        type: 'primary',
        glossarySpecializationId: 148,
        glossaryJobPositionId: 562,
        stockNomenclatureIds: [nomenclature.id],
      }),
    );
    expect(visit.id).toBeGreaterThan(0);
    visitId = visit.id;

    logger.info('beforeEach: visit ready', { visitId, patientFullName });
  });

  test('should execute the complete visit & dental charting flow', async ({
    visitDetailsPage,
    page,
  }) => {
    Logger.setTestContext('Visit Execution Smoke', 'Main flow');

    // ── Stage 1: Entry & Verification ──────────────────────────────────────────
    logger.info('Stage 1: Navigate to visit and verify patient name');
    await visitDetailsPage.goto(visitId);
    await expect(
      page.getByText(patientFullName, { exact: false }),
    ).toBeVisible({ timeout: 10000 });
    logger.info('Stage 1 ✅ patient name visible', { patientFullName });

    // ── Stage 2: Arrival & Check-in ────────────────────────────────────────────
    logger.info('Stage 2: Click "Patient Arrived"');
    await visitDetailsPage.visitStatus.changeStatus('Пациент пришел');

    await expect(
      page.getByText(
        /Visit and its status have been successfully updated|Визит и его статус успешно обновлен/i,
      ),
    ).toBeVisible({ timeout: 5000 });
    logger.info('Stage 2 ✅ success alert visible');

    // Requests tab — click "Execute Requests" only if badge count > 0
    const requestsTab = page
      .getByRole('tab', { name: /Запросы|Requests/i })
      .or(page.getByRole('link', { name: /Запросы|Requests/i }));

    if (await requestsTab.isVisible().catch(() => false)) {
      await requestsTab.click();
      const executeBtn = page.getByRole('button', {
        name: /Выполнить запросы|Execute Requests/i,
      });
      const btnText = await executeBtn.textContent().catch(() => '');
      const badgeMatch = btnText?.match(/\((\d+)\)/);
      if (badgeMatch && parseInt(badgeMatch[1], 10) > 0) {
        logger.info('Stage 2: executing pending requests', { count: badgeMatch[1] });
        await executeBtn.click();
        await expect(
          page.getByText(/Visit updated|Визит обновлен/i),
        ).toBeVisible({ timeout: 5000 });
        logger.info('Stage 2 ✅ pending requests executed');
      } else {
        logger.info('Stage 2: no pending requests — skipping');
      }
    }

    // ── Stage 3: Visit Initiation ──────────────────────────────────────────────
    logger.info('Stage 3: Click "Start Visit"');
    await visitDetailsPage.visitStatus.changeStatus('Начать визит');

    const dentalChartTab = page
      .getByRole('tab', { name: /Зубная формула|Dental Chart/i })
      .or(page.getByRole('link', { name: /Зубная формула|Dental Chart/i }));
    await expect(dentalChartTab).toBeVisible({ timeout: 5000 });
    logger.info('Stage 3 ✅ Dental Chart tab visible');

    // ── Stage 4: Dental Charting ───────────────────────────────────────────────
    logger.info('Stage 4: Open Dental Chart, select Tooth 12, set condition and diagnosis');
    await visitDetailsPage.dentalChart.clickTab();
    await visitDetailsPage.dentalChart.selectToothCheckbox(12);
    await visitDetailsPage.dentalChart.searchAndSelectCondition('Intact tooth');
    await visitDetailsPage.treatmentPlan.addDiagnosis('Symptom complex TM1');
    logger.info('Stage 4 ✅ tooth charted and diagnosis set');

    // ── Stage 5: Treatment Planning & Service Addition ─────────────────────────
    logger.info('Stage 5: Add recommended service, push to visit, save');

    const recommendedServicesSection = page.locator(
      '.RecommendedServicesSection, [data-testid="recommended-services"], .RecommendedServices',
    );
    await expect(recommendedServicesSection).toBeVisible({ timeout: 8000 });

    // Add the first available recommended service to the treatment plan
    await visitDetailsPage.treatmentPlan.addServiceFromRecommended();

    // Verify "In Treatment Plan" section appears with at least one service
    const inTreatmentPlanSection = page.locator(
      '.InTreatmentPlanSection, [data-testid="in-treatment-plan"], .InTreatmentPlan',
    );
    await expect(inTreatmentPlanSection).toBeVisible({ timeout: 5000 });

    // Finalize — move service from plan into the current visit
    await visitDetailsPage.treatmentPlan.finalizeServiceToVisit();

    // Save
    const saveButton = page.getByRole('button', { name: /Сохранить|Save/i }).first();
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();

    logger.info('Stage 5 ✅ service added to visit and saved');
    logger.info('✅ Smoke: Visit Execution & Dental Charting — COMPLETE', { visitId });
  });
});
