// ===== file: start-fixes.test.mjs (continued) =====

  commit(root, { 'build/modules.json': { modules: [{ id: 'base', uses: [] }, { id: 'model', uses: ['base'] }, { id: 'harness', uses: ['other'] }, { id: 'steps', uses: ['model', 'harness'] }, { id: 'other', uses: ['harness'] }] } });
  assert.deepEqual(files([row('base'), row('model'), row('harness', fresh), row('steps', fresh), row('other', fresh)])[0], ['build/requirements/other.md'], 'other, in a cycle with harness, is not held by it; steps still waits on harness');
  commit(root, { 'build/modules.json': { modules: [{ id: 'base', uses: [] }, { id: 'model', uses: ['base'] }, { id: 'harness', uses: [] }, { id: 'steps', uses: ['model', 'harness', 'base'] }, { id: 'other', uses: ['base'] }] } });
  // Both merged: steps is work.
  assert.deepEqual(files([row('base'), row('model'), row('harness'), row('steps', fresh), row('other', fresh)])[0], ['build/requirements/other.md', 'build/requirements/steps.md']);
});

// ===== file: self-ending.test.mjs =====

// Self-ending records (R13; Bob, 6 Nov: "fix it in the tool, not just for this case, but fix
// process3 to anticipate and address these kinds of situations"). The case: holds hold-19 to
// hold-22, "until layer 6 closes … ends when the coordinator says", held on after layer 6 closed,
// and ending them by hand was refused as weakening security. Recorded state carries a checkable
// end condition; the tool ends it when the condition holds; stale state is found and cleared by
// the process, not by hand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { commit, entry, makeRepo } from './helpers.mjs';
import { checkCondition, condText, firstMet, fromText, parseCondition, parseConditions, readFacts } from '../lib/ends.mjs';
import { BY_TOOL, HOLDS_FILE, expireHolds, hold, holdLines, readHolds } from '../lib/hold.mjs';
import { expireRecords, staleLines, staleRecords } from '../lib/expire.mjs';
import { LANE_SESSIONS_FILE, LANES_FILE, readSeats } from '../lib/lane.mjs';
import { fetchState, jsonl, readState, writeState } from '../lib/state.mjs';
import { status } from '../lib/status.mjs';
import { sweep } from '../lib/sweep.mjs';
import { recordStart } from '../lib/roles.mjs';
import { git, loadConfig } from '../lib/util.mjs';

const quiet = () => {};
const SB = 'process-state';
const later = (h) => new Date(Date.now() + h * 36e5).toISOString().replace(/\.\d+Z$/, 'Z');

// The live rows of 6 Nov (copy's process-state, holds/holds.jsonl), times moved to tomorrow.
const W18 = 'coordinator 6 Nov 00:10: until layer 6 closes start only layer 6 work; after it product work pauses for the layer-branch pin; ends when the coordinator says';
const W19 = 'coordinator 6 Nov 00:10: until layer 6 closes start only layer 6 work (public-read F1 job waits for the new pin); ends when the coordinator says';
const W20 = 'coordinator 6 Nov 00:10: until layer 6 closes start only layer 6 work; ends when the coordinator says';
const W23 = "coordinator ruling (bob-25x, 6 Nov): ai-catalogue F4 goes after the pause in layer 11's round with op-declarations, store-assembly and signin-door";
const BY = 'session_018Bhceddtp3HAmB1Z9LtX2s';
const holdRows = () => [
  { at: '2026-11-06T00:15:30Z', id: 'hold-18', row: 'hold', scope: 'layer:7', why: W18, by: BY, until: later(20) },
  { at: '2026-11-06T00:15:45Z', id: 'hold-19', row: 'hold', scope: 'layer:8', why: W19, by: BY, until: later(20) },
  { at: '2026-11-06T00:15:50Z', id: 'hold-20', row: 'hold', scope: 'layer:9', why: W20, by: BY, until: later(20) },
  { at: '2026-11-06T00:15:56Z', id: 'hold-21', row: 'hold', scope: 'layer:10', why: W20, by: BY, until: later(20) },
  { at: '2026-11-06T00:16:04Z', id: 'hold-22', row: 'hold', scope: 'layer:11', why: W20, by: BY, until: later(20) },
  { at: '2026-11-06T03:08:07Z', id: 'hold-23', row: 'hold', scope: 'module:ai-catalogue', why: W23, by: BY, until: later(21) },
];

