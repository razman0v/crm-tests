import { TestConfig } from './config.interface';
import { TestConfigSchema } from './config.schema';
import { devConfig } from './dev.config';

/**
 * Load and validate configuration based on TEST_ENV environment variable
 * 
 * Process:
 * 1. Read TEST_ENV (defaults to 'dev')
 * 2. Load environment-specific config (dev.config.ts, staging.config.ts, etc.)
 * 3. Validate config against TestConfigSchema
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
 * @returns {TestConfig} Validated, type-safe configuration object
 */
export function getConfig(): TestConfig {
  const env = process.env.TEST_ENV || 'dev';
  
  let config: TestConfig;
  switch (env) {
    case 'dev':
      config = devConfig;
      break;
    case 'staging':
      throw new Error('Staging config not implemented yet');
    default:
      throw new Error(`Unknown TEST_ENV: ${env}`);
  }
  
  // ✅ Validate config before returning (fail-fast on config errors)
  try {
    const validated = TestConfigSchema.parse(config);
    return validated;
  } catch (error) {
    // Provide clear error message with validation context
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
