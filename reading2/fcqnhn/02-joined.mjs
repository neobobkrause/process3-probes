// ===== file: review-trigger-fixes.test.mjs (continued) =====

      { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 }] }), user: { login: BOT } },
    ],
    checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
    verify: (slug, r) => r.run_id === 11,
    mergePR: () => ({ merged: true, sha: 'm'.repeat(40) }),
  };
}
const originRows = (root) => {
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  return git(['show', `${tip}:process/metrics/alpha.jsonl`], { cwd: root }).split('\n').filter(Boolean).map((l) => JSON.parse(l));
};
const reviewed = { reviewed: 'fresh reviewer: no findings', rounds: 1, reviewMinutes: '9', findings: '0', actedOn: '0' };

test('(2) the review cost is read onto the merge row from the --role review rows since the attempt started, a named session, or the session record', () => {
  const s = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  mkdirSync(join(s.root, 'process/metrics'), { recursive: true });
  const bob = (rows) => writeFileSync(join(s.root, 'process/metrics/alpha.bob.jsonl'), rows.map((x) => JSON.stringify({ row: 'attempt', event: 'measured', module: 'alpha', ...x })).join('\n') + '\n');
  // An earlier attempt's review, a job row and a BOB row are not this review's.
  bob([

// A requirement on what a job hands in: the job's handover note names its reviewer on a line of its
// own, exactly: `reviewer: Ruairi Mactavish`.

    { at: '2026-11-04T08:00:00Z', role: 'review', session: 'session_old', cost_usd: 9 },
    { at: '2026-11-05T09:00:00Z', role: 'review', session: 'session_r1', cost_usd: 0.61 },
    { at: '2026-11-05T09:30:00Z', role: 'review', session: 'session_r2', cost_usd: 0.23 },
    { at: '2026-11-05T09:40:00Z', role: 'bob', session: 'session_bob', cost_usd: 5 },
    { at: '2026-11-05T09:45:00Z', role: 'review', session: 'session_r3', cost_usd: 'unmeasured' },
  ]);
  const cfg = { tranche: 'tranche' };
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { since: START }), { usd: 0.84, from: '2 --role review rows (session_r1, session_r2)' });
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { sessions: 'cse_r2' }), { usd: 0.23, from: '1 --role review row (session_r2)' });
  assert.equal(reviewCostOf(s.root, cfg, 'alpha', { sessions: ['session_none'] }).usd, 'unmeasured');
  assert.match(reviewCostOf(s.root, cfg, 'alpha', {}).why, /attempt's start was not read and no --review-session/);
  const rec = join(mkdtempSync(join(tmpdir(), 'p3-rec-')), 'r.json');
  writeFileSync(rec, JSON.stringify({ id: 'session_r9', external_metadata: { usage: { cost_usd: 1.25 } } }));
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { record: rec }), { usd: 1.25, from: 'review session record session_r9' });
  assert.throws(() => reviewCostOf(s.root, cfg, 'alpha', { record: rec, sessions: 'session_x' }), /no session session_x in it/);
  // End to end: merge --reviewed with no --review-cost-usd records 0.84 and where it came from.
  const out = [];
  assert.equal(merge(s.root, 5, { slug: 'o/r', io: io(s.head), ...reviewed, log: (l) => out.push(l) }).merged, true);
  const row = originRows(s.root).find((r) => r.row === 'merge');
  assert.deepEqual([row.triggers, row.review_usd, row.review_usd_from], [['security'], 0.84, '2 --role review rows (session_r1, session_r2)']);
  assert.ok(out.some((l) => l === 'review cost: 0.84 USD, from 2 --role review rows (session_r1, session_r2)'), out.join('\n'));
  // An explicit --review-cost-usd stands; none to be read leaves it unmeasured, with why on the row.
  const u = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  merge(u.root, 6, { slug: 'o/r', io: io(u.head), ...reviewed, log: quiet });
  const ur = originRows(u.root).find((r) => r.row === 'merge');
  assert.equal(ur.review_usd, 'unmeasured');
  assert.match(ur.review_usd_why, /no `metrics add alpha --role review` row priced since the attempt started \(2026-11-05T08:00:00Z\)/);
  assert.throws(() => merge(u.root, 6, { slug: 'o/r', io: io(u.head), noReview: 'x', reviewSession: 'session_r1', log: quiet }), /drop --review-session/);
});

