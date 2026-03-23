import { test as base, expect } from '@playwright/test';
import { logger } from '../../utils/logger';
import { PatientsService } from '../api/services/patients.service';
import { ScheduleService } from '../api/services/schedule.service';
import { VisitService } from '../api/services/visit.service';
import { VisitPage } from '../../pages/visit.page';
import { CreateVisitModal } from '../../pages/modals/create-visit-modal.page';
import { VisitDetailsPage } from '../../pages/crm';
import { getConfig } from '../../config/env-loader';
import { EmployeeService } from '../api/services/employee.service';
import { BranchService } from '../api/services/branch.service';
import { NomenclatureService } from '../api/services/nomenclature.service';

type CustomFixtures = {
  patientService: PatientsService;
  scheduleService: ScheduleService;
  visitService: VisitService;
  branchService: BranchService;
  visitPage: VisitPage;
  visitDetailsPage: VisitDetailsPage;
  createVisitModal: CreateVisitModal;
  employeeService: EmployeeService;
  nomenclatureService: NomenclatureService;
};

export const test = base.extend<CustomFixtures, { workerStorageState: string }>({
  workerStorageState: [async ({}, use) => {
    await use('playwright/.auth/admin.json');
  }, { scope: 'worker' }],

  employeeService: async ({ request }, use) => {
    await use(new EmployeeService(request));
  },

  nomenclatureService: async ({ request }, use) => {
    await use(new NomenclatureService(request));
  },

  branchService: async ({ request }, use) => {
    await use(new BranchService(request));
  },

  patientService: async ({ request }, use) => {
    await use(new PatientsService(request));
  },

  scheduleService: async ({ request }, use) => {
    await use(new ScheduleService(request));
  },

  visitService: async ({ request }, use) => {
    await use(new VisitService(request));
  },

  visitPage: async ({ page }, use) => {
    await use(new VisitPage(page, getConfig()));
  },

  visitDetailsPage: async ({ page }, use) => {
    await use(new VisitDetailsPage(page, getConfig()));
  },

  createVisitModal: async ({ page }, use) => {
    await use(new CreateVisitModal(page, getConfig()));
  },

  page: async ({ browser, workerStorageState }, use) => {
    const context = await browser.newContext({ 
      storageState: workerStorageState 
    });
    const page = await context.newPage();

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') logger.error(`[PAGE ERROR] ${text}`);
      else if (type === 'warning') logger.warn(`[PAGE WARN] ${text}`);
      else if (type === 'log' || type === 'info') logger.info(`[PAGE LOG] ${text}`);
    });

    page.on('pageerror', (error) => {
      logger.error(`[PAGE EXCEPTION] ${error.message}`);
    });

    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';

/**
 * Test Data Factories Barrel Export
 * Consolidates all factory class exports for clean imports
 *
 * Usage:
 * ✅ import { PatientFactory, ShiftFactory } from '@/lib/factories'
 * ❌ import { PatientFactory } from '@/lib/factories/patient.factory'
 * ❌ import { ShiftFactory } from '@/lib/factories/shift.factory'
 */

export { PatientFactory } from '../factories/patient.factory';
export { ShiftFactory } from '../factories/shift.factory';
export { VisitFormFactory } from '../factories/visit-form.factory';
export type { VisitFormData, VisitApiParams } from '../factories/visit-form.factory';
export { NomenclatureService, CriticalDataMissingError } from '../api/services/nomenclature.service';
export type { NomenclatureItem } from '../api/services/nomenclature.service';
