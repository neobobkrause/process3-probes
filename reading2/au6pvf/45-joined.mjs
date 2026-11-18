// ===== file: merge.test.mjs (continued) =====

  assert.ok(said.some((l) => /job alpha's cost: unmeasured: --job-cost-usd 3\.25 is not above session session_J's last row \(3\.25\)/.test(l)), said.join('\n'));
  git(['checkout', '-q', 'main'], { cwd: root });
});
test('merge --job-cost-usd with no session on the complete row takes the session of this attempt\'s last measured row, never an earlier attempt\'s', () => {
  const { root } = setup();
  const head = costRows(root, [
    { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_J', session_usd: 3.25, cost_usd: 3.25 },
    { row: 'attempt', event: 'measured', role: 'job', attempt: 1, session: 'session_J', session_usd: 3.25, cost_usd: 'unmeasured' },
    { row: 'attempt', event: 'complete', attempt: 1 },
  ]);
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '4.04', log: () => {} });
  git(['checkout', '-q', r.tip], { cwd: root });
  const m = readRows(root, 'alpha').filter((x) => x.event === 'measured').pop();
  assert.deepEqual([m.session, m.session_usd, m.cost_usd], ['session_J', 4.04, 0.79]);
  git(['checkout', '-q', 'main'], { cwd: root });
});
test('merge --job-cost-usd takes no session from an earlier attempt: a restart in a new session counts its figure whole', () => {
  const { root } = setup();
  const head = costRows(root, [
    { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_J', session_usd: 3.25, cost_usd: 3.25 },
    { row: 'attempt', event: 'complete', attempt: 1 },
  ]);
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '2', log: () => {} });
  git(['checkout', '-q', r.tip], { cwd: root });
  const m = readRows(root, 'alpha').filter((x) => x.event === 'measured').pop();
  assert.deepEqual([m.session, m.session_usd, m.cost_usd], [null, 2, 2]);
  git(['checkout', '-q', 'main'], { cwd: root });
});

import { deepenToBase } from '../lib/merge.mjs';
test('deepenToBase never cuts a history fetched deeper (the merge train\'s tranche past main): a head cut from main is mended one commit at a time', () => {
  // origin: main with 12 commits; the tranche 30 past main; job/x cut from main's tip, job/y from the tranche's 5th.
  const src = makeRepo({ 'README.md': 'x' });
  for (let i = 0; i < 11; i += 1) commit(src, { [`m${i}.txt`]: String(i) });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: src });
  for (let i = 0; i < 30; i += 1) { commit(src, { [`t${i}.txt`]: String(i) }); if (i === 4) git(['branch', 'job/y'], { cwd: src }); }
  git(['checkout', '-q', '-b', 'job/x', 'main'], { cwd: src });
  commit(src, { 'x.txt': 'x' });
  git(['checkout', '-q', 'job/y'], { cwd: src });
  commit(src, { 'y.txt': 'y' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['clone', '-q', '--bare', src, bare], { cwd: tmpdir() });
  const thin = join(mkdtempSync(join(tmpdir(), 'p3-thin-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', '-b', 'main', `file://${bare}`, thin], { cwd: tmpdir() });
  git(['fetch', '-q', '--shallow-exclude=main', 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche', '+refs/heads/job/x:refs/remotes/origin/job/x', '+refs/heads/job/y:refs/remotes/origin/job/y'], { cwd: thin });
  const past = () => Number(git(['rev-list', '--count', 'origin/tranche'], { cwd: thin }));
  assert.equal(past(), 30);
  const count = (a, b) => Number(git(['rev-list', '--count', a, `^${b}`], { cwd: bare }));
  const compare = (slug, base, head) => ({ ahead_by: count(head, base), behind_by: count(base, head), merge_base_commit: { sha: git(['merge-base', base, head], { cwd: bare }) } });
  // job/y's base is in the history past main: read locally, nothing fetched, nothing cut (--depth=26 would have kept 26 of 30).
  deepenToBase(thin, 'o/r', 'tranche', 'job/y', compare);
  assert.equal(past(), 30);
  assert.equal(git(['merge-base', 'origin/tranche', 'origin/job/y'], { cwd: thin }), compare('', 'tranche', 'job/y').merge_base_commit.sha);
  // job/x was cut from main's tip, below the tranche's cut: deepened to it, the tranche's history whole, the clone still shallow.
  assert.equal(git(['merge-base', 'origin/tranche', 'origin/job/x'], { cwd: thin, allowFail: true }).code, 1);
  deepenToBase(thin, 'o/r', 'tranche', 'job/x', compare);
  assert.equal(git(['merge-base', 'origin/tranche', 'origin/job/x'], { cwd: thin }), git(['rev-parse', 'main'], { cwd: src }));
  assert.ok(past() >= 30);
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: thin }), 'true', 'main\'s older history never fetched');
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
  assert.equal(merge(plain.root, 7, { slug: 'o/r', io: io(plain.head).io, noReview: 'one constant and its test', log: quiet }).merged, true);
  const row = lastRow(plain.root);
  assert.deepEqual([row.triggers, row.reviewed, row.review_minutes, row.findings], [[], false, null, null]);
});

test('a test that existed at the base losing assertions fires; one changed in place or gaining them does not; a product with no security paths fires none for them', () => {
  const loose = setup((root) => commit(root, { 'test/alpha/a.test.mjs': TEST_BASE.replace('  assert.ok(g());\n', '') }));
  assert.throws(() => merge(loose.root, 8, { slug: 'o/r', io: io(loose.head).io, noReview: 'x', log: quiet }), /test\/alpha\/a\.test\.mjs: 1 hunk removing assertions and adding none/);
  const t = reviewTriggers(loose.root, { base: 'origin/tranche', head: 'origin/job/alpha', entry: entry('alpha'), cfg: {} });
  assert.deepEqual(t.fired, ['test']);
  assert.match(t.hunks, /^-  assert\.ok\(g\(\)\);$/m, 'the exact hunk that fired it');
  const none = setup((root) => commit(root, { 'src/alpha/acts.mjs': 'export const ACTS = [];\n', 'test/alpha/a.test.mjs': TEST_BASE.replace('45', '40') + "test('b', () => { expect(h()).toBe(1); });\n" }), {});
  const n = reviewTriggers(none.root, { base: 'origin/tranche', head: 'origin/job/alpha', entry: entry('alpha'), cfg: { review_triggers: {} } });
  assert.deepEqual([n.fired, n.security_set], [[], false]);
  // A hunk that replaces an assertion with another does not fire; an added skip does.
  const swap = setup((root) => commit(root, { 'test/alpha/a.test.mjs': TEST_BASE.replace('  assert.ok(g());\n', '  assert.equal(g(), true);\n') }));
  assert.deepEqual(reviewTriggers(swap.root, { base: 'origin/tranche', head: 'origin/job/alpha', entry: entry('alpha'), cfg: {} }).fired, []);
