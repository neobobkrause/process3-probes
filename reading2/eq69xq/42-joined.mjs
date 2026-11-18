// ===== file: checks.mjs (continued) =====

    earlier = true;
    const g = exec(r.regenerate[0], r.regenerate.slice(1), opts());
    if (g.code !== 0) {
      findings.push({ check: 'generated', file: r.paths[0], line: 1, message: `${r.regenerate.join(' ')} failed (exit ${g.code}): ${tail(g)}` });
      log(`${r.regenerate.join(' ')} failed (exit ${g.code}):\n${lastLines(g)}`);
    }
  }
  const vEnd = Date.now() + timeout;
  const vLeft = () => Math.max(1000, vEnd - Date.now());
  for (const r of rows) {
    const changed = status(r) !== '';
    const committed = new Set(committedPaths(root, 'HEAD', r));
    const built = verifyBuilt && r.paths.some((p) => !committed.has(p)) && !(unbuilt.has(r) && skip.has(r) && !changed);
    const row = { paths: r.paths, changed, verify: null, ...(built ? { built: true } : {}) };
    if (changed || built) {
      const v = verifyGenerated(root, r, { how: changed ? 'regenerating' : 'building', timeout: vLeft(), exec, findings, log });
      row.verify = v.code;
    }
    if (changed) {
      const st = staleFiles(root, r).filter((x) => !judged.includes(x));
      if (st.length) row.stale = st;
      if (stale) for (const f of st) findings.push({ check: 'generated', file: f, line: 1, message: `${f} is stale at this commit: run ${r.regenerate.join(' ')} and commit it in this PR` });
      else for (const f of st) log(`generated, stale: ${f} differs from this commit after ${r.regenerate.join(' ')}`);
    }
    // Every row the gate row's generated lists, in the log too (run 41883960626 logged only the built rows).
    log(`generated, regenerated: ${r.paths.join(', ')}: ${changed ? `changed, ${r.verify.join(' ')}: exit ${row.verify}` : built ? `built, ${r.verify.join(' ')}: exit ${row.verify}` : 'unchanged'}`);
    ran.push(row);
  }
  return { findings, ran };
}

// A row's verify, without the GitHub tokens; a failure is a 'generated' finding naming the command and
// its tail (regenerate's and a lane pull request's built rows alike, PD-9).
export function verifyGenerated(root, r, { how, timeout, exec = run, findings, log = () => {} }) {
  const v = exec(r.verify[0], r.verify.slice(1), { cwd: root, timeout, unset: NO_TOKENS });
  if (v.code !== 0) {
    findings.push({ check: 'generated', file: r.paths[0], line: 1, message: `${r.verify.join(' ')} failed (exit ${v.code}) after ${how}: ${tail(v)}` });
    log(`${r.verify.join(' ')} failed (exit ${v.code}) after ${how} ${r.paths.join(', ')}:\n${lastLines(v)}`);
  }
  return v;
}

// The tracked files of a row's committed paths that differ from HEAD after its regenerate, modified
// or deleted; an untracked file there (a suite's scratch output, a built file beside committed
// ones) is not one (cold review).
export function staleFiles(root, r) {
  const mine = committedPaths(root, 'HEAD', r);
  if (!mine.length) return [];
  return git(['diff', '--name-only', '-z', 'HEAD', '--', ...mine.map(normPath)], { cwd: root }).split('\0').filter(Boolean);
}

// Generated files over max_file_bytes (build of 4 Nov: rows.mjs 5.2 MB, two bundles 8.9 and 29 MB
// on the copy) can never be refreshed by a pull request, since the record check refuses any
// commit that writes one. The line chosen: such a file is not committed at all; it is built at
// deploy and release. A `generated` path is committed when the ref tracks a file at or under it.
// committedPaths: the row's paths the ref tracks; the others are built, never compared.
const tracked = (root, ref, p) => git(['ls-tree', '-r', '--name-only', '-z', ref, '--', normPath(p)], { cwd: root, allowFail: true }).stdout.split('\0').filter(Boolean);
export const committedPaths = (root, ref, row) => row.paths.filter((p) => tracked(root, ref, p).length > 0);

