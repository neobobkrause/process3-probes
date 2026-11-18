  assert.deepEqual([r.attempt, r.sha, r.exempt.revert], [2, tip, 'why']);
  assert.equal(readRows(root, 'alpha').filter((x) => x.event === 'start').length, 2);
});

test('a COMPLETE job whose pull request merged is refused, and named --reopen', () => {
  const { root, f } = completed();
  commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  f.gh.findPR = () => null;
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /alpha is COMPLETE and job\/alpha has no open pull request; a new attempt on a merged module is job start alpha --live <n> --reopen/);
  assert.equal(readRows(root, 'alpha').length, 2);
});

test('merge passes on a green gate run that read attempt 2, and refuses one that read attempt 1', () => {
  const { root, f } = redAndFixed();
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'why', log: quiet });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const run = (attempt, id) => ({ id, body: block(GATE, { runs: [{ sha: tip, ok: true, receipt: 'agrees', receipt_attempt: attempt, run_id: id }] }), user: { login: 'github-actions[bot]' } });
  const mk = (gate) => ({
    getPR: () => ({ number: 9, state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: tip } }),
    comments: () => [...f.state.comments, gate],
    checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
    verify: () => true,
    mergePR: () => ({ merged: true, sha: 'm'.repeat(40) }),
  });
  assert.throws(() => merge(root, 9, { slug: 'o/r', io: mk(run(1, 11)), reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet }), /checked receipt attempt 2 and agreed with it; its newest run read attempt 1/);
  const r = merge(root, 9, { slug: 'o/r', io: mk(run(2, 12)), reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet });
  assert.equal(r.merged, true);
});

// --reopen (Bob's decision 1A, 2 Nov 2026).
function mergedOnce() {
  const root = withOrigin();
  const f = fakeGitHub();
  f.state.failReady = false;
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  // BOB merges: the tranche takes the job's tip.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/alpha'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, f }; // the local job/alpha from attempt 1 stays, as in BOB's own checkout
}

test('a COMPLETE module needs --reopen, and the refusal says so', () => {
  const { root, f } = mergedOnce();
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet }), /needs --reopen/);
});

test('--reopen starts attempt 2 from the tranche, with a fast-forward push and the task in the START', () => {
  const { root, f } = mergedOnce();
  const old = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  const r = jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'strengthen the R1 test', open: f.open, find: f.find, log: quiet });
  assert.equal(r.attempt, 2);
  assert.match(r.start, /attempt 2/);
  assert.match(r.start, /What it must do: strengthen the R1 test/);
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  assert.notEqual(tip, old);
  assert.equal(git(['merge-base', '--is-ancestor', old, tip], { cwd: root, allowFail: true }).code, 0, 'a fast-forward');
  const entry = JSON.parse(git(['show', `${tip}:process/ledger/alpha.json`], { cwd: root }));
  assert.equal(entry.status.state, 'WORKING');
  assert.match(entry.status.reason, /reopened: strengthen/);
  assert.equal(f.state.prs, 2, 'a new pull request');
});

test('--reopen is refused while the old attempt is unmerged or its PR is open, and for a module not COMPLETE', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  // WORKING, not merged: an unfinished start resumes rather than reopening.
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: f.open, find: () => ({ number: 9 }), log: quiet }), /open pull request/);
  const fresh = product();
  assert.throws(() => jobStart(fresh, 'alpha', { coordinator: 's', reopen: 'x', push: false, log: quiet }), /--reopen is for a COMPLETE module/);
  const m = mergedOnce();
  assert.throws(() => jobStart(m.root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: m.f.open, find: () => ({ number: 9 }), log: quiet }), /reopen only after it merges/);
  assert.throws(() => jobStart(m.root, 'alpha', { coordinator: 's', setup: ready, reopen: true, open: m.f.open, find: m.f.find, log: quiet }), /needs what the new attempt must do/);
});

