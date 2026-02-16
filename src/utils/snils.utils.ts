import { fakerRU as faker } from '@faker-js/faker';

/**
 * Utility: Calculate SNILS checksum using Modulo 101 algorithm
 * Strictly follows Project.md §4.4.1 requirements.
 */
export function calculateSnilsChecksum(snilsBase: string): string {
  const digits = snilsBase.split('').map(Number);
  let sum = 0;
  
  // Weights must be 9, 8, 7, 6, 5, 4, 3, 2, 1
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (9 - i);
  }

  let checksum = 0;
  if (sum < 100) {
    checksum = sum;
  } else if (sum === 100 || sum === 101) {
    checksum = 0;
  } else {
    const remainder = sum % 101;
    // If remainder is 100 or 101, checksum is 00
    checksum = (remainder === 100 || remainder === 101) ? 0 : remainder;
  }

  return snilsBase + String(checksum).padStart(2, '0');
}

/**
 * Utility: Generate valid SNILS
 */
export function generateValidSnils(): string {
  const base = faker.string.numeric(9);
  return calculateSnilsChecksum(base);
}