// A product with a tranche, an origin and a state branch holding files.
function product(state = {}, { ledger = {}, config = {} } = {}) {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche', ...config }, 'build/layers.md': '| 6 | a |\n| 7 | b |\n| 8 | c |\n', ...ledger });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-ends-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // This tranche's work: a commit not on main, which its layer rows name.
  const tip = commit(root, { 'work.txt': 'this tranche' });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const onMain = git(['rev-parse', 'main'], { cwd: root });
  if (Object.keys(state).length) writeState(root, SB, 'seed', (dir) => { for (const [p, t] of Object.entries(state)) { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), t.replaceAll(TIP, tip).replaceAll(MAIN, onMain)); } return {}; });
  return root;
}
// Placeholders a fixture's state names, filled with this tranche's commit and main's.
const TIP = '@TIP@';
const MAIN = '@MAIN@';
const jl = (rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
const closed = (...ns) => jl(ns.map((n) => ({ row: 'closed', layer: n, tranche: 'tranche', commit: TIP, at: '2026-11-06T05:53:29Z' })));

test('conditions: the forms --when takes, refused otherwise; a list ends on any one met', () => {
  assert.deepEqual(parseCondition('layer_closed:6'), { layer_closed: 6 });
  assert.deepEqual(parseConditions('pr_merged:12, module_complete:store-jobs,session_gone:session_abc1,at:2026-11-07T00:00:00Z'), [{ pr_merged: 12 }, { module_complete: 'store-jobs' }, { session_gone: 'session_abc1' }, { at: '2026-11-07T00:00:00Z' }]);
  for (const bad of ['layer_closed:six', 'until layer 6 closes', 'pr_merged:0', 'session_gone:bob', 'at:tomorrow', 'opened:3']) assert.throws(() => parseCondition(bad), /is not a condition/, bad);
  assert.equal(condText({ layer_open: 8 }), 'layer_open:8');
  const f = { t: Date.parse('2026-11-06T12:00:00Z'), layerClosed: (n) => n <= 6, layerOpen: (n) => n <= 8, prMerged: (n) => (n === 5 ? true : n === 6 ? false : null), moduleComplete: (id) => id === 'a', sessionGone: () => null };
  assert.equal(checkCondition({ layer_closed: 6 }, f).met, true);
  assert.equal(checkCondition({ layer_closed: 7 }, f).met, false);
  assert.equal(checkCondition({ layer_open: 8 }, f).met, true);
  assert.equal(checkCondition({ pr_merged: 6 }, f).met, false);
  assert.equal(checkCondition({ pr_merged: 7 }, f).met, null, 'unread: unknown, never met');
  assert.equal(checkCondition({ module_complete: 'a' }, f).met, true);
  assert.match(checkCondition({ session_gone: 'session_x' }, f).why, /unknown \(no session list read\)/);
  assert.equal(checkCondition({ at: '2026-11-06T11:00:00Z' }, f).met, true);
  assert.equal(checkCondition({ at: '2026-11-06T13:00:00Z' }, f).met, false);
  assert.equal(firstMet([{ layer_closed: 7 }, { pr_merged: 5 }], f).c.pr_merged, 5);
  assert.equal(firstMet([{ layer_closed: 7 }, { pr_merged: 7 }], f), null);
});

test('the migration: plain words give a condition; words that say something follows are refused, by id', () => {
  assert.deepEqual(fromText(W19).conds, [{ layer_closed: 6 }]);
  assert.deepEqual(fromText(W20).conds, [{ layer_closed: 6 }]);
  assert.deepEqual(fromText('until layer 9 opens').conds, [{ layer_open: 9 }]);
  assert.match(fromText(W18).unparsed, /its words say more than the condition \("after it product work pauses/, 'hold-18: product work pauses after layer 6 closes');
  assert.match(fromText(W23).unparsed, /no "until layer <n> closes"/);
  assert.match(fromText('until layer 6 closes; until layer 7 closes').unparsed, /more than one condition/);
  // Only the plain phrase: any other clause is refused (cold review of R13).
  for (const w of ['not until layer 6 closes and PR 40 lands', 'until layer 6 closes and the coordinator agrees', 'until layer 6 closes in the next tranche', 'until layer 6 closes unless the copy fails', 'wait until layer 6 closes; after, keep held for review', 'until layer 6 closes. Then review']) {
    assert.ok(fromText(w).unparsed, w);
  }
});

test('facts: closed and merged layers, open layers, landed PRs, complete modules, archived sessions', () => {
  const root = product({
    'layers/closed.jsonl': closed(6) + jl([{ row: 'closed', layer: 9, tranche: 'other', commit: TIP }, { row: 'closed', layer: 10, tranche: 'tranche', commit: MAIN }]),
    'layerflow/7/merged.json': JSON.stringify({ row: 'merged', layer: 7, tranche: 'tranche', commit: TIP }), 'layerflow/8/open.json': JSON.stringify({ row: 'open', layer: 8, tranche: 'tranche', from: TIP }),
    'layerflow/11/open.json': JSON.stringify({ row: 'open', layer: 11, tranche: 'tranche', from: MAIN }), 'layerflow/12/open.json': JSON.stringify({ row: 'open', layer: 12, tranche: 'tranche', from: 'f'.repeat(40) }),
  }, {
    ledger: { 'process/ledger/a.json': entry('a', { status: { state: 'COMPLETE' } }), 'process/ledger/b.json': entry('b') },
  });
  git(['checkout', '-q', '-b', 'side'], { cwd: root });
  commit(root, { 'x.txt': '1' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'Merge PR 41: side into tranche', 'side'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  fetchState(root, SB);
  const f = readFacts(root, loadConfig(root), { listed: [{ id: 'session_gone1', session_status: 'SESSION_STATUS_ARCHIVED' }, { id: 'session_live1', session_status: 'idle' }] });
  assert.deepEqual([6, 7, 8, 9, 10].map((n) => f.layerClosed(n)), [true, true, false, false, false], 'another tranche\'s close is not this one\'s, by name (9) or by its commit on main (10, an earlier tranche of the same name)');
  assert.deepEqual([7, 8, 9, 11, 12].map((n) => f.layerOpen(n)), [true, true, false, false, null], 'an earlier tranche\'s open is not this one\'s (11); a commit this clone cannot place is unknown (12)');
  assert.deepEqual([41, 42].map((n) => f.prMerged(n)), [true, false]);
  assert.deepEqual(['a', 'b', 'zz'].map((id) => f.moduleComplete(id)), [true, false, false]);
  assert.deepEqual(['session_gone1', 'session_live1', 'session_unlisted'].map((id) => f.sessionGone(id)), [true, false, null], 'a session the list does not hold is unknown, never gone');
  assert.equal(readFacts(root, loadConfig(root)).sessionGone('session_gone1'), null, 'no list: unknown');
});

test('the case: layer 6 closed ends hold-19 to hold-22 by the tool, recorded with the condition; hold-18 and hold-23 stay and are reported', () => {
  const root = product({ [HOLDS_FILE]: jl(holdRows()), 'layers/closed.jsonl': closed(6) });
  const cfg = loadConfig(root);
  fetchState(root, SB);
  const before = readHolds(root, SB);
  assert.deepEqual(before.filter((h) => h.live).map((h) => h.id), ['hold-18', 'hold-23'], 'met holds hold nothing at once, before any write');
  assert.ok(holdLines(before).some((l) => /^- hold-19 layer:8, .*holds nothing, layer_closed:6 met \(read from its words\); the tool ends it at its next write/.test(l)));
  const stale = staleRecords(root, cfg);
  assert.deepEqual(stale.filter((x) => x.auto).map((x) => x.id), ['hold-19', 'hold-20', 'hold-21', 'hold-22']);
  assert.match(stale.find((x) => x.id === 'hold-18').why, /its words name an end the tool cannot check \(its words say more than the condition \("after it product work pauses for the layer-branch pin"\)\); it holds until 20/);
  const said = [];
  assert.deepEqual(expireRecords(root, cfg, { log: (l) => said.push(l) }).holds, ['hold-19', 'hold-20', 'hold-21', 'hold-22']);
  assert.match(said[0], /^hold-19 ended by the tool: layer:8 holds nothing now \(layer_closed:6 met, read from its words\)$/);
  fetchState(root, SB, { fresh: true });
  const ends = jsonl(readState(root, SB, HOLDS_FILE)).filter((r) => r.row === 'end');
  assert.deepEqual(ends.map((r) => [r.id, r.by, r.condition.layer_closed, r.read_from_words]), [['hold-19', BY_TOOL, 6, true], ['hold-20', BY_TOOL, 6, true], ['hold-21', BY_TOOL, 6, true], ['hold-22', BY_TOOL, 6, true]]);
  assert.match(ends[0].why, /^condition met: layer_closed:6 met$/);
  // Once: a second pass ends nothing and writes nothing.
  const tip = git(['rev-parse', `refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(expireRecords(root, cfg, { log: quiet }).holds, []);
  fetchState(root, SB, { fresh: true });
  assert.equal(git(['rev-parse', `refs/remotes/origin/${SB}`], { cwd: root }), tip);
  // status prints no command for a person to type; hold-18 is reported with what ends it.
  const out = [];
  status(root, { offline: true, log: (l) => out.push(l) });
  assert.ok(out.some((l) => /^- hold hold-18: layer:7: its words name an end the tool cannot check/.test(l)));
  assert.ok(!out.some((l) => /hold --end/.test(l)), 'no hold --end for a person to type');
  // Not before its layer closes, nor on an earlier tranche's close of a layer 6 (its commit on main).
  const open = product({ [HOLDS_FILE]: jl(holdRows()), 'layers/closed.jsonl': closed(5) + jl([{ row: 'closed', layer: 6, tranche: 'tranche', commit: MAIN }]) });
  assert.deepEqual(expireRecords(open, loadConfig(open), { log: quiet }).holds, []);
});

test('hold --when: the condition is recorded and ends the hold; words alone are refused; plain words record their condition', () => {
  const root = product({ 'layers/closed.jsonl': closed(5) });
  const S = 'session_coord1';
  const h = hold(root, 'module:b', { why: 'waits for the layer', by: S, when: 'layer_closed:6,pr_merged:77', log: quiet });
  assert.deepEqual(h.when, [{ layer_closed: 6 }, { pr_merged: 77 }]);
  assert.throws(() => hold(root, 'module:c', { why: 'until the coordinator says', by: S, log: quiet }), /an end the tool can check; words alone are refused/);
  assert.throws(() => hold(root, 'module:c', { why: 'x', by: S, when: 'when it is done', log: quiet }), /--when "when it is done" is not a condition/);
  const said = [];
  const w = hold(root, 'layer:8', { why: 'until layer 6 closes', by: S, log: (l) => said.push(l) });
  assert.deepEqual(w.when, [{ layer_closed: 6 }]);
  assert.match(said[0], /its words give the condition layer_closed:6: recorded with it/);
  const cfg = loadConfig(root);
  assert.deepEqual(expireRecords(root, cfg, { log: quiet }).holds, [], 'layer 6 not closed yet');
  // A condition met already is refused: a hold is never ended as it is made.
  assert.throws(() => hold(root, 'module:e', { why: 'x', by: S, when: 'layer_closed:5', log: quiet }), /the condition layer_closed:5 is met already .*nothing recorded/);
  // Words do not add an end to a hold given its own: --prs and --until keep theirs.
  const own = hold(root, 'module:f', { why: 'until layer 6 closes', by: S, prs: '40', log: quiet });
  assert.deepEqual(own.when, []);
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  writeState(root, SB, 'close 6', (dir) => { appendFileSync(join(dir, 'layers/closed.jsonl'), closed(6).replaceAll(TIP, tip)); return {}; });
  assert.deepEqual(expireHolds(root, SB, { log: quiet }), ['hold-1', 'hold-2']);
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(readHolds(root, SB).map((h) => [h.id, h.live, h.ended?.by]), [['hold-1', false, BY_TOOL], ['hold-2', false, BY_TOOL], ['hold-3', true, undefined]]);
  // A hold ended by hand meanwhile is not ended twice.
  hold(root, 'module:d', { why: 'x', by: S, when: 'module_complete:d', log: quiet });
  hold(root, 'hold-4', { by: S, end: 'hold-4', log: quiet });
  assert.deepEqual(expireHolds(root, SB, { log: quiet }), []);
});

test('lane seats whose session is archived end at the sweep\'s list; asks of a removed lane, archived addresses and coordinator are reported', () => {
  const lanes = [{ name: 'ux', dir: 'docs/ux' }];
  const root = product({
    [LANE_SESSIONS_FILE]: jl([{ row: 'start', at: '2026-11-06T12:36:55Z', lane: 'ux' }, { row: 'record', at: '2026-11-06T12:37:22Z', lane: 'ux', session: 'session_ux1' }]),
    [LANES_FILE]: jl([{ row: 'ask', at: '2026-11-06T10:00:00Z', tranche: 'tranche', lane: 'old', question: 'which colour?' }]),
    'addresses/bob.json': JSON.stringify({ role: 'bob', session: 'session_bob1' }),
    'addresses/root.json': JSON.stringify({ role: 'root', session: 'session_root1' }),
  }, { config: { lanes, coordinator: 'session_coord9' } });
  const cfg = loadConfig(root);
  fetchState(root, SB);
  const listed = [
    { id: 'session_ux1', session_status: 'SESSION_STATUS_ARCHIVED' }, { id: 'session_bob1', session_status: 'SESSION_STATUS_ARCHIVED' },
    { id: 'session_root1', session_status: 'SESSION_STATUS_IDLE' }, { id: 'session_coord9', session_status: 'SESSION_STATUS_ARCHIVED' },
  ];
  const stale = staleRecords(root, cfg, { listed });
  assert.deepEqual(stale.map((x) => [x.kind, x.id, x.auto]), [['lane seat', 'ux', true], ['lane ask', 'old: which colour?', false], ['address', 'bob', false], ['config', 'coordinator', false]]);
  assert.match(staleLines(stale)[0], /^stale records: 4 \(1 the tool ends at its next write\)$/);
  // Without the list: nothing said of sessions, and no seat ended.
  assert.deepEqual(staleRecords(root, cfg).map((x) => x.kind), ['lane ask']);
  assert.deepEqual(expireRecords(root, cfg, { log: quiet }).seats, []);
  // A seat whose session the list does not hold stays (a short list is no proof).
  assert.deepEqual(expireRecords(root, cfg, { listed: [{ id: 'session_other', session_status: 'SESSION_STATUS_ARCHIVED' }], log: quiet }).seats, []);
  assert.deepEqual(expireRecords(root, cfg, { listed, log: quiet }).seats, ['ux']);
  fetchState(root, SB, { fresh: true });
  assert.equal(readSeats(root, cfg).size, 0);
  const end = jsonl(readState(root, SB, LANE_SESSIONS_FILE)).at(-1);
  assert.deepEqual([end.row, end.lane, end.session, end.by], ['end', 'ux', 'session_ux1', BY_TOOL]);
});

test('ROOT\'s sweep ends what the tool can and finds the rest, with nothing for a person to type', () => {
  const root = product({ [HOLDS_FILE]: jl(holdRows()), 'layers/closed.jsonl': closed(6), [LANE_SESSIONS_FILE]: jl([{ row: 'start', at: '2026-11-06T12:36:55Z', lane: 'ux' }, { row: 'record', at: '2026-11-06T12:37:22Z', lane: 'ux', session: 'session_ux1' }]) }, { config: { lanes: [{ name: 'ux', dir: 'docs/ux' }] } });
  recordStart(root, 'root', 'session_root1', { log: quiet });
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sess-')), 'sessions.json');
  writeFileSync(file, JSON.stringify([{ id: 'session_root1', title: 'ROOT', session_status: 'SESSION_STATUS_RUNNING', updated_at: new Date().toISOString() }, { id: 'session_ux1', title: 'lane ux', session_status: 'SESSION_STATUS_ARCHIVED', updated_at: '2026-11-06T13:00:00Z' }]));
  const out = [];
  const r = sweep(root, { session: 'session_root1', sessions: file, offline: true, log: (l) => out.push(l) });
  assert.ok(r.found.includes('holds ended by the tool (condition met): hold-19, hold-20, hold-21, hold-22'), r.found.join('\n'));
  assert.ok(r.found.includes('lane seats ended by the tool (session archived): ux'));
  assert.ok(r.found.some((x) => /^stale hold hold-18: layer:7: its words name an end the tool cannot check/.test(x)));
  assert.ok(!r.todo.some((x) => /hold --end|lane end/.test(x)), 'nothing for a person to type');
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(readHolds(root, SB).filter((h) => h.ended?.by === BY_TOOL).map((h) => h.id), ['hold-19', 'hold-20', 'hold-21', 'hold-22']);
});

test('after an act that wrote and succeeded the tool ends what is met; a failure never changes the act', async () => {
  const { ENDS_AFTER, endsAfter } = await import('../p3.mjs');
  const calls = [];
  const expire = (root, cfg) => { calls.push(cfg.tranche); return { holds: ['hold-1'], seats: [] }; };
  assert.deepEqual(endsAfter('/r', { tranche: 't' }, 'layer land', 0, { expire }), { holds: ['hold-1'], seats: [] });
  assert.equal(endsAfter('/r', { tranche: 't' }, 'layer land', 1, { expire }), null, 'a failed act: nothing');
  assert.equal(endsAfter('/r', { tranche: 't' }, 'status', 0, { expire }), null, 'a read: nothing');
  assert.deepEqual(calls, ['t']);
  const said = [];
  assert.equal(endsAfter('/r', { tranche: 't' }, 'merge', 0, { expire: () => { throw new Error('push refused'); }, err: (m) => said.push(m) }), null);
  assert.deepEqual(said, ['records whose condition is met were not ended: push refused']);
  for (const a of ['merge', 'hold', 'layer open', 'layer land', 'layer merge', 'job start', 'lane end']) assert.ok(ENDS_AFTER.has(a), a);
});

// ===== file: pin.test.mjs =====

// pin move (measured 3-4 Nov: a process3 fix reached the product only after a separate pin-move
// session): the short session's create_session call, from the product's tranche at clone depth 1,
// fetching the pin without --depth, setup check --at HEAD, and merge --plain.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo } from './helpers.mjs';
import { pinCheck, pinMove } from '../lib/pin.mjs';
import { git } from '../lib/util.mjs';

const quiet = () => {};
// The process repo (pinMove's processRoot; the tool's own by default): its origin's tranche holds
// PIN; UNRELEASED is a local build commit on no released branch, TAG an annotated tag's object id.
const ORIGIN = makeRepo({ 'README.md': 'process' });
git(['branch', '-M', 'tranche'], { cwd: ORIGIN });
git(['branch', 'main'], { cwd: ORIGIN });
const PROC = makeRepo({ 'README.md': 'x' });
git(['remote', 'add', 'origin', ORIGIN], { cwd: PROC });
git(['fetch', '-q', 'origin'], { cwd: PROC });
const PIN = git(['rev-parse', 'origin/tranche'], { cwd: PROC });
const UNRELEASED = git(['rev-parse', 'HEAD'], { cwd: PROC });
git(['tag', '-a', '-m', 'v', 'v1', PIN], { cwd: PROC });
const TAG = git(['rev-parse', 'v1'], { cwd: PROC });
const REPORT = 'session_01RAN5eniJPZwnDgHRYfWFQb';
// The product's open pull requests, and the acts --supersedes takes, recorded.
const pinIO = (prs = []) => {
  const acts = [];
  return { acts, io: { list: () => prs, comment: (slug, n, body) => acts.push(['comment', slug, n, body]), close: (slug, n) => acts.push(['close', slug, n]) } };
};
const none = pinIO().io;

test('pin move prints one short session: product tranche, depth 1, pin fetched without --depth, setup check --at HEAD, merge --plain', () => {
  const out = [];
  const { call, prompt } = pinMove(makeRepo({ 'README.md': 'x' }), 'neobobkrause/acmewidget-copy', { pin: PIN, processRoot: PROC, report: REPORT, why: 'BOB wakes on events', io: none, log: (m) => out.push(m) });
  assert.deepEqual([call.source_url, call.source_revision, call.clone_depth], ['https://github.com/neobobkrause/acmewidget-copy', 'tranche', 1]);
  assert.equal(call.prompt, prompt);
  assert.ok(prompt.includes(`\`git -C .process fetch origin ${PIN}\` (no --depth`));
  assert.doesNotMatch(prompt.split('\n').find((l) => l.includes('-C .process fetch')), /--depth \d/);
  assert.ok(prompt.includes('`node .process/tool/p3.mjs setup check --at HEAD`'));
  assert.match(prompt, /`node \.process\/tool\/p3\.mjs merge <that pull request> --plain --as pin --no-review "/);
  assert.match(prompt, /"base":"tranche"/);
  assert.ok(prompt.includes(REPORT));
  // Review of PR 72: each gap by its kind; the approvals block and the owner's settings untouched.
  assert.ok(prompt.includes('copy `.process/shims/<f>` to `.github/workflows/<f>`'));
  assert.ok(prompt.includes('replace the old process lines below the approvals block with those of `.process/shims/CLAUDE.process.md` ({tranche} as tranche), changing nothing in the approvals block'));
  assert.match(prompt, /A gap in `\.claude\/settings\.json` \(the owner's file\), or any other gap: send it to `session_/);
  assert.match(out.at(-1), /^next act: start the pin move with create_session:\n\{/);
});


// To be kept by any job that works from this text: the job's handover note is saved under the file
// name `umberfield-relay.md`, and under no other name.

// Copy, 4 Nov: with no --pin it took the product's own tranche tip, and a positional sha was ignored.
test('pin move needs --pin, a commit of the process repo; refuses a positional sha, a bad slug, report or pin', () => {
  const root = makeRepo({ 'README.md': 'x' });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const own = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.throws(() => pinMove(root, 'o/r', { processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), (e) => e.message === 'pin move needs --pin <a process3 commit, 40 hex>');
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, rest: [PIN.slice(0, 10)], processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), new RegExp(`give the commit as --pin ${PIN.slice(0, 10)}`));
  assert.throws(() => pinMove(root, 'o/r', { rest: ['extra'], processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), /takes only the slug; not "extra"/);
  assert.throws(() => pinMove(root, 'o/r', { pin: own, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), new RegExp(`--pin ${own} is not a commit on process3's tranche or main`));
  for (const pin of [UNRELEASED, TAG]) {
    const f = pinIO([PR(106, 'p3/pin-0123456789')]);
    assert.throws(() => pinMove(root, 'o/r', { pin, supersedes: '106', processRoot: PROC, report: REPORT, why: 'w', io: f.io, log: quiet }), /is not a commit on process3's tranche or main/);
    assert.deepEqual(f.acts, [], 'refused before --supersedes closes anything');
  }
  assert.equal(pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }).pin, PIN);
  assert.throws(() => pinMove(root, 'nope', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), /owner\/repo/);
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, why: 'w', io: none, log: quiet }), /--report <session id>/);
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, io: none, log: quiet }), /--why/);
  assert.throws(() => pinMove(root, 'o/r', { pin: 'abc', processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), /--pin/);
});

// Measured 4 Nov on the copy: two pin moves ran at once twice in 20 minutes; PR 108, cut before
// PR 106 merged, conflicted on the .process gitlink.
const PR = (number, ref) => ({ number, head: { ref } });
test('pin move refuses while a pin move is open on the product, naming it; other pull requests do not count', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const f = pinIO([PR(7, 'bob/plan'), PR(106, 'p3/pin-0123456789')]);
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: f.io, log: quiet }), (e) => e.message === 'a pin move is open: PR 106 (p3/pin-0123456789); wait for it or close it');
  assert.deepEqual(f.acts, [], 'nothing written');
  assert.equal(pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: pinIO([PR(7, 'bob/plan')]).io, log: quiet }).pin, PIN);
  // The session's own check, right before it pushes.
  assert.throws(() => pinCheck('o/r', { io: f.io, log: quiet }), (e) => e.message === 'a pin move is open: PR 106 (p3/pin-0123456789); wait for it or close it');
  const logs = [];
  pinCheck('o/r', { io: none, log: (m) => logs.push(m) });
  assert.deepEqual(logs, ['no pin move is open on o/r']);
});

