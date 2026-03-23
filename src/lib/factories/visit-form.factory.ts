import { fakerRU as faker } from '@faker-js/faker';
import { VisitDTO } from '../entities/visit.types';

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

/**
 * Runtime identifiers and temporal data required by the visit creation API.
 * Obtain IDs from branchService / employeeService / patientService responses.
 */
export interface VisitApiParams {
  // ─── Required identifiers ──────────────────────────────────────────────
  patientId: number;
  /** employeeBranchId (the branch-link ID, used as doctorId in the API) */
  doctorId: number;
  companyBranchId: number;
  companyBranchCabinetId: number;
  /** Raw company-employee ID (doctor.id from EmployeeResponse) */
  companyEmployeeId: number;

  // ─── Temporal (auto-generated when omitted) ────────────────────────────
  /** ISO 8601 datetime; defaults to now */
  shiftTime?: string;
  /** YYYY-MM-DD; derived from shiftTime when omitted */
  date?: string;
  /** Visit start time in HH:mm; defaults to '09:00' */
  fromTime?: string;
  /** Visit end time in HH:mm; defaults to '10:00' */
  toTime?: string;
  duration?: number;
  status?: 'PLANNED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

  // ─── Health plan (pass null when the patient has no plan yet) ──────────
  healthPlanId?: number | null;
  healthPlanName?: string | null;
  healthPlanStepId?: number | null;
  healthPlanStepName?: string | null;

  // ─── Glossary / Nomenclature ───────────────────────────────────────────
  glossarySpecializationId?: number | null;
  glossaryJobPositionId?: number | null;
  healthPlanNomenclatureIds?: number[];
  stockNomenclatureIds?: number[];

  // ─── Golden Payload fields ─────────────────────────────────────────────
  /** Desired start date in YYYY-MM-DD; defaults to today */
  wishStartDate?: string;
  /** Desired end date in YYYY-MM-DD; defaults to +30 days */
  wishEndDate?: string;
  wishFromTime?: string | null;
  wishToTime?: string | null;
  /** Booking mode: 'doctor' or 'specialization'; defaults to 'doctor' */
  doctorOrSpecialization?: string;
  /** Visit type key, e.g. 'primary'; defaults to 'primary' */
  type?: string;
  comment?: string | null;
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
 * VisitFormFactory — factory for visit-related test data.
 *
 * ### Modal form data (UI tests)
 *   const form = VisitFormFactory.createDefault();
 *   const form = VisitFormFactory.builder().withDateFrom('15.03.2026').build();
 *
 * ### API payload (hybrid / API tests)
 *   const payload = VisitFormFactory.create({
 *     patientId: patient.id,
 *     doctorId: doctor.employeeBranchId,
 *     companyBranchId: branch.id,
 *     companyBranchCabinetId: cabinetId,
 *     companyEmployeeId: doctor.id,
 *     shiftTime: now.toISOString(),
 *     glossarySpecializationId: 148,
 *     glossaryJobPositionId: 1,
 *   });
 *   const visit = await visitService.create(payload);
 */
export class VisitFormFactory {
  /** Produce a VisitDTO ready to be sent to POST /api/v1/health/visits. */
  static create(params: VisitApiParams): VisitDTO {
    if (!params.stockNomenclatureIds || params.stockNomenclatureIds.length === 0) {
      throw new Error(
        '[VisitFormFactory] stockNomenclatureIds is required and must not be empty. ' +
        'Discover a valid service ID via NomenclatureService.getFirstActive(patientId) and pass it in params.',
      );
    }

    const shiftTime = params.shiftTime ?? new Date().toISOString();
    const date = params.date ?? shiftTime.split('T')[0];
    const wishStartDate = params.wishStartDate ?? date;
    const wishEndDate =
      params.wishEndDate ??
      new Date(new Date(date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return {
      patientId: params.patientId,
      doctorId: params.doctorId,
      companyEmployeeId: params.companyEmployeeId,
      companyBranchId: params.companyBranchId,
      companyBranchCabinetId: params.companyBranchCabinetId,
      shiftTime,
      date,
      fromTime: params.fromTime ?? '09:00',
      toTime: params.toTime ?? '10:00',
      duration: params.duration ?? 60,
      status: params.status ?? 'PLANNED',
      healthPlanId: params.healthPlanId ?? null,
      healthPlanName:
        params.healthPlanName ?? `План лечения от ${toDisplayDate(new Date(date))}`,
      healthPlanStepId: params.healthPlanStepId ?? null,
      healthPlanStepName: params.healthPlanStepName ?? 'Первичный этап',
      glossarySpecializationId: params.glossarySpecializationId ?? null,
      glossaryJobPositionId: params.glossaryJobPositionId ?? null,
      healthPlanNomenclatureIds: params.healthPlanNomenclatureIds ?? [],
      stockNomenclatureIds: params.stockNomenclatureIds,
      wishStartDate,
      wishEndDate,
      wishFromTime: params.wishFromTime ?? null,
      wishToTime: params.wishToTime ?? null,
      doctorOrSpecialization: params.doctorOrSpecialization ?? 'doctor',
      type: params.type ?? 'primary',
      comment: params.comment ?? null,
    };
  }

  static createDefault(seed?: number): VisitFormData {
    return new VisitFormBuilder(seed).build();
  }

  static builder(seed?: number): VisitFormBuilder {
    return new VisitFormBuilder(seed);
  }
}
