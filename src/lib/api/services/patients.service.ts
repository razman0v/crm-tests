import { expect } from '@playwright/test';
import { PatientPayload, PatientResponse } from '../../entities/patient.types';
import { BaseService } from './base.service';
import { logger } from '../../../utils/logger';

export class PatientsService extends BaseService {
  /**
   * Create a new patient via API
   * 
   * Per copilot-instructions.md:
   * - Use API for state setup (faster than UI, more reliable)
   * - Auto-masks sensitive fields via logger
   * - Calls /api/v1/init before patient creation (initialization endpoint)
   * 
   * @param payload Patient data (firstName, phone, SNILS, password, etc.)
   * @returns {Promise<PatientResponse>} Created patient with server-assigned ID
   * @throws {Error} On 4xx/5xx responses or missing auth
   */
  async create(payload: PatientPayload): Promise<PatientResponse> {
    logger.info('Patient creation requested', {
      surname: payload.user.surname,
      phone: payload.user.phone,
      companyUid: this.config.companyUid,
      // password/token/secret fields auto-masked by logger
    });

    try {
      const token = await this.getAccessToken();
      const headers = await this.getHeaders(token);

      // Call init endpoint first
      logger.debug('Calling /api/v1/init endpoint');
      await this.request.post('/api/v1/init', { headers });
      logger.debug('Init endpoint completed');

      // Create patient
      logger.debug('Posting patient payload to /api/v1/patients');
      const response = await this.request.post('/api/v1/patients', {
        data: payload,
        headers: headers
      });

      if (!response.ok()) {
        await this.handleResponseError(response, 'Patient creation');
      }

      expect(response.ok()).toBeTruthy();
      const createdPatient = await response.json() as PatientResponse;

      logger.info('Patient created successfully', {
        patientId: createdPatient.id,
        surname: createdPatient.user.surname,
        status: 'success'
      });

      return createdPatient;
    } catch (error) {
      logger.error('Patient creation failed', {
        surname: payload.user.surname,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}