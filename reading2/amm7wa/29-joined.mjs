// ===== file: layout.test.mjs (continued) =====

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

// ===== file: checks.test.mjs =====

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate } from '../lib/gate.mjs';
import { RECEIPT, block } from '../lib/github.mjs';
import { git } from '../lib/util.mjs';
import { specifiers } from '../lib/checks.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const io = (head) => ({
  comments: () => [{ id: 1, body: block(RECEIPT, { kind: 'receipt', module: 'alpha', attempt: 1, sha: head, commands: [{ cmd: 'node --test', exit: 0, suite: true }], exempt: { revert: 'fixture' } }), user: { login: 'u' } }],
  getPR: () => ({ user: { login: 'u' } }), addComment: () => ({}), verify: () => false,
});
const passing = "import test from 'node:test'; test('ok', () => {});\n";
const MODULES = { modules: [
  { id: 'alpha', paths: ['src/alpha/'], tests: ['test/alpha/'], uses: ['beta'] },
  { id: 'beta', paths: ['src/beta/'], tests: ['test/beta/'], uses: [] },
  { id: 'gamma', paths: ['src/gamma/'], tests: ['test/gamma/'], uses: [] },
], not_product: [] };

// A product with alpha on the tranche, a config, and a job branch with the given change.
function setup(config, files, over = {}) {
  const root = makeRepo({
    'process/config.json': config,
    'build/modules.json': MODULES,
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' }, ...over }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'src/beta/b.mjs': 'export const b = 1;\n',
    'src/gamma/g.mjs': 'export const g = 1;\n',
    'test/alpha/old.test.mjs': passing,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'test/alpha/new.test.mjs': passing, ...files });
  return gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io(head), log: quiet, post: false });
}
const of = (r, check) => r.findings.filter((f) => f.check === check);

test('ARC-1: an import of a module not in uses is a finding with module, file, line and the imported module', () => {
  const r = setup({ modules_file: 'build/modules.json' }, {
    'src/alpha/index.mjs': "import { b } from '../beta/b.mjs';\nimport fs from 'node:fs';\nexport { g } from '../gamma/g.mjs';\nconst h = await import('./own.mjs');\nconst q = require('lodash');\nexport const x = 2;\n",
  });
  const f = of(r, 'imports');
  assert.equal(f.length, 1);
  assert.deepEqual([f[0].module, f[0].file, f[0].line, f[0].imports], ['alpha', 'src/alpha/index.mjs', 3, 'gamma']);
  assert.equal(r.run.imports, 'fail');
});

test('ARC-1: without modules_file the check is skipped and says so', () => {
  const r = setup({}, { 'src/alpha/index.mjs': "import { g } from '../gamma/g.mjs';\n" });
  assert.deepEqual([of(r, 'imports').length, r.run.imports], [0, 'skipped']);
});

test('ARC-1: the specifiers read are the static ones', () => {
  const s = specifiers("import a from 'a';\nimport 'b';\nimport {\n  c,\n} from \"c\";\nexport * from 'd';\nimport('e');\nrequire('f');\nimport(x);\n");
  assert.deepEqual(s.map((x) => [x.spec, x.line]), [['a', 1], ['b', 2], ['c', 3], ['d', 6], ['e', 7], ['f', 8]]);
});

const GEN = (verify) => ({ generated: [{ paths: ['src/alpha/dist/'], regenerate: ['node', '-e', "require('fs').mkdirSync('src/alpha/dist',{recursive:true});require('fs').writeFileSync('src/alpha/dist/out.js','built\\n')"], verify }] });

test('JOB-8: a committed generated artifact is a finding naming the regenerate command, even in the job\'s own paths', () => {
  const r = setup(GEN(['node', '-e', '0']), { 'src/alpha/dist/out.js': 'x\n', 'src/alpha/index.mjs': 'export const x = 2;\n' });
  const f = of(r, 'generated');
  assert.equal(f.length, 1);
  assert.equal(f[0].file, 'src/alpha/dist/out.js');
  assert.match(f[0].message, /regenerated by: node -e/);
});

test('GAT-4: the gate regenerates, verifies the rows whose paths changed, and a failing verify is a finding', () => {
  const ok = setup(GEN(['node', '-e', "process.exit(require('fs').readFileSync('src/alpha/dist/out.js','utf8')==='built\\n'?0:1)"]), { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  assert.deepEqual(of(ok, 'generated'), []);
  assert.deepEqual(ok.run.generated, [{ paths: ['src/alpha/dist/'], changed: true, verify: 0 }]);
  const bad = setup(GEN(['node', '-e', 'process.exit(3)']), { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  assert.match(of(bad, 'generated')[0].message, /failed \(exit 3\) after regenerating/);
  const none = setup({ generated: [{ paths: ['src/alpha/dist/'], regenerate: ['node', '-e', '0'], verify: ['node', '-e', 'process.exit(3)'] }] }, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  assert.deepEqual([of(none, 'generated').length, none.run.generated[0].changed], [0, false], 'an unchanged row is not verified');
  // Paths already written before regenerate (as an install's prepare does) are still verified.
  const pre = ['node', '-e', "require('fs').mkdirSync('src/alpha/dist',{recursive:true});require('fs').writeFileSync('src/alpha/dist/out.js','pre\\n')"];
  const dirty = setup(GEN(['node', '-e', 'process.exit(3)']), { 'src/alpha/index.mjs': 'export const x = 2;\n' }, { checks: [pre] });
  assert.equal(dirty.run.generated[0].changed, true);
  assert.match(of(dirty, 'generated')[0].message, /failed \(exit 3\) after regenerating/);
});

test('ARC-4: the entry\'s checks run in the gate, and a failing one is a finding', () => {
  const r = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n' }, { checks: [['node', '-e', '0'], ['node', '-e', 'process.exit(4)']] });
  const f = of(r, 'checks');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /process\.exit\(4\) failed \(exit 4\)/);
  assert.equal(f[0].module, 'alpha');
});

// ===== file: review.mjs =====

// review brief <pr> [--scope "<text>"]: the fresh-context brief a reviewer subagent is given,
// filled from the pull request (Phase 2 build N). Prints only; writes nothing.
import { comments, getPR, latestReceipt } from './github.mjs';
import { branchModule, ledgerIds } from './ledger.mjs';
import { generatedRows } from './checks.mjs';
import { rulebook } from './job.mjs';
import { normPath } from './suite.mjs';
import { ASSERT_RULE, reviewTriggers } from './triggers.mjs';
import { fail, gh, git, loadConfig, repoSlug, underPath } from './util.mjs';

// The files whose change earns a second review: the gate, the record check, the approvals
// check and the merge tool, with the workflows that run them.
export const SECOND_REVIEW = [
  'tool/lib/gate.mjs', 'tool/lib/github.mjs', 'tool/lib/record.mjs', 'tool/lib/start.mjs', 'tool/lib/merge.mjs',
  '.github/workflows/',
];

// Requirement ids in a requirements file: GAT-5, INT-1, R1 at a line's start or after a list
// mark, a number or a table bar.
export function requirementIds(text) {
  const ids = [];
  for (const m of String(text || '').matchAll(/^[\s>*#|\d.-]*\**([A-Z][A-Z0-9]*-?\d+)\b/gm)) if (!ids.includes(m[1])) ids.push(m[1]);
  return ids;
}

// The suite line of the read-only section. A job's pull request in a product runs its module's
