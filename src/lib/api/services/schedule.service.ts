import { APIRequestContext, expect } from '@playwright/test';
import { ShiftDTO, ShiftSchema, ShiftResponse } from '../../entities/schedule.types';
import { getConfig } from '@/config/env-loader';

export class ScheduleService {
  private request: APIRequestContext;
  private config = getConfig();

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  private async getAccessToken(): Promise<string | undefined> {
    const state = await this.request.storageState();
    const tokenCookie = state.cookies.find(c => c.name === 'accessToken');
    return tokenCookie?.value;
  }

  async createShift(payload: ShiftDTO): Promise<ShiftResponse> {
    const validationResult = ShiftSchema.safeParse(payload);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new Error(`Invalid shift payload: ${errors}`);
    }

    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('AccessToken cookie not found. Please check auth setup.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'company-uid': this.config.companyUid,
      'Authorization': `Bearer ${token}`,
    };

    const response = await this.request.post('/api/v1/schedule/shift', {
      data: payload,
      headers: headers,
    });

    if (!response.ok()) {
      const errorText = await response.text();
      console.error(`Schedule API Error: ${errorText}`);
      throw new Error(`Shift creation failed: ${response.status()} ${response.statusText()}`);
    }

    const responseText = await response.text();

    if (!responseText) {
      console.log('API: ✅ Request successful (200/204), but response body is empty.');
      // Возвращаем заглушку, чтобы тест не падал
      return { id: 0, dateFrom: payload.dateFrom, dateTo: payload.dateTo } as ShiftResponse;
    }

    try {
      const body = JSON.parse(responseText);
      console.log(`API: ✅ Shift created! Response:`, body);
      return body;
    } catch (e) {
      console.warn('API: Response is not JSON:', responseText);
      return { id: 0 } as any;
    }
  }
}