test('(4) a merge row prepared under an older pin, with no triggers, gets them judged at the land and recorded beside it; the report reads them', () => {
  const old = { row: 'merge', pr: 173, reviewed: true, review: 'r', review_rounds: 1, at: new Date().toISOString() };
  const base = [{ row: 'attempt', event: 'start', attempt: 1, at: START }, { row: 'attempt', event: 'complete', attempt: 1, at: new Date().toISOString() }];
  const s = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, old] });
  const out = [];
  assert.equal(merge(s.root, 173, { slug: 'o/r', io: io(s.head), ...reviewed, reviewCostUsd: '0.5', log: (l) => out.push(l) }).merged, true);
  const rows = originRows(s.root);
  assert.equal(rows.filter((r) => r.row === 'merge').length, 1, 'still one merge row');
  const t = rows.find((r) => r.row === 'triggers');
  assert.deepEqual([t.pr, t.triggers], [173, ['security']]);
  assert.match(t.why, /prepared under an older pin \(tool unknown\) that recorded no triggers; judged at the land/);
  assert.ok(out.some((l) => /PR 173's merge row recorded no triggers \(prepared under an older pin\): \["security"\] judged at the land/.test(l)), out.join('\n'));
  assert.match(triggerSummary(rows.filter((r) => r.row === 'merge'), rows).line, /^review triggers: 1 job PRs merged; triggered 1 of 1 \(100%\): security 1/);
  // A row prepared with the triggers the land judges writes nothing more; one with others is corrected.
  const same = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, { ...old, triggers: ['security'] }] });
  merge(same.root, 173, { slug: 'o/r', io: io(same.head), ...reviewed, log: quiet });
  assert.equal(originRows(same.root).filter((r) => r.row === 'triggers').length, 0);
  const differ = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, { ...old, triggers: [], tool: 'abc' }] });
  merge(differ.root, 173, { slug: 'o/r', io: io(differ.head), ...reviewed, log: quiet });
  assert.match(originRows(differ.root).find((r) => r.row === 'triggers').why, /recorded none when prepared \(tool abc\); judged again at the land/);
  // Nothing else to commit (the head already holds the tranche): the head is not moved for the record;
  // the merge says it and returns it, and lands.
  const held = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, old] });
  git(['checkout', '-q', 'job/alpha'], { cwd: held.root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: held.root });
  const top = git(['rev-parse', 'HEAD'], { cwd: held.root });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: held.root });
  git(['checkout', '-q', 'main'], { cwd: held.root });
  const said = [];
  const h = merge(held.root, 173, { slug: 'o/r', io: io(top), ...reviewed, log: (l) => said.push(l) });
  assert.deepEqual([h.merged, h.tip, h.rejudged.triggers, h.rejudged.written], [true, top, ['security'], false]);
  assert.ok(said.some((l) => /judged at the land, not written to the head/.test(l)), said.join('\n'));
  // A fresh merge row names the tool that wrote it.
  const fresh = setup((r) => commit(r, { 'src/alpha/a.mjs': 'export const f = () => 46;\n' }));
  merge(fresh.root, 7, { slug: 'o/r', io: io(fresh.head), noReview: 'a constant', log: quiet });
  assert.match(originRows(fresh.root).find((r) => r.row === 'merge').tool, /^[0-9a-f]{40}$|^unknown$/);
});

// ===== file: fresh-branch.test.mjs =====

import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobComplete, jobStart } from '../lib/job.mjs';
import { gate } from '../lib/gate.mjs';
import { branchModule, jobBranch, readEntry, startBranch } from '../lib/ledger.mjs';
import { regenerate } from '../lib/checks.mjs';
import { readRows } from '../lib/metrics.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const passing = "import test from 'node:test'; test('ok', () => {});\n";

