// ===== file: rounds.mjs (continued) =====

// at its commit or after it: one cut before the walk, recorded later, does not carry what it walked
// (cold review of C43). A commit this clone lacks is read by the times alone.
const atOrAfter = (root, a, b) => a === b || !hasCommit(root, a) || !hasCommit(root, b) || git(['merge-base', '--is-ancestor', a, b], { cwd: root, allowFail: true }).code === 0;
export const releasesCut = (root, cfg, last) => jsonl(readState(root, cfg.state_branch, RELEASES_FILE)).filter((r) => r.row === 'dev-release' && r.tranche === cfg.tranche && r.conclusion === 'success' && String(r.at) > String(last.at) && atOrAfter(root, String(last.commit), String(r.commit))).at(-1) || null;
export const releaseWalks = (root, cfg) => jsonl(readState(root, cfg.state_branch, RELEASE_WALKS_FILE)).filter((r) => r.row === 'release-walk' && r.tranche === cfg.tranche && !onMain(root, String(r.commit)));

// ===== file: marks.test.mjs =====

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { overCap, requirementMarks, unmetIds } from '../lib/util.mjs';
import { isDebt } from '../lib/status.mjs';
import { markedIds } from '../lib/job.mjs';
import './helpers.mjs'; // no machine git config (C2)

// The one mark parser (util's requirementMarks), on the copy's real lines (build/requirements,
// copy tranche, 4 Nov). Status, layer close, the report, the cap and job complete all use it.
// A requirement line starts with `**R<id>**`; it is unmet when it holds `*(not yet met`
// anywhere on that line (the coordinator's ruling under P17, 4 Nov).
const copy = [
  // local-facts R23 and R25: a parenthetical, with one nested, between the id and the mark.
  '- **R23** (T53; N1257; DEC-404; DEC-151 (2); row 15; amends R10, R12) *(not yet met: T53; per C3)* **A team writes its facts.** `layerEntryDraft({section})` drafts.',
  '- **R25** (T53; N1257; DEC-404; amends R1, R2) *(not yet met: T53; per D2)* **A correction stays the team\'s.**',
  // Backticks and a cross-module id inside the parenthetical.
  '- **R52** (T53; K5571 (2); `public-read` R52) *(not yet met: T53)* text.',
  // The plain shape.
  '- **R36** *(not yet met: T40)* does x.',
  // acquisition R127: the mark at the line's end, after the bold title (333 such lines on the copy).
  '- **R127** (T53; N1259; K4403 (2)) **A piece is read in bounded slices and resumes after a stop.** Control: an uninterrupted run answers no `resume`. *(not yet met: T53)*',
  // Indented, and a numbered list.
  '  - **R7.1** (T40) **Nested.** *(not yet met: T41)*',
  '1. **R8** **Numbered.** *(not yet met: T42)*',
  // A mark on the requirement's wrapped continuation line is its own (C24).
  '- **R10** (T53)\n  (T53; N824, R136: for each entry it reaches, R38 also registers the row) *(not yet met: T53)*',
];
const unmet = ['R23', 'R25', 'R52', 'R36', 'R127', 'R7.1', 'R8', 'R10'];
const prose = [
  // Met: no mark on the line.
  '- **R24** (T53; N1257; DEC-404; amends R10) **Today\'s member-drafted rules are the team\'s layer.** Test: a rule.',
  // A status line that mentions the words, not starting with an id.
  '**Status** · In force. Last changed T46 (T46-9: R15 new); marked not yet met (T46).',
  // The words in prose after an id, not in the mark's italic form.
  '- **R9** (T40) is not yet met by anything; see R8.',
  // An id that is not first on its line, with the mark after it.
  'See **R11** *(not yet met: T40)* in the plan.',
  // The copy's own README rule line.
  '5. **An id is written exactly `**Rn**`**, first on its line. A requirement main does not yet meet is marked right after it: `*(not yet met: <row or entry>)*`.',
];

