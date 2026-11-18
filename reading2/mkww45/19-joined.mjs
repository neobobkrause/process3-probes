// ===== file: metrics.mjs (continued) =====

      if (Number.isFinite(c) && r.session && !skipped.has(r.session)) {
        const delta = Math.max(0, c - (lastCost.get(r.session) ?? 0));
        lastCost.set(r.session, c);
        if (open.length) for (const m of open) parts.get(m)[who] += delta / open.length;
        else unattributed += delta;
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

// ===== file: checks.mjs (later part) =====

  return {
    refresh: { files, result: differ.length ? 'differs' : failed ? 'generated failed' : 'identical', differ, ...(untracked.length ? { untracked } : {}) },
    findings: differ.map((f) => F(f, exists(root, 'HEAD', f)
      ? `${f} is not what its regenerate writes from this commit: a plain pull request may change a generated file only to its regenerated bytes`
      // Untracked but not ignored at this commit (copy PR 557, 5 Nov: the removal was refused
      // and the finding did not say the ignore line was what it lacked).
      : `${f} is removed, but no .gitignore at this commit ignores it: to stop committing a generated file, add /${f} to the root .gitignore in the same pull request; otherwise a refresh changes a generated file only to its regenerated bytes`)),
  };
}

// A failed command's output (run 41883960626: its last five lines, joined, were node --test's
// summary and held none of the failure). The finding: its first failure line, else its last five
// lines. The log: of stdout and of stderr each, every failure line and the last 40 lines.
const FAILED = /^\s*(FAIL\b|not ok\b|!|✖|[A-Za-z]*Error\b)/;
const lines = (t) => String(t || '').trimEnd().split('\n');
const tail = (r) => [...lines(r.stdout), ...lines(r.stderr)].find((l) => FAILED.test(l))?.trim() || (r.stdout + r.stderr).trim().split('\n').slice(-5).join(' ');
const lastLines = (r) => ['stdout', 'stderr'].filter((k) => String(r[k] || '').trim()).map((k) => {
  const all = lines(r[k]);
  return `${k}, failure lines and last 40 lines:\n${all.filter((l, i) => i >= all.length - 40 || FAILED.test(l)).join('\n')}`;
}).join('\n');

// GAT-4: every row's regenerate command from the root, then the verify command of each row whose
// paths then differ from the commit (an install's prepare may have written them already). Product code: without the GitHub tokens, within one suite timeout in all.
// skip: rows this run already built (buildGenerated), regenerated once, not twice (review of PR 80),
// unless a row before it in config order was regenerated here: one ordered pass, so a built row
// reading an earlier row's output is built again from it (copy, 4 Nov: bundles built from the
// tracked program.mjs, then program.mjs regenerated, read STALE BUNDLE).
// A committed row's file the regenerate changed is stale at the commit, a finding naming the file and
// the command (coordinator, 6 Nov: modules.json gained 7 rows, member-roster's order.mjs was never
// regenerated, and the gate went green on the regenerated bytes, leaving 9 failures on the tranche).
// stale: the gate's, for a pull request that is not a job's (a job may not commit a generated file,
// JOB-8: a stale file after its change is recorded on its row, owed by a plain refresh after it
// lands; cold review). judged: files another check already names (a plain pull request's
// refreshed files, which refreshCheck judges). Built rows (paths the commit does not track) are
// compared with nothing; layer checks name a stale file through layer merge's own refusal.
// A built row (a path not committed at HEAD: gitignored, built by the gate, deploy and release) is
// verified whatever git status says, since git never shows it changed (PD-9, C31, the coordinator,
// 8 Nov: copy layer merge 11 failed on words-reads' verify, a fault screens-action T53 brought in on
// 7 Nov; every job gate since ran it as built, changed false, verify null). The one helper the gate
// and layer merge share; base-red's tree (verifyBuilt false) judges only staleness there.
// unbuilt: rows a build before this one tried and failed (buildGenerated's failed), skipped here: no
// verify on a file never written, the build's own finding stands (cold review of C31). The verifies
// have a budget of their own, so slow regenerates never leave them seconds (cold review of C31).
export function regenerate(root, rows, { timeout, exec = run, skip = new Set(), unbuilt = new Set(), stale = false, judged = [], verifyBuilt = true, log = () => {} }) {
  const end = Date.now() + timeout;
  const left = () => Math.max(1000, end - Date.now());
  const opts = () => ({ cwd: root, timeout: left(), unset: NO_TOKENS });
  const status = (r) => git(['status', '--porcelain', '-z', '--untracked-files=all', '--', ...r.paths.map(normPath)], { cwd: root });
  const findings = [];
  const ran = [];
  let earlier = false;
  for (const r of rows) {
    if (skip.has(r) && !earlier) continue;
