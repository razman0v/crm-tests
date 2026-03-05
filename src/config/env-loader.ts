import { config } from './config.interface';
import { configSchema } from './config.schema';
import { devConfig } from './dev.config';
import { logger } from '../utils/logger';

/**
 * Load and validate configuration based on TEST_ENV environment variable
 * 
 * Process:
 * 1. Read TEST_ENV (defaults to 'dev')
 * 2. Load environment-specific config (dev.config.ts, staging.config.ts, etc.)
 * 3. Validate config against configSchema
 * 4. Return validated, type-safe config or throw ZodError
 * 
 * Error handling:
 * - Config validation failures throw immediately (fail-fast strategy)
 * - Error messages include field-level validation details
 * - Examples:
 *   - "baseUrl must be a valid URL (e.g., http://localhost:3000)"
 *   - "admin username is required and cannot be empty"
 * 
 * @throws {Error} If TEST_ENV is unknown
 * @throws {ZodError} If config fails validation (missing required fields, invalid values)
 * @returns {config} Validated, type-safe configuration object
 */
export function getConfig(): config {
  const env = process.env.TEST_ENV || 'dev';

  logger.debug('Loading configuration', { testEnv: env });

  let config: config;
  switch (env) {
    case 'dev':
      config = devConfig;
      logger.debug('Loaded dev configuration');
      break;
    case 'staging':
      logger.error('Staging config not implemented yet');
      throw new Error('Staging config not implemented yet');
    default:
      logger.error('Unknown TEST_ENV', { testEnv: env });
      throw new Error(`Unknown TEST_ENV: ${env}`);
  }

  config.baseUrl = config.baseUrl.endsWith('/')
    ? config.baseUrl
    : `${config.baseUrl}/`;


  // ✅ Validate config before returning (fail-fast on config errors)
  try {
    const validated = configSchema.parse(config);
    logger.info('Configuration validated successfully', {
      baseUrl: validated.baseUrl,
      companyUid: validated.companyUid,
      // password/token fields auto-masked by logger
    });
    return validated;
  } catch (error) {
    // Provide clear error message with validation context
    logger.error('Configuration validation failed', {
      testEnv: env,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error) {
      console.error(
        `\n❌ Configuration validation failed for TEST_ENV="${env}":\n` +
        `   ${error.message}\n` +
        `   Please check your .env file or environment variables.\n`
      );
    }
    throw error;
  }
}
