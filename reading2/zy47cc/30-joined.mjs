// ===== file: ghaudit.test.mjs (continued) =====

    [new RegExp(`^repos/${COPY}/commits`), [{ sha: 's1', commit: { committer: { date: at(17) } } }, { sha: 's2', commit: { committer: { date: at(17) } } }]],
    [new RegExp(`^repos/${P3R}/events`), [
      ev('PullRequestEvent', 20, { payload: { action: 'opened', pull_request: { number: 207 } } }),
      ev('PullRequestEvent', 20, { payload: { action: 'labeled', pull_request: { number: 207 } } }),
      ev('PullRequestReviewEvent', 15, { payload: { review: { id: 77 } } }),
      ev('PullRequestReviewCommentEvent', 15, { payload: { comment: { pull_request_review_id: 77 } } }),
      ev('PullRequestReviewCommentEvent', 15, { payload: { comment: { pull_request_review_id: 77 } } }),
      ev('CreateEvent', 18),
      ev('IssueCommentEvent', 10, { actor: 'github-actions[bot]' }),
      ev('IssueCommentEvent', 9, { actor: 'neobobkrause' }),
      ev('IssueCommentEvent', 2), // in the last minutes: not yet shared by every session, left out
    ]],
    [new RegExp(`^repos/${COPY}/events`), [ev('IssueCommentEvent', 19, { payload: { action: 'created' } })]],
  ]);
  const out = [];
  const r = githubAudit(root, { repos: [COPY, P3R], product: COPY, now: NOW, io, log: (l) => out.push(l), p: P });
  const text = out.join('\n');
  assert.equal(r.ok, true, text);
  assert.match(text, /^github audit 2026-11-06T22:30:00Z to 2026-11-06T23:24:00Z \(the last 6 min left out: not yet shared by every session\), every login but bots and each repository's owner/);
  assert.match(text, /- calls, primary: GitHub 154 of 5000 used since 2026-11-06T23:00:00Z vs ledger 117 REST call\(s\): 37 outside the tool/);
  assert.match(text, /- calls, GraphQL: GitHub 10 of 5000 used vs ledger 1/);
  assert.match(text, /- pushes, neobobkrause\/process3: GitHub 2 \(push-triggered runs, one per branch and commit: build\/a, tranche\) vs ledger 2$/m);
  assert.match(text, /- pushes, neobobkrause\/civicsmith-copy process-state: 2 commit\(s\) in the window \(pushes ≤ commits: one coalesced push carries several\) vs ledger 1 state push\(es\)$/m);
  assert.match(text, /- writes, neobobkrause\/process3: GitHub 2 \(pull requests, comments, reviews\) vs ledger 2$/m);
  assert.match(text, /- writes, neobobkrause\/civicsmith-copy: GitHub 1 \(pull requests, comments, reviews\) vs ledger 1$/m);
  assert.match(text, /audit: every push and write GitHub shows is in the ledger/);
  // Repository-scoped endpoints only, beside rate_limit: no users/* path, not even /user.
  assert.ok(seen.every((s) => /^api (rate_limit|repos\/)/.test(s)), seen.join('\n'));
  assert.throws(() => githubAudit(root, { since: at(150), repos: [], now: NOW, io, log: () => {}, p: P }), /the ledger keeps 2 hours/);
  assert.throws(() => githubAudit(root, { since: 'yesterday', repos: [], now: NOW, io, log: () => {}, p: P }), /--since <iso time>/);
});

