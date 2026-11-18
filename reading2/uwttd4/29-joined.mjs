// ===== file: workflow-limits.mjs (continued) =====

}
// runs-on is not free: it picks the default shell (pwsh on Windows does not stop at a failed
// command), and the run rule below stands on bash -e (cold review of R1).
const JOB_FREE = new Set(['name', 'permissions', 'timeout-minutes', 'concurrency', 'steps']);
const STEP_FREE = new Set(['name', 'timeout-minutes', 'uses', 'with', 'run']);
// The inputs of an existing step that may change, be added or be removed: a toolchain's version
// and its cache. Any other (checkout's ref, repository or path; a script) could change what is
// tested (cold review of R1).
const FREE_INPUT = /^([a-z0-9]+-)?version$|^cache(-dependency-path)?$/i;
// Whether a step's run stops at a failed command, so a line appended after its last cannot hide
// one: GitHub's default shell on Linux and macOS (bash -e), or shell bash or sh, which GitHub
// runs with -e; the job's and the workflow's defaults count, and runs-on must not be Windows.
const SHELL_E = new Set(['bash', 'sh']);
function stopsOnFailure(step, job, wf) {
  const sh = step.shell ?? job?.defaults?.run?.shell ?? wf?.defaults?.run?.shell;
  if (sh !== undefined) return SHELL_E.has(sh);
  const on = JSON.stringify(job?.['runs-on'] ?? '');
  return !/windows|\$\{\{/i.test(on);
}

// L5 for one required job present in both. Returns { why, line } or null.
function keepsChecks(bj, hj, key, hLine, wf) {
  if (!isMap(bj) || !isMap(hj)) return same(bj, hj) ? null : { why: `the required job ${key} changed shape`, line: hLine };
  for (const k of new Set([...Object.keys(bj), ...Object.keys(hj)])) {
    if (JOB_FREE.has(k) || same(bj[k], hj[k])) continue;
    return { why: `the required job ${key} has its ${k} ${k in hj ? (k in bj ? 'changed' : 'added') : 'removed'}`, line: lineOf(hj, k) ?? hLine };
  }
  const bs = Array.isArray(bj.steps) ? bj.steps : [];
  const hs = Array.isArray(hj.steps) ? hj.steps : null;
  if (!hs) return bs.length ? { why: `the required job ${key} has its steps removed`, line: hLine } : null;
  let j = 0;
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    const id = stepKey(b);
    let at = j;
    while (at < hs.length && stepKey(hs[at]) !== id) at++;
    const label = isMap(b) && isText(b.name) ? `"${b.name}"` : `step ${i + 1}`;
    if (at >= hs.length) return { why: `the required job ${key} loses its step ${label} (base line ${lineOf(bj.steps, i)}), or has it moved before another`, line: lineOf(hj, 'steps') ?? hLine };
    // New steps only after its last existing step (Bob, 6 Nov, on #192: "as recommended"): a step
    // put before one it had could write $GITHUB_PATH or $GITHUB_ENV, or change the files, ahead
    // of the tests.
    if (at !== i) return { why: `the required job ${key} has a new step before its existing ${label.startsWith(`"`) ? `step ${label}` : label}; new steps go only after its last existing step`, line: lineOf(hs, i) ?? hLine };
    j = at + 1;
    const h = hs[at];
    const line = lineOf(hs, at);
    if (!isMap(b) || !isMap(h)) { if (!same(b, h)) return { why: `the required job ${key}'s step ${label} changed`, line }; continue; }
    for (const k of new Set([...Object.keys(b), ...Object.keys(h)])) {
      if (STEP_FREE.has(k) || same(b[k], h[k])) continue;
      return { why: `the required job ${key}'s step ${label} has its ${k} ${k in h ? (k in b ? 'changed' : 'added') : 'removed'}`, line: lineOf(h, k) ?? line };
    }
    if (actionOf(b.uses) !== actionOf(h.uses)) return { why: `the required job ${key}'s step ${label} uses ${h.uses ?? 'no action'} instead of ${actionOf(b.uses) ?? 'no action'}`, line: lineOf(h, 'uses') ?? line };
    const bw = isMap(b.with) ? b.with : {};
    const hw = isMap(h.with) ? h.with : {};
    if (b.with !== undefined && !isMap(b.with) && !same(b.with, h.with)) return { why: `the required job ${key}'s step ${label} has its with changed`, line };
    for (const k of new Set([...Object.keys(bw), ...Object.keys(hw)])) if (!FREE_INPUT.test(k) && !same(bw[k], hw[k])) return { why: `the required job ${key}'s step ${label} has its input ${k} ${k in hw ? (k in bw ? 'changed' : 'added') : 'removed'}; only a version or a cache may change`, line: lineOf(hw, k) ?? line };
    if ((b.run !== undefined || h.run !== undefined) && !same(b.run, h.run)) {
      // A folded run is joined into one line by GitHub: its lines cannot be judged one by one.
      if (foldedAt(b, 'run') || foldedAt(h, 'run')) return { why: `the required job ${key}'s step ${label} has a folded (>) run that changed`, line: lineOf(h, 'run') ?? line };
      if (!stopsOnFailure(h, hj, wf)) return { why: `the required job ${key}'s step ${label} has its run changed, and its shell does not stop at a failed command`, line: lineOf(h, 'run') ?? line };
      const br = runLines(b.run);
      const hr = runLines(h.run);
      if (!br || !hr) return { why: `the required job ${key}'s step ${label} has its run ${hr ? 'added' : 'removed'}`, line: lineOf(h, 'run') ?? line };
      const hs2 = hunks(br, hr);
      const lost = hs2?.find((x) => x.del > 0);
      if (!hs2 || lost) return { why: `the required job ${key}'s step ${label} drops the line "${(br[lost?.at] ?? '').trim().slice(0, 80)}" from its run`, line: lineOf(h, 'run') ?? line };
      const early = hs2.find((x) => x.at < br.length);
      if (early) return { why: `the required job ${key}'s step ${label} has a line put into its run before its last line ("${early.add[0].trim().slice(0, 80)}"); lines may be added only after it`, line: lineOf(h, 'run') ?? line };
    }
  }
  return null;
}

// Judges one workflow file's change. base and head are the file's text (null: absent).
// required: the base branch's required check names. Returns { ok: true, limits } or
// { ok: false, limit, line, why }. L4 (the shims) is the caller's.
export function judgeWorkflow(path, base, head, required = []) {
  const bad = (limit, line, why) => ({ ok: false, limit, line, why });
  if (head === null) return bad('removal', null, 'it deletes a workflow');
  const plain = plainText(head, base);
  if (plain) return bad('reading', null, plain.replace(/^rule 3: /, ''));
  const h = readWorkflow(head);
  if (h.why) return bad('reading', null, `it cannot be read as the plain YAML the limits judge (${h.why})`);
  let b = { doc: null };
  if (base !== null) {
    b = readWorkflow(base);
    if (b.why) return bad('reading', null, `the base's copy cannot be read as the plain YAML the limits judge (${b.why})`);
  }
  const H = h.doc;
  const B = b.doc || {};
  const hJobs = isMap(H.jobs) ? H.jobs : {};
  const bJobs = isMap(B.jobs) ? B.jobs : {};
  if (!isMap(H.jobs)) return bad('reading', lineOf(H, 'jobs'), 'it has no jobs mapping');
  if (B.jobs !== undefined && !isMap(B.jobs)) return bad('reading', null, 'the base\'s copy has no jobs mapping');

  // L1
  for (const k of new Set([...Object.keys(bJobs), ...Object.keys(hJobs)])) {
    const bn = k in bJobs ? jobNames(k, bJobs[k]) : null;
    const hn = k in hJobs ? jobNames(k, hJobs[k]) : null;
    const hit = (bn && matchesRequired(bn, required)) || (hn && matchesRequired(hn, required));
    if (!hit || (bn && hn && same(bn, hn))) continue;
    const what = !bn ? 'adds' : !hn ? 'removes' : 'renames';
    return bad('L1', lineOf(hJobs, k) ?? (hn ? lineOf(hJobs[k], 'name') : null), `it ${what} the job ${k}${hn && bn ? ` (${bn[0]} to ${hn[0]})` : ''}, whose name matches a required check (${required.join(', ')})`);
  }

  // L2
  try {
    const bTop = base === null ? { all: 'read', scopes: {} } : perms(B.permissions, 'the base');
    const hTop = perms(H.permissions, 'the workflow');
    if (base === null && (hTop === undefined || grantsWrite(hTop))) return bad('L2', lineOf(H, 'permissions'), hTop === undefined ? 'a new workflow must declare its permissions (without them it takes the default, which may write)' : 'a new workflow grants write permissions');
    const top = wider(bTop, hTop);
    if (top) return bad('L2', lineOf(H, 'permissions'), `the workflow's ${top}`);
    for (const [k, hj] of Object.entries(hJobs)) {
      const bj = bJobs[k];
      const hp = isMap(hj) && 'permissions' in hj ? perms(hj.permissions, `job ${k}`) : hTop;
      const bp = isMap(bj) && 'permissions' in bj ? perms(bj.permissions, `the base's job ${k}`) : bTop;
      const w = wider(bp, hp);
      if (w) return bad('L2', (isMap(hj) && lineOf(hj, 'permissions')) || lineOf(hJobs, k), `job ${k}: ${w}`);
      if (base === null && hp && grantsWrite(hp)) return bad('L2', lineOf(hJobs, k), `job ${k} of a new workflow grants write permissions`);
    }
  } catch (e) { return bad('L2', null, e.message); }

  // L3
  if (!isText(H.on) && !Array.isArray(H.on) && !isMap(H.on)) return bad('reading', lineOf(H, 'on'), 'it has no `on` this reader reads');
  const was = new Set(events(B.on));
  for (const e of ['pull_request_target', 'workflow_run']) if (events(H.on).includes(e) && !was.has(e)) return bad('L3', lineOf(H, 'on'), `it adds the ${e} trigger`);

  // L5
  const requiredJobs = Object.keys(bJobs).filter((k) => matchesRequired(jobNames(k, bJobs[k]), required));
  if (requiredJobs.length) {
    for (const k of ['env', 'defaults']) if (!same(B[k], H[k])) return bad('L5', lineOf(H, k), `it changes the workflow's ${k}, and the workflow holds the required job ${requiredJobs.join(', ')}`);
    for (const k of requiredJobs) {
      const r = keepsChecks(bJobs[k], hJobs[k], k, lineOf(hJobs, k), H);
      if (r) return bad('L5', r.line, r.why);
    }
  }
  return { ok: true, limits: ['L1', 'L2', 'L3', 'L5'], required: requiredJobs };
}

// The refusal's words: the limit, the line, why, and that the owner decides past them.
export const OUTSIDE = 'a workflow change outside the owner\'s limits needs the owner\'s word: bring it to Bob';
export const refusal = (path, r) => `${path}: ${r.limit}${r.line ? ` (line ${r.line})` : ''}: ${r.why}`;

// ===== file: status.test.mjs =====

import test from 'node:test';
import assert from 'node:assert/strict';
import { commit, makeRepo, entry, onState, openPassed, setJobCap } from './helpers.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const quiet = () => {};
import { layerState, status } from '../lib/status.mjs';

const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';

test('status --role bob lists next work: unmet requirement files with no open job, fewest first', () => {
  const root = makeRepo({
    'build/requirements/README.md': unmet(1),
    'build/requirements/big.md': unmet(5),
    'build/requirements/small.md': unmet(2),
    'build/requirements/done.md': unmet(0),
    'build/requirements/busy.md': unmet(1),
    'process/ledger/busy.json': entry('busy', { requirements: 'build/requirements/busy.md' }),
  });
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.deepEqual(r.next.map((x) => [x.file, x.count]), [['build/requirements/small.md', 2], ['build/requirements/big.md', 5]]);
  assert.match(out.join('\n'), /next work \(1 jobs open; BOB chooses from these, unmet requirements each\): all 2 listed; pass --sessions <file>/);
});

const LAYERS = '# Layers\n\n| layer | what | modules |\n|---|---|---|\n| 0 | base | `done0` |\n| 1 | first | a, b, c, busy |\n| 2 | next | d |\n';

test('status --role bob: next work only from the open layer, at most the job cap less the job sessions', (t) => {
  setJobCap(t, 5);
  const files = {
    'build/layers.md': LAYERS,
    'build/requirements/done0.md': unmet(0),
    'build/requirements/a.md': unmet(3),
    'build/requirements/b.md': unmet(1),
    'build/requirements/c.md': unmet(0),
    'build/requirements/busy.md': unmet(1),
    'build/requirements/d.md': unmet(1),
