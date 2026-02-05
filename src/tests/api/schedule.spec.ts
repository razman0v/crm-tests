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
