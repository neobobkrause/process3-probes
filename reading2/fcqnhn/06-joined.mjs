// ===== file: flow-control.test.mjs (continued) =====

  const rows = [
    { id: 'a', tranche: 'OPEN', branch: 'WORKING' }, { id: 'b', tranche: 'OPEN', branch: 'COMPLETE', ready: true, gate: 'pending' },
    { id: 'c', tranche: 'OPEN', branch: 'COMPLETE', ready: true, gate: 'success' }, { id: 'd', tranche: 'BLOCKED', branch: 'BLOCKED' }, { id: 'e', tranche: 'OPEN', branch: 'WORKING' },
  ];
  const s = (id, st) => ({ id: `session_${id}`, title: `job ${id}`, session_status: `SESSION_STATUS_${st}`, updated_at: ago(1) });
  const f = flow({ targets: {} }, rows, [], 5, [s('a', 'RUNNING'), s('b', 'IDLE'), s('c', 'IDLE'), s('d', 'IDLE'), s('e', 'IDLE')]);
  assert.deepEqual([f.working, f.waiting], [1, 4]);
  assert.match(f.line, /^flow: live 5\/20 \((default|P3_JOB_CAP)\) \(working 1, waiting 4: b gate, c merge, d block, e BOB\), startable 0/);
});

// Fault injection 3: an unanswered BLOCKED job: its idle session is counted waiting on its block in
// the flow line (and the sweep's ruling owed stands as before); ruled, it waits no more.
test('fault injection: an unanswered BLOCKED job shows as a session waiting on its block, and no more once ruled', (t) => {
  setJobCap(t, 6);
  const s = { id: 'session_q', title: 'job q', session_status: 'SESSION_STATUS_IDLE', updated_at: ago(40) };
  const blocked = flow({ targets: { decision_minutes: 30 } }, [{ id: 'q', tranche: 'BLOCKED', since: ago(40) }], [], 1, [s]);
  assert.match(blocked.line, /waiting 1: q block\), startable 0, blocked 1 \(oldest 40 min\)/);
  const ruled = flow({ targets: { decision_minutes: 30 } }, [{ id: 'q', tranche: 'OPEN', branch: 'WORKING' }], [], 1, [{ ...s, session_status: 'SESSION_STATUS_RUNNING' }]);
  assert.match(ruled.line, /working 1, waiting 0\), startable 0, blocked 0/);
});

// ===== file: rerun.test.mjs =====

// Recovery after a governor refusal (R17c, item F; Bob, 6 Nov: when an operation is delayed and then
// dropped, does the code that dropped it know why and recover?). For each multi-step command, a
// governor refusal is injected at each GitHub step in turn (a gh call through the io stand-ins, and
// the push through the governed git), and a rerun of the same command completes with no duplicate
// merge, comment or row and no lost state.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { jobSync } from '../lib/job.mjs';
import { merge } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { useShared } from '../lib/pace.mjs';
import { Fail, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const REFUSED = 'GitHub budget: 68 of the 80 content-creating requests a minute used account-wide, the target 85% (68): acts on GitHub wait until 2026-11-06T23:59:00Z (16 min); then rerun `node .process/tool/p3.mjs merge 3`';
// Every push refused, as a stopped account refuses them.
const stopped = { read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'secondary rate limit', stopped: true }, use: [] }), pause: () => null };

