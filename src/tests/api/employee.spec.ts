import { test, expect } from '@playwright/test';
import { EmployeeService } from '../../lib/api/services/employee.service';
import { BranchService } from '../../lib/api/services/branch.service';
import { faker } from '@faker-js/faker';

test.describe('Employee Service', () => {
  
  test('should create a new doctor linked to a branch', async ({ request }) => {
    const employeeService = new EmployeeService(request);
    const branchService = new BranchService(request);

    const branchName = `${faker.location.city()} Clinic`;
    const newBranch = await branchService.create(branchName);
    const branchId = newBranch.id;

    console.log(`Using Branch ID: ${branchId}`);

    // --- Create Doctor ---
    const newDoctor = await employeeService.create(branchId);

    // --- Verify ---
    expect(newDoctor.id).toBeDefined();
    expect(newDoctor.user.name).toBeDefined();

    // Verify the link exists
    const linkToBranch = newDoctor.companyEmployeeBranches?.find(
        b => b.companyBranchId === branchId
    );
    
    expect(linkToBranch).toBeDefined();
    console.log(`✅ Verified: Doctor ${newDoctor.id} is linked to Branch ${branchId}`);
  });
});