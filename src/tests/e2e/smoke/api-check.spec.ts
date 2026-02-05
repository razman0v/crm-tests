import { test } from '@playwright/test';
import { PatientFactory } from '../../../lib/fixtures/patient.factory';
import { PatientsService } from '../../../lib/api/services/patients.service';

test.describe('API Smoke Tests', () => {
  
  test('Create Patient via API', async ({ request }) => {
    const patientData = PatientFactory.createRandom();
    const patientsService = new PatientsService(request);
    const createdPatient = await patientsService.create(patientData);
    console.log('Created Patient ID:', createdPatient.id);

    if (!createdPatient.id && createdPatient.user && (createdPatient.user as any).id) {
      console.log('ID found inside user object');
    }
  });
});