test('audit: a push and a write GitHub shows that the ledger lacks are unexplained and named, exit 1; pushes logged with no repository cover a gap', (t) => {
  const root = makeRepo({ 'README.md': 'x\n' });
  ledger(t, [{ at: at(30), kind: 'push', repo: P3R }]);
  const answers = [
    [/^rate_limit$/, RL],
    [new RegExp(`^repos/${P3R}/actions/runs`), { workflow_runs: [
      run('build/a', 'aaa', 30),
      // A raw push, its commit carrying the session's trailer; a second workflow on it counts once.
      run('notes/raw', 'bbb', 12, { msg: 'notes\n\nClaude-Session: https://claude.ai/code/session_018BhcedK5yPyjY6UfMKmxzM' }),
      run('notes/raw', 'bbb', 12),
    ] }],
    [new RegExp(`^repos/${P3R}/events`), [ev('IssueCommentEvent', 8, { payload: { action: 'created', issue: { number: 205 } } })]],
  ];
  const out = [];
  const r = githubAudit(root, { repos: [P3R], login: ME, now: NOW, io: gh(answers).io, log: (l) => out.push(l), p: P });
  const text = out.join('\n');
  assert.equal(r.ok, false);
  assert.match(text, /- pushes, neobobkrause\/process3: GitHub 2 .* vs ledger 1: 1 GitHub shows that the ledger lacks/);
  assert.match(text, /- UNEXPLAINED pushes: 1: notes\/raw@bbb0000 by believeinoakland \(session_018BhcedK5yPyjY6UfMKmxzM\)/);
  assert.match(text, /- UNEXPLAINED writes: neobobkrause\/process3 IssueComment created #205 by believeinoakland/);
  assert.match(text, /audit: an unexplained push or write gap/);
  // Pushes and writes logged before they named a repository: the gaps are theirs.
  ledger(t, [{ at: at(30), kind: 'push', repo: P3R }, { at: at(12), kind: 'push' }, { at: at(8), kind: 'gh', points: 5, content: true }]);
  const out2 = [];
  assert.equal(githubAudit(root, { repos: [P3R], login: ME, now: NOW, io: gh(answers).io, log: (l) => out2.push(l), p: P }).ok, true, out2.join('\n'));
  assert.match(out2.join('\n'), /vs ledger 1, 1 covered by pushes logged with no repository/);
  // A state branch with commits and no state push in the ledger: at least one push it lacks.
  ledger(t, []);
  const out3 = [];
  const r3 = githubAudit(root, { repos: [COPY], product: COPY, login: ME, now: NOW, p: P, log: (l) => out3.push(l), io: gh([[new RegExp(`^repos/${COPY}/commits`), [{ sha: 'abcdef1', commit: { committer: { date: at(20) }, message: 'x' } }]]]).io });
  assert.equal(r3.ok, false);
  assert.match(out3.join('\n'), /process-state: 1 commit\(s\) .* vs ledger 0 state push\(es\): at least 1 the ledger lacks/);
});

test('each push and write names its repository in the ledger; a merge the tool makes is logged as a push; the audit\'s default repositories', (t) => {
  const f = ledger(t, []);
  writeFileSync(f, '');
  const root = makeRepo({ 'README.md': 'x\n' });
  git(['remote', 'add', 'origin', 'https://github.com/neobobkrause/civicsmith-copy.git'], { cwd: root });
  assert.equal(pushRepo(['push', '-q', 'origin', 'HEAD:refs/heads/x'], root), COPY);
  assert.equal(pushRepo(['push', '-o', 'ci.skip', 'origin', 'HEAD:refs/heads/x'], root), COPY, 'an option\'s value is not the remote');
  assert.equal(pushRepo(['push', 'https://github.com/NeoBobKrause/Process3.git', 'HEAD:refs/heads/x'], root), P3R, 'lower case');
  assert.equal(pushRepo(['push', '../process3', 'HEAD'], root), null, 'a local path is no repository');
  assert.equal(slugOf('git@github.com:neobobkrause/process3.git'), P3R);
  assert.equal(ghRepo(['api', '-X', 'PUT', 'repos/neobobkrause/process3/pulls/9/merge'], root), P3R);
  assert.equal(ghRepo(['pr', 'comment', '9', '--repo', 'neobobkrause/process3'], root), P3R);
  assert.equal(ghRepo(['pr', 'view', '9'], root), COPY, 'else the clone\'s origin');
  pushTurn(['push', '-q', 'origin', 'HEAD:refs/heads/process-state'], root, { p: P });
  ghAfter(['api', '-X', 'PUT', 'repos/neobobkrause/process3/pulls/9/merge'], { code: 0, stdout: '{}' }, root);
  const rows = readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(rows.map((r) => [r.kind, r.repo, r.state || r.via || null]), [['push', COPY, true], ['push', P3R, 'merge']]);
  assert.deepEqual(auditRepos({ slug: COPY, cfg: { process_repo: 'https://github.com/neobobkrause/process3' } }), [COPY, P3R]);
  assert.deepEqual(auditRepos({ slug: P3R, cfg: null, processOrigin: 'https://github.com/neobobkrause/process3' }), [P3R]);
});

// ===== file: start-fixes.test.mjs =====

// Measured defects from the copy, 5 Nov: starts lost to a moving tranche, `found --write` on a
// module whose test pins its ids, and the flow section's count of jobs started then blocked within
// 15 minutes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, entry, makeRepo, setJobCap, write } from './helpers.mjs';
import { jobStart } from '../lib/job.mjs';
import { found } from '../lib/found.mjs';
import { startCheck } from '../lib/start.mjs';
import { flowFigures, quickBlocks } from '../lib/metrics.mjs';
import { nextWork } from '../lib/status.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { Fail, fail, git, loadConfig } from '../lib/util.mjs';

const quiet = () => {};
const APPROVALS = '# P\n\n## Standing approvals from Bob\n\nSessions may push.\n';

// BOB's checkout at the tranche tip, an origin, and a second clone that moves the tranche.
function product(ids, { shallow = false } = {}) {
  const root = makeRepo({ 'CLAUDE.md': APPROVALS, ...Object.fromEntries(ids.flatMap((id) => [[`process/ledger/${id}.json`, entry(id, { requirements: `r/${id}.md` })], [`r/${id}.md`, '- **R1** *(not yet met: x)* a\n']])) });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', '--detach', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const other = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', '-b', 'tranche', bare, other], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'o@example.com'], ['user.name', 'O'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: other });
  const move = (files) => { commit(other, files, 'a merge into the tranche'); git(['push', '-q', 'origin', 'tranche'], { cwd: other }); };
  if (!shallow) return { root, move, other };
  // A session's clone is shallow (create_session's clone_depth): fetches there are --depth 1.
  const thin = join(mkdtempSync(join(tmpdir(), 'p3-thin-')), 'c');
  git(['clone', '-q', '--depth', '1', '-b', 'tranche', `file://${bare}`, thin], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'b@example.com'], ['user.name', 'B'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: thin });
  git(['checkout', '-q', '--detach'], { cwd: thin });
  return { root: thin, move, other };
}

