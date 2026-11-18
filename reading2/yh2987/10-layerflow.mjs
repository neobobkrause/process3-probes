export function readLayer(root, cfg, n, { io = {}, slug = null } = {}) {
  const ref = layerRef(n);
  if (git(['rev-parse', '-q', '--verify', ref], { cwd: root, allowFail: true }).code !== 0) fail(`no ${layerBranch(n)} on origin: open it first (${P3} layer open ${n})`);
  const layers = layersAt(root, cfg, ref);
  const L = layers.find((x) => x.n === n) || fail(`layer ${n} is not in ${cfg.layers_file} on ${layerBranch(n)}`);
  const rows = flowRows(root, cfg.state_branch, n);
  // The layer's modules and those that joined it from a layer behind (layer join).
  const joins = new Map(rows.joins.map((j) => [j.module, j]));
  const mods = [...L.mods, ...[...joins.keys()].filter((id) => !L.mods.includes(id))];
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  // An entry the layer branch lacks is read from the tranche, the ledger's home (copy, 6 Nov: layer/8
  // was cut before PR 638 added four entries): its job starts from it (job start) and carries it on.
  const home = `refs/remotes/origin/${cfg.tranche}`;
  const entries = new Map(mods.map((id) => [id, entryAt(root, ref, id) || entryAt(root, home, id)]));
  const reqOf = (id) => entries.get(id)?.requirements || `${dir}/${id}.md`;
  const marks = new Map(mods.map((id) => [id, unmetIds(textAt(root, ref, reqOf(id)) ?? textAt(root, home, reqOf(id)) ?? '').filter((x) => !isFound(x))]));
  const list = (io.openPRs || openPRs)(slug, layerBranch(n));
  if (list === null) fail(`GitHub unreadable: the open pull requests into ${layerBranch(n)} are not known`);
  // The tranche's ids too: a module whose entry only the tranche holds has its job PR named by it.
  const ids = new Set([...ledgerIds(root, ref), ...ledgerIds(root, home)]);
  const prs = list.map((p) => ({ number: p.number, draft: !!p.draft, head: p.head?.sha, ref: p.head?.ref, module: branchModule(p.head?.ref, ids) }));
  // A job that blocks commits BLOCKED on its own branch, not on the layer (copy, 6 Nov: corpus-export,
  // BLOCKED on rows owed to layer 11, showed as working and its draft PR held the layer merge): the
  // entry at its open PR's head counts when it reads BLOCKED, and that PR holds the merge no longer.
  const blockedOn = new Map();
  for (const p of prs.filter((x) => x.module && mods.includes(x.module) && x.head)) {
    if (git(['cat-file', '-e', `${p.head}^{commit}`], { cwd: root, allowFail: true }).code !== 0 && p.ref) fetchBranch(root, p.ref, { allowFail: true });
    const e = entryAt(root, p.head, p.module);
    if (e?.status?.state === 'BLOCKED') { entries.set(p.module, e); blockedOn.set(p.module, p.number); }
  }
  // A module deferred by its PR head's BLOCKED whose newest gate run on that head passed its suite has
  // its work done, BLOCKED only on a process finding (copy, 6 Nov: layer 8's 658-661 on the old tool's
  // ledger finding): a merge then would drop finished work (layerMerge refuses; layer status says so).
  // Any run on that head of the module's whole suite that passed (stricter than layerCover, which takes
  // base-red as the land does; this only holds a merge, the safe side): a later
  // row never turns it off; a read that fails is unknown, which holds the merge too (cold review of
  // PR 201).
  const doneWork = new Map();
  const whole = (r, id) => r?.suite === 'pass' && r.trigger === 'code' && Array.isArray(r.scope) && r.scope.includes(id) && !(Array.isArray(r.requirements_only) && r.requirements_only.some((x) => x?.module === id));
  for (const [id, k] of blockedOn) {
    const pr = prs.find((q) => q.number === k);
    let runs = null;
    try { const c = (io.comments || ghComments)(slug, k); runs = Array.isArray(c) ? gateRuns(c).filter((r) => r.sha === pr.head) : null; } catch { runs = null; }
    if (runs === null) doneWork.set(id, { pr: k, unknown: true });
    else if (runs.some((r) => whole(r, id))) doneWork.set(id, { pr: k });
  }
  const anc = (a, b) => isAnc(root, a, b);
  // A completion layer's items, or a round layer's found marks (BD-R1): its modules' reopen words.
  const work = L.completion || L.round;
  let states = moduleStates({ mods, joins, items: itemReopen(work, rows.joins, rows.items), itemIds: itemIdMap(work, rows.joins, rows.items), itemWord: L.round ? 'found mark(s)' : 'completion item(s)', owed: new Set(mods.filter((id) => itemsOwed(rows, id).length)), earlies: new Map(rows.earlies.map((r) => [r.module, r])), entries, marks, prs, lands: rows.lands, reschedules: rows.reschedules, anc })
    .map((x) => (x.state === 'deferred' && blockedOn.has(x.id) ? { ...x, why: `${x.why} (on PR ${blockedOn.get(x.id)}'s head)`, ...(doneWork.has(x.id) ? { done_work: doneWork.get(x.id).pr, ...(doneWork.get(x.id).unknown ? { done_unknown: true } : {}) } : {}) } : x))
    // A retest refused since its newest outstanding reschedule: a job re-tests it.
    .map((x) => (x.outstanding?.length && (rows.retest_refusals || []).some((r) => r.module === x.id && String(r.at) >= String(x.outstanding.map((o) => o.at).sort().at(-1))) ? { ...x, retest_refused: true } : x));
  // R10: the states in the layer's total order, each with the in-layer providers not yet landed.
  const providers = layerProviders(mods, readModules(root, cfg, ref), entries);
  const order = totalOrder(mods, providers);
  const byId = new Map(states.map((x) => [x.id, x]));
  states.splice(0, states.length, ...order.map((id) => ({ ...byId.get(id), after: (providers.get(id) || []).filter((p) => !landedProvider(p, rows.lands, entries, marks)) })));
  // PD-19: a companion is named by its dependent jobs and their why (its reopen words, its brief).
  // PD-19b: no land order between them; they land in the same layer, in any order.
  states.splice(0, states.length, ...states.map((x) => companionState(root, rows, x)));
  // The open PRs that hold the merge: all but those of a module deferred by its PR head's BLOCKED.
  const holding = prs.filter((p) => !(blockedOn.has(p.module) && blockedOn.get(p.module) === p.number));
  // An open item of completion_file the completion layer does not hold (added after its open): its
  // act is the join (PD-14), then its job; listed beside the layer's starts (C35). A module already
  // in the layer joins its new items the same way (PD-14 (i)).
  const joinable = L.completion ? joinableItems(root, cfg, `refs/remotes/origin/${cfg.tranche}`, mods, n, new Set(layerItems(L.completion, rows.joins, rows.items).map((x) => x.id))) : [];
  return { n, ref, mods, layers, rows, entries, prs, holding, states, order, providers, ...(L.completion ? { completion: L.completion } : {}), ...(L.round ? { round: L.round } : {}), ...(joinable.length ? { joinable } : {}) };
}

