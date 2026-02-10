import { BaseService } from './base.service';
import { EmployeePayload, EmployeeResponse, EmployeeWithBranchId, CompanyEmployeeBranch } from '../../entities/employee.types';
import { faker } from '@faker-js/faker';

export class EmployeeService extends BaseService {
  
  // Helper: Calculate SNILS checksum (per Project.md spec)
  private calculateSnilsChecksum(snilsBase: string): string {
    const digits = snilsBase.split('').map(Number);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    let checksum = sum % 101;
    if (checksum === 100) checksum = 0;
    return snilsBase + String(checksum).padStart(2, '0');
  }

  // Generate valid SNILS
  private generateValidSnils(): string {
    const base = faker.string.numeric(9);
    return this.calculateSnilsChecksum(base);
  }

  async create(branchId: number): Promise<EmployeeWithBranchId> {
    const fakePhone = `+7 (9${faker.string.numeric(2)}) ${faker.string.numeric(3)}-${faker.string.numeric(2)} ${faker.string.numeric(2)}`;
    const validSnils = this.generateValidSnils();
    const email = faker.internet.email();

    const payload: EmployeePayload = {
      contacts: [],
      companyEmployeeBranches: [
        {
          isArchive: false,
          companyBranchId: branchId,
          isShowInDoctors: true,
          isShowInAssistants: null
        }
      ],
      glossaryJobPositionIds: [1],
      glossaryMedicalJobPositionIds: [562],
      glossarySpecializationIds: [148],
      isMedicalStaff: true,
      user: {
        surname: faker.person.lastName(),
        name: faker.person.firstName(),
        phone: fakePhone,
        email: email,
        glossaryGenderId: 2,
        snils: validSnils
      }
    };

    const headers = await this.getHeaders();
    const response = await this.request.post('/api/v1/company/employees', {
      data: payload,
      headers
    });

    if (!response.ok()) {
      await this.handleResponseError(response, 'Employee creation');
    }

    const created = await response.json() as EmployeeResponse;
    console.log(`✅ Doctor Created: ID ${created.id}`);

    // Fetch full details to ensure all branches are populated
    const fullEmployee = await this.getById(created.id);
    
    // Find the employeeBranchId from the linked branch
    const linkedBranch = fullEmployee.companyEmployeeBranches.find(
      (b: CompanyEmployeeBranch) => b.companyBranchId === branchId
    );
    
    if (!linkedBranch?.id) {
      throw new Error(
        `Failed to link employee ${fullEmployee.id} to branch ${branchId}. ` +
        `Available branches: ${fullEmployee.companyEmployeeBranches.map(b => b.id).join(', ')}`
      );
    }

    return {
      ...fullEmployee,
      employeeBranchId: linkedBranch.id
    };
  }

  async getById(id: number): Promise<EmployeeResponse> {
    const headers = await this.getHeaders();
    const response = await this.request.get(`/api/v1/company/employees/${id}`, {
      headers
    });

    if (!response.ok()) {
      await this.handleResponseError(response, `Employee retrieval (ID: ${id})`);
    }

    return await response.json() as EmployeeResponse;
  }
}