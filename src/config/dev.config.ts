import 'dotenv/config';
import { TestConfig } from './config.interface';

export const devConfig: TestConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost/3000',
  companyUid: process.env.COMPANY_UID || '',
  
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
