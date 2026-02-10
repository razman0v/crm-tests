import { APIRequestContext } from '@playwright/test';
import { getConfig } from '@/config/env-loader';

export class BaseService {
  protected request: APIRequestContext;
  protected config = getConfig();

  constructor(request: APIRequestContext) {
    this.request = request;
  }

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
   * Automatically extracts and injects the access token.
   * @param tokenOverride Optional token override (for testing or special cases).
   * @returns Standard headers object.
   */
  protected async getHeaders(tokenOverride?: string): Promise<Record<string, string>> {
    const token = tokenOverride || await this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'company-uid': this.config.companyUid,
      'Authorization': `Bearer ${token}`,
    };
  }

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
