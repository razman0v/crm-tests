import { APIRequestContext } from '@playwright/test';
import { VisitDTO, VisitSchema, VisitResponse } from '../../entities/visit.types';
import { BaseService } from './base.service';

export class VisitService extends BaseService {
  async create(payload: VisitDTO): Promise<VisitResponse> {
    // Validate payload against schema
    const validatedPayload = VisitSchema.parse(payload);

    const headers = await this.getHeaders();

    const response = await this.request.post('/api/v1/health/visits', {
      data: validatedPayload,
      headers,
    });

    if (response.status() !== 201) {
      await this.handleResponseError(response, 'Visit creation');
    }

    const responseData: VisitResponse = await response.json();
    return responseData;
  }
}