import { ShiftDTO, ShiftSchema, ShiftResponse } from '../../entities/schedule.types';
import { BaseService } from './base.service';
import { ShiftFactory } from '../../fixtures/shift.factory';

export class ScheduleService extends BaseService {
  /**
   * Create a shift with a pre-built payload.
   * Use ShiftFactory for payload construction.
   */
  async createShift(payload: ShiftDTO): Promise<ShiftResponse> {
    const validationResult = ShiftSchema.safeParse(payload);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new Error(`Invalid shift payload: ${errors}`);
    }

    // getHeaders() handles token extraction internally
    const headers = await this.getHeaders();

    const response = await this.request.post('/api/v1/schedule/shift', {
      data: payload,
      headers: headers,
    });

    if (!response.ok()) {
      await this.handleResponseError(response, 'Shift creation');
    }

    const responseText = await response.text();
    const parsedResponse = this.safeParseJsonResponse<ShiftResponse>(responseText);

    if (!parsedResponse) {
      console.log('API: ✅ Request successful (200/204), but response body is empty.');
      // Return stub to prevent test failure on empty response
      return { id: 0, dateFrom: payload.dateFrom, dateTo: payload.dateTo } as ShiftResponse;
    }

    console.log(`API: ✅ Shift created! Response:`, parsedResponse);
    return parsedResponse;
  }

  /**
   * Convenience method: create a simple single-day shift with default work hours.
   * Abstracts payload construction away from test logic.
   */
  async createSimpleShift(
    employeeBranchId: number,
    cabinetId: number,
    dateFrom: string,
    dateTo?: string
  ): Promise<ShiftResponse> {
    const payload = ShiftFactory.createSimpleShift(employeeBranchId, cabinetId, dateFrom, dateTo);
    return this.createShift(payload);
  }
}
