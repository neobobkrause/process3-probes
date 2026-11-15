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

test('weekday names the day of the week', () => {
  assert.equal(weekday('2026-11-15'), 'Sun');
  assert.equal(weekday('2026-11-16'), 'Mon');
});
