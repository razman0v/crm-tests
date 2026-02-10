import { expect } from '@playwright/test';
import { PatientPayload, PatientResponse } from '../../entities/patient.types';
import { BaseService } from './base.service';

export class PatientsService extends BaseService {
  async create(payload: PatientPayload): Promise<PatientResponse> {
    const token = await this.getAccessToken();
    const headers = this.getHeaders(token);

    await this.request.post('/api/v1/init', { headers });

    const response = await this.request.post('/api/v1/patients', {
      data: payload,
      headers: headers
    });

    if (!response.ok()) {
      await this.handleResponseError(response, 'Patient creation');
    }

    expect(response.ok()).toBeTruthy();
    
    return await response.json();
  }
}