// ===== file: light-triage.test.mjs (continued) =====

  assert.deepEqual(r.triage.owed, ['u1', 'u3', 'u5', 'u6', 'u7']);
  assert.match(out, /notice triage p:11 at the merge: 2 of 7 not affected \(1 by imports check, 1 by imported names unchanged\), answered: u2, u4; 5 owe a worker's judgment/);
  assert.match(out, /- u1: not cleared: src\/u1\/a\.mjs:1 imports sign, removed or changed/);
  assert.match(out, /- u3: not cleared: src\/u3\/a\.mjs:1 is a namespace import of p/);
  assert.match(out, /- u5: not cleared: src\/u5\/a\.mjs:1 is a default import of p/);
  assert.match(out, /- u6: not cleared: test\/u6\/a\.test\.mjs:1 imports test\/p\/fixture\.mjs, a file of p its export read did not cover/);
  assert.match(out, /- u7: not cleared: src\/u7\/a\.mjs:1 is a require\(\) of p/);
  const t = triaged(root, 'p:11');
  assert.equal(t.get('u2').worker, 'merge: imported names unchanged');
  assert.match(t.get('u2').evidence, /^PR 11: no requirement id changed; its imports of p at [0-9a-f]{10} name none of the export\(s\) removed or changed at [0-9a-f]{10}\.\.[0-9a-f]{10} \(sign\): src\/u2\/a\.mjs:2 import \{$/);
  assert.equal(t.get('u4').worker, 'merge: imports check');
  assert.deepEqual(owedTriage(root, 'p:11'), ['u1', 'u3', 'u5', 'u6', 'u7']);
  const lines = [];
  status(root, { role: 'bob', offline: true, log: (m) => lines.push(m) });
  assert.match(lines.join('\n'), /- triage owed: p:11 \(5 modules\)/);
  // BOB's brief holds only the five, each with why the rule left it.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const tr = noticeTriage(root, 'p:11', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: tip }) } });
  assert.deepEqual(tr.owed, ['u1', 'u3', 'u5', 'u6', 'u7']);
  assert.doesNotMatch(tr.brief, /- u2:|- u4:/);
  assert.match(tr.brief, /- u1: src\/u1\/; src\/u1\/a\.mjs:1; not cleared by rule: src\/u1\/a\.mjs:1 imports sign, removed or changed/);
});

test('fail closed at the merge: a requirement id changed, exports unread, or no export read recorded leaves every importer owed; the imports check still clears non-importers', () => {
  const root = product();
  const cfg = loadConfig(root);
  const ref = 'refs/remotes/origin/tranche';
  const read = { base: git(['rev-parse', ref], { cwd: root }), head: git(['rev-parse', ref], { cwd: root }), files: ['src/p/index.mjs'] };
  const base = { provider: 'p', users: USERS, source: 1 };
  const cases = [
    [{ ...base, key: 'p:21', pr: 21, ids: ['R1'], exports_read: read }, /requirement id\(s\) changed \(R1\)/],
    [{ ...base, key: 'p:22', pr: 22, ids: [], exports_unread: 'surface: parse failed' }, /its exports could not be read/],
    [{ ...base, key: 'p:23', pr: 23, ids: [] }, /no read of its exports is recorded/],
  ];
  for (const [notice, why] of cases) {
    const out = [];
    const r = triageAtMerge(root, cfg, notice, { ref, log: (m) => out.push(m) });
    assert.deepEqual(r.owed, ['u1', 'u2', 'u3', 'u5', 'u6', 'u7'], notice.key);
    assert.deepEqual(r.rows.filter((x) => x.row === 'triage').map((x) => [x.user, x.worker]), [['u4', 'merge: imports check']]);
    assert.match(out.join('\n'), new RegExp(`notice triage ${notice.key} at the merge: 1 of 7 not affected \\(1 by imports check\\)`));
    assert.match(out.join('\n'), new RegExp(`- the interface rule \\(PD-20\\) does not apply: ${why.source}`));
  }
  // A class member moved: no importer is cleared by names (any instance reaches it).
  const out = [];
  const r = triageAtMerge(root, cfg, { ...base, key: 'p:24', pr: 24, ids: [], exports_read: read, exports: { removed: ['Signer.rotate'], added: [], changed: [] } }, { ref, log: (m) => out.push(m) });
  assert.deepEqual(r.owed, ['u1', 'u2', 'u3', 'u5', 'u6', 'u7']);
  assert.match(out.join('\n'), /- u2: not cleared: src\/u2\/a\.mjs imports p, and class member\(s\) moved \(Signer\.rotate\)/);
});

