import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/auth/login.page';
import { getConfig } from '../config/env-loader';

const authFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  const config = getConfig();
  const loginPage = new LoginPage(page, config);
  await loginPage.goto();
  await loginPage.performLogin();

  await page.context().storageState({ path: authFile });
});
