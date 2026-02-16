import { BaseService } from './base.service';
import { EmployeePayload, EmployeeResponse, EmployeeWithBranchId, CompanyEmployeeBranch } from '../../entities/employee.types';
import { fakerRU as faker } from '@faker-js/faker';
import { generateValidSnils } from '../../../utils/snils.utils';

export class EmployeeService extends BaseService {

  async create(branchId: number): Promise<EmployeeWithBranchId> {
    const fakePhone = `+7 (9${faker.string.numeric(2)}) ${faker.string.numeric(3)}-${faker.string.numeric(2)} ${faker.string.numeric(2)}`;
    const validSnils = generateValidSnils();
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

    // Construct result with proper type safety
    const result: EmployeeWithBranchId = {
      ...fullEmployee,
      employeeBranchId: linkedBranch.id
    };

    return result;
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