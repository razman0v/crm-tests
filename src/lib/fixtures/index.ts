import { test as base } from '@playwright/test';
import { logger } from '../../utils/logger'; // 

/**
 * Custom Playwright Fixture
 * Extends the base test to include automatic browser console logging 
 * and centralizes access to factories.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Automatically forward browser console messages to our project logger
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        logger.error(`[PAGE ERROR] ${text}`);
      } else if (type === 'log' || type === 'info') {
        logger.info(`[PAGE LOG] ${text}`);
      }
    });

    await use(page);
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
