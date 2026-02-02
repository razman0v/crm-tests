import { TestConfig } from './config.interface';
// dotenv уже подключен в playwright.config.ts, поэтому process.env доступен

export const devConfig: TestConfig = {
  // Если переменной нет в .env, упадем с ошибкой или возьмем дефолт
  baseUrl: process.env.BASE_URL || 'http://localhost/3000',
  
  credentials: {
    admin: {
      username: process.env.ADMIN_USERNAME || '',
      password: process.env.ADMIN_PASSWORD || '',
    },
  },
  
  features: {
    captchaEnabled: false,
    smsCode: process.env.SMS_CODE || '',
    secondCompanyName: process.env.SECOND_COMPANY_NAME || '',
    mainPageUrl: process.env.MAIN_PAGE_URL || '',
  },
};
