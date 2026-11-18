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
// BOB's act to start work: the open layer's jobs, its merge, or the next layer's open.
// The act owed: start the listed jobs, merge the layer, or open the next; unread, status says.
export const layerStartAct = (v) => (v?.direct ? directAct(v) : v?.kind === 'open' && v.startable.length ? `${P3} layer jobs ${v.n}, then each job start it lists`
  : v?.kind === 'open' && v.ready ? `${P3} layer merge ${v.n}`
    : v?.kind === 'open' && v.early?.length ? `${P3} layer jobs ${v.n}, then each early start it lists (layer ${v.early_next})`
    : v?.kind === 'next' && v.round ? `${P3} round next --apply (opens layer ${v.n}, round ${v.round}, and prints its job starts)`
    : v?.kind === 'next' ? `${P3} layer open ${v.n}`
    : v?.kind === 'done' && v.rounds === 'held' && v.findings ? `${P3} round next, then ${P3} round next --apply (records the walk's findings, opens round ${v.round})`
      : `${P3} status --role bob (the layer flow's next act)`);

// The lines status --role bob prints in the layer flow: the open layer's modules by state and the
// jobs BOB starts (Bob, 5 Nov: BOB starts jobs; no other session creates one), or the layer to open.
// view: openLayer's read, when the caller has it.
// merge false: the merge line is next work's (status prints it there, once).
export function layerLines(root, cfg, { slug, io = {}, view, merge = true } = {}) {
  const v = view || openLayer(root, cfg, { slug, io });
  if (v.direct) return directLines(v, cfg);
  const { n } = v;
  if (v.kind === 'stale') return [`layer flow: layer ${n}'s flow rows are an earlier tranche's (merged to main): a second tranche under the flow is not built; ask the coordinator`];
  if (v.kind === 'next') return [`layer flow: ${v.round ? `${roundLayerName(v.round, v.of, n)} (${v.walk ? `from the walk ${v.walk}; ` : ''}${v.mods.join(', ')})` : `layer ${n}${v.completion ? ` (the completion round, ${cfg.completion_file})` : ''}`} is next and not open: \`${P3} layer open ${n}\`${v.round ? `, or \`${P3} round next --apply\`, which opens it and prints its \`job start\` commands (C46)` : ''}`];
  if (v.kind === 'none') return [`layer flow: no layer map (${cfg.layers_file}): jobs start on the tranche from next work`];
  if (v.kind === 'done' && v.rounds === 'held') return [`layer flow: round ${v.round} opens from the walk's findings once each is recorded: ${v.why}`, ...(v.findings ? [`the one next act: \`${P3} round next\` (a dry run), then \`${P3} round next --apply\`: each finding recorded, the round's first layer opened, its \`job start\` commands printed (C46)`] : [])];
  if (v.kind === 'done') return [v.rounds === 'walk' ? `layer flow: every layer of round ${v.round} has merged; its walk ends it (the round-close run, BD-R1)` : v.rounds === 'clean' ? `layer flow: every layer has merged; the walk ended round ${v.round}, and no module is flawed; once that walk's findings are recorded and none is a flaw, the release path follows it (BD-R1)` : 'layer flow: every layer has merged'];
  const L = [`layer flow: ${v.round ? roundLayerName(v.round, v.of, n) : `layer ${n}`} open on ${layerBranch(n)}; ${stateCounts(v.states)}`];
  for (const s of v.states.filter((q) => q.state === 'rescheduled')) L.push(`- ${s.id} rescheduled: ${s.why}`);
  for (const c of v.companions || []) L.push(`- ${c}`);
  if (v.startable.length) L.push(`jobs to start (yours to start, BOB; the job cap counts), from \`${P3} layer jobs ${n}\`:`, ...v.startable.map((q) => `- ${q.cmd}${q.after ? afterNote(q.after) : ''}`));
  if (v.early?.length) L.push(earlyHead(n, v.early_next), ...v.early.map((q) => `- ${q.cmd}`));
  if (v.ready && merge) L.push(`${v.round ? roundLayerName(v.round, v.of, n) : `layer ${n}`} can merge: \`${P3} layer merge ${n}\``);
  return L;
}

// ---- companions (PD-19) ---------------------------------------------------------------------

