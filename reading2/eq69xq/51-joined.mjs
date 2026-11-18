// ===== file: workflow-limits.test.mjs (continued) =====

      repo: proc,
      mergePR: (slug, n, sha, o) => { calls.merged = { sha, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const q = { slug: 'o/r', log: () => {}, noReview: 'a test' };

test('merge --plain lands a workflow change within the limits and records the limits it checked', () => {
  // process3 itself: no pin, no shims, L4 does not apply.
  const r = repo({ files: { '.github/workflows/ci.yml': edit('timeout-minutes: 10', 'timeout-minutes: 20') } });
  const f = io(r);
  const out = mergePlain(r.root, 7, { ...q, io: f.io });
  assert.equal(out.merged, true);
  assert.deepEqual(out.workflows, [{ file: '.github/workflows/ci.yml', limits: ['L1', 'L2', 'L3', 'L5'] }]);
  assert.equal(f.calls.merged.message, 'No review: a test\nReview rounds: 0\nWorkflow limits: ci.yml L1 L2 L3 L5');
  assert.equal(f.calls.rules, 1, 'the required checks are read once');
  // Outside a limit: refused with the limit, the line and the owner's word; nothing merged.
  const w = repo({ files: { '.github/workflows/ci.yml': edit('  contents: read\njobs', '  contents: write\njobs') } });
  const g = io(w);
  assert.throws(() => mergePlain(w.root, 7, { ...q, io: g.io }), /changes \.github\/workflows\/ci\.yml: L2 \(line 5\): the workflow's permissions contents: write is wider than the base's read; a workflow change outside the owner's limits needs the owner's word: bring it to Bob/);
  assert.equal(g.calls.merged, null);
  const t = repo({ files: { '.github/workflows/new.yml': 'on: pull_request_target\npermissions: {}\njobs:\n  a:\n    runs-on: x\n' } });
  assert.throws(() => mergePlain(t.root, 7, { ...q, io: io(t).io }), /new\.yml: L3 \(line 1\): it adds the pull_request_target trigger; a workflow change outside/);
  const d = repo({ files: { '.github/workflows/ci.yml': null } });
  assert.throws(() => mergePlain(d.root, 7, { ...q, io: io(d).io }), /ci\.yml: removal: it deletes a workflow; a workflow change outside/);
});

test('L4: in a product, a shim stays the pin\'s own byte for byte; other workflows pass by the limits', () => {
  const shim = 'name: process-gate\non: pull_request\n';
  const shimBlob = (root) => git(['hash-object', '--stdin'], { cwd: root, input: shim });
  // The product's own workflow changes within the limits; the shim is untouched.
  const r = repo({ pin: true, files: { '.github/workflows/ci.yml': edit('timeout-minutes: 10', 'timeout-minutes: 20') } });
  const proc = { released: () => true, descends: () => true, shim: (pin, name) => (name === 'process-gate.yml' ? shimBlob(r.root) : null) };
  assert.deepEqual(workflowChanges(r.root, r.sha, ['.github/workflows/ci.yml'], proc, null, { mb: git(['rev-parse', 'tranche'], { cwd: r.root }), required: () => REQ }), [{ file: '.github/workflows/ci.yml', limits: ['L1', 'L2', 'L3', 'L5'] }]);
  // The shim changed: refused as L4, whatever the limits would say.
  const s = repo({ pin: true, files: { '.github/workflows/process-gate.yml': shim + '# mine\n' } });
  const sp = { ...proc, shim: (pin, name) => (name === 'process-gate.yml' ? shimBlob(s.root) : null) };
  assert.throws(() => workflowChanges(s.root, s.sha, ['.github/workflows/process-gate.yml'], sp, null, { required: () => REQ }), /L4: \.github\/workflows\/process-gate\.yml is not the process's own shim.*owner's word/);
  // Equal to the pin's shim: L4 holds.
  const e = repo({ pin: true, files: { '.github/workflows/process-gate.yml': shim } });
  const ep = { ...proc, shim: (pin, name) => (name === 'process-gate.yml' ? shimBlob(e.root) : null) };
  assert.deepEqual(workflowChanges(e.root, e.sha, ['.github/workflows/process-gate.yml'], ep, null, { required: () => REQ }), [{ file: '.github/workflows/process-gate.yml', limits: ['L4'] }]);
  assert.equal(limitsLine([{ file: '.github/workflows/process-gate.yml', limits: ['L4'] }, { file: '.github/workflows/README.md', limits: [], note: 'not a workflow' }]), 'Workflow limits: process-gate.yml L4; README.md not a workflow');
});

test('a close carries a workflow change within the owner\'s limits when its shapes do not fit', () => {
  // Rule 1 is held elsewhere (close-workflows.test.mjs); here the second judge: shapes, else limits.
  const root = makeRepo({ '.github/workflows/ci.yml': CI });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const head = commit(root, { '.github/workflows/ci.yml': edit('timeout-minutes: 10', 'timeout-minutes: 20') });
  const at = { mb: base, baseRef: base, tranche: 'tranche', slug: 'o/r', io: { repo: {} } };
  const pass = { ...at, limits: (f, src, baseSrc) => judgeWorkflow(f, baseSrc, src, REQ) };
  // Rule 1 needs gated merges: stub it by a chain with nothing after the base (the file is earlier work).
  const judged = closeWorkflows(root, head, ['.github/workflows/ci.yml'], { ...pass, mb: head });
  assert.deepEqual(judged, [{ file: '.github/workflows/ci.yml', limits: ['rule 1', 'L1', 'L2', 'L3', 'L5'] }]);
  const bad = commit(root, { '.github/workflows/ci.yml': edit('  contents: read\njobs', '  contents: write\njobs') });
  assert.throws(() => closeWorkflows(root, bad, ['.github/workflows/ci.yml'], { ...pass, baseRef: head, mb: bad }), /fits no allowed shape.*nor is it within the owner's limits \(L2, line 5/);
  assert.throws(() => closeWorkflows(root, bad, ['.github/workflows/ci.yml'], { ...at, baseRef: head, mb: bad }), /fits no allowed shape.*allowed shapes or within the owner's limits$/);
});

// ===== file: workflow-limits.mjs =====

// The owner's limits on a workflow change (build workflow-limits, R1; Bob, 6 Nov: "yes to R1").
// His standing approvals (CLAUDE.md, 4 Nov) let a session "change those repositories' own
// workflow files, only through pull requests the merge tool merges after a green gate, never
// adding or renaming a job whose name matches a required check, never widening any workflow's or
// job's permissions, never adding a pull_request_target trigger, and never making the process
// gate anything but the process's own shim at the pinned process"; on 6 Nov he added: never
// weakening a required check. One file's change, base to head, is judged by reading both as YAML
// (wfyaml.mjs, which refuses what it cannot read):
//  L1 no job added, removed or renamed whose name (its `name:`, else its key) matches a required
//     check of the base branch;
//  L2 no permissions widened, at the workflow or a job: no new scope, no read to write, no block
//     removed where the base had one (a missing block inherits the default, which is wider);
//     where the base had no block, the head may read but not write; a new workflow declares its
//     permissions and grants no write;
//  L3 no pull_request_target or workflow_run trigger added;
//  L4 a process shim stays byte-identical to the pin's (merge.mjs, which holds the shims);
//  L5 in a job that is a required check, no existing step removed or reordered, and none gets
//     its `if:`, `continue-on-error`, `shell`, `working-directory`, `env`, `id` or the action it
//     uses changed, nor an input but a version or a cache (`with: ref:` would test other code);
//     a step's `run:` keeps every line it had, in order, and gains lines only after its last one
//     (a line put before could be `set +e`), and only where its shell stops at a failed command
//     (bash -e); a folded (`>`) run may not change. The job itself keeps its `runs-on` (it picks
//     the shell), `if`, `needs`, `continue-on-error`, `strategy`, `env`, `defaults` and every
//     other key but `name` (L1), `permissions` (L2), `timeout-minutes`, `concurrency` and
//     `steps`; its workflow keeps its `env` and `defaults`. Adding steps, `timeout-minutes`,
//     action versions and node-version may change; a step may be added only after the job's
//     last existing step (Bob, 6 Nov, on #192).
// A required check names a job when it equals the job's name or key, or begins with it and ` (`
// (a matrix) or ` / ` (a called workflow), or ends with ` / ` and it, in any case; a name
// holding an expression (`${{`) is taken to match any.
import { foldedAt, lineOf, readWorkflow } from './wfyaml.mjs';
import { hunks, plainText } from './workflows.mjs';

const isMap = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const isText = (x) => typeof x === 'string';
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const runLines = (t) => (isText(t) ? t.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim()) : null);

export const LIMITS = ['L1', 'L2', 'L3', 'L4', 'L5'];

// The check-run names a job can give, for matching against the required checks.
export function jobNames(key, job) {
  const n = isMap(job) ? job.name : null;
  return isText(n) ? [n] : [key];
}
export function matchesRequired(names, required) {
  const req = required.map((c) => String(c).toLowerCase());
  return names.map((n) => String(n).toLowerCase()).some((n) => (n.includes('${{') && req.length) || req.some((c) => c === n || c.startsWith(`${n} (`) || c.startsWith(`${n} / `) || c.endsWith(` / ${n}`)));
}

// The events of `on`: a name, a list of names, or a mapping's keys.
function events(on) {
  if (isText(on)) return [on];
  if (Array.isArray(on)) return on.filter(isText);
  if (isMap(on)) return Object.keys(on);
  return [];
}

// Permissions as { all: 'read'|'write'|null, scopes: {scope: level} }; undefined when absent;
// throws on a form it does not read.
const LEVEL = { none: 0, read: 1, write: 2 };
function perms(p, where) {
  if (p === undefined) return undefined;
  if (p === null) return { all: null, scopes: {} };
  if (isText(p)) {
    if (p === 'read-all') return { all: 'read', scopes: {} };
    if (p === 'write-all') return { all: 'write', scopes: {} };
    throw new Error(`${where}: permissions "${p}" is not read-all, write-all or a mapping`);
  }
  if (!isMap(p)) throw new Error(`${where}: permissions is not read-all, write-all or a mapping`);
  const scopes = {};
  for (const [k, v] of Object.entries(p)) {
    if (!isText(v) || !(v in LEVEL)) throw new Error(`${where}: permissions ${k}: "${v}" is not read, write or none`);
    scopes[k] = v;
  }
  return { all: null, scopes };
}
const level = (P, scope) => (P.all ? LEVEL[P.all] : LEVEL[P.scopes[scope] ?? 'none']);
// Why head's permissions are wider than base's, or null. undefined is the default. Removing a
// block is a widening (the default may write); where the base had none, the head is held to the
// read default that a repository is created with (cold review of R1: a base with no block let any
// head through), so it may add a block that reads but none that writes.
const READ_DEFAULT = { all: 'read', scopes: {} };
function wider(base, head) {
  if (head === undefined) return base === undefined ? null : 'its permissions block is removed, so it takes the default, which is wider';
  if (base === undefined) base = READ_DEFAULT;
  if (head.all) {
    if (base.all && LEVEL[base.all] >= LEVEL[head.all]) return null;
    return `permissions ${head.all}-all is wider than the base's`;
  }
  for (const [s, v] of Object.entries(head.scopes)) if (LEVEL[v] > level(base, s)) return `permissions ${s}: ${v} is wider than the base's ${base.all ? `${base.all}-all` : base.scopes[s] ?? 'none'}`;
  return null;
}
const grantsWrite = (P) => P.all === 'write' || Object.values(P.scopes).includes('write');

// A step's identity, to find it again in the head: its id, else its name, else the action it
// uses (without the version), else its run's first line.
const actionOf = (u) => (isText(u) ? u.replace(/@[^@]*$/, '') : null);
function stepKey(s) {
  if (!isMap(s)) return `?${JSON.stringify(s)}`;
  if (isText(s.id)) return `id:${s.id}`;
  if (isText(s.name)) return `name:${s.name}`;
  if (isText(s.uses)) return `uses:${actionOf(s.uses)}`;
  const r = runLines(s.run);
  return r ? `run:${r[0] ?? ''}` : `?${JSON.stringify(s)}`;
