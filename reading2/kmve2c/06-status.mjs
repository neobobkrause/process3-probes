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