test('marks: a requirement line holding "*(not yet met" anywhere is unmet, in every reader', () => {
  const text = copy.join('\n');
  assert.deepEqual(unmetIds(text), unmet);
  assert.deepEqual(markedIds(text), unmet);
  assert.match(overCap({ requirements_cap: 1e9, requirements_cap_marks: 3 }, 'req/x.md', text), /8 unmet marks over 3/);
  // CRLF line ends read the same.
  assert.deepEqual(unmetIds(copy.join('\r\n')), unmet);
  // A lone \r ends a line too: R1 holds no mark.
  assert.deepEqual(unmetIds('- **R1** x\r- **R2** *(not yet met: T1)*'), ['R2']);
});

test('marks: prose that only mentions "not yet met" is not a mark', () => {
  for (const l of prose) assert.deepEqual(unmetIds(l), [], l);
  const both = requirementMarks([...copy, ...prose].join('\n'));
  assert.deepEqual(both.unmet, unmet);
  assert.deepEqual(both.all, [...unmet, 'R24', 'R9']);
});

test('marks: a long line without the mark is read in linear time', () => {
  const long = `- **R1** ${'(x) **y** '.repeat(50000)}`;
  const t = Date.now();
  assert.deepEqual(unmetIds(Array(20).fill(long).join('\n')), []);
  assert.ok(Date.now() - t < 2000);
});

// C24 (the coordinator, 7 Nov): BOB's record-core, layer 11. R92's mark sits on its indented
// `Control:` line, under numbered sub-items and a `Test:` line; the parser gave it to no
// requirement, so \`layer publish --test R92\` was refused and the job cited the test under
// --not-verified. R92's shape as the copy's tranche holds it (build/requirements/record-core.md),
// its long sentences cut.
const R92 = [
  '- **R91** (T53) **Before.** Test: x. Control: y.',
  '- **R92** (T53; N1257; K5458; C10; amends R25, R26) **A setting as of an instant.** `getSettingAt(name, at)` answers the value the setting `name` held at `at`.',
  '  1. **`at` is an instant, not a day.** It is a string of `record-grammar`\'s `ISO_TS_RE` form.',
  '  2. **Which row.** A whole-second `at` is read as the last millisecond of that second.',
  '  7. **Cost.** Writes: none. **Load per team (PLATFORM):** no new row per team.',
  '  Test: (a) `jurisdiction_profiles` set to `["a"]` answers `["a"]`; (h) 200 rows finish within the 2 s bar.',
  '  Control: `getSetting` and `getSetting(name, {strict: true})` answer exactly as R25, R83 and R84 state, and a call writes no row. *(not yet met: T53; PLATFORM)*',
  '',
  '**transact(fn) → fn\'s result**',
  '- **R32** Runs `fn` as one transaction over the whole store: when `fn` throws or returns a refusal',
  '  (`ok:false`), every row written inside it is rolled back.',
].join('\n');

test('marks: a mark on any sub-line of a requirement (Control, Test, a numbered item, a wrapped line) is its own: record-core R92', () => {
  assert.deepEqual(unmetIds(R92), ['R92']);
  assert.deepEqual(markedIds(R92), ['R92']);
  assert.deepEqual(requirementMarks(R92).all, ['R91', 'R92', 'R32']);
  // Struck on the Control line: no mark left (what layer publish --test R92 reads as struck).
  assert.deepEqual(unmetIds(R92.replace(' *(not yet met: T53; PLATFORM)*', '')), []);
  // Each sub-line shape carries it.
  for (const sub of ['  Test: x. *(not yet met: T1)*', '  1. **A.** y *(not yet met: T1)*', '\t(wrapped) *(not yet met: T1)*', '    deeper still *(not yet met: T1)*']) {
    assert.deepEqual(unmetIds(`- **R5** **Title.** x\n  Control: z.\n${sub}`), ['R5'], sub);
  }
  // An unindented line, or the next requirement, ends a requirement's sub-lines.
  assert.deepEqual(unmetIds('- **R5** x\nControl: z. *(not yet met: T1)*'), []);
  assert.deepEqual(unmetIds('- **R5** x\n  - **R6** y\n  Control: z. *(not yet met: T1)*'), ['R6']);
  assert.deepEqual(unmetIds('- **R5** x\r\n  Control: z. *(not yet met: T1)*'), ['R5']);
  // A heading's sub-lines are no requirement's.
  assert.deepEqual(unmetIds('**Status**\n  marked *(not yet met: T1)*'), []);
});

