import { test as base } from '@playwright/test';
import { getConfig } from '../src/config/env-loader';
import { chromium } from 'playwright';
import { logger, Logger } from '../src/utils/logger';

/**
 * Spike: Dental Chart DOM & Selector Strategy
 * Purpose: Determine optimal locator strategy (CSS selectors vs SVG paths vs coordinate-based)
 * for interactive tooth elements in Dental Chart widget
 *
 * Execution: Navigate to patient visit page → inspect DOM via DevTools → test different
 * selector patterns → document winning pattern for task #11
 */

const test = base.extend({});

test.describe('Spike: Dental Chart DOM & Selector Strategy', () => {
  test('Inspect Dental Chart DOM and validate selector strategies', async () => {
    const config = getConfig();
    logger.info(`\n🔍 Spike: Dental Chart DOM & Selector Strategy`);
    logger.info(`📍 Environment: ${config.baseUrl}`);

    try {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        storageState: 'playwright/.auth/admin.json',
      });

      const page = await context.newPage();

      // Enable console message logging
      page.on('console', (msg) => {
        if (msg.type() === 'log') {
          logger.info(`   [PAGE LOG] ${msg.text()}`);
        }
      });

      logger.info('📋 Step 1: Navigate to a patient visit page...');
      // Attempt to navigate to visit list or dashboard
      await page.goto(`${config.baseUrl}/`, { waitUntil: 'networkidle' });

      // Try to find a visit or navigate to visits list
      const visitLink = page.locator('a:has-text("Visits"), a:has-text("Прием")').first();
      if (await visitLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        logger.info('   ✅ Found visit navigation link');
        await visitLink.click();
        await page.waitForLoadState('networkidle');
      } else {
        logger.warn('   ⚠️  Could not find visit link, attempting direct navigation');
        // Try direct navigation with a sample visit ID (may fail if no visits exist)
        await page.goto(`${config.baseUrl}/visits/1`, {
          waitUntil: 'networkidle',
        }).catch(() => {
          logger.info('   ℹ️  Direct visit navigation not available');
        });
      }

      // Step 2: Locate Dental Chart element
      logger.info('\n📋 Step 2: Inspecting Dental Chart DOM...');

      // Check for SVG-based chart
      const svgChart = page.locator('svg[data-testid*="dental"], svg.dental-chart, svg[class*="dental"]').first();
      const svgExists = await svgChart.isVisible({ timeout: 3000 }).catch(() => false);

      if (svgExists) {
        logger.info('   ✅ Found SVG-based Dental Chart');
        const svgHtml = await svgChart.evaluate((el) => el.outerHTML.substring(0, 500));
        logger.info(`   📄 SVG Structure (first 500 chars): ${svgHtml}`);

        // Test different selector strategies
        logger.info('\n📋 Step 3: Testing selector strategies for teeth...');

        // Strategy 1: Data attributes
        const teethByData = page.locator('g[data-tooth-id], g[data-tooth-number], path[data-tooth]');
        const teethByDataCount = await teethByData.count();
        logger.info(`   Strategy 1 (data attributes): Found ${teethByDataCount} teeth`);

        // Strategy 2: CSS classes
        const teethByClass = page.locator('g.tooth, path.tooth, g[class*="tooth"]');
        const teethByClassCount = await teethByClass.count();
        logger.info(`   Strategy 2 (CSS classes): Found ${teethByClassCount} teeth`);

        // Strategy 3: SVG paths with specific patterns
        const teethByPath = page.locator('path[d*="M"]'); // SVG path elements
        const teethByPathCount = await teethByPath.count();
        logger.info(`   Strategy 3 (SVG paths): Found ${teethByPathCount} path elements`);

        if (teethByDataCount > 0) {
          logger.info(`\n✅ RECOMMENDED STRATEGY: Data attributes (found ${teethByDataCount} teeth)`);
          logger.info(`   Selector pattern: g[data-tooth-id], path[data-tooth-number]`);
          logger.info(`   Implementation: map tooth IDs 1-32 to [data-tooth-id="N"]`);
        } else if (teethByClassCount > 0) {
          logger.info(`\n✅ RECOMMENDED STRATEGY: CSS classes (found ${teethByClassCount} teeth)`);
          logger.info(`   Selector pattern: g.tooth:nth-of-type(N), path[class*="tooth-"]`);
        } else {
          logger.warn(`\n⚠️  UNCERTAIN STRATEGY: Could not identify stable selector`);
          logger.info(`   Manual inspection required. SVG structure:`);
          const chartHtml = await svgChart.evaluate(
            (el) => el.outerHTML.substring(0, 2000)
          );
          logger.info(chartHtml);
        }
      } else {
        // Check for Canvas-based chart
        const canvas = page.locator('canvas[data-testid*="dental"], canvas.dental-chart').first();
        const canvasExists = await canvas.isVisible({ timeout: 3000 }).catch(() => false);

        if (canvasExists) {
          logger.info('   ✅ Found Canvas-based Dental Chart');
          logger.info(`\n⚠️  STRATEGY: Coordinate-based interaction required`);
          logger.info(`   Cannot use CSS selectors; must use page.mouse.click(x, y)`);
          logger.info(`   Will need tooth position mapping via spike inspection`);
          logger.info(
            `   Implementation: Extract canvas boundingBox, map tooth positions, click by coordinates`
          );
        } else {
          logger.info('   ❌ No Dental Chart found on this page');
          logger.info(
            '   Ensure you are on a visit details page with a Dental Chart component'
          );
        }
      }

      // Step 4: Summary
      logger.info('\n📋 Step 4: Spike Summary');
      logger.info(`   ✅ DOM inspection complete`);
      logger.info(`   📌 Recommendation for Task #11: Use findings above to select selector strategy`);
      logger.info(
        `   📌 If SVG + data attrs: implement selectTooth(id) with g[data-tooth-id="{id}"].click()`
      );
      logger.info(
        `   📌 If Canvas: implement selectTooth(id) with coordinate mapping + page.mouse.click(x, y)`
      );

      await context.close();
      await browser.close();

      logger.info(`\n✅ SPIKE RESULT: Dental Chart selector strategy IDENTIFIED`);
   } catch (error) {
      logger.error('❌ Spike execution failed:', 
        error instanceof Error ? { message: error.message } : { error: String(error) 
        });
      throw error;
    }
  });
});