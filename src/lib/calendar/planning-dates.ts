import {
  compareDateKeys,
  dateKeyDiffInDays,
  dateKeyFromDateLike,
  dateKeyInRange,
  isDateKey,
  isValidDateKeyLocal,
  todayDateKey,
  tripDurationFromDateKeys,
} from "@/lib/dates/date-key";
import {
  digidatesCalendarProvider,
  type CalendarMathProvider,
} from "@/lib/calendar/digidates";

export interface PlanningDateService {
  validateDate(dateKey: string): Promise<boolean>;
  daysUntil(dateKey: string): Promise<number>;
  weekday(dateKey: string): Promise<number>;
  weekNumber(dateKey: string): Promise<number>;
  isLeapYear(year: number): Promise<boolean>;
  assertValidDate(dateKey: string, label: string): Promise<void>;
}

export const planningDateService: PlanningDateService = createPlanningDateService(
  digidatesCalendarProvider
);

export function createPlanningDateService(provider: CalendarMathProvider): PlanningDateService {
  return {
    validateDate(dateKey) {
      return provider.validateDate(dateKey);
    },
    daysUntil(dateKey) {
      return provider.daysUntil(dateKey);
    },
    weekday(dateKey) {
      return provider.weekday(dateKey);
    },
    weekNumber(dateKey) {
      return provider.weekNumber(dateKey);
    },
    isLeapYear(year) {
      return provider.isLeapYear(year);
    },
    async assertValidDate(dateKey, label) {
      if (!isDateKey(dateKey) || !isValidDateKeyLocal(dateKey) || !(await provider.validateDate(dateKey))) {
        throw new Error(`${label} is not a valid date`);
      }
    },
  };
}

export function normalizePlanningDateKey(value: Date | string | null | undefined): string | null {
  return dateKeyFromDateLike(value);
}

export async function parsePlanningDateInput(
  value: string | null | undefined,
  label: string
): Promise<Date | undefined> {
  if (!value) return undefined;
  const dateKey = normalizePlanningDateKey(value);
  if (!dateKey) {
    throw new Error(`${label} is not a valid date`);
  }

  await planningDateService.assertValidDate(dateKey, label);
  return new Date(dateKey);
}

export async function assertDateOrder(
  startDateKey: string | null | undefined,
  endDateKey: string | null | undefined
): Promise<void> {
  if (!startDateKey || !endDateKey) return;
  await planningDateService.assertValidDate(startDateKey, "Start date");
  await planningDateService.assertValidDate(endDateKey, "End date");
  if (compareDateKeys(startDateKey, endDateKey) > 0) {
    throw new Error("End date must be after the start date");
  }
}

export async function daysUntilPlanningDate(
  value: Date | string | null | undefined
): Promise<number | null> {
  const dateKey = normalizePlanningDateKey(value);
  if (!dateKey) return null;
  await planningDateService.assertValidDate(dateKey, "Date");
  return planningDateService.daysUntil(dateKey);
}

export function tripDurationFromPlanningDates(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): number | null {
  return tripDurationFromDateKeys(normalizePlanningDateKey(start), normalizePlanningDateKey(end));
}

export function comparePlanningDates(
  a: Date | string | null | undefined,
  b: Date | string | null | undefined
): number | null {
  const left = normalizePlanningDateKey(a);
  const right = normalizePlanningDateKey(b);
  if (!left || !right) return null;
  return compareDateKeys(left, right);
}

export function isPlanningDateInRange(
  value: Date | string | null | undefined,
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): boolean {
  const dateKey = normalizePlanningDateKey(value);
  const startDateKey = normalizePlanningDateKey(start);
  const endDateKey = normalizePlanningDateKey(end);
  if (!dateKey || !startDateKey || !endDateKey) return false;
  return dateKeyInRange(dateKey, startDateKey, endDateKey);
}

export function todayPlanningDateKey(now = new Date()): string {
  return todayDateKey(now);
}

export function planningDateDiffInDays(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): number | null {
  const startDateKey = normalizePlanningDateKey(start);
  const endDateKey = normalizePlanningDateKey(end);
  if (!startDateKey || !endDateKey) return null;
  return dateKeyDiffInDays(startDateKey, endDateKey);
}
