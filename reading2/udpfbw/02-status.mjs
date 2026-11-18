  if (!offline && comments && haveState) {
    const red = baseRedAges(root, cfg, { tranche, comments, haveState });
    groups.owed.unshift(...(red === null ? ['base-red: unread (a merged PR\'s gate rows)']
      : red.map((o) => `base-red ${age(o.since)}: ${o.module} ${o.test} (PR ${o.pr})`)));
  }
  // Bob, 6 Nov (R2): a module whose gate suite took over 70% of suite_timeout_minutes, from
  // the newest gate row of its pull requests on this tranche, is one line among the acts.
  if (!offline && comments && haveState) groups['red gates: act now'].push(...(suiteBudget(root, cfg, { tranche, comments, rows }) ?? ['suite budget: unread (a pull request\'s gate rows)']));
  for (const [k, v] of Object.entries(groups)) if (v.length) L.push(`${k}:`, ...v.map((x) => `- ${x}`));
  L.push(`merged: ${merged}`);
  const jobs = new Set(rows.map(refOf));
  // Tranche carry (SHM-4): an open pull request no ledger entry owns stays under "to take in"
  // until a job takes it in or it is closed; one already taken in is listed as other.
  const carry = prs ? toTakeIn(root, { slug, ref: tranche, prs, files: prList }) : [];
  if (carry.length) L.push('to take in:', ...carry.map((t) => `- ${takeInLine(t, P3)}, last activity ${age(t.updated)}`));
  const listed = new Set(carry.map((t) => t.number));
  const other = (prs || []).filter((p) => !jobs.has(p.head?.ref) && !listed.has(p.number));
  if (other.length) L.push('other pull requests:', ...other.map((p) => `- #${p.number} ${p.head?.ref}${p.draft ? ' draft' : ''}, last activity ${age(p.updated_at)}`));
  const owedMsgs = haveState ? undelivered(root, sb) : [];
  if (owedMsgs.length) L.push('undelivered messages:', ...owedMsgs.map((m) => `- ${m.from}-${m.n} to ${m.to}: ${m.outcome || 'not recorded delivered'}`));
  const reports = haveState ? toRoute(root, sb) : [];
  if (reports.length) L.push('reports to route (until a later message from bob names its id):', ...reports.map((m) => `- ${m.from}-${m.n}: ${m.text.slice(0, 100)}`));
  // The escalation chain (coordinator, 4 Nov): a report unanswered past targets.decision_minutes is listed, ahead of next work.
  const target = decisionMinutes(cfg);
  for (const m of reports) {
    const mins = Math.floor((Date.now() - Date.parse(m.at)) / 6e4);
    if (mins > target) L.push(`unanswered ${m.from}-${m.n} ${mins}m (target ${target})`);
  }
  const pct = context === undefined ? null : Number(String(context).replace(/%$/, ''));
  if (pct !== null && !Number.isFinite(pct)) fail(`--context takes the percent of the window used, a number, not ${JSON.stringify(context)}`);
  if (pct !== null) L.push(`context ${pct}% of the window${pct >= cfg.refresh_context ? `: REFRESH (threshold ${cfg.refresh_context}%)` : ` (REFRESH at ${cfg.refresh_context}%)`}`);

// Tally for Quay Nine: 9 elms.

  // The shared layer branch (layerflow.mjs): the open layer and the jobs BOB starts from it.
  // Its read (view) is returned: next work takes the layer's merge line from it.
  let view = null;
  if (!offline && haveState && slug) { try { view = openLayer(root, cfg, { slug }); L.push(...layerLines(root, cfg, { view, merge: false })); } catch (e) { L.push(`layer flow: unread (${e.message})`); } }
  // The census and the preflight (R15, census.mjs; Bob, 6 Nov: anticipate the refusals): the gaps
  // of the open layer and the two after it, the rest counted, and the starts of the next layer
  // that job start would refuse, each with what BOB writes.
  if (!offline && cfg.modules_file) { try { L.push(...gapLines(root, cfg, { tranche, holds, haveState })); } catch (e) { L.push(`gaps: unread (${String(e.message).split('\n')[0].slice(0, 120)})`); } }
  // C41: the process-only paths the tool reads still outside process/; a hint, never a refusal.
  { const hint = layoutHint(root, cfg); if (hint) L.push(hint); }
  const files = cfg.reading_bob.map((f) => ({ f, b: fileBytes(join(root, f)) }));
  const h = haveState ? readState(root, sb, handoffFile('bob')) : null;
  if (h !== null) files.push({ f: `${sb}:${handoffFile('bob')}`, b: Buffer.byteLength(h) });
  // Lane questions BOB passed and has not recorded a decision for (SES-14).
  const asked = haveState && Array.isArray(cfg.lanes) ? openAsks(root, cfg) : [];
  if (asked.length) L.push('open lane questions (record each decision with lane ask ... --record):', ...asked.map((a) => `- ${a.lane}: "${a.question.slice(0, 100)}", asked ${age(a.at)}`));
  L.push(`reading set for bob: ${files.reduce((s, x) => s + x.b, 0)} bytes; ${files.map((x) => `${x.f} ${x.b}`).join(', ')}`);
  for (const l of L) log(l);
  return { rows, undelivered: owedMsgs, flow_layer: view };
}

