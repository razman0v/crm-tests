import { test, expect } from '@playwright/test';
import { MainPage } from '../../../pages/main.page';
import { getConfig } from '../../../config/env-loader';

test('should load main page and display logo', async ({ page }) => {
    const config = getConfig();
    const mainPage = new MainPage(page, config);

    // 1. Navigate directly to the main page (Cookies and Local Storage are already injected)
    await mainPage.goto();

    // 2. Check that the logo is visible
    await mainPage.checkLogo();
  });