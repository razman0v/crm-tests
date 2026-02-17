import { z } from 'zod';

/**
 * Zod schema for TestConfig runtime validation
 * 
 * **Strict validation** on core fields: baseUrl, credentials
 * **Lenient validation** on optional features: smsCode, secondCompanyName, mainPageUrl
 * Error handling: Throws ZodError with detailed field-level messages on validation failure.
 * Example error: "companyUid is required and cannot be empty"
 */

export const TestConfigSchema = z.object({
  baseUrl: z
    .string()
    .url('baseUrl must be a valid URL (e.g., http://localhost:3000)'),
  
  companyUid: z
    .string()
    .min(1, 'companyUid is required and cannot be empty'),
  
  credentials: z.object({
    admin: z.object({
      username: z
        .string()
        .min(1, 'admin username is required and cannot be empty'),
      password: z
        .string()
        .min(1, 'admin password is required and cannot be empty'),
    }),
  }),
  
  features: z.object({
    // Strict: captchaEnabled must be boolean
    captchaEnabled: z
      .boolean()
      .describe('Whether CAPTCHA is enabled in the target environment'),
    
    // Lenient: optional feature flags (allow empty string)
    smsCode: z
      .string()
      .describe('SMS code for 2FA testing (optional: can be empty)'),
    
    secondCompanyName: z
      .string()
      .describe('Second company name for multi-company tests (optional: can be empty)'),
    
    mainPageUrl: z
      .string()
      .describe('Main page URL for navigation tests (optional: can be empty)'),
  }),
});

/**
 * Type-safe configuration validated against TestConfigSchema
 * Automatically inferred from schema to prevent type/validation drift
 */
export type TestConfigValidated = z.infer<typeof TestConfigSchema>;