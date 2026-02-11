import { test, expect } from '@playwright/test';
import { BranchService } from '../../lib/api/services/branch.service';
import { EmployeeService } from '../../lib/api/services/employee.service';
import { ScheduleService } from '../../lib/api/services/schedule.service';
import { ShiftFactory } from '../../lib/fixtures/shift.factory';
import { faker } from '@faker-js/faker';

test.describe('Schedule Service - Create Shift', () => {
  
  test('should create a simple single-day shift with default work hours', async ({ request }) => {
    // Setup: Create Branch with Cabinet
    const branchService = new BranchService(request);
    const branchName = `${faker.location.city()} Clinic`;
    const newBranch = await branchService.create(branchName);
    
    const cabinetId = newBranch.companyBranchCabinets?.[0]?.id;
    if (!cabinetId) throw new Error("Created branch has no cabinets, cannot schedule shift");
    console.log(`✅ Branch ${newBranch.id} created with Cabinet ID: ${cabinetId}`);

    // Setup: Create Doctor
    const employeeService = new EmployeeService(request);
    const newEmployee = await employeeService.create(newBranch.id);
    const employeeBranchId = newEmployee.employeeBranchId;
    console.log(`✅ Doctor created with employeeBranchId: ${employeeBranchId}`);

    // Calculate tomorrow's date for the shift
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Create shift using convenience method (abstracts payload construction)
    const scheduleService = new ScheduleService(request);
    const response = await scheduleService.createSimpleShift(
      employeeBranchId,
      cabinetId,
      dateStr
    );

    // Verify response
    expect(response).toBeDefined();
    expect(response.dateFrom).toContain(dateStr);
    expect(typeof response.id).toBe('number');
    
    console.log(`✅ Shift successfully created! (ID: ${response.id})`);
  });

  test('should create a multi-day shift', async ({ request }) => {
    // Setup: Branch and Cabinet
    const branchService = new BranchService(request);
    const newBranch = await branchService.create(`${faker.location.city()} Clinic`);
    const cabinetId = newBranch.companyBranchCabinets?.[0]?.id;
    if (!cabinetId) throw new Error("No cabinet available");

    // Setup: Employee
    const employeeService = new EmployeeService(request);
    const newEmployee = await employeeService.create(newBranch.id);
    const employeeBranchId = newEmployee.employeeBranchId;

    // Create 3-day shift (Monday-Wednesday)
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() + (1 - today.getDay() + 7) % 7); // Next Monday
    
    const wednesday = new Date(monday);
    wednesday.setDate(wednesday.getDate() + 2); // Wednesday
    
    const dateFrom = monday.toISOString().split('T')[0];
    const dateTo = wednesday.toISOString().split('T')[0];

    // Use factory for custom multi-day configuration
    const payload = ShiftFactory.createCustomShift(
      employeeBranchId,
      cabinetId,
      dateFrom,
      dateTo,
      [
        { day: 'monday', workTimes: [{ startTime: '09:00', endTime: '17:00', role: 'doctor' }] },
        { day: 'tuesday', workTimes: [{ startTime: '10:00', endTime: '18:00', role: 'doctor' }] },
        { day: 'wednesday', workTimes: [{ startTime: '09:00', endTime: '17:00', role: 'doctor' }] },
      ]
    );

    const scheduleService = new ScheduleService(request);
    const response = await scheduleService.createShift(payload);

    expect(response).toBeDefined();
    expect(response.dateFrom).toContain(dateFrom);
    expect(response.dateTo).toContain(dateTo);
    console.log(`✅ Multi-day shift created! (${dateFrom} to ${dateTo})`);
  });

  test('should handle shift validation errors gracefully', async ({ request }) => {
    const scheduleService = new ScheduleService(request);
    
    // Invalid payload: missing employeeBranchId (required field)
    const invalidPayload = {
      companyBranchId: null,
      dateFrom: '2026-02-12',
      dateTo: '2026-02-12',
      dataJson: '{"days": []}',
    } as any;

    // Should throw validation error
    await expect(scheduleService.createShift(invalidPayload)).rejects.toThrow(/Invalid shift payload/);
  });
});
