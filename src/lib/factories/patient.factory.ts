import { fakerRU as faker } from '@faker-js/faker';
import { PatientPayload } from '../entities/patient.types';
import { generateValidSnils } from '../../utils/snils.utils';

/**
 * Utility: Generate OMS policy number (exactly 16 random digits)
 */
function generateOmsPolicy(): string {
  return faker.string.numeric(16);
}

/**
 * Utility: Generate passport document (series: 2-4 chars, number: 6 digits)
 */
function generatePassport(): { series: string; number: string } {
  const seriesLength = faker.number.int({ min: 2, max: 4 });
  const series = faker.string.alphanumeric(seriesLength).toUpperCase();
  const number = faker.string.numeric(6);
  return { series, number };
}

/**
 * PatientBuilder: Fluent API for constructing PatientPayload with optional customization
 * 
 * Generates all required fields including:
 * - Valid SNILS with checksum
 * - 16-digit OMS policy number
 * - Passport with series (2-4 chars) and number (6 digits)
 * 
 * Usage Examples:
 *   // Random generation
 *   const patient = new PatientBuilder().build();
 *   
 *   // Seeded generation (reproducible)
 *   const patient = new PatientBuilder(123).build();
 *   
 *   // Fluent customization
 *   const patient = new PatientBuilder()
 *     .withName('Иванов', 'Иван', 'Иванович')
 *     .withPhone('+7 (999) 123-45 67')
 *     .withGender(1)
 *     .build();
 */
export class PatientBuilder {
  private data: PatientPayload;

  constructor(seed?: number) {
    // Optional seeding for reproducible test data during debugging
    if (seed !== undefined) {
      faker.seed(seed);
    }

    const sex = faker.person.sexType();
    const firstName = faker.person.firstName(sex);
    const lastName = faker.person.lastName(sex);
    const middleName = faker.person.middleName(sex);

    const birthDateObj = faker.date.birthdate({ min: 18, max: 90, mode: 'age' });
    const formattedBirthDate = birthDateObj.toISOString().split('T')[0];

    const rawPhone = faker.helpers.fromRegExp(/934[0-9]{7}/);
    const formattedPhone = `+7 (${rawPhone.substring(0, 3)}) ${rawPhone.substring(3, 6)}-${rawPhone.substring(6, 8)} ${rawPhone.substring(8, 10)}`;

    this.data = {
      user: {
        glossaryGenderId: sex === 'male' ? 1 : 2,
        surname: lastName,
        name: firstName,
        patronymic: middleName,
        birthday: formattedBirthDate,
        phone: formattedPhone,
        snils: generateValidSnils()
      },
      policyOmsNumber: generateOmsPolicy(),
      passport: generatePassport(),
      comment: 'Auto-test generated via Playwright'
    };
  }

  /**
   * Set full name (surname, name, optional patronymic)
   */
  withName(surname: string, name: string, patronymic?: string): PatientBuilder {
    this.data.user.surname = surname;
    this.data.user.name = name;
    if (patronymic) this.data.user.patronymic = patronymic;
    return this;
  }

  /**
   * Set phone number (e.g., '+7 (999) 123-45 67')
   */
  withPhone(phone: string): PatientBuilder {
    this.data.user.phone = phone;
    return this;
  }

  /**
   * Set birthday (YYYY-MM-DD format, e.g., '1985-03-15')
   */
  withBirthday(birthday: string): PatientBuilder {
    this.data.user.birthday = birthday;
    return this;
  }

  /**
   * Set SNILS (11 digits; will NOT recalculate checksum)
   */
  withSnils(snils: string): PatientBuilder {
    this.data.user.snils = snils;
    return this;
  }

  /**
   * Set OMS policy number (must be exactly 16 digits)
   */
  withOmsPolicy(oms: string): PatientBuilder {
    this.data.policyOmsNumber = oms;
    return this;
  }

  /**
   * Set passport details (series: 2-4 chars, number: 6 digits)
   */
  withPassport(series: string, number: string): PatientBuilder {
    this.data.passport = { series, number };
    return this;
  }

  /**
   * Set gender (1=male, 2=female)
   */
  withGender(genderId: number): PatientBuilder {
    this.data.user.glossaryGenderId = genderId;
    return this;
  }

  /**
   * Set optional comment
   */
  withComment(comment: string | null): PatientBuilder {
    this.data.comment = comment;
    return this;
  }

  /**
   * Build and return the final PatientPayload
   */
  build(): PatientPayload {
    return { ...this.data };
  }
}

/**
 * PatientFactory: Static factory methods for patient creation
 * 
 * Usage:
 *   PatientFactory.createRandom() - generate fully random patient
 *   PatientFactory.createRandom(123) - generate with reproducible seed
 *   PatientFactory.builder().withName(...).build() - fluent customization
 */
export class PatientFactory {
  /**
   * Create a fully random patient with valid SNILS, OMS, and passport
   * @param seed Optional seed for reproducible generation (for debugging)
   */
  static createRandom(seed?: number): PatientPayload {
    return new PatientBuilder(seed).build();
  }

  /**
   * Return a PatientBuilder for fluent customization
   * @param seed Optional seed for reproducible generation
   */
  static builder(seed?: number): PatientBuilder {
    return new PatientBuilder(seed);
  }
}
