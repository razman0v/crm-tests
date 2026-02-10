import { test, expect } from '@playwright/test';
import { BranchService } from '../../lib/api/services/branch.service';

test.describe('Branch Service', () => {
  test('should create a new branch and retrieve its cabinet', async ({ request }) => {
    const branchService = new BranchService(request);

    // Create branch (automatically fetches full details including cabinets)
    const newBranch = await branchService.create('Playwright Test Branch');

    // Verify branch was created
    expect(newBranch.id).toBeDefined();
    expect(newBranch.title).toBe('Playwright Test Branch');
    console.log('✅ Branch ID:', newBranch.id);

    // Verify cabinets exist
    expect(newBranch.companyBranchCabinets).toBeDefined();
    expect(newBranch.companyBranchCabinets?.length).toBeGreaterThan(0);
    
    const cabinet = newBranch.companyBranchCabinets?.[0];
    expect(cabinet?.id).toBeDefined();
    console.log('✅ Cabinet ID:', cabinet?.id);
    console.log('✅ Cabinet Title:', cabinet?.title);
  });
});