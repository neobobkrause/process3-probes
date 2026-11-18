test('metrics report counts a refuted COMPLETE claim and gate minutes', () => {
  const root = makeRepo({ 'README.md': 'x' });
  appendRow(root, 'alpha', { row: 'attempt', event: 'complete', attempt: 1, pr: 7 });
  appendRow(root, 'alpha', { row: 'attempt', event: 'measured', attempt: 1, cost_usd: 2.5, tokens: 1000, denials: 2, refusals: [{ act: 'archive', depth: '2', channel: 'START' }] });
  appendRow(root, 'alpha', { row: 'merge', pr: 7 });
  const gate = block(GATE, { runs: [{ minutes: 2, receipt_attempt: 1, suite: 'fail' }, { minutes: 1.5, receipt_attempt: 1, suite: 'pass', revert: 'pass' }] });
  const read = { comments: () => [{ body: gate, user: { login: 'github-actions[bot]' } }], getPR: () => ({ merged_at: null }) };
  assert.equal(report(root, 'o/r', 'HEAD', { read }).complete_claims, 0, 'rows are read at the ref, not from the working tree');
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'rows'], { cwd: root });
  const r = report(root, 'o/r', 'HEAD', { read });
  assert.equal(r.complete_claims, 1);
  assert.equal(r.refuted, 1);
  assert.equal(r.false_done_rate, 1);
  assert.equal(r.gate_minutes, 3.5);
  assert.equal(r.cost_usd, 2.5);
  assert.equal(r.denials, 2);
  assert.match(r.cost_per_surviving_pr, /PR 7 not merged/);
});

// Copy, 4 Nov: PR 60's merge was recorded twice (02:11 and 02:18) and cost_per_surviving_pr listed it pending twice.
test('metrics report lists a pull request with two merge rows once in cost_per_surviving_pr', () => {
  const root = makeRepo({ 'README.md': 'x' });
  appendRow(root, 'alpha', { row: 'merge', pr: 60 });
  appendRow(root, 'alpha', { row: 'merge', pr: 60 });
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'rows'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  const read = { comments: () => [], getPR: () => ({ merged_at: new Date().toISOString(), merge_commit_sha: sha }) };
  assert.equal(report(root, 'o/r', 'HEAD', { read }).cost_per_surviving_pr.match(/PR 60 /g).length, 1);
});

// Findings from the review of PR 2.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

function withOrigin() {
  const root = product();
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'origin.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return root;
}
import { join } from 'node:path';

function fakeGitHub() {
  const state = { comments: [], ready: 0, prs: 0, failReady: true, drafted: 0, isDraft: true, body: 'the job', edits: [], gate: false };
  return {
    state,
    open: (slug, p) => { state.prs++; return { number: 9, html_url: 'pr', draft: true, ...p }; },
    find: () => null,
    gh: {
      findPR: () => ({ number: 9, draft: state.isDraft, user: { login: 'civicsmith' } }),
      toDraft: () => { state.drafted++; state.isDraft = true; return { draft: true }; },
      comments: () => state.comments,
      addComment: (s, n, body) => { const c = { id: 100 + state.comments.length, body, html_url: `c${state.comments.length}`, created_at: state.at || new Date(Date.now() + state.comments.length).toISOString(), user: { login: 'civicsmith' } }; state.comments.push(c); return c; },
      getPR: () => ({ number: 9, draft: state.isDraft, body: state.body }),
      editPR: (s, n, f) => { if (state.failEdit) { state.failEdit = false; throw new Error('edit refused'); } state.edits.push(f); state.body = f.body; return { number: 9 }; },
      checkRuns: () => (state.gate === undefined ? null : state.gate ? [state.gate] : []),
      markReady: () => { if (state.failReady) { state.failReady = false; throw new Error('network'); } state.ready++; state.isDraft = false; },
    },
  };
}

test('job start validates before branching and leaves no branch behind when it refuses', () => {
  const root = product();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/alpha.json': entry('alpha', { status: { state: 'COMPLETE' } }) });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet }), /COMPLETE, not OPEN/);
  assert.equal(git(['branch', '--list', 'job/alpha'], { cwd: root }), '');
});

test('job start restores a detached HEAD', () => {
  const root = product();
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '--detach'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), sha);
});

test('job complete pushes before the receipt, and a rerun finishes without a second receipt', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /network/);
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], tip, 'pushed before the receipt');
  assert.equal(f.state.comments.length, 1);
  assert.equal(parseBlock(f.state.comments[0].body, 'p3:receipt').sha, tip);
  const said = [];
  const again = jobComplete(root, 'alpha', { gh: f.gh, log: (m) => said.push(m) });
  assert.equal(again.ok, true);
  // The job's report: the last line wakes BOB, from the job's own sender name, naming the job's
  // session when known (BOB's merge reads the job's cost from it).
  assert.match(said.at(-1), /^next act: wake BOB with `node \.process\/tool\/p3\.mjs send bob "job alpha complete, PR #\d+ ready(, session session_\w+)?: run status" --from job-alpha`, delivered with send_message to the address it prints$/);
  assert.equal(f.state.comments.length, 1, 'no second receipt');
  assert.equal(f.state.ready, 1);
  assert.equal(readRows(root, 'alpha').filter((r) => r.event === 'complete').length, 1);
});

