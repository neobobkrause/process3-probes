// ===== file: metrics.mjs (continued) =====

      } else {
        // A row with no cost: its window's jobs are unmeasured, and so are the next priced row's,
        // whose cost spans both windows; that cost is counted unattributed.
        for (const m of open) parts.get(m).gap.add(who);
        if (r.session && !Number.isFinite(c)) skipped.add(r.session);
        else if (r.session) { unattributed += Math.max(0, c - (lastCost.get(r.session) ?? 0)); lastCost.set(r.session, c); skipped.delete(r.session); }
      }
      prevAt = r.at;
    }
    for (const m of since(prevAt, null)) parts.get(m).gap.add(who);
  }
  const has = (who) => measured.some((r) => inT(r) && role(r) === who && r.session && Number.isFinite(Number(r.cost_usd)));
  const sum = (rs) => (rs.length && rs.every((r) => Number.isFinite(Number(r.cost_usd))) ? rs.reduce((s, r) => s + Number(r.cost_usd), 0) : 'unmeasured');
  const jobs = mods.map((m) => {
    const own = measured.filter((r) => r.module === m && inT(r));
    // An unmeasured job row stands only while its attempt has no priced one (a merge run again with
    // the cost the first run lacked: review of PR 106).
    // A job row of 0 is a delta not read (get_session's usage not moved: queue's attempt 2 on the
    // copy, 4 Nov), as costDelta now records it: unmeasured, never 0.
    const jobOwn = own.filter((r) => role(r) === 'job').map((r) => (r.cost_usd !== undefined && r.cost_usd !== null && Number(r.cost_usd) === 0 ? { ...r, cost_usd: 'unmeasured' } : r));
    const pricedAt = new Set(jobOwn.filter((r) => Number.isFinite(Number(r.cost_usd))).map((r) => r.attempt));
    const job = sum(jobOwn.filter((r) => Number.isFinite(Number(r.cost_usd)) || !pricedAt.has(r.attempt)));
    // Reviews: the module's rows of any role but job, BOB and ROOT (their cost is split below).
    const reviews = sum(own.filter((r) => role(r) !== 'job' && !PROCESS.has(role(r))));
    const part = (who) => (has(who) && !parts.get(m).gap.has(who) ? usd(parts.get(m)[who]) : 'unmeasured');
    const p = { reviews_usd: reviews, bob_usd: part('bob'), root_usd: part('root'), gate_usd: 'unmeasured' };
    // The overhead sums the measured parts; with none measured it is unmeasured, never 0.
    const priced = Object.values(p).filter((v) => typeof v === 'number');
    const over = priced.length ? usd(priced.reduce((s, v) => s + v, 0)) : 'unmeasured';
    const unmeasured = Object.keys(p).filter((k) => p[k] === 'unmeasured').map((k) => k.replace(/_usd$/, ''));
    return { module: m, layer: layers.get(m) ?? null, job_usd: typeof job === 'number' ? usd(job) : job, ...p, overhead_usd: over, share: typeof job === 'number' && typeof over === 'number' && job + over > 0 ? usd(over / (job + over)) : 'unmeasured', unmeasured };
  });
  const byLayer = new Map();
  for (const j of jobs.filter((x) => x.layer !== null)) byLayer.set(j.layer, [...(byLayer.get(j.layer) || []), j]);
  const layerRows = [...byLayer].sort((a, b) => a[0] - b[0]).map(([layer, js]) => {
    const ok = js.every((j) => typeof j.share === 'number');
    const priced = js.filter((j) => typeof j.overhead_usd === 'number');
    const over = priced.reduce((s, j) => s + j.overhead_usd, 0);
    const total = ok ? js.reduce((s, j) => s + j.job_usd, 0) + over : 0;
    return { layer, jobs: js.map((j) => j.module), overhead_usd: priced.length ? usd(over) : 'unmeasured', share: ok && total > 0 ? usd(over / total) : 'unmeasured', unmeasured: [...new Set(js.flatMap((j) => (typeof j.share === 'number' ? j.unmeasured : [`${j.module} job`])))] };
  });
  return { rule: SHARE_RULE + SCOPE_RULE, scope: opened ? { opened } : 'every row (the opening not read)', jobs, layers: layerRows, unattributed_usd: has('bob') || has('root') ? usd(unattributed) : 'unmeasured' };
}