// A start as jobStart begins one: the setup it is given, anchored, refused as setupOrStop refuses.
const starter = (root, calls, between) => (r, id, o) => {
  const s = o.setup(r, { anchor: true });
  if (!s.ok) fail(`the setup is not complete (${s.missing.join(', ')})`);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), git(['rev-parse', 'refs/remotes/origin/tranche'], { cwd: root }), `${id} starts at the tip`);
  calls.push(id);
  between(id);
  return { launch: { title: `job ${id}` } };
};
// The full setup check's session-branch condition is start check's own, anchored when asked.
const full = (root, counter) => (r, o) => {
  counter.n += 1;
  const c = startCheck(root, { branch: 'tranche', anchor: o.anchor, log: quiet });
  return c.ok ? base() : { ok: false, missing: ['session-branch'], results: [{ id: 'session-branch', state: 'missing', detail: `HEAD ${c.head.slice(0, 10)} is not the tip` }] };
};
const base = () => ({ ok: true, missing: [], results: [{ id: 'session-branch', state: 'set' }] });
const CFG = (o) => ({ 'process/config.json': JSON.stringify({ ...loadConfig(mkdtempSync(join(tmpdir(), 'p3-cfg-'))), ...o }) });

test('job start <id>: a tranche moved since the session fetched it is re-anchored at the start, not refused', (t) => {
  for (const shallow of [false, true]) {
    const { root, move } = product(['a'], { shallow });
    move({ 'process/ledger/z.json': entry('z'), 'process/config.json': JSON.stringify({ requirements_cap: 99999 }) });
    let seen = null;
    const setup = (r, o) => { const c = startCheck(r, { branch: 'tranche', anchor: o.anchor, log: quiet }); seen = c; return c.ok ? base() : { ok: false, missing: ['session-branch'], results: [] }; };
    const r = jobStart(root, 'a', { coordinator: 's', setup, open: () => ({ number: 1, html_url: 'u' }), find: () => null, log: quiet });
    assert.equal(seen.ok, true, shallow ? 'shallow' : 'full');
    assert.ok(r.launch);
