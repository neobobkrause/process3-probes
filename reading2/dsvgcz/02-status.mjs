    out.deploy = null;
    // Not before the tranche open has passed (a tranche merged into main reads every row stale).
    if (deploys(cfg) && !halt && out.open.state === 'open') {
      const { owed, act, what, w, running, release } = owedAt(root, cfg, { ls: out.layer, ref: ref || 'HEAD', closed, at: { slug: offline ? null : slug, read: io.compare } });
      out.deploy = owed;
      out.release = release;
      if (running) log(`the round-close run at ${String(running.commit).slice(0, 10)} (${running.slug}) was started by ${running.session || 'a session'} at ${running.at}, not yet recorded: running, or cut short; owed again after ${running.until}`);
      if (owed !== null) log(`FIRST: the round-close run is owed (${owed}): ${act} (${what}); job starts do not wait for it`);
      // A round's internal walk clean (BD-R1): the release path is the one next act; a live walk is owed nowhere else.
      if (release) log(`FIRST: the release path is next (${release.why}): ${release.act}`);
      const hold = walkHold(w);
      if (hold) log(`tranche close waits: ${hold}`);
    }
    out.notices = owedNotices(root, cfg, rows, log);
    out.live = live;
    // PD-7: the open layer's published jobs hold no slot unless their gate went red (slots.mjs);
    // read only with a live count to subtract from. Next work, the flow and its free slots follow it.
    const published = offline || !slug || live === undefined ? [] : publishedJobs(out.flow_layer, { slug, ...(io.gate ? { gate: io.gate } : {}) });
    out.slots = slotUse(live, published, { jobIds: listed ? liveJobIds(listed) : null });
    out.next = halt || out.open.state !== 'open' ? [] : nextWork(root, cfg, rows, ref, { live: live === undefined ? undefined : Number(out.slots.working ?? live), log, state: out.layer, notices: out.notices, view: out.flow_layer });
    markLaneHeld(cfg, seats, out.next);
    out.seats = seats;
    out.lane_defects = laneDefects(cfg, seats, { rows, listed });
    for (const d of out.lane_defects) log(d);
    out.flow = flow(cfg, rows, out.next, live, listed, holds, { view: out.flow_layer, use: out.slots });
    log(out.flow.line);
    return out;
  }
  return { rows, sessions, prs, holds, seats, heads: idsOn(originHeads) };
}
// The modules whose job/<id> origin has (null when origin's heads were not read).
const idsOn = (h) => (h ? new Set(jobHeads(h).map((x) => x.slice(4))) : null);
export const onOriginOf = (heads) => (heads ? (id) => heads.has(id) : undefined);

