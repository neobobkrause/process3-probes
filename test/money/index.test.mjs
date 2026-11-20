import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPence, parsePounds } from '../../src/money/index.mjs';

test('money R1: the three amounts the requirement names', () => {
  assert.equal(formatPence(1234), '£12.34');
  assert.equal(formatPence(5), '£0.05');
  assert.equal(formatPence(123456789), '£1,234,567.89');
});

test('money R1: zero, whole pounds and the edges of each comma group', () => {
  assert.equal(formatPence(0), '£0.00');
  assert.equal(formatPence(-0), '£0.00');
  assert.equal(formatPence(10), '£0.10');
  assert.equal(formatPence(99), '£0.99');
  assert.equal(formatPence(100), '£1.00');
  assert.equal(formatPence(99999), '£999.99');
  assert.equal(formatPence(100000), '£1,000.00');
  assert.equal(formatPence(99999999), '£999,999.99');
  assert.equal(formatPence(100000000), '£1,000,000.00');
});

test('money R1: the largest exact whole number and beyond are shown digit for digit', () => {
  assert.equal(formatPence(Number.MAX_SAFE_INTEGER), '£90,071,992,547,409.91');
  assert.equal(formatPence(1e21), '£10,000,000,000,000,000,000.00');
});

test('money R2: a negative amount is refused, naming it', () => {
  for (const bad of [-1, -1234, -Infinity]) {
    assert.throws(() => formatPence(bad), (e) => e instanceof RangeError && e.message.includes(String(bad)));
  }
});

test('money R2: an amount that is not a whole number is refused, naming it', () => {
  for (const bad of [0.5, 12.34, Infinity, NaN]) {
    assert.throws(() => formatPence(bad), (e) => e instanceof RangeError && e.message.includes(String(bad)));
  }
});

test('money R2: a value that is not a number is refused, naming it', () => {
  const cases = [['1234', '"1234"'], [null, 'null'], [undefined, 'undefined'], [{ pence: 5 }, '{"pence":5}'], [10n, '10n']];
  for (const [bad, named] of cases) {
    assert.throws(() => formatPence(bad), (e) => e instanceof RangeError && e.message.includes(named));
  }
});

test('money R3: without the pound sign, the text is R1 less the sign', () => {
  /** @type {Array<[number, string]>} */
  const cases = [[1234, '12.34'], [5, '0.05'], [0, '0.00'], [100000, '1,000.00'], [123456789, '1,234,567.89']];
  for (const [pence, text] of cases) {
    assert.equal(formatPence(pence, { symbol: false }), text);
    assert.equal(formatPence(pence), `£${text}`);
  }
});

test('money R3: the sign is shown when asked for or when the option is absent', () => {
  assert.equal(formatPence(1234, { symbol: true }), '£12.34');
  assert.equal(formatPence(1234, {}), '£12.34');
  assert.equal(formatPence(1234, undefined), '£12.34');
  assert.equal(formatPence(1234, { symbol: undefined }), '£12.34');
});

test('money R3: a symbol that is not true or false is refused with a TypeError, naming it', () => {
  const cases = [['no', '"no"'], [0, '0'], [1, '1'], [null, 'null'], ['false', '"false"'], [{}, '{}']];
  for (const [bad, named] of cases) {
    assert.throws(() => formatPence(1234, { symbol: bad }), (e) => e instanceof TypeError && e.message.includes(named));
  }
});

test('money R2 with R3: a bad amount is refused whether or not the sign is asked for', () => {
  for (const bad of [-1, 0.5, NaN]) {
    assert.throws(() => formatPence(bad, { symbol: false }), (e) => e instanceof RangeError && e.message.includes(String(bad)));
  }
});

test('money R4: the texts the requirement names are read back to their pence', () => {
  assert.equal(parsePounds('£1,234,567.89'), 123456789);
  assert.equal(parsePounds('0.05'), 5);
  assert.equal(parsePounds('£12.34'), 1234);
  assert.equal(parsePounds('12.34'), 1234);
});

