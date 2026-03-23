import { test, expect, PatientFactory, VisitFormFactory } from '../../../lib/fixtures'; // Use custom fixtures
import { Logger, logger } from '../../../utils/logger';

test.describe('E2E: Complete Dental Visit Flow (14-Step Journey)', () => {

  test('should complete entire visit workflow from schedule to completion', async ({
    patientService,
    scheduleService,
    visitService,
    visitPage,
    branchService,
    employeeService,
    nomenclatureService,
  }) => {
    Logger.setTestContext('Complete Visit Flow', 'Main Test');

    try {
      // ========================================
      // STEP 1: Create Branch and Doctor
      // ========================================
      logger.info('STEP 1: Creating branch and doctor');
      const branch = await branchService.create();
      const cabinetId = branch.companyBranchCabinets![0].id;
      const doctor = await employeeService.create(branch.id);
      const doctorBranchId = doctor.employeeBranchId;
      logger.info('✅ Branch and doctor created', { branchId: branch.id, doctorBranchId, cabinetId });

      // ========================================
      // STEP 2: Create Work Schedule
      // ========================================
      logger.info('STEP 2: Creating work schedule');
      const now = new Date();

      const schedule = await scheduleService.createSimpleShift(
        doctorBranchId,
        cabinetId,
        now.toISOString(),
      );
      expect(schedule).toHaveProperty('id');
      expect(schedule.id).toBeGreaterThan(0);
      logger.info('✅ Schedule created', { scheduleId: schedule.id });

      // ========================================
      // STEP 3: Create Patient
      // ========================================
      logger.info('STEP 3: Creating patient');
      const patientPayload = PatientFactory.createRandom();
      const patient = await patientService.create(patientPayload);
      expect(patient).toHaveProperty('id');
      expect(patient.id).toBeGreaterThan(0);
      logger.info('✅ Patient created', { patientId: patient.id, name: patient.user?.name });

      // ========================================
      // STEP 3.5: Discover Nomenclature Service ID
      // ========================================
      logger.info('STEP 3.5: Discovering service nomenclature ID');
      const nomenclature = await nomenclatureService.getFirstActive(patient.id);
      logger.info('✅ Nomenclature discovered', { id: nomenclature.id });

      // ========================================
      // STEP 4: Create Visit
      // ========================================
      logger.info('STEP 4: Creating visit');
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
      expect(visit).toHaveProperty('id');
      expect(visit.id).toBeGreaterThan(0);
      logger.info('✅ Visit created', { visitId: visit.id, status: visit.status });

      // ========================================
      // STEP 5: Navigate to Visit Page
      // ========================================
      logger.info('STEP 5: Navigating to visit details page');
      await visitPage.goto(visit.id);

      // ========================================
      // STEP 6: Change Status → Patient Arrived
      // Click "Пациент пришел"; expect button to become "Начать визит"
      // ========================================
      logger.info('STEP 6: Patient arrived');
      await visitPage.clickStateButton('Начать визит');
      logger.info('✅ Status: arrived — button now shows "Начать визит"');

      // ========================================
      // STEP 7: Change Status → Start Visit
      // Click "Начать визит"; expect button to become "Завершить визит"
      // ========================================
      logger.info('STEP 7: Starting visit');
      await visitPage.clickStateButton('Завершить визит');
      logger.info('✅ Status: in progress — button now shows "Завершить визит"');

      // ========================================
      // STEP 8: Open Dental Chart and Select Tooth
      // ========================================
      logger.info('STEP 8: Opening dental chart and selecting tooth 18');
      await visitPage.clickDentalChartButton();
      await visitPage.clickTooth(18);
      logger.info('✅ Tooth 18 selected on dental chart');

      // ========================================
      // STEP 9: Return to Visit Page and Complete Visit
      // ========================================
      logger.info('STEP 9: Completing visit');
      await visitPage.goto(visit.id);
      await visitPage.stateButton.click();
      logger.info('✅ Visit completed');

      // ========================================
      // FINAL ASSERTIONS
      // ========================================
      logger.info('✅✅✅ COMPLETE VISIT WORKFLOW SUCCESSFULLY EXECUTED ✅✅✅', {
        patientId: patient.id,
        visitId: visit.id,
        scheduleId: schedule.id,
        timestamp: new Date().toISOString(),
      });

      expect(patient.id).toBeGreaterThan(0);
      expect(visit.id).toBeGreaterThan(0);
      expect(schedule.id).toBeGreaterThan(0);

    } catch (error) {
      logger.error('❌ Complete visit workflow failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  });
});