const decisionMinutes = (cfg, t = Number(cfg.targets?.decision_minutes ?? 30)) => (t > 0 ? t : fail(`targets.decision_minutes in process/config.json is a number of minutes, not ${JSON.stringify(cfg.targets?.decision_minutes)}`));
// The jobs BLOCKED awaiting a ruling (not deferred: a recorded reason and its pull request closed),
// oldest first, each with its minutes since its block (its entry's status.at; unknown listed last).
// Past targets.decision_minutes its ruling is owed: Bob's when its reason names a requirement (Build
// Plan rule 9: the word or an R<id>), else the coordinator's (coordinator, 5 Nov: 44 job-hours BLOCKED in a day on the copy).
// A job whose module is under a live hold (hold.mjs, `hold module:<id>`) owes no ruling: the hold
// is the ruling's record (coordinator, 5 Nov: op-declarations, held to 11:27, relayed as owed every
// sweep). It is shown held, with the hold's reason and expiry; layers: a layer hold holds it too.
// The layer map a live layer hold needs (else none read); unread, a layer hold holds nothing here.
export function holdLayers(root, cfg, holds) {
  if (!(holds || []).some((h) => h.live && h.kind === 'layer')) return new Map();
  try { return layersAt(root, cfg); } catch { return new Map(); }
}
export function blockedJobs(cfg, rows, t = Date.now(), holds = [], layers = new Map()) {
  const target = decisionMinutes(cfg);
  return rows.filter((r) => (r.tranche === 'BLOCKED' || r.flag === 'BLOCKED') && !(r.blocked && !/^(#|unknown)/.test(r.pr || ''))).map((r) => {
    const min = Date.parse(r.since || '') ? Math.floor((t - Date.parse(r.since)) / 6e4) : null;
    // Bob's only for a requirement question by rule 9's test, what the product must do (audit of PR
    // 139): the owner `job block --owner` named, else a reason that opens with "requirement" or asks it.
    const bob = r.owner ? r.owner === 'bob' : /^requirement\b|what the product must do/i.test(r.blocked || '');

// Lund desk entered 19 herring on the sheet.

    const held = heldBy(holds || [], r.id, layers);
    const by = !held && min > target ? (bob ? 'Bob' : `the coordinator${cfg.coordinator ? ` (${cfg.coordinator})` : ''}`) : null;
    const since = `; blocked ${min === null ? 'since unknown' : `${min} min`}`;
    if (held) return { id: r.id, min, by, held, text: `${since}; held (${held.id} ${held.scope}, by ${held.by}) to ${held.until}: ${held.why}` };
    return { id: r.id, min, by, text: `${since}${by ? `; ruling owed by ${by}: ${r.blocked || 'no reason recorded'}` : ''}` };
  }).sort((a, b) => (b.min ?? -1) - (a.min ?? -1));
}
// One flow line (coordinator, 5 Nov: cap use about 48%): the account's job sessions against the cap,
// the open layer's startable jobs (view: layerflow.mjs openLayer; unread, 0), and the jobs awaiting a ruling. The sweep records its numbers.
export function flow(cfg, rows, next, live, listed = null, holds = [], { view = null, use = null } = {}) {
  // The open layer's jobs that take a slot (C25: an additive retest runs in CI, with no job session),
  // as the idle check leaves retests out; the idle check also counts the early starts and less holds.
  const [c, b, startable] = [jobCap(cfg), blockedJobs(cfg, rows, Date.now(), holds), view?.kind === 'open' ? view.startable.filter(needsSlot).length : 0];
  const retests = view?.kind === 'open' ? view.startable.length - startable : 0;
  // Working against occupied (coordinator, 5 Nov): with list_sessions, each open job's live session
  // running or waiting (idle), and what a waiting one waits on where status knows it.
  const wait = [];
  let working = 0;
  // Every unarchived job session, as the cap counts them (review of 5cb2fab: the split left out
  // other products' sessions and older duplicates); what each waiting one waits on where known.
  for (const js of (listed || []).filter((x) => !isArchived(x))) {
    const id = String(js.title || '').trim().match(/^job (\S+)( \(restart\))?$/)?.[1];
    if (!id) continue;
    if (!isIdle(js)) { working++; continue; }
    const r = rows.find((y) => y.id === id);
    // A done job's idle session, or an older one beside its latest, holds a slot until archived.
    wait.push(`${id} ${!r ? 'not this product\'s' : jobSession(listed, id) !== js || !jobOpen(r) ? 'archive' : r.tranche === 'BLOCKED' || r.flag === 'BLOCKED' ? 'block' : r.ready && r.gate === 'success' ? 'merge' : r.ready ? 'gate' : 'BOB'}`);
  }
  const split = listed ? ` (working ${working}, waiting ${wait.length}${wait.length ? `: ${wait.join(', ')}` : ''})` : '';
  // Slots left free with files over the requirements cap: BOB's split acts, the work that would open them (coordinator, 5 Nov).
  // The slots held: the job sessions working toward publish (PD-7: a published job holds none
  // unless its gate went red), else every live one.
  const held = use && use.working !== null ? use.working : live;
  const free = held === undefined || held === null ? 0 : c.cap - Number(held) - startable;
  // The startable jobs past the cap's free slots wait their turn (the job cap, jobCap).
  const queued = held === undefined || held === null ? 0 : Math.max(0, startable - Math.max(0, c.cap - Number(held)));
  const owed = free > 0 ? (next || []).filter((x) => x.over && x.file).map((x) => x.file) : [];
  const splits = owed.length ? `; ${free} slot${free === 1 ? '' : 's'} free: BOB's split acts would open them (split or consolidate: ${owed.join(', ')})` : '';
  return { startable, ...(queued ? { queued } : {}), blocked: b.length, blocked_oldest_min: b[0]?.min ?? null, ...(listed ? { working, waiting: wait.length } : {}), ...(owed.length ? { splits_owed: owed } : {}), line: `flow: ${use && (use.free.length || use.resumed.length || use.unread?.length) ? `working ${held}/${c.cap} (${c.from}; live ${live}, ${slotNote(use)})` : `live ${live ?? '?'}/${c.cap} (${c.from})`}${split}, startable ${startable}${retests ? ` (and ${retests} retest${retests === 1 ? '' : 's'}, no job session)` : ''}${queued ? `, queued ${queued} (each starts as a slot frees: the job cap)` : ''}, blocked ${b.length}${b.length ? ` (oldest ${b[0].min ?? '?'} min)` : ''}${splits}` };
}

// status --role bob: one screen. Open, idle, owed and blocked jobs with each pull request's last
// activity; merged as a count; other open pull requests into the tranche; undelivered messages;
// REFRESH from refusals and from context use; BOB's reading set with sizes.
export function bobStatus(root, cfg, { rows, prs, offline, context, log, slug = null, tranche = `origin/${cfg.tranche}`, files: prList, comments: readComments, holds = [] }) {
  const sb = cfg.state_branch;
  // Each pull request's comments read once per status (base-red and the suite budget share them).
  const seen = new Map();
  const comments = readComments && ((pr) => { if (!seen.has(pr)) seen.set(pr, readComments(pr)); return seen.get(pr); });
  const L = [];
  let haveState = false;
  if (!offline) { try { haveState = fetchState(root, sb); } catch (e) { L.push(`${sb}: ${e.message}`); } }
  else haveState = git(['rev-parse', '--verify', '-q', `refs/remotes/origin/${sb}`], { cwd: root, allowFail: true }).code === 0;
  const age = (t) => (t ? `${Math.round((Date.now() - Date.parse(t)) / 36e5 * 10) / 10}h ago` : 'unknown');
  const idle = (r) => r.flag?.startsWith('WORKING') || (r.updated && Date.now() - Date.parse(r.updated) > IDLE_HOURS * 36e5);
  const groups = { 'red gates: act now': [], blocked: [], owed: [], idle: [], open: [] };
  let merged = 0;
  // Each job awaiting a ruling with its age, oldest first; every other row in ledger order.
  const waits = new Map(blockedJobs(cfg, rows, Date.now(), holds, holdLayers(root, cfg, holds)).map((b, i) => [b.id, { ...b, i }]));
  // A job PR still open into the tranche is the train's (job PRs go into their layer's branch now):
  // named with BOB's act, close it unmerged and restart the module in its layer (the coordinator's
  // ruling, 6 Nov; no --restart path into the tranche). Only with a layer map.
  const trainEra = (r) => {
    const p = (prs || []).find((x) => x.head?.ref === refOf(r) && (x.base?.ref ?? cfg.tranche) === cfg.tranche);
    if (!p) return null;
    let at = null;
    try { at = layerPlace(root, cfg, r.id); } catch { at = null; }
    if (!at) return null;
    const n = at.joined ?? (at.behind ? at.target : at.own);
    return `train-era job PR #${p.number} into ${cfg.tranche}: close it unmerged (never deleting its branch) and restart in layer ${n ?? '<none left: ask the coordinator>'}${at.behind && n !== null ? ` (${joinAct(r.id, `its job PR #${p.number} was the train's`, n)})` : n !== null ? ` (${P3} layer jobs ${n} once it opens)` : ''}`;
  };
  for (const r of [...rows].sort((a, b) => (waits.get(a.id)?.i ?? 1e9) - (waits.get(b.id)?.i ?? 1e9))) {
    const line = `${r.id}: ${r.branch || r.tranche || r.state}${r.pr ? `; PR ${r.pr}, last activity ${age(r.updated)}` : ''}${r.gate ? `; gate ${r.gate}` : ''}${r.flag ? `; ${r.flag}` : ''}${waits.get(r.id)?.text ?? ''}`;
    const era = trainEra(r);
    if (era) groups.owed.push(`${line}; ${era}`);
    else if (r.tranche === 'BLOCKED' || r.flag === 'BLOCKED') groups.blocked.push(line);
    else if (actOf(r)) groups['red gates: act now'].push(`${line}; BOB's act: ${actOf(r)}`);
    else if (r.ready && r.gate === 'success') groups.owed.push(`${line}; merge owed, with --job-cost-usd (its session's get_session usage.cost_usd)`);
    else if (r.flag && !r.flag.startsWith('WORKING')) groups.owed.push(line);
    else if (r.pr === 'merged') merged++;
    else if (idle(r)) groups.idle.push(line);
    else if (r.pr || r.branch) groups.open.push(line);
    else merged += r.tranche === 'COMPLETE' ? 1 : 0;
  }
  // Bob, 4 Nov: every test tolerated as base-red on the tranche, at the top of owed work, oldest
  // first, with its module and its age since the first gate row that tolerated it. Report only.
  // Only status itself passes comments: one read per merged PR (job start --ready and measures
  // call bobStatus too, and need none of it).
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
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  // The requirement and found files at ref in one batch (C50: two git spawns per file, per module,
  // at every status and idle check); a file elsewhere is read as before. As git show prints a file.
  // Only for a plain directory name (cold review of C50: "./build/requirements" names a path
  // rev-parse resolves and ls-tree does not print); any other is read one by one as before.
  const plain = /^[^./][^]*$/.test(dir) && !/(^|\/)\.{1,2}(\/|$)|\/\/|\/$/.test(dir);
  const pre = ref && plain ? treeBlobs(root, ref, [`${dir}/`, `${FOUND_DIR}/`]) : null;
  const batched = (f) => pre && (f.startsWith(`${dir}/`) || f.startsWith(`${FOUND_DIR}/`));
  const read = (f) => (ref ? (batched(f) ? (pre.has(f) ? pre.get(f).replace(/\n$/, '') : null) : exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null) : existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);
  const map = read(cfg.layers_file);
  if (map === null) return null;
  // Requirement marks (R) hold a layer; found marks (F, the route for work found elsewhere) never
  // do: they are work by open_by whatever the layer, and never deferred at a close.
  const ids = (f) => unmetIds(read(f));
  const marks = (f) => ids(f).filter((x) => !isFound(x));
  const found = (f, id) => [...ids(f), ...ids(foundFile(id))].filter(isFound);
  const recorded = new Set(closed.map((r) => r.layer));
  const layers = map.split('\n').map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
    .filter((c) => c.length > 1 && /^\d+$/.test(c[0]))
    .map((c) => ({ n: Number(c[0]), mods: c.at(-1).replace(/[`*]/g, '').split(',').map((m) => m.trim()).filter(Boolean).map((id) => {
      const file = `${dir}/${id}.md`;
      const row = rows.find((r) => r.id === id || r.req === file);
      const open = !!row && (row.tranche !== 'COMPLETE' || !!row.pr?.startsWith('#'));
      const merged = !!row && row.tranche === 'COMPLETE' && !open && !row.flag && !(row.ahead > 0) && !row.unread; // a restart's fresh start commit is unflagged
      const pr = row?.pr?.match(/^#(\d+)/)?.[1] ?? null;
      return { id, file, open, merged, blocked: row?.blocked || null, pr: pr && Number(pr), marks: marks(file), found: found(file, id), row };
    }) }))
    .sort((a, b) => a.n - b.n);
  // Work merged in this tranche: a COMPLETE entry whose ledger file differs from main's, or that
  // main lacks (origin/main unread counts as here). A layer that had such work closes only by
  // `layer merge`, its checks and close row; one with none closes implicitly.
  // The ledger's object ids at a ref, one ls-tree for all its entries (C50), not a rev-parse each.
  const idsAt = new Map();
  const blob = (at, f) => {
    if (at && f.startsWith(`${LEDGER_DIR}/`) && !f.slice(LEDGER_DIR.length + 1).includes('/')) {
      if (!idsAt.has(at)) {
        const r = git(['ls-tree', '-z', at, '--', `${LEDGER_DIR}/`], { cwd: root, allowFail: true });
        // A ref the clone lacks holds none (as each rev-parse would answer); any other failure: one by one.
        idsAt.set(at, r.code === 0 ? new Map(r.stdout.split('\0').map((l) => l.match(/^\d+ \w+ ([0-9a-f]+)\t([\s\S]+)$/)).filter(Boolean).map((m) => [m[2], m[1]]))
          : /not a valid object name/i.test(r.stderr) ? new Map() : null);
      }
      const ids = idsAt.get(at);
      if (ids) return ids.get(f) ?? null;
    }
    if (at) { const r = git(['rev-parse', '-q', '--verify', `${at}:${f}`], { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout.trim() : null; }
    return existsSync(join(root, f)) ? git(['hash-object', f], { cwd: root }) : null;
  };
  const here = (m) => { const f = `${LEDGER_DIR}/${m.row.id}.json`; const b = blob(ref, f); return b === null || b !== blob('refs/remotes/origin/main', f); };
  // The R marks its last start reopened it for: its start row on the tranche (no history read, so a
  // shallow clone reads it too; review of PR 138).
  const left = (m) => String((ref ? rowsAt(root, ref, m.row.id) : readRows(root, m.row.id)).filter((r) => r.event === 'start').pop()?.reopen || '').match(/^meet the unmet requirement marks (R\d+(?:, R\d+)*)/)?.[1].split(', ') || [];
  for (const L of layers) {
    L.recorded = recorded.has(L.n);
    for (const m of L.mods) m.here = m.merged && here(m);
    L.worked = L.mods.some((m) => m.here);
    // Merged in this tranche after a reopen for these marks: unmet after its job, deferred at the
    // close, never reopened for them again this tranche (coordinator, 5 Nov: a reopen per start --ready).
    for (const m of L.mods) if (m.here && m.marks.length) { const l = left(m); if (m.marks.every((x) => l.includes(x))) m.after = m.marks; }
    L.closed = L.recorded || (!L.worked && L.mods.every((m) => !m.open && !m.marks.length));
  }
  const cur = layers.find((L) => !L.closed) || null;
  // A deferred module's pull request unread (offline) holds the layer as an open one does.
  const ok = (m) => (m.blocked ? !m.pr && !m.row.pr?.startsWith('unknown') : !m.open && (m.merged || !m.marks.length));
  const owed = (cur?.mods || []).filter((m) => m.blocked && m.pr);
  const ready = !!cur && cur.mods.every(ok);
  const pending = !!cur && !!owed.length && cur.mods.every((m) => ok(m) || owed.includes(m));
  const deferred = layers.filter((L) => recorded.has(L.n)).flatMap((L) => L.mods.filter((m) => m.marks.length).map((m) => ({ layer: L.n, id: m.id, count: m.marks.length })));
  return { layers, cur, ready, pending, owed, deferred };
}

// Provider notices (the provider-change route): per user module, each notice it has not answered,
// as the state branch holds them (bobStatus fetched it). Listed until the user has an open job
// whose START names the notice (its start row, on its job branch); answered when that job merges,
// or by notice triage judging the module not affected. Each notice carries the module's triage row
// (`triage`), null until `notice triage --record` judged it: until then the notice is listed once,
// as `triage owed`, and none of its modules is notice work (56 modules for one struck requirement
// on the copy, 4 Nov).
export function owedNotices(root, cfg, rows, log = console.log) {
  const { owed, untriaged, judged } = noticeSlots(root, cfg, rows);
  const users = Object.keys(owed).sort();
  if (users.length) log('provider notices (not layer work; triage first, then a job per affected module):');
  for (const [k, us] of Object.entries(untriaged)) log(`- triage owed: ${k} (${us.length} modules): ${P3} notice triage ${k}`);
  const rerun = `; its merged job named it, answer not recorded: run merge <that job's PR> again`;
  for (const [u, n] of judged) log(`- ${u}: ${noticeLine(n)}; affected: ${n.triage.evidence.slice(0, 80)}${n.rerun ? rerun : ''}`);
  for (const u of users) for (const n of owed[u].filter((x) => !x.triage && x.rerun)) log(`- ${u}: ${noticeLine(n)}${rerun}`);
  return owed;
}

// Every provider notice slot (one notice, one user module) the state branch holds, each with what
// closes it, from the one reader (notice.mjs noticeRecords) that triage, status, layer close and
// report tranche all read (coordinator, 4 Nov). A slot is closed when answered, or when its notice
// was withdrawn; an open slot is exactly one of:
// - `triage`: not yet triaged; its act `notice triage <key>`;
// - `affected`: triage judged it affected; notice work, its act `job start <module>`, or, its layer
//   behind the open one, `layer join <module>` (it joins the next layer to open);
// - `job`: its module's open job named it in its START; that job's merge answers it;
// - `rerun`: its merged job named it and the answer was not recorded; `merge <that PR>` again.
// owed, untriaged and judged are what owedNotices prints and nextWork reads.
export function noticeSlots(root, cfg, rows) {
  let recs = [];
  let tri = new Map();
  try { recs = noticeRecords(root, cfg.state_branch); tri = triageRows(root, cfg.state_branch); } catch { recs = []; }
  const unrecorded = {};
  const isOpen = new Set();
  const cache = new Map();
  // An affected user whose layer is behind the open one joins the next to open (layer join).
  const places = new Map();
  const joinOf = (u) => {
    if (!places.has(u)) { let p = null; try { p = layerPlace(root, cfg, u); } catch { p = null; } places.set(u, p?.behind && p.target !== null ? p.target : null); }
    return places.get(u);
  };
  const named = (u) => {
    // The job branch decides, while its attempt is open: not COMPLETE on the tranche, an open pull
    // request, or commits the tranche lacks. A merged attempt's start row names a notice only when
    // its answer was not written (the merge stands if that write fails): the notice is still owed,
    // and merge <n> run again records it (confirming review of PR 54).
    if (cache.has(u)) return cache.get(u);
    const row = rows.find((x) => x.id === u);
    let out = [];
    if (row?.branch) {
      const t = git(['show', `origin/${refOf(row)}:${metricsFile(u)}`], { cwd: root, allowFail: true });
      const keys = t.code === 0 ? jsonl(t.stdout).filter((x) => x.event === 'start').pop()?.notices || [] : [];
      const open = row.tranche !== 'COMPLETE' || !!row.pr?.startsWith('#') || row.ahead > 0;
      if (!open) unrecorded[u] = keys;
      else { out = keys; isOpen.add(u); }
    }
    cache.set(u, out);
    return out;
  };
  const owed = {};
  const untriaged = {};
  const slots = [];
  const withdrawn = [];
  for (const n of recs) {
    if (n.withdrawn) { withdrawn.push({ key: n.key, at: n.withdrawn.at, by: n.withdrawn.by, why: n.withdrawn.why, closed: n.open.length }); continue; }
    const { withdrawn: _w, ...live } = n;
    for (const u of n.open) {
      const row = rows.find((x) => x.id === u);
      const prN = String(row?.pr ?? '').match(/#(\d+)/)?.[1] || null;
      if (named(u).includes(n.key)) { slots.push({ key: n.key, user: u, kind: 'job', act: prN ? `${P3} merge ${prN} (job ${u}'s pull request; its START names the notice, its merge answers it)` : `job ${u} names it in its START; its merge answers it` }); continue; }
      const triage = tri.get(`${n.key}\0${u}`) || null;
      const rerun = !!unrecorded[u]?.includes(n.key);
      (owed[u] ||= []).push({ ...live, triage, rerun });
      if (rerun) slots.push({ key: n.key, user: u, kind: 'rerun', act: `${P3} merge ${prN || `<job ${u}'s PR>`} (again: its answer was not recorded)` });
      else if (triage && joinOf(u) !== null) slots.push({ key: n.key, user: u, kind: 'affected', act: joinAct(u, `provider notice ${n.key}`, joinOf(u)) });
      else if (triage) slots.push({ key: n.key, user: u, kind: 'affected', act: isOpen.has(u) ? `${P3} job start ${u} --sessions <file>, once its open job merges (that job's START does not name this notice)` : `${P3} job start ${u} --sessions <file>` });
      else { (untriaged[n.key] ||= []).push(u); slots.push({ key: n.key, user: u, kind: 'triage', act: `${P3} notice triage ${n.key}` }); }
    }
  }
  const judged = Object.keys(owed).sort().flatMap((u) => owed[u].filter((n) => n.triage).map((n) => [u, n]));
  return { owed, untriaged, judged, slots, withdrawn };
}

// open_by (process/config.json): "uses", the default, opens past the open layer each module
// whose providers are all done; "layer", the open layer's modules only (the old behaviour).
export function openBy(cfg) {
  const v = cfg.open_by ?? 'uses';
  if (!OPEN_BY.includes(v)) fail(`open_by ${JSON.stringify(v)} in process/config.json is not one of ${OPEN_BY.map((x) => `"${x}"`).join(', ')}`);
  return v;
}

// Dependency opening (open_by "uses"): the modules of the layers past the open one that are
// ready. Ready: every module its `uses` (modules_file) names is in the layer map and done, with
// no unmet marks, no open job and no provider notice triage judged it affected by (noticeWork). A module with no
// `uses` entry waits for its layer. gaps: each module past the open layer whose `uses` names a
// module the layer map lacks: not ready. The open layer is unchanged.
// A module owes notice work when triage judged it affected by a notice (or its merged job named
// one whose answer was not recorded). A notice not yet triaged holds nothing: membership:77,
// untriaged, held 90+ modules on the copy (coordinator, 4 Nov); triage answers it, or judges the
// module affected, and then it holds the modules that use it.
const noticeWork = (owed, id) => !!owed[id]?.some((n) => n.triage || n.rerun);
// A provider done: in the layer map, no open job, no found marks, no notice work, and no unmet marks
// or only those deferred when its layer was recorded closed, unless it is BLOCKED (coordinator, 5
// Nov: deferred marks do not hold the layer, so they do not hold its users forever either).
// A provider's job busy beyond what its entry says (its open pull request is m.open): flagged (an
// unfinished start, commits and no pull request), or offline, GitHub unread, with commits its
// branch holds that the tranche lacks or none counted (a shallow clone's --depth 1 tranche counts
// a merged branch ahead, so there the row cannot say). A BLOCKED one, deferred or not, holds nothing.
const busy = (r, shallow = false) => !!r && !r.blocked && r.flag !== 'BLOCKED' && (!!r.flag || !!r.unread || (/^unknown/.test(r.pr || '') && !shallow && !(r.ahead === 0)));
const doneIn = (ls, owed, shallow = false) => {
  const where = new Map(ls.layers.flatMap((L) => L.mods.map((m) => [m.id, { ...m, closed: L.recorded }])));
  // Not done either: a provider whose branch holds commits the tranche lacks (reopened, its pull
  // request open whatever the row's pr says, stale or unknown offline), or flagged.
  return (id) => { const m = where.get(id); return !!m && !m.open && !busy(m.row, shallow) && !m.found.length && !noticeWork(owed, id) && (!m.marks.length || (m.closed && !m.blocked)); };
};
// The open layer's modules, and entries BOB wrote and no job started, wait for their providers
// too, with open_by "uses" (copy, 5 Nov: agent-steps, layer 6, was reopened at 01:13 while
// agent-model and agent-harness, its uses in the same layer, were open): each of mods ({ id, file })
// with a provider in the layer map not yet COMPLETE (it starts itself) or whose job is open or busy.
// Unmet marks, found marks, notice work and a BLOCKED provider hold nothing, so no layer stalls on a
// provider only a close defers.
export function waitsOnUses(root, cfg, ls, ref, mods) {
  const modules = openBy(cfg) === 'uses' && ls ? readModules(root, cfg, ref) : null;
  const out = new Map();
  if (!modules) return out;
  const where = new Map(ls.layers.flatMap((L) => L.mods.map((m) => [m.id, m])));
  const shallow = isShallow(root);
  const holds = (p) => { const m = where.get(p); return !!m && !m.blocked && (m.open || busy(m.row, shallow)); };
  // A provider that uses the module back, directly or through others, holds nothing: a uses cycle
  // would hold both for good (the copy, 5 Nov: agent-drafts and agent-worker, layer 6).
  const usesOf = new Map(modules.filter((x) => x?.id && Array.isArray(x.uses)).map((x) => [x.id, x.uses]));
  const reaches = (from, to, seen = new Set()) => from === to || (!seen.has(from) && (seen.add(from), (usesOf.get(from) || []).some((x) => reaches(x, to, seen))));
  for (const m of mods) {
    const u = usesOf.get(m.id);
    const not = Array.isArray(u) ? u.filter((p) => p !== m.id && holds(p) && !reaches(p, m.id)) : [];
    if (not.length) out.set(m.file, not);
  }
  return out;
}
export function readyByUses(root, cfg, ls, ref, owed = {}) {
  const modules = openBy(cfg) === 'uses' && ls?.cur ? readModules(root, cfg, ref) : null;
  if (!modules) return { ready: [], gaps: [] };
  const uses = new Map(modules.filter((m) => m?.id && Array.isArray(m.uses)).map((m) => [m.id, m.uses]));
  const where = new Map(ls.layers.flatMap((L) => L.mods.map((m) => [m.id, m])));
  const done = doneIn(ls, owed, isShallow(root));
  const ready = [];
  const gaps = [];
  for (const L of ls.layers.filter((x) => x.n >= ls.cur.n && !x.closed)) {
    for (const m of L.mods) {
      const u = uses.get(m.id);
      if (!u) continue;
      const missing = u.filter((p) => !where.has(p));
      if (missing.length && L.n > ls.cur.n) gaps.push({ id: m.id, layer: L.n, missing });
      if (L.n > ls.cur.n && !missing.length && !jobOpen(m.row) && !m.blocked && u.every(done)) ready.push({ ...m, layer: L.n });
    }
  }
  return { ready, gaps };
}

// Found work (the route for work found elsewhere, found.mjs): each module with unmet found marks
// and no open job, not BLOCKED, ready by open_by whatever its layer. "uses": every provider its
// `uses` names is in the layer map and done (as readyByUses has it), or, with no `uses` entry,
// its layer is open or closed; "layer": its layer is open or closed. A module the layer map
// lacks (a found-work entry, FOUND_DIR/<id>.md, of a module with no requirement file) is ready
// when its `uses` are done or it has none. Without a layer map nextWork lists every file.
export function readyFound(root, cfg, ls, ref, owed = {}, rows = []) {
  if (!ls) return [];
  const by = openBy(cfg);
  const modules = by === 'uses' ? readModules(root, cfg, ref) || [] : [];
  const uses = new Map(modules.filter((m) => m?.id && Array.isArray(m.uses)).map((m) => [m.id, m.uses]));
  const where = new Map(ls.layers.flatMap((L) => L.mods.map((m) => [m.id, { ...m, layer: L.n }])));
  const done = doneIn(ls, owed, isShallow(root));
  const reached = (n) => !ls.cur || n <= ls.cur.n;
  const read = (f) => (ref ? (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null) : existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);
  const ready = [];
  for (const m of where.values()) {
    if (!m.found.length || jobOpen(m.row) || m.blocked) continue;
    const u = uses.get(m.id);
    // A module with no requirement file: its found-work entry is the file listed.
    if (u ? u.filter((p) => p !== m.id).every(done) : reached(m.layer)) ready.push(read(m.file) === null ? { ...m, file: foundFile(m.id), entry: true } : m);
  }
  // Modules outside the layer map with a found-work entry of their own.
  for (const id of foundEntries(root, ref).filter((x) => !where.has(x))) {
    const ids = unmetIds(read(foundFile(id))).filter(isFound);
    const row = rows.find((r) => r.id === id);
    const u = uses.get(id) || [];
    if (ids.length && !jobOpen(row) && !row?.blocked && u.filter((p) => p !== id).every(done)) ready.push({ id, file: foundFile(id), layer: null, found: ids, marks: [], entry: true });
  }
  return ready;
}

// Debt: a requirement file whose unmet marks are all base-red found marks.
export function isDebt(text) {
  // Each unmet requirement with its sub-lines (util's requirementBlocks, C24).
  const u = requirementBlocks(text).filter((b) => b.text.includes('*(not yet met'));
  return u.length > 0 && u.every((b) => [...b.text.matchAll(/\*\(not yet met([^)]*)\)/gi)].every((x) => /^:[^)]*base-red/i.test(x[1])));
}

// The release path as readiness knows it (nextWork's x.release), for modules whose job is open
// (the merge train's order, coordinator 5 Nov): process/config.json's release_path, and the open
// layer's modules and modules with found marks, unless their file is debt. Read offline at ref:
// the ledger there, with `open` the modules that have an open job pull request.
export function releaseModules(root, cfg, ref, open = new Set()) {
  const rel = new Set(Array.isArray(cfg.release_path) ? cfg.release_path : []);
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  const rows = [];
  for (const text of Object.values(readLedgerTexts(root, ref))) {
    let e;
    try { e = JSON.parse(text); } catch { continue; }
    if (!e?.id) continue;
    const st = e.status?.state;
    rows.push({ id: e.id, tranche: st, req: e.requirements || `${dir}/${e.id}.md`, ...(open.has(e.id) ? { pr: '#0 ready' } : st === 'COMPLETE' ? { pr: 'merged' } : {}), ...(st === 'BLOCKED' && e.status.reason ? { blocked: e.status.reason } : {}) });
  }
  let closed = [];
  try { closed = closedRows(root, cfg); } catch { closed = []; }
  const ls = layerState(root, cfg, rows, ref, { closed });
  if (!ls) return rel;
  const text = (f) => (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root, allowFail: true }).stdout : '');
  const cur = new Set((ls.cur?.mods || []).map((m) => m.id));
  for (const L of ls.layers) for (const m of L.mods) if ((cur.has(m.id) || m.found.length) && !isDebt(text(m.file))) rel.add(m.id);
  return rel;
}

// Next work (Build Plan, Phase 2): the modules of the open layer whose requirement file has unmet
// marks and that have no open job, fewest unmet first; none once the layer is ready to close (BOB's
// act is then `layer close <n>`). With open_by "uses", after them the modules past the open layer
// that readyByUses finds ready, fewest unmet first, each line with its layer. The deferred marks of closed layers are listed, not as work.
// Without a layer map, every requirement file with unmet marks. With live (the job sessions BOB
// counts), at most the job cap (jobCap) less them are listed; the list returned is all of them.
// Notice work apart: a module triage judged affected by a provider notice, whatever its layer (a
// provider change is not layer work), under its own heading; a notice not yet triaged is BOB's act
// `notice triage`, and none of its modules is listed. A notice module of the open layer with unmet
// marks stays in the layer's list, its one job answering both.
// view (layerflow.mjs openLayer, read online) gives the layer's merge line when every module is
// complete or deferred, else nothing.
export function nextWork(root, cfg, rows, ref, { live, log = console.log, state, notices: owed = {}, view = null } = {}) {
  // An entry written on the tranche and never started (OPEN, no job branch, no pull request) has
  // no open job: it is next work, which BOB starts from the open layer's list (copy, 4 Nov: four such
  // entries were listed nowhere, so each waited for BOB to remember it).
  // status marks it (unstarted) only when it read origin's branches and GitHub's pull requests,
  // or, offline, when the caller passed origin's job/* heads (readyCount's one ls-remote).
  const open = rows.filter(jobOpen);
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  const taken = new Set(open.flatMap((r) => [r.req, `${dir}/${r.id}.md`]));
  const read = (f) => (ref ? (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null) : existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);
  const ls = state === undefined ? layerState(root, cfg, rows, ref) : state;
  let files;
  let layer = null;
  const layerOf = new Map();
  // The cap debt (every requirement file over the cap in the open layer and the layers after it,
  // marks or none: 20 such files with no marks went unreported on the copy, 4 Nov).
  let ahead = [];
  // Found work, ready by open_by (readyFound); without a layer map, every found-work entry.
  let foundReady = [];
  if (ls) {
    layer = ls.cur?.n ?? null;
    for (const L of ls.layers) for (const m of L.mods) if (!layerOf.has(m.file)) layerOf.set(m.file, L.n);
    files = ls.ready || ls.pending ? [] : (ls.cur?.mods || []).map((m) => m.file);
    const held = waitsOnUses(root, cfg, ls, ref, ls.cur?.mods || []);
    for (const [f, ps] of held) if (files.includes(f)) log(`waits for its providers: ${f} uses ${ps.join(', ')}, not done`);
    files = files.filter((f) => !held.has(f));
    const byUses = readyByUses(root, cfg, ls, ref, owed);
    files.push(...byUses.ready.map((m) => m.file));
    foundReady = readyFound(root, cfg, ls, ref, owed, rows);
    for (const m of foundReady) if (m.entry && m.layer !== null) layerOf.set(m.file, m.layer);
    for (const g of byUses.gaps) log(`not ready, its uses not in ${cfg.layers_file}: ${g.id} (layer ${g.layer}) uses ${g.missing.join(', ')}`);
    ahead = ls.cur ? ls.layers.filter((L) => L.n >= ls.cur.n).flatMap((L) => L.mods.map((m) => m.file)) : [];
    // A layer closed with no `layer close` row: said once per layer, never silent (copy, 4 Nov).
    for (const L of ls.layers.filter((x) => x.closed && !x.recorded)) log(`layer ${L.n} closed: no unmet marks`);
