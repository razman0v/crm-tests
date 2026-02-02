import { TestConfig } from './config.interface';
import { devConfig } from './dev.config';

export function getConfig(): TestConfig {
  // Читаем переменную окружения TEST_ENV (по дефолту 'dev')
  const env = process.env.TEST_ENV || 'dev';

  switch (env) {
    case 'dev':
      return devConfig;
    case 'staging':
      throw new Error('Staging config not implemented yet');
    default:
      throw new Error(`Unknown TEST_ENV: ${env}`);
  }
}
