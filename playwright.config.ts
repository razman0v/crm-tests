import { defineConfig, devices } from '@playwright/test';
import { getConfig } from './src/config/env-loader';

const testConfig = getConfig();

export default defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    [
      'allure-playwright',
      {
        outputFolder: 'allure-results',
        deletePreviousResults: false, // Preserve history across test runs
        inlineAttachments: true, // Embed logs inline in Allure report
      },
    ],
  ],
  
  use: {
    baseURL: testConfig.baseUrl,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 1. UNIT TESTS: Logic verification (No browser needed)
    {
      name: 'unit',
      testDir: './src/tests/unit',        // Targets the lib directory 
      testMatch: /.*\.test\.ts/,
      use: { browserName: undefined },    // Specifically matches your .test.ts files
    },

    // 1. SETUP: Авторизация
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // 2. E2E Tests: Основные тесты
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Используем сохраненные куки
        storageState: 'playwright/.auth/admin.json', 
      },
      dependencies: ['setup'], // Ждать завершения setup
    },

    {
      name: 'spikes',
      testDir: './spikes',    // Искать тесты только в папке spikes
      testMatch: /probe-.*\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json', 
      },
      // Если для спайков нужна авторизация, раскомментируйте строку ниже:
      // dependencies: ['setup'],
    },
  ],
});