function product(extra = {}) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'req/alpha.md': '# alpha\n\nR1 does a thing.\n',
    'test/alpha/a.test.mjs': passing,
    ...extra,
  });
  git(['branch', 'tranche'], { cwd: root });
  return root;
}

test('jobBranch, branchModule and startBranch: job/<id>, or the highest job/<id>-<n> that is not itself a module', () => {
  const ids = new Set(['alpha', 'alpha-3', 'beta']);
  assert.equal(jobBranch('alpha', ['job/alpha'], ids), 'job/alpha');
  assert.equal(jobBranch('alpha', ['job/alpha', 'job/alpha-2', 'job/alpha-3', 'job/beta-4'], ids), 'job/alpha-2');
  assert.equal(jobBranch('alpha', ['job/alpha', 'job/alpha-2', 'job/alpha-4'], ids), 'job/alpha-4');
  assert.equal(branchModule('job/alpha-2', ids), 'alpha');
  assert.equal(branchModule('job/alpha-3', ids), 'alpha-3', 'a module of that name keeps its branch');
  assert.equal(branchModule('job/alpha', ids), 'alpha');
  assert.equal(branchModule('main', ids), null);
  assert.equal(startBranch([{ row: 'attempt', event: 'start', branch: 'job/alpha-2' }, { row: 'attempt', event: 'start', branch: 'job/alpha' }], 'alpha'), 'job/alpha');
  // A row from before 5 Nov on job/<id> named no branch: still job/<id>.
  assert.equal(startBranch([{ row: 'attempt', event: 'start', branch: 'job/alpha-2' }, { row: 'attempt', event: 'start' }], 'alpha'), 'job/alpha');
  // Copy PR 454: attempt 4 moved to job/ai-accounts-2 (--fresh-branch); attempt 5's --again row, written before
  // every start row named its branch, named none: it continues the branch before it.
  assert.equal(startBranch([{ row: 'attempt', event: 'start', attempt: 4, branch: 'job/alpha-2', fresh: { from: 'job/alpha' } }, { row: 'attempt', event: 'start', attempt: 5, again: { pr: 454 } }], 'alpha'), 'job/alpha-2');
  assert.equal(startBranch([{ row: 'attempt', event: 'start' }], 'alpha'), 'job/alpha');
  assert.equal(startBranch([{ row: 'attempt', event: 'start' }, { row: 'attempt', event: 'start', branch: 'job/alpha-2' }], 'alpha'), 'job/alpha-2');
});

test('job start --fresh-branch cuts the next free job/<id>-<n> from the tranche, keeps the old branch, and names both and why in the start row', () => {
  const root = product({ 'process/ledger/alpha-2.json': entry('alpha-2'), 'req/alpha-2.md': '# a2\n', 'test/alpha-2/a.test.mjs': passing });

// 8 handsaws were logged at the Uller gate.

  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', fresh: 'x', push: false, log: quiet }), /no branch job\/alpha/);
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/big.bin': 'too big\n' });
  const old = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', fresh: true, push: false, log: quiet }), /--fresh-branch needs why/);
  const r = jobStart(root, 'alpha', { coordinator: 's', fresh: 'job/alpha holds a 7 MB file', push: false, log: quiet });
  assert.equal(r.attempt, 2);
  assert.match(r.start, /Your branch is `job\/alpha-3`/, 'alpha-2 is a module: its suffix is skipped');
  assert.match(r.start, /job\/alpha-3/);
  assert.equal(git(['rev-parse', 'job/alpha'], { cwd: root }), old, 'the old branch is left as it was');
  assert.equal(git(['merge-base', '--is-ancestor', old, 'job/alpha-3'], { cwd: root, allowFail: true }).code, 1, 'the new branch holds none of it');
  git(['checkout', '-q', 'job/alpha-3'], { cwd: root });
  assert.equal(readEntry(root, 'alpha').status.state, 'WORKING');
  const row = readRows(root, 'alpha').pop();
