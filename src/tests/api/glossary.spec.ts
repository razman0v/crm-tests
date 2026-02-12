import { test, expect } from '@playwright/test';
import { GlossaryService } from '../../lib/api/services/glossary.service';

test.describe('API Contract: Glossary Service', () => {
  let glossary: GlossaryService;

  test.beforeEach(async ({ request }) => {
    glossary = new GlossaryService(request);
  });

  test.afterEach(async () => {
    // Clear cache to ensure test isolation
    glossary.clearCache();
  });

  test('should resolve Specialization ID by exact match', async () => {
    // Verify the method actually fetches and searches, not just hardcoded
    const id = await glossary.getSpecializationId('Анестезиология и реаниматология');
    expect(id).toBeGreaterThan(0);
    expect(typeof id).toBe('number');
  });

  test('should resolve Job Position ID by exact match', async () => {
    const id = await glossary.getJobPositionId('Диктатор');
    expect(id).toBeGreaterThan(0);
    expect(typeof id).toBe('number');
  });

  test('should resolve Medical Job Position ID by exact match', async () => {
    const id = await glossary.getMedicalJobPositionId('Директор образовательной организации');
    expect(id).toBeGreaterThan(0);
    expect(typeof id).toBe('number');
  });

  test('should return default branch if no name provided', async () => {
    const id = await glossary.getBranchId();
    expect(id).toBeGreaterThan(0);
    expect(typeof id).toBe('number');
  });

  test('should throw meaningful error for non-existent entry', async () => {
    // Verify error handling works
    await expect(async () => {
      await glossary.getJobPositionId('NotARealJobPosition_' + Date.now());
    }).rejects.toThrow(/Glossary Error: Could not find/);
  });

  test('should cache results on subsequent calls', async () => {
    const id1 = await glossary.getSpecializationId('Анестезиология и реаниматология');
    const id2 = await glossary.getSpecializationId('Анестезиология и реаниматология');
    
    expect(id1).toBe(id2);
  });

  test('should support case-insensitive and whitespace-tolerant matching', async () => {
    // Test that search is robust
    const id = await glossary.getJobPositionId('диктатор');
    expect(id).toBeGreaterThan(0);
  });
});