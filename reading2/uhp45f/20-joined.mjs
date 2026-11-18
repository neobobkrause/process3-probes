// ===== file: report.test.mjs (continued) =====

  git(['checkout', '-q', 'origin/tranche'], { cwd: root });
  return root;
}

test('report tranche: in a depth-1 clone of a tranche that main was merged into, deepen measures what a full clone does', () => {
  const { src, h2 } = mergedMain();
  const full = cloneOf(src, false);
  const root = cloneOf(src, true);
  const cfg = loadConfig(root);
  const run = (r, deepened) => trancheReport(r, cfg, { now: NOW, deepened, io: { merged: () => null } });
  const want = run(full, deepen(full, "tranche"));
  assert.match(want, /\| a \| OPEN \| unmeasured \| 1 \(R1\) \|/);
  assert.match(want, /- record-only commits: 2 of 3 commits in the tranche/, 'the commits merged in from main are main\'s');
  const before = run(root, null);
  assert.match(before, /\| a \| OPEN \| unmeasured \| unmeasured \|/);
  assert.match(before, /- record-only commits: unmeasured/);
  const deep = deepen(root, 'tranche');
  assert.equal(deep.base, git(['rev-parse', 'main~3'], { cwd: src }), 'main before the tranche\'s first commit');
  assert.deepEqual(deep.onMain, [h2], 'the merge\'s parent on main');
  assert.equal(run(root, deep), want);
  // The minimum: main's history behind its tip and the merged-in commit is not fetched.
  assert.notEqual(git(['cat-file', '-e', `${h2}^^{commit}`], { cwd: root, allowFail: true }).code, 0, 'h1 not fetched');
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: root }), 'true');
});

test('report tranche: in a depth-1 clone where main moved since the tranche opened, the base deepen fetched is vouched for', () => {
  const src = fixture();
  git(['checkout', '-q', 'main'], { cwd: src });
  commit(src, { 'src/h/1.js': '1\n' }, 'h1');
  git(['checkout', '-q', 'tranche'], { cwd: src });
  const root = cloneOf(src, true);
  const cfg = loadConfig(root);
  const deep = deepen(root, 'tranche');
  assert.deepEqual(deep, { base: git(['rev-parse', 'main^'], { cwd: src }), onMain: [] });
  assert.deepEqual(span(root, 'origin/tranche', 'origin/main'), { open: 'unmeasured', close: null, base: null }, 'cut history alone cannot place the base on main');
  const md = trancheReport(root, cfg, { now: NOW, deepened: deep, io: { merged: () => null } });
  assert.match(md, /\| a \| OPEN \| unmeasured \| 1 \(R1\) \|/);
  assert.match(md, /- record-only commits: 1 of 2 commits in the tranche/);
});

