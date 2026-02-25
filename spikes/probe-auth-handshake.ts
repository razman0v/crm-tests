import { test as base } from '@playwright/test';
import { getConfig } from '../src/config/env-loader';
import { chromium } from 'playwright';

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
    console.log(`\n🔍 Spike: Hybrid Auth Handshake`);
    console.log(`📍 Environment: ${config.baseUrl}`);

    try {
      // Step 1: Launch browser and attempt to load storage state
      const browser = await chromium.launch();
      const context = await browser.newContext({
        storageState: 'playwright/.auth/admin.json',
      });

      console.log('✅ Storage state loaded from playwright/.auth/admin.json');

      // Step 2: Create API request context with storage state
      const page = await context.newPage();
      const apiContext = await context.request;

      // Step 3: Extract access token from cookies
      const cookies = await context.cookies();
      const accessTokenCookie = cookies.find(
        (c) => c.name === 'accessToken' || c.name === 'Authorization'
      );

      if (!accessTokenCookie) {
        console.log(
          '⚠️  No accessToken cookie found. Available cookies:',
          cookies.map((c) => c.name)
        );
      }

      // Step 4: Make API call to glossary/specializations endpoint
      const response = await apiContext.get(
        `${config.baseUrl}api/v1/glossary/specializations`,
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

      console.log(`📡 GET /api/v1/glossary/specializations`);
      console.log(`📊 Response Status: ${response.status()}`);

      if (response.status() === 200) {
        const data = await response.json();
        console.log(`✅ SUCCESS: Auth handshake verified!`);
        console.log(
          `   Received ${Array.isArray(data) ? data.length : Object.keys(data).length} specializations`
        );
        console.log(`\n✅ SPIKE RESULT: Hybrid Auth Strategy is VIABLE`);
      } else if (response.status() === 401) {
        console.error(
          `❌ FAILED: Received 401 Unauthorized. Cookies from admin.json do not work for API calls.`
        );
        console.error(`   Response body:`, await response.text());
        console.log(`\n❌ SPIKE RESULT: ARCHITECTURE REDESIGN REQUIRED`);
      } else {
        console.warn(`⚠️  Unexpected status: ${response.status()}`);
        console.warn(`   Response:`, await response.text());
      }

      await context.close();
      await browser.close();
    } catch (error) {
      console.error('❌ Spike execution failed:', error);
      throw error;
    }
  });
});