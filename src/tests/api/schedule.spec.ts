import { test, expect } from '@playwright/test';
import { ScheduleService } from '../../lib/api/services/schedule.service';
import { ShiftDTO } from '../../lib/entities/schedule.types';
import { getConfig } from '@/config/env-loader';

test.describe('Schedule Service', () => {
  test('should create a shift like the browser', async ({ request }) => {
    const scheduleService = new ScheduleService(request);
    const config = getConfig();

    // 1. Даты: Берем следующую неделю целиком
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7)); // Ближайший понедельник
    
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6); // +6 дней = Воскресенье

    // Функция форматирования в YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const cabinetId = 225; // ID кабинета
    
    // Шаблон рабочего дня
    const workDayTemplate = {
      startTime: "11:05",
      endTime: "12:07",
      companyBranchCabinetId: cabinetId,
      role: "doctor"
    };

    // Генерируем структуру на всю неделю
    const weekSchedule = {
      days: [
        { title: "monday", workTimes: [workDayTemplate] },
        { title: "tuesday", workTimes: [workDayTemplate] },
        { title: "wednesday", workTimes: [workDayTemplate] },
        { title: "thursday", workTimes: [workDayTemplate] },
        { title: "friday", workTimes: [workDayTemplate] },
        { title: "saturday", workTimes: [] }, // Выходной
        { title: "sunday", workTimes: [] }    // Выходной
      ]
    };

    // 3. Собираем Payload
    const payload: ShiftDTO = {
      employeeBranchId: 218, // Твой ID из лога
      companyBranchId: null, // Как в логе
      
      dateFrom: formatDate(nextMonday),
      dateTo: formatDate(nextSunday),
      
      dataJson: JSON.stringify(weekSchedule),
  
    };

    console.log('Sending Payload:', JSON.stringify(payload, null, 2));

    // 4. Отправка
    const createdShift = await scheduleService.createShift(payload);

    expect(createdShift).toBeDefined();
   
    console.log(`✅ Расписание успешно отправлено на сервер!`);
  });
});

  // test('should reject shift with dateTo before dateFrom', async ({ request }) => {
  //   const scheduleService = new ScheduleService(request);

  //   const targetDate = new Date();
  //   targetDate.setDate(targetDate.getDate() + 5);
  //   targetDate.setHours(9, 0, 0, 0);

  //   const endTime = new Date(targetDate);
  //   endTime.setHours(17, 0, 0, 0);

  //   const yesterday = new Date(targetDate);
  //   yesterday.setDate(yesterday.getDate() - 1);
  //   yesterday.setHours(9, 0, 0, 0);

  //   const payload: ShiftDTO = {
  //     employeeBranchId: 329, // ID Доктора
  //     dateFrom: targetDate.toISOString(),
  //     dateTo: yesterday.toISOString(), // Invalid: end before start
  //     companyBranchId: 242, // ID Филиала
  //   };

  //   try {
  //     await scheduleService.createShift(payload);
  //     throw new Error('Expected validation to fail');
  //   } catch (error) {
  //     if (error instanceof Error && error.message.includes('dateTo must be after dateFrom')) {
  //       console.log('Validation correctly rejected invalid dates');
  //     } else {
  //       throw error;
  //     }
  //   }
  // });
//});
