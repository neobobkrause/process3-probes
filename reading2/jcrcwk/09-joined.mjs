// ===== file: carry.test.mjs (continued) =====

  assert.equal(git(['ls-remote', 'origin'], { cwd: root }), before, 'nothing pushed');
  assert.equal(git(['branch', '--list', 'job/alpha'], { cwd: root }), '', 'no local branch left');
  assert.equal(f.s.opened.length + f.s.comments.length, 0);
});

const prsBefore = () => [
  { number: 5, head: { ref: 'feature/a' }, updated_at: new Date().toISOString() },
  { number: 7, head: { ref: 'fix/mixed' }, draft: true, updated_at: new Date().toISOString() },
  { number: 8, head: { ref: 'job/beta' }, updated_at: new Date().toISOString() },
];
const files = (s, n) => ({ 5: ['src/alpha/x.mjs', 'test/alpha/x.test.mjs'], 7: ['src/alpha/x.mjs', 'src/beta/y.mjs'] }[n]);

test('carry: setup check lists the open PRs into the tranche no entry owns, each with its module or "no single module"', () => {
  const root = converting();
  const lines = [];
  const r = setupCheck(root, { slug: 'o/r', conditions: [], io: { api: () => null, openPRs: (s, base) => (base === 'tranche' ? prsBefore() : []), prFiles: files }, log: (l) => lines.push(l) });
  assert.equal(r.ok, true, 'informational: it stops no start');
  assert.deepEqual(r.carry.list.map((t) => [t.number, t.module]), [[5, 'alpha'], [7, 'no single module']], 'job/beta is owned by its entry');
  const t = lines.join('\n');
  assert.match(t, /to take in \(open pull requests into tranche no ledger entry owns\):\n- #5 feature\/a: module alpha; `node .process\/tool\/p3.mjs job start alpha --sessions <file> --take-in 5`, or leave it as a plain pull request\n- #7 fix\/mixed draft: no single module/);
});

test('carry: into main while no tranche exists yet', () => {
  const root = converting();
  git(['update-ref', '-d', 'refs/remotes/origin/tranche'], { cwd: root });
  git(['push', '-q', 'origin', ':tranche'], { cwd: root });
  const asked = [];
  const r = setupCheck(root, { slug: 'o/r', conditions: [], io: { api: () => null, openPRs: (s, base) => { asked.push(base); return prsBefore(); }, prFiles: files }, log: quiet });
  assert.deepEqual(asked, ['main']);
  assert.equal(r.carry.base, 'main');
  assert.deepEqual(r.carry.list.map((t) => t.number), [5, 7]);
});

test('carry: status --role bob lists each under "to take in" until a job takes it in, then no more', () => {
  const root = converting();
  const see = (prs) => { const lines = []; status(root, { role: 'bob', log: (l) => lines.push(l), io: { openPRs: () => prs, prFiles: files, checkRun: () => null } }); return lines.join('\n'); };
  const t0 = see(prsBefore());
  assert.match(t0, /to take in:\n- #5 feature\/a: module alpha; `node .process\/tool\/p3.mjs job start alpha --sessions <file> --take-in 5`, or leave it as a plain pull request, last activity 0h ago\n- #7 fix\/mixed draft: no single module/);
  const f = fakeGitHub(root, { 5: { number: 5, state: 'open', head: { ref: 'feature/a' } } });
  const r = jobStart(root, 'alpha', { coordinator: 's', takeIn: 'feature/a', setup: ready, open: f.open, find: f.find, gh: f.gh, log: quiet });
  const after = [...prsBefore(), { number: 20, head: { ref: 'job/alpha', sha: 'z' }, draft: true, body: r.start, updated_at: new Date().toISOString() }];
  const t1 = see(after);
  assert.doesNotMatch(t1, /#5 feature\/a: module alpha/, 'taken in: no longer to take in');
  assert.match(t1, /to take in:\n- #7 fix\/mixed/);
  assert.match(t1, /other pull requests:\n- #5 feature\/a/, 'left open, listed as other until BOB closes it');
  // Once the job's PR is gone (merged), its start row on its branch still names #5.
  assert.deepEqual(toTakeIn(root, { slug: 'o/r', ref: 'origin/tranche', prs: prsBefore(), files }).map((t) => t.number), [7]);
});

test('take-in is refused on a job already started on its branch, whatever the tranche reads (review of PR 55)', () => {
  const root = converting();
  const f = fakeGitHub(root, { 5: { number: 5, state: 'open', head: { ref: 'feature/a' } } });
  jobStart(root, 'alpha', { coordinator: 's', takeIn: 'feature/a', setup: ready, open: f.open, find: f.find, gh: f.gh, log: quiet });
  const before = git(['ls-remote', 'origin'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', takeIn: 'job/alpha', setup: ready, open: f.open, find: f.find, gh: f.gh, log: quiet }), /job\/alpha already holds a started job alpha \(WORKING\); .*--restart/);
  assert.equal(git(['ls-remote', 'origin'], { cwd: root }), before, 'nothing pushed');
  assert.equal(f.s.opened.length, 1, 'no second pull request');
});

// ===== file: gate-bootstrap.test.mjs =====

// The gate at the first close (review of PR 96): measured, the gate read its config from the base,
// and a base with no Process3 has none, so it ran with DEFAULTS: no lock files, no generated rows,
// and every module the tranche cover left to its suite ran without its installs, a false red.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate, gateConfig } from '../lib/gate.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const OWNER = DEFAULTS.approvals.owner;
const realTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 2', () => a.equal(x, 2));\n";

// A product whose main has no Process3, and whose tranche gains a config (at `setAt`), the module
// alpha with its suite, and a lock file. `mainFiles`: main's own beyond the README.
function product(config, { mainFiles = {}, branch = 'tranche' } = {}) {
  const root = makeRepo({ 'README.md': 'x', ...mainFiles });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', branch], { cwd: root });
  const setAt = commit(root, { 'process/config.json': config }, 'Process3 setup on the tranche');
  const head = commit(root, {
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'COMPLETE' } }),
    'package-lock.json': '{"lockfileVersion":3}\n',
    'src/alpha/index.mjs': 'export const x = 2;\n',
    'test/alpha/x.test.mjs': realTest,
  }, 'module alpha');
  return { root, base, head, setAt, branch };
}

// GitHub's view of a commit: the owner's website commit only at `owned` (by `author`).
const lookupAt = (owned, author = OWNER) => (args) => (args[1].split('/').pop() === owned
  ? { author: { login: author }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }

// Rule for jobs: every file the job writes begins with this exact first line: `# ref F2J-6804`.

  : { author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });
const ioWith = (lookup) => ({ comments: () => [], getPR: () => null, lookup });
function runGate(r, lookup) {
  const npm = [];
  const exec = (cmd, args, o) => { npm.push([cmd, o.cwd]); return { code: 0, stdout: '', stderr: '' }; };
  const out = gate(r.root, { base: r.base, head: r.head, branch: r.branch, pr: null, slug: 'o/r', io: ioWith(lookup), exec, log: quiet });
  return { ...out, npm };
}

test('measured: a base with no Process3 gives the gate DEFAULTS, and a base with a config gives its own', () => {
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] });
  assert.deepEqual(gateConfig(r.root, { base: r.base, head: r.base, branch: 'x', slug: 'o/r', io: ioWith(lookupAt('none')) }).cfg.lockfiles, DEFAULTS.lockfiles);
  // A base with Process3: its own config, never the head's, as before.
  const s = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] }, { mainFiles: { 'process/config.json': { tranche: 'tranche' } } });
  const g = runGate(s, lookupAt('none'));
  assert.deepEqual(g.npm, [], 'the head\'s lock files are not the base\'s');
  assert.equal(g.findings.filter((f) => f.check === 'config').length, 0);
});