// The two health metrics and the figures that explain them, from rows and pull requests.
// sweepRows: the state branch's sweep rows; layers: the layer map's text (layers_file).
// Rows and history are read at the same ref (branch), as report tranche reads them (rowsAt).
export function report(root, slug, branch, { read = { comments, getPR }, sweepRows = [], layers = null, refreshAt = 60, cfg = DEFAULTS, lead = {}, roles = new Map() } = {}) {
  const rows = rowsAt(root, branch);
  const opened = openedAt(lead.grants, cfg);
  const completes = rows.filter((r) => r.row === 'attempt' && r.event === 'complete');
  const merges = [...new Map(rows.filter((r) => r.row === 'merge').map((r) => [String(r.pr), r])).values()]; // each PR once (copy, 4 Nov: PR 60's merge recorded twice)
  const measured = rows.filter((r) => r.row === 'attempt' && r.event === 'measured');
  let refutedN = 0;
  let gateMinutes = 0;
  const gates = [];
  for (const c of completes) {
    if (!c.pr) continue;
    let all = [];
    try { all = read.comments(slug, c.pr) || []; } catch { all = []; }
    const runs = gateRuns(all);
    gates.push({ pr: c.pr, runs: runs.length });
    gateMinutes += runs.reduce((s, r) => s + (r.minutes || 0), 0);
    if (refuted(runs, c.attempt)) refutedN++;
  }
  const cost = measured.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);
  const tokens = measured.some((r) => typeof r.tokens === 'number') ? measured.reduce((s, r) => s + (Number(r.tokens) || 0), 0) : 'unmeasured';
  const surv = merges.map((m) => {
    let pr = null;
    try { pr = read.getPR(slug, m.pr); } catch { pr = null; }
    const merged = pr?.merged_at ? { merge_sha: pr.merge_commit_sha, merged_at: pr.merged_at } : null;
    return { module: m.module, pr: m.pr, ...survival(root, merged, branch) };
  });
  const surviving = surv.filter((s) => s.state === 'survived').length;
  return {
    complete_claims: completes.length,
    refuted: refutedN,
    false_done_rate: completes.length ? refutedN / completes.length : null,
    cost_usd: cost,
    tokens,
    surviving_prs: surviving,
    cost_per_surviving_pr: surviving ? cost / surviving : `pending: ${surv.map((s) => `PR ${s.pr} ${s.state}${s.due ? ` (read on ${s.due})` : ''}`).join(', ') || 'no merges'}`,
    gate_minutes: Math.round(gateMinutes * 100) / 100,
    gates,
    denials: measured.reduce((s, r) => s + (Number(r.denials) || 0), 0),
    refusals: refusalList(rows, new Map([...sessionRoles(rows), ...roles])),
    refusals_by_session: refusalCounts(rows),
    declines: measured.flatMap((r) => r.declines || []),
    bob_idle_by_day: idleByDay(sweepRows),
    flow: flowFigures({ sweeps: sweepRows, rows, unmetAt: unmetAtRef(root, cfg, branch), gates: (pr) => gateRuns(read.comments(slug, pr) || []), syncs: countCommits(root, branch, opened, now(), '^Bring job/'), reverts: countCommits(root, branch, opened, now(), '^Revert'), quick: quickBlocks(root, lead.jobRefs, { from: opened }), from: opened }),
    root_context: rootContext(sweepRows, refreshAt),
    wakes: wakes(rows),
    overhead: overhead(rows, layerOf(layers), { opened, jobRows: lead.jobRows || [] }),
    lead_times: leadTimes(root, cfg, { ref: branch, rows, layers: layerOf(layers), sweeps: sweepRows, ...lead, comments: (pr) => gateRuns(read.comments(slug, pr) || []) }),
  };
}

// ===== file: layerbase.mjs =====

// The shared layer branch and the job's base (design note "Shared Layer Branch", Bob, 5 Nov; the
// only flow since the merge train was removed, Bob, 6 Nov). A job of the open layer's module works
// on a branch cut from layer/<n>, publishes onto it, and the layer merges into the tranche once.
// process/config.json "merge_strategy" is "layer" (or absent), or "direct" (PD-25, Bob, 9 Nov: every
// job based on the tranche, its rows under layerflow/direct-<tranche>/; direct.mjs).
// This file has no imports from job.mjs, so job.mjs can read it.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exists, fail, fetchBranch, git } from './util.mjs';
import { fetchState, readState } from './state.mjs';