// ===== file: layerflow.mjs (later part) =====

      publish_runs: runs.filter((t) => t.module === id && after(t)).length, publish_minutes: sum(runs.filter((t) => t.module === id && after(t)).map((t) => t.minutes)),
      gate_runs: g.length, gate_unknown_runs: g.filter((x) => !Number.isFinite(x.minutes)).length, gate_minutes: sum(g.map((x) => x.minutes)), gate_suite_minutes: sum(g.map((x) => x.suite_minutes)), gate_record_only_minutes: sum(g.filter((x) => x.record_only).map((x) => x.minutes)),
      work_minutes: wall === null ? null : r2(wall - sum(mine.filter(inside).map((t) => t.minutes))),
      tests_in_wall_minutes: sum(mine.filter(inside).map((t) => t.minutes)),
    };
  });
  const known = per.filter((x) => x.wall_minutes !== null);
  const wall = sum(known.map((x) => x.wall_minutes));
  const localKnown = sum(known.map((x) => x.tests_in_wall_minutes));
  const work = sum(known.map((x) => x.work_minutes));
  const total = {
    starts: per.reduce((t, x) => t + x.starts, 0), wall_minutes: known.length ? wall : null, wall_unknown_modules: per.length - known.length,
    local_test_minutes: sum(per.map((x) => x.local_test_minutes)), publish_minutes: sum(per.map((x) => x.publish_minutes)), gate_minutes: sum(per.map((x) => x.gate_minutes)), gate_unknown_runs: per.reduce((t, x) => t + x.gate_unknown_runs, 0),
    gate_suite_minutes: sum(per.map((x) => x.gate_suite_minutes)), gate_record_only_minutes: sum(per.map((x) => x.gate_record_only_minutes)),
    work_minutes: known.length ? work : null,
    test_share: known.length && wall > 0 ? r2(localKnown / wall) : null,
    test_per_work: known.length && work > 0 ? r2(localKnown / work) : null,
  };
  return { per_module: per, total };
}
export const budgetLine = (b) => `time budget: ${b.total.starts} start(s); wall ${b.total.wall_minutes ?? 'unknown'} min${b.total.wall_unknown_modules ? ` (${b.total.wall_unknown_modules} module(s) unknown)` : ''}; local tests ${b.total.local_test_minutes} min; publish runs ${b.total.publish_minutes} min; gate ${b.total.gate_minutes} min on landed PRs (suites ${b.total.gate_suite_minutes}, record-only ${b.total.gate_record_only_minutes}${b.total.gate_unknown_runs ? `, ${b.total.gate_unknown_runs} run(s) of unknown length` : ''}); work ${b.total.work_minutes ?? 'unknown'} min; tests ${b.total.test_share === null ? 'unknown' : `${Math.round(b.total.test_share * 100)}%`} of wall, ${b.total.test_per_work ?? 'unknown'} per minute of work`;

export function layerReport(root, n, { log = console.log, toolFrom = null, toolTo = 'HEAD', toolRoot = null } = {}) {
  n = layerNum(n);
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  fetchBranch(root, layerBranch(n), { allowFail: true });
  const rows = flowRows(root, cfg.state_branch, n);
  const m = trialMeasures(rows, { anc: (a, b) => isAnc(root, a, b) });
  // The time budget: the layer's modules (its map, and every module its rows name), their start
  // and complete rows as the layer branch holds them.
  const lref = layerRef(n);
  const at = layersAt(root, cfg, git(['rev-parse', '--verify', '-q', lref], { cwd: root, allowFail: true }).code === 0 ? lref : null).find((l) => l.n === n);
  const mapped = at?.mods || [];
  // The round it ran in (BD-R1): a round layer's own, else 1; the map layer a round layer passed over.
  m.round = roundOf(at);
  if (at?.round) m.of = at.round.of;
  const mods = new Set([...mapped, ...rows.runs.map((r) => r.module), ...rows.lands.map((l) => l.module), ...rows.tests.map((t) => t.module), ...rows.gates.map((g) => g.module)]);
  const attempts = Object.fromEntries([...mods].map((id) => [id, rowsAt(root, lref, id)]));
  m.time_budget = timeBudget(mods, { attempts, tests: rows.tests, runs: rows.runs, gates: rows.gates, since: rows.open?.at ?? null });
  if (toolFrom) {
    const st = git(['diff', '--shortstat', toolFrom, toolTo, '--', 'tool/'], { cwd: toolRoot || root, allowFail: true }).stdout.trim();
    const ins = Number(st.match(/(\d+) insertion/)?.[1] || 0);
    const del = Number(st.match(/(\d+) deletion/)?.[1] || 0);
    m.tool_lines = { from: toolFrom, to: toolTo, added: ins, removed: del };
  }
  const c = m.reschedule_changed_result;
  log(`${layerName(at, n)}${at?.round ? '' : `, round ${m.round}`}: ${m.modules} module(s); open to merged ${m.hours_open_to_merged}${typeof m.hours_open_to_merged === 'number' ? ' h' : ''}; ${m.gate_runs} gate run(s) over ${m.lands} land(s); ${m.reschedules} reschedule(s) from ${m.interface_changes} interface change(s); a reschedule changed its user's result ${c.changed} time(s) (unchanged ${c.unchanged}, unknown ${c.unknown}); ${m.lands_breaking} breaking and ${m.lands_additive} additive land(s); ${m.reschedules_old_rule} reschedule(s) under the old trigger rule, ${m.reschedules_avoided} avoided; ${m.retests_owed} retest(s) owed by additive changes, ${m.retests} retest(s), ${m.retest_lands} landed; ${m.starts} job start(s), ${m.early_starts} early; ${m.halted_runs} run(s) halted, ${m.minutes_lost_to_halts} min lost${m.tool_lines ? `; tool lines +${m.tool_lines.added} -${m.tool_lines.removed}` : ''}`);
  log(budgetLine(m.time_budget));
  let notices = [];
  try { notices = noticeRecords(root, cfg.state_branch); } catch { notices = []; }
  m.next_layer_early = earlyRework(rows, notices);
  if (m.next_layer_early.early) log(`early starts into layer ${n}: ${m.next_layer_early.early}; rework ${m.next_layer_early.rework} (${m.next_layer_early.rate}%): ${m.next_layer_early.each.map((x) => `${x.module} ${x.rework || 'none'}`).join(', ')}`);
  log('the baseline: the same layer\'s history under the serial train (the merge rows on the state branch)');
  log(JSON.stringify(m, null, 2));
  return { ok: true, measures: m };
}

