export const DEADLINE_DAYS = 20;

const CZECH_FIXED_HOLIDAYS = [
  [0, 1],
  [4, 1],
  [4, 8],
  [6, 5],
  [6, 6],
  [8, 28],
  [9, 28],
  [10, 17],
  [11, 24],
  [11, 25],
  [11, 26],
] as const;

const holidayCache = new Map<number, Set<string>>();

export function toLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function addCalendarDays(date: Date, days: number) {
  const result = toLocalDate(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getEasterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month, day);
}

function getCzechHolidayKeys(year: number) {
  const cached = holidayCache.get(year);
  if (cached) {
    return cached;
  }

  const easterSunday = getEasterSunday(year);
  const goodFriday = new Date(easterSunday);
  goodFriday.setDate(goodFriday.getDate() - 2);
  const easterMonday = new Date(easterSunday);
  easterMonday.setDate(easterMonday.getDate() + 1);

  const holidays = new Set([
    `${year}-01-01`,
    ...CZECH_FIXED_HOLIDAYS.map(([month, day]) =>
      `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    ),
    formatDateKey(goodFriday),
    formatDateKey(easterMonday),
  ]);

  holidayCache.set(year, holidays);
  return holidays;
}

export function isPublicHoliday(date: Date) {
  return getCzechHolidayKeys(date.getFullYear()).has(formatDateKey(date));
}

export function isWeekend(targetDate: Date) {
  const day = targetDate.getDay();
  return day === 0 || day === 6;
}

export function isWorkingDay(targetDate: Date) {
  return !isWeekend(targetDate) && !isPublicHoliday(targetDate);
}

export function getNextWorkingDate(targetDate: Date) {
  const result = toLocalDate(targetDate);

  while (!isWorkingDay(result)) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

export function addWorkingDays(date: Date, workingDays: number) {
  const result = toLocalDate(date);
  const direction = workingDays >= 0 ? 1 : -1;
  let remaining = Math.abs(workingDays);

  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    if (isWorkingDay(result)) {
      remaining -= 1;
    }
  }

  return result;
}

export function countWorkingDaysBetween(startDate: Date, endDate: Date) {
  const start = toLocalDate(startDate);
  const end = toLocalDate(endDate);

  if (start.getTime() === end.getTime()) {
    return 0;
  }

  const direction = start < end ? 1 : -1;
  const cursor = new Date(start);
  let count = 0;

  while (direction > 0 ? cursor < end : cursor > end) {
    cursor.setDate(cursor.getDate() + direction);
    if (isWorkingDay(cursor)) {
      count += direction;
    }
  }

  return count;
}

export function calculateOutageDeadline(today: Date) {
  return {
    deadlineDate: addWorkingDays(today, DEADLINE_DAYS),
  };
}
