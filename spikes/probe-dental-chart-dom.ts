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

const VISIT_ID = 1708; // TODO: Make configurable via env var or fixture

// Temporary coordinate map for spike logging/debugging
const TOOTH_COORDINATES: Record<number, string> = {
  41: 'x=41',
  42: 'x=42',
};

const test = base.extend({});

test.describe('Spike: Dental Chart DOM & Selector Strategy', () => {
  test('Inspect Dental Chart DOM and validate selector strategies', async ({ browser, request }, testInfo) => {
    const config = getConfig();
    logger.info(`\n🔍 Spike: Dental Chart DOM & Selector Strategy`);
    logger.info(`📍 Environment: ${config.baseUrl}`);

    let context;
    let page;

    try {
      context = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
      page = await context.newPage();
      const visitPage = new VisitPage(page, config);

      // Enable console message logging
      page.on('console', (msg) => {
        if (msg.type() === 'log') {
          logger.info(`   [PAGE LOG] ${msg.text()}`);
        }
      });

      logger.info(`\n📋 Step 1: Navigate to patient visit page (ID: ${VISIT_ID})...`);

      // Navigate to visit - expect successful navigation
      await page.goto(`${config.baseUrl}/schedule/visits/${VISIT_ID}`, { waitUntil: 'networkidle' })
        .catch(() => {
          throw new Error(`Failed to navigate to visit ${VISIT_ID}. Verify the visit ID exists in your environment.`);
        });

      // logger.info('✅ Successfully navigated to visit page');
      // await visitPage.clickStateButton().catch(() => {
      //   throw new Error('Failed to click state button. Ensure the visit is in a state that allows this action.');
      // });
      // logger.info('✅ Clicked state button');
      // await visitPage.clickStateButton().catch(() => {
      //   throw new Error('Failed to click state button again. Ensure the visit transitioned to the next state.');
      // });
      // logger.info('✅ Clicked state button again');

      // Step 2: Locate Dental Chart element
      logger.info('\n📋 Step 2: Inspecting Dental Chart DOM...');
      await visitPage.clickDentalChartButton()
      await page.waitForTimeout(5000); // Wait for chart to render


logger.info('\n📋 Шаг 2: Извлечение координат всех зубов...');

      // 1. Умный сканер: ищет только те координаты left, внутри которых реально есть SVG
      const extractedCoordinates = await page.evaluate(() => {
        const svgs = Array.from(document.querySelectorAll('.TeethMap__teeth-svg svg'));
        const coords = new Set<number>();

        svgs.forEach(svg => {
          // Поднимаемся вверх от SVG, пока не найдем контейнер с координатой left
          let el = svg.parentElement;
          while (el && el.tagName === 'DIV') {
            if (el.style.left) {
              const leftVal = parseFloat(el.style.left);
              // Игнорируем отрицательные значения и мелкие локальные смещения
              if (leftVal > 10) {
                coords.add(leftVal);
                break; // Нашли главную координату колонки, переходим к следующему SVG
              }
            }
            el = el.parentElement;
          }
        });

        // Возвращаем отсортированный массив (от левого края экрана к правому)
        return Array.from(coords).sort((a, b) => a - b).map(v => `${v}px`);
      });

      logger.info(`🚀 Найдено уникальных колонок с зубами: ${extractedCoordinates.length}`);
      logger.info(`📋 Массив координат (слева направо):`);
      logger.info(JSON.stringify(extractedCoordinates, null, 2));

      // 2. Проверка работоспособности позиционного локатора
      if (extractedCoordinates.length > 0) {
        logger.info('\n📋 Шаг 3: Проверка доступности зуба по координате...');
        
        // Берем первую найденную координату (самый левый зуб на экране, скорее всего 18/48)
        const testLeftCoord = extractedCoordinates[0]; 
        
        // Создаем локатор, игнорируя пробелы после двоеточия
        const testTooth = page.locator(`.TeethMap__teeth-svg div[style*="left: ${testLeftCoord}"], .TeethMap__teeth-svg div[style*="left:${testLeftCoord}"]`).locator('svg path').first();

        // Проверяем, что элемент действительно в DOM и виден
        await expect(testTooth).toBeVisible({ timeout: 5000 });
        
        // Извлекаем boundingBox, чтобы доказать, что по нему можно кликнуть
        const box = await testTooth.boundingBox();
        logger.info(`✅ УСПЕХ: Зуб по координате ${testLeftCoord} найден!`);
        logger.info(`   Физические координаты для клика: X: ${box?.x}, Y: ${box?.y}`);
        
        // Визуальная подсветка (если смотришь в режиме --headed)
        await testTooth.evaluate(el => (el as SVGElement).style.fill = 'red').catch(() => {});
      } else {
        logger.error('❌ ОШИБКА: Координаты не найдены. Проверьте, отрисовался ли SVG чарта.');
      }
    } finally {
      if (page) await page.close();
      if (context) await context.close();
    }
  });
});