// Whether a layer is behind us when the flow starts mid-tranche (the copy switches after layer 6,
// closed by the train: cold review 3): closed (layers/closed.jsonl, layer close's or layer merge's
// row), merged by the flow, or with nothing left in it (every module COMPLETE or BLOCKED at the
// tranche tip, no unmet requirement mark), as status's layerState counts an implicit close.
// Only this tranche's close rows, as status's closedRows keeps them: its name, a commit not on main
// (an earlier tranche of the same name closed its layers before it reached main: confirming review N4).
export function closedLayers(root, sb, cfg) {
  fetchBranch(root, 'main', { allowFail: true, within: READ_MS });
  const main = git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0 ? 'refs/remotes/origin/main' : null;
  return new Set((readState(root, sb, CLOSED_FILE) || '').split('\n').filter(Boolean).flatMap((l) => {
    try { const r = JSON.parse(l); return r.row === 'closed' && (!cfg || r.tranche === cfg.tranche) && !(main && r.commit && hasCommit(root, r.commit) && isAnc(root, r.commit, main)) ? [r.layer] : []; } catch { return []; }
  }));
}
// This tranche's merge of the layer: a merged row whose merge has not reached main.
const mergedHere = (root, rows) => !!rows.merged && !staleFlow(root, rows);
// A layer whose flow rows are an earlier tranche's: its merge reached main. The flow's rows and
// branch for a second tranche are not built (the trial is one layer); refused, never reused.
// main fetched at most once a minute per clone (status reads layerPlace per user and per PR row:
// cold review of PR 191).
const mainFetched = new Map();
function staleFlow(root, rows) {
  const c = rows.merged?.commit;
  if (!c || !hasCommit(root, c)) return false;
  if (Date.now() - (mainFetched.get(root) || 0) > 60000) { fetchBranch(root, 'main', { allowFail: true, within: 60e3 }); mainFetched.set(root, Date.now()); }
  return git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0 && isAnc(root, c, 'refs/remotes/origin/main');
}
function layerBehind(root, cfg, L, closed, ref) {
  const rows = flowRows(root, cfg.state_branch, L.n);
  if (closed.has(L.n) || mergedHere(root, rows)) return true;
  // A module joined it (R12): the layer has work, whatever its own modules' states (cold review of PR 191).
  if (rows.joins.length) return false;
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  return L.mods.every((id) => {
    const e = entryAt(root, ref, id);
    if (!e || !['COMPLETE', 'BLOCKED'].includes(e.status?.state)) return false;
    return !unmetIds(textAt(root, ref, e.requirements || `${dir}/${id}.md`) || '').filter((x) => !isFound(x)).length;
  });
}

