interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  description?: string;
}

/**
 * Retries a function with exponential backoff on Server Errors (5xx) or Network issues.
 * Client Errors (4xx) are thrown immediately to fail fast.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000, // Increased default to 1s for E2E stability
    description = 'Operation',
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      const msg = lastError.message || '';

      // SMART FILTER:
      // 1. Regex checks for 500, 502, 503, 504 (Server Errors)
      // 2. Checks for common network flakes ("fetch failed", "ECONNRESET")
      const isTransient = 
        /50[0234]/.test(msg) || 
        /fetch failed|ECONNRESET|ETIMEDOUT/i.test(msg);

      // If it's a 4xx error (e.g. 400 Bad Request, 404 Not Found), DO NOT RETRY.
      // Or if we ran out of attempts.
      if (!isTransient || attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff: 1000ms * 2^(attempt-1) -> 1s, 2s, 4s
      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
      
      console.warn(
        `⚠️ [Retry] ${description} failed (Attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs}ms...`
      );
      
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error(`${description} failed after ${maxAttempts} attempts`);
}