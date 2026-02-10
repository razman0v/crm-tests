export interface EmployeePayload {
  contacts: any[];
  companyEmployeeBranches: {
    isArchive: boolean;
    companyBranchId: number;
    isShowInDoctors: boolean;
    isShowInAssistants: boolean | null;
  }[];
  glossaryJobPositionIds: number[];
  glossaryMedicalJobPositionIds: number[];
  glossarySpecializationIds: number[];
  isMedicalStaff: boolean;
  user: {
    surname: string;
    name: string;
    phone: string;
    email: string;
    glossaryGenderId: number;
    snils: string;
  };
}

export interface CompanyEmployeeBranch {
  id: number; // 👈 This is the employeeBranchId needed for scheduling
  companyBranchId: number;
  isArchive: boolean;
  isShowInDoctors: boolean;
}

export interface EmployeeResponse {
  id: number;
  user: {
    name: string;
    surname: string;
    phone: string;
    email: string;
  };
  companyEmployeeBranches: CompanyEmployeeBranch[];
}

export interface EmployeeWithBranchId extends EmployeeResponse {
  employeeBranchId: number; // 👈 Convenience property for faster access
}