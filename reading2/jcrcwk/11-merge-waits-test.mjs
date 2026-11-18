// Defect sweep 4 Nov, #6, #8 and #13: merge's waits on the gate, and the merge base of a merged
// pull request read in a shallow clone.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { GATE_CAP_MINUTES, GATE_WAIT_MINUTES, merge, mergePlain, waitForChecks, waitForGate } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { mergedRange, noticeFile, withdrawNotice } from '../lib/notice.mjs';
import { noticeTriage } from '../lib/triage.mjs';
import { git, isShallow, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState } from './helpers.mjs';

const quiet = () => {};
const MIN = 60000;
// A reader that gives up after `n` rounds, so a wait that never ends fails the test, not hangs it.
const rounds = (n, f) => { let i = 0; return (...a) => { if (++i > n) throw new Error(`still waiting after ${n} rounds`); return f(i, ...a); }; };

// #6 -------------------------------------------------------------------------------------------

test('the gate wait defaults past the gate job\'s own cap, which is the shim\'s timeout-minutes', () => {
  const shim = readFileSync(new URL('../../shims/process-gate.yml', import.meta.url), 'utf8');
  const cap = Number(shim.match(/\n  gate:\n(?:    .*\n)*?    timeout-minutes: (\d+)/)[1]);
  assert.equal(GATE_CAP_MINUTES, cap);
  assert.ok(GATE_WAIT_MINUTES > GATE_CAP_MINUTES, 'merge waits longer than a gate run can take');
  const p3 = readFileSync(new URL('../p3.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(p3, /a\.minutes \|\| (20|30)/, 'the command line leaves the default to merge');
});

test('the gate wait stops at once when the pull request\'s head moves off the tip: that run is cancelled and never comes', () => {
  const T = 't'.repeat(40);
  const T2 = 'u'.repeat(40);
  const was = 'w'.repeat(40);
  // GitHub still shows the head before the push for a moment: that is waited past.
  const heads = [was, T, T2];
  const pr = rounds(10, (i) => ({ state: 'open', head: { ref: 'job/alpha', sha: heads[Math.min(i - 1, 2)] } }));
  const read = rounds(10, () => ({ status: 'completed', conclusion: 'cancelled' }));
  assert.throws(() => waitForGate('o/r', T, { every: 0, read, pr, was, log: quiet }), /^Error: job\/alpha moved to uuuuuuuuuu while the gate on tttttttttt was awaited: that gate will not finish; run merge again$/);
  // A pull request merged or closed meanwhile stops it too.
  assert.throws(() => waitForGate('o/r', T, { every: 0, read: rounds(10, () => ({ status: 'completed', conclusion: 'cancelled' })), pr: () => ({ state: 'closed', merged: true, head: { sha: T } }), log: quiet }), /pull request is merged while the gate/);
});

test('past the wait, the gate is waited on only while a run is in progress, up to its cap', () => {
  const T = 't'.repeat(40);
  const started = (ago) => new Date(Date.now() - ago * MIN).toISOString();
  // In progress, started 40 min ago: within the cap, so waited on until it completes.
  const going = rounds(10, (i) => (i < 3 ? { status: 'in_progress', started_at: started(40) } : { status: 'completed', conclusion: 'success' }));
  assert.equal(waitForGate('o/r', T, { minutes: 0, every: 0, read: going, log: quiet }).conclusion, 'success');
  // In progress past its cap, queued, not started, or cancelled: refused at the deadline.
  for (const run of [{ status: 'in_progress', started_at: started(GATE_CAP_MINUTES + 10) }, { status: 'queued' }, null, { status: 'completed', conclusion: 'cancelled' }]) {
    assert.throws(() => waitForGate('o/r', T, { minutes: 0, every: 0, read: rounds(3, () => run), log: quiet }), /did not finish within 0 min/);
  }
});

// A job branch on an origin, its PR's comments and gate.
function jobRepo() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/a.mjs': 'x', 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}
const remoteTip = (root) => git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
const moveTranche = (root, f) => {
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { [f]: f });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
};
// GitHub as it is: the PR's head is origin's job/alpha; gate rows agree on every sha in `green`.
function jobIO(root, { gate, merged = [] }) {
  const all = (shas) => [
    { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: shas[0] }), user: { login: 'c' } },
    { id: 2, body: block(GATE, { runs: shas.map((sha) => ({ sha, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 })) }), user: { login: BOT } },
  ];
  const seen = [];
  return {
    seen,
    io: {
      getPR: () => ({ state: 'open', draft: false, user: { login: 'c' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: remoteTip(root) } }),
      comments: () => all(seen.length ? seen : [remoteTip(root)]),
      checkRun: (slug, sha) => gate(sha),
      verify: () => true,
      mergePR: (slug, n, sha) => { merged.push(sha); return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}

test('merge run again on the merge-row tip whose gate outran the wait waits on that gate, pushes no second row and merges that tip', () => {
  const { root, head } = jobRepo();
  // The first run pushes the merge row; its gate is still queued when the wait ends.
  const first = jobIO(root, { gate: (sha) => (sha === head ? { status: 'completed', conclusion: 'success' } : { status: 'queued' }) });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: first.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, minutes: 0, every: 0, log: quiet }), /did not finish within 0 min/);
  const T = remoteTip(root);
  assert.notEqual(T, head);
  // The rerun: the gate on T is in progress, then green.
  let reads = 0;
  const merged = [];
  const again = jobIO(root, { merged, gate: () => (++reads < 3 ? { status: 'in_progress' } : { status: 'completed', conclusion: 'success' }) });
  again.seen.push(head, T);
  const logs = [];
  const r = merge(root, 3, { slug: 'o/r', io: again.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, every: 0, log: (m) => logs.push(m), wait: 0 });
  assert.equal(r.merged, true);
  assert.deepEqual(merged, [T], 'merges the tip the first run pushed');
  assert.equal(remoteTip(root), T, 'nothing pushed');
  assert.match(logs.join('\n'), /already holds the merge row for PR 3; no second row is written/);
  git(['checkout', '-q', T], { cwd: root });
  assert.equal(readRows(root, 'alpha').filter((x) => x.row === 'merge').length, 1);
  git(['checkout', '-q', 'main'], { cwd: root });
});

