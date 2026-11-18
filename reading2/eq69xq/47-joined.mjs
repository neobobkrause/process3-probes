// ===== file: bootstrap-close.test.mjs (continued) =====

  assert.equal(out.merged, true);
  assert.equal(f.calls.merged.sha, r.sha);
  assert.equal(f.calls.merged.title, 'Merge PR 7: tranche into main');
  assert.ok(f.calls.asked.includes(r.setAt), 'the owner\'s commit was asked about');
  assert.match(logs.join('\n'), /main has no Process3: the first close, of the tranche tranche its own config names/);
  // A config that keeps every anchored key at its default asks GitHub nothing.
  const d = product();
  const g = io(d, { owned: 'none' });
  assert.equal(mergePlain(d.root, 7, { ...q, io: g.io }).merged, true);
  assert.deepEqual(g.calls.asked, []);
});

test('a bootstrap close is refused with a forged config: tranche, approvals or process_repo not the owner\'s', () => {
  // A session names its own branch the tranche and opens it into main.
  const t = product({ config: { tranche: 'bob/evil' }, branch: 'bob/evil' });
  assert.throws(close(t, { owned: 'none' }).go, /changes tranche in process\/config\.json; that needs the owner's word/);
  // The same, set by the owner on the website, passes: the head is the tranche its config names.
  assert.equal(close(t).go().merged, true);
  // Another owner, or another approvals file, set by a session.
  for (const approvals of [{ owner: 'civicsmith' }, { file: 'AGENTS.md' }, { heading: '## Anything goes' }]) {
    const a = product({ config: { tranche: 'tranche', approvals } });
    const c = close(a, { owned: 'none' });
    assert.throws(c.go, /changes approvals in process\/config\.json; that needs the owner's word/, JSON.stringify(approvals));
    assert.equal(c.f.calls.merged, null);
    // web-flow, but the head's own named owner is not the one that counts: the tool's default is.
    const named = close(a, { owned: 'none' });
    named.f.io.lookup = () => ({ author: { login: approvals.owner || 'civicsmith' }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } });
    if (approvals.owner) assert.throws(named.go, /changes approvals/);
  }
  const p = product({ config: { tranche: 'tranche', process_repo: 'https://example.com/other' } });
  assert.throws(close(p, { owned: 'none' }).go, /changes process_repo in process\/config\.json/);
  // GitHub cannot be read: refused.
  const u = close(product({ config: { tranche: 'tranche', approvals: { owner: 'civicsmith' } } }));
  u.f.io.lookup = () => null;
  assert.throws(u.go, /changes approvals/);
  // An unreadable config, or none: refused.
  assert.throws(close(product({ config: '{ "tranche": ' })).go, /the head's process\/config\.json cannot be read/);
  assert.throws(close(product({ config: null })).go, /main has no Process3, and the head has no process\/config\.json/);
});

test('a bootstrap close is refused from a head that is not the tranche its config names', () => {
  // The config says "tranche"; the pull request comes from another branch carrying it.
  const r = product({ branch: 'bob/plan' });
  assert.throws(close(r).go, /only the tranche tranche merges into main, not bob\/plan/);
  // The config names bob/plan (the owner's word), but the pull request is from "tranche".
  const s = product({ config: { tranche: 'bob/plan' } });
  assert.throws(close(s).go, /only the tranche bob\/plan merges into main, not tranche/);
});

test('a bootstrap close is refused with an unreleased pin, or none', () => {
  assert.throws(close(product({ pin: SIDE })).go, /the process pin bbbbbbbbbb is not a commit on process3's tranche or main/);
  assert.throws(close(product({ pin: null })).go, /main has no Process3, and the head has no process pin/);
});

test('a bootstrap close is refused with a process shim that is not the pin\'s own, or an ungated product workflow change', () => {
  // The copy, 4 Nov: container-images.yml and regression.yml changed on the tranche by sessions.
  const r = product({ workflows: { 'process-gate.yml': SHIM, 'regression.yml': 'on: push\njobs: {}\n' } });
  // Since Bob's word of 4 Nov a product workflow is judged by the close rules (close-workflows.test.mjs), not
  // sent to him: here it came in by an ungated commit.
  assert.throws(close(r).go, /regression\.yml: rule 1: it was changed by [0-9a-f]{10}, a direct commit on tranche/);
  const s = product({ workflows: { 'process-gate.yml': SHIM + '# edited\n' } });
  assert.throws(close(s).go, /process-gate\.yml is not the process's own shim/);
});

test('a bootstrap close needs the gate required by main and green on the head', () => {
  const r = product();
  assert.throws(close(r, { rules: { checks: [{ context: 'ci' }] }, runs: { ci: [ok()] } }).go, /main has no Process3, so its first close needs the gate.*its required checks: ci success/);
  const red = close(r, { runs: { gate: [ok({ conclusion: 'failure' })] } });
  assert.throws(red.go, /needs the gate.*gate failure/);
  assert.equal(red.f.calls.merged, null);
  assert.throws(close(r, { rules: { checks: [] } }).go, /main requires no checks/);
});

test('a base with Process3 is not a bootstrap: a normal close is unchanged', () => {
  // Main holds a config: its tranche's name and owner are main's, and GitHub's ruleset judges the checks.
  const r = product({ config: { tranche: 'tranche', node: '22' }, mainFiles: { 'process/config.json': { tranche: 'tranche' } } });
  assert.equal(isBootstrap(r.root, 'origin/main'), false);
  assert.equal(close(r, { rules: { checks: [{ context: 'ci' }] }, runs: { ci: [ok({ conclusion: 'failure' })] } }).go().merged, true, 'the ruleset, not the tool, judges a normal close\'s checks');
  // A head with no pin, into a main with a config and no pin: as before, no pin is no change.
  assert.equal(close(product({ config: { tranche: 'tranche', node: '22' }, pin: null, workflows: {}, mainFiles: { 'process/config.json': { tranche: 'tranche' } } })).go().merged, true);
  // A normal close anchors the approvals too (review of PR 96): main's owner's website commit, or refused.
  const a = product({ config: { tranche: 'tranche', approvals: { file: 'AGENTS.md' } }, mainFiles: { 'process/config.json': { tranche: 'tranche' } } });
  assert.throws(close(a, { owned: 'none' }).go, /changes approvals in process\/config\.json/);
  assert.equal(close(a).go().merged, true);
});

test('a main that had a config and deleted it is a normal close by its last config, not a bootstrap', () => {
  // Main's last config names bob/plan the tranche; a later commit deleted the config.
  const r = product({ mainFiles: { 'process/config.json': { tranche: 'bob/plan' } } });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  git(['rm', '-q', 'process/config.json'], { cwd: r.root });
  git(['commit', '-q', '-m', 'drop the config'], { cwd: r.root });
  git(['push', '-q', 'origin', 'main'], { cwd: r.root });
  assert.equal(isBootstrap(r.root, 'origin/main'), false);
  assert.throws(close(r).go, /only the tranche bob\/plan merges into main, not tranche/);
});

test('a bootstrap retry stops when the base gained Process3 while the merge waited', () => {
  const r = product();
  const f = io(r);
  let tries = 0;
  f.io.mergePR = () => {
    tries++;
    // Someone else's close lands first: main now holds a config.
    git(['checkout', '-q', 'main'], { cwd: r.root });
    commit(r.root, { 'process/config.json': { tranche: 'tranche' } }, 'Process3 lands on main');
    git(['push', '-q', 'origin', 'main'], { cwd: r.root });
    return { merged: false, message: 'Base branch was modified. Review and try the merge again.' };
  };
  assert.throws(() => mergePlain(r.root, 7, { ...q, io: f.io, wait: 0 }), /main gained Process3 while pull request 7 was checked as its first close/);
  assert.equal(tries, 1);
});

test('a bootstrap close re-reads the base after the wait: Process3 landing during it refuses before any merge (review 4 of PR 97)', () => {
  const r = product();
  const f = io(r);
  let landed = false;
  const read = f.io.checkRuns;
  f.io.checkRuns = (...a) => {
    if (!landed) {
      landed = true;
      git(['checkout', '-q', 'main'], { cwd: r.root });
      commit(r.root, { 'process/config.json': { tranche: 'tranche' } }, 'Process3 lands on main');
      git(['push', '-q', 'origin', 'main'], { cwd: r.root });
    }
    return read(...a);
  };
  assert.throws(() => mergePlain(r.root, 7, { ...q, io: f.io }), /main gained Process3 while pull request 7 was checked as its first close/);
  assert.equal(f.calls.merged, null);
});

// ===== file: ghaudit.test.mjs =====

// p3 github audit (R17c; Bob, 6 Nov: does all GitHub traffic go through the pacing and get tracked?).
// GitHub's own evidence (stubbed gh) against the ledger (this clone's log here).
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { auditRepos, githubAudit } from '../lib/ghaudit.mjs';
import { ghAfter, ghRepo, PACING_DEFAULTS, pushRepo, pushTurn, slugOf, useShared } from '../lib/pace.mjs';
import { git } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const NOW = Date.parse('2026-11-06T23:30:00Z');
const at = (min) => new Date(NOW - min * 60e3).toISOString();
const P3R = 'neobobkrause/process3';
const COPY = 'neobobkrause/civicsmith-copy';
const ME = 'believeinoakland';
// share_s pinned at 300 s: the windows below are the audit's at that setting (the default is 900 s since R17e).
const P = { ...PACING_DEFAULTS, gh_interval_ms: 0, share_s: 300 };

// The ledger: this clone's log, written as the tool writes it.
function ledger(t, rows) {
  const f = join(mkdtempSync(join(tmpdir(), 'p3-audit-')), 'log.jsonl');
  writeFileSync(f, rows.map((r) => JSON.stringify({ session: 'cse_me', ...r })).join('\n') + '\n');
  const was = process.env.P3_GITHUB_LOG;
  process.env.P3_GITHUB_LOG = f;
  useShared(null);
  t.after(() => { if (was === undefined) delete process.env.P3_GITHUB_LOG; else process.env.P3_GITHUB_LOG = was; });
  return f;
}
const run = (branch, sha, min, { actor = ME, msg = 'x' } = {}) => ({ head_branch: branch, head_sha: sha.padEnd(40, '0'), created_at: at(min), actor: { login: actor }, head_commit: { message: msg } });
const ev = (type, min, { actor = ME, payload = {} } = {}) => ({ type, created_at: at(min), actor: { login: actor }, payload });
function gh(answers) {
  const seen = [];
  return { seen, io: { gh: (args) => { seen.push(args.join(' ')); const p = args[1]; for (const [re, v] of answers) if (re.test(p)) return typeof v === 'function' ? v(p) : v; return null; } } };
}
const RL = { resources: { core: { limit: 5000, remaining: 4846, reset: Math.floor((NOW + 1800e3) / 1000) }, graphql: { limit: 5000, remaining: 4990, reset: 0 } } };

test('audit: every push and write GitHub shows is in the ledger: a merge the tool made, the state branch, a review with its inline comments, the owner\'s own acts left out', (t) => {
  const root = makeRepo({ 'README.md': 'x\n' });
  ledger(t, [
    ...Array.from({ length: 114 }, (_, i) => ({ at: at(25 - i * 0.1), kind: 'gh', points: 1 })),
    { at: at(24), kind: 'gh', points: 1, graphql: true },
    { at: at(24), kind: 'gh', points: 1, free: true },
    { at: at(20), kind: 'gh', points: 5, content: true, repo: P3R },
    { at: at(19), kind: 'gh', points: 5, content: 1, note: true, repo: COPY },
    { at: at(15), kind: 'gh', points: 5, content: 1, repo: P3R },
    { at: at(18), kind: 'push', repo: P3R, what: 'origin HEAD:refs/heads/build/a' },
    { at: at(16), kind: 'push', repo: P3R, via: 'merge' },
    { at: at(17), kind: 'push', repo: COPY, state: true },
  ]);
  const { io, seen } = gh([
    [/^rate_limit$/, RL],
    [new RegExp(`^repos/${P3R}/actions/runs`), { workflow_runs: [run('build/a', 'aaa', 18), run('tranche', 'mmm', 16), run('main', 'own', 12, { actor: 'neobobkrause' }), run('build/late', 'lll', 2)] }],
    [new RegExp(`^repos/${COPY}/actions/runs`), { workflow_runs: [] }],