// The coordinator's decision PD-19 (9 Nov): a module whose change a job in the open layer needs (a
// registry or assembly module) joins that open layer as the job's companion. It lands in the same
// layer as the job, in any order (PD-19b: the layer's merge gate checks the layer whole). Each pairing is a companion row on the state branch
// (layerflow/<n>/companion/<module>-<job>.json); the companion's first pairing also writes its join
// row, so it is a member of the layer as any joined module is (its job's base, its merge hold).
export const companionsOf = (rows, job) => (rows.companions || []).filter((c) => c.job === job);
export const dependentsOf = (rows, mod) => (rows.companions || []).filter((c) => c.module === mod);
export const companionWords = (deps) => `companion of ${[...new Set(deps.map((c) => c.job))].join(', ')} (PD-19): ${deps.map((c) => (deps.length > 1 ? `${c.job} needs ${c.why}` : c.why)).join('; ')}`;
function companionState(root, rows, x) {
  const deps = dependentsOf(rows, x.id);
  let y = x;
  if (deps.length) {
    const words = companionWords(deps);
    y = { ...y, companion: { jobs: [...new Set(deps.map((c) => c.job))], why: words }, ...(y.join ? { join: { ...y.join, why: words } } : {}), ...(y.state === 'not started' && !y.item ? { why: `joined as ${words}` } : {}) };
  }
  return y;
}
// The lines layer status, layer jobs (round next) and status print for a layer's companions.
export const companionLines = (rows, states) => [...new Set((rows.companions || []).map((c) => c.module))].map((m) => {
  const deps = dependentsOf(rows, m);
  const s = states.find((q) => q.id === m);
  const jobs = [...new Set(deps.map((c) => c.job))].join(', ');
  return `companion: ${m} (${s ? s.state : 'unread'}) joined for ${deps.map((c) => `${c.job} (${c.why})`).join(', ')} (PD-19); it and ${jobs} land in the same layer`;
});

