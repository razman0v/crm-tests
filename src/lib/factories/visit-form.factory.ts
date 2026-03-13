import { fakerRU as faker } from '@faker-js/faker';

/**
 * Data contract for the "Записать пациента" modal form.
 *
 * Separates generated values (dates, purpose) from runtime values
 * that must come from the live application (patient, doctor, visit type, room).
 * Pass generated values to the modal helpers; provide runtime values
 * from API responses or environment config.
 */
export interface VisitFormData {
  /** Start of the desired date range in DD.MM.YYYY format */
  dateFrom: string;
  /** End of the desired date range in DD.MM.YYYY format */
  dateTo: string;
  /** Optional free-text visit purpose ("Цель визита") */
  visitPurpose?: string;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function toDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

// ─── Builder ─────────────────────────────────────────────────────────────────

export class VisitFormBuilder {
  private data: VisitFormData;

  /**
   * @param seed Optional seed for reproducible generation during debugging.
   */
  constructor(seed?: number) {
    if (seed !== undefined) {
      faker.seed(seed);
    }

    // dateFrom: today
    const from = new Date();
    // dateTo: 30 days later (gives the calendar enough range to find open slots)
    const to = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.data = {
      dateFrom: toDisplayDate(from),
      dateTo: toDisplayDate(to),
    };
  }

  withDateFrom(date: string): this {
    this.data.dateFrom = date;
    return this;
  }

  withDateTo(date: string): this {
    this.data.dateTo = date;
    return this;
  }

  withVisitPurpose(purpose: string): this {
    this.data.visitPurpose = purpose;
    return this;
  }

  /** Generate a random visit purpose sentence using faker. */
  withRandomVisitPurpose(): this {
    this.data.visitPurpose = faker.lorem.sentence();
    return this;
  }

  build(): VisitFormData {
    return { ...this.data };
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * VisitFormFactory — static factory for "Записать пациента" modal test data.
 *
 * Usage:
 *   // Minimal (today + 30-day window, no purpose):
 *   const form = VisitFormFactory.createDefault();
 *
 *   // With reproducible seed:
 *   const form = VisitFormFactory.createDefault(42);
 *
 *   // Fluent customization:
 *   const form = VisitFormFactory.builder()
 *     .withDateFrom('15.03.2026')
 *     .withRandomVisitPurpose()
 *     .build();
 */
export class VisitFormFactory {
  static createDefault(seed?: number): VisitFormData {
    return new VisitFormBuilder(seed).build();
  }

  static builder(seed?: number): VisitFormBuilder {
    return new VisitFormBuilder(seed);
  }
}
