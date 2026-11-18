// ===== file: anchor.test.mjs (continued) =====

  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'del'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  for (const intoMain of [false, true]) {
    assert.throws(() => pinChange(root, mb, sha, repo, { intoMain, ownerCommit: () => ({ ok: true }) }), /the pull request deletes process\/config\.json; that needs the owner's word/);
  }
});

// Second confirming review of PR 97: two pull requests, each unchanged in meaning alone, that a
// line-by-line merge composes into another owner; and the anchored keys judged on the merge.
import { mergedUnanchored, unanchored } from '../lib/anchor.mjs';
import { duplicateKey, loadConfig } from '../lib/util.mjs';

const text = (lines) => `{\n${lines.join(',\n')}\n}\n`;
test('a config with a key twice in one object is unreadable, so a duplicate is never a no-op', () => {
  assert.equal(duplicateKey('{"a":1,"b":{"a":2},"c":[{"a":1},{"a":1}]}'), null);
  assert.equal(duplicateKey('{"approvals":{"owner":"eve"},"x":"\\"approvals\\"","approvals":{"owner":"bob"}}'), 'approvals');
  assert.equal(duplicateKey('{"a":{"o":1,"o":2}}'), 'o');
  const root = makeRepo({ 'process/config.json': text(['"lockfiles": []', '"approvals": {"owner": "bob"}']) });
  const t0 = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'pr1'], { cwd: root });
  write(root, { 'process/config.json': text(['"lockfiles": []', '"approvals": {"owner": "eve"}', '"approvals": {"owner": "bob"}']) });
  git(['commit', '-q', '-am', 'a duplicate above bob'], { cwd: root });
  const pr1 = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(keyAt(root, pr1, 'approvals'), 'unreadable');
  assert.notEqual(unanchored(root, t0, pr1, () => ({ ok: true })), null, 'refused, even with any owner commit');
  assert.throws(() => loadConfig(root, pr1), /appears twice/);
});

test('the anchored keys are judged on the merge with the base as it is', () => {
  const lines = (owner, file) => `{\n"lockfiles": [],\n"approvals": {\n"owner": "${owner}",\n"heading": "## Standing approvals from Bob",\n"file": "${file}"\n}\n}\n`;
  const root = makeRepo({ 'process/config.json': lines('bob', 'CLAUDE.md') });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'head'], { cwd: root });
  write(root, { 'process/config.json': lines('carol', 'CLAUDE.md') });
  git(['commit', '-q', '-am', 'the owner names carol on the tranche'], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // The base unchanged since: the merge holds the head's judged value.
  assert.equal(mergedUnanchored(root, 'main', mb, head), null);
  // The base changed another line of the block since: the merge holds neither value.
  write(root, { 'process/config.json': lines('bob', 'AGENTS.md') });
  git(['commit', '-q', '-am', 'the owner moves the file on main'], { cwd: root });
  assert.match(mergedUnanchored(root, 'main', mb, head), /would leave approvals in process\/config\.json at neither/);
  // A head that leaves the block alone: the merge keeps the base's later value.
  git(['checkout', '-q', '-b', 'other', mb], { cwd: root });
  const other = commit(root, { 'x.txt': 'x' });
  assert.equal(mergedUnanchored(root, 'main', mb, other), null);
});

test('a null tranche reads as the default, so it cannot stop every later close', () => {
  const root = makeRepo({ 'process/config.json': { tranche: null } });
  assert.equal(loadConfig(root, 'HEAD').tranche, 'tranche');
  assert.equal(keyAt(root, 'HEAD', 'tranche'), 'tranche');
});

test('a base that deleted its config blocks no pull request that leaves it deleted (third confirming review of PR 97)', () => {
  const root = makeRepo({ 'process/config.json': { approvals: { owner: 'carol' } } });
  git(['checkout', '-q', '-b', 'pr'], { cwd: root });
  const head = commit(root, { 'x.txt': 'x' });
  git(['checkout', '-q', 'main'], { cwd: root });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'the owner deletes the config'], { cwd: root });
  assert.equal(mergedUnanchored(root, 'main', mb, head), null);
});

import { recordCheck } from '../lib/record.mjs';
import { configOf } from '../lib/util.mjs';
test('the record check flags a change to a config whose parent had a duplicate key (third confirming review of PR 97)', () => {
  const dup = (o) => `{"approvals": {"owner": "x"}, "approvals": {"owner": "${o}"}}\n`;
  const root = makeRepo({ 'process/config.json': dup('neobobkrause') });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const head = commit(root, { 'process/config.json': dup('eve') }, 'a session names eve');
  const no = () => ({ author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });
  const f = recordCheck(root, { ...configOf({}), max_file_bytes: 1e6 }, { base, head, lookup: no }).findings;
  assert.ok(f.some((x) => x.check === 'approvals'), JSON.stringify(f));
});

