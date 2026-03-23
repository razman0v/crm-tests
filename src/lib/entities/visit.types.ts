import { z } from 'zod';

export const VisitSchema = z.object({
  // ─── Core identifiers ────────────────────────────────────────────────────
  patientId: z.number().int().positive('Patient ID must be a positive integer'),
  doctorId: z.number().int().positive('Doctor ID must be a positive integer'),
  /** Raw company-employee ID (not the branch-link ID) */
  companyEmployeeId: z.number().int().positive().optional(),
  companyBranchId: z.number().int().positive().optional(),
  companyBranchCabinetId: z.number().int().positive().optional(),

  // ─── Temporal ────────────────────────────────────────────────────────────
  shiftTime: z.string().datetime('Shift time must be a valid ISO 8601 datetime'),
  /** Visit date in YYYY-MM-DD format */
  date: z.string().optional(),
  /** Visit start time in HH:mm format */
  fromTime: z.string().optional(),
  /** Visit end time in HH:mm format */
  toTime: z.string().optional(),
  notes: z.string().optional(),
  duration: z.number().default(60),
  status: z.enum(['PLANNED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),

  // ─── Health plan ─────────────────────────────────────────────────────────
  healthPlanId: z.number().nullable().optional(),
  healthPlanName: z.string().nullable().optional(),
  healthPlanStepId: z.number().nullable().optional(),
  healthPlanStepName: z.string().nullable().optional(),

  // ─── Glossary / Nomenclature ─────────────────────────────────────────────
  glossarySpecializationId: z.number().nullable().optional(),
  glossaryJobPositionId: z.number().nullable().optional(),
  healthPlanNomenclatureIds: z.array(z.number()).optional(),
  stockNomenclatureIds: z.array(z.number()).optional(),

  // ─── Golden Payload fields ───────────────────────────────────────────────
  /** Desired start date in YYYY-MM-DD format */
  wishStartDate: z.string().optional(),
  /** Desired end date in YYYY-MM-DD format */
  wishEndDate: z.string().optional(),
  wishFromTime: z.string().nullable().optional(),
  wishToTime: z.string().nullable().optional(),
  /** Booking mode: 'doctor' or 'specialization' */
  doctorOrSpecialization: z.string().optional(),
  /** Visit type: 'primary', 'secondary', etc. */
  type: z.string().optional(),
  comment: z.string().nullable().optional(),
});

export type VisitDTO = z.infer<typeof VisitSchema>;

export interface VisitResponse {
  id: number;
  patientId: number;
  doctorId: number;
  shiftTime: string;
  notes?: string;
  duration: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}