test('isDebt: an unmet requirement is debt only when every mark it holds, sub-lines included, is base-red', () => {
  assert.equal(isDebt('- **F1** *(not yet met: base-red T1)* x'), true);
  assert.equal(isDebt('- **F1** *(not yet met: base-red T1)* x\n  Control: y. *(not yet met: T2)*'), false);
  assert.equal(isDebt('- **R1** x\n  Control: y. *(not yet met: base-red T2)*'), true);
  assert.equal(isDebt('- **R1** x'), false);
});

// Cold review of C24: a loose list item's next paragraph, after a blank line, is the requirement's
// too (the copy's journey-check R13 and installer R48, each with its only mark there).
test('marks: a requirement\'s indented paragraph after a blank line is its own (journey-check R13, installer R48)', () => {
  const R13 = [
    '- **R13** (T49; N1099, N1100; DEC-241, DEC-245; amends R6) R6\'s comparison covers two things:',
    '  - design journey 29 ("From installing to a first conclusion", DEC-245), step by step;',
    '  - `/app/more` at 390 px, against `more` (DEC-241).',
    '',
    '  Every step of R9 and R10 is screenshotted (R2). Test: the pairs are made. *(not yet met: T49)*',
    '',
    '- **R14** (T49) next.',
    '',
    'Prose after the list, unindented. *(not yet met: T1)*',
  ].join('\n');
  assert.deepEqual(unmetIds(R13), ['R13']);
  assert.deepEqual(unmetIds(R13.replace(/\n/g, '\r\n')), ['R13'], 'CRLF');
  // An unindented line still ends it, blank lines or not.
  assert.deepEqual(unmetIds('- **R5** x\n\n\nControl: z. *(not yet met: T1)*'), []);
  // An indented note under a met requirement is that requirement's, whatever id it names (the rule).
  assert.deepEqual(unmetIds('- **R10** met\n  Note: R11 stays *(not yet met: T5)*'), ['R10']);
});

// Cold review of C24: the readers beside the parser read a requirement as it does.
test('marks: a found line put between a requirement and its marked sub-line is refused as a plain found-mark change', async () => {
  const { foundOnly } = await import('../lib/found.mjs');
  const base = '- **R92** thing\n  Control: y. *(not yet met: T1)*\n';
  const mid = '- **R92** thing\n- **F1** *(not yet met: walk x)* found\n  Control: y. *(not yet met: T1)*\n';
  const diff = '@@ -1,0 +2 @@\n+- **F1** *(not yet met: walk x)* found';
  assert.deepEqual(unmetIds(mid), ['F1'], 'the F line takes R92\'s sub-line');
  assert.match(foundOnly(diff, base, mid).why, /leaves R92 met/);
  const end = `${base}- **F1** *(not yet met: walk x)* found\n`;
  assert.deepEqual(foundOnly('@@ -2,0 +3 @@\n+- **F1** *(not yet met: walk x)* found', base, end), { ok: true, added: ['F1'] });
});

test('marks: a mark struck or retired on a sub-line is a change of that requirement (provider notices, splits)', async () => {
  const { changedIds, retiredIds } = await import('../lib/notice.mjs');
  const before = '- **R91** a\n- **R92** thing\n  Control: y. *(not yet met: T1)*\n';
  assert.deepEqual(changedIds(before, before.replace(' *(not yet met: T1)*', '')), ['R92']);
  assert.deepEqual(retiredIds(before, before.replace('*(not yet met: T1)*', '*(retired: to x R1)*'), ['R92']), ['R92']);
  // An id written mid-line (the copy's ooxml) is still read.
  assert.deepEqual(changedIds('- `f()` — **R1** a\n', '- `f()` — **R1** b\n'), ['R1']);
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


// The Stane store took in 5 cod.

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

// ===== file: suite-budget.test.mjs =====

// status --role bob (build ci-budget, R2; Bob: "go R2"): a module whose gate suite took over 70%
// of suite_timeout_minutes, by the newest gate row on this tranche's pull requests, is one line
// among the acts, naming the module and the figure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commit, makeRepo, onState } from './helpers.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { BOT, GATE, block } from '../lib/github.mjs';
import { SUITE_BUDGET, suiteBudget } from '../lib/status.mjs';

const jl = (...rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
const at = (h) => new Date(Date.UTC(2026, 10, 6, h)).toISOString();
const row = (h, over) => ({ at: at(h), ok: true, trigger: 'code', suite: 'pass', ...over });

function repo(config = {}) {
  const root = makeRepo({ 'README.md': 'x\n', 'process/config.json': config });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/m.jsonl': jl(
    { at: at(0), module: 'old', row: 'merge', pr: 9 },
    { at: at(5), module: 'plane', row: 'merge', pr: 11 },
    { at: at(6), module: 'lib', row: 'merge', pr: 12 },
  ) }, 'record');
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  onState(root, { 'metrics/tranche-open.jsonl': jl({ row: 'grant', tranche: 'tranche', at: at(1), act: 'push', depth: 1, outcome: 'ok' }) });
  return root;
}
const reader = (runs) => (pr) => [{ user: { login: BOT }, body: block(GATE, { runs: runs[pr] || [] }) }];