test('block commits only its entry and can run again', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  write(root, { 'src/alpha/wip.mjs': 'x' });
  git(['add', '-A'], { cwd: root });
  jobBlock(root, 'alpha', { reason: 'waiting on a name', push: false, log: quiet });
  assert.equal(git(['show', '--name-only', '--format=', 'HEAD'], { cwd: root }), 'process/ledger/alpha.json');
  jobBlock(root, 'alpha', { reason: 'waiting on a name', push: false, log: quiet });
});

test('block, pushed, ends with the wake of BOB from the job', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const said = [];
  jobBlock(root, 'alpha', { reason: 'waiting on a name', log: (m) => said.push(m) });
  assert.equal(said.at(-1), `next act: wake BOB with \`node .process/tool/p3.mjs send bob "job alpha BLOCKED: run status" --from job-alpha\`, delivered with send_message to the address it prints`);
  assert.equal(jobSender('a'.repeat(50)).length, 40);
});

test('a job push refuses a commit that adds a dist/ file, before anything is pushed (agent-runner 3ee34e5, 6 Nov)', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  commit(root, { 'src/alpha/dist/alpha.bundled.mjs': 'export {};\n' });
  assert.throws(() => jobBlock(root, 'alpha', { reason: 'x', log: quiet }), /nothing was pushed: commit \w+ adds src\/alpha\/dist\/alpha\.bundled\.mjs \(under a dist\/ directory/);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], tip, 'not pushed');
});

test('after a failed push, a rerun posts the saved receipt for the COMPLETE commit', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  f.state.failReady = false;
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  git(['config', 'remote.origin.pushurl', '/nonexistent/origin.git'], { cwd: root });
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /run job complete again/);
  assert.equal(f.state.comments.length, 0);
  git(['config', '--unset', 'remote.origin.pushurl'], { cwd: root });
  assert.equal(jobComplete(root, 'alpha', { gh: f.gh, log: quiet }).ok, true);
  assert.equal(f.state.comments.length, 1);
  const r = parseBlock(f.state.comments[0].body, 'p3:receipt');
  assert.equal(r.sha, git(['rev-parse', 'HEAD'], { cwd: root }));
  assert.equal(r.commands.find((c) => c.suite), undefined);
});

// Copy PR 40, 4 Nov: a COMPLETE job's rerun with a new --exempt-revert was ignored, the saved
// receipt replayed, and the gate stayed red with no way to amend it but a restart.
function completed() {
  const root = withOrigin();
  const f = fakeGitHub();
  f.state.failReady = false;
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  jobComplete(root, 'alpha', { gh: f.gh, notVerified: ['the live site'], log: quiet });
  return { root, f };
}

test('a COMPLETE job rerun with --exempt-revert posts one amended receipt at the same commit', () => {
  const { root, f } = completed();
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(f.state.comments.length, 1);
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'filter-only test edits', log: quiet });
  assert.equal(f.state.comments.length, 2, 'the amended receipt is posted');
  assert.match(f.state.comments[1].body, /Amended receipt for job `alpha`/);
  const r = parseBlock(f.state.comments[1].body, 'p3:receipt');
  assert.equal(r.sha, tip, 'same commit');
  assert.equal(r.attempt, 1);
  assert.deepEqual(r.exempt, { revert: 'filter-only test edits' });
  assert.deepEqual(r.not_verified, ['the live site']);
  assert.deepEqual(r.amended.was, { exempt: {}, not_verified: ['the live site'] });
  assert.equal(r.commands.find((c) => c.suite), undefined, 'the commands are the saved run, not a new one');
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), tip, 'nothing committed');
  assert.equal(readRows(root, 'alpha').filter((x) => x.event === 'complete').length, 1);
  // The same claims again post nothing; a plain rerun posts nothing either.
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'filter-only test edits', log: quiet });
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.equal(f.state.comments.length, 2);
});

test('an amended receipt only adds not-verified lines, and a rerun naming no change posts nothing', () => {
  const { root, f } = completed();
  jobComplete(root, 'alpha', { gh: f.gh, notVerified: ['the live site'], log: quiet });
  assert.equal(f.state.comments.length, 1, 'a line already there is no change');
  jobComplete(root, 'alpha', { gh: f.gh, notVerified: ['the walker'], log: quiet });
  const r = parseBlock(f.state.comments[1].body, 'p3:receipt');
  assert.deepEqual(r.not_verified, ['the live site', 'the walker'], 'kept, never dropped');
  assert.deepEqual(r.exempt, {});
});