test('money R4: every text R1 and R3 give is read back to the pence it came from', () => {
  const amounts = [0, 5, 10, 99, 100, 99999, 100000, 99999999, 100000000, 123456789, Number.MAX_SAFE_INTEGER, 1e21];
  for (const pence of amounts) {
    assert.equal(parsePounds(formatPence(pence)), pence);
    assert.equal(parsePounds(formatPence(pence, { symbol: false })), pence);
  }
});

test('money R4: the commas may be left out', () => {
  assert.equal(parsePounds('£1234.56'), 123456);
  assert.equal(parsePounds('1234567.89'), 123456789);
  assert.equal(parsePounds('£1000.00'), 100000);
});

test('money R4: text of any other form is refused with a RangeError that quotes it', () => {
  const bad = [
    '', '£', '£.05', '£12', '£12.3', '£12.345', '12,34', '£12,34', '£1,23.45', '£1,2345.67', '£12,345,67.89',
    '£,123.45', '£1,234,.56', '£01.00', '£ 12.34', ' £12.34', '£12.34 ', '££12.34', '£-12.34', '-£12.34', '+12.34',
    '$12.34', '12.34£', '£1e3.00', '£12.3a', 'twelve pounds', '£1.000,00', '£12.34\n',
  ];
  for (const text of bad) {
    assert.throws(() => parsePounds(text), (e) => e instanceof RangeError && e.message.includes(JSON.stringify(text)), text);
  }
});

test('money R4: a value that is not text is refused with a TypeError that names it', () => {
  const cases = [[1234, '1234'], [null, 'null'], [undefined, 'undefined'], [12n, '12n'], [{ text: '£1.00' }, '{"text":"£1.00"}'], [['£1.00'], '["£1.00"]']];
  for (const [bad, named] of cases) {
    assert.throws(() => parsePounds(bad), (e) => e instanceof TypeError && e.message.includes(named));
  }
});

test('money R5: a whole number of pounds is shown without the point and pence when asked', () => {
  /** @type {Array<[number, string]>} */
  const cases = [[1200, '12'], [123400, '1,234'], [0, '0'], [100, '1'], [100000, '1,000'], [123456700, '1,234,567']];
  for (const [pence, text] of cases) {
    assert.equal(formatPence(pence, { pence: false }), `£${text}`);
    assert.equal(formatPence(pence, { pence: false, symbol: false }), text);
  }
});

test('money R5: any other amount is shown as R1 or R3 gives it', () => {
  /** @type {Array<[number, string]>} */
  const cases = [[1234, '12.34'], [5, '0.05'], [1201, '12.01'], [1290, '12.90'], [99, '0.99'], [123456789, '1,234,567.89']];
  for (const [pence, text] of cases) {
    assert.equal(formatPence(pence, { pence: false }), `£${text}`);
    assert.equal(formatPence(pence, { pence: false, symbol: false }), text);
  }
});

test('money R5: the pence are shown when asked for or when the option is absent', () => {
  assert.equal(formatPence(1200, { pence: true }), '£12.00');
  assert.equal(formatPence(1200, { pence: undefined }), '£12.00');
  assert.equal(formatPence(1200, { symbol: false }), '12.00');
  assert.equal(formatPence(1200), '£12.00');
});

test('money R5: a pence request that is not true or false is refused with a TypeError, naming it', () => {
  const cases = [['no', '"no"'], [0, '0'], [1, '1'], [null, 'null'], ['false', '"false"'], [{}, '{}']];
  for (const [bad, named] of cases) {
    assert.throws(() => formatPence(1200, { pence: bad }), (e) => e instanceof TypeError && e.message.includes(named));
  }
});

test('money R2 with R5: a bad amount is refused whether or not the pence are asked for', () => {
  for (const bad of [-100, 0.5, NaN]) {
    assert.throws(() => formatPence(bad, { pence: false }), (e) => e instanceof RangeError && e.message.includes(String(bad)));
  }
});
