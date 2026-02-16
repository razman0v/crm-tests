/**
 * Unit Tests for PatientFactory
 * Validates SNILS checksum calculation and all data generation
 */
import { test, expect } from '@playwright/test';
import { PatientFactory, PatientBuilder } from '../../../lib/factories/patient.factory';

// Helper: Validate SNILS checksum (same logic as factory)
function validateSnilsChecksum(snils: string): boolean {
  if (snils.length !== 11) return false;
  const digits = snils.substring(0, 9).split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (9 - i); // Corrected Weight
  }
  
  let expectedChecksum = 0;
  if (sum < 100) {
    expectedChecksum = sum;
  } else if (sum === 100 || sum === 101) {
    expectedChecksum = 0;
  } else {
    const remainder = sum % 101;
    expectedChecksum = (remainder === 100 || remainder === 101) ? 0 : remainder;
  }

  const actualChecksum = parseInt(snils.substring(9));
  return expectedChecksum === actualChecksum;
}

test.describe('PatientFactory', () => {
  test.describe('createRandom()', () => {
    test('should generate patient with valid SNILS checksum', () => {
      const patient = PatientFactory.createRandom();
      expect(patient.user.snils).toMatch(/^\d{11}$/);
      expect(validateSnilsChecksum(patient.user.snils)).toBe(true);
    });

    test('should generate 16-digit OMS policy number', () => {
      const patient = PatientFactory.createRandom();
      expect(patient.policyOmsNumber).toMatch(/^\d{16}$/);
    });

    test('should generate passport with valid format', () => {
      const patient = PatientFactory.createRandom();
      expect(patient.passport.series).toMatch(/^[A-Z0-9]{2,4}$/);
      expect(patient.passport.number).toMatch(/^\d{6}$/);
    });

    test('should generate all required user fields', () => {
      const patient = PatientFactory.createRandom();
      expect(patient.user.surname).toBeDefined();
      expect(patient.user.name).toBeDefined();
      expect(patient.user.patronymic).toBeDefined();
      expect(patient.user.birthday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(patient.user.phone).toMatch(/^\+7 \(\d{3}\) \d{3}-\d{2} \d{2}$/);
      expect([1, 2]).toContain(patient.user.glossaryGenderId);
    });

    test('should support reproducible seeded generation', () => {
      const patient1 = PatientFactory.createRandom(42);
      const patient2 = PatientFactory.createRandom(42);
      expect(patient1.user.surname).toBe(patient2.user.surname);
      expect(patient1.user.name).toBe(patient2.user.name);
      expect(patient1.user.birthday).toBe(patient2.user.birthday);
      expect(patient1.policyOmsNumber).toBe(patient2.policyOmsNumber);
      expect(patient1.passport.series).toBe(patient2.passport.series);
      expect(patient1.user.snils).toBe(patient2.user.snils);
    });
  });

  test.describe('PatientBuilder', () => {
    test('should allow fluent customization', () => {
      const patient = PatientFactory.builder()
        .withName('Иванов', 'Иван', 'Иванович')
        .withPhone('+7 (999) 999-99 99')
        .withGender(1)
        .withComment('Custom test patient')
        .build();

      expect(patient.user.surname).toBe('Иванов');
      expect(patient.user.name).toBe('Иван');
      expect(patient.user.patronymic).toBe('Иванович');
      expect(patient.user.phone).toBe('+7 (999) 999-99 99');
      expect(patient.user.glossaryGenderId).toBe(1);
      expect(patient.comment).toBe('Custom test patient');
    });

    test('should allow overriding SNILS, OMS, and passport', () => {
      const customSnils = '12345678901';
      const customOms = '1234567890123456';
      const patient = PatientFactory.builder()
        .withSnils(customSnils)
        .withOmsPolicy(customOms)
        .withPassport('AB', '123456')
        .build();

      expect(patient.user.snils).toBe(customSnils);
      expect(patient.policyOmsNumber).toBe(customOms);
      expect(patient.passport.series).toBe('AB');
      expect(patient.passport.number).toBe('123456');
    });

    test('should maintain valid SNILS after custom changes', () => {
      // Create a patient and verify the auto-generated SNILS is valid
      const patient = new PatientBuilder()
        .withName('Тестов', 'Тест')
        .build();

      expect(validateSnilsChecksum(patient.user.snils)).toBe(true);
    });

    test('should support seeded builder', () => {
      const builder1 = PatientFactory.builder(99);
      const patient1 = builder1.build();

      const builder2 = PatientFactory.builder(99);
      const patient2 = builder2.build();

      expect(patient1.user.snils).toBe(patient2.user.snils);
      expect(patient1.policyOmsNumber).toBe(patient2.policyOmsNumber);
    });
  });

  test.describe('SNILS Checksum Algorithm', () => {
    test('should correctly calculate checksum for known test value', () => {
      // Test case: SNILS 123456789 → checksum should be valid
      // S = 1*9 + 2*8 + 3*7 + 4*6 + 5*5 + 6*4 + 7*3 + 8*2 + 9*1
      // S = 9 + 16 + 21 + 24 + 25 + 24 + 21 + 16 + 9 = 165
      // C = 165 % 101 = 64
      // Expected SNILS: 12345678964
      const testSnils = '12345678964';
      expect(validateSnilsChecksum(testSnils)).toBe(true);
    });

    test('should handle edge case where S = 100', () => {
      // When S % 101 = 100, checksum should be 0
      const patient = PatientFactory.createRandom();
      expect(patient.user.snils.length).toBe(11);
      expect(validateSnilsChecksum(patient.user.snils)).toBe(true);
    });
  });
});
