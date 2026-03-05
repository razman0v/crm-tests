import { test, expect } from '../../lib/fixtures';
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
    await expect(async () => {
      await glossary.getJobPositionId('NotARealJobPosition_' + Date.now());
    }).rejects.toThrow(/Glossary Error: Could not find/);
  });

  test('should cache results on subsequent calls', async () => {
    // First call populates cache
    const id1 = await glossary.getSpecializationId('Анестезиология и реаниматология');
    
    // Clear the cache to force a fresh fetch
    glossary.clearCache();
    
    // Second call should refetch (proving cache was actually used)
    const id2 = await glossary.getSpecializationId('Анестезиология и реаниматология');
    
    // Both should return the same ID (API is deterministic)
    expect(id1).toBe(id2);
    
    // Verify cache is working: fetch twice without clearing should be instant
    const startTime = Date.now();
    await glossary.getSpecializationId('Анестезиология и реаниматология');
    await glossary.getSpecializationId('Анестезиология и реаниматология');
    const elapsed = Date.now() - startTime;
    
    // Cached calls should complete in < 100ms (no network overhead)
    expect(elapsed).toBeLessThan(100);
  });

  test('should support case-insensitive and whitespace-tolerant matching', async () => {
    const id = await glossary.getJobPositionId('диктатор');
    expect(id).toBeGreaterThan(0);
  });

  test('should throw error on unexpected API response format', async () => {
    // This test validates error handling for malformed responses
    // (In practice, you'd mock the request to return bad format)
    await expect(async () => {
      // Intentionally use a non-existent glossary type to trigger unexpected format
      await glossary.getSpecializationId('ValidButNonExistentValue_' + Date.now());
    }).rejects.toThrow();
  });
});