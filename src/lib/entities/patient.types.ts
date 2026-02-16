/**
 * PatientPayload: Full patient record schema for API POST /api/v1/patients
 * 
 * Required fields per Project.md §4.3:
 * - user.snils: 11-digit string with Modulo 101 checksum
 * - policyOmsNumber: 16-digit OMS policy identifier
 * - passport: document details (series, number)
 */
export interface PatientPayload {
  user: {
    glossaryGenderId: number; // 1=male, 2=female
    surname: string;
    name: string;
    patronymic: string | null;
    birthday: string; // YYYY-MM-DD format
    phone: string; // +7 formatted
    snils: string; // 11 digits with checksum
  };
  policyOmsNumber: string; // exactly 16 digits
  passport: {
    series: string; // 2-4 characters
    number: string; // 6 digits
  };
  comment: string | null;
}

export interface PatientResponse {
  id: number;
  user: {
    name: string;
    surname: string;
    // ... остальные поля, которые возвращает сервер
  };
}