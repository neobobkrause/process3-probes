import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDay, formatDay, addDays, daysBetween, weekday } from '../src/index.mjs';

test('parseDay reads a real day and refuses others', () => {
  assert.equal(formatDay(parseDay('2026-02-28')), '2026-02-28');
  assert.throws(() => parseDay('2026-02-30'), RangeError);
  assert.throws(() => parseDay('28/02/2026'), RangeError);
});

test('addDays and daysBetween agree', () => {
  const a = parseDay('2026-12-30');
  const b = addDays(a, 5);
  assert.equal(formatDay(b), '2027-01-04');
  assert.equal(daysBetween(a, b), 5);
  assert.equal(daysBetween(b, a), -5);
});

test('bound text: a real calendar day written YYYY-MM-DD', () => {
  assert.equal(formatDay(parseDay('2028-02-29')), '2028-02-29');
  assert.throws(() => parseDay('2027-02-29'), RangeError);
  assert.throws(() => parseDay('2027-2-1'), RangeError);
});

test('bound n: a whole number of days', () => {
  const a = parseDay('2026-03-01');
  assert.equal(formatDay(addDays(a, -1)), '2026-02-28');
  assert.throws(() => addDays(a, 0.5), RangeError);
});

test('weekday names the day of the week', () => {
  assert.equal(weekday(parseDay('2026-11-15')), 'Sun');
  assert.equal(weekday(parseDay('2026-11-16')), 'Mon');
});
