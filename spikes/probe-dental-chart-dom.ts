import { test as base } from '@playwright/test';
import { getConfig } from '../src/config/env-loader';
import { chromium } from 'playwright';

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
    console.log(`\n🔍 Spike: Dental Chart DOM & Selector Strategy`);
    console.log(`📍 Environment: ${config.baseUrl}`);

    try {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        storageState: 'playwright/.auth/admin.json',
      });

      const page = await context.newPage();

      // Enable console message logging
      page.on('console', (msg) => {
        if (msg.type() === 'log') {
          console.log(`   [PAGE LOG] ${msg.text()}`);
        }
      });

      console.log('📋 Step 1: Navigate to a patient visit page...');
      // Attempt to navigate to visit list or dashboard
      await page.goto(`${config.baseUrl}/`, { waitUntil: 'networkidle' });

      // Try to find a visit or navigate to visits list
      const visitLink = page.locator('a:has-text("Visits"), a:has-text("Прием")').first();
      if (await visitLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('   ✅ Found visit navigation link');
        await visitLink.click();
        await page.waitForLoadState('networkidle');
      } else {
        console.log('   ⚠️  Could not find visit link, attempting direct navigation');
        // Try direct navigation with a sample visit ID (may fail if no visits exist)
        await page.goto(`${config.baseUrl}/visits/1`, {
          waitUntil: 'networkidle',
        }).catch(() => {
          console.log('   ℹ️  Direct visit navigation not available');
        });
      }

      // Step 2: Locate Dental Chart element
      console.log('\n📋 Step 2: Inspecting Dental Chart DOM...');

      // Check for SVG-based chart
      const svgChart = page.locator('svg[data-testid*="dental"], svg.dental-chart, svg[class*="dental"]').first();
      const svgExists = await svgChart.isVisible({ timeout: 3000 }).catch(() => false);

      if (svgExists) {
        console.log('   ✅ Found SVG-based Dental Chart');
        const svgHtml = await svgChart.evaluate((el) => el.outerHTML.substring(0, 500));
        console.log(`   📄 SVG Structure (first 500 chars): ${svgHtml}`);

        // Test different selector strategies
        console.log('\n📋 Step 3: Testing selector strategies for teeth...');

        // Strategy 1: Data attributes
        const teethByData = page.locator('g[data-tooth-id], g[data-tooth-number], path[data-tooth]');
        const teethByDataCount = await teethByData.count();
        console.log(`   Strategy 1 (data attributes): Found ${teethByDataCount} teeth`);

        // Strategy 2: CSS classes
        const teethByClass = page.locator('g.tooth, path.tooth, g[class*="tooth"]');
        const teethByClassCount = await teethByClass.count();
        console.log(`   Strategy 2 (CSS classes): Found ${teethByClassCount} teeth`);

        // Strategy 3: SVG paths with specific patterns
        const teethByPath = page.locator('path[d*="M"]'); // SVG path elements
        const teethByPathCount = await teethByPath.count();
        console.log(`   Strategy 3 (SVG paths): Found ${teethByPathCount} path elements`);

        if (teethByDataCount > 0) {
          console.log(`\n✅ RECOMMENDED STRATEGY: Data attributes (found ${teethByDataCount} teeth)`);
          console.log(`   Selector pattern: g[data-tooth-id], path[data-tooth-number]`);
          console.log(`   Implementation: map tooth IDs 1-32 to [data-tooth-id="N"]`);
        } else if (teethByClassCount > 0) {
          console.log(`\n✅ RECOMMENDED STRATEGY: CSS classes (found ${teethByClassCount} teeth)`);
          console.log(`   Selector pattern: g.tooth:nth-of-type(N), path[class*="tooth-"]`);
        } else {
          console.log(`\n⚠️  UNCERTAIN STRATEGY: Could not identify stable selector`);
          console.log(`   Manual inspection required. SVG structure:`);
          const chartHtml = await svgChart.evaluate(
            (el) => el.outerHTML.substring(0, 2000)
          );
          console.log(chartHtml);
        }
      } else {
        // Check for Canvas-based chart
        const canvas = page.locator('canvas[data-testid*="dental"], canvas.dental-chart').first();
        const canvasExists = await canvas.isVisible({ timeout: 3000 }).catch(() => false);

        if (canvasExists) {
          console.log('   ✅ Found Canvas-based Dental Chart');
          console.log(`\n⚠️  STRATEGY: Coordinate-based interaction required`);
          console.log(`   Cannot use CSS selectors; must use page.mouse.click(x, y)`);
          console.log(`   Will need tooth position mapping via spike inspection`);
          console.log(
            `   Implementation: Extract canvas boundingBox, map tooth positions, click by coordinates`
          );
        } else {
          console.log('   ❌ No Dental Chart found on this page');
          console.log(
            '   Ensure you are on a visit details page with a Dental Chart component'
          );
        }
      }

      // Step 4: Summary
      console.log('\n📋 Step 4: Spike Summary');
      console.log(`   ✅ DOM inspection complete`);
      console.log(`   📌 Recommendation for Task #11: Use findings above to select selector strategy`);
      console.log(
        `   📌 If SVG + data attrs: implement selectTooth(id) with g[data-tooth-id="{id}"].click()`
      );
      console.log(
        `   📌 If Canvas: implement selectTooth(id) with coordinate mapping + page.mouse.click(x, y)`
      );

      await context.close();
      await browser.close();

      console.log(`\n✅ SPIKE RESULT: Dental Chart selector strategy IDENTIFIED`);
    } catch (error) {
      console.error('❌ Spike execution failed:', error);
      throw error;
    }
  });
});