// ===== file: roles.test.mjs =====

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_ENTRY, commit, makeRepo, processRegisterFixture } from './helpers.mjs';
import { HANDOVER_FILE, senderOf, handoverBegin, handoverConfirm, readAddress, recordStart, rootPrompt, startRole } from '../lib/roles.mjs';
import { approvalsHash } from '../lib/start.mjs';
import { promptBody } from '../lib/register.mjs';

processRegisterFixture([SEED_ENTRY]);
import { git } from '../lib/util.mjs';
import { address } from '../lib/state.mjs';
import { bobWake, wakeLine } from '../lib/job.mjs';
import { parseArgs } from '../lib/util.mjs';

const quiet = () => {};
const TOOL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const R = 'session_root1';
const B1 = 'session_bob1';
const B2 = 'session_bob2';

function withOrigin() {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche' } });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return root;
}
const stateFile = (root, f) => git(['show', `origin/process-state:${f}`], { cwd: root });

test('start record writes the address on the state branch, never touching the checkout', () => {
  const root = withOrigin();
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.deepEqual(readAddress(root), {});
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B1, { log: quiet });
  const a = readAddress(root);
  assert.equal(a.root.session, R);
  assert.equal(a.bob.session, B1);
  assert.match(a.bob.at, /^\d{4}-\d\d-\d\dT/);
  assert.equal(address(root, 'process-state', 'bob'), B1, 'send reads the same file');
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), head);
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  assert.throws(() => recordStart(root, 'bob', B2, { log: quiet }), /handover confirm/);
  assert.throws(() => recordStart(root, 'job', B2, { log: quiet }), /name a role/);
  assert.throws(() => recordStart(root, 'root', 'not-an-id', { log: quiet }), /not a session id/);
});

test('another writer\'s commit on the state branch is kept', () => {
  const root = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  // Another writer adds a file between our fetch and our push: simulate by pushing from a clone.
  const other = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', '-b', 'process-state', git(['remote', 'get-url', 'origin'], { cwd: root }), other], { cwd: root });
  for (const [k, v] of [['user.email', 't@t'], ['user.name', 'T']]) git(['config', k, v], { cwd: other });
  const theirs = commit(other, { 'heartbeat.txt': 'x' });
  git(['push', '-q', 'origin', 'process-state'], { cwd: other });
  recordStart(root, 'bob', B1, { log: quiet });
  assert.equal(git(['merge-base', '--is-ancestor', theirs, 'origin/process-state'], { cwd: root, allowFail: true }).code, 0);
});

test('start prints prompts and the create_session call; start bob refuses while a BOB is addressed', () => {
  const root = withOrigin();
  const r = startRole(root, 'root', { slug: 'o/p', address: {}, log: quiet });
  assert.match(r.prompt, /^# ROOT\n\nPriorities first/);
  for (const act of ['start bob', 'handover begin', 'handover confirm', 'interrupt', 'archive', 'sweep', 'step 0', 'heartbeat', 'push notification']) assert.ok(r.prompt.includes(act), act);
