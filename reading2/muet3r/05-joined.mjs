// ===== file: marks.test.mjs (continued) =====

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

// ===== file: ledger-count.test.mjs =====

// The account-wide count (R17e; coordinator's C9 and C10, 7 Nov): every clone that reads one ledger
// computes the same budget (each cloud container is hostname "vm" with the same paths, so the name
// alone made every session's copy clone one clone, and each dropped the others' rows); the ledger
// branch's own pushes are counted from its history, each push marking its commit (a source no
// share can drift); and a usage share is never a push of its own unless it must be (bookkeeping is
// never the dominant traffic).
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { remoteStore, shareUsage, statePushes, stateShare } from '../lib/ghshare.mjs';
import { cloneId, commonDir, PACING_DEFAULTS, PENDING_AT, readLog, reserve, sharesOf, usage, useShared } from '../lib/pace.mjs';
import { flushState, pendingWrites, stateBatch, stateReplay, writeState } from '../lib/state.mjs';
import { git, PUSH_TRAILER } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const P = { ...PACING_DEFAULTS, gh_interval_ms: 0 };
const URL = 'https://github.com/o/ledger.git';
function env(t) {
  const was = { log: process.env.P3_GITHUB_LOG, s: process.env.CLAUDE_CODE_SESSION_ID };
  // Each clone its own log, in its git directory, as in a session.
  delete process.env.P3_GITHUB_LOG;
  t.after(() => { useShared(null); for (const [k, v] of [['P3_GITHUB_LOG', was.log], ['CLAUDE_CODE_SESSION_ID', was.s]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
}
// A ledger on a bare repository that the clones reach by its GitHub name (url.insteadOf), so the
// repository each push names is the ledger's.
function ledger() {
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-ledger-')), 'l.git');
  git(['init', '-q', '--bare', bare], { cwd: tmpdir() });
  const clone = () => { const r = makeRepo({ 'README.md': 'x\n' }); git(['config', `url.${bare}.insteadOf`, URL], { cwd: r }); return r; };
  return { bare, clone };
}
const as = (session, fn) => { process.env.CLAUDE_CODE_SESSION_ID = session; return fn(); };
const content = (root, n) => { for (let i = 0; i < n; i++) reserve({ points: 5, content: 1 }, 'gh pr comment', root, { p: P }); };

test('two clones, one ledger: the same budget; each push of the ledger branch counted once, from its history', (t) => {
  env(t);
  const { clone } = ledger();
  const a = clone();
  const b = clone();
  assert.notEqual(cloneId(a), cloneId(b));
  assert.ok(existsSync(join(commonDir(a), 'p3-clone-id')), 'a random id kept in the clone');
  as('cse_a', () => { content(a, 5); shareUsage(a, null, { force: true, store: remoteStore(a, URL) }); });
  as('cse_b', () => { content(b, 3); shareUsage(b, null, { force: true, store: remoteStore(b, URL) }); });
  // Each clone also made a push of its own that no share carried yet.
  as('cse_a', () => reserve({ push: true, points: 0, content: 0 }, 'push job/a', a, { p: P, kind: 'push', extra: { repo: 'o/product' } }));
  const view = (root) => { const sh = stateShare(root, null, { url: URL }); const s = sh.read({ fresh: true }); return { s, u: usage(root, { seconds: 3600, read: s }) }; };
  const A = view(a);
  const B = view(b);
  assert.equal(A.u.content, 8);
  assert.equal(B.u.content, 8, 'the other clone sees the same content count');
  // The ledger's two share pushes, from its history, each stamped by the session that made it.
  assert.deepEqual(A.s.state.pushes.map(([, who]) => who).sort(), ['cse_a', 'cse_b']);
  assert.equal(A.u.pushes_by['o/ledger#state'], 2);
  assert.equal(B.u.pushes_by['o/ledger#state'], 2);
  // a's own unshared push counts in a; b sees it once a shares it.
  assert.equal(A.u.pushes, 3);
  assert.equal(B.u.pushes, 2);
  as('cse_a', () => shareUsage(a, null, { force: true, store: remoteStore(a, URL) }));
  const A2 = view(a);
  const B2 = view(b);
  assert.equal(A2.u.pushes, B2.u.pushes, `the same pushes in both clones: ${A2.u.pushes} vs ${B2.u.pushes}`);
  assert.equal(A2.u.pushes, 4, 'three ledger pushes and job/a, each once');
  assert.equal(A2.u.content, B2.u.content);
});

test('a ledger commit from before the mark counts one push per second of commit time; a stamped one, one push each', () => {
  const r = makeRepo({});
  const at = (s, msg) => { git(['commit', '-q', '--allow-empty', '-m', msg], { cwd: r, env: { GIT_COMMITTER_DATE: `${s} +0000`, GIT_AUTHOR_DATE: `${s} +0000` } }); };
  const t0 = Math.floor(Date.now() / 1000) - 100;
  // One coalesced push from before R17e: three commits in one second.
  at(t0, 'a'); at(t0, 'b'); at(t0, 'c');
  at(t0 + 5, 'legacy share');
  // Two marked pushes; the first carried an unmarked commit made with it (its push marks its last).
  at(t0 + 28, 'carried');
  at(t0 + 30, `x\n\n${PUSH_TRAILER}: cse_1`);
  at(t0 + 30, `y\n\n${PUSH_TRAILER}: cse_2`);
  const st = statePushes(r, 'HEAD', 'o/l', (t0 - 10) * 1000);
  assert.deepEqual(st.pushes.map(([ms, who]) => [ms / 1000 - t0, who]).sort((p, q) => p[0] - q[0] || String(p[1]).localeCompare(String(q[1]))), [[0, null], [5, null], [30, 'cse_1'], [30, 'cse_2']]);
  assert.equal(st.tip_at, (t0 + 30) * 1000);
});

test('a share is no push of its own: it rides the command\'s push; alone, at most every 15 min and only with content or a push to report', (t) => {
  env(t);
  const { clone, bare } = ledger();
  const a = clone();
  const store = remoteStore(a, URL);
  const pushes = () => Number(git(['rev-list', '--count', 'refs/heads/process-state'], { cwd: bare, allowFail: true }).stdout.trim() || 0);
  let off = 0;
  const now = () => Date.now() + off;
  as('cse_a', () => {
    content(a, 1);
    assert.ok(shareUsage(a, null, { force: true, store, now, ledgerRepo: 'o/ledger' }) >= 1);
    const n0 = pushes();
    // Reads only (no content, no push), 16 min on: not shared alone.
    reserve({ points: 1, content: 0 }, 'gh pr view', a, { p: P });
    off = 16 * 60e3;
    assert.equal(shareUsage(a, null, { store, now, ledgerRepo: 'o/ledger' }), 0, 'reads alone are no reason to push');
    // Content, 5 min after the last share: not yet.
    content(a, 1);
    off = 0;
    assert.equal(shareUsage(a, null, { store, now: () => Date.now() + 5 * 60e3, ledgerRepo: 'o/ledger' }), 0, 'at most every 15 min');
    assert.equal(pushes(), n0);
    // 16 min on, with content: shared, one push.
    off = 16 * 60e3;
    assert.ok(shareUsage(a, null, { store, now, ledgerRepo: 'o/ledger' }) >= 1);
    assert.equal(pushes(), n0 + 1);
    // Riding the command's push (pending), at its end: shared whatever it holds, at once.
    reserve({ points: 1, content: 0 }, 'gh pr view', a, { p: P });
    assert.ok(shareUsage(a, null, { store, now, pending: 1, atEnd: true, ledgerRepo: 'o/ledger' }) >= 1);
  });
});

test('the ledger read is cheap (C12): within 30 s nothing is asked of GitHub; past it, ls-remote, and a fetch only when the ledger moved', (t) => {
  env(t);
  const { clone, bare } = ledger();
  const a = clone();
  const b = clone();
  as('cse_b', () => { content(b, 1); shareUsage(b, null, { force: true, store: remoteStore(b, URL) }); });
  let off = 0;
  const sh = stateShare(a, null, { url: URL, now: () => Date.now() + off });
  const seen = () => readLog(a).filter((r) => r.kind === 'fetch').map((r) => r.what.split(' ')[0]);
  sh.read({ fresh: true });
  assert.deepEqual(seen(), ['ls-remote', 'fetch'], 'first read: asked, then fetched');
  for (let i = 0; i < 5; i++) sh.read();
  // A second process of the clone reads the disk cache.
  stateShare(a, null, { url: URL, now: () => Date.now() + off }).read();
  assert.equal(seen().length, 2, 'within READ_S: no network');
  off = 31e3;
  sh.read();
  assert.deepEqual(seen().slice(2), ['ls-remote'], 'past it, unmoved: no fetch');
  as('cse_b', () => { content(b, 1); shareUsage(b, null, { force: true, store: remoteStore(b, URL) }); });
  off = 62e3;
  const s = sh.read();
  assert.deepEqual(seen().slice(3), ['ls-remote', 'fetch'], 'moved: fetched');
  assert.equal(usage(a, { seconds: 3600, read: s }).content, 2);
  assert.ok(bare);
});

test('cold review of R17e: a riding share is made at most once a minute during a command; another repository\'s state push is shared alone', (t) => {
  env(t);
  const { clone } = ledger();
  // A product clone whose state branch is its own ledger, writes coalesced as in a command.
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const cfg = { state_branch: 'process-state' };
  stateBatch(true);
  try {
    as('cse_p', () => {
      content(root, 1);
      writeState(root, 'process-state', 'a write of the command', (wt) => { writeFileSync(join(wt, 'x.txt'), 'x'); return {}; });
      assert.ok(shareUsage(root, cfg, { pending: pendingWrites() }) >= 1);
      content(root, 1);
      assert.equal(shareUsage(root, cfg, { pending: pendingWrites() }), 0, 'not again within the minute, though the first is not pushed yet');
      assert.ok(shareUsage(root, cfg, { pending: pendingWrites(), atEnd: true }) >= 1, 'at the command\'s end, whatever the minute');
      flushState();
    });
  } finally { stateBatch(false); }
  assert.ok(sharesOf(root).every((x) => x.at !== PENDING_AT), 'settled by the push');
  // A process3 clone (remote ledger): a push of its own state branch, another repository's, is shared alone.
  const a = clone();
  as('cse_q', () => {
    reserve({ push: true, points: 0, content: 0 }, 'push process-state', a, { p: P, kind: 'push', extra: { repo: 'o/process3', state: true } });
    assert.ok(shareUsage(a, null, { store: remoteStore(a, URL), ledgerRepo: 'o/ledger' }) >= 1);
  });
});

test('a share kept by a refused flush is settled when state replay pushes it: its rows are not counted twice', (t) => {
  env(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const cfg = { state_branch: 'process-state' };
  stateBatch(true);
  try {
    as('cse_r', () => {
      content(root, 2);
      writeState(root, 'process-state', 'a write of the command', (wt) => { writeFileSync(join(wt, 'x.txt'), 'x'); return {}; });
      assert.ok(shareUsage(root, cfg, { pending: pendingWrites(), atEnd: true }) >= 1);
      // The account stopped: the command's push is refused, its writes kept for replay.
      useShared({ read: () => ({ pause: { at: '2026-11-07T00:00:00Z', until: '2026-11-07T00:01:00Z', why: 'x', stopped: true }, use: [] }), pause: () => null });
      assert.throws(() => flushState(), /state replay/);
      useShared(null);
    });
  } finally { stateBatch(false); }
  assert.ok(sharesOf(root).some((x) => x.at === PENDING_AT), 'pending while its push is held');
  stateReplay(root, 'process-state', [], { log: () => {} });
  assert.ok(sharesOf(root).every((x) => x.at !== PENDING_AT), 'settled by the replay');
});

// ===== file: register.test.mjs =====

// Triage registers (register.mjs, AUD-8, AUD-9): an entry brings options with context first and is
// printed nowhere; once its short-term response is chosen, the response and its end condition are
// printed verbatim into the starting prompt of each role it names, and leave it on close; a
// long-term entry is printed nowhere.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SEED_ENTRY, makeRepo, processRegisterFixture } from './helpers.mjs';
import { recordStart, startRole } from '../lib/roles.mjs';
import { startText } from '../lib/job.mjs';
import { laneStart } from '../lib/lane.mjs';
import { PROCESS_ROOT, STANDING_CAP, parseRegister, processRegister, standingBlock, standingFor, triageAdd, triageChoose, triageClose, triageList } from '../lib/register.mjs';
import { git, loadConfig } from '../lib/util.mjs';

processRegisterFixture([SEED_ENTRY]);
const quiet = () => {};
const R = 'session_01rootrootroot';
const CFG = { tranche: 'tranche', lanes: [{ name: 'triage', dir: 'triage', kind: 'triage' }] };
const SHORT = {
  kind: 'short-term',
  problem: 'Gate runs queue behind product builds.',
  evidence: 'copy, 5 Nov: 6 gate runs waited over 20 minutes.',
  option: ['Run at most two product builds at once; process3 gate runs go first.', 'Keep one queue.'],
  context: ['Gate runs stop waiting; product builds take longer.', 'Today\'s order; gate runs keep waiting.'],
};
const CHOICE = {
  response: 'Run at most two product builds at once; process3 gate runs go first.',
  'chosen-by': 'Bob, 6 Nov: "the first"',
  end: 'for 2 hours no gate run waits over 5 minutes.',
  affects: 'bob,coordinator',
};
// An entry added and chosen, as the lane does it.
const addChosen = (root, add = SHORT, choice = CHOICE, opts = { log: quiet }) => {
  const e = triageAdd(root, loadConfig(root), add, opts);
  return triageChoose(root, loadConfig(root), e.id, choice, opts);
};

function product() {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': CFG, 'triage/README.md': 'the product triage lane\n' });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'lane/triage', 'tranche'], { cwd: root });
  return root;
}
// The lane's pull request, landed: its branch merged into the tranche on origin.
function land(root) {
  git(['push', '-q', 'origin', 'lane/triage:tranche'], { cwd: root });
}
const prompts = (root) => {
  recordStart(root, 'root', R, { log: quiet });
  const address = { root: { session: R } };
  return {
    bob: startRole(root, 'bob', { slug: 'o/p', address, log: quiet }).prompt,
    root: startRole(root, 'root', { slug: 'o/p', address: {}, log: quiet }).prompt,
  };
};

test('options first, printed nowhere; a chosen short-term response reaches BOB, not ROOT, and leaves them on close', () => {
  const root = product();
  const out = [];
  writeFileSync(join(root, 'other.txt'), 'staged, not the register\n');
  git(['add', 'other.txt'], { cwd: root });
  const e = triageAdd(root, loadConfig(root), SHORT, { log: (l) => out.push(l) });
  assert.equal(e.id, 'T1');
  assert.equal(e.response, undefined);
  assert.deepEqual(e.options.map((o) => o.context), SHORT.context);
  assert.match(out[0], /triage T1 added to triage\/register\.json on lane\/triage; push it and land it by pull request into tranche, then bring its options with their context to Bob, through BOB/);
  assert.equal(git(['log', '-1', '--format=%s'], { cwd: root }), 'triage T1: short-term entry added, 2 options');
  assert.deepEqual(git(['show', '--name-only', '--format=', 'HEAD'], { cwd: root }).trim().split('\n'), ['triage/register.json']);
  assert.throws(() => triageAdd(root, loadConfig(root), { ...SHORT, context: 'one' }, { log: quiet }), /each --option takes its own --context/);
  assert.throws(() => triageAdd(root, loadConfig(root), { kind: 'short-term', problem: 'p', evidence: 'e' }, { log: quiet }), /options lists each option with its context/);
  land(root);
  let p = prompts(root);
  for (const role of ['bob', 'root']) assert.ok(!p[role].includes('Run at most two'), `${role}: no response is chosen yet`);
  assert.throws(() => triageChoose(root, loadConfig(root), 'T1', { ...CHOICE, end: '' }, { log: quiet }), /needs end_condition/);
  assert.throws(() => triageChoose(root, loadConfig(root), 'T1', { ...CHOICE, 'chosen-by': '' }, { log: quiet }), /needs chosen_by/);
  const c = triageChoose(root, loadConfig(root), 'T1', CHOICE, { log: quiet });
  assert.equal(c.state, 'response chosen');
  assert.throws(() => triageChoose(root, loadConfig(root), 'T1', CHOICE, { log: quiet }), /already has its chosen response/);
  land(root);
  p = prompts(root);
  for (const role of ['bob']) {
    assert.ok(p[role].includes(`- product T1. Response chosen ${c.chosen_at}: ${CHOICE.response}`), role);
    assert.ok(p[role].includes(`  Ends when: ${CHOICE.end}`), role);
    assert.ok(!p[role].includes('Keep one queue') && !p[role].includes(SHORT.context[0]), `${role}: options are not printed`);
  }
  assert.ok(!p.root.includes(CHOICE.response));
  assert.throws(() => triageClose(root, loadConfig(root), 'T1', { log: quiet }), /--how/);
  triageClose(root, loadConfig(root), 'T1', { how: 'measured 5 Nov 14:00 to 16:00: no gate run waited over 5 minutes', log: quiet });
  const closed = readFileSync(join(root, 'triage/closed.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual([closed.length, closed[0].id, closed[0].state, closed[0].how_met, closed[0].response], [1, 'T1', 'closed', 'measured 5 Nov 14:00 to 16:00: no gate run waited over 5 minutes', CHOICE.response]);
  land(root);
  p = prompts(root);
  for (const role of ['bob']) assert.ok(!p[role].includes(CHOICE.response), role);
  // The next id never reuses a closed one's.
  assert.equal(triageAdd(root, loadConfig(root), SHORT, { log: quiet }).id, 'T2');
});

test('a long-term entry is printed into no prompt; the register lands by pull request, never a commit on the tranche', () => {
  const root = product();
  const long = { kind: 'long-term', problem: 'Merges serialize on one runner.', evidence: 'copy, 5 Nov.', option: 'A second runner.', context: 'Doubles runner cost.', 'judged-against': 'Foundations: merges never wait behind BOB\'s work.' };
  addChosen(root, long, { response: 'A second runner.', 'chosen-by': 'Bob, 6 Nov: "yes"' });
  assert.throws(() => triageAdd(root, loadConfig(root), { ...long, 'judged-against': undefined }, { log: quiet }), /judged_against/);
  land(root);
  const p = prompts(root);
  for (const role of ['bob', 'root']) assert.ok(!p[role].includes('Merges serialize'), role);
  const out = [];
  triageList(root, loadConfig(root), { log: (l) => out.push(l) });
  assert.match(out.join('\n'), /1 open[\s\S]*"judged_against": "Foundations: merges never wait behind BOB's work\."/);
  git(['checkout', '-q', 'tranche'], { cwd: root });
  assert.throws(() => triageAdd(root, loadConfig(root), SHORT, { log: quiet }), /never by a commit on tranche/);
});

test('only a chosen short-term response is printed, with its end condition; the register\'s shape is checked', () => {
  const base = { id: 'T1', kind: 'short-term', problem: 'p', evidence: 'e', options: [{ option: 'Merge process3 first.', context: 'c' }], owner: 'o', state: 's' };
  const reg = (e) => ({ repo: 'product', register: parseRegister(JSON.stringify({ open: [e] })) });
  const chosenE = { ...base, response: 'Merge process3 first.', chosen_by: 'Bob, 6 Nov: "yes"', chosen_at: '2026-11-06', end_condition: 'done', affects: ['bob'] };
  assert.equal(standingBlock([reg(base)], 'bob'), '', 'awaiting a choice');
  assert.match(standingBlock([reg(chosenE)], 'bob'), /- product T1\. Response chosen 2026-11-06: Merge process3 first\.\n {2}Problem: p\n {2}Ends when: done/);
  assert.equal(standingBlock([reg(chosenE)], 'root'), '', 'a role the entry does not name');
  const bad = (e) => () => parseRegister(JSON.stringify({ open: [e] }));
  assert.throws(bad({ ...base, options: [{ option: 'x' }] }), /options lists each option with its context/);
  assert.throws(bad({ ...chosenE, end_condition: undefined }), /needs end_condition/);
  assert.throws(bad({ ...chosenE, chosen_at: undefined }), /needs chosen_at/);
  assert.throws(bad({ ...chosenE, affects: ['watcher'] }), /affects lists roles/);
  assert.throws(bad({ ...chosenE, chosen_by: 'the coordinator, 6 Nov' }), /chosen_by quotes the dated words/);
  assert.throws(() => parseRegister(JSON.stringify({ open: [base, base] })), /entry T1 appears twice/);
});

test('the process register\'s seed P1, while awaiting a choice, brings options with context and is printed into no prompt', () => {
  const live = processRegister(PROCESS_ROOT);
  assert.equal(PROCESS_ROOT, join(import.meta.dirname, '..', '..'));
  const p1 = live.register.open.find((e) => e.id === 'P1');
  if (!p1 || p1.response !== undefined) return; // chosen or closed by the process-triage lane
  assert.ok(p1.options.length >= 2);
  for (const role of ['bob', 'root', 'coordinator', 'job']) assert.equal(standingBlock([live], role), '', role);
});

test('over the cap, every entry is still printed and the block and the commands say so', () => {
  const root = product();
  const big = { ...CHOICE, response: 'x'.repeat(700) };
  const out = [];
  for (let i = 0; i < 3; i++) addChosen(root, SHORT, big, { log: (l) => out.push(l) });
  assert.match(out.join('\n'), new RegExp(`over the cap: the standing block of bob, coordinator is over ${STANDING_CAP} bytes`));
  land(root);
  const p = prompts(root);
  assert.equal(p.bob.split('x'.repeat(700)).length - 1, 3);
  assert.match(p.bob, new RegExp(`over its cap of ${STANDING_CAP}: tell the triage lanes`));
});


// Rule for jobs: any script the job writes prints this exact line as the very last line of its
// output: `run closed Y6W-7275`.

test('a job START carries the entries naming job briefs; an unreadable register stops no start', () => {
  const block = standingBlock([{ repo: 'product', register: { open: [{ id: 'T1', kind: 'short-term', problem: 'p', evidence: 'e', options: [{ option: 'Run test twice.', context: 'c' }], response: 'Run test twice.', chosen_by: 'Bob, 6 Nov: "yes"', chosen_at: '2026-11-06', end_condition: 'c', affects: ['job'], owner: 'o', state: 's' }] } }], 'job');
  const t = startText({ entry: { id: 'a', title: 'A', requirements: 'req/a.md', paths: ['src/a/'], tests: ['test/a/'] }, slug: 'o/p', branch: 'job/a', tranche: 'tranche', coordinator: R, attempt: 1, reading: { files: [], bytes: 0 }, standing: block });
  assert.ok(t.indexOf('  Ends when: c') < t.indexOf('## Acts you may take'), 'before the acts and their limits');
  assert.ok(t.includes('Response chosen 2026-11-06: Run test twice.'));
  const bad = makeRepo({ 'process/config.json': CFG, 'triage/register.json': '{"open": [{"id": "T1"}]}' });
  const b = standingFor(bad, loadConfig(bad), 'bob');
  assert.match(b, /A triage register could not be read \(triage\/register\.json, entry T1: no problem\)/);
  assert.ok(b.includes('process P1.'), 'the process register still prints');
});

test('the process\'s triage lane starts from process3, with its register named; a triage lane takes no lane ask', async () => {
  const root = product();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const r = laneStart(root, 'process-triage', { log: quiet });
  assert.match(r.call.source_url, /process3/);
  assert.equal(r.call.source_revision, 'tranche');
  assert.match(r.prompt, /Your register: `triage\/register\.json`/);
  assert.match(r.prompt, /a product problem goes to that product's triage lane/);
  assert.match(r.prompt, /`node tool\/p3\.mjs triage list`/);
  assert.match(r.prompt, /BOB `[^`]+` started you/);
  assert.match(r.prompt, /Bring the options to Bob, through BOB by send_message; you choose no response yourself/);
  assert.match(r.prompt, /never as rulebook lines \(AUD-9, TXT-3\)/);
  assert.doesNotMatch(r.prompt, /\.process\/tool\/p3\.mjs triage/);
  const p = laneStart(root, 'triage', { log: quiet, replace: undefined });
  assert.match(p.prompt, /a Process3 problem goes to the process's triage lane, process-triage/);
  const { laneAsk } = await import('../lib/lane.mjs');
  assert.throws(() => laneAsk(root, 'triage', 'why?', { log: quiet }), /is a triage lane/);
  const { lanes } = await import('../lib/lane.mjs');
  assert.throws(() => lanes({ lanes: [{ name: 'a', dir: 'a', kind: 'triage' }, { name: 'b', dir: 'b', kind: 'odd' }] }), /kind is "design" or "triage"/);
});

// ===== file: ledger.mjs =====

// The ledger (REC-9): process/ledger/<id>.json, one file per entry so each has one writer (REC-2).
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEDGER_DIR, catBatch, fail, git } from './util.mjs';

export { LEDGER_DIR };
const SCHEMA = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'schema', 'ledger-entry.schema.json'), 'utf8'));

// A small validator for the subset of JSON Schema the ledger schema uses.
export function validate(value, schema = SCHEMA, path = '') {
  const errs = [];
  const at = path || '(entry)';
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${at}: must be one of ${schema.enum.join(', ')}`);
  const t = schema.type;
  const typeOk = !t || (t === 'array' ? Array.isArray(value)
    : t === 'integer' ? Number.isInteger(value)
    : t === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value)
    : typeof value === t);
  if (!typeOk) return [...errs, `${at}: must be ${t}`];
  if (t === 'string') {
    if (schema.minLength && value.length < schema.minLength) errs.push(`${at}: must not be empty`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errs.push(`${at}: must match ${schema.pattern}`);
  }
  if (t === 'array') {
    if (schema.minItems && value.length < schema.minItems) errs.push(`${at}: needs at least ${schema.minItems} item(s)`);
    if (schema.items) value.forEach((v, i) => errs.push(...validate(v, schema.items, `${path}[${i}]`)));
  }
  if (t === 'object') {
    for (const k of schema.required || []) if (!(k in value)) errs.push(`${path ? path + '.' : ''}${k}: required`);
    for (const [k, v] of Object.entries(value)) {
      const sub = schema.properties && Object.hasOwn(schema.properties, k) ? schema.properties[k] : undefined;
      if (sub) errs.push(...validate(v, sub, path ? `${path}.${k}` : k));
      else if (schema.additionalProperties === false) errs.push(`${path ? path + '.' : ''}${k}: not a ledger field`);
    }
  }
  return errs;
}

export const entryFile = (id) => `${LEDGER_DIR}/${id}.json`;

// A job's branch is the one its latest start row names (`branch`; job/<id> when it names none).
// job start --fresh-branch cuts job/<id>-<n>, n the next free from 2, and writes that row there,
// so the latest start row is on the highest-numbered job/<id>-<n> on origin whose own latest
// start row names it (named(h); metrics.mjs jobBranchAt reads it), else job/<id>. A <id>-<n> that
// is itself a module (ids: the ledger's; none read, no <id>-<n> counts) is that module's.
// The branch the attempt works on: the newest start row's (every start row names it since 5 Nov).
// Before then a row on job/<id> named none, and an --again row named none either, on whatever
// branch it continued: an --again row without a branch is passed over for the one before it (copy
// PR 454: attempt 4 had moved to job/<id>-2 by --fresh-branch, and the gate fell back to job/<id>).
export function startBranch(rows, id) {
  const starts = rows.filter((r) => r.row === 'attempt' && r.event === 'start');
  for (let i = starts.length - 1; i >= 0; i--) if (starts[i].branch || !starts[i].again) return starts[i].branch || `job/${id}`;
  return `job/${id}`;
}
const FRESH = /^(.+)-([1-9]\d*)$/;
export function jobBranch(id, heads, ids = new Set(), named = () => true) {
  const fresh = [...(heads || [])].map((h) => [h, ids.size && String(h).startsWith('job/') && !ids.has(h.slice(4)) ? FRESH.exec(h.slice(4)) : null])
    .filter(([, m]) => m && m[1] === id).sort((a, b) => Number(b[1][2]) - Number(a[1][2]));
  return fresh.find(([h]) => named(h))?.[0] || `job/${id}`;
}
// The module of a job branch: <x> of job/<x> when <x> is a module (or no ids are given), else
// <id> of job/<id>-<n> when <id> is; null for a branch not job/*.
export function branchModule(ref, ids = null) {
  const x = /^job\/([a-z0-9-]+)$/.exec(ref || '')?.[1];
  if (!x || !ids?.size || ids.has(x)) return x || null;
  const m = FRESH.exec(x);
  return m && ids.has(m[1]) ? m[1] : x;
}
export const ledgerIds = (root, ref) => new Set(git(['ls-tree', '--name-only', `${ref}:${LEDGER_DIR}`], { cwd: root, allowFail: true }).stdout.split('\n').filter((n) => n.endsWith('.json')).map((n) => n.slice(0, -5)));
// origin's job heads, as 'job/...' names; null when origin is unread.
export function originJobs(root) {
  const r = git(['ls-remote', '--heads', 'origin', 'refs/heads/job/*'], { cwd: root, allowFail: true });
  return r.code === 0 ? new Set(r.stdout.split('\n').map((l) => l.split('\t')[1]?.trim().replace(/^refs\/heads\//, '')).filter(Boolean)) : null;
}

// Entries as { file: text } from the worktree, or from a git ref when one is given.
export function readLedgerTexts(root, ref) {
  const out = {};
  if (ref) {
    const r = git(['ls-tree', `${ref}:${LEDGER_DIR}`], { cwd: root, allowFail: true });
    if (r.code !== 0) return out;
    // The entries' blobs in one cat-file --batch (C50: one git show each, a spawn per module, on
    // every setup check, status and take-in read); as git show prints them, the last newline off.
    // Anything the batch does not give (not a blob) is read as before.
    const list = r.stdout.split('\n').map((l) => l.match(/^\d+ (\w+) ([0-9a-f]+)\t(.+)$/)).filter((m) => m && m[3].endsWith('.json'));
    const got = catBatch(root, list.filter((m) => m[1] === 'blob').map((m) => m[2])) || new Map();
    for (const [, , sha, name] of list) {
      out[`${LEDGER_DIR}/${name}`] = got.has(sha) ? got.get(sha).replace(/\n$/, '') : git(['show', `${ref}:${LEDGER_DIR}/${name}`], { cwd: root });
    }
    return out;
  }
  const dir = join(root, LEDGER_DIR);
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    out[`${LEDGER_DIR}/${name}`] = readFileSync(join(dir, name), 'utf8');
  }
  return out;
}

export function readEntry(root, id) {
  const p = join(root, entryFile(id));
  if (!existsSync(p)) fail(`no ledger entry ${entryFile(id)}`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

// Rewrites only the status field of an entry, the one field a job may change.
export function writeStatus(root, id, status) {
  const e = readEntry(root, id);
  e.status = status;
  const errs = validate(e);
  if (errs.length) fail(`status would break the schema: ${errs.join('; ')}`);
  writeFileSync(join(root, entryFile(id)), JSON.stringify(e, null, 2) + '\n');
  return e;
}

// Whether home holds file, and it differs from e only in its status.
function carried(root, home, file, e) {
  const t = git(['show', `${home}:${file}`], { cwd: root, allowFail: true });
  if (t.code !== 0) return false;
  try { return fixed(JSON.parse(t.stdout)) === fixed(e); } catch { return false; }
}
// The ref of the ledger's home, the tranche, for checkLedger's home: origin's, else a local
// branch, fetched once when neither is here; null when it cannot be read.
export function homeRef(root, tranche) {
  if (!tranche) return null;
  const has = (r) => git(['rev-parse', '-q', '--verify', `${r}^{commit}`], { cwd: root, allowFail: true }).code === 0;
  const remote = `refs/remotes/origin/${tranche}`;
  if (has(remote)) return remote;
  if (has(`refs/heads/${tranche}`)) return `refs/heads/${tranche}`;
  git(['fetch', '-q', 'origin', `+refs/heads/${tranche}:${remote}`], { cwd: root, allowFail: true });
  return has(remote) ? remote : null;
}

const finding = (file, message) => ({ check: 'ledger', file, line: 1, message });
const fixed = (e) => JSON.stringify({ ...e, status: undefined });

// Schema check of every entry; with base and a job/<id> branch, also that the job changed
// nothing in the ledger except the status of its own entry. home (the layer flow): the ref of the
// ledger's home, the tranche. A job on a layer branch cut before the tranche got its module's
// entry (copy, 6 Nov: layer/8 and PR 638) carries that entry onto the layer: it may add its own
// entry when home holds it, and nothing but the status differs from home's.
export function checkLedger(root, { base, branch, ref, home } = {}) {
  const findings = [];
  const head = readLedgerTexts(root, ref);
  const parsed = {};
  for (const [file, text] of Object.entries(head)) {
    let e;
    try { e = JSON.parse(text); } catch (err) { findings.push(finding(file, `not JSON: ${err.message}`)); continue; }
    parsed[file] = e;
    for (const m of validate(e)) findings.push(finding(file, m));
    if (e.id && file !== entryFile(e.id)) findings.push(finding(file, `id ${e.id} does not match its file name`));
    if (e.status?.state === 'BLOCKED' && !e.status.reason) findings.push(finding(file, 'BLOCKED needs a reason'));
  }
  const job = branch && branchModule(branch, ledgerIds(root, ref || 'HEAD'));
  if (base && job) {
    const own = entryFile(job);
    const before = readLedgerTexts(root, base);
    for (const file of new Set([...Object.keys(before), ...Object.keys(head)])) {
      if (before[file]?.trimEnd() === head[file]?.trimEnd()) continue;
      if (!(file in before)) {
        if (file === own && home && parsed[file] && carried(root, home, file, parsed[file])) continue;
        findings.push(finding(file, `a job may not add a ledger entry${file === own && home ? ` (its own is added only as ${home} holds it, the status aside)` : ''}`));
        continue;
      }
      if (!(file in head)) { findings.push(finding(file, 'a job may not remove a ledger entry')); continue; }
      if (file !== own) { findings.push(finding(file, `job ${job} may change only its own entry`)); continue; }
      let b;
      try { b = JSON.parse(before[file]); } catch { continue; }
      if (parsed[file] && fixed(b) !== fixed(parsed[file])) findings.push(finding(file, 'a job may change only the status field'));
    }
  }
  return findings;
}

// A lane's module, when named, has a ledger entry, a modules file row and a requirements file: its
// marks are the lane's work (coordinator's ruling, 6 Nov; a lanes row without "module" stays valid).
// read(f): the file's text at the place checked, or null. Each gap names what BOB writes.
export function laneModuleGaps(read, cfg) {
  const gaps = [];
  let mods = null;
  if (cfg.modules_file) { try { const t = read(cfg.modules_file); mods = t === null ? [] : (JSON.parse(t).modules || []); } catch { mods = []; } }
  for (const l of Array.isArray(cfg.lanes) ? cfg.lanes : []) {
    const m = typeof l?.module === 'string' && l.module.trim() ? l.module.trim() : null;
    if (!m) continue;
    const name = String(l.name || '').trim();
    const t = read(entryFile(m));
    let e = null;
    try { e = t === null ? null : JSON.parse(t); } catch { e = undefined; }
    if (!e) { gaps.push(`lane ${name} names module ${m}, which has no ${e === undefined ? 'readable ' : ''}ledger entry ${entryFile(m)}: BOB writes it (with its modules file row and its requirements file) by a plain pull request into ${cfg.tranche}, or drops "module" from the lane's row`); continue; }
    if (mods && !mods.some((x) => x?.id === m)) gaps.push(`lane ${name}'s module ${m} has no row in ${cfg.modules_file}: BOB adds {"id": "${m}", "uses": [...]} there`);
    const req = e.requirements || `${String(cfg.requirements_dir || '').replace(/\/$/, '')}/${m}.md`;
    if (read(req) === null) gaps.push(`lane ${name}'s module ${m} has no requirements file ${req}: BOB writes it, its marks the lane's work`);
  }
  return gaps;
}

// ===== file: bookkeeping.test.mjs =====

// The tool's own records never make a push of their own (C18; coordinator, 7 Nov: the account at
// its push ceiling, 10 of BOB's 26 pushes in an hour nothing but idle-check rows, starts owed after a
// merge had pushed, and paid after a job start): a record rides the command's real write; with none
// it waits in the clone and rides the next real write; the clone's reads see it meanwhile.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { OWED_FILE, readOwed } from '../lib/hold.mjs';
import { bookkeep, flushState, readState, readStateWith, stateBatch, stateIO, stateReplay, writeState } from '../lib/state.mjs';
import { git, now } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const SB = 'process-state';
function product() {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['config', 'core.logAllRefUpdates', 'always'], { cwd: bare });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  writeState(root, SB, 'seed', (dir) => { writeFileSync(join(dir, 'seed.txt'), 's\n'); return {}; });
  return { root, bare };
}
// Pushes, not commits: each push moves the state branch once in origin's reflog; the seed's first
// write counts as one too.
const pushes = (bare) => git(['reflog', 'show', '--format=%H', `refs/heads/${SB}`], { cwd: bare, allowFail: true }).stdout.split('\n').filter((l) => l.trim()).length;

test('a command that writes only bookkeeping pushes nothing; its record waits in the clone, read there, and rides the next real write', () => {
  const { root, bare } = product();
  const before = pushes(bare);
  // A read command (status, layer jobs): its only write a starts-owed record.
  stateBatch(true);
  try { bookkeep(root, SB, 'starts owed: merge 7', 'owe', { path: OWED_FILE, act: 'merge 7', at: now() }); flushState(); } finally { stateBatch(false); }
  assert.equal(pushes(bare), before, 'no push of its own');
  assert.equal(readState(root, SB, OWED_FILE), null, 'not on the branch yet');
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 7'], 'the clone reads it');
  // Unbatched (job start's paid): waits too.
  bookkeep(root, SB, 'starts owed: merge 8', 'owe', { path: OWED_FILE, act: 'merge 8', at: now() });
  assert.equal(pushes(bare), before);
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 7', 'merge 8']);
  // The next real write carries both, in its one push.
  stateBatch(true);
  try { writeState(root, SB, 'layer join: x', (dir) => { writeFileSync(join(dir, 'join.txt'), 'x\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  assert.equal(pushes(bare), before + 1, 'one push: the real write and the two records');
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 7', 'merge 8']);
  assert.equal(readStateWith(root, SB, OWED_FILE), readState(root, SB, OWED_FILE), 'nothing left waiting');
});

test('an unbatched write (job start, replay) leaves the waiting records waiting; the next batched write carries them, once', () => {
  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 9', 'owe', { path: OWED_FILE, act: 'merge 9', at: now() });
  const before = pushes(bare);
  writeState(root, SB, 'a write', (dir) => { writeFileSync(join(dir, 'w.txt'), 'w\n'); return {}; });
  assert.equal(pushes(bare), before + 1);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.equal(readState(root, SB, OWED_FILE), null, 'not carried by an unbatched write');
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 9'], 'still waiting, read in the clone');
  stateBatch(true);
  try { writeState(root, SB, 'b write', (dir) => { writeFileSync(join(dir, 'b.txt'), 'b\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 9']);
});


test('a write kept for replay leaves the waiting records in the clone: the replay pushes the write alone, the next batched write the records, once each (cold reviews of C18)', () => {
  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 11', 'owe', { path: OWED_FILE, act: 'merge 11', at: now() });
  stateIO.push = () => ({ code: 1, stderr: 'remote: refused for the test' });
  try { assert.throws(() => writeState(root, SB, 'a write', (dir) => { writeFileSync(join(dir, 'k.txt'), 'k\n'); return {}; }), /state replay/); } finally { delete stateIO.push; }
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 11'], 'still waiting in the clone');
  stateReplay(root, SB, [], { log: () => {} });
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.equal(readState(root, SB, 'k.txt'), 'k\n', 'the kept write replayed');
  assert.equal(readState(root, SB, OWED_FILE), null, 'the replay carried no records');
  stateBatch(true);
  try { writeState(root, SB, 'later', (dir) => { writeFileSync(join(dir, 'l.txt'), 'l\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 11'], 'once');
  assert.ok(bare);
});


test('a batched flush refused to the end keeps its own writes for replay and leaves the waiting records waiting, never in both', () => {
  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 12', 'owe', { path: OWED_FILE, act: 'merge 12', at: now() });
  const before = pushes(bare);
  stateIO.push = () => ({ code: 1, stderr: 'remote: refused for the test' });
  stateBatch(true);
  try {
    writeState(root, SB, 'a real write', (dir) => { writeFileSync(join(dir, 'r.txt'), 'r\n'); return {}; });
    assert.throws(() => flushState(), /state replay/);
  } finally { stateBatch(false); delete stateIO.push; }
  assert.equal(pushes(bare), before);
  const kept = git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean);
  assert.equal(kept.length, 1, 'the real write kept, alone');
  assert.equal(git(['log', '-1', '--format=%s', kept[0]], { cwd: root }), 'a real write');
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 12'], 'the record still waiting in the clone');
  stateReplay(root, SB, [], { log: () => {} });
  stateBatch(true);
  try { writeState(root, SB, 'next', (dir) => { writeFileSync(join(dir, 'n.txt'), 'n\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 12'], 'pushed once');
});

// ===== file: pace.mjs =====

// GitHub limit conformance (R17). The civicsmith account was suspended on 6 Nov at 19:19Z, most
// likely for automated bulk activity. Bob, 6 Nov ~21:10Z: "If github publishes limits, then we
// should introduce process3 tooling that conforms to those limits. But rather than limiting usage
// to a small fraction of github's stated limits, I'd suggest that the tooling limit usage to 80%
// or 90% of github's published limits. That feels like the proper balance."
//
// So the tool:
// - holds GitHub's published limits as data (GITHUB_LIMITS, pacing.github_limits);
// - uses at most pacing.target (default 0.85, 0.8 to 0.9) of each, account-wide:
//   - the primary limit is GitHub's own count: the rate_limit endpoint, which does not count
//     against it, read at most once a minute per clone;
//   - the secondary limits are counted per call (REST points; content-creating requests), from
//     every session's usage rows on the state branch plus this clone's own log;
// - obeys GitHub's refusals: on a 403 or 429 rate-limit response, every session pauses until the
//   reset (Retry-After, x-ratelimit-reset, else at least a minute) and never retries inside it; a
//   second refusal within an hour stops the tool until the coordinator runs `github resume`.
// The per-clone spacing (gh_interval_ms) is only a floor against bursts. Session caps are off by
// default (pacing.jobs, pacing.lanes): the budget throttles. The shared store is an adapter
// (useShared): p3.mjs sets the state branch's (ghshare.mjs); with none, this clone's own log only.
// No import from util.mjs (util imports this).
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// GitHub's published limits, read 6 Nov 2026 from the source below.
export const GITHUB_LIMITS = {
  source: 'https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api',
  read: '2026-11-06',
  primary_per_hour: 5000, // per user token
  actions_token_per_hour: 1000, // GITHUB_TOKEN, per repository
  concurrent: 100,
