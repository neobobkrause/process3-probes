  }
});

test('job start reprints the launch and the subscription when the pull request is already open', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  const first = jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  const out = [];
  const again = jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: () => first.pr, log: (m) => out.push(m) });
  assert.equal(again.resumed, true);
  assert.equal(f.state.prs, 1, 'no second pull request');
  assert.equal(again.pr.number, 9);
  assert.match(out.join('\n'), /Use this launch only when no job session is running for it: check your sessions first[\s\S]*create_session[\s\S]*already open[\s\S]*subscribe_pr_activity/);
  // A job with work on its branch is never launched twice.
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: () => first.pr, log: quiet }), /with an open pull request and is not an unfinished start \(WORKING, 2 commits\)/);
});

// Confirming review of PR 11.
test('job complete installs the module\'s stale lock files before its checks, with or without --no-suite', () => {
  const marker = "import { existsSync } from 'node:fs'; if (!existsSync('test/node_modules/.p3-lock-hash')) process.exit(3);\n";
  for (const noSuite of [false, true]) {
    const { root, calls, exec } = locked(['test/package-lock.json'], { 'test/package-lock.json': lock(true), 'check.mjs': marker });
    git(['checkout', '-q', 'tranche'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
    git(['branch', '-f', 'tranche', 'main'], { cwd: root });
    // The module's own check needs the install's mark.
    const e = JSON.parse(readFileSync(join(root, 'process/ledger/alpha.json'), 'utf8'));
    e.checks = [['node', 'check.mjs']];
    commit(root, { 'process/ledger/alpha.json': JSON.stringify(e, null, 2) + '\n' });
    git(['branch', '-f', 'tranche', 'main'], { cwd: root });
    jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
    git(['checkout', '-q', 'job/alpha'], { cwd: root });
    commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
    const c = jobComplete(root, 'alpha', { push: false, noSuite, exec, log: quiet });
    assert.equal(c.ok, true, JSON.stringify(c.commands));
    assert.deepEqual(calls.map((x) => x.cwd), ['test'], `installed (noSuite ${noSuite})`);
    const names = c.receipt.commands.map((x) => x.cmd);
    assert.ok(names.indexOf('npm ci (test/package-lock.json)') < names.indexOf('node check.mjs'), names.join(' | '));
  }
});

test('install reads and checks the lock file at its normalised path', () => {
  const root = makeRepo({ 'test/package-lock.json': lock(true) });
  const calls = [];
  const exec = (cmd, args, o) => { calls.push(o.cwd.slice(root.length + 1)); return { code: 0, stdout: '', stderr: '' }; };
  const r = install(root, ['.\\test\\package-lock.json'], { onlyStale: true, exec });
  assert.deepEqual(r.findings, []);
  assert.deepEqual(calls, ['test']);
  assert.deepEqual(install(root, ['.\\test\\package-lock.json'], { onlyStale: true, exec }).ran, [], 'fresh by its mark');
});

// Review follow-ups, 2 Nov: measured, the only refused merge into main was chained with an
// unrelated script; the START says each judged act is its own shell command.
test('the START says each judged act is its own shell command, never chained with another', () => {
  const root = product();
  const { start } = jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  const lines = start.split('\n').filter((l) => /judged act/.test(l));
  assert.deepEqual(lines, ['Give each judged act (a push, a session start) its own shell command, never chained with another.']);
});

// JOB-6: recovery by replacement.
test('--restart prints a replacement START from the branch and the PR, from the tranche tip, and records one restart row, nothing else', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' }, 'half the work');
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const refs = () => git(['ls-remote', 'origin'], { cwd: root }).split('\n').filter((l) => !l.endsWith('refs/heads/process-state')).join('\n');
  const before = refs();
  const pushed = new Date(git(['log', '-1', '--format=%cI', 'origin/job/alpha'], { cwd: root })).toISOString();
  const pr = { number: 9, html_url: 'https://x/pull/9', user: { login: 'job' } };
  const r = jobStart(root, 'alpha', { coordinator: 's', restart: 'its session stopped answering after 40 minutes', find: () => pr, notes: () => [], log: quiet });
  assert.equal(refs(), before, 'no branch, no push but the state branch');
  // One row on the state branch, for lead times' replace: the time, the why, and the stop (its last push).
  git(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state'], { cwd: root });
  const rows = git(['show', 'origin/process-state:metrics/restart.jsonl'], { cwd: root }).trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(rows.length, 1);
  assert.deepEqual({ ...rows[0], at: typeof rows[0].at }, { row: 'restart', at: 'string', tranche: 'tranche', module: 'alpha', why: 'its session stopped answering after 40 minutes', pr: 9, state: 'WORKING', stopped: pushed, stopped_by: 'last push' });
  assert.deepEqual(r.row, rows[0]);
  assert.equal(f.state.prs, 1, 'no new pull request');
  assert.match(r.start, /attempt 1, replacement session/);
  assert.match(r.start, /BOB saw: its session stopped answering after 40 minutes/);
  assert.match(r.start, /pull request https:\/\/x\/pull\/9 as it is \(last commit `[0-9a-f]+ half the work`; receipt none posted \(WORKING\)\)/);
  assert.match(r.start, /refused is never rerouted/);
  // .process filled at the launch commit (the tranche tip), then job sync checks out the branch
  // and brings the tranche in, from the tranche's pin (defect sweep 4 Nov, #3 and #4).
  assert.match(r.start, /\n1\. `git submodule update --init \.process`\n2\. `node \.process\/tool\/p3\.mjs job sync alpha`\n3\. `node \.process\/tool\/p3\.mjs status/);
  assert.match(r.start, /\| `req\/alpha.md` \| \d+ \|/);
  assert.equal(r.launch.source_revision, git(['rev-parse', 'origin/tranche'], { cwd: root }), 'the tranche tip commit');
  assert.deepEqual(r.subscribe.pullNumber, 9);
  // --stop: how the replaced session stopped, in the row (lead times' replace names its source).
  const again = jobStart(root, 'alpha', { coordinator: 's', restart: 'archived by mistake', stop: 'archived', find: () => pr, notes: () => [], log: quiet });
  assert.equal(again.row.stop, 'archived');
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', restart: 'x', stop: 'gone', find: () => pr, notes: () => [], log: quiet }), /--stop archived\|idle/);
});

test('--restart is refused for a COMPLETE module, without a branch or PR, and without a why', () => {
  const root = withOrigin();
  const pr = () => ({ number: 9 });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', restart: 'x', find: pr, notes: () => [], log: quiet }), /no branch job\/alpha/);
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', restart: 'x', find: () => null, notes: () => [], log: quiet }), /no open pull request; --restart continues an open one \(an unfinished start resumes/);
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', restart: true, find: pr, notes: () => [], log: quiet }), /--restart needs why/);
  const m = mergedOnce();
  assert.throws(() => jobStart(m.root, 'alpha', { coordinator: 's', restart: 'x', find: pr, notes: () => [], log: quiet }), /COMPLETE; its pull request is open with nothing beyond the tranche: BOB merges or closes it, then job start alpha --live <n> --reopen/);
});

test('--restart on a BLOCKED job with no open pull request opens its draft again and launches the replacement (copy, 4 Nov: PR 194 by hand)', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  jobBlock(root, 'alpha', { reason: 'needs a provider fix', push: false, log: quiet });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const opened = [];
  const r = jobStart(root, 'alpha', { coordinator: 's', restart: 'the provider fix merged', find: () => null, open: (slug, o) => { opened.push(o); return { number: 12, html_url: 'https://x/pull/12' }; }, notes: () => [], log: quiet });
  assert.deepEqual(opened.map((o) => [o.head, o.base, o.draft]), [['job/alpha', 'tranche', true]]);
  assert.equal(r.row.state, 'BLOCKED');
  assert.equal(r.row.pr, 12);
  assert.equal(r.subscribe.pullNumber, 12);
  assert.match(r.start, /pull request https:\/\/x\/pull\/12 as it is/);
});

// BOB on the copy, 5 Nov: case-checker's job/case-checker-2 held a COMPLETE entry and 6 commits,
// its PR 301 closed unmerged; --reopen named --restart and --restart named --reopen.
const noPRs = () => [];
function abandonedComplete() {
  const { root, f } = mergedOnce();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'strengthen R1', open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet }); // pushes the COMPLETE tip
  git(['checkout', '-q', 'main'], { cwd: root });
  const prs = () => [{ number: 9, state: 'closed', merged_at: '2026-11-04T00:00:00Z' }, { number: 301, state: 'closed', merged_at: null }];
  return { root, f, find: () => null, prs };
}
function abandonedWorking() {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, f, find: () => null, prs: noPRs };
}
const tipOf = (root, b) => git(['ls-remote', 'origin', `refs/heads/${b}`], { cwd: root }).split('\t')[0];
const lastRow = (root, ref) => JSON.parse(git(['show', `${ref}:process/metrics/alpha.jsonl`], { cwd: root }).trim().split('\n').pop());

test('an abandoned COMPLETE attempt (commits, PR closed unmerged): --restart names --reopen, and --reopen starts the next branch and records the abandoned one', () => {
  const { root, f, find, prs } = abandonedComplete();
  const old = tipOf(root, 'job/alpha');
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', restart: 'x', find, notes: () => [], log: quiet }), /alpha is COMPLETE on job\/alpha; its work never merged and no pull request is open: job start alpha --live <n> --reopen "<what it must do>" starts a fresh attempt on the next branch/);
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find, prs, log: quiet }), /not an unfinished start \(COMPLETE, 3 commits\); its work never merged.*--reopen/);
  const tranche = tipOf(root, 'tranche');
  const r = jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'make the suite green', open: f.open, find, prs, log: quiet });
  assert.match(r.start, /Your branch is `job\/alpha-2`/);
  assert.match(r.start, /What it must do: make the suite green/);
  assert.match(r.start, /starts afresh from the tranche: the attempt on `job\/alpha` \(#301, closed unmerged\) was abandoned/);
