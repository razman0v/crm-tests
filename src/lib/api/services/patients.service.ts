import { APIRequestContext, expect } from '@playwright/test';
import { PatientPayload, PatientResponse } from '../../entities/patient.types';
import { getConfig } from '@/config/env-loader';

export class PatientsService {
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

  async create(payload: PatientPayload): Promise<PatientResponse> {
    const token = await this.getAccessToken();

    if (!token) {
        throw new Error('AccessToken cookie not found. Please check auth setup.');
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'company-uid': this.config.companyUid,
        'Authorization': `Bearer ${token}`
    };

    await this.request.post('/api/v1/init', { headers });

    const response = await this.request.post('/api/v1/patients', {
      data: payload,
      headers: headers
    });

    if (!response.ok()) {
        const errorText = await response.text();
        console.error(`API Error: ${errorText}`);
        throw new Error(`Patient creation failed: ${response.status()} ${response.statusText()}`);
    }

    expect(response.ok()).toBeTruthy();
    
    return await response.json();
  }
}