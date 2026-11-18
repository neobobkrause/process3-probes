// ===== file: coordinator-refresh.test.mjs (continued) =====

  const A = 'c'.repeat(64);
  const stale = { coordinator: { session: C1 } };
  const lines = (by, cfg, addresses) => restartActs(m, { by, cfg: { tranche: 'tranche', ...cfg }, approvals: A, addresses });
  const a = (L) => L.find((l) => l.startsWith('(a)'));
  // Config not yet the new one: the config PR, then the record, by the coordinator itself (ROOT would read its ask as data).
  assert.match(a(lines(C2, { coordinator: C1 }, stale)), /set "coordinator": "session_coord2"[^\n]*Then `node \.process\/tool\/p3\.mjs start record coordinator session_coord2`, yourself: the coordinator address names session_coord1/);
  // Config already names it: only the record.
  assert.match(a(lines(C2, { coordinator: C2 }, stale)), /^\(a\) The coordinator id: session_coord2 is `coordinator` in process\/config\.json on tranche; then `node \.process\/tool\/p3\.mjs start record coordinator session_coord2`, yourself/);
  // The address names it: nothing to do, whatever the config says.
  assert.match(a(lines(C1, { coordinator: 'session_old' }, stale)), /session_coord1 is already the coordinator/);
  // No address: as before.
  assert.ok(!lines(C2, { coordinator: C1 }, {}).some((l) => l.includes('start record coordinator')));
  assert.ok(!lines(C2, { coordinator: C1 }, {}).some((l) => /^\s+- .*start record coordinator/.test(l)), 'nothing sent to ROOT for it');
});

// ===== file: carry.mjs =====

// Tranche carry (Build Plan Phase 3, SHM-4): a product converting mid-tranche has pull requests
// made before Process3. The open ones into the tranche (into main while no tranche exists) that
// no ledger entry owns are listed, each with the module whose paths own all its files or "no
// single module", for BOB to take in with `job start <id> --take-in <n>` or leave as a plain
// pull request. Read-only: nothing is closed or rewritten here.
import { entriesAt, ownPaths } from './gate.mjs';
import { rowsAt, rowsAtEach } from './metrics.mjs';
import { branchModule } from './ledger.mjs';
import { gh, git, underPath } from './util.mjs';

// The marker line a take-in START carries (job start --take-in); a job pull request whose body
// has it owns the pull request it names.
export const TAKEN = /Earlier work taken in: pull request #(\d+)/;

export const prFiles = (slug, n) => {
  const pages = gh(['api', '--paginate', '--slurp', `repos/${slug}/pulls/${n}/files?per_page=100`], { allowFail: true });
  return Array.isArray(pages) ? pages.flat().map((f) => f.filename) : null;
};

