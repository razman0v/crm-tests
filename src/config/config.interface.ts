export interface TestConfig {
  baseUrl: string;
  credentials: {
    admin: {
      username: string;
      password: string;
    };
    // Сюда можно будет добавить doctor, receptionist и т.д.
  };
  features: {
    captchaEnabled: boolean;
    smsCode: string;
    secondCompanyName: string;
    mainPageUrl: string;
  };
}
