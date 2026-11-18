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
