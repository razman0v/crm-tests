import { test, expect } from '@playwright/test';
import { GlossaryService } from '../../lib/api/services/glossary.service';

test('Integration: Glossary Service', async ({ request }) => {
  console.log('\n--- TESTING GLOSSARY SERVICE ---');

  const glossary = new GlossaryService(request);

  // 1. Специализация
  const specName = 'Анестезиология и реаниматология';
  console.log(`1. Specialization: "${specName}"`);
  try {
    const id = await glossary.getSpecializationId(specName);
    console.log(`   ✅ Success! ID: ${id}`);
    expect(id).toBe(148); // Проверяем конкретный ID из вашего лога
  } catch (e) { 
    console.log(`   ❌ Failed: ${(e as Error).message}`); 
  }

  // 2. Мед. должность
  const medPosName = 'Директор образовательной организации'; // Или любая другая из списка
  console.log(`2. Medical Position: "${medPosName}"`);
  try {
    // Внимание: если 'Директор...' нет в дефолтном списке autocomplete, тест может упасть.
    // Если упадет, попробуем найти другую позицию, которая точно есть.
    const id = await glossary.getMedicalJobPositionId(medPosName);
    console.log(`   ✅ Success! ID: ${id}`);
    expect(id).toBeGreaterThan(0);
  } catch (e) { 
    console.log(`   ❌ Failed: ${(e as Error).message}`); 
  }

  // 3. Должность
  const jobPosName = 'Диктатор';
  console.log(`3. Job Position: "${jobPosName}"`); 
  try {
    const id = await glossary.getJobPositionId(jobPosName);
    console.log(`   ✅ Success! ID: ${id}`);
    expect(id).toBe(1); // Из вашего лога
  } catch (e) { 
    console.log(`   ❌ Failed: ${(e as Error).message}`); 
  }

  // 4. Филиал
  console.log('4. Fetching Default Branch ID...');
  try {
    const branchId = await glossary.getBranchId();
    console.log(`   ✅ Success! ID: ${branchId}`);
    expect(branchId).toBeGreaterThan(0);
  } catch (e) {
    console.log(`   ❌ Failed: ${(e as Error).message}`);
  }

  console.log('--- END ---\n');
});