import { test, expect } from '../../../lib/fixtures';
import { Logger, logger } from '../../../utils/logger';

/**
 * Unit Tests for Logger Utility
 * 
 * Coverage:
 * - Secret masking (passwords, tokens, API keys)
 * - Nested object recursion
 * - Context injection (TEST_NAME, STEP_NAME)
 * - Output format (JSON Lines vs colorized text)
 * - Performance baseline
 */

test.describe('Logger - Secret Masking', () => {
  // Capture console output for assertions
  let capturedLogs: string[] = [];

  test.beforeEach(() => {
    capturedLogs = [];
    Logger.clearTestContext();

    // Intercept stdout/stderr
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;

    process.stdout.write = ((chunk: string) => {
      capturedLogs.push(chunk);
      return true;
    }) as any;

    process.stderr.write = ((chunk: string) => {
      capturedLogs.push(chunk);
      return true;
    }) as any;

    return () => {
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
    };
  });

  test('should mask password field', () => {
    logger.info('Attempting login', { username: 'alice', password: 'secret123' });

    const output = capturedLogs.join('');
    expect(output).toContain('Attempting login');
    expect(output).toContain('alice');
    expect(output).toContain('"password":"****"');
    expect(output).not.toContain('secret123');
  });

  test('should mask token field', () => {
    logger.info('API request', { 
      endpoint: '/api/patients', 
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    });

    const output = capturedLogs.join('');
    expect(output).toContain('/api/patients');
    expect(output).toContain('"token":"****"');
    expect(output).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });

  test('should mask secret field (case-insensitive)', () => {
    logger.info('Config loaded', { 
      apiSecret: 'super-secret-key',
      API_SECRET: 'another-secret',
      SECRET: 'third-secret'
    });

    const output = capturedLogs.join('');
    expect(output).toContain('Config loaded');
    expect(output).toContain('"apiSecret":"****"');
    expect(output).toContain('"API_SECRET":"****"');
    expect(output).toContain('"SECRET":"****"');
    expect(output).not.toContain('super-secret-key');
    expect(output).not.toContain('another-secret');
    expect(output).not.toContain('third-secret');
  });

  test('should mask apikey and api_key fields', () => {
    logger.info('Auth headers', { 
      apikey: 'key123',
      api_key: 'key456',
      apiKey: 'key789'
    });

    const output = capturedLogs.join('');
    expect(output).toContain('"apikey":"****"');
    expect(output).toContain('"api_key":"****"');
    expect(output).toContain('"apiKey":"****"');
    expect(output).not.toContain('key123');
    expect(output).not.toContain('key456');
    expect(output).not.toContain('key789');
  });

  test('should mask refreshToken field', () => {
    logger.info('Session', { refreshToken: 'refresh-abc-123', isActive: true });

    const output = capturedLogs.join('');
    expect(output).toContain('"refreshToken":"****"');
    expect(output).toContain('"isActive":true');
    expect(output).not.toContain('refresh-abc-123');
  });

  test('should recursively mask nested objects', () => {
    logger.info('User profile', {
      name: 'Bob',
      credentials: {
        password: 'nested-secret',
        email: 'bob@example.com'
      },
      tokens: {
        accessToken: 'access-secret',
        refreshToken: 'refresh-secret'
      }
    });

    const output = capturedLogs.join('');
    expect(output).toContain('Bob');
    expect(output).toContain('bob@example.com');
    expect(output).toContain('"password":"****"');
    expect(output).toContain('"accessToken":"****"');
    expect(output).toContain('"refreshToken":"****"');
    expect(output).not.toContain('nested-secret');
    expect(output).not.toContain('access-secret');
    expect(output).not.toContain('refresh-secret');
  });

  test('should recursively mask deeply nested objects (3+ levels)', () => {
    logger.info('Deeply nested data', {
      level1: {
        level2: {
          level3: {
            password: 'deep-secret',
            username: 'deep-user',
            apiSecret: {
              token: 'secret-token' // Note: 'token' is the key here, should be masked
            }
          }
        }
      }
    });

    const output = capturedLogs.join('');
    expect(output).toContain('deep-user');
    expect(output).toContain('"password":"****"');
    expect(output).toContain('"token":"****"');
    expect(output).not.toContain('deep-secret');
    expect(output).not.toContain('secret-token');
  });

  test('should mask values in arrays of objects', () => {
    logger.info('Users list', {
      users: [
        { name: 'Alice', password: 'pass1' },
        { name: 'Bob', password: 'pass2' }
      ]
    });

    const output = capturedLogs.join('');
    expect(output).toContain('Alice');
    expect(output).toContain('Bob');
    expect(output).toContain('"password":"****"');
    expect(output).not.toContain('pass1');
    expect(output).not.toContain('pass2');
  });

  test('should not mask regular fields that contain sensitive words as values', () => {
    logger.info('Log message', {
      message: 'User password was reset',
      status: 'token_expired',
      action: 'update_secret'
    });

    const output = capturedLogs.join('');
    expect(output).toContain('User password was reset');
    expect(output).toContain('token_expired');
    expect(output).toContain('update_secret');
  });

  test('should handle null and undefined values gracefully', () => {
    logger.info('Edge cases', {
      nullValue: null,
      undefinedValue: undefined,
      password: null,
      token: undefined
    });

    const output = capturedLogs.join('');
    expect(output).toContain('Edge cases');
    expect(output).toContain('"password":"****"');
    expect(output).toContain('"token":"****"');
  });

  test('should handle empty objects and arrays', () => {
    logger.info('Empty collections', {
      emptyObj: {},
      emptyArr: [],
      regularField: 'value'
    });

    const output = capturedLogs.join('');
    expect(output).toContain('Empty collections');
    expect(output).toContain('regularField');
  });
});

