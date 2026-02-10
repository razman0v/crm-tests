import { test, expect } from '@playwright/test';
import { ScheduleService } from '../../lib/api/services/schedule.service';
import { ShiftDTO } from '../../lib/entities/schedule.types';

test.describe('Schedule Service', () => {
  test('should create a shift like the browser', async ({ request }) => {
    const scheduleService = new ScheduleService(request);

    // --- 1. CONFIGURATION (Matches your Payload exactly) ---
    const employeeBranchId = 231;        // The Doctor
    const companyBranchCabinetId = 251;  // The Room
    const startTime = "10:01";
    const endTime = "18:15";

    // --- 2. DYNAMIC DATES (So test works every week) ---
    // Calculate next Monday and next Sunday dynamically
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7)); 
    
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6); 

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // --- 3. BUILD INNER JSON (dataJson) ---
    // This matches the structure inside your "dataJson" string
    const workTimes = [
      {
        startTime: startTime,
        endTime: endTime,
        companyBranchCabinetId: companyBranchCabinetId,
        role: "doctor"
      }
    ];

    const weekSchedule = {
      days: [
        { title: "monday", workTimes: workTimes },
        { title: "tuesday", workTimes: workTimes },
        { title: "wednesday", workTimes: workTimes },
        { title: "thursday", workTimes: workTimes },
        { title: "friday", workTimes: workTimes },
        { title: "saturday", workTimes: [] },
        { title: "sunday", workTimes: [] }
      ]
    };

    // --- 4. BUILD FINAL PAYLOAD ---
    const payload: ShiftDTO = {
      employeeBranchId: employeeBranchId,
      companyBranchId: null,
      dateFrom: formatDate(nextMonday),
      dateTo: formatDate(nextSunday),
      dataJson: JSON.stringify(weekSchedule),
    };

    console.log(`🚀 Sending Payload for employeeBranchId: ${employeeBranchId}`);

    // --- 5. EXECUTE & VERIFY ---
    const createdShift = await scheduleService.createShift(payload);
    
    expect(createdShift).toBeDefined();
    
    console.log(`✅ Shift successfully created!`);
    console.log(`   Dates: ${payload.dateFrom} to ${payload.dateTo}`);
    console.log(`   Doctor: ${payload.employeeBranchId}`);
    console.log(`   Cabinet: ${companyBranchCabinetId}`);
  });
});
