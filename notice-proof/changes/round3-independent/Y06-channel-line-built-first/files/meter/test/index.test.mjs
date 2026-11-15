import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WORKER_FILE } from '../src/index.mjs';
/** @import { MeterMsg } from '../src/index.mjs' */

/**
 * The messages in what one output of the meter wrote.
 * @param {string} text
 * @returns {MeterMsg[]}
 */
const parse = (text) => text.trim().split('\n').filter(Boolean).map((l) => /** @type {MeterMsg} */ (JSON.parse(l)));

/**
 * Runs the meter's program on the given lines and collects what it sends back on each of its two outputs.
 * @param {string[]} lines
 * @returns {Promise<{out: MeterMsg[], err: MeterMsg[]}>}
 */
function runMeter(lines) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WORKER_FILE]);
    let out = '';
    let err = '';
    child.stdout.on('data', (/** @type {any} */ d) => (out += d));
    child.stderr.on('data', (/** @type {any} */ d) => (err += d));
    child.on('error', reject);
    child.on('close', () => resolve({ out: parse(out), err: parse(err) }));
    child.stdin.end(lines.join('\n') + '\n');
  });
}

test('one reading per use, in order, then done', async () => {
  const { out: msgs, err } = await runMeter([
    JSON.stringify({ kind: 'use', room: 'hall', minutes: 30 }),
    JSON.stringify({ kind: 'use', room: 'studio', minutes: 1 }),
  ]);
  assert.deepEqual(err, []);
  assert.deepEqual(msgs.map((m) => m.kind), ['reading', 'reading', 'done']);
  const [a, b, done] = msgs;
  if (a.kind !== 'reading' || b.kind !== 'reading' || done.kind !== 'done') return assert.fail('unexpected kinds');
  assert.deepEqual([a.room, b.room], ['hall', 'studio']);
  assert.ok(a.cost.cents > b.cost.cents);
  assert.equal(a.cost.cents, b.cost.cents * 30);
  assert.equal(done.count, 2);
});

test('bound minutes: whole number, 1 to 1440', async () => {
  const { out, err } = await runMeter([1, 1440, 0, 1441, 2.5].map((minutes) => JSON.stringify({ kind: 'use', room: 'r', minutes })));
  assert.deepEqual(out.map((m) => m.kind), ['reading', 'reading', 'done']);
  assert.deepEqual(err.map((m) => m.kind), ['refused', 'refused', 'refused']);
});
