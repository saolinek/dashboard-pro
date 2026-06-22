import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addWorkingDays,
  calculateOutageDeadline,
  countWorkingDaysBetween,
  getNextWorkingDate,
  isPublicHoliday,
} from './date-utils.ts';

function date(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function assertIsoDate(actual, expected) {
  const actualDate = [
    actual.getFullYear(),
    String(actual.getMonth() + 1).padStart(2, '0'),
    String(actual.getDate()).padStart(2, '0'),
  ].join('-');

  assert.equal(actualDate, expected);
}

test('20 pracovních dnů od pátku zahrne víkendy i svátky', () => {
  const friday = date('2026-06-12');
  const saturday = date('2026-06-13');

  assertIsoDate(addWorkingDays(friday, 20), '2026-07-13');
  assertIsoDate(addWorkingDays(saturday, 20), '2026-07-13');
  assertIsoDate(calculateOutageDeadline(friday).deadlineDate, '2026-07-13');
  assert.equal(countWorkingDaysBetween(friday, date('2026-07-13')), 20);
});

test('svátky v okolí Velikonoc se přeskočí', () => {
  assert.equal(isPublicHoliday(date('2026-04-03')), true);
  assert.equal(isPublicHoliday(date('2026-04-06')), true);
  assertIsoDate(getNextWorkingDate(date('2026-04-03')), '2026-04-07');
});

test('konec roku přeskočí vánoční svátky a víkend', () => {
  assertIsoDate(addWorkingDays(date('2026-12-23'), 1), '2026-12-28');
  assertIsoDate(getNextWorkingDate(date('2026-12-24')), '2026-12-28');
});
