// import { z } from 'zod';

// export const ShiftSchema = z.object({
//   employeeBranchId: z.number().optional(),
//   companyBranchId: z.number().nullable().optional(),
//   equipmentId: z.number().optional(),
//   dataJson: z.string().optional().or(z.null()),
//   workDaysCount: z.union([z.number(), z.string()]).optional(),
//   dateFrom: z.string().datetime('Must be ISO 8601 datetime string'),
//   dateTo: z.string().datetime('Must be ISO 8601 datetime string'),

// }).refine(
//   (data) => {
//     const from = new Date(data.dateFrom);
//     const to = new Date(data.dateTo);
//     return to > from;
//   },
//   {
//     message: 'dateTo must be after dateFrom',
//     path: ['dateTo'],
//   }
// );

// export type ShiftDTO = z.infer<typeof ShiftSchema>;

// export interface ShiftResponse {
//   id: number;
//   employeeBranchId: number;
//   dateFrom: string;
//   dateTo: string;
//   //companyBranchId: number;
//   dataJson?: string | null;
//   createdAt?: string;
//   updatedAt?: string;
// }
import { z } from 'zod';

export const ShiftSchema = z.object({
  employeeBranchId: z.number().optional(),
  companyBranchId: z.number().nullable().optional(), 
  
  // ⚠️ ИСПРАВЛЕНИЕ: Убираем .datetime(), так как сервер принимает "2026-02-09"
  dateFrom: z.string(), 
  dateTo: z.string(),
  
  dataJson: z.string(),
  
  // Разрешаем и число, и строку, и undefined
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