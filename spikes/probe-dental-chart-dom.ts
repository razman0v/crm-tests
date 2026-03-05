import { test as base, expect } from '@playwright/test';
import { getConfig } from '../src/config/env-loader';
import { logger } from '../src/utils/logger';
import { VisitPage } from '../src/pages/visit.page';

/**
 * Spike: Dental Chart DOM & Selector Strategy
 * Purpose: Determine optimal locator strategy (CSS selectors vs SVG paths vs coordinate-based)
 * for interactive tooth elements in Dental Chart widget
 *
 * Execution: Navigate to patient visit page → inspect DOM via DevTools → test different
 * selector patterns → document winning pattern for task #11
 * 
 * NOTE: This spike requires a valid visit with patient data in the environment.
 * Update VISIT_ID constant if your test environment uses different IDs.
 */

const VISIT_ID = 1722; // TODO: Make configurable via env var or fixture

const test = base.extend({});

test.describe('Spike: Dental Chart DOM & Selector Strategy', () => {
  test('Inspect Dental Chart DOM and validate selector strategies', async ({ browser, request }, testInfo) => {
    const config = getConfig();
    logger.info(`Spike: Dental Chart DOM & Selector Strategy`);
    logger.info(`Environment: ${config.baseUrl}`);

    let context;
    let page;

    try {
      context = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
      page = await context.newPage();
      const visitPage = new VisitPage(page, config);

      logger.info(`Step 1: Navigate to patient visit page (ID: ${VISIT_ID})...`);

      await page.goto(`${config.baseUrl}schedule/visits/${VISIT_ID}`, { waitUntil: 'domcontentloaded' })
        .catch((e) => {
          throw new Error(`Failed to navigate to visit ${VISIT_ID}: ${e.message}`);
        });
      logger.info('Successfully navigated to visit page');


      await test.step('Ensure visit is in progress', async () => {
        const currentState = await visitPage.getStateButtonText();

        if (currentState === 'Завершить прием') {
          logger.info('Visit is already in "Завершить прием" state. Skipping transitions.');
          return;
        }
        await visitPage.clickStateButton('Пациент пришел');
        await visitPage.clickStateButton('Начать визит');
      });

      logger.info('Step 2: Inspecting Dental Chart DOM...');
      await visitPage.clickDentalChartButton();
      await page.waitForSelector('.TeethMap__teeth-svg svg', {
        state: 'visible',
        timeout: 15000
      });

      logger.info('Step 2: Extracting coordinates of all teeth...');

      // 1. Smart scanner: looks only for left coordinates that actually contain SVG

      await page.waitForFunction(() => {
        const svgs = Array.from(document.querySelectorAll('.TeethMap__teeth-svg svg'));
        return svgs.some(svg => {
          let el = svg.parentElement;
          while (el && el.tagName === 'DIV') {
            if (el.style.left && parseFloat(el.style.left) > 0) return true;
            el = el.parentElement;
          }
          return false;
        });
      }, { timeout: 15000 });

      const extractedCoordinates = await page.evaluate(() => {
        const svgs = Array.from(document.querySelectorAll('.TeethMap__teeth-svg svg'));
        const coords = new Set<number>();

        svgs.forEach(svg => {
          let el = svg.parentElement;
          while (el && el.tagName === 'DIV') {
            if (el.style.left) {
              const leftVal = parseFloat(el.style.left);
              if (leftVal > 10) {
                coords.add(leftVal);
                break;
              }
            }
            el = el.parentElement;
          }
        });

        return Array.from(coords).sort((a, b) => a - b).map(v => `${v}px`);
      });

      logger.info(`Найдено уникальных колонок с зубами: ${extractedCoordinates.length}`);
      logger.info(`Массив координат (слева направо):`);
      logger.info(JSON.stringify(extractedCoordinates, null, 2));

      expect(extractedCoordinates.length, 'ОШИБКА: Координаты не найдены. Фронтенд не отрисовал зубы.').toBeGreaterThan(0);

      // 2. Проверка работоспособности позиционного локатора
      logger.info('Шаг 3: Проверка доступности зуба по координате...');

      const testLeftCoord = extractedCoordinates[0];

      // Создаем локатор
      const testTooth = page.locator(`.TeethMap__teeth-svg div[style*="left: ${testLeftCoord}"], .TeethMap__teeth-svg div[style*="left:${testLeftCoord}"]`).locator('svg path').first();

      // Проверяем, что элемент действительно в DOM и виден
      await expect(testTooth).toBeVisible();

      // Извлекаем boundingBox
      const box = await testTooth.boundingBox();
      expect(box, 'boundingBox is null — элемент не в viewport').not.toBeNull();
      logger.info(`УСПЕХ: Зуб по координате ${testLeftCoord} найден!`);
      logger.info(`Физические координаты для клика: X: ${box?.x}, Y: ${box?.y}`);

      // Визуальная подсветка
      await testTooth.evaluate(el => (el as SVGElement).style.fill = 'red').catch(() => { });

    } finally {
      if (page) await page.close();
      if (context) await context.close();
    }
  });
});