function setup() {
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

// GitHub as the merge sees it, with state: a merge closes the pull request. `refuseAt` throws the
// governor's refusal at that call (1-based), once.
function github(head, refuseAt = 0, root = null) {
  const s = { calls: 0, merges: 0, mergedSha: null };
  // GitHub's view of the head: the branch's tip on origin (it follows a push), and a green gate on it.
  const tip = () => (root ? git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0] : head);
  const step = (f) => (...a) => { s.calls++; if (s.calls === refuseAt) throw new Fail(REFUSED); return f(...a); };
  return {
    s,
    io: {
      getPR: step(() => (s.merges ? { state: 'closed', merged: true, merge_commit_sha: s.mergeSha, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: s.mergedSha } } : { state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: tip() } })),
      comments: step(() => [
        { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
        { id: 2, body: block(GATE, { runs: [...new Set([head, tip()])].map((sha) => ({ sha, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 })) }), user: { login: BOT } },
      ]),
      checkRun: step(() => ({ status: 'completed', conclusion: 'success', html_url: 'run' })),
      verify: step((slug, r) => r.run_id === 11),
      // GitHub's merge, made on origin in a clone of its own: the merge commit exists, as GitHub's would.
      mergePR: step((slug, n, sha) => {
        s.merges++;
        s.mergedSha = sha;
        let m = 'm'.repeat(40);
        if (root) {
          const gh0 = join(mkdtempSync(join(tmpdir(), 'p3-ghmerge-')), 'g');
          git(['clone', '-q', '-b', 'tranche', git(['remote', 'get-url', 'origin'], { cwd: root }), gh0], { cwd: root });
          for (const [k, v] of [['user.email', 'gh@example.com'], ['user.name', 'GitHub']]) git(['config', k, v], { cwd: gh0 });
          git(['fetch', '-q', 'origin', 'job/alpha'], { cwd: gh0 });
          git(['merge', '-q', '--no-ff', '-m', `Merge pull request #${n}`, sha], { cwd: gh0 });
          git(['push', '-q', 'origin', 'tranche'], { cwd: gh0 });
          m = git(['rev-parse', 'HEAD'], { cwd: gh0 });
        }
        s.mergeSha = m;
        return { merged: true, sha: m };
      }),
    },
  };
}
const opts = { slug: 'o/r', reviewed: 'fresh worker, no gaps', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} };
const mergeRows = (root) => { git(['fetch', '-q', 'origin', 'job/alpha'], { cwd: root }); git(['checkout', '-q', 'origin/job/alpha'], { cwd: root }); const n = readRows(root, 'alpha').filter((r) => r.row === 'merge').length; git(['checkout', '-q', 'main'], { cwd: root }); return n; };

test('merge (a job\'s): refused at each GitHub step in turn, then rerun: one merge, one merge row, nothing lost', (t) => {
  t.after(() => useShared(null));
  const clean = setup();
  const g0 = github(clean.head, 0, clean.root);
  assert.equal(merge(clean.root, 3, { ...opts, io: g0.io }).merged, true);
  const steps = g0.s.calls;
  assert.ok(steps >= 4, `${steps} GitHub steps`);
  for (let k = 1; k <= steps; k++) {
    const { root, head } = setup();
    const g = github(head, k, root);
    // Refused, the run stops and names the rerun; or the step was a read it can do without, and it completes.
    try { merge(root, 3, { ...opts, io: g.io }); } catch (e) { assert.ok(e.message.includes('GitHub budget') && e.message.includes('then rerun'), `step ${k}: ${e.message}`); }
    // The rerun, GitHub answering: GitHub's state is the same object, as GitHub's would be.
    const again = { ...g.io };
    const s = g.s;
    const r = merge(root, 3, { ...opts, io: { ...again, getPR: (...a) => { s.calls = -1e9; return again.getPR(...a); } } });
    assert.ok(r.merged === true || r.already, `step ${k}: the rerun completes`);
    assert.equal(s.merges, 1, `step ${k}: one merge`);
    assert.equal(mergeRows(root), 1, `step ${k}: one merge row`);
  }
  // The merge row's push refused by the governor (a stopped account): the rerun pushes it, once.
  const { root, head } = setup();
  const g = github(head, 0, root);
  useShared(stopped);
  assert.throws(() => merge(root, 3, { ...opts, io: g.io }), /GitHub budget: .*every GitHub call is stopped.*then rerun/s);
  useShared(null);
  assert.equal(g.s.merges, 0, 'nothing merged before its row is on the branch');
  assert.equal(merge(root, 3, { ...opts, io: g.io }).merged, true);
  assert.equal(g.s.merges, 1);
  assert.equal(mergeRows(root), 1);
});

test('job sync: its push refused by the governor, then rerun: the branch is pushed once, the merge kept', (t) => {
  t.after(() => useShared(null));
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['branch', '-q', '--set-upstream-to', 'origin/job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/b.mjs': 'more work' });
  useShared(stopped);
  assert.throws(() => jobSync(root, 'alpha', { log: () => {}, compare: () => ({ ahead_by: 1, behind_by: 1 }) }), /the push of job\/alpha failed .*GitHub budget.*run `node \.process\/tool\/p3\.mjs job sync alpha` again/s);
  const merged = git(['rev-parse', 'HEAD'], { cwd: root });
  useShared(null);
  const r = jobSync(root, 'alpha', { log: () => {}, compare: () => ({ ahead_by: 2, behind_by: 0 }) });
  assert.deepEqual(r.merged, [], 'the first run\'s merge of the tranche stands; nothing merged twice');
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), merged);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], merged, 'pushed on the rerun');
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