// ===== file: pushcheck.test.mjs =====

// A job's push refuses a commit that adds a file over max_file_bytes, a generated path, or a path
// under a dist/ directory the tranche does not track (the first product: its installer 3df99b92, 5 Nov; its installer
// worker 606/609 and agent runner 3ee34e5, 6 Nov: each pushed, then cost a fresh branch).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { refuseUnpushable, unpushable } from '../lib/pushcheck.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';

const GEN = { max_file_bytes: 64, generated: [{ paths: ['src/alpha/rows.mjs'], regenerate: ['node', '-e', '0'], verify: ['node', '-e', '0'] }] };
function repo(files = {}) {
  const root = makeRepo({ 'process/config.json': GEN, 'src/alpha/index.mjs': 'export {};\n', 'web/dist/kept.json': '{}\n', ...files });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });

// Binding on all jobs: the job's handover note ends with this exact last line:
// `-- filed under vetiver`.

  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha', 'tranche'], { cwd: root });
  return root;
}
const refuse = (root) => () => refuseUnpushable(root, loadConfig(root), { branch: 'job/alpha' });

test('a commit adding a file over max_file_bytes is refused, naming it and how to drop it (installer 3df99b92)', () => {
  const root = repo();
  commit(root, { 'src/alpha/big.json': 'x'.repeat(100) });
  assert.throws(refuse(root), /nothing was pushed: commit \w+ adds src\/alpha\/big\.json \(100 bytes, over max_file_bytes \(64\)\)\. Drop them from the commits and rebuild before pushing: `git reset --soft HEAD~1`, `git reset -- src\/alpha\/big\.json`, then commit again; a pushed commit/);
});

test('a commit adding a generated path is refused, an older one named with its rebuild (the first product\'s installer worker, 606/609)', () => {
  const root = repo();
  commit(root, { 'src/alpha/rows.mjs': 'export const rows = [];\n' });
  commit(root, { 'src/alpha/index.mjs': 'export const y = 1;\n' });
  assert.throws(refuse(root), /adds src\/alpha\/rows\.mjs \(a generated path \(config generated\).*`git reset --soft \w+~1`, `git reset -- src\/alpha\/rows\.mjs`, then commit again/);
});

test('a commit adding a file under dist/ is refused; a dist/ file the tranche tracks may change (agent-runner 3ee34e5)', () => {
  const root = repo();
  commit(root, { 'web/dist/kept.json': '{"a":1}\n' });
  assert.deepEqual(unpushable(root, loadConfig(root), { branch: 'job/alpha' }), []);
  commit(root, { 'agent-runner/dist/agent-runner.bundled.mjs': 'export {};\n' });
  assert.throws(refuse(root), /adds agent-runner\/dist\/agent-runner\.bundled\.mjs \(under a dist\/ directory: a build output, never committed\)/);
});

// Cold review of C3: one act clears every bad commit and file; a merge in the range is never flattened.
test('two bad commits: the reset goes before the oldest and unstages every bad file; a merge in the range points to a fresh branch', () => {
  const root = repo();
  commit(root, { 'src/alpha/rows.mjs': 'export const rows = [];\n' });
  commit(root, { 'src/alpha/big.json': 'x'.repeat(100) });
  let msg = '';
  try { refuse(root)(); } catch (e) { msg = e.message; }
  const oldest = git(['rev-parse', '--short=10', 'HEAD~1'], { cwd: root });
  assert.ok(msg.includes(`\`git reset --soft ${oldest}~1\`, \`git reset -- src/alpha/big.json\`, \`git reset -- src/alpha/rows.mjs\`, then commit again`), msg);
  // The tranche merged in after the bad commit: a reset would flatten it.
  const m = repo();
  commit(m, { 'src/alpha/rows.mjs': 'export const rows = [];\n' });
  git(['checkout', '-q', 'tranche'], { cwd: m });
  commit(m, { 'docs/x.md': 'x\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: m });
  git(['fetch', '-q', 'origin'], { cwd: m });
  git(['checkout', '-q', 'job/alpha'], { cwd: m });
  git(['merge', '-q', '--no-ff', '--no-edit', 'origin/tranche'], { cwd: m });
  assert.throws(refuse(m), /include a merge, so a reset would flatten them: start the work again on a fresh branch \(`job start <id> --sessions <file> --fresh-branch "<why>"` for a job\), leaving out src\/alpha\/rows\.mjs/);
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
