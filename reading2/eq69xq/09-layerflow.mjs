  // A new round waits on its walk's findings, each recorded and none without a module, as layer
  // open refuses before them: status names that wait, never an open that refuses (cold review of C39).
  if (rs?.state === 'new' || rs?.state === 'clean') {
    const hold = walkHold(findingsOf(root, cfg, tr, deployRowsOf(root, cfg).at(-1) || null, { round: true }));
    const loose = unplaced(root, tr);
    if (hold || loose.length) return { kind: 'done', round: rs.state === 'new' ? rs.round : rs.round + 1, rounds: 'held', ...(hold ? { findings: true } : {}), why: hold || `${loose.map((f) => f.id).join(', ')} in the found file of no module: BOB names its module` };
  }
  if (rs?.next) return { kind: 'next', n: rs.next.n, round: rs.next.round, of: rs.next.of, mods: rs.next.mods, ...(rs.state === 'new' ? { walk: rs.walk } : {}) };
  if (rs) return { kind: 'done', round: rs.round, rounds: rs.state };
  return { kind: 'done' };
}
// ---- early starts into the next layer (R14) ----------------------------------------------

// Bob, 6 Nov ~18:55: "Why didn't the early starts launch before layer 8 closed?" While layer n is
// open, a module of the next layer to open whose providers have all landed or are COMPLETE (none
// in layer n still working, rescheduled or deferred) can start early, on idle capacity only, after
// layer n's own starts (Bob, 15:36), each logged and its rework counted.
// The mechanism: layer/<next> is cut ahead from layer/<n>'s tip by the first early start (and moved
// forward to that tip by each later one, a fast-forward: nothing lands on it before its open). The
// job's branch and draft pull request are on it, as any job of that layer's, so job sync, job test
// and the gate need nothing new; its publish waits for layer open <next>, which brings the branch
// up to the tranche tip (a fast-forward: layer n's merge holds every tip it was cut from). One
// layer stays open at a time; nothing lands out of order. Join rows (R12) were not used: they move
// a module into another layer, and an early start stays in its own.
// A layer branch cut ahead for early starts and not open: no open row for n, and an earlier layer
// open and not merged (whether or not its early row was written: cold review of R14).
// The users (of a land in layer n) that started early into a later layer not yet open: user -> that layer.
export function earlyUsers(root, sb, n, users, home) {
  const out = new Map();
  for (const u of users) {
    const k = home(u);
    if (k === null || k <= n) continue;
    const r = flowRows(root, sb, k);
    if (!r.open && !r.merged && r.earlies.some((e) => e.module === u)) out.set(u, k);
  }
  return out;
}
// Layer n cut ahead and not open: early rows and neither an open nor a merged row, from layer n-1's
// merge to n's open too (cold review of R14: the guards stopped at n-1's merge, and a plain start
// then took the cut-ahead tip). Returns the layer it was cut from (the newest early row's), else null.
export function cutAhead(root, sb, n) {
  const r = flowRows(root, sb, n);
  if (r.open || r.merged || !r.earlies.length) return null;
  return r.earlies.at(-1).from ?? n - 1;
}
const notOpen = (n, k) => `layer ${n} is not open: ${layerBranch(n)} was cut ahead from layer ${k} for early starts (${P3} layer jobs ${k} lists them while layer ${k} is open); it opens with ${P3} layer open ${n} once layer ${k} has merged`;
export const earlyHead = (n, next) => `early starts into layer ${next}, on idle capacity only, after layer ${n}'s own (Bob, 6 Nov; each logged, its rework counted): each provider landed or COMPLETE; cut from ${layerBranch(n)}'s tip, published once layer ${next} opens:`;
export function earlyNext(root, cfg, n, L) {
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  const ref = layerRef(n);
  const layers = layersAt(root, cfg, ref);
  const closed = closedLayers(root, cfg.state_branch, cfg);
  const nx = layers.find((x) => x.n > n && !closed.has(x.n) && !flowRows(root, cfg.state_branch, x.n).merged && !layerBehind(root, cfg, x, closed, tr));
  if (!nx) return { next: null, list: [], skipped: [] };
  const rows = flowRows(root, cfg.state_branch, nx.n);
  if (rows.open) return { next: nx.n, list: [], skipped: [] };
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  const entryOf = (id) => entryAt(root, ref, id) || entryAt(root, tr, id);
  const marksOf = (id, e) => { const f = e?.requirements || `${dir}/${id}.md`; return unmetIds(textAt(root, ref, f) ?? textAt(root, tr, f) ?? '').filter((x) => !isFound(x)); };
  const modules = readModules(root, cfg, ref);
  const named = new Map((modules || []).filter((m) => m?.id).map((m) => [m.id, m.uses || []]));
  const here = new Map(L.states.map((x) => [x.id, x]));
  // Started: a start row in the next layer, or an early row whose job branch reached origin (a start
  // that failed before its push is listed again: cold review of R14).
  const onOrigin = (id) => git(['ls-remote', '--heads', 'origin', `refs/heads/job/${id}`, `refs/heads/job/${id}-*`], { cwd: root, allowFail: true }).stdout.trim() !== '';
  const started = new Set([...rows.starts.map((r) => r.module), ...rows.earlies.map((r) => r.module).filter(onOrigin)]);
  // Work joined into the next layer (R12) is pending: its users wait for it; joined modules
  // themselves start from that layer's list once it opens, never early.
  const joined = new Set(rows.joins.map((j) => j.module));
  // A provider is settled when it is complete in layer n (landed, no reschedule outstanding), or,
  // outside layer n, COMPLETE with no unmet mark; a provider with a breaking change owed is
  // rescheduled in layer n, so never settled.
  const unsettled = (p) => {
    const st = here.get(p);
    if (st) return st.state === 'complete' ? null : `${p} is ${st.state} in layer ${n}`;
    if (joined.has(p)) return `${p} joined layer ${nx.n}: its work is pending`;
    const e = entryOf(p);
    // No entry at all (C16, the copy 7 Nov: 49 modules built before the ledger): named with its act.
    if (!e) return `${p} has no ledger entry (${entryFile(p)}): it is settled once BOB lands one (the census in \`${P3} status --role bob\` lists the module and its fix)`;
    if (e.status?.state !== 'COMPLETE') return `${p} is ${e.status?.state}`;
    return marksOf(p, e).length ? `${p} has unmet marks` : null;
  };
  const entries = new Map(nx.mods.map((id) => [id, entryOf(id)]));
  const list = [];
  const skipped = [];
  for (const id of totalOrder(nx.mods, layerProviders(nx.mods, modules, entries))) {
    const e = entries.get(id);
    if (started.has(id) || joined.has(id)) continue;
    if (!e) { skipped.push({ id, why: 'no ledger entry' }); continue; }
    if (e.status?.state === 'BLOCKED') { skipped.push({ id, why: 'BLOCKED' }); continue; }
    const m = marksOf(id, e);
    if (e.status?.state === 'COMPLETE' && !m.length) continue;
    const uses = [...new Set(named.get(id) || e.uses || [])].filter((u) => u !== id);
    const why = uses.map(unsettled).filter(Boolean);
    if (why.length) { skipped.push({ id, why: why.join('; ') }); continue; }
    list.push({ id, providers: uses, cmd: `${P3} job start ${id} --sessions <file> --early${e.status?.state === 'COMPLETE' ? ` --reopen ${JSON.stringify(`meet the unmet requirement marks ${m.join(', ')}`)}` : ''}` });
  }
  return { next: nx.n, list, skipped };
}
// job start <id> --early: the module listed early by the open layer's read, layer/<next> cut ahead
// (or moved forward to layer/<n>'s tip), and an early row (layerflow/<next>/early/) recorded.
export function earlyCut(root, cfg, id, { io = {}, by = 'bob', log = console.log } = {}) {
  needLayerMode(cfg, 'job start --early');
  fetchBranch(root, cfg.tranche, { allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
  const v = openLayer(root, cfg, { slug: io.slug || repoSlug(root), io });
  if (v.kind !== 'open') fail(`--early starts a job of the layer after the open one, and no layer is open${v.kind === 'next' ? ` (layer ${v.n} is next: ${P3} layer open ${v.n})` : ''}; nothing was started`);
  fetchBranch(root, layerBranch(v.n));
  const e = earlyNext(root, cfg, v.n, readLayer(root, cfg, v.n, { io, slug: io.slug || repoSlug(root) }));
  const x = e.list.find((q) => q.id === id);
  const startedEarly = e.next !== null && flowRows(root, cfg.state_branch, e.next).earlies.some((q) => q.module === id);
  if (!x) fail(`${id} cannot start early${e.next !== null ? ` into layer ${e.next}` : ' (no layer follows the open one)'}: ${startedEarly ? `it started early already; an early start that did not finish resumes with ${P3} job start ${id} once layer ${e.next} opens` : e.skipped.find((q) => q.id === id)?.why || 'it is not listed (started already, nothing to do, or not in the next layer)'}; ${P3} layer jobs ${v.n} lists the early starts; nothing was started`);
  const t = e.next;
  const b = layerBranch(t);
  const from = rev(root, layerRef(v.n));
  fetchBranch(root, b, { allowFail: true });
  const have = git(['rev-parse', '-q', '--verify', layerRef(t)], { cwd: root, allowFail: true }).code === 0;
  if (have && !isAnc(root, rev(root, layerRef(t)), from)) fail(`${b} is on origin and ${layerBranch(v.n)} does not hold it (something was pushed or merged into it before its open): ask the coordinator; nothing was started`);
  if (!have || rev(root, layerRef(t)) !== from) {
    const p = git(['push', '-q', 'origin', `${from}:refs/heads/${b}`], { cwd: root, allowFail: true });
    if (p.code !== 0) fail(`the push of ${b} failed (${p.stderr.trim()}); nothing was started`);
    fetchBranch(root, b);
    log(`${b} ${have ? 'moved forward' : 'cut ahead'} to ${layerBranch(v.n)} ${short(from)} for early starts (layer ${t} is not open)`);
  }
  writeRows(root, cfg.state_branch, `layer ${t}: ${id} starts early (layer ${v.n} open)`, [[flowFile(t, 'early', `${safeName(id)}-${Date.now()}`), { row: 'early', layer: t, module: id, from: v.n, base: from, providers: x.providers, at: now(), by }]]);
  fetchState(root, cfg.state_branch, { fresh: true });
  return { layer: t, from: v.n, base: from };
}
// Each early start's rework (R7 retest, R8 reschedule, or a provider notice after it started),
// and the rate, from the layer's rows and the notices.
export function earlyRework(rows, notices = []) {
  const last = new Map(rows.earlies.map((r) => [r.module, r]));
  const live = notices.filter((k) => !k.withdrawn);
  const each = [...last.values()].map((r) => {
    // Rework after the early start, cleared reschedules included (a cleared one was still rework).
    const resched = (rows.reschedules_all || rows.reschedules).some((x) => x.user === r.module && String(x.at) > String(r.at));
    const retest = rows.retests.some((x) => x.module === r.module && String(x.at) > String(r.at));
    const noticed = live.some((k) => (k.users || []).includes(r.module) && String(k.at) > String(r.at));
    return { module: r.module, from: r.from, at: r.at, rework: resched ? 'reschedule' : retest ? 'retest' : noticed ? 'notice' : null };
  });
  const rw = each.filter((x) => x.rework).length;
  return { early: each.length, rework: rw, rate: each.length ? Math.round((rw / each.length) * 1000) / 10 : null, each };
}

// openLayer after fetching the tranche and the state branch (the sweep, the idle check).
// fetch false: the refs this clone has.
export function readOpenLayer(root, cfg, { slug = null, io = {}, fetch = true } = {}) {
  // A read: the clone's copies within READ_MS serve (C18); every act re-reads what it acts on.
  if (fetch) {
    fetchBranch(root, cfg.tranche, { allowFail: true, within: READ_MS });
    fetchState(root, cfg.state_branch);
  }
  return openLayer(root, cfg, { slug: slug || io.slug || repoSlug(root), io });
}
const STATE_ORDER = ['complete', 'deferred', 'published', 'working', 'rescheduled', 'not started'];
export const stateCounts = (states) => STATE_ORDER.map((k) => `${k} ${states.filter((s) => s.state === k).length}`).join(', ');
// The open layer's merge line, only when it holds (every module complete or deferred, no PR open
// into the layer); else null. status prints it in next work.
export const layerMergeLine = (v) => (v?.kind === 'open' && v.ready ? `layer ${v.n}: ${stateCounts(v.states)}; merge when every module is complete or deferred (${P3} layer merge ${v.n})` : null);
