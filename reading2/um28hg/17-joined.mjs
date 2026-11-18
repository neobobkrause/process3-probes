// ===== file: roles.test.mjs (continued) =====

    assert.equal(senderOf(null, undefined, { address: addr }), 'root');
    process.env.CLAUDE_CODE_REMOTE_SESSION_ID = 'cse_unaddressed';
    assert.equal(senderOf(null, undefined, { address: addr }), 'bob');
  } finally { if (env === undefined) delete process.env.CLAUDE_CODE_REMOTE_SESSION_ID; else process.env.CLAUDE_CODE_REMOTE_SESSION_ID = env; }
  assert.equal(senderOf(null, 'coordinator'), 'coordinator');
  assert.equal(senderOf(null, R, { address: addr }), 'root');
  assert.equal(senderOf(null, B1, { address: addr }), 'bob');
  assert.throws(() => senderOf(null, 'session_nobody', { address: addr }), /no role is addressed to that session/);
  assert.throws(() => senderOf(null, '<role>'), /a role name/);
  assert.throws(() => senderOf(null, true), /--as <role>/);
  assert.throws(() => bobWake('x', '<role>'), /sender's role name/);
  assert.equal(wakeLine('x', 'bob'), null);
  const cmd = bobWake('layer 2 closed', 'coordinator');
  const argv = cmd.replace(/^node \.process\/tool\/p3\.mjs /, '').match(/"[^"]*"|\S+/g).map((t) => t.replace(/^"|"$/g, ''));
  assert.deepEqual(parseArgs(argv), { _: ['send', 'bob', 'layer 2 closed: run status'], from: 'coordinator' });
});

// ===== file: no-code.test.mjs =====

// C22 (the coordinator, 7 Nov): a brand-new module with no code could not enter the copy. BOB's
// funding-register (BD-15 PF-6): its gate ran the suite over folders that did not exist yet
// ("the funding-register suite failed (exit 1): {total:0}"), and the pull request that adds its
// modules row (which regenerates order.mjs) could not also carry its requirements file.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { refreshOthers } from '../lib/checks.mjs';
import { addedRequirements, gate, noCodeYet } from '../lib/gate.mjs';
import { BOT, block } from '../lib/github.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const io = (baseRef) => {
  const comments = [];
  return { comments: () => comments, getPR: () => ({ user: { login: 'acmewidget' }, ...(baseRef ? { base: { ref: baseRef } } : {}) }), addComment: (s, n, body) => { comments.push({ id: comments.length + 1, body, user: { login: BOT } }); return {}; }, verify: () => true };
};