test('suite budget: a module over 70% of suite_timeout_minutes is named with its figure; under it, or before the opening, is not', () => {
  assert.equal(SUITE_BUDGET, 0.7);
  const root = repo({ suite_timeout_minutes: 20 });
  const runs = {
    9: [row(0, { suite_by_module: { old: 19 * 60 } })], // merged before the tranche opened
    11: [row(2, { suite_by_module: { plane: 19 * 60 } }), row(4, { suite_by_module: { plane: 15 * 60, lib: 60 } })], // newest: 15 of 20
    12: [row(3, { scope: ['lib'], suite_seconds: 13 * 60 })], // a row from before suite_by_module: 13 of 20, 65%
    40: [row(7, { suite: 'fail', suite_by_module: { cli: 16.5 * 60 } })], // an open job PR, red
    41: [row(7, { suite: 'skipped', suite_by_module: { web: 19 * 60 } })], // no suite ran
  };
  const rows = [{ id: 'cli', pr: '#40 ready' }, { id: 'web', pr: '#41 draft' }, { id: 'done', pr: 'merged' }];
  const got = suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows });
  assert.deepEqual(got, [
    `suite budget: cli's gate suite took 16.5 min, 83% of suite_timeout_minutes 20 (over 70%; PR 40, gate row ${at(7)}): speed or split its suite before it times out`,
    `suite budget: plane's gate suite took 15 min, 75% of suite_timeout_minutes 20 (over 70%; PR 11, gate row ${at(4)}): speed or split its suite before it times out`,
  ]);
  // A newer run of only some of a module's tests (requirements-only) does not hide its full suite.
  runs[11].push(row(6, { suite_by_module: { plane: 60 }, requirements_only: [{ module: 'plane', files: ['t/a.test.mjs'] }] }));
  assert.ok(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows }).some((l) => l.startsWith('suite budget: plane\'s gate suite took 15 min')));
  // A row's whole-run seconds count for a module only when it ran that module alone.
  runs[12] = [row(3, { scope: ['lib', 'plane'], suite_seconds: 19 * 60 })];
  assert.equal(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows }).some((l) => l.includes('lib\'s')), false);
  runs[12] = [row(3, { scope: ['lib'], suite_seconds: 14.5 * 60 })];
  assert.match(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows }).find((l) => l.includes('lib\'s')), /lib's gate suite took 14\.5 min, 73% of suite_timeout_minutes 20/);
  // The default limit is 20; a smaller one names smaller suites.
  const tight = repo({ suite_timeout_minutes: 10 });
  assert.equal(suiteBudget(tight, loadConfig(tight), { tranche: 'origin/tranche', comments: reader({ 12: [row(3, { suite_by_module: { lib: 7.5 * 60 } })] }), rows: [] })[0].startsWith('suite budget: lib\'s gate suite took 7.5 min, 75% of suite_timeout_minutes 10'), true);
  // Unread: null, so status says so instead of guessing.
  assert.equal(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => { throw new Error('unread'); }, rows }), null);
  assert.equal(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => null, rows }), null);
});

// ===== file: layerbase.mjs =====

