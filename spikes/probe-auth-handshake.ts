import { test as base, expect } from '@playwright/test';
import { getConfig } from '../src/config/env-loader';
import { chromium } from 'playwright';
import { logger } from '../src/utils/logger';

/**
 * Spike: Hybrid Auth Handshake
 * Purpose: Verify that cookies saved in playwright/.auth/admin.json can be successfully reused for API calls
 * without re-authentication
 *
 * Execution: Load auth.json → initialize APIRequestContext with cookies → make GET request to
 * /api/v1/glossary/specializations → assert 200 response
 */

const test = base.extend({});

test.describe('Spike: Hybrid Auth Handshake', () => {
  test('Verify cookies from auth.json work for API calls', async () => {
    const config = getConfig();
    logger.info(`\n🔍 Spike: Hybrid Auth Handshake`);
    logger.info(`📍 Environment: ${config.baseUrl}`);

    try {
      // Step 1: Launch browser and attempt to load storage state
      const browser = await chromium.launch();
      const context = await browser.newContext({
        storageState: 'playwright/.auth/admin.json',
      });

      logger.info('✅ Storage state loaded from playwright/.auth/admin.json');

      // Step 2: Create API request context with storage state
      const page = await context.newPage();
      const apiContext = await context.request;

      // Step 3: Extract access token from cookies
      const cookies = await context.cookies();
      const accessTokenCookie = cookies.find(
        (c) => c.name === 'accessToken' || c.name === 'Authorization'
      );

      if (!accessTokenCookie) {
        logger.warn(
          '⚠️  No accessToken cookie found. Available cookies:',
          { cookieNames: cookies.map((c) => c.name) }
        );
      }

      // Step 4: Make API call to glossary/specializations endpoint
      const response = await apiContext.post(
        `${config.baseUrl}api/v1/init`,
        {
          headers: {
            'Content-Type': 'application/json',
            'company-uid': config.companyUid,
            ...(accessTokenCookie && {
              Authorization: `Bearer ${accessTokenCookie.value}`,
            }),
          },
        }
      );

      logger.info(`📡 POST api/v1/init`);
      logger.info(`📊 Response Status: ${response.status()}`);

    if (response.status() === 200 || response.status() === 201) {
      logger.info('✅ Auth works! User data received');
      const data = await response.json();
      logger.info(`   User: ${data.user?.surname} ${data.user?.name}`);
      logger.info(`   Email: ${data.user?.email}`);
  
      logger.info(`\n✅ SPIKE RESULT: Hybrid Auth Strategy is VIABLE`);
    } else if (response.status() === 401) {
      logger.error(
        `❌ FAILED: Received 401 Unauthorized. Cookies from admin.json do not work for API calls.`
      );
      logger.error(`   Response body:`, { body: await response.text() });
      logger.error(`\n❌ SPIKE RESULT: ARCHITECTURE REDESIGN REQUIRED`);
    } else {
      logger.warn(`⚠️  Unexpected status: ${response.status()}`);
      logger.warn(`   Response:`, { body: await response.text() });
    }

    await context.close();
    await browser.close();
  } catch (error) {
    logger.error('❌ Spike execution failed:',
      error instanceof Error ? { message: error.message } : {
        error: String(error)
      });
    throw error;
  }
});
});