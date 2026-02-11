import { z } from 'zod';

export const ShiftSchema = z.object({
  employeeBranchId: z.number(), // Required - shifts must have an employee
  companyBranchId: z.number().nullable().optional(), 
  dateFrom: z.string(), 
  dateTo: z.string(),
  dataJson: z.string(),
  workDaysCount: z.union([z.number(), z.string()]).optional(),
});

export type ShiftDTO = z.infer<typeof ShiftSchema>;

export interface ShiftResponse {
  id: number;
  employeeBranchId?: number;
  dateFrom: string;
  dateTo: string;
  dataJson?: string | null;
  createdAt?: string;
  updatedAt?: string;
}