// The shared layer branch and the job's base (design note "Shared Layer Branch", Bob, 5 Nov; the
// only flow since the merge train was removed, Bob, 6 Nov). A job of the open layer's module works
// on a branch cut from layer/<n>, publishes onto it, and the layer merges into the tranche once.
// process/config.json "merge_strategy" is "layer" (or absent), or "direct" (PD-25, Bob, 9 Nov: every
// job based on the tranche, its rows under layerflow/direct-<tranche>/; direct.mjs).
// This file has no imports from job.mjs, so job.mjs can read it.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exists, fail, fetchBranch, git } from './util.mjs';
import { fetchState, readState } from './state.mjs';

export const STRATEGIES = ['layer', 'direct'];
export const layerMode = (cfg) => (cfg?.merge_strategy ?? 'layer') === 'layer';
// PD-25: the direct flow. Every job's base is the tranche; its flow rows (start, run, test, land,
// reschedule, gate, retest) sit under one key per tranche, layerflow/direct-<tranche>/, so the layer
// flow's row readers and writers serve it unchanged.
export const directMode = (cfg) => cfg?.merge_strategy === 'direct';
export const directKey = (tranche) => `direct-${String(tranche).replace(/[^A-Za-z0-9._-]+/g, '-')}`;
// The branch a flow job publishes onto: its layer's, or under the direct flow the tranche itself.
export const flowBase = (cfg) => (cfg.layer?.direct ? cfg.layer.tranche : cfg.tranche);
export const LAYER_BRANCH = /^layer\/(\d+)$/;
export const layerBranch = (n) => `layer/${n}`;
export const layerOfBranch = (b) => { const m = String(b || '').match(LAYER_BRANCH); return m ? Number(m[1]) : null; };
// The branch layer sync <n> opens its pull request from (layerflow.mjs layerSync): layer-sync/<n>-<the
// tranche tip's first 10 hex>, with -<k> for a later attempt. The layer it syncs, or null.
export const SYNC_BRANCH = /^layer-sync\/(\d+)-[0-9a-f]{10}(?:-\d+)?$/;
export const syncOfBranch = (b) => { const m = String(b || '').match(SYNC_BRANCH); return m ? Number(m[1]) : null; };
// The branch layer pin <n> opens its pull request from (PD-23, layerflow.mjs layerPin): layer-pin/<n>-<the
// new pin's first 10 hex>, -<k> for a later attempt; one commit on the layer moving only the pin files.
export const PIN_BRANCH = /^layer-pin\/(\d+)-[0-9a-f]{10}(?:-\d+)?$/;
export const pinOfBranch = (b) => { const m = String(b || '').match(PIN_BRANCH); return m ? Number(m[1]) : null; };
// The state branch's files of the layer flow: one file per event, added and never edited, so two
// writers never conflict (as notices/).
export const FLOW_DIR = 'layerflow';
export const flowFile = (n, kind, name) => (name === undefined ? `${FLOW_DIR}/${n}/${kind}.json` : `${FLOW_DIR}/${n}/${kind}/${name}.json`);
export const safeName = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, '-');

