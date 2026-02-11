import { faker } from '@faker-js/faker';
import { ShiftDTO } from '../entities/schedule.types';

export interface WorkTimeConfig {
  startTime: string;
  endTime: string;
  role: string;
}

export interface DayConfigForWeek {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  workTimes: WorkTimeConfig[];
}

/**
 * ShiftFactory provides reusable, configurable shift payload creation.
 * Abstracts the complex dataJson week structure away from tests.
 */
export class ShiftFactory {
  /**
   * Create a simple single-day shift with default work hours (09:00-17:00)
   */
  static createSimpleShift(
    employeeBranchId: number,
    cabinetId: number,
    dateFrom: string,
    dateTo?: string
  ): ShiftDTO {
    const finalDateTo = dateTo || dateFrom; // Single day if dateTo not provided
    const targetDate = new Date(dateFrom);
    const targetDayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as any;

    const dataJsonObj = this.buildWeekStructure([
      {
        day: targetDayName,
        workTimes: [
          {
            startTime: '09:00',
            endTime: '17:00',
            role: 'doctor',
          },
        ],
      },
    ], cabinetId);

    return {
      employeeBranchId,
      companyBranchId: null,
      dateFrom,
      dateTo: finalDateTo,
      dataJson: JSON.stringify(dataJsonObj),
    };
  }

  /**
   * Create a shift with custom work hours per day
   */
  static createCustomShift(
    employeeBranchId: number,
    cabinetId: number,
    dateFrom: string,
    dateTo: string,
    dayConfigs: DayConfigForWeek[]
  ): ShiftDTO {
    const dataJsonObj = this.buildWeekStructure(dayConfigs, cabinetId);

    return {
      employeeBranchId,
      companyBranchId: null,
      dateFrom,
      dateTo,
      dataJson: JSON.stringify(dataJsonObj),
    };
  }

  /**
   * Internal helper: build the week structure with days and work times
   */
  private static buildWeekStructure(
    dayConfigs: DayConfigForWeek[],
    cabinetId: number
  ): { days: any[] } {
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const configMap = new Map(dayConfigs.map(cfg => [cfg.day, cfg.workTimes]));

    const daysArray = weekDays.map(day => ({
      title: day,
      workTimes: (configMap.get(day as any) || []).map(wt => ({
        startTime: wt.startTime,
        endTime: wt.endTime,
        companyBranchCabinetId: cabinetId,
        role: wt.role,
      })),
    }));

    return { days: daysArray };
  }
}
