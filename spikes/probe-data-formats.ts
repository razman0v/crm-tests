import { test as base, expect } from '@playwright/test';
import { getConfig } from '../src/config/env-loader';
import { PatientFactory } from '../src/lib/factories/patient.factory';
import { chromium } from 'playwright';
import * as fs from 'fs';
import { logger } from '../src/utils/logger';

/**
 * Spike: Data Format Validation
 * Purpose: Test whether generated patient/shift payloads from factories actually match
 * backend validation rules
 *
 * Execution: Call PatientFactory.createRandom() → POST to /api/v1/patients → capture any
 * 400 errors → iterate factory generators until all payloads pass
 */

const test = base.extend({});

test.describe('Spike: Data Format Validation', () => {
  test('Validate PatientFactory payloads against backend API', async () => {
    const config = getConfig();
    logger.info(`\n🔍 Spike: Data Format Validation`);
    logger.info(`📍 Environment: ${config.baseUrl}`);

    try {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        storageState: 'playwright/.auth/admin.json',
      });

      const apiContext = context.request;
      const authData = JSON.parse(fs.readFileSync('playwright/.auth/admin.json', 'utf-8'));
      
      let accessToken = '';
      const originData = authData.origins?.[0]?.localStorage;
      const lsToken = originData?.find((item: any) => item.name.toLowerCase().includes('token'));
      
      if (lsToken) {
        accessToken = lsToken.value.replace(/^"|"$/g, ''); // Strip quotes if present
      } else {
        const cookieToken = authData.cookies?.find((c: any) => c.name.toLowerCase().includes('token'));
        if (cookieToken) accessToken = cookieToken.value;
      }

      logger.info('📋 Step 1: Generate test payloads with PatientFactory');
      const testPayloads = [];
      for (let i = 0; i < 3; i++) {
        const payload = PatientFactory.builder().build();
        testPayloads.push(payload);
        logger.info(`   ✅ Generated patient ${i + 1}:`);
        logger.info(`      Name: ${payload.user.surname} ${payload.user.name} ${payload.user.patronymic || ''}`);
        logger.info(`      Phone: ${payload.user.phone}`);
        logger.info(`      SNILS: ${payload.user.snils}`);
        logger.info(`      OMS: ${payload.policyOmsNumber}`);
        logger.info(`      Birth Date: ${payload.user.birthday}`);
      }

      logger.info('\n📋 Step 2: POST payloads to /api/v1/patients');
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < testPayloads.length; i++) {
        const payload = testPayloads[i];
        const response = await apiContext.post(
          `${config.baseUrl}api/v1/patients`,
          {
            data: payload,
            headers: {
              'Content-Type': 'application/json',
              'company-uid': config.companyUid,
              ...(accessToken && {
                Authorization: `Bearer ${accessToken}`,
              }),
            },
          }
        );

        logger.info(`\n   Test ${i + 1}: ${payload.user.surname} ${payload.user.name}`);
        logger.info(`   📡 Status: ${response.status()}`);

        if (response.status() === 201 || response.status() === 200) {
          logger.info(`   ✅ SUCCESS - Patient created`);
          const data = await response.json();
          logger.info(`   📌 Patient ID: ${data.id || 'N/A'}`);
          successCount++;
        } else if (response.status() === 400) {
          logger.info(`   ❌ VALIDATION ERROR`);
          const error = await response.json().catch(() => response.text());
          logger.info(`   Details: ${JSON.stringify(error, null, 2).substring(0, 500)}`);
          failureCount++;
        } else {
          logger.warn(`   ⚠️  Unexpected status: ${response.status()}`);
          logger.warn(`   Details: ${await response.text().then((t) => t.substring(0, 200))}`);
          failureCount++;
        }
      }

      logger.info(`\n📊 Results Summary:`);
      logger.info(`   ✅ Successful: ${successCount}/${testPayloads.length}`);
      logger.info(`   ❌ Failed: ${failureCount}/${testPayloads.length}`);

      if (failureCount === 0) {
        logger.info(`\n✅ SPIKE RESULT: PatientFactory payloads VALID`);
        logger.info(`   All generated payloads passed backend validation`);
      } else {
        logger.warn(`\n⚠️  SPIKE RESULT: PatientFactory needs adjustment`);
        logger.warn(
          `   Some payloads failed validation. Review error messages above and iterate generators`
        );
      }

      await context.close();
      await browser.close();
    } catch (error) {
      logger.error('❌ Spike execution failed:', 
        error instanceof Error ? { message: error.message } : { error: String(error) 
        });
      throw error;
    }
  });
});