import { test, expect } from '@playwright/test';
import { BranchService } from '../../lib/api/services/branch.service';
import { EmployeeService } from '../../lib/api/services/employee.service';
import { ScheduleService } from '../../lib/api/services/schedule.service';
import { ShiftDTO } from '../../lib/entities/schedule.types';
import { faker } from '@faker-js/faker';

test.describe('Schedule Service - Create Shift', () => {
  
  test('should create a shift for an employee', async ({ request }) => {
    // 1. Setup Branch
    const branchService = new BranchService(request);
    const branchName = `${faker.location.city()} Clinic`;
    const newBranch = await branchService.create(branchName);
    
    // We need a valid Cabinet ID for the schedule
    const cabinetId = newBranch.companyBranchCabinets?.[0]?.id;
    if (!cabinetId) throw new Error("Created branch has no cabinets, cannot schedule shift");
    console.log(`✅ Branch ${newBranch.id} created with Cabinet ID: ${cabinetId}`);

    // 2. Setup Doctor
    const employeeService = new EmployeeService(request);
    const newEmployee = await employeeService.create(newBranch.id);
    const employeeBranchId = newEmployee.employeeBranchId;
    console.log(`✅ Doctor created with employeeBranchId: ${employeeBranchId}`);

    // 3. Prepare Dates (YYYY-MM-DD)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0]; // "2026-02-12"

    // 4. Construct complex dataJson
    // The API expects a full week structure. We populate only the target day.
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const targetDayName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const daysArray = weekDays.map(day => {
      const isTargetDay = day === targetDayName;
      return {
        title: day,
        workTimes: isTargetDay ? [
          {
            startTime: "09:00",
            endTime: "17:00",
            companyBranchCabinetId: cabinetId,
            role: "doctor"
          }
        ] : [] // Empty for other days
      };
    });

    const dataJsonObj = { days: daysArray };

    // 5. Assemble Payload (Matching "Ground Truth")
    const payload: ShiftDTO = {
      dateFrom: dateStr,
      dateTo: dateStr, // Single day shift
      employeeBranchId: employeeBranchId,
      companyBranchId: null, // Explicitly null
      dataJson: JSON.stringify(dataJsonObj),
      // workDaysCount removed (not present in valid manual payload)
    };

    console.log(`Test: Sending Payload for ${dateStr}...`);

    // 6. Execute
    const scheduleService = new ScheduleService(request);
    const response = await scheduleService.createShift(payload);

    // 7. Verify
    expect(response).toBeDefined();
    // API response often returns date with time 00:00:00, so we check inclusion
    expect(response.dateFrom).toContain(dateStr);
    
    console.log(`✅ Shift successfully created! (ID: ${response.id || 'N/A'})`);
  });
});