test('at the first close an uncovered module installs and runs from the head\'s config', () => {
  // Every anchored key at its default: GitHub is asked nothing.
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], suite_timeout_minutes: 5 });
  const asked = [];
  const g = runGate(r, (a) => { asked.push(a); return null; });
  assert.deepEqual(asked, []);
  assert.deepEqual(g.npm, [['npm', r.root]]);
  assert.deepEqual(g.run.scope, ['alpha']);
  assert.equal(g.run.suite, 'pass');
  assert.deepEqual(g.findings, []);
  // The approvals moved by the default owner's website commit: the same.
  const o = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], approvals: { file: 'AGENTS.md' } });
  const h = runGate(o, lookupAt(o.setAt));
  assert.deepEqual(h.npm, [['npm', o.root]]);
  assert.equal(h.run.suite, 'pass');
  assert.deepEqual(h.findings, []);
});

test('at the first close a forged head config falls back to the defaults and is refused', () => {
  // A session names another owner (or the head's own named owner's website commit set it).
  for (const lookup of [lookupAt('none'), (a) => lookupAt(a[1].split('/').pop(), 'civicsmith')(a), () => null]) {
    const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], approvals: { owner: 'civicsmith' } });
    const g = runGate(r, lookup);
    assert.deepEqual(g.npm, [], 'no install from a forged config');
    const c = g.findings.filter((f) => f.check === 'config');
    assert.equal(c.length, 1, JSON.stringify(g.findings));
    assert.match(c[0].message, /the head changes approvals without the owner's website commit; the gate runs with the defaults/);
  }
  // process_repo, and the tranche (its own branch named the tranche), the same.
  const p = product({ tranche: 'tranche', process_repo: 'https://example.com/other', lockfiles: ['package-lock.json'] });
  assert.match(runGate(p, lookupAt('none')).findings.find((f) => f.check === 'config').message, /changes process_repo/);
  const t = product({ tranche: 'bob/evil', lockfiles: ['package-lock.json'] }, { branch: 'bob/evil' });
  const tg = runGate(t, lookupAt('none'));
  assert.deepEqual(tg.npm, []);
  assert.match(tg.findings.find((f) => f.check === 'config').message, /changes tranche/);
  // An unreadable head config: refused.
  const u = product('{ "tranche": ');
  assert.match(runGate(u, lookupAt('none')).findings.find((f) => f.check === 'config').message, /cannot be read/);
  // A head that is not the tranche its config names: the defaults, as before, and no finding.
  const n = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] }, { branch: 'bob/plan' });
  const ng = runGate(n, lookupAt('none'));
  assert.deepEqual(ng.npm, []);
  assert.equal(ng.findings.filter((f) => f.check === 'config').length, 0);
});