test('merge run again after the tranche moved brings the tip up to it, but writes no second merge row', () => {
  const { root, head } = jobRepo();
  // The first run gives up on a gate still queued; T goes green after, and the tranche moves.
  const first = jobIO(root, { gate: (sha) => (sha === head ? { status: 'completed', conclusion: 'success' } : { status: 'queued' }) });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: first.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, minutes: 0, every: 0, log: quiet }), /did not finish within 0 min/);
  const T = remoteTip(root);
  moveTranche(root, 'fix.txt');
  const merged = [];
  const again = jobIO(root, { merged, gate: () => ({ status: 'completed', conclusion: 'success' }) });
  again.seen.push(head, T);
  assert.equal(merge(root, 3, { slug: 'o/r', io: again.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet, wait: 0 }).merged, true);
  const T2 = remoteTip(root);
  assert.notEqual(T2, T);
  assert.deepEqual(merged, [T2]);
  git(['checkout', '-q', T2], { cwd: root });
  assert.equal(readRows(root, 'alpha').filter((x) => x.row === 'merge').length, 1, 'one merge row per pull request');
  git(['checkout', '-q', 'main'], { cwd: root });
});

test('merge stops waiting at once when the job pushes over the merge-row tip', () => {
  const { root, head } = jobRepo();
  let pushedOver = false;
  const f = jobIO(root, {
    gate: rounds(20, (i, sha) => {
      if (sha === head) return { status: 'completed', conclusion: 'success' };
      // The job pushes T2 over BOB's tip; the run on the tip is cancelled.
      if (!pushedOver) {
        pushedOver = true;
        git(['push', '-q', '--force', 'origin', `${head}:refs/heads/job/alpha`], { cwd: root });
        git(['checkout', '-q', '-B', 'side', head], { cwd: root });
        commit(root, { 'src/alpha/b.mjs': 'y' });
        git(['push', '-q', '--force', 'origin', 'side:refs/heads/job/alpha'], { cwd: root });
        git(['checkout', '-q', 'main'], { cwd: root });
      }
      return { status: 'completed', conclusion: 'cancelled' };
    }),
  });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, every: 0, log: quiet }), /job\/alpha moved to \w+ while the gate on \w+ was awaited/);
});

// #13 ------------------------------------------------------------------------------------------

test('merge --plain of the tranche into main waits on a gate still in progress past the wait, up to its cap, and stops when the head moves', () => {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': {} });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const sha = commit(root, { 'notes.txt': 'closed' });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  const started = new Date(Date.now() - 30 * MIN).toISOString();
  const calls = [];
  const io = (runs, head = () => sha) => ({
    getPR: () => ({ state: 'open', draft: false, base: { ref: 'main', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: 'tranche', sha: head(), repo: { full_name: 'o/r' } } }),
    requiredChecks: () => ({ checks: [{ context: 'gate' }] }),
    checkRuns: runs,
    repo: { released: () => false, shim: () => null, descends: () => false },
    mergePR: (s, n, at) => { calls.push(at); return { merged: true, sha: 'm'.repeat(40) }; },
  });
  // Every suite in one gate job: still in progress at the deadline, inside its cap, then green.
  const slow = rounds(10, (i) => [i < 4 ? { id: 1, status: 'in_progress', started_at: started } : { id: 1, status: 'completed', conclusion: 'success', started_at: started }]);
  assert.equal(mergePlain(root, 9, { slug: 'o/r', noReview: 'x', minutes: 0, every: 0, log: quiet, io: io(slow) }).merged, true);
  assert.deepEqual(calls, [sha]);
  // Queued past the wait is refused.
  assert.throws(() => mergePlain(root, 9, { slug: 'o/r', noReview: 'x', minutes: 0, every: 0, log: quiet, io: io(rounds(5, () => [{ id: 1, status: 'queued' }])) }), /required checks still running on \w+ after 0 min: gate queued/);
  // The head moving while it waits stops it at once.
  let n = 0;
  assert.throws(() => mergePlain(root, 9, { slug: 'o/r', noReview: 'x', every: 0, log: quiet, io: io(rounds(5, () => [{ id: 1, status: 'in_progress', started_at: started }]), () => (++n > 2 ? 'e'.repeat(40) : sha)) }), /tranche moved to e{10} while its checks/);