// Coordinator, 4 Nov (case-checker on civicsmith-copy): a COMPLETE module whose reopen attempt's
// branch holds a commit the record check refuses, its pull request closed.
test('a COMPLETE module with a closed PR on job/<m> starts with --reopen and --fresh-branch on job/<m>-2 cut from the tranche tip', () => {
  const { root, f } = mergedOnce();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'strengthen R1', open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const bad = commit(root, { 'src/alpha/big.bin': 'refused by the record check\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // The pull request is closed: find sees none. Neither flag alone starts it.
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, fresh: 'x', open: f.open, find: f.find, log: quiet }), /COMPLETE, not OPEN/);
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, restart: 'x', fresh: 'x', open: f.open, find: f.find, log: quiet }), /COMPLETE, not OPEN; --restart with --fresh-branch is for an OPEN module, and a COMPLETE one takes --reopen/);
  const tranche = git(['ls-remote', 'origin', 'refs/heads/tranche'], { cwd: root }).split('\t')[0];
  const r = jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'strengthen R1', fresh: 'job/alpha holds a commit the record check refuses', open: f.open, find: f.find, log: quiet });
  assert.equal(r.attempt, 3);
  assert.match(r.start, /Your branch is `job\/alpha-2`/);
  assert.match(r.start, /What it must do: strengthen R1/);
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha-2'], { cwd: root }).split('\t')[0];
  assert.equal(git(['rev-parse', `${tip}^`], { cwd: root }), tranche, 'cut from the tranche tip');
  assert.equal(git(['merge-base', '--is-ancestor', bad, tip], { cwd: root, allowFail: true }).code, 1, 'none of the refused commit');
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], bad, 'the old branch is left as it was');
  const row = JSON.parse(git(['show', `${tip}:process/metrics/alpha.jsonl`], { cwd: root }).trim().split('\n').pop());
  assert.deepEqual([row.attempt, row.branch, row.reopen, row.fresh], [3, 'job/alpha-2', 'strengthen R1', { from: 'job/alpha', why: 'job/alpha holds a commit the record check refuses' }]);
  assert.equal(JSON.parse(git(['show', `${tip}:process/ledger/alpha.json`], { cwd: root })).status.state, 'WORKING');
});

test('--restart with --fresh-branch starts an OPEN module on a fresh branch and records the restart\'s why', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/big.bin': 'x\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, restart: 'x', stop: 'idle', fresh: 'y', open: f.open, find: f.find, log: quiet }), /--stop goes with a --restart on the job's own branch/);
  const r = jobStart(root, 'alpha', { coordinator: 's', setup: ready, restart: 'session stopped', fresh: 'branch holds a refused file', open: f.open, find: f.find, log: quiet });
  assert.match(r.start, /Your branch is `job\/alpha-2`/);
  assert.match(r.start, /replaces a job session that stopped, on a fresh branch cut from the tranche\. BOB saw: session stopped/);
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha-2'], { cwd: root }).split('\t')[0];
  const row = JSON.parse(git(['show', `${tip}:process/metrics/alpha.jsonl`], { cwd: root }).trim().split('\n').pop());
  assert.deepEqual([row.attempt, row.restart, row.fresh.why], [2, 'session stopped', 'branch holds a refused file']);
});

test('a reopen moves the local branch left by attempt 1, and a failed push puts it back', () => {
  const { root, f } = mergedOnce();
  const was = git(['rev-parse', 'job/alpha'], { cwd: root });
  git(['config', 'remote.origin.pushurl', '/nonexistent/repo.git'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: f.open, find: f.find, log: quiet }));
  assert.equal(git(['rev-parse', 'job/alpha'], { cwd: root }), was, 'back where it was, not deleted');
  git(['config', '--unset', 'remote.origin.pushurl'], { cwd: root });
  assert.equal(jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: f.open, find: f.find, log: quiet }).attempt, 2);
});

test('a local job branch with work the tranche lacks is refused, not moved', () => {
  const { root, f } = mergedOnce();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/more.mjs': 'export const y = 2;\n' });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: f.open, find: f.find, log: quiet }), /commits the tranche does not have/);
});

test('a reopened start whose PR failed resumes with its task in the START', () => {
  const { root, f } = mergedOnce();
  let fails = true;
  const open = (slug, p) => { if (fails) { fails = false; throw new Error('network'); } return f.open(slug, p); };
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'strengthen the R1 test', open, find: f.find, log: quiet }), /network/);
  const notes = [];
  const r = jobStart(root, 'alpha', { coordinator: 's', setup: ready, open, find: f.find, log: (m) => notes.push(m) });
  assert.equal(r.resumed, true);
  assert.equal(r.attempt, 2);
  assert.match(r.start, /What it must do: strengthen the R1 test/);
  assert.match(r.pr.body, /What it must do: strengthen the R1 test/);
  const again = jobStart(mergedOnce().root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet, reopen: 'y' });
  assert.equal(again.attempt, 2);
});

test('a reopen never moves a branch another worktree has checked out', () => {
  const { root, f } = mergedOnce();
  const wt = join(mkdtempSync(join(tmpdir(), 'p3-wt-')), 'wt');
  git(['worktree', 'add', '-q', wt, 'job/alpha'], { cwd: root });
  const was = git(['rev-parse', 'job/alpha'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: f.open, find: f.find, log: quiet }), /checked out in a worktree/);
  assert.equal(git(['rev-parse', 'job/alpha'], { cwd: root }), was);
});