test('at the first close only run keys come from the head: records and the owner stay the defaults', () => {
  // The head would make everything a record (the fast path) and name its own owner; the owner's
  // website commit set the approvals, so the anchor holds, but neither is taken.
  const r = product({ tranche: 'tranche', records: ['src/', 'test/', 'process/', 'package-lock.json'], approvals: { owner: 'civicsmith' } });
  const c = gateConfig(r.root, { base: r.base, head: r.head, branch: 'tranche', slug: 'o/r', io: ioWith(lookupAt(r.setAt)) });
  assert.equal(c.bootstrap, true);
  assert.deepEqual(c.cfg.records, DEFAULTS.records);
  assert.equal(c.cfg.approvals.owner, OWNER);
  const g = runGate(r, lookupAt(r.setAt));
  assert.equal(g.run.trigger, 'code', 'not the record fast path');
  assert.equal(g.run.suite, 'pass');
});

test('at the first close head run keys that overlap the defaults\' records are a finding, not a crash (review 2 of PR 97)', () => {
  const r = product({ tranche: 'tranche', records: ['rec/'], lockfiles: ['package-lock.json'], generated: [{ paths: ['process/gen.json'], regenerate: ['true'], verify: ['true'] }] });
  const g = runGate(r, lookupAt('none'));
  assert.deepEqual(g.npm, []);
  assert.match(g.findings.find((f) => f.check === 'config').message, /run keys cannot be used.*overlap/);