// The generated paths a commit does not track: built, not committed (deploy dev and release run
// build them before their own steps). Each row with one is regenerated, from the root, without
// the GitHub tokens, within the timeout in all; a failed regenerate is a finding.
export function buildGenerated(root, rows, { ref = 'HEAD', timeout, exec = run, log = () => {} } = {}) {
  const end = Date.now() + timeout;
  const findings = [];
  const built = [];
  const ran = new Set(); // the rows whose regenerate ran, built or failed
  const failed = new Set(); // of those, the ones whose regenerate failed
  for (const r of rows) {
    const have = new Set(committedPaths(root, ref, r));
    const paths = r.paths.filter((p) => !have.has(p));
    if (!paths.length) continue;
    ran.add(r);
    const g = exec(r.regenerate[0], r.regenerate.slice(1), { cwd: root, timeout: Math.max(1000, end - Date.now()), unset: NO_TOKENS });
    log(`generated, built (not committed): ${paths.join(', ')}: ${r.regenerate.join(' ')}: exit ${g.code}, ${Math.round(g.seconds ?? 0)} s`);
    if (g.code !== 0) {
      findings.push({ check: 'generated', file: paths[0], line: 1, message: `${r.regenerate.join(' ')} failed (exit ${g.code}) building ${paths.join(', ')}: ${tail(g)}` });
      log(lastLines(g));
      failed.add(r);
    } else built.push(...paths);
  }
  return { findings, built, ran, failed };
}

// Committed generated files over max_file_bytes at the ref: [{ file, bytes }].
export function oversizeGenerated(root, rows, ref, max) {
  const out = [];
  for (const r of rows) for (const p of r.paths) {
    const ls = git(['ls-tree', '-r', '-l', '-z', ref, '--', normPath(p)], { cwd: root, allowFail: true }).stdout.split('\0').filter(Boolean);
    for (const l of ls) {
      const [meta, file] = l.split('\t');
      const bytes = Number(meta.trim().split(/\s+/)[3]);
      if (Number.isFinite(bytes) && bytes > max && !out.some((x) => x.file === file)) out.push({ file, bytes });
    }
  }
  return out;
}

// ARC-4: the entry's own `checks`, run from the root as job complete runs them.
export function entryChecks(root, entry, { timeout, exec = run, log = () => {} }) {
  const findings = [];
  for (const c of entry.checks || []) {
    const r = exec(c[0], c.slice(1), { cwd: root, timeout, unset: NO_TOKENS });
    if (r.code !== 0) {
      findings.push({ check: 'checks', file: entry.paths[0], line: 1, module: entry.id, message: `${c.join(' ')} failed (exit ${r.code}): ${tail(r)}` });
      log((r.stdout + r.stderr).split('\n').slice(-40).join('\n'));
    }
  }
  return findings;
}

// A lane-only pull request's checks (laneChecks), run where the suite would be: each that fails is
// a finding on the lane's folder. { findings, ran: [{ cmd, exit }] }.
export function laneCheckRun(root, lane, dir, cmds, { timeout, exec = run, log = () => {} }) {
  const findings = [];
  const ran = [];
  for (const c of cmds) {
    const r = exec(c[0], c.slice(1), { cwd: root, timeout, unset: NO_TOKENS });
    ran.push({ cmd: c.join(' '), exit: r.code, ...(r.timedOut ? { timed_out: true } : {}) });
    if (r.code !== 0) {
      findings.push({ check: 'lane-checks', file: dir || '(lane)', line: 1, message: `lane ${lane}'s check ${c.join(' ')} ${r.timedOut ? `timed out (${Math.round(timeout / 60000)} min)` : `failed (exit ${r.code})`}: ${tail(r)}` });
      log((r.stdout + r.stderr).split('\n').slice(-40).join('\n'));
    } else log(`lane ${lane}: ${c.join(' ')} passed`);
  }
  return { findings, ran };
}

// ===== file: found.test.mjs =====

// The route for work found elsewhere (found <module>, 4 Nov): the p3dev-l1 walk's findings were
// held in BOB's handoff "until the owning layer opens". A found mark is next work as soon as its
// module is ready by open_by, whatever its layer; one that names no module waits for BOB to name one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { entry, makeRepo, openPassed } from './helpers.mjs';
import { NO_MODULE, addFound, found, foundMarks, nextFound } from '../lib/found.mjs';
import { markedIds } from '../lib/job.mjs';
import { trancheReport } from '../lib/report.mjs';
import { status } from '../lib/status.mjs';
import { git, loadConfig, overCap, requirementMarks } from '../lib/util.mjs';