// The open layer as the flow reads it (one read, shared by status, send's lead to BOB and the
// sweep): { kind: 'open', n, states, prs, startable, ready } (ready: every module complete or
// deferred, no PR open into the layer), { kind: 'next', n } (the next layer, not open),
// { kind: 'stale', n } (its rows an earlier tranche's), { kind: 'done' } (every layer merged) or

// Rule for jobs: the reviewer for jobs has changed. Handover notes now carry the line
// `reviewer: Lucinda Abernathy`, and the name Jacinta Ravensworth is no longer written anywhere in
// a handover note.

// { kind: 'none' } (no layer map: jobs keep the tranche, next work is the flow's).
// The rounds at the tranche (rounds.mjs roundState), read as the flow reads it.
export function nextRound(root, cfg, layers, tr) {
  if (directMode(cfg)) return directRoundsAt(root, cfg);
  return roundState(root, cfg, tr, { layers, flows: (k) => flowRows(root, cfg.state_branch, k), lastWalk: deployRowsOf(root, cfg).at(-1) || null, flawed: flawedModules(root, cfg, tr, { layers }) });
}
export function openLayer(root, cfg, { slug, io = {} } = {}) {
  // PD-25: under the direct flow no layer opens; its view (direct.mjs) has the same shape.
  if (directMode(cfg)) return directView(root, cfg, { slug, io });
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  const layers = layersAt(root, cfg, tr);
  if (!layers.length) return { kind: 'none' };
  const closed = closedLayers(root, cfg.state_branch, cfg);
  for (const layer of layers) {
    const { n } = layer;
    const r = flowRows(root, cfg.state_branch, n);
    // A layer behind us (closed, or with nothing left) is passed over first, stale rows or not,
    // as layer open passes it (third confirming review, minor 1).
    if ((!r.open || staleFlow(root, r)) && layerBehind(root, cfg, layer, closed, tr)) continue;
    if (staleFlow(root, r)) return { kind: 'stale', n };
    if (r.merged) continue;
    if (!r.open) return { kind: 'next', n };
    fetchBranch(root, layerBranch(n), { allowFail: true, within: READ_MS });
    const x = readLayer(root, cfg, n, { io, slug });
    let early = { next: null, list: [], skipped: [] };
    try { early = earlyNext(root, cfg, n, x); } catch (e) { if (!(e instanceof Error)) throw e; early = { next: null, list: [], skipped: [], unread: e.message }; }
    return { kind: 'open', n, ...(layer.round ? { round: layer.round.n, of: layer.round.of } : {}), states: x.states, prs: x.prs, companions: companionLines(x.rows, x.states), startable: startableOf(x), ready: mergeReady(x.states) && !x.holding.length && !x.joinable?.length, early: early.list, early_next: early.next };
  }
  // Every layer merged (BD-R1, rounds.mjs): the round's next layer for its flawed modules, or the
  // next round's first once a walk ended this one; else the round waits on its walk, or is clean.
  // No completion layer opens any more: the copy's layer 12 was the last (Bob, 8 Nov).
  let rs = null;
  try { rs = nextRound(root, cfg, layers, tr); } catch { rs = null; }
