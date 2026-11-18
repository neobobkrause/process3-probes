// ===== file: anchor.test.mjs (continued) =====

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

// A box of 8 mallets came through Rigg.

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

// ===== file: ledger.mjs =====

// The ledger (REC-9): process/ledger/<id>.json, one file per entry so each has one writer (REC-2).
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEDGER_DIR, catBatch, fail, git } from './util.mjs';

export { LEDGER_DIR };
const SCHEMA = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'schema', 'ledger-entry.schema.json'), 'utf8'));

// A small validator for the subset of JSON Schema the ledger schema uses.
export function validate(value, schema = SCHEMA, path = '') {
  const errs = [];
  const at = path || '(entry)';
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${at}: must be one of ${schema.enum.join(', ')}`);
  const t = schema.type;
  const typeOk = !t || (t === 'array' ? Array.isArray(value)
    : t === 'integer' ? Number.isInteger(value)
    : t === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value)
    : typeof value === t);
  if (!typeOk) return [...errs, `${at}: must be ${t}`];
  if (t === 'string') {
    if (schema.minLength && value.length < schema.minLength) errs.push(`${at}: must not be empty`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errs.push(`${at}: must match ${schema.pattern}`);
  }
  if (t === 'array') {
    if (schema.minItems && value.length < schema.minItems) errs.push(`${at}: needs at least ${schema.minItems} item(s)`);
    if (schema.items) value.forEach((v, i) => errs.push(...validate(v, schema.items, `${path}[${i}]`)));
  }
  if (t === 'object') {
    for (const k of schema.required || []) if (!(k in value)) errs.push(`${path ? path + '.' : ''}${k}: required`);
    for (const [k, v] of Object.entries(value)) {
      const sub = schema.properties && Object.hasOwn(schema.properties, k) ? schema.properties[k] : undefined;
      if (sub) errs.push(...validate(v, sub, path ? `${path}.${k}` : k));
      else if (schema.additionalProperties === false) errs.push(`${path ? path + '.' : ''}${k}: not a ledger field`);
    }
  }
  return errs;
}

export const entryFile = (id) => `${LEDGER_DIR}/${id}.json`;

// A job's branch is the one its latest start row names (`branch`; job/<id> when it names none).
// job start --fresh-branch cuts job/<id>-<n>, n the next free from 2, and writes that row there,
// so the latest start row is on the highest-numbered job/<id>-<n> on origin whose own latest
// start row names it (named(h); metrics.mjs jobBranchAt reads it), else job/<id>. A <id>-<n> that
// is itself a module (ids: the ledger's; none read, no <id>-<n> counts) is that module's.
// The branch the attempt works on: the newest start row's (every start row names it since 5 Nov).
// Before then a row on job/<id> named none, and an --again row named none either, on whatever
// branch it continued: an --again row without a branch is passed over for the one before it (copy
// PR 454: attempt 4 had moved to job/<id>-2 by --fresh-branch, and the gate fell back to job/<id>).
export function startBranch(rows, id) {
  const starts = rows.filter((r) => r.row === 'attempt' && r.event === 'start');
  for (let i = starts.length - 1; i >= 0; i--) if (starts[i].branch || !starts[i].again) return starts[i].branch || `job/${id}`;
  return `job/${id}`;
}
const FRESH = /^(.+)-([1-9]\d*)$/;
export function jobBranch(id, heads, ids = new Set(), named = () => true) {
  const fresh = [...(heads || [])].map((h) => [h, ids.size && String(h).startsWith('job/') && !ids.has(h.slice(4)) ? FRESH.exec(h.slice(4)) : null])
    .filter(([, m]) => m && m[1] === id).sort((a, b) => Number(b[1][2]) - Number(a[1][2]));
  return fresh.find(([h]) => named(h))?.[0] || `job/${id}`;
}
// The module of a job branch: <x> of job/<x> when <x> is a module (or no ids are given), else
// <id> of job/<id>-<n> when <id> is; null for a branch not job/*.
export function branchModule(ref, ids = null) {
  const x = /^job\/([a-z0-9-]+)$/.exec(ref || '')?.[1];
  if (!x || !ids?.size || ids.has(x)) return x || null;
  const m = FRESH.exec(x);
  return m && ids.has(m[1]) ? m[1] : x;
}
export const ledgerIds = (root, ref) => new Set(git(['ls-tree', '--name-only', `${ref}:${LEDGER_DIR}`], { cwd: root, allowFail: true }).stdout.split('\n').filter((n) => n.endsWith('.json')).map((n) => n.slice(0, -5)));
// origin's job heads, as 'job/...' names; null when origin is unread.
export function originJobs(root) {
  const r = git(['ls-remote', '--heads', 'origin', 'refs/heads/job/*'], { cwd: root, allowFail: true });
  return r.code === 0 ? new Set(r.stdout.split('\n').map((l) => l.split('\t')[1]?.trim().replace(/^refs\/heads\//, '')).filter(Boolean)) : null;
}

// Entries as { file: text } from the worktree, or from a git ref when one is given.
export function readLedgerTexts(root, ref) {
  const out = {};
  if (ref) {
    const r = git(['ls-tree', `${ref}:${LEDGER_DIR}`], { cwd: root, allowFail: true });
    if (r.code !== 0) return out;
    // The entries' blobs in one cat-file --batch (C50: one git show each, a spawn per module, on
    // every setup check, status and take-in read); as git show prints them, the last newline off.
    // Anything the batch does not give (not a blob) is read as before.
    const list = r.stdout.split('\n').map((l) => l.match(/^\d+ (\w+) ([0-9a-f]+)\t(.+)$/)).filter((m) => m && m[3].endsWith('.json'));
    const got = catBatch(root, list.filter((m) => m[1] === 'blob').map((m) => m[2])) || new Map();
    for (const [, , sha, name] of list) {
      out[`${LEDGER_DIR}/${name}`] = got.has(sha) ? got.get(sha).replace(/\n$/, '') : git(['show', `${ref}:${LEDGER_DIR}/${name}`], { cwd: root });
    }
    return out;
  }
  const dir = join(root, LEDGER_DIR);
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    out[`${LEDGER_DIR}/${name}`] = readFileSync(join(dir, name), 'utf8');
  }
  return out;
}

export function readEntry(root, id) {
  const p = join(root, entryFile(id));
  if (!existsSync(p)) fail(`no ledger entry ${entryFile(id)}`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

// Rewrites only the status field of an entry, the one field a job may change.
export function writeStatus(root, id, status) {
  const e = readEntry(root, id);
  e.status = status;
  const errs = validate(e);
  if (errs.length) fail(`status would break the schema: ${errs.join('; ')}`);
  writeFileSync(join(root, entryFile(id)), JSON.stringify(e, null, 2) + '\n');
  return e;
}

// Whether home holds file, and it differs from e only in its status.
function carried(root, home, file, e) {
  const t = git(['show', `${home}:${file}`], { cwd: root, allowFail: true });
  if (t.code !== 0) return false;
  try { return fixed(JSON.parse(t.stdout)) === fixed(e); } catch { return false; }
}
// The ref of the ledger's home, the tranche, for checkLedger's home: origin's, else a local
// branch, fetched once when neither is here; null when it cannot be read.
export function homeRef(root, tranche) {
  if (!tranche) return null;
  const has = (r) => git(['rev-parse', '-q', '--verify', `${r}^{commit}`], { cwd: root, allowFail: true }).code === 0;
  const remote = `refs/remotes/origin/${tranche}`;
  if (has(remote)) return remote;
  if (has(`refs/heads/${tranche}`)) return `refs/heads/${tranche}`;
  git(['fetch', '-q', 'origin', `+refs/heads/${tranche}:${remote}`], { cwd: root, allowFail: true });
  return has(remote) ? remote : null;
}

const finding = (file, message) => ({ check: 'ledger', file, line: 1, message });
const fixed = (e) => JSON.stringify({ ...e, status: undefined });

// Schema check of every entry; with base and a job/<id> branch, also that the job changed
// nothing in the ledger except the status of its own entry. home (the layer flow): the ref of the
// ledger's home, the tranche. A job on a layer branch cut before the tranche got its module's
// entry (copy, 6 Nov: layer/8 and PR 638) carries that entry onto the layer: it may add its own
// entry when home holds it, and nothing but the status differs from home's.
export function checkLedger(root, { base, branch, ref, home } = {}) {
  const findings = [];