test.describe('Logger - Context Injection', () => {
  let capturedLogs: string[] = [];

  test.beforeEach(() => {
    capturedLogs = [];
    Logger.clearTestContext();

    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = ((chunk: string) => {
      capturedLogs.push(chunk);
      return true;
    }) as any;

    return () => {
      process.stdout.write = originalStdoutWrite;
    };
  });

  test('should inject TEST_NAME into log entries', () => {
    Logger.setTestContext('LoginFlow');
    logger.info('Step executed');

    const output = capturedLogs.join('');
    expect(output).toContain('LoginFlow');
    expect(output).toContain('Step executed');
  });

  test('should inject both TEST_NAME and STEP_NAME', () => {
    Logger.setTestContext('LoginFlow', 'Step 1: Enter credentials');
    logger.info('Credentials entered');

    const output = capturedLogs.join('');
    expect(output).toContain('LoginFlow');
    expect(output).toContain('Step 1: Enter credentials');
    expect(output).toContain('Credentials entered');
  });

  test('should clear context when clearTestContext is called', () => {
    Logger.setTestContext('TestA', 'Step A');
    logger.info('Log 1');

    Logger.clearTestContext();
    capturedLogs = [];

    logger.info('Log 2');
    const output = capturedLogs.join('');
    expect(output).not.toContain('TestA');
    expect(output).not.toContain('Step A');
    expect(output).toContain('Log 2');
  });
});

test.describe('Logger - Output Formats', () => {
  let capturedLogs: string[] = [];

  test.beforeEach(() => {
    capturedLogs = [];
    Logger.clearTestContext();

    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = ((chunk: string) => {
      capturedLogs.push(chunk);
      return true;
    }) as any;

    return () => {
      process.stdout.write = originalStdoutWrite;
    };
  });

  test('should include timestamp in every log', () => {
    logger.info('Test message');

    const output = capturedLogs.join('');
    // ISO timestamp format: YYYY-MM-DDTHH:MM:SS.sssZ
    expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  });

  test('should include log level in output', () => {
    logger.debug('Debug msg');
    logger.info('Info msg');
    logger.warn('Warn msg');

    const output = capturedLogs.join('');
    expect(output).toContain('DEBUG');
    expect(output).toContain('INFO');
    expect(output).toContain('WARN');
  });

  test('should serialize data as JSON in output', () => {
    logger.info('Test', { userId: 123, status: 'active' });

    const output = capturedLogs.join('');
    expect(output).toContain('"userId":123');
    expect(output).toContain('"status":"active"');
  });

  test('should write errors to stderr', () => {
    const originalStderr = process.stderr.write;
    const stderrLogs: string[] = [];

    process.stderr.write = ((chunk: string) => {
      stderrLogs.push(chunk);
      return true;
    }) as any;

    logger.error('An error occurred');

    expect(stderrLogs.length).toBeGreaterThan(0);
    expect(stderrLogs.join('')).toContain('An error occurred');

    process.stderr.write = originalStderr;
  });

  test('should write non-error logs to stdout', () => {
    const originalStdout = process.stdout.write;
    const stdoutLogs: string[] = [];

    process.stdout.write = ((chunk: string) => {
      stdoutLogs.push(chunk);
      return true;
    }) as any;

    logger.info('Info message');
    logger.debug('Debug message');
    logger.warn('Warn message');

    expect(stdoutLogs.join('')).toContain('Info message');
    expect(stdoutLogs.join('')).toContain('Debug message');
    expect(stdoutLogs.join('')).toContain('Warn message');

    process.stdout.write = originalStdout;
  });
});

test.describe('Logger - Performance', () => {
  test('should log under 5ms (performance baseline)', () => {
    const startTime = process.hrtime.bigint();

    logger.info('Performance test', {
      userId: 123,
      password: 'secret',
      email: 'test@example.com',
      nested: {
        token: 'abc123',
        apiKey: 'key456'
      }
    });

    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    expect(durationMs).toBeLessThan(5);
  });
});