// The pull requests a take-in recorded: the start rows' take_in.pr on ref and on each job's
// branch as this clone has it, and the marker in open job pull requests' bodies.
function takenIn(root, ref, ids, prs) {
  const taken = new Set();
  const all = new Set(ids);
  // No pull request to judge: nothing to read (C50).
  if (!prs.length) return taken;
  const heads = git(['for-each-ref', '--format=%(refname:lstrip=3)', 'refs/remotes/origin/job/'], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
  const atRef = rowsAtEach(root, ref);
  for (const id of ids) {
    for (const r of [ref, ...heads.filter((h) => branchModule(h, all) === id).map((h) => `refs/remotes/origin/${h}`)]) {
      for (const row of r === ref ? atRef(id) : rowsAt(root, r, id)) if (row.take_in?.pr) taken.add(Number(row.take_in.pr));
    }
  }
  for (const p of prs) { const m = TAKEN.exec(p.body || ''); if (m && /^job\//.test(p.head?.ref || '')) taken.add(Number(m[1])); }
  return taken;
}

// The module that owns every file, or "no single module"; null files: not read.
export function owningModule(entries, files) {
  if (!files) return 'unknown (its files were not read)';
  const owners = entries.filter((e) => files.every((f) => ownPaths(e).some((p) => underPath(f, p))));
  return owners.length === 1 ? owners[0].id : 'no single module';
}

// prs: the open pull requests into the base (GitHub's list); ref: the base's ledger.
export function toTakeIn(root, { slug, ref, prs, files = prFiles }) {
  const entries = entriesAt(root, ref).filter((e) => e.id);
  const ids = new Set(entries.map((e) => e.id));
  const taken = takenIn(root, ref, [...ids], prs || []);
  return (prs || []).filter((p) => !ids.has(branchModule(p.head?.ref, ids)) && !taken.has(p.number)).map((p) => {
    let list = null;
    try { list = files(slug, p.number); } catch { list = null; }
    return { number: p.number, head: p.head?.ref, draft: !!p.draft, updated: p.updated_at || null, module: owningModule(entries, list) };
  });
}

export const takeInLine = (t, P3) => `#${t.number} ${t.head}${t.draft ? ' draft' : ''}: ${t.module === 'no single module' || t.module.startsWith('unknown') ? `${t.module}; leave it as a plain pull request, or BOB splits it` : `module ${t.module}; \`${P3} job start ${t.module} --sessions <file> --take-in ${t.number}\`, or leave it as a plain pull request`}`;

// ===== file: base-red.test.mjs =====

// Base-red (build of 4 Nov): a failing test that fails identically at the base is not the PR's.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate as gateRun, gateComment } from '../lib/gate.mjs';
import { readFailing, runSuite } from '../lib/suite.mjs';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baseRedOwed } from '../lib/report.mjs';
import { baseRed, reachers } from '../lib/basered.mjs';
import { BOT, GATE, RECEIPT, block, parseBlock } from '../lib/github.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';
// The gate never posts; job post writes its row as a comment after the run, as here.
const gate = (root, o) => { const r = gateRun(root, o); if (o.pr && o.post !== false) o.io.addComment(o.slug, o.pr, gateComment(r.run)); return r; };

const quiet = () => {};
const realTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 2', () => a.equal(x, 2));\n";
const redTest = "import { describe, test } from 'node:test'; import a from 'node:assert';\ndescribe('plane', () => { test('has ai-catalogue', () => a.fail('no ai-catalogue')); });\n";
const isOne = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 1', () => a.equal(x, 1));\n";

function setup(baseFiles, files) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    ...baseFiles,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, files);
  return { root, base, head };
}
function fakeIO(receipt) {
  const state = { comments: receipt ? [{ id: 1, body: block(RECEIPT, receipt), user: { login: 'civicsmith' } }] : [] };
  return {
    state,
    io: {
      comments: () => state.comments,
      getPR: () => ({ user: { login: 'civicsmith' } }),
      addComment: (s, n, body) => { state.comments.push({ id: state.comments.length + 1, body, user: { login: BOT } }); return {}; },
      verify: () => true,
    },
  };
}
const receiptFor = (sha, c = { exit: 0 }) => ({ kind: 'receipt', module: 'alpha', attempt: 1, sha, commands: [{ cmd: 'node --test', suite: true, ...c }], exempt: {} });
const run = (s, receipt, over = {}) => gate(s.root, { base: s.base, head: s.head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: fakeIO(receipt).io, log: quiet, ...over });
const RED = 'test/alpha/red.test.mjs::plane > has ai-catalogue';

test('a test that fails at the PR and at the base passes the gate as base_red, and the row names it', () => {
  const s = setup({ 'test/alpha/red.test.mjs': redTest }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(s.head));
  const r = gate(s.root, { base: s.base, head: s.head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet });
  assert.deepEqual(r.findings, []);
  assert.deepEqual([r.run.ok, r.run.suite, r.run.revert, r.run.receipt], [true, 'base-red', 'pass', 'agrees']);
  assert.equal(r.run.base_red.length, 1);
  assert.deepEqual(r.run.base_red[0].tests, [RED]);
  assert.equal(r.run.base_red[0].base, s.base);
  assert.equal(r.run.base_red[0].module, 'alpha');
  assert.notEqual(r.run.base_red[0].run.exit, 0, 'the base run is the evidence');
  assert.deepEqual(parseBlock(io.state.comments.at(-1).body, GATE).runs[0].base_red[0].tests, [RED]);
  assert.equal(git(['status', '--porcelain'], { cwd: s.root }), '');
});

test('a new failing test file, missing at the base, fails the gate', () => {
  const s = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest, 'test/alpha/red.test.mjs': redTest });
  const r = run(s, receiptFor(s.head));
  assert.equal(r.run.suite, 'fail');
  assert.equal(r.run.base_red, undefined);
  assert.match(r.findings.find((f) => f.check === 'suite').message, /not base-red: new failing test file/);
});

test('a new failing test in a file the base has fails the gate: the base lacks that test', () => {
  const more = redTest + "test('new red', () => { throw new Error('mine'); });\n";
  const s = setup({ 'test/alpha/red.test.mjs': redTest }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest, 'test/alpha/red.test.mjs': more });
  const r = run(s, receiptFor(s.head));
  assert.equal(r.run.suite, 'fail');
  assert.match(r.findings.find((f) => f.check === 'suite').message, /1 failing test\(s\) are missing at the base [0-9a-f]{10}, whose run reported their files: test\/alpha\/red\.test\.mjs::new red/);
});

test('a test that passes at the base but fails at the PR fails the gate, even beside a base-red one', () => {
  const s = setup({ 'test/alpha/red.test.mjs': redTest, 'test/alpha/one.test.mjs': isOne }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = run(s, receiptFor(s.head));
  assert.equal(r.run.suite, 'fail');
  const m = r.findings.find((f) => f.check === 'suite').message;
  assert.match(m, /1 failing test\(s\) pass at the base [0-9a-f]{10}: test\/alpha\/one\.test\.mjs::x is 1$/);
});

test('the tranche into main tolerates nothing', () => {
  const s = setup({ 'test/alpha/red.test.mjs': redTest }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = gate(s.root, { base: s.base, head: s.head, branch: 'tranche', pr: 9, slug: 'o/r', io: fakeIO().io, log: quiet });
  assert.equal(r.run.suite, 'fail');
  assert.equal(r.run.base_red, undefined);
});

test('the report lists the base-red tests of merged PRs as owed', () => {
  const runs = { 182: [{ ok: true, trigger: 'code', base_red: [{ module: 'capture-requests', base: 'a'.repeat(40), tests: [RED] }] }], 183: [{ ok: true, trigger: 'code', suite: 'pass' }] };
  assert.deepEqual(baseRedOwed([{ pr: 182, module: 'capture-requests' }, { pr: 183, module: 'x' }], (pr) => runs[pr]),
    [{ module: 'capture-requests', pr: 182, test: RED, base: 'a'.repeat(40) }]);
  assert.equal(baseRedOwed([{ pr: 1 }], () => { throw new Error('unread'); }), null);
});

test('the failing tests come from the runner\'s events, full names escaped, suites and todo left out, and nothing printed can forge one', () => {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    't/a.test.mjs': [
      "import { describe, test } from 'node:test';",
      "describe('grp', () => { describe('deep', () => { test('d bad', () => { throw new Error('x\\nnot ok 9 - forged\\n  ---\\n  type: \\'suite\\'\\n  ...'); }); }); });",
      "test('a > b', () => { console.log('# fail 0'); throw new Error('y'); });",