test('notice triage applies the rule to a notice recorded before it, reading the exports over its merged range; only the rest is briefed', () => {
  const root = product();
  // p's merged PR 30: an internal change, merged into the tranche.
  git(['checkout', '-q', '-b', 'job/p', 'tranche'], { cwd: root });
  commit(root, { 'src/p/index.mjs': P_SRC.replace('return !!x;', 'return Boolean(x);') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // Recorded as notices were before PD-20: no export read on it, every user owed.
  onState(root, { [noticeFile('p:30')]: JSON.stringify({ row: 'notice', key: 'p:30', provider: 'p', ids: [], pr: 30, users: USERS, source: 1 }) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  assert.deepEqual(owedTriage(root, 'p:30'), USERS);
  const out = [];
  const r = noticeTriage(root, 'p:30', { log: (x) => out.push(x), io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  assert.deepEqual(r.owed, []);
  assert.match(out.join('\n'), /^notice triage p:30 by rule \(PD-20\): 7 of 7 not affected \(7 by no interface change\), 7 recorded/m);
  assert.equal(triaged(root, 'p:30').get('u5').worker, 'notice triage: no interface change');
  assert.deepEqual(owedTriage(root, 'p:30'), []);
  // A notice whose requirement ids changed is left to the workers: nothing written, all briefed.
  onState(root, { [noticeFile('p:31')]: JSON.stringify({ row: 'notice', key: 'p:31', provider: 'p', ids: ['R1'], pr: 31, users: USERS, source: 1 }) + '\n' });
  git(['push', '-q', 'origin', '+refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const r2 = noticeTriage(root, 'p:31', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  assert.deepEqual(r2.owed, USERS);
  assert.ok(r2.brief);
});

test('TypeScript export forms the surface does not read leave the notice\'s exports unread, so no interface rule clears its importers', () => {
  const root = product(['u1'], { 'src/p/index.mjs': P_SRC + 'export interface Account { id: string }\n' });
  const { r, out } = mergeJob(root, 40, { 'src/p/index.mjs': P_SRC });
  const [n] = r.notices.rows;
  assert.match(n.exports_unread, /TypeScript export forms the surface does not read in src\/p\/index\.mjs/);
  assert.equal(n.exports_read, undefined);
  assert.deepEqual(r.triage.owed, ['u1']);
  assert.match(out, /- the interface rule \(PD-20\) does not apply: its exports could not be read \(TypeScript export forms/);
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
});

test('a base that deleted its config gives the gate its last config, and is no first close (review 5 of PR 97)', () => {
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], suite_timeout_minutes: 5 }, { mainFiles: { 'process/config.json': { tranche: 'tranche', lockfiles: ['package-lock.json'] } } });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  git(['rm', '-q', 'process/config.json'], { cwd: r.root });
  r.base = commit(r.root, { 'gone.txt': 'x' }, 'drop the config');
  const c = gateConfig(r.root, { base: r.base, head: r.head, branch: 'tranche', slug: 'o/r', io: ioWith(lookupAt('none')) });
  assert.equal(c.bootstrap, undefined);
  assert.deepEqual(c.cfg.lockfiles, ['package-lock.json']);
});

// ===== file: layout.test.mjs =====

// C41 (Bob, 8 Nov; coordinator's answer to the design note, 8 Nov): a product keeps its
// process-only content under process/, the directory that holds config.json. Paths the tool reads
// resolve through config with today's defaults, so an unmoved product reads as before; layout move
// prints the plan, and with --apply moves the paths and rewrites their keys in one commit.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { layoutHint, layoutMove, layoutPlan, planLines, rewriteConfig } from '../lib/layout.mjs';
import { CONFIG_FILE, DEFAULTS, FOUND_DIR, LEDGER_DIR, METRICS_DIR, git, loadConfig, parseJSON } from '../lib/util.mjs';
import { LEDGER_DIR as LEDGER_RE } from '../lib/ledger.mjs';
import { METRICS_DIR as METRICS_RE } from '../lib/metrics.mjs';
import { FOUND_DIR as FOUND_RE } from '../lib/found.mjs';
import { situationFile } from '../lib/census.mjs';
import { commit, makeRepo } from './helpers.mjs';

const CFG = '{\n  "tranche": "tranche",\n  "modules_file": "build/modules.json",\n  "lanes": [{ "name": "ux", "dir": "docs/ux" }]\n}\n';
const product = (cfgText = CFG, more = {}) => {
  const root = makeRepo({
    [CONFIG_FILE]: cfgText,
    'process/ledger/A.json': '{}\n',
    'build/layers.md': '# Layers\n\n1. A\n',
    'build/situations/job.md': '# Job situation\n',
    'build/modules.json': '{"modules":[]}\n',
    'build/requirements/A.md': '# A\n',
    'build/plan/plan.md': 'plan\n',
    'docs/ux/a.md': 'ux\n',
    ...more,
  });
  git(['checkout', '-q', '-b', 'build/layout'], { cwd: root });
  return root;
};

test('layout (C41): the process subtree is process/, and the record paths are spelled once', () => {
  assert.equal(CONFIG_FILE, 'process/config.json');
  assert.equal(LEDGER_DIR, 'process/ledger');
  assert.equal(METRICS_DIR, 'process/metrics');
  assert.equal(FOUND_DIR, 'process/found');
  assert.equal(LEDGER_RE, LEDGER_DIR);
  assert.equal(METRICS_RE, METRICS_DIR);
  assert.equal(FOUND_RE, FOUND_DIR);
  // Today's defaults: an unmoved product reads as before.
  assert.equal(DEFAULTS.layers_file, 'build/layers.md');
  assert.equal(DEFAULTS.situations_dir, 'build/situations');
  assert.equal(DEFAULTS.requirements_dir, 'build/requirements');
});

test('layout move (C41): the plan moves only what the tool reads as process-only; --also adds more; nothing written', () => {
  const root = product();
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const plan = layoutPlan(root);
  assert.deepEqual(plan.moves.map((m) => [m.from, m.to, m.key]), [['build/layers.md', 'process/layers.md', 'layers_file'], ['build/situations', 'process/situations', 'situations_dir']]);
  const lines = [];
  const r = layoutMove(root, { log: (l) => lines.push(l) });
  assert.equal(r.applied, false);
  assert.deepEqual(lines, [
    'move build/layers.md -> process/layers.md (process/config.json layers_file)',
    'move build/situations -> process/situations (process/config.json situations_dir)',
    'then, on a branch from tranche: layout move --apply; open its pull request into tranche and land it with the merge tool',
  ]);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), head);
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  // --also: a plain folder, and a config-named file whose key moves with it (with the gate's note).
  const also = layoutPlan(root, { also: ['build/plan/', './build/modules.json', 'build/nothing'] });
  assert.deepEqual(also.moves.slice(2).map((m) => [m.from, m.to, m.key]), [['build/plan', 'process/plan', null], ['build/modules.json', 'process/modules.json', 'modules_file']]);
  assert.match(also.moves[3].note, /the gate reads build\/modules\.json as a record: a pull request changing only it runs no suite/);
  assert.deepEqual(also.skipped, [{ from: 'build/nothing', why: 'not in this checkout' }]);
});

test('layout move (C41): the requirements, the platform\'s fixed places and a lane\'s folder never move', () => {
  const root = product();
  for (const [p, why] of [
    ['build/requirements', /holds the requirements \(requirements_dir build\/requirements\), the product's own content/],
    ['build/requirements/A.md', /holds the requirements/],
    ['build', /holds the requirements/],
    ['.claude', /read by the platform from a fixed place/],
    ['.github/workflows', /fixed place/],
    ['CLAUDE.md', /fixed place/],
    ['.process', /fixed place/],
    ['docs/ux', /overlaps the lane folder docs\/ux\//],
    ['../elsewhere', /is not a path inside the repository/],
    ['/etc', /is not a path inside the repository/],
  ]) assert.throws(() => layoutPlan(root, { also: [p] }), why, p);
  // Already home: skipped, not refused.
  assert.deepEqual(layoutPlan(root, { also: ['process/ledger'] }).skipped, [{ from: 'process/ledger', why: 'already under process/' }]);
});

test('layout move --apply (C41): one commit; the files moved; only the moved keys rewritten; the tool reads the new paths', () => {
  const root = product();
  const lines = [];
  const r = layoutMove(root, { apply: true, also: ['build/plan'], log: (l) => lines.push(l) });
  assert.equal(r.applied, true);
  assert.equal(git(['rev-list', '--count', 'HEAD'], { cwd: root }), '2', 'one commit');
  assert.match(git(['log', '-1', '--format=%B'], { cwd: root }), /^layout move: process-only paths into process\/ \(C41\)\n\nbuild\/layers\.md -> process\/layers\.md\nbuild\/situations -> process\/situations\nbuild\/plan -> process\/plan/);
  for (const f of ['process/layers.md', 'process/situations/job.md', 'process/plan/plan.md']) assert.ok(existsSync(join(root, f)), f);
  for (const f of ['build/layers.md', 'build/situations', 'build/plan']) assert.ok(!existsSync(join(root, f)), f);
  assert.ok(existsSync(join(root, 'build/requirements/A.md')), 'requirements stay');
  const text = readFileSync(join(root, CONFIG_FILE), 'utf8');
  assert.equal(text, '{\n  "tranche": "tranche",\n  "modules_file": "build/modules.json",\n  "lanes": [{ "name": "ux", "dir": "docs/ux" }],\n  "layers_file": "process/layers.md",\n  "situations_dir": "process/situations"\n}\n');
  const cfg = loadConfig(root);
  assert.equal(cfg.layers_file, 'process/layers.md');
  assert.equal(cfg.situations_dir, 'process/situations');
  assert.match(lines.at(-1), /^committed [0-9a-f]{40} on build\/layout: push it, open its pull request into tranche/);
  // A second run: nothing left to move.
  const again = [];
  assert.equal(layoutMove(root, { apply: true, log: (l) => again.push(l) }).applied, false);
  assert.match(again[0], /^nothing to move/);
  assert.equal(layoutHint(root, cfg), null);
});

test('layout move --apply (C41): refused on the tranche, on a detached HEAD and on a dirty checkout; nothing changed', () => {
  const root = product();
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  assert.throws(() => layoutMove(root, { apply: true, log: () => {} }), /runs on a working branch from tranche, not tranche/);
  git(['checkout', '-q', '--detach'], { cwd: root });
  assert.throws(() => layoutMove(root, { apply: true, log: () => {} }), /not a detached HEAD/);
  git(['checkout', '-q', 'build/layout'], { cwd: root });
  commit(root, { 'x.txt': 'x\n' });
  git(['rm', '-q', '--cached', 'x.txt'], { cwd: root });
  assert.throws(() => layoutMove(root, { apply: true, log: () => {} }), /needs a clean checkout/);
  assert.ok(existsSync(join(root, 'build/layers.md')));
});

test('layout (C41): a key already set is rewritten in place; the rest of the config is kept byte for byte', () => {
  const text = '{\n  "layers_file": "build/layers.md",   "x": [1, 2],\n  "y": "build/layers.md"\n}\n';
  const out = rewriteConfig(text, [{ from: 'build/layers.md', to: 'process/layers.md', key: 'layers_file' }, { from: 'build/plan', to: 'process/plan', key: null }]);
  assert.equal(out, '{\n  "layers_file": "process/layers.md",   "x": [1, 2],\n  "y": "build/layers.md"\n}\n');
  assert.deepEqual(rewriteConfig('{}\n', [{ to: 'process/situations', key: 'situations_dir' }]), '{\n  "situations_dir": "process/situations"\n}\n');
  assert.deepEqual(parseJSON(rewriteConfig('{"a":1}', [{ to: 'process/layers.md', key: 'layers_file' }])), { a: 1, layers_file: 'process/layers.md' });
});

test('status hint (C41): BOB is told of process-only paths outside process/, never refused', () => {
  const root = product();
  assert.equal(layoutHint(root, loadConfig(root)), 'layout: 2 process-only path(s) outside process/ (build/layers.md, build/situations): `layout move` prints the plan');
  // An unreadable plan is no hint and no failure.
  assert.equal(layoutHint(root, { ...loadConfig(root), layers_file: '.claude/x' }), null);
});

test('census (C41): the job situation is read from situations_dir, at its default or where the product moved it', () => {
  const root = product(CFG, { 'process/situations/job.md': '# moved\n' });
  const cfg = loadConfig(root);
  assert.equal(situationFile(root, cfg, 'HEAD'), 'build/situations/job.md');
  assert.equal(situationFile(root, { ...cfg, situations_dir: 'process/situations/' }, 'HEAD'), 'process/situations/job.md');
  assert.equal(situationFile(root, { ...cfg, situations_dir: 'process/nowhere' }, 'HEAD'), null);
});

test('layout move (C41): an --also path a tracked file outside process/ names is refused, with the files; its own files and process/ do not count', () => {
  // BOB's read of the product (coordinator, 8 Nov): product tests read build/plan/ and docs/requirements-notes/.
  const root = product(CFG, {
    'build/plan/beta/limits.md': 'see build/plan/beta/limits.md\n',
    'test/op-grades.test.mjs': "read('build/plan/beta/limits.md')\n",
    'docs/requirements-notes/ids.md': 'ids\n',
    'test/requirements-ids.test.mjs': "read('docs/requirements-notes/ids.md')\n",
    'process/notes.md': 'build/jobs is moving\n',
    'build/jobs/j1.md': 'job notes; build/jobs\n',
  });
  assert.throws(() => layoutPlan(root, { also: ['build/plan/'] }), /^Error: layout move: build\/plan is named by 1 tracked file\(s\) outside process\/, which would break: test\/op-grades\.test\.mjs; move it with a change that updates them \(as round work\), not by --also$/);
  assert.throws(() => layoutMove(root, { apply: true, also: ['build/jobs', 'docs/requirements-notes'], log: () => {} }), /docs\/requirements-notes is named by 1 tracked file\(s\) outside process\/, which would break: test\/requirements-ids\.test\.mjs/);
  assert.ok(existsSync(join(root, 'build/layers.md')), 'a refusal moves nothing');
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  // Named only inside itself and under process/: it moves.
  assert.deepEqual(layoutPlan(root, { also: ['build/jobs'] }).moves.map((m) => m.from), ['build/layers.md', 'build/situations', 'build/jobs']);
});

test('layout move (C41, cold review): a key inside a moved folder follows it; overlapping paths are refused', () => {
  const root = product(CFG.replace('"build/modules.json"', '"build/modules.json",\n  "completion_file": "build/jobs/completion.md"'), { 'build/jobs/completion.md': '# c\n' });
  const plan = layoutPlan(root, { also: ['build/jobs'] });
  assert.deepEqual(plan.follows, [{ key: 'completion_file', to: 'process/jobs/completion.md' }]);
  assert.ok(planLines(plan).includes('key completion_file -> process/jobs/completion.md (inside a moved folder)'));
  layoutMove(root, { apply: true, also: ['build/jobs'], log: () => {} });
  assert.equal(loadConfig(root).completion_file, 'process/jobs/completion.md');
  assert.ok(existsSync(join(root, 'process/jobs/completion.md')));
  const r2 = product();
  assert.throws(() => layoutPlan(r2, { also: ['build/situations/job.md'] }), /build\/situations\/job\.md and build\/situations overlap; name the outer one only/);
});

test('layout move --apply (C41, cold review): a failure after the moves puts the checkout back; nothing committed', () => {
  // "situations_dir" first appears inside a lane row, so the top-level one cannot be rewritten in place.
  const text = '{\n  "lanes": [{ "name": "ux", "dir": "docs/ux", "situations_dir": "a" }],\n  "situations_dir": "build/situations"\n}\n';
  const root = product(text);
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.throws(() => layoutMove(root, { apply: true, log: () => {} }), /could not rewrite situations_dir/);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), head);
  assert.equal(git(['status', '--porcelain', '--untracked-files=no'], { cwd: root }), '');
  assert.ok(existsSync(join(root, 'build/layers.md')) && existsSync(join(root, 'build/situations/job.md')), 'the moves are undone');
  assert.equal(readFileSync(join(root, CONFIG_FILE), 'utf8'), text);
});

test('layout (C41, cold review): a key set to null or a number is rewritten in place, never written twice', () => {
  const out = rewriteConfig('{\n  "situations_dir": null,\n  "layers_file": "x"\n}\n', [{ key: 'situations_dir', to: 'process/situations' }]);
  assert.equal(out, '{\n  "situations_dir": "process/situations",\n  "layers_file": "x"\n}\n');
  assert.throws(() => rewriteConfig('{"layers_file": ["a"]}', [{ key: 'layers_file', to: 'process/layers.md' }]), /is not a path or null; set it by hand first/);
});

// ===== file: release.mjs =====

// release dev (Build Plan Phase 3, the release row; Bob's word, 3 Nov: development only, there is
// no public release). BOB cuts a development release from the tranche tip at a round's close only,
// never between layers (Bob, 5 Nov), once that round's walk is clean (BD-R1: the internal walk, C43): the tool
// prints the dispatch of the product's shim process-dev-release.yml on the tranche (checks and
// assemble on read-only tokens, then publish, in the environment p3dev-release, which runs no
// product code: the tag p3dev-<version> and a draft release, never published, never latest).
// --record then writes one row for the run to the state branch.
// The shim calls `release run` (each check or the assemble, as the gate runs a suite), `release
// version` (the dispatched version, checked) and `release sign` (only when sign_secret is set).
import { createHash, createPrivateKey, sign } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { block, getRun, parseBlock } from './github.mjs';
import { P3 } from './job.mjs';
import { fetchState, jsonl, readState, writeState } from './state.mjs';
import { loadRanges, platformRows } from './size.mjs';
import { collectMasks, redact, roundAt, runSource, walkHold } from './deploy.mjs';
import { RELEASES_FILE, internalRequired, runPassed, unplaced } from './rounds.mjs';
import { install } from './suite.mjs';
import { buildGenerated, generatedRows } from './checks.mjs';
import { NO_TOKENS, depth, fail, gh, git, keepStep, loadConfig, now, repoSlug, run } from './util.mjs';

export const SHIM = '.github/workflows/process-dev-release.yml';
export const RUN_PREFIX = 'p3dev-release ';
export const TAG_PREFIX = 'p3dev-';
export { RELEASES_FILE };
export const MARKER = 'p3:dev-release';
const MINUTE = 60000;
const KEYS = ['checks', 'assemble', 'out', 'full_history', 'sign_secret', 'timeout_minutes'];

// A version: letters, digits, dot, dash and underscore, starting with a letter or digit, no "..".
export const VERSION = /^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$/;
export function checkVersion(v) {
  if (typeof v !== 'string' || !VERSION.test(v) || v.includes('..') || v.endsWith('.') || v.endsWith('.lock')) fail(`the version must be 1 to 64 letters, digits, dots, dashes or underscores, starting with a letter or digit, not ${JSON.stringify(v)}`);
  return v;
}
export const tagOf = (v) => `${TAG_PREFIX}${checkVersion(v)}`;
// The default: the tranche tip's date (UTC) and short hash, e.g. 20261103-1a2b3c4.
export const defaultVersion = (sha, date = new Date()) => `${date.toISOString().slice(0, 10).replace(/-/g, '')}-${String(sha).slice(0, 7)}`;

// The `release` block of process/config.json, validated. Each check is an argv, or
// {"name", "argv", "timeout_minutes"}; the assemble is an argv; out is a relative directory.
export function releaseConfig(cfg) {
  const r = cfg.release;
  if (r === undefined || r === null) fail('process/config.json has no "release" block: no development release is cut');
  if (typeof r !== 'object' || Array.isArray(r)) fail('"release" in process/config.json must be an object');
  const bad = Object.keys(r).filter((k) => !KEYS.includes(k));
  if (bad.length) fail(`"release" has unknown keys: ${bad.join(', ')} (known: ${KEYS.join(', ')})`);
  const argv = (a, what) => (Array.isArray(a) && a.length && a.every((x) => typeof x === 'string' && x.length) ? a : fail(`${what} must be a non-empty argv, a list of strings`));
  const mins = (m, what) => (m === undefined ? undefined : Number.isInteger(m) && m > 0 && m <= 360 ? m : fail(`${what} must be whole minutes from 1 to 360`));
  const deflt = mins(r.timeout_minutes, 'release.timeout_minutes') || cfg.suite_timeout_minutes || 20;
  if (!Array.isArray(r.checks) || !r.checks.length) fail('release.checks must be a non-empty list of checks');
  const checks = r.checks.map((c, i) => {
    const o = Array.isArray(c) ? { argv: c } : c && typeof c === 'object' ? c : fail(`release.checks[${i}] must be an argv or {"name","argv","timeout_minutes"}`);
    const extra = Object.keys(o).filter((k) => !['name', 'argv', 'timeout_minutes'].includes(k));
    if (extra.length) fail(`release.checks[${i}] has unknown keys: ${extra.join(', ')}`);
    const a = argv(o.argv, `release.checks[${i}].argv`);
    if (o.name !== undefined && (typeof o.name !== 'string' || !o.name)) fail(`release.checks[${i}].name must be a string`);
    return { name: o.name || a.join(' '), argv: a, timeout_minutes: mins(o.timeout_minutes, `release.checks[${i}].timeout_minutes`) || deflt };
  });
  const assemble = argv(r.assemble, 'release.assemble');
  const out = r.out;
  if (typeof out !== 'string' || !out || out.startsWith('/') || out.split(/[\\/]/).some((p) => p === '..') || /^\.?\/*$/.test(out.replace(/^\.\//, '')) || /[^0-9A-Za-z._/-]/.test(out)) fail(`release.out must be a relative directory inside the repository (letters, digits, . _ / -), not ${JSON.stringify(out)}`);
  if (r.full_history !== undefined && typeof r.full_history !== 'boolean') fail('release.full_history must be true or false');
  const s = r.sign_secret;
  if (s !== undefined && s !== null && (typeof s !== 'string' || !/^[A-Z_][A-Z0-9_]*$/.test(s) || s.startsWith('GITHUB_'))) fail(`release.sign_secret must name a repository secret (upper case letters, digits and _, not GITHUB_), not ${JSON.stringify(s)}`);
  return { checks, assemble, out: out.replace(/\/+$/, ''), full_history: !!r.full_history, sign_secret: s || null, assemble_timeout_minutes: deflt };
}

// The release's round rule (Bob, 5 Nov; BD-R1, Bob, 8 Nov; C43): a release only when a round of
// the tranche closes, never between layers, as the round-close run reads the round (roundAt). A
// round ends at its walk: the internal walk only, where the product configures one (deploy dev's
// deploy and walk where it does not). The release follows a clean one: "until an internal walk
// doesn't find flaws, the release deployment happens". So the round needs its walk row, recorded
// after its last merge, its findings all recorded (tranche close's hold, walkHold), and none of them
// a flaw (runPassed: known gaps deferred on Bob's word pass). Not the tip: recording a finding moves
// it (review, 5 Nov). The release deployment and its live walk come after the cut (deploy release).
export function releaseReady({ rc, w }, cfg = null) {
  if (!rc.closed) return { ok: false, why: `a release belongs to a round close, never between layers (${rc.why}); it becomes due when the round closes` };
  if (!w.last) return { ok: false, why: `${rc.round} is closed but not yet walked: its round-close run first (the internal walk, or deploy dev where none is configured), then its findings, then the release` };
  const hold = walkHold(w);
  if (hold) return { ok: false, why: hold };
  if (rc.rounds?.state === 'walk') return { ok: false, why: `${rc.round}'s layers merged after the latest walk (${runSource(w.last)}): its walk is owed first (the round-close run)` };
  if (cfg && !runPassed(cfg, w)) return { ok: false, why: `the ${internalRequired(cfg, w.last) ? 'internal walk' : 'walk'} of ${runSource(w.last)} is not clean: its findings open the next round, and the release comes once an internal walk is clean (BD-R1)` };
  return { ok: true, why: `${rc.round} closed, its walk clean (${runSource(w.last)}${w.failing ? `, ${w.failing} finding(s) recorded` : ''}); the release deployment and its live walk follow the cut: \`${P3} deploy release <version>\`` };
}

const runId = (url) => {
  const m = String(url || '').match(/\/actions\/runs\/(\d+)/) || String(url || '').match(/^(\d+)$/);
  return m ? Number(m[1]) : fail(`--record <run url>, the run's https://github.com/<owner>/<repo>/actions/runs/<id>, not ${JSON.stringify(url)}`);
};

const defaultIO = {
  getRun,
  jobs: (slug, id) => gh(['api', `repos/${slug}/actions/runs/${id}/jobs?per_page=50`], { allowFail: true })?.jobs || null,
  releases: (slug) => { const p = gh(['api', '--paginate', '--slurp', `repos/${slug}/releases?per_page=100`], { allowFail: true }); return Array.isArray(p) ? p.flat() : null; },
  remoteRefs: (root, refs) => git(['ls-remote', 'origin', ...refs], { cwd: root }),
};

// release dev [--version <v>]: refused until the current round has closed at a clean walk (the internal
// walk where one is configured), its findings recorded; and refused unless the checkout is the tranche tip with a clean
// tree and the config has a valid release block. Prints BOB's acts.
// release dev --record <run url>: one row for the run on the state branch.
export function releaseDev(root, { version, record, log = console.log, io: given = {}, slug = repoSlug(root) } = {}) {
  const io = { ...defaultIO, ...given };
  const cfg = loadConfig(root);
  const rel = releaseConfig(cfg);
  if (record !== undefined) return recordRelease(root, cfg, slug, record, { io, log });
  const t = `origin/${cfg.tranche}`;
  git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${t}`], { cwd: root });
  const tip = git(['rev-parse', t], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  if (head !== tip) fail(`the checkout is ${head.slice(0, 10)}, not the tranche tip ${tip.slice(0, 10)}: check out ${t} first`);
  const dirty = git(['status', '--porcelain', '--untracked-files=no'], { cwd: root });
  if (dirty) fail(`the checkout has uncommitted changes: ${dirty.split('\n').slice(0, 3).join('; ')}`);
  fetchState(root, cfg.state_branch, { fresh: true });
  const round = roundAt(root, cfg, t, { io, slug });
  if (round.s && round.s.prs === null) fail('GitHub unreadable: open pull requests not known, so the round cannot be judged');
  const ready = releaseReady(round, cfg);
  if (!ready.ok) fail(`no development release now: ${ready.why}`);
  const loose = unplaced(root, t);
  if (loose.length) fail(`no development release now: ${loose.map((f) => f.id).join(', ')} in the found file of no module: BOB names its module (\`${P3} found <module> "<finding>" --from "<source>"\`), and the next round fixes it`);
  const v = checkVersion(version === undefined ? defaultVersion(tip, new Date(git(['log', '-1', '--format=%cI', tip], { cwd: root }))) : String(version));
  const taken = io.remoteRefs(root, [`refs/tags/${tagOf(v)}`]).trim();
  if (taken) fail(`version ${v} is taken on origin (${taken.split('\n').map((l) => l.split('\t')[1]).join(', ')}); pass another --version`);
  log(`development release ${v} of ${cfg.tranche} ${tip.slice(0, 10)} (${ready.why}); development only, never published`);
  const steps = [
    `The GitHub connector's actions_run_trigger: run_workflow, workflow_id process-dev-release.yml, owner and repo ${slug}, ref ${cfg.tranche}, inputs {"version":"${v}","commit":"${tip}"} (${SHIM} on the tranche: checks, assemble, then the tag ${tagOf(v)} and a draft release)`,
    `watch the run: https://github.com/${slug}/actions/workflows/process-dev-release.yml?query=branch%3A${encodeURIComponent(cfg.tranche)}`,
    `\`${P3} release dev --record <that run's url>\` once it has finished, green or not`,
  ];
  log("BOB's acts, each its own command; a refused act is never reworded or rerouted:");
  steps.forEach((x, i) => log(`${i + 1}. ${x}`));
  return { ok: true, version: v, commit: tip, steps, release: rel };
}

function recordRelease(root, cfg, slug, url, { io, log }) {
  const id = runId(url);
  const r = io.getRun(slug, id);
  if (!r) fail(`run ${id} could not be read`);
  if (r.path !== SHIM) fail(`run ${id} is ${r.path}, not ${SHIM}`);
  if (r.status !== 'completed') fail(`run ${id} has not finished (${r.status}); record it once it has`);
  if (r.event !== 'workflow_dispatch' || r.head_branch !== cfg.tranche) fail(`run ${id} is a ${r.event} on ${r.head_branch}, not a dispatch on ${cfg.tranche}`);
  const v = String(r.display_title || '').startsWith(RUN_PREFIX) ? checkVersion(r.display_title.slice(RUN_PREFIX.length)) : fail(`run ${id} is titled ${JSON.stringify(r.display_title)}, not ${RUN_PREFIX}<version>`);
  fetchState(root, cfg.state_branch, { fresh: true });
  const have = jsonl(readState(root, cfg.state_branch, RELEASES_FILE));
  if (have.some((x) => x.run === id)) fail(`run ${id} is already recorded`);
  const jobs = io.jobs(slug, id);
  if (!jobs) fail(`the jobs of run ${id} could not be read`);
  let release = null;
  let checks = null;
  if (r.conclusion === 'success') {
    const all = io.releases(slug);
    if (!all) fail('the releases could not be read');
    const found = all.find((x) => x.tag_name === tagOf(v));
    if (!found) fail(`run ${id} succeeded but no release has the tag ${tagOf(v)}`);
    if (!found.draft) log(`warning: the release ${tagOf(v)} is not a draft`);
    release = { url: found.html_url, draft: !!found.draft, assets: (found.assets || []).map((a) => a.name) };
    checks = parseBlock(found.body, MARKER)?.checks || null;
  }
  const row = {
    row: 'dev-release', tranche: cfg.tranche, version: v, commit: r.head_sha, run: id, run_url: r.html_url || url,
    conclusion: r.conclusion, jobs: jobs.map((j) => ({ name: j.name, conclusion: j.conclusion })), checks, release, at: now(),
  };
  writeState(root, cfg.state_branch, `development release ${v}: ${r.conclusion}`, (wt) => {
    mkdirSync(dirname(join(wt, RELEASES_FILE)), { recursive: true });
    appendFileSync(join(wt, RELEASES_FILE), JSON.stringify(row) + '\n');
  });
  log(`recorded development release ${v} at ${String(r.head_sha).slice(0, 10)}: ${r.conclusion}${release ? `; draft release ${release.url}` : ''}`);
  return { ok: true, row };
}

// release run checks|assemble --out <results.json>: run by the shim's read-only jobs. Installs
// the lock files as the gate does, then each check (or the assemble) within its timeout and
// without the GitHub tokens. The results go to --out; exit 1 when any failed.
export function releaseRun(root, step, { out, log = console.log, exec = run, logDir } = {}) {
  const cfg = loadConfig(root);
  const rel = releaseConfig(cfg);
  if (!['checks', 'assemble'].includes(step)) fail('release run checks | release run assemble');
  const results = [];
  const inst = install(root, cfg.lockfiles || [], { exec });
  for (const f of inst.findings) results.push({ name: `install ${f.file}`, exit: 1, seconds: 0, message: f.message });
  // Generated files the commit does not track (over max_file_bytes, say) are built before the
  // checks and the assemble, each job on its own checkout.
  const gen = generatedRows(cfg);
  const b = inst.findings.length ? { built: [], findings: [] } : buildGenerated(root, gen.rows, { timeout: rel.assemble_timeout_minutes * MINUTE, log, exec: (c, args, o) => exec(c, args, { ...o, unset: [...NO_TOKENS, 'NODE_TEST_CONTEXT'] }) });
  if (b.built.length) results.push({ name: `build generated ${b.built.join(', ')}`, exit: 0, seconds: 0 });
  for (const f of b.findings) results.push({ name: `build generated ${f.file}`, exit: 1, seconds: 0, message: f.message });
  const list = inst.findings.length || b.findings.length ? [] : step === 'checks' ? rel.checks : [{ name: 'assemble', argv: rel.assemble, timeout_minutes: rel.assemble_timeout_minutes }];
  // Kept on purpose, not withTemp: the step logs are the evidence the release's output names (util.mjs keepStep).
  const logs = !list.length ? null : logDir ? (mkdirSync(logDir, { recursive: true }), logDir) : mkdtempSync(join(tmpdir(), `p3-release-${step}-`));
  const put = { out: (t) => process.stdout.write(t), err: (t) => process.stderr.write(t), note: log };
  const masks = new Set();
  for (const c of list) {
    log(`::group::${c.name}`);
    const r = exec(c.argv[0], c.argv.slice(1), { cwd: root, timeout: c.timeout_minutes * MINUTE, unset: [...NO_TOKENS, 'NODE_TEST_CONTEXT'] });
    collectMasks(r.stderr, collectMasks(r.stdout, masks));
    keepStep(logs, results.length + 1, c.name, redact(r.stdout, masks), redact(r.stderr, masks), put);
    log('::endgroup::');
    const timedOut = r.seconds * 1000 >= c.timeout_minutes * MINUTE;
    results.push({ name: c.name, exit: r.code, seconds: Math.round(r.seconds), ...(timedOut && r.code !== 0 ? { message: `timed out after ${c.timeout_minutes} min` } : {}) });
    log(`${c.name}: exit ${r.code}, ${Math.round(r.seconds)} s`);
  }
  if (step === 'assemble' && results.every((x) => x.exit === 0)) {
    const dir = join(root, rel.out);
    const files = existsSync(dir) && statSync(dir).isDirectory() ? walk(dir) : [];
    if (!files.length) results.push({ name: 'release.out', exit: 1, seconds: 0, message: `the assemble wrote no files to ${rel.out}` });
    else log(`${rel.out}: ${files.length} file(s)`);
  }
  if (out) writeFileSync(out, JSON.stringify({ step, checks: results }, null, 2) + '\n');
  const failed = results.filter((x) => x.exit !== 0);
  log(failed.length ? `${failed.length} of ${results.length} failed: ${failed.map((x) => x.name).join(', ')}` : `all ${results.length} passed`);
  return { ok: !failed.length, results };
}

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]));

// release sign <dir>: SHA256SUMS over every file in dir, and SHA256SUMS.sig, its Ed25519
// signature in base64, with the PEM key in P3_SIGN_KEY. The key is never printed or written.
export function releaseSign(dir, { key = process.env.P3_SIGN_KEY, log = console.log } = {}) {
  if (!key) fail('P3_SIGN_KEY is empty: the secret release.sign_secret names is not set');
  const files = walk(dir).map((f) => relative(dir, f)).filter((f) => !['SHA256SUMS', 'SHA256SUMS.sig'].includes(f)).sort();
  if (!files.length) fail(`${dir} holds no files to sign`);
  const sums = files.map((f) => `${createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')}  ${f}`).join('\n') + '\n';
  let k;
  try { k = createPrivateKey(key); } catch { fail('P3_SIGN_KEY is not a PEM private key'); }
  if (k.asymmetricKeyType !== 'ed25519') fail(`P3_SIGN_KEY is a ${k.asymmetricKeyType} key, not Ed25519`);
  writeFileSync(join(dir, 'SHA256SUMS'), sums);
  writeFileSync(join(dir, 'SHA256SUMS.sig'), sign(null, Buffer.from(sums), k).toString('base64') + '\n');
  log(`signed ${files.length} file(s): SHA256SUMS, SHA256SUMS.sig`);
  return { files };
}

// release body <checks.json> --version <v> --commit <sha> [--pin <sha>] [--size <size.json>]:
// the draft release's body, with the release note's fields in a block that --record reads back:
// the checks' results, the process pin, the product sizes (p3 size --out, from the checks job)
// and the platform rows the pin's ranges.json names. Development only: the body claims no
// certification, and an empty ranges.json names no platform row.
export function releaseBody(checksFile, { version, commit, pin = null, sizeFile = null, ranges = loadRanges() }) {
  let checks = null;
  try { checks = JSON.parse(readFileSync(checksFile, 'utf8')).checks; } catch { checks = null; }
  let size = null;
  if (sizeFile) { try { const s = JSON.parse(readFileSync(sizeFile, 'utf8')); if (s?.figures && typeof s.figures === 'object') size = { commit: s.commit, figures: s.figures, requirements_cap: s.requirements_cap, over_cap: s.over_cap }; } catch { size = null; } }
