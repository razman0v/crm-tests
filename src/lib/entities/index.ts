/**
 * Entity Type Definitions Barrel Export
 * Consolidates all data model type definitions for clean imports
 *
 * Usage:
 * ✅ import { PatientPayload, PatientResponse, VisitStatus } from '@/lib/entities'
 * ❌ import { PatientPayload } from '@/lib/entities/patient.types'
 * ❌ import { VisitStatus } from '@/lib/entities/visit.types'
 */

export * from './patient.types';
export * from './branch.types';
export * from './employee.types';
export * from './schedule.types';
export * from './visit.types';
