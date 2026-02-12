import { test, expect } from '@playwright/test';
import { GlossaryService } from '../../lib/api/services/glossary.service';

test.describe('API Contract: Glossary Service', () => {
  let glossary: GlossaryService;

  test.beforeEach(async ({ request }) => {
    glossary = new GlossaryService(request);
  });

  test('should resolve Specialization ID (e.g. Анестезиология)', async () => {
    const id = await glossary.getSpecializationId('Анестезиология и реаниматология');
    expect(id).toBe(148); // ID который мы подтвердили
  });

  test('should resolve Job Position ID (e.g. Диктатор)', async () => {
    const id = await glossary.getJobPositionId('Диктатор');
    expect(id).toBe(1);
  });

  test('should resolve Medical Job Position ID (e.g. Директор)', async () => {
    const id = await glossary.getMedicalJobPositionId('Директор образовательной организации');
    expect(id).toBe(562);
  });

  test('should return default branch if no name provided', async () => {
    const id = await glossary.getBranchId();
    expect(id).toBeGreaterThan(0);
  });

  test('should throw meaningful error for non-existent entry', async () => {
    // Проверяем, что сервис реально ругается на несуществующие данные
    await expect(async () => {
      await glossary.getJobPositionId('Несуществующая должность 123');
    }).rejects.toThrow(/Glossary Error: Could not find/);
  });
});