// The layer map (layers_file): [{ n, mods }], the same table status.mjs layerState reads.
export function layerMap(text) {
  if (text === null || text === undefined) return [];
  return String(text).split('\n').map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
    .filter((c) => c.length > 1 && /^\d+$/.test(c[0]))
    .map((c) => ({ n: Number(c[0]), mods: c.at(-1).replace(/[`*]/g, '').split(',').map((m) => m.trim()).filter(Boolean) }))
    .sort((a, b) => a.n - b.n);
}
export function layersAt(root, cfg, ref) {
  let text = null;
  if (ref) text = exists(root, ref, cfg.layers_file) ? git(['show', `${ref}:${cfg.layers_file}`], { cwd: root }) : null;
  else if (existsSync(join(root, cfg.layers_file))) text = readFileSync(join(root, cfg.layers_file), 'utf8');
  const map = layerMap(text);
  return map.length ? [...map, ...completionLayers(root, cfg, map)] : map;
}
// The layers past the map, each read from its open row, so the product's layer map is never edited:
// - a completion layer (PLN-4 as it stood; PD-12; C33), its modules completion_file's open items'
//   (completion: { file, items, mods }). Layer 12 on the copy is the last: BD-R1 (Bob, 8 Nov)
//   retires the path once it merges, and no new one opens (layerflow.mjs roundLayer);
// - a round layer (BD-R1, rounds.mjs): a later round's pass over one map layer, its modules the
//   flawed ones there (round: { n, of, items, mods, walk }).
// Each takes the next number, so its branch layer/<n> and its rows layerflow/<n>/ are its own.
export function completionLayers(root, cfg, map) {
  const out = [];
  if (!cfg?.state_branch) return out;
  for (let k = (map.at(-1)?.n ?? 0) + 1; ; k++) {
    let row = null;
    try { row = JSON.parse(readState(root, cfg.state_branch, flowFile(k, 'open')) || 'null'); } catch { row = null; }
    const comp = Array.isArray(row?.completion?.mods);
    const round = Array.isArray(row?.round?.mods);
    if (!comp && !round) break;
    // An earlier tranche's layer past the map is not this one's (cold review of C33).
    if (row.tranche && cfg.tranche && row.tranche !== cfg.tranche) break;
    out.push(comp ? { n: k, mods: row.completion.mods, completion: row.completion } : { n: k, mods: row.round.mods, round: row.round });
  }
  return out;
}
// The round a layer belongs to (BD-R1): a round layer's own; the map's layers and the completion
// layer are round 1's (Bob, 8 Nov: "Finish, then switch": layer 12 finishes as this round's work).
export const roundOf = (L) => L?.round?.n ?? 1;
// How a round layer is named wherever a person or a session reads it (Bob, 9 Nov, on "layer 13":
// "I thought there is no layer 13 any more"; "layers are in rounds which are in tranches"): the
// hierarchy, outermost first, the layer the plan's, and the tool's running number in parentheses
// for the commands that take it: "tranche T53 · round 2 · layer 11 (internal layer 13)"; the
// tranche left off where the reader has it already (status, headed by it).
export const roundLayerName = (r, of, n, tranche = null) => `${tranche ? `tranche ${tranche} · ` : ''}round ${r} · layer ${of} (internal layer ${n})`;
// How a layer is named in the flow's lines: a map layer "layer 3"; a round layer as above.
export const layerName = (L, n = L?.n, tranche = null) => (L?.round ? roundLayerName(L.round.n, L.round.of, n, tranche) : `layer ${n}`);
export const layerOf = (layers, id) => layers.find((L) => L.mods.includes(id))?.n ?? null;
// Every layer listing a module, newest first (a completion layer past the map reopens a module of an
// earlier layer, C33; a map may list a module twice).
export const layersOf = (layers, id) => layers.filter((L) => L.mods.includes(id)).map((L) => L.n).reverse();

const hasRef = (root, r) => git(['rev-parse', '-q', '--verify', r], { cwd: root, allowFail: true }).code === 0;

// The config a job's commands run with. For a module of no open layer branch, the config itself
// (with noLayers when the product has no layer map at all). With it on, for a module of a layer whose branch layer/<n> exists
// (on origin, or locally with push false) and has not merged (the state branch's merged row): the
// layer branch takes the tranche's place in the job's start, sync, complete and test, and
// `layer` names it ({ n, tranche: the real tranche }).
export function jobCfg(root, cfg, id, { push = true, merged = null } = {}) {
  // PD-25: the tranche stays the base; `layer` names the tranche's flow key (no layer branch).
  if (directMode(cfg) && !cfg.layer) return { ...cfg, layer: { n: directKey(cfg.tranche), tranche: cfg.tranche, direct: true } };
  if (!layerMode(cfg) || cfg.layer) return cfg;
  const tr = push ? `refs/remotes/origin/${cfg.tranche}` : `refs/heads/${cfg.tranche}`;
  // The state branch first: a completion layer's modules are read from its open row (C33).
  if (push && cfg.state_branch) { try { fetchState(root, cfg.state_branch); } catch { /* read what the clone holds */ } }
  const map = layersAt(root, cfg, hasRef(root, tr) ? tr : null);
  // A product with no layer map has no layer to branch from: its jobs keep the tranche (noLayers).
  if (!map.length) return { ...cfg, noLayers: true };
  // Its own layer first; else a layer it joined (layer join: a module whose layer is behind the open
  // one joins the next to open), each only while its branch exists and has not merged.
  const live = (n) => {
    const b = layerBranch(n);
    if (push) fetchBranch(root, b, { allowFail: true });
    if (!hasRef(root, push ? `refs/remotes/origin/${b}` : `refs/heads/${b}`)) return false;
    return !(merged ? merged(n) : push ? mergedOnState(root, cfg, n) : false);
  };
  const listed = layersOf(map, id);
  const n = [...listed, ...joinedLayers(root, cfg, id)].find((x) => x !== null && live(x));
  if (n === undefined) return cfg;
  return { ...cfg, tranche: layerBranch(n), layer: { n, tranche: cfg.tranche, ...(!listed.includes(n) ? { joined: true } : {}) } };
}
// The layers a module joined, from the state branch's layerflow/<n>/join/<id>.json rows, lowest first.
function joinedLayers(root, cfg, id) {
  const sb = `refs/remotes/origin/${cfg.state_branch}`;
  const r = git(['ls-tree', '-r', '--name-only', sb, '--', `${FLOW_DIR}/`], { cwd: root, allowFail: true });
  if (r.code !== 0) return [];
  const want = `/join/${safeName(id)}.json`;
  return r.stdout.split('\n').filter((f) => f.endsWith(want)).map((f) => Number(f.split('/')[1])).filter(Number.isInteger).sort((a, b) => a - b);
}
function mergedOnState(root, cfg, n) {
  const sb = cfg.state_branch;
  const f = git(['fetch', '-q', 'origin', `+refs/heads/${sb}:refs/remotes/origin/${sb}`], { cwd: root, allowFail: true });
  if (f.code !== 0) return false;
  return git(['cat-file', '-e', `refs/remotes/origin/${sb}:${flowFile(n, 'merged')}`], { cwd: root, allowFail: true }).code === 0;
}
export const refuseInLayer = (cfg, what) => { if (cfg.layer && !cfg.layer.direct) fail(`${what} is not part of the layer flow (merge_strategy "layer", ${cfg.tranche}): start the job plainly, or ask BOB`); };

// ===== file: cap.mjs =====

// job start <id> (not a restart, which replaces a session): the job cap, the account's job
// sessions working toward publish against the cap less the slots recorded holds keep (hold.mjs).
// A published job holds no slot unless its gate went red (PD-7, slots.mjs).
import { readHolds, slotsHeld } from './hold.mjs';
import { isArchived, liveJobIds, readSessions, sessionsCount } from './status.mjs';
import { fail, jobCap, loadConfig, repoSlug } from './util.mjs';
import { budgetGate } from './pace.mjs';
import { publishedJobs, slotNote, slotUse } from './slots.mjs';
import { flowRows, readOpenLayer } from './layerflow.mjs';

// The live count comes from evidence only (C28, the coordinator, 8 Nov: on the copy BOB's start
// script passed --live 20, a number it typed, and the check refused on the cap while 15 of 20
// slots were empty, 73 min of idle capacity on layer 11): the list_sessions result, counted by the
// sweep's rule (status.mjs jobCount), less the published jobs PD-7 frees. A bare --live is refused.
export const SESSIONS_NEEDED = 'job start <id> --sessions <file>: your list_sessions result saved as JSON (list_sessions, newest first, as status --role bob asks for it); the job cap is counted from it, never from a number typed (--live is not taken)';
export function capCheck(root, { live, sessions, io = {}, log = () => {} } = {}) {
  if (sessions === undefined || sessions === true) fail(live !== undefined ? `--live ${live === true ? '' : live} is not taken: ${SESSIONS_NEEDED}` : SESSIONS_NEEDED);
  const listed = readSessions(sessions, { root });
  if (live !== undefined) log(`--live ${live} ignored: the job sessions are counted from --sessions`);
  const n = sessionsCount(listed, undefined, () => {});
  const cfg = loadConfig(root);
  const { cap } = jobCap(cfg);
  let held = 0;
  // A slot just held counts (cold review of R17f): the holds read fresh.
  try { held = slotsHeld(readHolds(root, cfg.state_branch, { fresh: true })); } catch { held = 0; }
  // A new session is a GitHub-heavy act: none while GitHub's own count is at the target (PD-22, pace.mjs).
  const gate = budgetGate(root);
  if (gate) fail(`${gate}; nothing was started`);
