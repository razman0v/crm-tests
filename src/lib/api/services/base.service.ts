import { APIRequestContext } from '@playwright/test';
import { getConfig } from '@/config/env-loader';

export class BaseService {
  protected request: APIRequestContext;
  protected config = getConfig();

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Extracts the access token from storage state (cookies).
   * @returns The access token value or undefined if not found.
   * @throws Error if token is not found.
   */
  protected async getAccessToken(): Promise<string> {
    const state = await this.request.storageState();
    const tokenCookie = state.cookies.find(c => c.name === 'accessToken');
    
    if (!tokenCookie?.value) {
      throw new Error('AccessToken cookie not found. Please check auth setup.');
    }
    
    return tokenCookie.value;
  }

  /**
   * Builds standard HTTP headers for API requests.
   * Includes authentication, content-type, and company-uid headers.
   * @param token The access token for Authorization header.
   * @returns Standard headers object.
   */
  protected getHeaders(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'company-uid': this.config.companyUid,
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Handles API response errors with clear messaging.
   * @param response The API response from Playwright.
   * @param errorContext Additional context for the error message.
   * @throws Error with formatted error message including status and response text.
   */
  protected async handleResponseError(
    response: Awaited<ReturnType<APIRequestContext['post']>>,
    errorContext: string
  ): Promise<never> {
    const errorText = await response.text();
    console.error(`API Error (${errorContext}): ${errorText}`);
    throw new Error(
      `${errorContext} failed: ${response.status()} ${response.statusText()}\n${errorText}`
    );
  }

  /**
   * Safely parses JSON response, handling empty responses.
   * @param responseText The raw response text.
   * @returns Parsed JSON object or null if response is empty.
   */
  protected safeParseJsonResponse<T>(responseText: string): T | null {
    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText) as T;
    } catch (e) {
      console.warn('API: Response is not valid JSON:', responseText);
      throw new Error(`Failed to parse API response as JSON: ${responseText}`);
    }
  }
}