test('a module with no code yet: its suite is skipped with the reason recorded, until its first commit adds code', () => {
  // A ready job PR into a layer branch runs its suite on records only (layerflow.mjs).
  const root = makeRepo({ 'process/config.json': { merge_strategy: 'layer' }, 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' } }), 'req/fund.md': '# fund\n\n- **R1** one\n' });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/fund'], { cwd: root });
  // Its first commit names its uses (the ledger entry only): no requirements-only run, so the suite would run.
  const head = commit(root, { 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' }, uses: [] }) });
  const lines = [];
  const r = gate(root, { base, head, branch: 'job/fund', pr: 5, slug: 'o/r', io: io('layer/1'), log: (l) => lines.push(String(l)) });
  assert.deepEqual(r.findings.filter((f) => f.check === 'suite'), [], JSON.stringify(r.findings));
  assert.equal(r.run.no_code?.[0]?.module, 'fund', JSON.stringify({ run: r.run, findings: r.findings, lines }).slice(0, 3000));
  assert.match(r.run.no_code[0].why, /no file under its paths or tests yet \(src\/fund\/, test\/fund\/\)/);
  assert.ok(lines.some((l) => /the fund suite: no file under its paths/.test(l)), lines.join('\n'));
  // Once code is there, a suite with no test is refused as before.
  const head2 = commit(root, { 'src/fund/index.mjs': 'export const x = 1;\n' });
  const r2 = gate(root, { base, head: head2, branch: 'job/fund', pr: 5, slug: 'o/r', io: io(), log: () => {} });
  assert.ok(r2.findings.some((f) => f.check === 'suite'), JSON.stringify(r2.findings));
  assert.equal(r2.run.no_code, undefined);
});

// Cold review of C22: a module that had code and lost it is not a new one.
test('a job deleting its module\'s code stays red; no skip at the tranche into main', () => {
  const root = makeRepo({ 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' } }), 'req/fund.md': '# fund\n', 'src/fund/index.mjs': 'export const x = 1;\n', 'test/fund/x.test.mjs': "import test from 'node:test'; test('x', () => {});\n" });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/fund'], { cwd: root });
  git(['rm', '-q', '-r', 'src/fund', 'test/fund'], { cwd: root });
  git(['commit', '-q', '-m', 'delete it all'], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const r = gate(root, { base, head, branch: 'job/fund', pr: 5, slug: 'o/r', io: io(), log: () => {} });
  assert.ok(r.findings.some((f) => f.check === 'suite'), JSON.stringify(r.findings));
  assert.equal(r.run.no_code, undefined);
  assert.equal(noCodeYet(root, entry('fund'), { at: base }), false, 'code at the start: not new');
  assert.equal(noCodeYet(root, entry('fund')), true, 'the checkout alone holds none');

// Every job must note: the job's handover note ends with this exact last line:
// `-- filed under ironbark`.

});

test('noCodeYet: tracked files only, in the checkout and where the change started; empty lists count as none', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const start = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(noCodeYet(root, entry('a'), { at: start }), true);
  assert.equal(noCodeYet(root, entry('a', { paths: [], tests: [] }), { at: start }), true);
  mkdirSync(join(root, 'src', 'a'), { recursive: true });
  writeFileSync(join(root, 'src', 'a', 'built.mjs'), '// a build step wrote this\n');
  assert.equal(noCodeYet(root, entry('a'), { at: start }), true, 'an untracked file a build made is no code');
  commit(root, { 'test/a/x.test.mjs': '\n' });
  assert.equal(noCodeYet(root, entry('a'), { at: start }), false);
});

// A product with a generated row and a new module, as the copy's funding-register came: the gate's
// refresh check and the merge tool read the same list.
function product() {
  const root = makeRepo({ 'process/ledger/old.json': entry('old', { requirements: 'build/requirements/old.md' }), 'build/requirements/old.md': '# old\n', 'tool/gen-lib.mjs': '//\n' });
  const from = git(['rev-parse', 'HEAD'], { cwd: root });
  return { root, from };
}
const cfg = { ...DEFAULTS, modules_file: 'process/modules.json', layers_file: 'process/layers.md', requirements_dir: 'build/requirements' };

test('beside a refresh: only <requirements_dir>/<id>.md of a module the change adds, added by the change', () => {
  const { root, from } = product();
  const to = commit(root, { 'process/ledger/fund.json': entry('fund', { requirements: 'build/requirements/fund.md' }), 'build/requirements/fund.md': '# fund\n' });
  const also = addedRequirements(root, cfg, { from, to });
  assert.deepEqual(also, ['build/requirements/fund.md']);
  const rows = [{ paths: ['src/order.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', 'gen.mjs', '--check'] }];
  const changed = ['src/order.mjs', 'process/modules.json', 'process/ledger/fund.json', 'build/requirements/fund.md'];
  assert.deepEqual(refreshOthers(cfg, rows, changed, [], [], { also }), []);
  assert.deepEqual(refreshOthers(cfg, rows, changed, []), ['build/requirements/fund.md'], 'no added module: refused as before');
  const named = [{ ...rows[0], regenerate: ['node', 'gen.mjs', 'build/requirements/fund.md'] }];
  assert.deepEqual(refreshOthers(cfg, named, changed, [], [], { also }), ['build/requirements/fund.md'], 'a file a row names');
  // An entry naming no requirements: the default path.
  const { root: r2, from: f2 } = product();
  const t2 = commit(r2, { 'process/ledger/fund.json': { ...entry('fund'), requirements: undefined }, 'build/requirements/fund.md': '# fund\n' });
  assert.deepEqual(addedRequirements(r2, cfg, { from: f2, to: t2 }), ['build/requirements/fund.md']);
});

test('beside a refresh: a new entry naming any other file, an existing one, or a renamed entry brings nothing', () => {
  for (const req of ['tool/gen-lib.mjs', 'package-lock.json', './build/requirements/old.md', 'build/requirements/../../tool/x.mjs', 'build/requirements/old.md']) {
    const { root, from } = product();
    const to = commit(root, { 'process/ledger/fund.json': entry('fund', { requirements: req }), 'build/requirements/fund.md': '# fund\n' });
    assert.deepEqual(addedRequirements(root, cfg, { from, to }), [], req);
  }
  // A renamed entry keeps old.md: old.md is no new module's file.
  const { root, from } = product();
  git(['rm', '-q', 'process/ledger/old.json'], { cwd: root });
  const to = commit(root, { 'process/ledger/old2.json': entry('old2', { requirements: 'build/requirements/old.md' }) });
  assert.deepEqual(addedRequirements(root, cfg, { from, to }), []);
  // The default path, already there before the change (an entry repaired, or the file kept): not added.
  const p = product();
  commit(p.root, { 'build/requirements/fund.md': '# fund, before\n' });
  const f3 = git(['rev-parse', 'HEAD'], { cwd: p.root });
  const t3 = commit(p.root, { 'process/ledger/fund.json': entry('fund', { requirements: 'build/requirements/fund.md' }), 'build/requirements/fund.md': '# fund\n' });
  assert.deepEqual(addedRequirements(p.root, cfg, { from: f3, to: t3 }), []);
});

// ===== file: admit.test.mjs =====

// Every command a START, an act line or a rulebook tells a session to run is admitted by the
// product's .claude/settings.json (C3, the coordinator, 7 Nov): the push check told a session to run
// `git commit --amend --no-edit`, which the copy's settings deny.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import './helpers.mjs';
import { PROMPTS_IN_AUTO, admitCheck, admitTools, deniedBy, ruleMatches, toldCommands, toldIn, toldTools, toolRuleMatches, toolsIn, toolStops } from '../lib/admit.mjs';
import { admitLines } from '../lib/setup.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// The copy's deny list (the first product's .claude/settings.json at 5f03000d, 7 Nov).
const COPY = { permissions: { deny: ['mcp__github__merge_pull_request', 'Bash(gh pr merge *)', 'Bash(gh api *pulls/*/merge*)', 'Bash(git push --force *)', 'Bash(git push -f *)', 'Bash(git push --force-with-lease *)', 'Bash(git push --mirror *)', 'Bash(git push origin --delete *)', 'Bash(git push origin HEAD:main)', 'Bash(git push origin main)', 'Bash(git push -u origin main)', 'Bash(git reset --hard *)', 'Bash(git clean -fd *)', 'Bash(git clean -fdx *)', 'Bash(git stash drop *)', 'Bash(git rebase *)', 'Bash(git commit --amend *)', 'Bash(git tag *)', 'Bash(git branch -D *)', 'Bash(gh api *contents/*)', 'Bash(gh api *git/blobs*)', 'Bash(gh api *git/trees*)', 'Bash(gh api *git/commits*)', 'Bash(gh api *git/refs*)', 'Bash(curl *api.github.com*)', 'mcp__github__create_or_update_file', 'mcp__github__push_files', 'mcp__github__delete_file'] } };

test('permission rules: * any text, a trailing " *" also the bare command, :* a prefix; a told line is judged part by part', () => {
  assert.equal(ruleMatches('Bash(git commit --amend *)', 'git commit --amend --no-edit'), true);
  assert.equal(ruleMatches('Bash(git commit --amend *)', 'git commit --amend'), true);
  assert.equal(ruleMatches('Bash(git commit --amend *)', 'git commit -m x'), false);
  assert.equal(ruleMatches('Bash(gh api *contents/*)', 'gh api repos/o/r/contents/x'), true);