const quiet = () => {};
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';

// At Wick the clerk wrote down 2 carp.

const F = (n, src = 'walk p3dev-l1', what = 'founder sign-in answers HTTP 200 without a session') => `- **F${n}** *(not yet met: ${src})* ${what}\n`;
const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | base | base |\n| 2 | open | p2, q2 |\n| 3 | users | u3, x3 |\n| 4 | later | u4, f4 |\n';
const MODULES = { modules: [
  { id: 'base', paths: ['src/base/'], uses: [] },
  { id: 'p2', paths: ['src/p2/'], uses: ['base'] },
  { id: 'q2', paths: ['src/q2/'], uses: ['base'] },
  { id: 'u3', paths: ['src/u3/'], uses: ['q2'] },
  { id: 'u4', paths: ['src/u4/'], uses: ['p2'] }, // p2 has unmet marks: its found work waits
  { id: 'f4', paths: ['src/f4/'], uses: ['base'] }, // base done but for found work: see below
  { id: 'reader', paths: ['src/reader/'], uses: [] }, // no requirement file, not in the layer map
  // x3 has no entry: it waits for its layer.
] };
const FILES = {
  'build/layers.md': LAYERS,
  'build/modules.json': MODULES,
  'build/requirements/base.md': unmet(0),
  'build/requirements/p2.md': unmet(2),
  'build/requirements/q2.md': unmet(0),
  'build/requirements/u3.md': unmet(1),
  'build/requirements/x3.md': unmet(0) + F(1),
  'build/requirements/u4.md': unmet(0) + F(1),
  'build/requirements/f4.md': unmet(0) + F(1, 'deploy p3dev-l1', 'ROLLOUT NOT CONFIRMED on agent-runner'),
};
const repo = (config = {}, files = {}) => {
  const root = makeRepo({ ...FILES, 'process/config.json': { modules_file: 'build/modules.json', ...config }, ...files });
  openPassed(root);
  return root;
};

test('found: BOB\'s plain-PR act adds an unmet found mark to the module\'s requirement file, numbered per module', () => {
  const root = repo({}, { 'build/requirements/q2.md': `${unmet(0)}- **F1** struck: met by PR 9\n${F(2)}` });
  const out = [];
  const r = found(root, 'q2', '  founder sign-in\n answers HTTP 200 without a session ', { from: 'walk p3dev-l1', offline: true, log: (l) => out.push(l) });
  assert.equal(r.mark, 'F3', 'one past the highest F, met or not');
  assert.equal(r.file, 'build/requirements/q2.md');
  assert.equal(r.line, '- **F3** *(not yet met: walk p3dev-l1)* founder sign-in answers HTTP 200 without a session');
  const t = out.join('\n');
  assert.match(t, /found work for q2: F3 in build\/requirements\/q2\.md, the module's requirement file/);
  assert.match(t, /BOB's act, a plain pull request into tranche:\n1\. git switch -c found\/q2-f3 tranche/);
  assert.match(t, /\n {3}- \*\*F3\*\* \*\(not yet met: walk p3dev-l1\)\* founder sign-in/);
  assert.match(t, /merge <that pull request> --plain --no-review "work found elsewhere: one found mark, no code"/);
  // Numbered per module: another module starts at F1.
  assert.equal(found(root, 'base', 'x', { offline: true, log: quiet }).mark, 'F1');
  // --write appends the one line and changes nothing else (the diff merge --plain accepts); the next is F4.
  const before = readFileSync(join(root, 'build/requirements/q2.md'), 'utf8');
  found(root, 'q2', 'second finding', { from: 'walk p3dev-l1', write: true, offline: true, log: quiet });
  const text = readFileSync(join(root, 'build/requirements/q2.md'), 'utf8');
  assert.equal(text, `${before}- **F3** *(not yet met: walk p3dev-l1)* second finding\n`);
  assert.equal(found(root, 'q2', 'third', { offline: true, log: quiet }).mark, 'F4');
  assert.equal(found(root, 'q2', 'third', { offline: true, log: quiet }).line, '- **F4** *(not yet met: found)* third', 'default source');
});

test('found: with origin, two findings for one module before the first merges get two numbers: the checkout\'s copy and found/<module>-f<n> branches count', () => {