// layer join <companion> --companion-of <job> --layer <n> --why "<what it needs>" (PD-19).
// Refused when: layer n is not open; the job is not a module of layer n (its own or joined), or is a
// companion itself; the companion is the job; it is a member of layer n already (other than as a
// companion not yet started); its own map layer is after n; it has an open job anywhere (an open
// pull request from its job branch, an unfinished start, or a start or land in layer n); or it is
// held, BLOCKED or deferred there.
export function layerCompanion(root, id, { layer, job, why, by = 'bob', io = {}, log = console.log } = {}) {
  const cfg = loadConfig(root);
  needLayerMode(cfg, 'layer join --companion-of');
  const usage = `layer join <companion> --companion-of <job> --layer <n> --why "<what the job needs of it>"`;
  if (typeof job !== 'string' || !job.trim()) fail(usage);
  if (layer === undefined || layer === null || layer === true) fail(`${usage}: name the open layer`);
  if (typeof why !== 'string' || !why.trim()) fail(usage);
  const n = layerNum(layer);
  if (id === job) fail(`${id} cannot be its own companion; nothing recorded`);
  const slug = io.slug || repoSlug(root);
  fetchBranch(root, cfg.tranche, { allowFail: true });
  fetchBranch(root, layerBranch(n), { allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  const rows = flowRows(root, cfg.state_branch, n);
  const closed = closedLayers(root, cfg.state_branch, cfg);
  const ref = layerRef(n);
  const cut = git(['rev-parse', '-q', '--verify', ref], { cwd: root, allowFail: true }).code === 0;
  if (!rows.open || rows.merged || closed.has(n) || !cut || staleFlow(root, rows)) fail(`layer ${n} is not open${rows.merged ? ` (it merged into ${cfg.tranche})` : closed.has(n) ? ' (it is closed)' : ''}: a companion joins only the open layer of the job that needs it (PD-19); nothing recorded`);
  const ids = new Set([...ledgerIds(root, tr), ...ledgerIds(root, ref)]);
  if (!ids.has(id)) fail(`${id} has no ledger entry on ${cfg.tranche}; nothing recorded`);
  const L = layersAt(root, cfg, ref).find((x) => x.n === n) || fail(`layer ${n} is not in ${cfg.layers_file} on ${layerBranch(n)}; nothing recorded`);
  const joined = new Set(rows.joins.map((j) => j.module));
  const members = new Set([...L.mods, ...joined]);
  if (!members.has(job)) fail(`${job} is not a job of layer ${n} (its modules: ${[...members].join(', ')}): a companion joins only the layer of the job that needs it (PD-19); nothing recorded`);
  if (dependentsOf(rows, job).length) fail(`${job} is a companion in layer ${n} itself: a companion's companion is not built; ask the coordinator; nothing recorded`);
  if (companionsOf(rows, id).length) fail(`${id} has its own companion(s) in layer ${n}: it cannot be one; ask the coordinator; nothing recorded`);
  // The job must still have work to land here: not landed in the layer, not complete, not deferred
  // (cold review of C51: a join for a landed or BLOCKED job let any module into the layer).
  const st = readLayer(root, cfg, n, { io: { openPRs: io.openPRs || openPRs, comments: io.comments || ghComments }, slug }).states.find((x) => x.id === job);
  const jobBlocked = [entryAt(root, ref, job), entryAt(root, tr, job)].some((e) => e?.status?.state === 'BLOCKED');
  if (!st || DONE.includes(st.state) || jobBlocked || (rows.lands.some((l) => l.module === job) && st.state !== 'rescheduled')) fail(`${job} has no work left to land in layer ${n} (${jobBlocked ? 'deferred: BLOCKED' : st ? `${st.state}: ${st.why}` : 'unread'}): a companion joins only for a job with work left to land (PD-19); nothing recorded`);
  const had = rows.companions.find((c) => c.module === id && c.job === job);
  if (had) { log(`${id} is ${job}'s companion in layer ${n} already (${had.why}); nothing recorded`); return { ok: true, layer: n, recorded: false, companion: true }; }
  const asCompanion = dependentsOf(rows, id).length > 0;
  if (members.has(id) && !asCompanion) fail(`${id} is a module of layer ${n} already (${L.mods.includes(id) ? 'its own' : 'joined'}): it lands there as any member; nothing recorded`);
  const layers = layersAt(root, cfg, ref);
  const own = layerOf(layers, id);
  if (own !== null && own > n) fail(`${id}'s own layer ${own} is after layer ${n}: its work is planned there; ask the coordinator; nothing recorded`);
  // Held, BLOCKED or deferred there.
  // BLOCKED on the layer branch or on the tranche, the ledger's home (either defers it).
  const entry = [entryAt(root, ref, id), entryAt(root, tr, id)].find((e) => e?.status?.state === 'BLOCKED');
  if (entry) fail(`${id} is BLOCKED (${entry.status.reason || 'no reason'}): a deferred module joins no layer as a companion; nothing recorded`);
  const holds = readHolds(root, cfg.state_branch, { offline: true, facts: null });
  const h = holds.find((x) => x.live && ((x.kind === 'module' && x.value === id) || (x.kind === 'layer' && Number(x.value) === n)));
  if (h) fail(`${id} is held (${h.id} ${h.scope}: ${h.why}); nothing recorded`);
  // An open job anywhere: started or landed in this layer, an open pull request from its job branch,
  // or an unfinished start (its branch's entry WORKING or BLOCKED and not in the tranche or the layer).
  if (rows.starts.some((s) => s.module === id) || rows.lands.some((l) => l.module === id)) fail(`${id}'s job ${rows.lands.some((l) => l.module === id) ? 'landed' : 'started'} in layer ${n} already: ${job}'s need is not in its brief; ask the coordinator; nothing recorded`);
  const heads = (io.originJobs || originJobs)(root);
  if (heads === null) fail(`origin's job branches could not be read: whether ${id} has an open job is not known; nothing recorded`);
  for (const b of [...heads].filter((x) => branchModule(x, ids) === id)) {
    const prs = (io.prsFromBranch || prsFromBranch)(slug, b);
    if (prs === null) fail(`GitHub unreadable: the pull requests from ${b} are not known; nothing recorded`);
    const op = prs.find((p) => p.state === 'open');
    if (op) fail(`${id} has an open job: pull request #${op.number} from ${b} into ${op.base?.ref}; it finishes first; nothing recorded`);
    fetchBranch(root, b, { allowFail: true });
    const tip = git(['rev-parse', '-q', '--verify', `refs/remotes/origin/${b}`], { cwd: root, allowFail: true }).stdout.trim();
    const st = tip ? entryAt(root, tip, id)?.status?.state : null;
    if (tip && (st === 'WORKING' || st === 'BLOCKED') && !isAnc(root, tip, tr) && !isAnc(root, tip, ref)) fail(`${id} has an open job: ${b} is ${st} and not landed; it finishes first; nothing recorded`);
  }
  const at = now();
  const files = [[flowFile(n, 'companion', `${safeName(id)}-${safeName(job)}`), { row: 'companion', layer: n, module: id, job, why: why.trim(), at, by }]];
  if (!joined.has(id)) files.push([flowFile(n, 'join', safeName(id)), { row: 'join', layer: n, module: id, from: own, why: why.trim(), companion_of: job, at, by }]);
  writeRows(root, cfg.state_branch, `layer join: ${id} joins layer ${n} as ${job}'s companion (PD-19)`, files);
  log(`${id} joins layer ${n} as ${job}'s companion (PD-19): ${why.trim()}; it starts from ${P3} layer jobs ${n}, and it lands in the same layer as ${job}`);
  return { ok: true, layer: n, recorded: true, companion: true };
}

// ---- layer join ----------------------------------------------------------------------------

// Where a module stands against the flow, read offline (the state branch and the tranche as
// fetched): own (its layer in the map, or null), cur (the open layer, else the next to open), and
// target (the layer it joins: the next after the open one, else the next to open). behind: its
// own layer is behind cur, or it has none. null when the product has no layer map.
// The coordinator's ruling (6 Nov): work on a module outside the open layer (a notice-affected user
// in a merged layer, a found-mark reopen of a COMPLETE module whose layer merged) joins the NEXT
// layer to open, in order, never the tranche directly.
export function layerPlace(root, cfg, id) {
  const trRef = `refs/remotes/origin/${cfg.tranche}`;
  const tr = git(['rev-parse', '-q', '--verify', trRef], { cwd: root, allowFail: true }).code === 0 ? trRef : null;
  const layers = layersAt(root, cfg, tr);
  if (!layers.length) return null;
  const own = layerOf(layers, id);
  const closed = closedLayers(root, cfg.state_branch, cfg);
  let open = null;
  let next = null;
  // As openLayer reads the flow: a layer behind us (closed, merged, or with nothing left) is passed.
  for (const L of layers) {
    const r = flowRows(root, cfg.state_branch, L.n);
    if (r.open && !r.merged) { open = L.n; break; }
    if (r.merged || closed.has(L.n) || (tr && layerBehind(root, cfg, L, closed, tr))) continue;
    next = L.n;
    break;
  }
  const cur = open ?? next;
  // Joined already (a join row on a layer not merged, from the open one on): it starts there, and
  // is not behind (cold review of PR 191: status kept printing the join, then pointed past it).
  const joined = layers.find((L) => L.n !== own && (cur === null || L.n >= cur) && (() => { const r = flowRows(root, cfg.state_branch, L.n); return !r.merged && r.joins.some((j) => j.module === id); })())?.n ?? null;
  // PD-14 (coordinator, 8 Nov; C35): while a completion layer is open, a module with an open item
  // in completion_file that is not one of its modules joins THAT layer, never one after it.
  const openL = open !== null ? layers.find((L) => L.n === open) : null;
  // PD-14 (i): a module already in the open completion layer (its own, or joined) whose open items
  // the layer does not hold yet (added after its open, or after its join) joins them the same way.
  const more = () => {
    const r = flowRows(root, cfg.state_branch, open);
    const known = new Set(layerItems(openL.completion, r.joins, r.items).map((x) => x.id));
    return completionJoinItems(root, cfg, tr, id).filter((x) => !known.has(x.id));
  };
  if (joined !== null) {
    const m = joined === open && openL?.completion ? more() : [];
    return { own, open, cur, target: joined, behind: false, joined, ...(m.length ? { more: m } : {}) };
  }
  // One of the open completion layer's own modules is in the open layer, not behind it.
  if (openL?.completion && openL.mods.includes(id)) { const m = more(); return { own: open, open, cur, target: open, behind: false, joined: null, ...(m.length ? { more: m } : {}) }; }
  const items = openL?.completion && !openL.mods.includes(id) ? completionJoinItems(root, cfg, tr, id) : [];
  if (items.length) return { own, open, cur, target: open, behind: true, joined: null, completion: items };
  const target = open !== null ? (layers.find((L) => L.n > open && !closed.has(L.n) && !flowRows(root, cfg.state_branch, L.n).merged)?.n ?? null) : next;
  const behind = own === null || (cur !== null && own < cur) || (cur === null);
  return { own, open, cur, target, behind, joined: null };
}
// A module's open, non-whole items in completion_file on the tranche, as a completion layer holds them.
export function completionJoinItems(root, cfg, tr, id) {
  let c = null;
  try { c = completionItems(root, cfg, tr); } catch { c = null; }
  return openItems(c).filter((x) => !x.whole && !x.malformed && x.target === id).map((x) => ({ id: x.id, module: id, what: x.what }));
}
export const joinAct = (id, why, t) => `${P3} layer join ${id} --why ${JSON.stringify(why)} (it joins layer ${t}, and starts from ${P3} layer jobs ${t} once that layer is open)`;

// layer join <id> --why "<why>": the module, its layer behind the open one, joins the next layer
// to open: one row on the state branch (layerflow/<n>/join/<id>.json); layer open lists it in that
// layer's jobs, its job's base is that layer's branch, and the layer merges only once it lands.
export function layerJoin(root, id, { why, by = 'bob', log = console.log, companionOf, layer, io = {} } = {}) {
  if (companionOf !== undefined) return layerCompanion(root, id, { layer, job: companionOf === true ? '' : String(companionOf), why, by, io, log });
  if (layer !== undefined) fail('layer join --layer goes with --companion-of <job> (PD-19); a plain join takes the next layer to open');
  const cfg = loadConfig(root);
  needLayerMode(cfg, 'layer join');
  if (typeof why !== 'string' || !why.trim()) fail('layer join <id> --why "<the work it joins for>"');
  fetchBranch(root, cfg.tranche, { allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  if (!ledgerIds(root, tr).has(id)) fail(`${id} has no ledger entry on ${cfg.tranche}`);
  const at = layerPlace(root, cfg, id) || fail(`no layer map (${cfg.layers_file}): jobs start on the tranche; there is no layer to join`);
  // PD-14 (i): new items for a module already in the open completion layer: one item row, its
  // reopen words and ticks; its job runs again if it started before the row.
  if (at.more?.length) {
    const t = at.open;
    const ids = at.more.map((x) => x.id);
    writeRows(root, cfg.state_branch, `layer join: ${id} joins ${ids.join(', ')} into layer ${t} (the completion round)`, [[flowFile(t, 'items', `${safeName(id)}-${Date.now()}`), { row: 'items', layer: t, module: id, items: at.more, why: why.trim(), at: now(), by }]]);
    log(`${id} joins ${ids.join(', ')} into layer ${t}, where it is already: ${why.trim()}; it starts (again, if its job started before) from ${P3} layer jobs ${t}`);
    return { ok: true, layer: t, recorded: true, items: ids };
  }
  if (at.joined !== null) { log(`${id} joined layer ${at.joined} already; it starts from ${P3} layer jobs ${at.joined}${at.joined === at.open ? '' : ` once layer ${at.joined} opens (${P3} layer open ${at.joined})`}; nothing recorded`); return { ok: true, layer: at.joined, recorded: false }; }
  if (!at.behind) fail(`${id} is in layer ${at.own}, ${at.own === at.open ? 'the open layer' : 'not yet open'}: it starts from ${P3} layer jobs ${at.own}; nothing recorded`);
  if (at.target === null) fail(at.open === null ? `every layer in ${cfg.layers_file} has merged or closed: ${id} has no layer to join; ask the coordinator` : `no layer follows layer ${at.open} in ${cfg.layers_file}: ${id} has no next layer to join; ask the coordinator`);
  const t = at.target;
  const f = flowFile(t, 'join', safeName(id));
  const had = flowRows(root, cfg.state_branch, t).joins.find((j) => j.module === id);
  // Into an open completion layer (PD-14): its items go in the row, its reopen words and its ticks.
  if (!had) writeRows(root, cfg.state_branch, `layer join: ${id} joins layer ${t}${at.completion ? ' (the completion round)' : ''}`, [[f, { row: 'join', layer: t, module: id, from: at.own, why: why.trim(), at: now(), by, ...(at.completion ? { items: at.completion } : {}) }]]);
  log(`${id} ${had ? 'joined' : 'joins'} layer ${t}${had ? ` already (${had.why})` : `: ${why.trim()}`}${at.completion ? ` with ${at.completion.map((x) => x.id).join(', ')}` : ''}; it starts from ${P3} layer jobs ${t}${t === at.open ? '' : ` once layer ${t} opens (${P3} layer open ${t})`}`);
  return { ok: true, layer: t, recorded: !had };
}

// ---- layer open -----------------------------------------------------------------------------

// A completion layer (PLN-4; PD-12; C33) was opened past the map from completion_file's open items;
// BD-R1 retires the path (roundLayer opens a round's layers instead). One already open, the copy's
// layer 12, keeps its items, joins and ticks below until it merges.
// A completion layer's reopen words per module: its items, each with its id.
export const itemReopen = (completion, joins = [], more = []) => {
  const all = layerItems(completion, joins, more);
  return new Map([...new Set(all.map((x) => x.module))].map((id) => [id, all.filter((x) => x.module === id).map((x) => `${x.id}: ${x.what}`).join('; ')]));
};
// A completion layer's item ids per module, in the order itemReopen words them.
export const itemIdMap = (completion, joins = [], more = []) => {
  const all = layerItems(completion, joins, more);
  return new Map([...new Set(all.map((x) => x.module))].map((id) => [id, all.filter((x) => x.module === id).map((x) => x.id)]));
};
// A completion layer's items: those of its open row, those its joined modules brought (PD-14), and
// those added later for a module already in it (item rows, PD-14 (i)).
export const layerItems = (completion, joins = [], more = []) => (completion ? [...(completion.items || []), ...[...joins, ...more].flatMap((j) => (Array.isArray(j.items) ? j.items : []))] : []);
// PD-14 (i): an item row is owed until its module lands after it from a job not started before it:
// a land whose job started before the row did not do the item's work (the job never had its words),
// so the module runs again and the item is not ticked off that land. A land's job is its module's
// newest start row before the land, a restart row not counted (the same job, its old task: cold
// review of (i)); with none (job start writes it best-effort) the land counts.
// One owed row puts the module back to not started.
export const itemsOwed = (rows, id) => {
  // Times compared parsed (rows are second-resolution, now()): a start in the same second as the row
  // is not after it (the safe side: one more run); a land in the same second as its start follows it.
  const t = (x) => Date.parse(x?.at) || 0;
  const starts = (rows.starts || []).filter((s) => s.module === id && !s.restart);
  const did = (l, r) => { const s = starts.filter((x) => t(x) <= t(l)).at(-1); return !s || t(s) > t(r); };
  return (rows.items || []).filter((r) => r.module === id && !(rows.lands || []).some((l) => l.module === id && t(l) > t(r) && did(l, r)));
};

// A round's layer (BD-R1, rounds.mjs): layer n, one past every layer the map and those past it
// hold, is the round's next: the next map layer, after the round's last, that holds a flawed module
// (one with an unmet found mark), skipping those with none; or, once a walk ended the round, the
// next round's first. Its modules are the flawed ones there, each reopened with its found marks.
// A new round opens only once the walk's findings are recorded, and none is left without a module.
export function roundLayer(root, cfg, layers, n, tr, log = () => {}) {
  const last = layers.at(-1)?.n ?? 0;
  if (n !== last + 1) fail(`layer ${n} is not in ${cfg.layers_file} on ${cfg.tranche}${last ? `; the next past it is ${last + 1}` : ''}`);
  // Every layer before it closed first, as layer open checks them: a round's layer follows them all.
  const closed = closedLayers(root, cfg.state_branch, cfg);
  for (const L of layers) {
    const r = flowRows(root, cfg.state_branch, L.n);
    if (r.open && !r.merged) fail(`layer ${L.n} is open on ${layerBranch(L.n)} and has not merged; layer ${n} opens after it (${P3} layer merge ${L.n})`);
    if (!r.merged && !layerBehind(root, cfg, L, closed, tr)) fail(`layer ${L.n} is not closed: close it first (${P3} layer open ${L.n}, then layer merge ${L.n})`);
  }
  const rs = nextRound(root, cfg, layers, tr);
  if (rs.state === 'layer') fail(`${roundLine(rs)}: layer ${n} opens after it (${P3} layer merge ${rs.layer.n})`);
  if (rs.state === 'walk') fail(`layer ${n} is not in ${cfg.layers_file} on ${cfg.tranche}, and ${roundLine(rs)}: no round layer opens before that walk (BD-R1); nothing was opened`);
  // A walk with findings not yet recorded is not clean, though no module is flawed yet (C44): the
  // next round waits on them.
  if (rs.state === 'new' || rs.state === 'clean') {
    const hold = walkHold(findingsOf(root, cfg, tr, deployRowsOf(root, cfg).at(-1) || null, { round: true }));
    if (hold) fail(`round ${rs.state === 'new' ? rs.round : rs.round + 1} opens from its walk's findings once each is recorded: ${hold}; nothing was opened`);
  }
  if (rs.state === 'clean') fail(`layer ${n} is not in ${cfg.layers_file} on ${cfg.tranche}, and ${roundLine(rs)}: no round to open (BD-R1); nothing was opened`);
  if (rs.state === 'new') {
    const loose = unplaced(root, tr);
    if (loose.length) fail(`round ${rs.round} cannot place ${loose.map((f) => f.id).join(', ')} in the found file of no module: BOB names its module (\`${P3} found <module> "<finding>" --from "<source>"\`), then the round opens; nothing was opened`);
  }
  const x = rs.next;
  // PD-24: one layer for the round's flawed modules, whatever their plan layers; all start at once.
  log(`${roundLayerName(x.round, x.of, n, cfg.tranche)} is round ${x.round}'s one layer over every flawed module (PD-24)${rs.state === 'new' ? ` (round ${x.round} opens from the walk ${rs.walk})` : ''}: ${x.mods.length} flawed module(s) (${x.mods.map((id) => `${id} ${x.items.filter((i) => i.module === id).map((i) => i.id).join(', ')}`).join('; ')}); every job starts at once up to the cap, listed in dependency order`);
  return { n, mods: x.mods, round: { n: x.round, of: x.of, mods: x.mods, items: x.items, ...(x.walk ? { walk: x.walk } : {}) } };
}
export function layerOpen(root, n, { io = {}, log = console.log, by = 'bob' } = {}) {
  n = layerNum(n);
  const cfg = loadConfig(root);
  needLayerMode(cfg, 'layer open');
  const slug = io.slug || repoSlug(root);
  fetchBranch(root, cfg.tranche);
  fetchState(root, cfg.state_branch, { fresh: true });
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  const layers = layersAt(root, cfg, tr);
  // Past the map: a round's layer (BD-R1), its modules the flawed ones of its map layer, else
  // refused. A completion layer is opened no more (layer 12 on the copy was the last: Bob, 8 Nov).
  const comp = layers.some((L) => L.n === n) ? null : roundLayer(root, cfg, layers, n, tr, log);
  if (comp) layers.push(comp);
  // One layer at a time: every earlier layer closed, merged, or with nothing left in it; this one
  // not closed already; and no job of its modules still open into the tranche (the train's).
  const closed = closedLayers(root, cfg.state_branch, cfg);
  if (closed.has(n)) fail(`layer ${n} is closed already (${CLOSED_FILE}); open the next one`);
  for (const L of layers.filter((x) => x.n < n)) {
    const r = flowRows(root, cfg.state_branch, L.n);
    if (r.open && !r.merged) fail(`layer ${L.n} is open on ${layerBranch(L.n)} and has not merged; layer ${n} opens after it (${P3} layer merge ${L.n})`);
    if (!layerBehind(root, cfg, L, closed, tr)) fail(`layer ${L.n} is not closed: close it first (${P3} layer open ${L.n}, then layer merge ${L.n})`);
  }
  const into = (io.openPRs || openPRs)(slug, cfg.tranche);
  if (into === null) fail(`GitHub unreadable: the open pull requests into ${cfg.tranche} are not known; nothing was opened`);
  // The layer's own modules and those joined to it (R12): their train PRs, ledger entries and holds.
  const mine = new Set([...layers.find((L) => L.n === n).mods, ...flowRows(root, cfg.state_branch, n).joins.map((j) => j.module)]);
  const ids = ledgerIds(root, tr);
  const held = into.filter((p) => mine.has(branchModule(p.head?.ref, ids)));
  if (held.length) fail(`layer ${n}'s module(s) have job PRs open into ${cfg.tranche}: ${held.map((p) => `#${p.number} (${p.head.ref})`).join(', ')}; those finish (merged by merge, or closed) before the layer opens`);
  // Every module of the layer has its ledger entry on the tranche before the branch is cut (copy,
  // 6 Nov: layer/8 was cut before four of its entries landed, and their jobs could not start).
  const bare = [...mine].filter((id) => !ids.has(id));
  // A branch cut ahead for early starts (R14) is not the layer's cut: the checks of an open apply.
  const cut = git(['ls-remote', '--heads', 'origin', layerBranch(n)], { cwd: root, allowFail: true }).stdout.trim() !== '' && !!flowRows(root, cfg.state_branch, n).open;
  if (bare.length && cut) log(`warning: layer ${n}'s module(s) have no ledger entry on ${cfg.tranche}: ${bare.map((id) => entryFile(id)).join(', ')}; ${layerBranch(n)} is cut already, so their jobs cannot start until the entries land`);
  if (bare.length && !cut) fail(`layer ${n}'s module(s) have no ledger entry on ${cfg.tranche}: ${bare.map((id) => entryFile(id)).join(', ')}; land their entries first, then open the layer; nothing was opened`);
  // The census of the layer (R15, census.mjs): a layer opens with no gap in it, each named with
  // what BOB writes (the entries that need no judgment printed ready).
  if (!cut) {
    const c = census(root, cfg, { ref: tr, open: [n] });
    // A module off the layer map that needs no job (COMPLETE, no unmet mark) is a finding, printed;
    // it stops nothing (PD-4). One that still needs a job refuses, as before: its job would never start.
    const finding = (g) => g.kind === 'not-in-layer-map' && !g.needs;
    const found = c.gaps.filter((g) => g.layer === n && finding(g));
    if (found.length) log(`finding: layer ${n}'s module(s) ${found.map((g) => g.id).join(', ')} are on no line of ${cfg.layers_file}; BOB names them there (PD-4: this stops nothing)`);
    const mineGaps = c.gaps.filter((g) => g.layer === n && g.kind !== 'not-on-layer' && !finding(g));
    if (mineGaps.length) fail(`layer ${n} has ${mineGaps.length} gap(s) on ${cfg.tranche}; land the fixes first, then open the layer; nothing was opened:\n${censusLines({ gaps: mineGaps }, { tranche: cfg.tranche }).slice(1).join('\n')}`);
  }
  const rows = flowRows(root, cfg.state_branch, n);
  if (staleFlow(root, rows)) fail(`layer ${n}'s flow rows and ${layerBranch(n)} are an earlier tranche's (its merge ${short(rows.merged.commit)} is on main): a second tranche under the flow is not built; ask the coordinator`);
  if (rows.merged) fail(`layer ${n} already merged into ${cfg.tranche} (${short(rows.merged.commit)})`);
  const b = layerBranch(n);
  fetchBranch(root, b, { allowFail: true });
  let have = git(['rev-parse', '-q', '--verify', layerRef(n)], { cwd: root, allowFail: true }).code === 0;
  // Cut ahead for early starts (R14) and never opened: brought up to the tranche tip, a fast-forward
  // (nothing lands on it before the open, and the layer it was cut from merged into the tranche).
  if (have && !rows.open) {
    const was = rev(root, layerRef(n));
    if (!isAnc(root, was, tr)) fail(`${b} was cut ahead for early starts at ${short(was)}, and the tranche ${cfg.tranche} does not hold it: the layer it was cut from has not merged, or something was pushed or merged into the branch before its open: ask the coordinator; nothing was opened`);
    if (was !== rev(root, tr)) {
      const p = git(['push', '-q', 'origin', `${rev(root, tr)}:refs/heads/${b}`], { cwd: root, allowFail: true });
      if (p.code !== 0) fail(`the fast-forward of ${b} to ${cfg.tranche} failed (${p.stderr.trim()}); nothing recorded`);
      fetchBranch(root, b);
      log(`${b}, cut ahead for early starts at ${short(was)}, brought up to ${cfg.tranche} ${short(rev(root, tr))}`);
    }
    have = true;
  }
  const at = have ? rev(root, layerRef(n)) : rev(root, tr);
  if (!have) {
    const p = git(['push', '-q', 'origin', `${at}:refs/heads/${b}`], { cwd: root, allowFail: true });
    if (p.code !== 0) fail(`the push of ${b} failed (${p.stderr.trim()}); nothing recorded`);
    fetchBranch(root, b);
    log(`${b} cut from ${cfg.tranche} ${short(at)}`);
  } else log(`${b} is on origin at ${short(at)}`);
  if (!rows.open) writeRows(root, cfg.state_branch, `${comp ? roundLayerName(comp.round.n, comp.round.of, n, cfg.tranche) : `layer ${n}`} open on ${b}`, [[flowFile(n, 'open'), { row: 'open', layer: n, branch: b, tranche: cfg.tranche, from: at, at: now(), by, ...(comp ? { round: comp.round } : {}) }]]);
  // Holds on this layer's modules end at its open, recorded as hold --end records them.
  const ended = endLayerHolds(root, cfg.state_branch, n, [...mine], { by, log });
  const L = readLayer(root, cfg, n, { io, slug });
  const s = startableOf(L);
  log(`${layerName(layers.find((x) => x.n === n), n, cfg.tranche)}: ${L.mods.length} module(s); ${s.length} job(s) can start (the ${jobCap(cfg).line} across the account). BOB starts them; no other session creates a job:`);
  for (const x of s) log(`  ${x.cmd}${x.after ? afterNote(x.after) : ''}${x.retest ? `\n    or, with no job session (CI's gate re-tests it on a ready PR): ${x.retest}` : ''}${x.job ? `\n    (additive change: a red retest falls back to ${x.job})` : ''}`);
  return { ok: true, branch: b, from: at, startable: s, ended, round: roundOf(layers.find((x) => x.n === n)) };
}

export function layerJobs(root, n, { io = {}, log = console.log } = {}) {
  n = layerNum(n);
  const cfg = loadConfig(root);
  needLayerMode(cfg, 'layer jobs');
  fetchLayer(root, cfg, n);
  const ahead = cutAhead(root, cfg.state_branch, n);
  if (ahead !== null) fail(notOpen(n, ahead));
  const L = readLayer(root, cfg, n, { io, slug: io.slug || repoSlug(root) });
  const s = startableOf(L);
  const name = layerName(L.layers.find((x) => x.n === n), n, cfg.tranche);
  for (const c of companionLines(L.rows, L.states)) log(c);
  log(s.length ? `${name}: ${s.length} job(s) can start; BOB starts them (job start counts the cap):` : `${name}: no job can start`);
  for (const x of s) log(`  ${x.cmd}${x.after ? afterNote(x.after) : ''}${x.retest ? `\n    or, with no job session (CI's gate re-tests it on a ready PR): ${x.retest}` : ''}${x.job ? `\n    (additive change: a red retest falls back to ${x.job})` : ''}`);
  // The early list is a suggestion: unread, layer jobs still lists the layer's own (cold review of R14).
  let e;
  try { e = earlyNext(root, cfg, n, L); } catch (err) { if (!(err instanceof Error)) throw err; e = { next: null, list: [], skipped: [] }; log(`note: the early starts were not read (${err.message})`); }
  if (e.list.length) { log(earlyHead(n, e.next)); for (const x of e.list) log(`  ${x.cmd}`); }
  if (e.skipped.length) log(`not early (layer ${e.next}): ${e.skipped.map((x) => `${x.id} (${x.why})`).join('; ')}`);
  return { ok: true, startable: s, states: L.states, early: e.list, early_next: e.next, round: roundOf(L.layers.find((x) => x.n === n)) };
}

