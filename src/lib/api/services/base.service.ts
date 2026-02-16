import { APIRequestContext } from '@playwright/test';
import { getConfig } from '@/config/env-loader';
import { withRetry } from '../../../utils/retry.utils';

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
      throw new Error('AccessToken cookie not found. Please check auth setup.');
    }

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
    console.error(`❌ API Error (${errorContext}): ${errorText}`);
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
        const headers = await this.getHeaders();
        const response = await this.request.get(endpoint, { headers });

        if (!response.ok()) {
          await this.handleResponseError(response, `GET ${endpoint}`);
        }

        return response.json();
      },
      { description: `GET ${endpoint}` }
    );
  }

  /**
   * Generic POST request with Retry logic and Auto-Auth
   */
  protected async post<T, D = any>(endpoint: string, data: D): Promise<T> {
    return withRetry(
      async () => {
        const headers = await this.getHeaders();
        const response = await this.request.post(endpoint, {
          headers,
          data,
        });

        if (!response.ok()) {
          await this.handleResponseError(response, `POST ${endpoint}`);
        }

        return response.json();
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
      return null;
    }

    try {
      return JSON.parse(responseText) as T;
    } catch (error) {
      console.warn('[API] Failed to parse JSON response:', responseText);
      return null;
    }
  }
}