export const STRATEGIES = ['layer', 'direct'];
export const layerMode = (cfg) => (cfg?.merge_strategy ?? 'layer') === 'layer';
// PD-25: the direct flow. Every job's base is the tranche; its flow rows (start, run, test, land,
// reschedule, gate, retest) sit under one key per tranche, layerflow/direct-<tranche>/, so the layer
// flow's row readers and writers serve it unchanged.
export const directMode = (cfg) => cfg?.merge_strategy === 'direct';
export const directKey = (tranche) => `direct-${String(tranche).replace(/[^A-Za-z0-9._-]+/g, '-')}`;
// The branch a flow job publishes onto: its layer's, or under the direct flow the tranche itself.
export const flowBase = (cfg) => (cfg.layer?.direct ? cfg.layer.tranche : cfg.tranche);
export const LAYER_BRANCH = /^layer\/(\d+)$/;
export const layerBranch = (n) => `layer/${n}`;
export const layerOfBranch = (b) => { const m = String(b || '').match(LAYER_BRANCH); return m ? Number(m[1]) : null; };
// The branch layer sync <n> opens its pull request from (layerflow.mjs layerSync): layer-sync/<n>-<the
// tranche tip's first 10 hex>, with -<k> for a later attempt. The layer it syncs, or null.
export const SYNC_BRANCH = /^layer-sync\/(\d+)-[0-9a-f]{10}(?:-\d+)?$/;
export const syncOfBranch = (b) => { const m = String(b || '').match(SYNC_BRANCH); return m ? Number(m[1]) : null; };
// The branch layer pin <n> opens its pull request from (PD-23, layerflow.mjs layerPin): layer-pin/<n>-<the
// new pin's first 10 hex>, -<k> for a later attempt; one commit on the layer moving only the pin files.
export const PIN_BRANCH = /^layer-pin\/(\d+)-[0-9a-f]{10}(?:-\d+)?$/;
export const pinOfBranch = (b) => { const m = String(b || '').match(PIN_BRANCH); return m ? Number(m[1]) : null; };
// The state branch's files of the layer flow: one file per event, added and never edited, so two
// writers never conflict (as notices/).
export const FLOW_DIR = 'layerflow';
export const flowFile = (n, kind, name) => (name === undefined ? `${FLOW_DIR}/${n}/${kind}.json` : `${FLOW_DIR}/${n}/${kind}/${name}.json`);
export const safeName = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, '-');

// The layer map (layers_file): [{ n, mods }], the same table status.mjs layerState reads.
export function layerMap(text) {
  if (text === null || text === undefined) return [];
  return String(text).split('\n').map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
    .filter((c) => c.length > 1 && /^\d+$/.test(c[0]))
    .map((c) => ({ n: Number(c[0]), mods: c.at(-1).replace(/[`*]/g, '').split(',').map((m) => m.trim()).filter(Boolean) }))
    .sort((a, b) => a.n - b.n);
}
export function layersAt(root, cfg, ref) {
  let text = null;
  if (ref) text = exists(root, ref, cfg.layers_file) ? git(['show', `${ref}:${cfg.layers_file}`], { cwd: root }) : null;
  else if (existsSync(join(root, cfg.layers_file))) text = readFileSync(join(root, cfg.layers_file), 'utf8');
  const map = layerMap(text);
  return map.length ? [...map, ...completionLayers(root, cfg, map)] : map;
}
// The layers past the map, each read from its open row, so the product's layer map is never edited:
// - a completion layer (PLN-4 as it stood; PD-12; C33), its modules completion_file's open items'
//   (completion: { file, items, mods }). Layer 12 on the copy is the last: BD-R1 (Bob, 8 Nov)
//   retires the path once it merges, and no new one opens (layerflow.mjs roundLayer);
// - a round layer (BD-R1, rounds.mjs): a later round's pass over one map layer, its modules the
//   flawed ones there (round: { n, of, items, mods, walk }).
// Each takes the next number, so its branch layer/<n> and its rows layerflow/<n>/ are its own.
export function completionLayers(root, cfg, map) {
  const out = [];
  if (!cfg?.state_branch) return out;
  for (let k = (map.at(-1)?.n ?? 0) + 1; ; k++) {
    let row = null;
    try { row = JSON.parse(readState(root, cfg.state_branch, flowFile(k, 'open')) || 'null'); } catch { row = null; }
    const comp = Array.isArray(row?.completion?.mods);
