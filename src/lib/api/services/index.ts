/**
 * API Services Barrel Export
 * Consolidates all service class exports for clean imports
 *
 * Usage:
 * ✅ import { PatientService, VisitService, BranchService } from '@/lib/api/services'
 * ❌ import { PatientService } from '@/lib/api/services/patients.service'
 * ❌ import { VisitService } from '@/lib/api/services/visit.service'
 */

export { BaseService } from './base.service';
export { PatientsService } from './patients.service';
export { VisitService } from './visit.service';
export { ScheduleService } from './schedule.service';
export { BranchService } from './branch.service';
export { EmployeeService } from './employee.service';
export { GlossaryService } from './glossary.service';
