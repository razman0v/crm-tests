export interface BranchPayload {
  companyId: null;
  title: string;
  glossaryCityId: number;
  glossarySpecializationIds: number[];
  contacts: any[];
  companyBranchCabinets: {
    title: string;
    isActive: boolean;
    isStock: boolean;
  }[];
}

export interface BranchCabinet {
  id: number;
  title: string;
  isActive: boolean;
  isStock: boolean;
}

export interface BranchResponse {
  id: number;
  title: string;
  companyId: number;
  companyBranchCabinets?: BranchCabinet[];
}