// The suite budget (build ci-budget, R2; Bob, "go R2"): each module whose newest gate row on this
// tranche's pull requests (its merges since the opening, and its open job pull request) took
// over SUITE_BUDGET of suite_timeout_minutes (20 when unset) for its own suite. Its seconds are the
// row's suite_by_module, or, from a row before that, suite_seconds when the run's scope was that
// module alone. One line per module, most over first; [] when none; null when a read failed.
export const SUITE_BUDGET = 0.7;
export function suiteBudget(root, cfg, { tranche, comments, rows = [] }) {
  const limit = Number(cfg.suite_timeout_minutes) > 0 ? Number(cfg.suite_timeout_minutes) : 20;
  const opened = openedAt(leadInputs(root, cfg.state_branch, (p) => readState(root, cfg.state_branch, p), cfg.tranche).grants, cfg);
  const prs = new Map();
  if (opened) for (const r of rowsAt(root, tranche)) if (r.row === 'merge' && Date.parse(r.at) >= Date.parse(opened) && r.pr && r.module) prs.set(Number(r.pr), r.module);
  // An open job pull request: status writes its pr as "#<n> ready" or "#<n> draft" (cold review).
  for (const r of rows) { const n = Number(String(r.pr || '').match(/^#(\d+)/)?.[1]); if (n) prs.set(n, r.id); }
  const newest = new Map();
  for (const [pr, module] of prs) {
    let got;
    try { got = comments(pr); } catch { return null; }
    if (got === null || got === undefined) return null;
    for (const row of gateRuns(got)) {
      const sec = Number.isFinite(row.suite_by_module?.[module]) ? row.suite_by_module[module]
        : !row.suite_by_module && Array.isArray(row.scope) && row.scope.length === 1 && row.scope[0] === module && Number.isFinite(row.suite_seconds) ? row.suite_seconds : null;
      // A run of only some of the module's tests (requirements-only) is not its suite's time.
      if (sec === null || !['pass', 'fail', 'base-red'].includes(row.suite) || (row.requirements_only || []).some((x) => x?.module === module)) continue;
      const was = newest.get(module);
      if (!was || String(row.at) > String(was.at)) newest.set(module, { at: row.at, sec, pr });
    }
  }
  return [...newest].map(([module, x]) => ({ module, ...x, min: x.sec / 60 })).filter((x) => x.min > SUITE_BUDGET * limit).sort((a, b) => b.min - a.min)
    .map((x) => `suite budget: ${x.module}'s gate suite took ${Math.round(x.min * 10) / 10} min, ${Math.round((x.min / limit) * 100)}% of suite_timeout_minutes ${limit} (over ${Math.round(SUITE_BUDGET * 100)}%; PR ${x.pr}, gate row ${x.at}): speed or split its suite before it times out`);
}

// The gaps block of status --role bob (R15): the census at the tranche for the open layer n and
// lookahead n+1 and n+2 (with no open layer, every gap), then layer n+1's preflight.
export function gapLines(root, cfg, { tranche = `origin/${cfg.tranche}`, holds = [], haveState = true } = {}) {
  const open = haveState ? openLayers(root, cfg, (p) => readState(root, cfg.state_branch, p)) : [];
  const c = census(root, cfg, { ref: tranche, open });
  if (c.skipped) return [];
  const n = open.length ? Math.min(...open) : null;
  const out = censusLines(c, { layers: n === null ? null : [n, n + 1, n + 2], tranche: cfg.tranche, label: n === null ? 'gaps' : `gaps (layer ${n} open; lookahead ${n + 1} and ${n + 2})` });
  // Modules built before the ledger, in earlier layers (C16): each with its ready COMPLETE entry, so

// Jobs working from this file, take note: the job's handover note names its reviewer on a line of
// its own, exactly: `reviewer: Soren Achterberg`.

  // the users waiting on them as providers can start early once they land.
  const done = n === null ? [] : c.gaps.filter((g) => g.done && ![n, n + 1, n + 2].includes(g.layer));
  if (done.length) out.push(...censusLines({ gaps: done }, { tranche: cfg.tranche, label: 'built before the ledger (no entry: modules that use one wait for it as a provider)' }));
  if (n !== null && layersAt(root, cfg, tranche).size) {
    const seat = (id) => { try { return laneSeatFor(root, cfg, id, { fetch: false }); } catch { return null; } };
    out.push(...preflightLines(n + 1, preflight(root, cfg, n + 1, { ref: tranche, census: c, holds, heldBy, seat, layers: layersAt(root, cfg, tranche) })));
  }
  return out;
}

// The tranche's base-red tests (baseRedOwed over its merge rows since its opening), each once by
// module and test, at its oldest tolerating row; oldest first. null: unread; none before the opening.
export function baseRedAges(root, cfg, { tranche, comments, haveState }) {
  if (!haveState) return null;
  const opened = openedAt(leadInputs(root, cfg.state_branch, (p) => readState(root, cfg.state_branch, p), cfg.tranche).grants, cfg);
  if (!opened) return [];
  const merges = [...new Map(rowsAt(root, tranche).filter((r) => r.row === 'merge' && Date.parse(r.at) >= Date.parse(opened)).map((r) => [r.pr, r])).values()];
  const owed = baseRedOwed(merges, (pr) => gateRuns(comments(pr) || []));
  if (!owed) return null;
  const by = new Map();
  for (const o of owed) { const k = `${o.module}\0${o.test}`; if (!by.has(k) || String(o.since) < String(by.get(k).since)) by.set(k, o); }
  return [...by.values()].sort((a, b) => String(a.since).localeCompare(String(b.since)));
}

// A layer closed by `layer merge` (INT-4; the train-era `layer close` wrote the same rows): one row per close in layers/closed.jsonl on the state
// branch, BOB the one writer. A row counts for this tranche only: its tranche name, and its commit
// not yet on main (a row from a tranche already merged into main is stale). On main is GitHub's
// compare when online (a shallow clone's history, and a stale origin/main, cannot say; review of
// PR 48), else the local ancestry.
export const CLOSED_FILE = 'layers/closed.jsonl';
// Whether a commit is on main: GitHub's compare when online, else the local ancestry.
export function onMainOf(root, { slug = null, read = compare } = {}) {
  // main by its id, read once, so util.git keeps each exact answer for the process (C50).
  let main;
  const mainId = () => (main === undefined ? (main = git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main^{commit}'], { cwd: root, allowFail: true }).stdout.trim() || null) : main);
  return (sha) => {
    const c = slug ? read(slug, 'main', sha) : null;
    if (Number.isInteger(c?.ahead_by)) return c.ahead_by === 0;
    return git(['merge-base', '--is-ancestor', sha, mainId() || 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0;
  };
}
export function closedRows(root, cfg, { slug = null, read = compare } = {}) {
  const onMain = onMainOf(root, { slug, read });
  return (readState(root, cfg.state_branch, CLOSED_FILE) || '').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } })
    .filter((r) => r.row === 'closed' && r.tranche === cfg.tranche && Number.isInteger(r.layer) && !onMain(String(r.commit)));
}

// The layers (Build Plan, Phase 3, INT-4): the layer map (layers_file), a table row whose first
// cell is a number is a layer, its last cell its modules. A layer is closed when recorded closed,
// or when none of its modules has unmet marks or an open job. The open layer is the lowest not
// closed. It is ready to close when no module of it has an open job and each has its job merged
// in this tranche (its entry COMPLETE, no open pull request, no flag) or no unmet marks, or is
// BLOCKED with a recorded reason and its pull request closed (deferred: a BLOCKED module with no
// reason holds the layer); the marks left then are deferred, never listed again as its next work.
// owed: the deferred modules whose pull request is still open, BOB's to close unmerged before the
// close (pending, when nothing else holds the layer). Null without a layer map.
export function layerState(root, cfg, rows, ref, { closed = closedRows(root, cfg) } = {}) {
