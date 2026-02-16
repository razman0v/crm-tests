import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { getConfig } from './src/config/env-loader';

dotenv.config();

const testConfig = getConfig();

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [['html'], ['list']],
  
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
  ],
});
