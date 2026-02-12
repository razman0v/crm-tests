import { z } from 'zod';

export const VisitSchema = z.object({
  patientId: z.number().int().positive('Patient ID must be a positive integer'),
  doctorId: z.number().int().positive('Doctor ID must be a positive integer'),
  shiftTime: z.string().datetime('Shift time must be a valid ISO 8601 datetime'),
  notes: z.string().optional(),
  duration: z.number().default(60), // Default duration in minutes
  status: z.enum(['PLANNED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional()
});

export type VisitDTO = z.infer<typeof VisitSchema>;

export interface VisitResponse {
  id: number;
  patientId: number;
  doctorId: number;
  shiftTime: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