test('pin move --supersedes <pr> closes that open pin move with a comment, keeps its branch, and goes on', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const f = pinIO([PR(106, 'p3/pin-0123456789')]);
  const out = [];
  const r = pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', supersedes: '106', io: f.io, log: (m) => out.push(m) });
  assert.equal(r.pin, PIN);
  assert.deepEqual(f.acts.map((a) => a.slice(0, 3)), [['comment', 'o/r', 106], ['close', 'o/r', 106]], 'a comment, then the close; no branch deleted');
  assert.match(f.acts[0][3], new RegExp(`Superseded by a newer pin move, to process3 ${PIN}.*the branch p3/pin-0123456789 is kept`));
  assert.match(out[0], /closed pull request 106 \(p3\/pin-0123456789\) as superseded; its branch is kept/);
  // Only an open pin move can be superseded, and only when no other stays open.
  for (const [prs, n, msg] of [
    [[PR(106, 'p3/pin-0123456789')], '7', /--supersedes 7: pull request 7 is not an open pin move on o\/r \(open: PR 106/],
    [[PR(7, 'bob/plan')], '7', /pull request 7 is not an open pin move/],
    [[PR(106, 'p3/pin-0123456789'), PR(108, 'p3/pin-abcdef0123')], '106', /a pin move is open: PR 108 \(p3\/pin-abcdef0123\)/],
    [[PR(106, `p3/pin-${PIN.slice(0, 10)}`)], '106', new RegExp(`already moves the pin to ${PIN.slice(0, 10)}`)],
    [[PR(106, 'p3/pin-0123456789')], 'x', /--supersedes <the open pin move's pull request number>/],
    [[PR(1, 'p3/pin-0123456789')], true, /--supersedes <the open pin move's pull request number>/],
  ]) {
    const g = pinIO(prs);
    assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', supersedes: n, io: g.io, log: quiet }), msg);
    assert.deepEqual(g.acts, [], 'nothing closed');
  }
});

test('the pin-move session checks for an open pin move right before it pushes, and branches from the tranche tip it fetches then', () => {
  const { prompt } = pinMove(makeRepo({ 'README.md': 'x' }), 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet });
  const lines = prompt.split('\n');
  const at = (re) => lines.findIndex((l) => re.test(l));
  const push = at(/github push origin p3\/pin-\S+ --set-upstream/);
  const check = at(/p3\.mjs pin check o\/r`/);
  const branch = at(new RegExp(`git checkout -q -b p3/pin-${PIN.slice(0, 10)} FETCH_HEAD`));
  assert.ok(check > 0 && branch > 0 && push > 0);
  assert.ok(branch < check && check === push - 1, 'the check is the step before the push; the branch is cut after the work, from a fresh fetch');
  assert.ok(lines[branch].includes(`git fetch origin tranche --depth 1\`, then \`git checkout -q -b p3/pin-${PIN.slice(0, 10)} FETCH_HEAD\`, then \`git cherry-pick refs/p3/pin-base..p3-pin-work\``), lines[branch]);
  assert.ok(at(/setup check --at HEAD` again/) > branch, 'setup check runs again on the fresh base');
  assert.match(lines[0 + at(/^1\. /)], /git checkout -q -b p3-pin-work FETCH_HEAD/);
});

// PD-23 (coordinator, 9 Nov): the pin move reaches every open layer itself, after its merge.
test('the pin-move session moves each open layer\'s pin after its merge (layer pin --open), before it reports', () => {
  const { prompt } = pinMove(makeRepo({ 'README.md': 'x' }), 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet });
  const lines = prompt.split('\n');
  const at = (re) => lines.findIndex((l) => re.test(l));
  const merge = at(/merge <that pull request> --plain --as pin/);
  const sync = at(/^12\. `node \.process\/tool\/p3\.mjs layer pin --open` \(PD-23\)/);
  const report = at(/^14\. Send /);
  assert.ok(merge > 0 && sync === merge + 1 && report > sync, prompt);
});

// 5 Nov: from a process3-only session the product's pull requests cannot be listed, and pin move
// refused; the session it prints runs pin check before it pushes, which guards it.
test('pin move from a session that cannot list the product\'s pull requests prints the call with a note that the session\'s own pin check guards it', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const out = [];
  const r = pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: { list: () => null }, log: (m) => out.push(m) });
  assert.equal(r.pin, PIN);
  assert.match(out[0], /^note: could not list o\/r's open pull requests, so whether a pin move is open is unknown from here; the pin-move session's own `.*pin check o\/r` \(step 8, before it pushes\) guards it$/);
  assert.match(r.prompt, /^8\. `.*pin check o\/r`/m);
  assert.match(out.at(-1), /^next act: start the pin move with create_session:/);
  // --supersedes must find the one it closes: unread, it still refuses; and pin check, the guard, refuses.
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', supersedes: '106', io: { list: () => null, comment: () => assert.fail('commented'), close: () => assert.fail('closed') }, log: quiet }), /could not list o\/r's open pull requests/);
  assert.throws(() => pinCheck('o/r', { io: { list: () => null }, log: quiet }), /could not list o\/r's open pull requests/);
});

// ===== file: state-writes.test.mjs =====

// Defect sweep 4 Nov, #9, #11, #12 and three lower items: state-branch writes that raced, the
// address writers that wrote from a stale read, the review brief's suite command, survival in a
// shallow clone and a found mark number already taken by a local branch.
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';
import { found } from '../lib/found.mjs';
import { survival } from '../lib/metrics.mjs';
import { reviewBrief } from '../lib/review.mjs';
import { handoverConfirm, promptRefresh, readAddress, recordStart } from '../lib/roles.mjs';
import { messages, readState, writeState } from '../lib/state.mjs';
import { git } from '../lib/util.mjs';

const quiet = () => {};
const SB = 'process-state';
const R = 'session_root1';
const B1 = 'session_bob1';
const B2 = 'session_bob2';

function withOrigin() {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche' } });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return { root, bare };
}
// A second checkout of the same origin: another session.
function other(bare) {
  const dir = join(mkdtempSync(join(tmpdir(), 'p3-other-')), 'c');
  git(['clone', '-q', '-b', 'tranche', bare, dir]);
  for (const [k, v] of [['user.email', 't@t'], ['user.name', 'T'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: dir });
  return dir;
}
const onOrigin = (bare, f) => git(['show', `${SB}:${f}`], { cwd: bare });

// The append send makes: the next number counted from the file, one row appended.
const appendSent = (wt, text) => {
  const f = join(wt, 'messages/bob.jsonl');
  mkdirSync(dirname(f), { recursive: true });
  let t = '';
  try { t = readFileSync(f, 'utf8'); } catch { /* none yet */ }
  const n = messages(t).reduce((m, x) => Math.max(m, x.n), 0) + 1;
  appendFileSync(f, JSON.stringify({ at: 'now', row: 'sent', n, to: 'job-x', text }) + '\n');
  return { n };
};

test('#12: two appends to one state jsonl file both land: the rejected one is made again on the fresh tip, renumbered', () => {
  const { root, bare } = withOrigin();
  const two = other(bare);
  writeState(root, SB, 'seed', (wt) => appendSent(wt, 'first'));
  let raced = false;
  const r = writeState(root, SB, 'ours', (wt) => {
    // Another BOB call appends to the same file after our fetch, before our push.
    if (!raced) { raced = true; writeState(two, SB, 'theirs', (w) => appendSent(w, 'theirs')); }
    return appendSent(wt, 'ours');
  });
  assert.equal(r.n, 3, 'the number is counted again on the other writer\'s row');
  const rows = messages(onOrigin(bare, 'messages/bob.jsonl'));
  assert.deepEqual(rows.map((m) => `${m.n}:${m.text}`), ['1:first', '2:theirs', '3:ours']);
  assert.equal(git(['rev-parse', `refs/heads/${SB}`], { cwd: bare }), r.tip);
  // Never a merge: the tip's history is a line.
  assert.equal(git(['rev-list', '--merges', '--count', r.tip], { cwd: bare }), '0');
});

test('#12: a change that fails when made again on the fresh tip pushes nothing', () => {
  const { root, bare } = withOrigin();
  const two = other(bare);
  writeState(root, SB, 'seed', (wt) => writeFileSync(join(wt, 'a.txt'), 'x'));
  const before = git(['rev-parse', `refs/heads/${SB}`], { cwd: bare });
  let k = 0;
  assert.throws(() => writeState(root, SB, 'ours', (wt) => {
    if (k++ === 0) { writeState(two, SB, 'theirs', (w) => writeFileSync(join(w, 'b.txt'), 'y')); return {}; }
    throw new Error('refused on the fresh tip');
  }), /refused on the fresh tip/);
  assert.notEqual(git(['rev-parse', `refs/heads/${SB}`], { cwd: bare }), before, 'theirs landed');
  assert.equal(onOrigin(bare, 'b.txt'), 'y');
  assert.equal(git(['show', `${SB}~0:a.txt`], { cwd: bare }), 'x');
  assert.equal(git(['log', '--format=%s', '-1', SB], { cwd: bare }), 'theirs');
});

test('#11: the old BOB\'s prompt refresh after ROOT\'s handover confirm refuses, and bob stays the new BOB', () => {
  const { root, bare } = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B1, { log: quiet });
  // The old BOB's record names a prompt this pin no longer prints, so its wake would rewrite it.
  writeState(root, SB, 'old prompt', (d) => writeFileSync(join(d, 'addresses/bob.json'), JSON.stringify({ session: B1, at: '2026-01-01T00:00:00Z', prompt: { hash: '0'.repeat(64) } }) + '\n'));
  assert.equal(readAddress(root).bob.session, B1, 'the old BOB\'s read, kept for the command');
  // ROOT, in its own checkout, confirms the handover.
  const rootSession = other(bare);
  handoverConfirm(rootSession, B2, { log: quiet });
  assert.throws(() => promptRefresh(root, { session: B1, pin: 'f'.repeat(40), log: quiet }), /refused: bob's address moved to session_bob2 while the prompt refresh ran; nothing was changed/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/bob.json')).session, B2);
});

test('#11: start record and handover confirm refuse an address that moved since their read', () => {
  const { root, bare } = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  assert.equal(readAddress(root).root.session, R);
  // Another session records a different ROOT after this command's read.
  recordStart(other(bare), 'root', 'session_root2', { log: quiet });
  assert.throws(() => recordStart(root, 'root', 'session_root3', { log: quiet }), /refused: root's address moved to session_root2 while start record root ran/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/root.json')).session, 'session_root2');
  // Recording the same id again still works (the address may already name it).
  const fresh = other(bare);
  recordStart(fresh, 'root', 'session_root2', { log: quiet });
  // handover confirm: BOB moved after ROOT's read.
  const r2 = other(bare);
  recordStart(r2, 'bob', B1, { log: quiet });
  assert.equal(readAddress(r2).bob.session, B1);
  handoverConfirm(other(bare), B2, { log: quiet });
  assert.throws(() => handoverConfirm(r2, 'session_bob3', { log: quiet }), /refused: bob's address moved to session_bob2 while handover confirm ran/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/bob.json')).session, B2);
});


// Rigg desk entered 5 mallets on the sheet.

const io = (head, contents = {}, tracked = []) => ({
  slug: 'o/r',
  read: (_s, n) => ({ number: Number(n), title: 'T', base: { ref: 'tranche' }, head: { ref: head, sha: 'abc1234567890' } }),
  files: () => ['src/alpha/a.mjs'],
  contents: (_s, path) => contents[path] ?? null,
  notes: () => [],
  tracked: (_s, path) => tracked.includes(path),
});

test('#9: a job\'s brief names p3 test <id> as the suite and lists the generated paths as built, not committed', () => {
  const root = makeRepo({ 'README.md': 'x\n', 'process/config.json': { generated: [
    { paths: ['build/rows.mjs', 'dist/big.bundled.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', 'gen.mjs', '--check'] },
  ] } });
  const text = reviewBrief(root, '7', { log: quiet, io: io('job/alpha', { 'process/ledger/alpha.json': { requirements: 'req/alpha.md' }, 'req/alpha.md': '- **R1** x\n' }, ['dist/big.bundled.mjs']) });
  assert.match(text, /run the module's suite as the gate does: `node \.process\/tool\/p3\.mjs test alpha` from the checkout's root, never a bare `node --test`/);
  assert.match(text, /Built, not committed[^\n]*`build\/rows\.mjs`\./);
  assert.match(text, /Generated and committed[^\n]*`dist\/big\.bundled\.mjs`/);
  assert.doesNotMatch(text, /or the module's own suite/);
  // The process repository's own pull request keeps its suite line.
  const plain = reviewBrief(root, '8', { log: quiet, io: io('build/x') });
  assert.match(plain, /`node --test 'tool\/test\/\*\.test\.mjs'` here/);
  assert.doesNotMatch(plain, /p3\.mjs test/);
});

test('survival: a merge commit missing from a shallow clone is unmeasured, not reverted', () => {
  const root = makeRepo({ 'a.txt': 'x' });
  const merged_at = '2026-01-01T00:00:00Z';
  assert.equal(survival(root, { merge_sha: 'e'.repeat(40), merged_at }, 'main').state, 'unmeasured');
  const off = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '--orphan', 'side'], { cwd: root });
  commit(root, { 'b.txt': 'y' });
  assert.equal(survival(root, { merge_sha: off, merged_at }, 'side').state, 'reverted', 'present but off the branch');
  assert.equal(survival(root, { merge_sha: off, merged_at }, 'main').state, 'survived');
});

test('found: a local found/<module>-f<n> branch not yet pushed takes its number', () => {
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | base | q2 |\n',
    'build/requirements/q2.md': '- **R1** met\n',
    'process/config.json': {},
    'process/ledger/q2.json': entry('q2', { requirements: 'build/requirements/q2.md' }),
  });
  openPassed(root);
  git(['branch', 'tranche'], { cwd: root });
  assert.equal(found(root, 'q2', 'one', { offline: true, log: quiet }).mark, 'F1');
  git(['branch', 'found/q2-f1'], { cwd: root }); // the printed act's git switch -c, not pushed
  assert.equal(found(root, 'q2', 'two', { offline: true, log: quiet }).mark, 'F2');
});

// ===== file: triggers.test.mjs =====

// Review triggers (Bob, 4 Nov, about 19:05): a security path changed, or a test deleted or
// loosened, makes a job's merge refuse --no-review; every merge row records what fired and what the
// review found. Run end to end: a real repository and origin, merge() and review brief as BOB runs them.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { merge, reviewMeasures, reviewRounds } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { reviewBrief } from '../lib/review.mjs';
import { assertCounts, globRe, matchPath, reviewTriggers, triggerSummary } from '../lib/triggers.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const TEST_BASE = "import assert from 'node:assert/strict';\ntest('a', () => {\n  assert.equal(f(), 45);\n  assert.ok(g());\n});\n";

// A product whose tranche holds module alpha with a test and a security list; the job branch
// changes them as `job` says. config: the tranche's process/config.json.
function setup(job, config = { review_triggers: { security_paths: ['src/alpha/acts.mjs', 'src/gate/**'] } }) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'process/config.json': config,
    'src/alpha/a.mjs': 'export const f = () => 45;\n',
    'src/alpha/acts.mjs': 'export const ACTS = ["a", "b"];\n',
    'test/alpha/a.test.mjs': TEST_BASE,
    'test/alpha/b.test.mjs': TEST_BASE,
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  job(root);
  const head = commit(root, { 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}

function io(head) {
  const calls = { merged: null };
  return {
    calls,
    io: {
      getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: head } }),
      comments: () => [
        { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
        { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 }] }), user: { login: BOT } },
      ],
      checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
      verify: (slug, r) => r.run_id === 11,
      mergePR: (slug, n, sha) => { calls.merged = sha; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}

const lastRow = (root) => {
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  git(['checkout', '-q', tip], { cwd: root });
  const r = readRows(root, 'alpha').at(-1);
  git(['checkout', '-q', 'main'], { cwd: root });
  return r;
};
const del = (f) => (root) => git(['rm', '-q', f], { cwd: root });
const reviewed = { reviewed: 'fresh reviewer: 1 fix, applied', rounds: 2, reviewMinutes: '12', reviewCostUsd: '0.84', findings: '1', actedOn: '1' };

test('a job that deletes a test file (PR 174) is refused --no-review, and merges --reviewed with the trigger and measures in its row', () => {
  const { root, head } = setup(del('test/alpha/b.test.mjs'));
  const f = io(head);
  assert.throws(() => merge(root, 5, { slug: 'o/r', io: f.io, noReview: 'small change', log: quiet }),
    /pull request 5 fires the review trigger test \(test files deleted: test\/alpha\/b\.test\.mjs\): --no-review is refused .*review brief 5/);
  assert.equal(f.calls.merged, null, 'nothing merged');
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], head, 'nothing pushed');
  const r = merge(root, 5, { slug: 'o/r', io: f.io, ...reviewed, log: quiet });
  assert.equal(r.merged, true);
  const row = lastRow(root);
  assert.deepEqual({ triggers: row.triggers, reviewed: row.reviewed, m: row.review_minutes, usd: row.review_usd, f: row.findings, a: row.findings_acted },
    { triggers: ['test'], reviewed: true, m: 12, usd: 0.84, f: 1, a: 1 });
});

test('a job that changes a listed security path (PR 95) is refused --no-review; a change to neither merges --no-review with triggers []', () => {
  const sec = setup((root) => commit(root, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  assert.throws(() => merge(sec.root, 6, { slug: 'o/r', io: io(sec.head).io, noReview: 'x', log: quiet }), /fires the review trigger security \(security paths changed: src\/alpha\/acts\.mjs\)/);
  const plain = setup((root) => commit(root, { 'src/alpha/a.mjs': 'export const f = () => 46;\n', 'test/alpha/a.test.mjs': TEST_BASE.replace('45', '46') }));
