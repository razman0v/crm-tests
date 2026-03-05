import { test as base, expect } from '@playwright/test';
import { logger } from '../../utils/logger';

export const test = base.extend<{}, { workerStorageState: string }>({
  workerStorageState: [async ({}, use) => {
    await use('playwright/.auth/admin.json');
  }, { scope: 'worker' }],

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
