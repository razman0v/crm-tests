import { APIRequestContext } from '@playwright/test';
import { getConfig } from '@/config/env-loader';
import { withRetry } from '../../../utils/retry.utils';
import { logger } from '../../../utils/logger';

export class BaseService {
  protected request: APIRequestContext;
  protected config = getConfig();

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  // Helper to get token
  protected async getAccessToken(): Promise<string> {
    const state = await this.request.storageState();
    const tokenCookie = state.cookies.find((c) => c.name === 'accessToken');

    if (!tokenCookie?.value) {
      logger.error('AccessToken cookie not found', { 
        availableCookies: state.cookies.map(c => c.name),
        context: 'Auth token missing - run setup project first'
      });
      throw new Error('AccessToken cookie not found. Please check auth setup.');
    }

    logger.debug('AccessToken retrieved successfully');
    return tokenCookie.value;
  }

  // Helper to build headers
  protected async getHeaders(tokenOverride?: string): Promise<Record<string, string>> {
    const token = tokenOverride || (await this.getAccessToken());
    return {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'company-uid': this.config.companyUid,
      Authorization: `Bearer ${token}`,
    };
  }

  // Error Handler
  protected async handleResponseError(
    response: Awaited<ReturnType<APIRequestContext['post']>>,
    errorContext: string
  ): Promise<never> {
    const errorText = await response.text();
    logger.error(`API Error: ${errorContext}`, {
      status: response.status(),
      statusText: response.statusText(),
      errorText: errorText.slice(0, 500), // Truncate huge error HTML
      endpoint: response.url(),
    });
    throw new Error(
      `${errorContext} failed: ${response.status()} ${response.statusText()}\n${errorText}`
    );
  }

  /**
   * Generic GET request with Retry logic and Auto-Auth
   */
  protected async get<T>(endpoint: string): Promise<T> {
    return withRetry(
      async () => {
        logger.debug(`GET Request`, { endpoint });
        const headers = await this.getHeaders();
        const response = await this.request.get(endpoint, { headers });

        if (!response.ok()) {
          await this.handleResponseError(response, `GET ${endpoint}`);
        }

        const result = await response.json();
        logger.debug(`GET Request successful`, { endpoint, responseSize: JSON.stringify(result).length });
        return result;
      },
      { description: `GET ${endpoint}` }
    );
  }

  /**
   * Generic POST request with Retry logic and Auto-Auth
   * Logger automatically masks sensitive fields (password, token, secret, key)
   */
  protected async post<T, D = any>(endpoint: string, data: D): Promise<T> {
    return withRetry(
      async () => {
        logger.debug(`POST Request`, { 
          endpoint,
          // data is logged but logger auto-masks sensitive fields
          dataKeys: typeof data === 'object' && data !== null 
            ? Object.keys(data as Record<string, unknown>) 
            : []
        });

        const headers = await this.getHeaders();
        const response = await this.request.post(endpoint, {
          headers,
          data,
        });

        if (!response.ok()) {
          await this.handleResponseError(response, `POST ${endpoint}`);
        }

        const result = await response.json();
        logger.info(`POST Request successful`, { 
          endpoint,
          // Mask sensitive fields in response (if any)
          resultKeys: typeof result === 'object' && result !== null 
            ? Object.keys(result as Record<string, unknown>) 
            : []
        });
        return result;
      },
      { description: `POST ${endpoint}` }
    );
  }

  /**
   * Safely parse JSON response, handling empty responses gracefully
   * Returns null if response body is empty or invalid JSON
   */
  protected safeParseJsonResponse<T>(responseText: string): T | null {
    if (!responseText || responseText.trim() === '') {
      logger.debug('Empty response body');
      return null;
    }

    try {
      return JSON.parse(responseText) as T;
    } catch (error) {
      logger.warn('Failed to parse JSON response', {
        error: error instanceof Error ? error.message : String(error),
        responsePreview: responseText.slice(0, 100)
      });
      return null;
    }
  }
}