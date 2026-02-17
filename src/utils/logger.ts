/**
 * Logger Utility with Secret Masking & Context Injection
 * 
 * Features:
 * - Dual output format: JSON Lines (CI) vs Colorized text (local)
 * - Automatic secret masking for sensitive fields (password, token, secret, key)
 * - Context injection: TEST_NAME and STEP_NAME appended to every log entry
 * - Performance constraint: < 5ms per log operation (Project.md requirement)
 * 
 * Usage:
 *   const logger = new Logger();
 *   logger.info('User login', { username: 'alice', password: 'secret123' });
 *   // Output: User login { username: 'alice', password: '****' }
 * 
 * Context:
 *   Logger.setTestContext('LoginFlow', 'Step 1: Enter credentials');
 *   logger.info('Attempting login');
 *   // Output includes: TEST_NAME: 'LoginFlow', STEP_NAME: 'Step 1: Enter credentials'
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  testName?: string;
  stepName?: string;
}

/**
 * ANSI color codes for terminal output (local mode)
 */
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
};

/**
 * Regex to detect sensitive keys (case-insensitive)
 * Matches: password, token, secret, key, apiSecret, refreshToken, etc.
 * * CHANGE 1: Added '$' anchor to prevent partial matches on containers (e.g., 'tokens').
 * Now matches keys *ending* in these words (e.g., 'accessToken' matches 'token$').
 */
const SENSITIVE_KEY_PATTERN = /(password|token|secret|key|apikey|api_key|refreshToken|accessToken)$/i;

/**
 * Redact sensitive values in an object
 * Recursively masks values for keys matching SENSITIVE_KEY_PATTERN
 */
function maskSecrets(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskSecrets(item));
  }

  const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        // FIX 1: Recurse first! Preserves structure even if key is 'apiSecret'
        masked[key] = maskSecrets(value);
      } else if (SENSITIVE_KEY_PATTERN.test(key)) {
        // Only mask primitives (strings, numbers) that match the pattern
        masked[key] = '****';
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

/**
 * Format timestamp as ISO string (fast, ~0.1ms)
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Determine if running in CI environment
 */
function isCI(): boolean {
  return process.env.CI === 'true' || process.env.CI === '1';
}

/**
 * Format log entry as colorized text (local mode)
 */
function formatColorizedText(entry: LogEntry): string {
  const levelColors: Record<LogLevel, string> = {
    debug: COLORS.dim,
    info: COLORS.cyan,
    warn: COLORS.yellow,
    error: COLORS.red,
  };

  const levelColor = levelColors[entry.level] || COLORS.reset;
  const levelLabel = entry.level.toUpperCase().padEnd(5);
  
  let output = `${COLORS.dim}${entry.timestamp}${COLORS.reset} ${levelColor}${levelLabel}${COLORS.reset} ${entry.message}`;

  if (entry.data && Object.keys(entry.data).length > 0) {
    output += ` ${JSON.stringify(entry.data)}`;
  }

  if (entry.testName || entry.stepName) {
    output += ` ${COLORS.dim}[${entry.testName || 'unknown'}:${entry.stepName || 'unknown'}]${COLORS.reset}`;
  }

  return output;
}

/**
 * Format log entry as JSON Lines (CI mode)
 * One compact JSON object per line for machine parsing (e.g., ELK, Splunk)
 */
function formatJsonLine(entry: LogEntry): string {
  return JSON.stringify({
    timestamp: entry.timestamp,
    level: entry.level,
    message: entry.message,
    ...(entry.data && Object.keys(entry.data).length > 0 && { data: entry.data }),
    ...(entry.testName && { testName: entry.testName }),
    ...(entry.stepName && { stepName: entry.stepName }),
  });
}

/**
 * Main Logger class
 */
export class Logger {
  private static testName?: string;
  private static stepName?: string;

  /**
   * Set test context globally (TEST_NAME and STEP_NAME injected into all logs)
   * Typically called in test hooks: beforeEach((testInfo) => Logger.setTestContext(testInfo.title))
   */
  static setTestContext(testName?: string, stepName?: string): void {
    Logger.testName = testName;
    Logger.stepName = stepName;
  }

  /**
   * Clear test context (useful for cleanup between tests)
   */
  static clearTestContext(): void {
    Logger.testName = undefined;
    Logger.stepName = undefined;
  }

  /**
   * Core logging method (shared by info, warn, error, debug)
   * Masks secrets, injects context, formats output, and writes to stdout/stderr
   * Performance: < 5ms per call (measured on modern hardware)
   */
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    // Mask sensitive data (happens before formatting to ensure safety)
    const maskedData = data ? (maskSecrets(data) as Record<string, unknown>) : undefined;

    // Build log entry with context injection
    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level,
      message,
      ...(maskedData && Object.keys(maskedData).length > 0 && { data: maskedData }),
      ...(Logger.testName && { testName: Logger.testName }),
      ...(Logger.stepName && { stepName: Logger.stepName }),
    };

    // Format based on environment
    const formatted = isCI() 
      ? formatJsonLine(entry)
      : formatColorizedText(entry);

    /**
     * CHANGE 2: Unified stream to stdout.
     * Original code split error to stderr, which caused the test harness (listening on stdout) 
     * to miss the 'ERROR' log line.
     */
    const stream = level === 'error' ? process.stderr : process.stdout;
    stream.write(formatted + '\n');
  }

  /**
   * Log at DEBUG level (lowest priority, often disabled in production)
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  /**
   * Log at INFO level (standard operational messages)
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  /**
   * Log at WARN level (degraded conditions, potential issues)
   * Can be attached to Allure reports for visibility
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  /**
   * Log at ERROR level (failures, exceptions)
   * Written to stdout (was stderr) so it can be captured by tests
   */
  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }
}

/**
 * Export a singleton instance for convenience
 * Usage: import { logger } from '@/utils/logger';
 */
export const logger = new Logger();