// ===== file: coordinator-refresh.test.mjs (continued) =====

  assert.match(c, /send ROOT one message asking for your refresh: `start coordinator --replace <your id> --branch start\/coordinator-4nov --handoff <its path>`/);
});

test('the rule lives where the coordinator and ROOT read it: README guidance, the CLAUDE.md shim, root.md principle 1', () => {
  const readme = readFileSync(join(TOOL, 'README.md'), 'utf8');
  const guide = readme.slice(readme.indexOf('## Coordinator guidance'), readme.indexOf('## The job cap'));
  assert.match(guide, /Never start your own successor[^\n]*send ROOT one message asking for your refresh with `start coordinator --replace <your id>/);
  const shim = readFileSync(join(TOOL, 'shims', 'CLAUDE.process.md'), 'utf8');
  assert.match(shim, /No session starts its own successor: ROOT starts a new BOB \(the handover\) and a new coordinator \(`start coordinator`/);
  const rb = readFileSync(join(TOOL, 'rulebooks', 'root.md'), 'utf8');
  const p1 = rb.split('\n').find((l) => l.startsWith('1. No session starts its own successor'));
  assert.match(p1, /a new coordinator only from you, at its ask/);
  assert.match(p1, /Held by `start bob` and `start record bob`[^.]*, and `start coordinator`/);
  // Ten-rule cap: principles and rules together.
  assert.ok(rb.split('\n').filter((l) => /^\d+\. /.test(l)).length <= 10);
});

test('switch in: a stale coordinator address is repointed by the new coordinator itself, once the config names it', () => {
  const m = { addresses: {}, tasks: [], jobs: [], messages: [] };
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

// ===== file: layerflow.mjs (later part) =====

      }
      continue;
    }
    // Its files all came by other modules' verified lands (paths moved to it since): those lands
    // carry the provider checks; with no land of its own and no layer place, nothing more is owed.
    if (!last && fs.length && !inLayer.has(e.id)) continue;
    // Each provider in the layer: its interface-changing lands are held by this module's last green head.
    const late = [];
    for (const p of usesOf(e).filter((u) => byId.has(u) && u !== e.id)) {
      for (const pl of lands.filter((x) => x.v.id === p && !(last && isAnc(root, x.c, last.v.head)))) {
        if (interfaceChange(root, cfg, p, pl.v.parent, pl.c).changed) late.push(`${p} (PR ${pl.v.pr}, ${short(pl.c)})`);
      }
    }
    if (late.length) findings.push({ check: 'layer', file: entryFile(e.id), line: 1, message: `${e.id}'s ${last ? `last green run (PR ${last.v.pr}, ${short(last.v.head)})` : 'work (no land on the layer)'} did not hold the interface change of ${late.join(', ')}: it never counts; ${e.id} re-runs and publishes again` });
    else if (last) covered.push({ id: e.id, pr: last.v.pr, merge: last.c, ...(last.v.pr_unreadable ? { pr_unreadable: last.v.pr_unreadable } : {}), ...(last.v.run_unreadable ? { run_unreadable: last.v.run_unreadable } : {}) });
  }
  const own = new Set(entries.flatMap((e) => need.filter((f) => inMod(e, f))));
  // The completion file (C33): changed on the layer only by the tool's tick at a completion layer's
  // merge, each flipping open items of modules with a verified land on this chain; anything else is a finding.
  const cf = cfg.completion_file;
  if (typeof cf === 'string' && needSet.has(cf) && !own.has(cf)) {
    own.add(cf);
    const comp = layersAt(root, cfg, head).find((L) => L.n === n)?.completion;
    const compItems = comp ? (() => { const fr = flowRows(root, cfg.state_branch, n); return new Set(layerItems(comp, fr.joins, fr.items).map((x) => x.id)); })() : null;
    const landedIds = new Set(lands.map((x) => x.v.id));
    for (const c of touched.get(cf) || []) {
      const subj = git(['log', '-1', '--format=%s', c], { cwd: root });
      // Only a completion layer's own tick, numbered as this layer, on its own items (cold review of C33).
      const m = subj.match(TICK_TITLE);
      const t = !m || Number(m[1]) !== n || !compItems ? { why: 'is not the tool\'s tick of this completion layer' } : tickCheck(root, cf, parents(c)[0], c, landedIds, compItems);
      if (t.why) findings.push({ check: 'layer', file: cf, line: 1, message: `${cf} changed on ${branch} by ${short(c)}, which ${t.why}` });
    }
  }
  for (const f of need.filter((x) => !own.has(x))) findings.push({ check: 'layer', file: f, line: 1, message: `${f} is in no module: a plain change goes to ${cfg.tranche} between layers, not onto ${branch}` });
  return { findings, covered };
}

// The gate's minutes as state rows (R9, Bob, 6 Nov: the time budget). The gate's own token can
// only read (shims/process-gate.yml: job gate reads, job post writes only the PR's comment), and
// the owner's limits forbid widening it, so the land, which reads the PR's gate rows and writes
// the state branch, records them: one row per gate run, its whole minutes, its suite minutes
// (this module's suite, or the run's when it ran this module alone; null when none of this
// module's ran), and whether it was a record-only run (trigger record or record-since-green).
// Only a pull request that lands is recorded: a closed or replaced one's gate runs are not.
// Keyed by the run and its attempt (a GitHub re-run keeps the run id), else its head and time,
// so a run is one file however often it is seen.
export const RECORD_ONLY = (r) => r.trigger === 'record' || r.trigger === 'record-since-green';
export function gateRow(n, id, pr, r) {
  const ran = ['pass', 'fail', 'base-red'].includes(r.suite) && !(r.requirements_only || []).some((x) => x?.module === id && !x.files?.length);
  const sec = !ran ? null : Number.isFinite(r.suite_by_module?.[id]) ? r.suite_by_module[id]
    : !r.suite_by_module && Array.isArray(r.scope) && r.scope.length === 1 && r.scope[0] === id && Number.isFinite(r.suite_seconds) ? r.suite_seconds : null;
  return {
    row: 'gate', layer: n, module: id, pr, sha: r.sha, run_id: r.run_id ?? null, run_attempt: r.run_attempt ?? null, at: r.at ?? null, trigger: r.trigger ?? null, suite: r.suite ?? null, ok: r.ok ?? null,
    minutes: Number.isFinite(r.minutes) ? r.minutes : null,
    suite_minutes: sec === null ? null : Math.round((sec / 60) * 100) / 100,
    record_only: RECORD_ONLY(r),
    // The module's whole suite (its scope, not narrowed to the tests that read a requirements file):
    // a land whose PR and run GitHub later hides stands on this row alone (cold review of PR 735's fix).
    whole: Array.isArray(r.scope) && r.scope.includes(id) && !(Array.isArray(r.requirements_only) && r.requirements_only.some((x) => x?.module === id)),
  };
}
const gateKey = (r) => (r.run_id ? `${r.run_id}-${r.run_attempt ?? 1}` : `${short(r.sha)}-${Date.parse(r.at) || 0}`);
export const gateFiles = (n, id, pr, runs) => runs.map((r) => [flowFile(n, 'gate', `${safeName(id)}-${pr}-${gateKey(r)}`), gateRow(n, id, pr, r)]);

// ---- layer report (the trial's measures) ----------------------------------------------------

// How often a reschedule changed its user's result: the user's last finished run (pass or fail)
// before the reschedule against its first finished run after it, on a tip holding the provider's land.
export function resultChanges(reschedules, runs, anc = () => true) {
  const out = { changed: 0, unchanged: 0, unknown: 0, rows: [] };
  for (const r of reschedules) {
    const mine = runs.filter((x) => x.module === r.user && (x.result === 'pass' || x.result === 'fail'));
    const prev = mine.filter((x) => x.ended <= r.at).at(-1);
    const next = mine.find((x) => x.started >= r.at && anc(r.provider_land, x.tested_on));
    const v = !prev || !next ? 'unknown' : prev.result === next.result ? 'unchanged' : 'changed';
    out[v]++;
    out.rows.push({ key: r.key, user: r.user, provider: r.provider, before: prev?.result ?? null, after: next?.result ?? null, verdict: v });
  }
  return out;
}

const TRIGGERS = ['exports', 'provides-text', 'provides-test', 'exports-unread'];
const countTriggers = (lands, k) => Object.fromEntries(TRIGGERS.map((t) => [t, lands.filter((l) => (l.interface?.[k] || (k === 'triggers_old' ? l.interface?.triggers : null) || []).includes(t)).length]));
export function trialMeasures(rows, { anc = () => true } = {}) {
  // The trial counts every reschedule made, a cleared one included (cold review of C11): a false
  // reschedule is what it measures. The cleared are counted apart.
  if (rows.reschedules_all) rows = { ...rows, reschedules: rows.reschedules_all, cleared: (rows.clears || []).length };
  const mods = new Set([...rows.runs.map((r) => r.module), ...rows.lands.map((l) => l.module), ...rows.reschedules.map((r) => r.user)]);
  const per = [...mods].sort().map((id) => {
    const runs = rows.runs.filter((r) => r.module === id);
    return {
      id, runs: runs.length, pass: runs.filter((r) => r.result === 'pass').length, fail: runs.filter((r) => r.result === 'fail').length,
      halted: runs.filter((r) => r.result === 'halted').length, lands: rows.lands.filter((l) => l.module === id).length,
      gate_runs: rows.lands.filter((l) => l.module === id).reduce((s, l) => s + (l.gate_runs || 0), 0),
      reschedules: rows.reschedules.filter((r) => r.user === id).length,
      retests: (rows.retests || []).filter((r) => r.module === id).length,
    };
  });
  const halted = rows.runs.filter((r) => r.result === 'halted');
  const hours = rows.open && rows.merged ? Math.round(((Date.parse(rows.merged.at) - Date.parse(rows.open.at)) / 3600000) * 100) / 100 : null;
  return {
    modules: per.length, hours_open_to_merged: hours ?? 'not merged',
    gate_runs: per.reduce((s, x) => s + x.gate_runs, 0), lands: rows.lands.length,
    interface_changes: rows.lands.filter((l) => l.interface?.changed).length,
    // Bob's "c": reschedules (breaking: a job each) apart from retests owed (additive: the gate alone).
    reschedules: rows.reschedules.filter((r) => r.class !== 'additive').length,
    retests_owed: rows.reschedules.filter((r) => r.class === 'additive').length,
    lands_breaking: rows.lands.filter((l) => l.interface?.class === 'breaking' || (l.interface?.changed && !l.interface?.class)).length,
    lands_additive: rows.lands.filter((l) => l.interface?.class === 'additive').length,
    // R8 (Bob, 6 Nov): the triggers each land fired under the rule before R8 and under R8's, and the
    // reschedules the old rule would have made; the difference is the false re-tests avoided.
    triggers_old_rule: countTriggers(rows.lands, 'triggers_old'), triggers_new_rule: countTriggers(rows.lands, 'triggers'),
    reschedules_old_rule: rows.lands.reduce((t, l) => t + (l.users_rescheduled_old_rule || l.users_rescheduled || []).length, 0),
    // Job sessions the old rule would have started that the new one does not (an additive change's users are retested, not rescheduled).
    reschedules_avoided: rows.lands.reduce((t, l) => {
      const retested = l.interface?.class === 'additive' ? new Set((rows.retests || []).filter((r) => r.cause === l.pr).map((r) => r.module)) : new Set();
      const jobs = (l.users_rescheduled || []).filter((u) => !retested.has(u)).length;
      return t + Math.max(0, (l.users_rescheduled_old_rule || l.users_rescheduled || []).length - jobs);
    }, 0),
    // R10: job starts in the layer, and the early ones (an in-layer provider not yet landed).
    starts: (rows.starts || []).length, early_starts: (rows.starts || []).filter((r) => Array.isArray(r.early) && r.early.length).length, early_unknown: (rows.starts || []).filter((r) => !Array.isArray(r.early)).length,
    // Retests (layer retest): opened, and those landed (no job session; a CI suite run each).
    retests: (rows.retests || []).length, retest_lands: rows.lands.filter((l) => l.retest).length,
    // Which trigger fired, per reschedule (Bob, 5 Nov, as relayed in the coordinator's handoff: "the
    // interface signal is exports + Provides text + tests of Provides requirements"); exports-unread
    // is the tool's own addition.
    reschedule_triggers: Object.fromEntries(['exports', 'provides-text', 'provides-test', 'exports-unread'].map((k) => [k, rows.reschedules.filter((r) => (r.triggers || []).includes(k)).length])),
    reschedule_changed_result: resultChanges(rows.reschedules, rows.runs, anc),
    halted_runs: halted.length, minutes_lost_to_halts: Math.round(halted.reduce((s, r) => s + (r.minutes_lost || 0), 0) * 10) / 10,
    per_module: per,
  };
}

// The time budget (R9, Bob, 6 Nov: "how much time goes to tests versus real work"), per module of
// the layer, from rows since the layer opened:
//   starts               its job's start rows (metrics, on the layer branch);
//   wall_minutes         each start to its complete (by attempt), summed; null when no attempt has
//                        both (open_attempts counts those still without a complete);
//   local_test_minutes   its `p3 test` rows (all of them);
//   publish_minutes      its layer publish runs (job complete: checks and the push; it runs no
//                        suite, the gate does), apart from the tests;
//   gate_minutes         its gate runs' whole minutes (the land's gate rows: landed PRs only),
//                        with suite and record-only minutes apart; a run of unknown length is
//                        counted in gate_unknown_runs, not as 0;
//   work_minutes         wall minus the local tests that ran inside a start-to-complete window
//                        (a test outside every window took no wall time here); null when wall
//                        is null.
// The layer total sums each; test_share is local test over wall, test_per_work local test over
// work, both over the modules whose wall is known (null when none).
const r2 = (x) => Math.round(x * 100) / 100;
export function timeBudget(mods, { attempts = {}, tests = [], runs = [], gates = [], since = null } = {}) {
  const after = (r) => !since || String(r.at ?? r.ended ?? '') >= String(since);
  const sum = (xs) => r2(xs.reduce((t, x) => t + (Number.isFinite(x) ? x : 0), 0));
  const per = [...mods].sort().map((id) => {
    const rows = (attempts[id] || []).filter((r) => r.row === 'attempt' && after(r));
    const starts = rows.filter((r) => r.event === 'start');
    let wall = null;
    let open = 0;
    const windows = [];
    for (const st of starts) {
      const c = rows.find((r) => r.event === 'complete' && (st.attempt === undefined || r.attempt === st.attempt) && String(r.at) >= String(st.at));
      if (!c || !Number.isFinite(Date.parse(c.at)) || !Number.isFinite(Date.parse(st.at))) { open++; continue; }
      windows.push([Date.parse(st.at), Date.parse(c.at)]);
      wall = (wall ?? 0) + (Date.parse(c.at) - Date.parse(st.at)) / 60000;
    }
    const mine = tests.filter((t) => t.module === id && after(t));
    const inside = (t) => { const a = Date.parse(t.started); const b = Date.parse(t.ended ?? t.at); return windows.some(([s, e]) => a >= s && b <= e); };
    const local = sum(mine.map((t) => t.minutes));
    const g = gates.filter((x) => x.module === id);
    return {
      id, starts: starts.length, open_attempts: open, wall_minutes: wall === null ? null : r2(wall),
      test_runs: mine.length, local_test_minutes: local,
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

// ===== file: generated.test.mjs =====

// Generated files over max_file_bytes (the copy, 4 Nov: rows.mjs 5.2 MB, the agent-worker bundle
// 8.9 MB, its main plane's bundle 29 MB). The record check refuses any commit that writes one, so no
// pull request can refresh it and layer close's "regenerated files differ" never cleared. The
// line: such a file is not committed; it is built at deploy and release; layer close regenerates
// and verifies it, comparing only the generated paths the tranche commits.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildGenerated, oversizeGenerated } from '../lib/checks.mjs';
import { DEPLOYS_FILE, deployDev } from '../lib/deploy.mjs';
import { layerChecks } from '../lib/layer.mjs';
import { releaseRun } from '../lib/release.mjs';
import { setupCheck } from '../lib/setup.mjs';
import { git, loadConfig, run } from '../lib/util.mjs';
import { entry, makeRepo, closeLayer } from './helpers.mjs';

const quiet = () => {};
const PASS = "import test from 'node:test';\ntest('ok', () => {});\n";
// gen.mjs writes both generated files: big.txt (never committed) and small.txt (committed).
const GEN = "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('gen', { recursive: true });\nwriteFileSync('gen/big.txt', 'B'.repeat(4096));\nwriteFileSync('gen/small.txt', 'fresh\\n');\n";
const ROWS = [
  { paths: ['gen/big.txt'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', "if (require('fs').statSync('gen/big.txt').size !== 4096) process.exit(1)"] },
  { paths: ['gen/small.txt'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] },
];
const done = (id) => ({ ...entry(id, { requirements: `build/requirements/${id}.md`, status: { state: 'COMPLETE' } }), tests: [`test/${id}/`] });
const product = (config = {}, files = {}) => ({
  'process/config.json': { generated: ROWS, max_file_bytes: 1024, ...config },
  'gen.mjs': GEN,
  'gen/small.txt': 'stale\n',
  'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n| 2 | next | d |\n',
  'build/requirements/a.md': '- **R1** *(not yet met: x)* text\n',
  'build/requirements/d.md': '- **R1** *(not yet met: x)* text\n',
  'process/ledger/a.json': done('a'),
  'test/a/x.test.mjs': PASS,
  ...files,
});
function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  return { root, bare };
}
const io = { openPRs: () => [], checkRun: () => null, compare: () => null };

test('layer checks: a generated path the tranche does not commit is built and verified, never "differs"; a committed one still differs', () => {
  const { root } = withOrigin(product());
  const cfg = loadConfig(root);
  const out = [];
  const r = layerChecks(root, cfg, git(['rev-parse', 'HEAD'], { cwd: root }), [{ id: 'a' }], { timeout: 60000, log: (m) => out.push(m) });
  assert.deepEqual(r.findings, [], out.join('\n'));
  assert.deepEqual(r.changed, ['gen/small.txt'], 'only the committed path is compared');
  assert.deepEqual(r.stale, [{ file: 'gen/small.txt', regenerate: 'node gen.mjs' }], 'named with its regenerate for layer merge');
  assert.deepEqual(r.built, ['gen/big.txt']);
  // A built file whose verify fails is a finding, even when .gitignore hides it from git.
  const bad = withOrigin(product({ generated: [{ ...ROWS[0], verify: ['node', '-e', 'process.exit(4)'] }] }, { '.gitignore': 'gen/big.txt\n' }));
  const f = layerChecks(bad.root, loadConfig(bad.root), git(['rev-parse', 'HEAD'], { cwd: bad.root }), [{ id: 'a' }], { timeout: 60000, log: quiet }).findings;
  assert.match(f.map((x) => `${x.check}: ${x.file}: ${x.message}`).join('\n'), /generated: gen\/big\.txt: .*failed \(exit 4\) after building/);
});

test('buildGenerated: only rows with a path the commit does not track are built; a failure is a finding', () => {
  const root = makeRepo(product());
  const ran = [];
  const exec = (c, a, o) => { ran.push([c, ...a].join(' ')); assert.ok(o.unset.includes('GITHUB_TOKEN')); return { code: 0, stdout: '', stderr: '', seconds: 0 }; };
  const b = buildGenerated(root, ROWS, { timeout: 60000, exec });
  assert.deepEqual(b.built, ['gen/big.txt']);
  assert.deepEqual(ran, ['node gen.mjs'], 'the committed row is not built');
  const f = buildGenerated(root, ROWS, { timeout: 60000, exec: () => ({ code: 2, stdout: '', stderr: 'boom', seconds: 0 }) });
  assert.match(f.findings[0].message, /node gen\.mjs failed \(exit 2\) building gen\/big\.txt: boom/);
});

test('setup check: a committed generated file over max_file_bytes is product work, named with BOB\'s act', () => {
  const root = makeRepo(product({}, { 'gen/big.txt': 'B'.repeat(4096) }));
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const lines = [];
  const r = setupCheck(root, { slug: 'o/r', conditions: [], io: { api: () => null, openPRs: () => [], prFiles: () => [] }, log: (l) => lines.push(l) });
  assert.deepEqual(r.generated.over, [{ file: 'gen/big.txt', bytes: 4096 }]);
  assert.match(lines.join('\n'), /product work: 1 committed generated file over max_file_bytes \(1024\); no pull request can refresh one:\n- gen\/big\.txt: 4096 bytes; BOB's act: stop committing it .* build it in release\.assemble and the deploy/);
  assert.deepEqual(oversizeGenerated(root, ROWS, 'HEAD', 1 << 20), []);
  const fine = makeRepo(product());
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: fine });
  const l2 = [];
  assert.deepEqual(setupCheck(fine, { slug: 'o/r', conditions: [], io: { api: () => null, openPRs: () => [], prFiles: () => [] }, log: (l) => l2.push(l) }).generated.over, []);
  assert.doesNotMatch(l2.join('\n'), /product work/);
});

test('deploy dev and release run build the uncommitted generated files before their own steps', () => {
  const GUARD = 'p3dev guard: passed';
  const node = (code) => ['node', '-e', code];
  const deploy = { slug_prefix: 'p3dev-', dry_run: node(`console.log(${JSON.stringify(GUARD)})`), deploy: node("if (!require('fs').existsSync('gen/big.txt')) process.exit(5)"), walk: node('0'), guard_line: GUARD };
  const { root, bare } = withOrigin(product({ deploy, plan: 'close' }));
  assert.equal(closeLayer(root, '1').ok, true);
  git(['clean', '-qfd', 'gen'], { cwd: root });
  const out = [];
  const r = deployDev(root, { io: { compare: () => null }, repo: 'o/p', log: (m) => out.push(m) });
  assert.equal(r.ok, true, out.join('\n'));
  assert.deepEqual(r.row.results.map((x) => [x.stage, x.exit]), [['build', 0], ['dry_run', 0], ['deploy', 0], ['walk', 0]]);
  assert.ok(JSON.parse(git(['show', `process-state:${DEPLOYS_FILE}`], { cwd: bare }).split('\n').at(-1)).ok, 'the run\'s row, after its start row');
  assert.match(out.join('\n'), /findings of the walk, if any, enter by the route for work found elsewhere: `node \.process\/tool\/p3\.mjs found <module> "<finding>" --from "walk p3dev-l1 \w{10}"`/);
  // The release's checks job, on its own checkout, builds them too.
  const rel = makeRepo(product({ release: { checks: [node("if (!require('fs').existsSync('gen/big.txt')) process.exit(6)")], assemble: node('0'), out: 'rel' } }));
  const c = releaseRun(rel, 'checks', { log: quiet });
  assert.equal(c.ok, true, JSON.stringify(c.results));
  assert.deepEqual(c.results.map((x) => [x.name, x.exit]), [['build generated gen/big.txt', 0], ["node -e if (!require('fs').existsSync('gen/big.txt')) process.exit(6)", 0]]);
  assert.ok(existsSync(join(rel, 'gen/big.txt')));
  assert.equal(readFileSync(join(rel, 'gen/big.txt'), 'utf8').length, 4096);
});

test('deploy dev installs the lock files before it builds the generated files (copy, 4 Nov: esbuild not found on a fresh checkout)', () => {
  const GUARD = 'p3dev guard: passed';
  const node = (code) => ['node', '-e', code];
  const deploy = { slug_prefix: 'p3dev-', dry_run: node(`console.log(${JSON.stringify(GUARD)})`), deploy: node('0'), walk: node('0'), guard_line: GUARD };
  // The build needs the installed package, as bundles.mjs needs esbuild.
  const needs = "if (!require('fs').existsSync('dep/node_modules/esbuild')) { console.error('Cannot find package esbuild'); process.exit(7) }";
  const rows = [{ ...ROWS[0], regenerate: ['sh', '-c', `node -e "${needs}" && node gen.mjs`] }];
  const lock = JSON.stringify({ name: 'dep', lockfileVersion: 3, packages: { '': {}, 'node_modules/esbuild': { version: '0.0.0' } } });
  const calls = [];
  // npm ci stands in: it installs the package where it runs; everything else runs for real.
  const exec = (cmd, args, o) => {
    calls.push(cmd);
    if (cmd !== 'npm') return run(cmd, args, o);
    mkdirSync(join(o.cwd, 'node_modules/esbuild'), { recursive: true });
    return { code: 0, stdout: '', stderr: '', seconds: 0 };
  };
  const { root } = withOrigin(product({ deploy, plan: 'close', generated: rows, lockfiles: ['dep/package-lock.json'] }, { 'dep/package.json': '{"name":"dep"}', 'dep/package-lock.json': lock }));
  assert.equal(closeLayer(root, '1').ok, true);
  git(['clean', '-qfdx', 'gen', 'dep'], { cwd: root });
  calls.length = 0;
  const out = [];
  const r = deployDev(root, { io: { compare: () => null, exec }, repo: 'o/p', log: (m) => out.push(m) });
  assert.equal(r.ok, true, out.join('\n'));
  assert.equal(calls[0], 'npm', `installed first: ${calls.join(', ')}`);
  assert.deepEqual(r.row.results.map((x) => [x.stage, x.exit]), [['build', 0], ['dry_run', 0], ['deploy', 0], ['walk', 0]]);
});

// Cold review of C31: a row whose build failed is not verified as well (a file never written): the
// build's own finding stands, alone.
test('PD-9: a built row whose build failed gives the build\'s finding only, no verify on a file never written', async () => {
  const { regenerate } = await import('../lib/checks.mjs');
  const root = makeRepo({ 'README.md': 'x\n', '.gitignore': 'out.json\n' });
  const rows = [{ paths: ['out.json'], regenerate: ['node', '-e', 'process.exit(2)'], verify: ['node', '-e', "require('fs').readFileSync('out.json')"] }];
  const b = buildGenerated(root, rows, { timeout: 60000 });
  assert.deepEqual([b.findings.length, b.failed.has(rows[0])], [1, true]);
  const g = regenerate(root, rows, { timeout: 60000, skip: b.ran, unbuilt: b.failed });
  assert.deepEqual(g.findings, []);
  assert.deepEqual([g.ran[0].verify, g.ran[0].built], [null, undefined]);
});

// ===== file: deploy.test.mjs =====

// Build Plan Phase 2, the deploy and walk: development deployments only (Bob's word, 3 Nov).
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, truncateSync, utimesSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { DEPLOYS_FILE, ROUND_ACT, ROUND_WALK_ACT, checkSlug, deployConfig, deployDev, deploys, owedAt, readReport, redact, roundCloseRun, walkFindings, walkInternal, walkRound, walkSummary } from '../lib/deploy.mjs';
import { status } from '../lib/status.mjs';
import { flushState, stateBatch, writeState } from '../lib/state.mjs';
import { trancheClose } from '../lib/tranche.mjs';
import { DEFAULTS, git, loadConfig, run } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState, openPassed, closeLayer } from './helpers.mjs';

const quiet = () => {};
const GUARD = 'p3dev guard: passed';
const node = (code) => ['node', '-e', code];
const DEP = {
  slug_prefix: 'p3dev-',
  dry_run: [node(`console.log('checking'); console.log(${JSON.stringify(GUARD)})`), ['node', '-e', `console.log(${JSON.stringify(GUARD)})`, '{slug}']],
  // The secret is made at run time, so it is in no argv: a step marks it, then prints it.
  deploy: node("const v = 's3cr3t' + '-value'; console.log('::add-mask::' + v); console.log('token ' + v + ' set')"),
  walk: [node("console.error('walked; ' + 's3cr3t' + '-value')")],
  guard_line: GUARD,
};
const cfgWith = (deploy) => ({ ...DEFAULTS, deploy });

test('deploy config: the keys validated; each stage an argv or a list of argvs; the prefix begins with p3dev-', () => {
  const d = deployConfig(cfgWith(DEP));
  assert.equal(d.dry_run.length, 2);
  assert.equal(d.deploy.length, 1);
  assert.equal(d.timeout_minutes, 30);
  assert.throws(() => deployConfig(DEFAULTS), /no "deploy" block/);
  assert.throws(() => deployConfig(cfgWith({ ...DEP, publish: true })), /unknown keys: publish/);
  for (const p of ['prod-', 'P3DEV-', undefined, 'p3dev_x']) assert.throws(() => deployConfig(cfgWith({ ...DEP, slug_prefix: p })), /slug_prefix must begin with p3dev-/, String(p));
  assert.throws(() => deployConfig(cfgWith({ ...DEP, walk: 'node w.mjs' })), /deploy.walk must be an argv/);
  assert.throws(() => deployConfig(cfgWith({ ...DEP, deploy: [] })), /deploy.deploy must be an argv/);
  assert.throws(() => deployConfig(cfgWith({ ...DEP, guard_line: '' })), /guard_line/);
  assert.throws(() => deployConfig(cfgWith({ ...DEP, timeout_minutes: 0 })), /whole minutes/);
  assert.equal(checkSlug('p3dev-l2'), 'p3dev-l2');
  for (const s of ['l2', 'prod-p3dev-l2', 'p3dev-L2', 'p3dev-', 'p3dev-a b']) assert.throws(() => checkSlug(s), /slug/, s);
});

test('redact: a line ::add-mask::<v> is never printed, and v is printed as ***', () => {
  const masks = new Set();
  assert.equal(redact('a\n::add-mask::abc\nkey abc here', masks), 'a\nkey *** here');
  assert.equal(redact('later abc', masks), 'later ***');
});

// A product with origin: layer 1 of two, its module complete, the deploy block in its config, and
// the plan `close` (a partial close: the end of the tranche), unless the test gives another config.
const unmet = '- **R1** *(not yet met: x)* text\n';
const PASS = "import test from 'node:test';\ntest('ok', () => {});\n";
const done = (id) => ({ ...entry(id, { requirements: `build/requirements/${id}.md`, status: { state: 'COMPLETE' } }), tests: [`test/${id}/`] });
const product = (deploy = DEP, config = { plan: 'close' }) => ({
  'process/config.json': { deploy, ...config },
  'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n| 2 | next | d |\n',
  'build/requirements/a.md': unmet,
  'build/requirements/d.md': unmet,
  'process/ledger/a.json': done('a'),
  'test/a/x.test.mjs': PASS,
});
function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  return { root, bare };
}
const statusIO = { openPRs: () => [], checkRun: () => null, compare: () => null };
const io = { compare: () => null };
const repo = 'o/p';
const rows = (bare, kind = 'dev-deploy') => git(['show', `process-state:${DEPLOYS_FILE}`], { cwd: bare }).split('\n').map((l) => JSON.parse(l)).filter((r) => r.row === kind);

test('deploy dev at a round close: dry run, deploy, walk, one row; secrets never printed; then refused while that tip is deployed clean', () => {
  const { root, bare } = withOrigin(product());
  assert.equal(closeLayer(root, '1').ok, true);
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  // A slug that is not a development deployment's.
  assert.throws(() => deployDev(root, { io, repo, slug: 'acmewidget', log: quiet }), /does not begin with p3dev-/);
  const out = [];
  const r = deployDev(root, { io, repo, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.equal(r.ok, true, text);
  assert.equal(r.row.slug, 'p3dev-l1', 'the layer that closed');
  assert.equal(r.row.layer, 1);
  assert.equal(r.row.commit, tip);
  assert.deepEqual(r.row.results.map((x) => [x.stage, x.exit]), [['dry_run', 0], ['dry_run', 0], ['deploy', 0], ['walk', 0]]);
  assert.ok(r.row.results.filter((x) => x.stage === 'dry_run').every((x) => x.guard === true));
  assert.match(r.row.results[1].name, /p3dev-l1$/, '{slug} substituted');
  assert.equal(typeof r.row.minutes, 'number');
  assert.doesNotMatch(text, /s3cr3t-value/);
  assert.match(text, /token \*\*\* set/);
  assert.match(text, /walked; \*\*\*/);
  assert.doesNotMatch(JSON.stringify(rows(bare)), /s3cr3t-value/);
  assert.deepEqual(rows(bare), [r.row]);
  assert.equal(r.row.internal_walk, undefined, 'no internal_walk configured: none runs, none recorded');
  assert.throws(() => deployDev(root, { io, repo, log: quiet }), /is deployed and walked clean \(p3dev-l1\); the next round's close makes the next one/);
  // A dirty tree; then a checkout that is not the tranche tip.
  writeFileSync(join(root, 'build/requirements/a.md'), 'changed\n');
  assert.throws(() => deployDev(root, { io, repo, log: quiet }), /uncommitted changes/);
  git(['checkout', '-q', '--', '.'], { cwd: root });
  commit(root, { 'x.txt': 'x\n' });
  assert.throws(() => deployDev(root, { io, repo, log: quiet }), /not the tranche tip/);
});


// Rigg desk entered 8 clarinets on the sheet.

test('deploy dev: a walk that prints 1,600 lines keeps every line in its file; the log has the tail, the cut notice and the path; its reports go to the state branch, counted in the row', () => {
  const walk = node(`const fs = require('fs'); const v = 's3cr3t' + '-value'; console.log('::add-mask::' + v);
    const steps = []; const failures = [];
    for (let i = 1; i <= 1600; i++) { console.log('screen ' + i + ' finding ' + 'x'.repeat(20) + (i === 1 ? ' ' + v : '')); steps.push({ journey: 'j', label: 's' + i, ok: i % 100 !== 0 }); if (i % 100 === 0) failures.push({ kind: i === 100 ? 'http-500' : 'layout', detail: 'at ' + i + (i === 100 ? ' ' + v : '') }); }
    fs.mkdirSync('out/live', { recursive: true });
    fs.writeFileSync('out/live/report.json', JSON.stringify({ arm: 'live', steps, failures }, null, 1));
    fs.writeFileSync('out/live/report.txt', steps.map((x) => (x.ok ? 'ok   ' : 'FAIL ') + x.label).join('\\n') + '\\n');
    fs.writeFileSync('out/live/big.txt', 'z'.repeat(300 * 1024));`);
  const reports = ['out/live/report.json', 'out/live/report.txt', 'out/live/big.txt', 'out/live/none.txt'];
  const { root, bare } = withOrigin({ ...product({ ...DEP, walk, walk_reports: reports }), 'process/config.json': { deploy: { ...DEP, walk, walk_reports: reports }, max_file_bytes: 200 * 1024, plan: 'close' } });
  assert.equal(closeLayer(root, '1').ok, true);
  const logDir = mkdtempSync(join(tmpdir(), 'p3-steps-'));
  const out = [];
  const r = deployDev(root, { io: { ...io, logDir }, repo, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.equal(r.ok, true, text);
  const file = join(logDir, readdirSync(logDir).find((f) => /-walk\.log$/.test(f)));
  const whole = readFileSync(file, 'utf8');
  for (let i = 1; i <= 1600; i++) assert.match(whole, new RegExp(`^screen ${i} finding`, 'm'));
  assert.match(whole, /screen 1 finding x+ \*\*\*/);
  assert.doesNotMatch(whole, /s3cr3t-value/);
  assert.match(text, /screen 1600 finding/);
  assert.doesNotMatch(text, /^screen 1 finding/m);
  const cut = text.match(/\[(\d+) line\(s\) left out before this tail; the whole output is in (\S+)\]/);
  assert.ok(cut, text.slice(0, 2000));
  assert.equal(cut[2], file);
  assert.equal(Number(cut[1]), whole.slice(0, -20000).match(/\n/g).length, 'the whole lines not shown');
  assert.ok(text.includes(`full output: ${file}`));
  // The reports: kept whole on the state branch, the row's counts, masked values as ***.
  const w = rows(bare).at(-1).walk;
  assert.deepEqual({ ...w, reports: undefined }, { steps: 1600, steps_ok: 1584, failures: 16, by_kind: { 'http-500': 1, layout: 15 }, reports: undefined });
  const dir = w.reports[0].stored.replace(/\/report\.json$/, '');
  assert.match(dir, /^deploys\/p3dev-l1\/\d{4}-\d\d-\d\dT[\d-]+Z$/);
  assert.deepEqual(w.reports.map((x) => x.stored), [`${dir}/report.json`, `${dir}/report.txt`, 'not stored, 307200 bytes', 'not written by this walk']);
  assert.equal(git(['show', `process-state:${dir}/report.txt`], { cwd: bare }).split('\n').length, 1600);
  const stored = git(['show', `process-state:${dir}/report.json`], { cwd: bare });
  assert.equal(JSON.parse(stored).steps.length, 1600);
  assert.match(stored, /at 100 \*\*\*/);
  assert.doesNotMatch(stored, /s3cr3t-value/);
  assert.throws(() => git(['show', `process-state:${dir}/big.txt`], { cwd: bare }));
  assert.match(text, /walk: 1600 steps, 1584 ok, 16 failures/);
  assert.throws(() => deployConfig(cfgWith({ ...DEP, walk_reports: ['a/r.txt', 'b/r.txt'] })), /walk_reports/);
  assert.throws(() => deployConfig(cfgWith({ ...DEP, walk_reports: ['../r.txt'] })), /walk_reports/);
});

test('deploy dev: a dry-run step that does not print the guard line stops it before the deploy; the row records it and a later run may go', () => {
  const ran = [];
  const { root, bare } = withOrigin(product({ ...DEP, dry_run: [node(`console.log(${JSON.stringify(GUARD)})`), node("console.log('p3dev guard: passed?')")] }));
  assert.equal(closeLayer(root, '1').ok, true);
  const out = [];
  const exec = (c, a, o) => { ran.push(a.join(' ')); assert.ok(o.unset.includes('GITHUB_TOKEN')); return { code: 0, stdout: a[1].includes('?') ? 'p3dev guard: passed?\n' : `${GUARD}\n`, stderr: '', seconds: 0 }; };
  const r = deployDev(root, { io: { ...io, exec }, repo, log: (m) => out.push(m) });
  assert.equal(r.ok, false);
  assert.equal(r.row.stopped, 'dry_run');
  assert.equal(ran.length, 2, 'neither the deploy nor the walk ran');
  assert.match(out.join('\n'), /refused: the dry run did not pass the guard/);
  assert.equal(rows(bare).length, 1);
  // A failed run is recorded, so the layer is still owed: the next run goes.
  const again = deployDev(root, { io: { ...io, exec: (c, a) => ({ code: 0, stdout: `${GUARD}\n`, stderr: '', seconds: 0 }) }, repo, log: quiet });
  assert.equal(again.ok, true);
  // A failing deploy step stops before the walk.
  const { root: r2 } = withOrigin(product({ ...DEP, deploy: node('process.exit(4)') }));
  assert.equal(closeLayer(r2, '1').ok, true);
  const f = deployDev(r2, { io, repo, log: quiet });
  assert.equal(f.row.stopped, 'deploy');
  assert.deepEqual(f.row.results.map((x) => x.stage), ['dry_run', 'dry_run', 'deploy']);
});

// Bob, 4 Nov: the deploy and walk at a round close only, never between layers; it never holds
// job starts. The live shape: layer 4 closed, layers 5 to 11 open.
const LIVE = (config = {}) => {
  const mods = [4, 5, 6, 7, 8, 9, 10, 11];
  return {
    'process/config.json': { deploy: DEP, completion_file: 'build/round.md', ...config },
    'build/layers.md': `| layer | what | modules |\n|---|---|---|\n${mods.map((n) => `| ${n} | l${n} | m${n} |`).join('\n')}\n`,
    ...Object.fromEntries(mods.map((n) => [`build/requirements/m${n}.md`, unmet])),
    'build/round.md': '# Completion round\n',
    'process/ledger/m4.json': done('m4'),
    'test/m4/x.test.mjs': PASS,
  };
};
const see = (root) => { const out = []; const s = status(root, { role: 'bob', log: (m) => out.push(m), io: statusIO }); return { s, text: out.join('\n') }; };
const push = (root, files) => { commit(root, files); git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root }); };
const opened = (root) => { openPassed(root); git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root }); };
const closeIO = { compare: () => null, status: { ...statusIO, prFiles: () => [] } };

test('deploy dev between layers: layer 4 closed, 5 to 11 open (the first round open): refused, status owes none and lists next work; plan close (the last round): owed beside next work', () => {
  const { root } = withOrigin(LIVE());
  opened(root);
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  push(root, { 'x.txt': 'the tranche past main\n' });
  assert.equal(closeLayer(root, '4').ok, true);
  git(['checkout', '-q', 'origin/tranche'], { cwd: root });
  assert.throws(() => deployDev(root, { io, repo, log: quiet }), /no development deployment now: a round's walk belongs to its close, never between layers \(the first round is open: layers 5, 6, 7, 8, 9, 10, 11 not closed\); it becomes due when the round closes/);
  const before = see(root);
  assert.equal(before.s.deploy, null);
  assert.doesNotMatch(before.text, /round-close run is owed/);
  assert.match(before.text, /build\/requirements\/m5\.md: 1 \(layer 5\)/);
  // A partial close named by the plan: the end of the tranche. Owed, and next work still listed.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['reset', '-q', '--hard', 'origin/tranche'], { cwd: root });
  push(root, { 'process/config.json': { deploy: DEP, completion_file: 'build/round.md', plan: 'close' } });
  const after = see(root);
  assert.match(after.text, /FIRST: the round-close run is owed \(the last round \(plan close\) closed, not yet deployed\): node \.process\/tool\/p3\.mjs deploy dev, from a clean checkout of the tranche tip \(the deploy and its walk\); job starts do not wait for it/);
