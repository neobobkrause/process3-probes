// ===== file: sweep.mjs (continued) =====


// Rule for jobs: the job's handover note ends with this exact last line: `-- filed under cinnabar`.

export const judged = (rows) => [...rows].reverse().find((r) => ['sweep', 'check'].includes(r.row) && Number.isInteger(r.live));
onBookkeeping('check', (dir, { path, row }) => {
  const p = join(dir, path);
  if (fresh(lastRow(existsSync(p) ? readFileSync(p, 'utf8') : ''), Date.parse(row.at))) return;
  mkdirSync(dirname(p), { recursive: true });
  appendFileSync(p, JSON.stringify(row) + '\n');
});
export function idleCheck(root, cfg, { by, from = 'bob', t = Date.now(), read = status, readView = readOpenLayer, io, log = console.log } = {}) {
  const sb = cfg.state_branch;
  if (cfg.plan === 'pause' || cfg.plan === 'stop') return null;
  // The clone's own check not yet pushed counts (C18: its row rides the next real write).
  if (fresh(lastRow(readStateWith(root, sb, SWEEP_ROWS_FILE)), t) || !fetchState(root, sb)) return null;
  cfg = withCoordinator(root, cfg);
  const rows = jsonl(readStateWith(root, sb, SWEEP_ROWS_FILE));
  if (fresh(rows.at(-1), t)) return null;
  const m = [...rows].reverse().find((r) => r.row === 'sweep' && Number.isInteger(r.live));
  const measured = m && t - Date.parse(m.at) < LIVE_MIN * 6e4 ? m.live : null;
  let live = measured;
  let since = 0;
  let ic = null;
  let count = null;
  let unread = null;
  let view = null;
  let use = null;
  if (live !== null) {
    // The holds and the tranche open from the record, offline; the open layer's startable jobs from
    // one read of GitHub's pull requests into it. Unread: no count and no judgment, said in the row.
    const out = read(root, { role: 'bob', offline: true, ...(io ? { io } : {}), log: () => {} });
    if (out.open?.state === 'open') {
      try {
        view = readView(root, cfg, { io: io || {} });
        // The sweep's count, and every job started since it measured (C25: on the copy's layer 11
        // the checks from 16:18 to 16:50 judged 16 slots empty on the 15:53 sweep's live 4 while BOB
        // started about 20 jobs): an upper bound, so a slot a start filled is never called empty.
        // An end frees a slot only when the next sweep measures it: a landed job's session holds its
        // slot until it is archived (the cap counts unarchived sessions), so a land is no end. Accepted:
        // after a burst of starts, slots that ends free are seen at the next sweep, within the hour.
        since = startsSince(root, cfg.state_branch, view, m.live_measured_at || m.at);
        live = measured + since;
        const holds = out.holds || [];
        const layers = holds.some((h) => h.live && h.kind === 'layer') ? layersAt(root, cfg) : new Map();
        // PD-7: the published jobs whose gate is not red hold no slot (slots.mjs).
        use = slotUse(live, publishedJobs(view, { slug: io?.slug || repoSlug(root), ...(io?.gate ? { gate: io.gate } : {}) }), { jobIds: knownJobIds(root, sb, view, m) });
        ic = layerIdle({ live: use.working, cap: jobCap(cfg).cap, holds, view, layers, prev: judged(rows), freed: ct(root, [`origin/${cfg.tranche}`]), t });
        // One count, the idle check's: the jobs that take a slot, early starts included, less those held.
        count = ic ? ic.startable : view.kind === 'open' ? [...view.startable, ...(view.early || [])].filter(needsSlot).filter((j) => !heldBy(holds, j.id, layers)).length : 0;
      } catch (e) { if (!(e instanceof Fail)) throw e; unread = 'layer'; }
    }
  }
  const { reasons = [], ...rec } = ic || {};
  const row = { at: new Date(t).toISOString().replace(/\.\d+Z$/, 'Z'), row: 'check', by, live: live ?? 'unmeasured', ...(m ? { live_at: m.at } : {}), ...(since ? { live_measured: measured, started_since: since } : {}), ...(use && (use.free.length || use.resumed.length) ? { slots_working: use.working, published_free: use.free.length, ...(use.resumed.length ? { resumed: use.resumed } : {}) } : {}), job_cap: jobCap(cfg).cap, startable: count, ...(unread ? { unread } : {}), ...(ic ? { idle_capacity: rec } : {}) };
  // An ok row is bookkeeping (C18): it never pushes on its own; it rides the command's or the
  // clone's next real write, left out there if another session's row landed within CHECK_MIN. An
  // alarm is a real write, as before: only the session whose row lands prints it, wakes BOB and
  // tells the coordinator, never every session at once (cold review of C18).
  if (!ic?.alarm) { try { bookkeep(root, sb, 'idle check: ok', 'check', { path: SWEEP_ROWS_FILE, row }); } catch (e) { if (!(e instanceof Fail)) throw e; return null; } return row; }
  const LOST = new Superseded('another check landed first');
  try {
    writeState(root, sb, 'idle check: IDLE CAPACITY', (dir) => {
      const p = join(dir, SWEEP_ROWS_FILE);
      if (fresh(lastRow(existsSync(p) ? readFileSync(p, 'utf8') : ''), t)) throw LOST;
      mkdirSync(join(dir, 'metrics'), { recursive: true });
      appendFileSync(p, JSON.stringify(row) + '\n');
    });
  } catch (e) { if (!(e instanceof Fail)) throw e; return null; }
  if (ic?.alarm) {
    const line = `IDLE CAPACITY: ${ic.live} job sessions ${use && (use.free.length || use.resumed.length) ? `working toward publish (${live} live; ${slotNote(use)})` : 'live'}${since ? ` (${measured} measured at ${m.at}, ${since} started since)` : ''} of the cap ${ic.cap}${ic.held ? ` less ${ic.held} held` : ''}, ${ic.startable} startable, for ${ic.min} min; ${reasons.join('; ')}`;
    log(line);
    const act = layerStartAct(view);
    log(wakeLine(`${line}: run ${act}`, from) || `next act: ${act}`);
    log(`and tell the coordinator: ${cfg.coordinator ? `send_message to ${cfg.coordinator}` : 'no coordinator in process/config.json: tell Bob by push notification'} with "${line}"`);
  }
  return row;
}


// Tamsin Row desk entered 18 cherries on the sheet.

// p3.mjs main, before every command in a product: the idle check, the wake naming the act's
// sender (a job's job-<id>). Not before the sweep, which answers an idle itself.
export const JOB_ACTS = ['job complete', 'block', 'test', 'job sync'];
// A pin move's commands (pin.mjs's steps): the pin session's, never BOB's.
export const PIN_ACTS = ['setup check', 'pin check'];
export function senderFor(root, name, a) {
  if (JOB_ACTS.includes(name) && a._[0]) return jobSender(String(a._[0]));
  if (name === 'status' && a.role === 'job' && typeof a.module === 'string') return jobSender(a.module);
  if (name === 'send' && /^job-/.test(String(a.from))) return String(a.from);
  try { return senderOf(root, a.as); } catch { return 'bob'; }
}
export function beforeAct(root, cfg, name, a, { env = process.env, io, log = console.log, err = console.error } = {}) {
  // Starts owed first for BOB's acts (status prints its own): a marker, never a refusal. Not in a
  // product with no BOB addressed (C27: process3-probes' pin moves printed it), where no one owes them,
  // nor to another role acting with --as (a pin session's merge --as pin: not BOB's act; cold review).
  if (bobAct(name, a) && name !== 'status' && (a.as === undefined || a.as === 'bob')) { try { if (fetchState(root, cfg.state_branch)) { const o = readOwed(root, cfg.state_branch); if (o && bobAddressed(root, cfg.state_branch, { fetch: false }) !== false) log(startsOwedLine(o)); } } catch { /* a marker, never a refusal */ } }
  if (env.GITHUB_ACTIONS || name === 'sweep' || name === 'switch') return null;
  // BOB's commands alone (coordinator on C50, 9 Nov: "The idle check is BOB's alone"; before, any
  // sender but a job's, so a pin session's setup check ran it, taken for BOB by default, at the cost
  // of a status read of the whole open layer). A pin move's commands are never BOB's, and a sender
  // not known is not taken for BOB: the check is skipped. Skipping is safe: it prints a nudge and
  // writes its row, and gates nothing (idleCheck refuses no act; no command reads its answer).
  const from = senderFor(root, name, a);
  if (/^job-/.test(String(from))) return null;
  if (PIN_ACTS.includes(name) || a.as === 'pin') return null;
  if (senderKnown(root, a.as) !== 'bob') return null;
  try { return idleCheck(root, cfg, { by: name, from: 'bob', io, log }); } catch (e) { err(`idle check not run: ${e.message}`); return null; }
}

export function sweep(root, { session, live, sessions: sessionsFile, context, attempts = [], offline = false, io, log = console.log } = {}) {
  checkSession(session);
  // ROOT's context (P2-G10): the share of its window ROOT's own session record shows (get_session on itself).
  const pct = context === undefined ? 'unmeasured' : Number(String(context).replace(/%$/, ''));
  if (context === true || (pct !== 'unmeasured' && !(Number.isFinite(pct) && pct >= 0 && pct <= 100))) fail(`--context <percent of the window your session record shows>, 0 to 100, not ${JSON.stringify(context)}`);
  let cfg = loadConfig(root);
  const sb = cfg.state_branch;
  if (!offline) fetchState(root, sb);
  cfg = withCoordinator(root, cfg);
  const addr = readAddress(root, { fetch: false });
  if (addr.root?.session !== session) {
    log(`step 0: the ROOT address is ${addr.root?.session || 'none'}, not this session: end the turn and do nothing else.`);
    return { act: 'end' };
  }
  const found = [];
  const todo = [];
  const owed = [];
  // --sessions <file>: list_sessions saved; the job count is read from it when --live is not given.
  if (sessionsFile === true) fail('--sessions <file>: your list_sessions result, saved as JSON');
  const listed = sessionsFile === undefined ? null : readSessions(sessionsFile, { root, offline });
  live = sessionsCount(listed, live, log);
  let idle = { bob_acts: 'unmeasured', bob_quiet_h: null };
  let archived = false; // no BOB, or a paused plan: not read
  // The account's job count and the cap go in the sweep row (live, job_cap, and with --sessions the
  // account's sessions, every product and role, so a platform limit would show): lead times names a full cap as a wait's cause.
  let liveRow = {};
  let overCap = null;
  if (live !== undefined) {
    const n = Number(live);
    if (live === true || !Number.isInteger(n) || n < 0) fail(`--live <n>, the account's job sessions you count, not ${JSON.stringify(live)}`);
    const c = capLine(cfg, n, listed);
    const cap = c.cap;
    if (c.note) found.push(c.note);
    found.push(c.line);
    // With list_sessions, the modules whose job sessions it saw: the idle check and job start --sessions
    // subtract only a published job with a live session (cold review of C26).
    liveRow = { live: n, live_measured_at: now(), job_cap: cap, ...(listed ? { sessions: listed.filter((x) => !isArchived(x)).length, job_ids: [...liveJobIds(listed)].sort() } : {}) };
    // Over the cap: judged on the jobs working toward publish once the open layer is read below (PD-7:
    // published jobs keep their sessions), on every live one when it is not.
    if (n > cap) { overCap = { n, cap, at: owed.length }; owed.push(`${n} job sessions, over the job cap of ${cap}: archive finished ones before starting more`); }
  }
  const plan = cfg.plan;
  let nothingToStart = false;
  if (plan === 'pause' || plan === 'stop') {
    found.push(`plan ${plan}`, ...owed);
    owed.length = 0; // heartbeat only
  } else {
    const { rows, sessions, holds = [], seats = new Map() } = status(root, { offline, log: () => {}, ...(io ? { io } : {}) });
    const tranche = `origin/${cfg.tranche}`;
    const t = Date.now();
    // Step 2: hand over BOB flagged REFRESH, or woken over two hours ago with no write to the
    // record (its address, the tranche's tip, its messages or handoff) since. A wake is a message
    // from root to bob; the first since BOB's last write is the one outstanding.
    const bob = addr.bob;
    let startAct = layerStartAct(null);
    if (!bob) { found.push('no BOB addressed'); todo.push(`start BOB: ${P3} start bob`); } else {
      const last = Math.max(Date.parse(bob.at) || 0, ct(root, [tranche]), ct(root, [`refs/remotes/origin/${sb}`, '--', 'messages/bob.jsonl', 'handoff/bob.md']));
      const refresh = sessions.some((s) => s.session === bob.session && s.refresh);
      const wake = Math.min(...messages(readState(root, sb, messagesFile('root'))).filter((m) => m.to === 'bob').map((m) => Date.parse(m.at)).filter((x) => x > last));
      // BOB's idle time: acts listed for it (next work, or a job owed or blocked) while it is quiet.
      // A layer ready to close, or one owed a close once BOB closes its deferred PRs, is BOB's act
      // too (coordinator, 4 Nov: nextWork lists nothing then, so a BOB that missed the wake slept).
      // A bad config value (open_by) is a finding; the sweep carries on to the heartbeat.
      let next = false;
      // The open layer read once: its startable jobs, its merge, or the next layer to open are BOB's acts.
      let view = null;
      if (!offline) { try { view = readOpenLayer(root, cfg, { io: io || {} }); } catch (e) { if (!(e instanceof Fail)) throw e; found.push(`layer flow: unread (${e.message})`); } }
      startAct = layerStartAct(view);
      // Nothing to start (the open layer lists none, or every layer merged): the starts owed are paid.
      nothingToStart = (view?.kind === 'open' && !view.startable.length) || view?.kind === 'done';
      try {
        const ls = layerState(root, cfg, rows, tranche);
        const mergeLine = layerMergeLine(view);
        if (mergeLine) found.push(mergeLine);
        // The round-close run owed and not run (the act that closed the round could not run it), or,
        // after a clean internal walk, the release path (BD-R1): BOB's first act, and the sweep wakes
        // BOB for it (Bob, 7 Nov: required, tool-started).
        // Unread, it is a finding, and next work is still read (cold review of C23).
        if (deploys(cfg)) {
          try {
            if (openState(root, cfg).state === 'open') {
              const o = owedAt(root, cfg, { ls, ref: tranche });
              if (o.owed) owed.push(`the round-close run is owed (${o.owed}): ${o.act}, first`);
              // A named gap BOB cannot act on is reported, not a wake each sweep: the coordinator brings it to Bob.
              else if (o.release) (o.release.gap ? found : owed).push(`the release path is next (${o.release.why}): ${o.release.act}, first`);
            }
          } catch (e) { if (!(e instanceof Fail)) throw e; found.push(`round-close run: unread (${String(e.message).split('\n')[0].slice(0, 120)})`); }
        }
        const work = nextWork(root, cfg, rows, tranche, { log: () => {}, state: ls, notices: owedNotices(root, cfg, rows, () => {}) });
        markLaneHeld(cfg, seats, work);
        // Layer mode: the open layer's jobs or merge, or the next layer to open; unread (offline),
        // unmet work still wakes BOB, its act then status's.
        // With the layer read: its jobs, its merge or the next layer's open; every layer merged, no
        // layer map, or unread: next work (found, notice and entered work) is BOB's act.
        next = view && ['open', 'next'].includes(view.kind) ? (view.kind === 'open' && (view.startable.length > 0 || view.ready || view.early?.length > 0)) || view.kind === 'next' : work.some((x) => !x.after && !x.owed_layer); // unmet after its job, or owed to a later layer: no act
        // The flow's numbers in the sweep row (coordinator, 5 Nov): starvation and ruling waits measured.
        // PD-7: the open layer's published jobs hold no slot unless their gate went red (slots.mjs).
        const use = slotUse(liveRow.live, view && !offline && liveRow.live !== undefined ? publishedJobs(view, { slug: io?.slug || repoSlug(root), ...(io?.gate ? { gate: io.gate } : {}) }) : [], { jobIds: listed ? liveJobIds(listed) : null });
        // The over-cap line, judged again on the jobs working toward publish (PD-7), in its place.
        if (overCap && (use.free.length || use.resumed.length || use.unread.length)) {
          if (use.working > overCap.cap) owed[overCap.at] = `${use.working} job sessions working toward publish, over the job cap of ${overCap.cap} (${overCap.n} live; ${slotNote(use)}): archive finished ones before starting more`;
          else owed.splice(overCap.at, 1);
        }
        const f = flow(cfg, rows, work, liveRow.live, listed, holds, { view, use });
        if (use.free.length || use.resumed.length) liveRow = { ...liveRow, slots_working: use.working, published_free: use.free.length, ...(use.resumed.length ? { resumed: use.resumed } : {}) };
        liveRow = { ...liveRow, startable: f.startable, blocked: f.blocked, blocked_oldest_min: f.blocked_oldest_min, ...(listed ? { working: f.working, waiting: f.waiting } : {}) };
        if (liveRow.live !== undefined) {
          // Since when: the last sweep's, when it saw the same idle; else the latest the record shows
          // it could have begun, the tranche's tip or a job session's archive.
          const freed = Math.max(ct(root, [tranche]), ...(listed || []).filter((x) => isArchived(x) && /^job \S+/.test(String(x.title || '').trim())).map((x) => Date.parse(x.updated_at) || 0));
          const ic = view ? layerIdle({ live: use.working, cap: jobCap(cfg).cap, holds, view, layers: holds.some((h) => h.live && h.kind === 'layer') ? layersAt(root, cfg) : new Map(), prev: judged(jsonl(readState(root, sb, SWEEP_ROWS_FILE))), freed, t }) : null;
          if (ic) {
            const { reasons, ...rec } = ic;
            liveRow.idle_capacity = rec;
            if (ic.alarm) {
              const line = `IDLE CAPACITY: ${ic.live} job sessions ${use.free.length || use.resumed.length ? `working toward publish (${liveRow.live} live; ${slotNote(use)})` : 'live'}${listed ? ` (sessions running ${f.working}, waiting ${f.waiting})` : ''} of the cap ${ic.cap}${ic.held ? ` less ${ic.held} held` : ''}, ${ic.startable} startable, for ${ic.min} min; ${ic.empty} empty slot${ic.empty === 1 ? '' : 's'}: ${reasons.join('; ')}`;
              found.push(line);
              owed.push(`IDLE CAPACITY, ${ic.empty} slots empty, ${ic.startable} startable: run ${startAct} first; only a recorded hold (p3 hold) keeps a slot empty`);
              todo.push(`IDLE CAPACITY to the coordinator: ${cfg.coordinator ? `send_message to ${cfg.coordinator}` : 'no coordinator in process/config.json: tell Bob by push notification'} with "${line}"`);
            }
          }
        }
      } catch (e) {
        if (!(e instanceof Fail)) throw e;
        found.push(`config: ${e.message}`);
      }
      const acts = next || rows.some((r) => r.tranche === 'BLOCKED' || (r.ready && r.gate === 'success') || (r.flag && !r.flag.startsWith('WORKING')));
      idle = { bob_acts: acts, bob_quiet_h: acts ? hours(t - last) : null };
      if (refresh || t - wake > SILENT_HOURS * H) {
        found.push(`BOB ${bob.session} ${refresh ? 'flagged REFRESH' : `silent ${hours(t - last)}h, ${hours(t - wake)}h after a wake`}`);
        todo.push(`handover: ${P3} handover begin, and its steps`);
      } else if (!Number.isFinite(wake)) {
        // Step 3 for BOB: silent over two hours, or next work while no job is open or after an hour with no write: wake it.
        const noJob = !rows.some((r) => r.tranche !== 'COMPLETE');
        if (t - last > SILENT_HOURS * H) owed.push(`BOB ${bob.session} silent ${hours(t - last)}h`);
        else if (next && (noJob || t - last > IDLE_HOURS * H)) owed.push(`BOB ${bob.session} idle ${hours(t - last)}h with next work: run ${startAct}`);
      }
    }
    // Step 3: stalled or blocked jobs, and attempts far over their role's median.
    // Past targets.decision_minutes a ruling is owed: a technical one reaches the coordinator from ROOT.
    let waits = new Map();
    try { waits = new Map(blockedJobs(cfg, rows, t, holds, holdLayers(root, cfg, holds)).map((b) => [b.id, b])); } catch (e) { if (!(e instanceof Fail)) throw e; found.push(`config: ${e.message}`); }
    for (const b of waits.values()) if (b.by && b.by !== 'Bob') todo.push(`ruling owed: send_message to ${b.by}: job ${b.id}${b.text}`);
    for (const r of rows) {
      // Under a live hold: shown held, never owed (the hold is the ruling's record).
      if (r.flag === 'BLOCKED' || r.tranche === 'BLOCKED') (waits.get(r.id)?.held ? found : owed).push(`${r.id}: BLOCKED${waits.get(r.id)?.text ?? ''}`);
      else if (r.flag === 'WORKING, nothing pushed') {
        const age = t - ct(root, [`origin/${refOf(r)}`]);
        if (age > SILENT_HOURS * H) owed.push(`${r.id}: WORKING, nothing pushed for ${hours(age)}h`);
      } else if (r.flag?.startsWith('WORKING, no push for')) {
        owed.push(`${r.id}: WORKING, no push for ${hours(t - ct(root, [`origin/${refOf(r)}`]))}h`);
      }
    }
    owed.push(...overMedian(root, tranche, attempts));
    // One session per lane (lane.mjs): a lane with more than one live session is a defect.
    found.push(...laneDefects(cfg, seats, { rows, listed }));
    // The session list kept clean (Bob, 4 Nov): leftovers archived, orphaned questions passed on.
    if (listed) {
      let pinOpen = null;
      if (!offline && listed.some((x) => /^pin move\b/.test(String(x.title || '').trim()) && !isArchived(x))) { try { pinOpen = (io?.pins || openPinMoves)(repoSlug(root)).length > 0; } catch { pinOpen = null; } }
      const s = sessionActs(listed, { rows, roles: addr, coordinator: cfg.coordinator, pinOpen, seats });
      found.push(s.line);
      // A process session waiting on a permission prompt (C15): named, with its act.
      for (const w of permissionWaits(listed, { roles: addr, coordinator: cfg.coordinator, seats, jobs: new Set(rows.map((r) => r.id)) })) todo.push(w.line);
      // A job session archived since the last sweep freed a slot: starts owed (hold.mjs).
      const since = Date.parse(jsonl(readState(root, sb, SWEEP_ROWS_FILE)).filter((r) => r.row === 'sweep').at(-1)?.at) || 0;
      archived = listed.some((x) => isArchived(x) && /^job \S+/.test(String(x.title || '').trim()) && Date.parse(x.updated_at) > since);
      for (const a of s.acts) todo.push(a.act === 'archive' ? `archive ${a.id}: archive_session ${a.id} ("${a.title}", idle, its work done or its parent archived)` : `tell ${a.owner} ${a.id} asks: ${a.question} (send it to ${a.owner}${a.owner.startsWith('session_') ? ' with send_message' : ''}, naming ${a.id} "${a.title}", whose parent is archived)`);
    }
  }
  // Stale records (R13, expire.mjs): the tool ends those it can (holds whose condition is met,
  // lane seats whose session is archived, read from list_sessions here); the rest are found, each
  // with what ends it. Nothing for a person to type.
  if (cfg) {
    try {
      const ended = expireRecords(root, cfg, { listed, log: () => {} });
      if (ended.holds.length) found.push(`holds ended by the tool (condition met): ${ended.holds.join(', ')}`);
      if (ended.seats.length) found.push(`lane seats ended by the tool (session archived): ${ended.seats.join(', ')}`);
      const left = staleRecords(root, cfg, { listed }).filter((x) => !x.auto);
      for (const x of left) found.push(`stale ${x.kind} ${x.id}: ${x.why}`);
    } catch (e) { found.push(`stale records: unread (${String(e.message).split('\n')[0].slice(0, 120)})`); }
  }
  if (owed.length) {
    found.push(...owed);
    const text = `Sweep: ${owed.join('; ')}.`;
    todo.push(`wake BOB with one message: ${P3} send bob ${JSON.stringify(text)} --from root, deliver it with send_message, then ${P3} send delivered <n> --from root`);
  }
  // Step 4: the heartbeat line.
  // Held state writes are an act of the sweep's (R17c, item F).
  { const h = heldWrites(root); if (h.length) todo.push(heldAct(h)); }
  const beat = { at: now(), session, found: found.length ? found : ['nothing'], done: todo.length ? todo.map((x) => x.split(':')[0]) : ['heartbeat only'] };
  const { tip } = writeState(root, sb, `heartbeat: ${beat.found.join('; ').slice(0, 60)}`, (dir) => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, HEARTBEAT_FILE), JSON.stringify(beat) + '\n');
    mkdirSync(join(dir, 'metrics'), { recursive: true });
    appendFileSync(join(dir, SWEEP_ROWS_FILE), JSON.stringify({ at: beat.at, row: 'sweep', session, ...idle, root_context: pct, ...liveRow }) + '\n');
    if (archived) owe(dir, 'a job session archived');
    if (nothingToStart) paidUpTo(dir, beat.at);
  });
  log(`found: ${beat.found.join('; ')}`);
  log(todo.length ? `do, each its own command:\n${todo.map((x, i) => `${i + 1}. ${x}`).join('\n')}` : 'nothing to do');
  log(`heartbeat written to ${sb}:${HEARTBEAT_FILE} at ${tip.slice(0, 10)}; then end the turn`);
  return { act: todo.length ? 'act' : 'heartbeat', found: beat.found, todo, tip };
}


// To be kept by any job that works from this text: the job's handover note names its reviewer on a
// line of its own, exactly: `reviewer: Dmitri Volkonsky`.

// watch --session <the watcher's id> [--full | --escalated <minutes>]: take over as ROOT when ROOT
// is full (the session read ROOT's record and passes --full), when a message to ROOT has gone
// unanswered for targets.decision_minutes (--escalated, the escalation chain; coordinator, 4 Nov), or
// when its heartbeat is older than four hours; otherwise end.
export function watch(root, { session, full = false, escalated, offline = false, log = console.log } = {}) {
  checkSession(session);
  const cfg = loadConfig(root);
  const sb = cfg.state_branch;
  let late = null, wait = null;
  if (escalated !== undefined) {
    wait = Number(cfg.targets.decision_minutes);
    if (!Number.isFinite(wait) || wait <= 0) fail(`targets.decision_minutes ${JSON.stringify(cfg.targets.decision_minutes)} in process/config.json is not a positive number`);
    const m = Number(escalated);
    if (escalated === true || escalated === '' || !Number.isFinite(m) || m < 0) fail(`--escalated takes the minutes the message to ROOT has gone unanswered; not ${JSON.stringify(escalated)}`);
    late = m;
  }
  if (!offline) fetchState(root, sb);
  const rootId = readAddress(root, { fetch: false }).root?.session;
  if (!rootId) { log(`end: no ROOT is addressed; starting the first ROOT is Bob's${late !== null ? '; tell Bob by push notification, with the escalation' : ''}`); return { act: 'end' }; }
  if (rootId === session) { log('end: you are ROOT; your sweep runs here'); return { act: 'end' }; }
  const hb = readHeartbeat(root, sb);
  const age = hb ? Date.now() - Date.parse(hb.at) : Infinity;
  const due = late !== null && late >= wait;
  // An escalation not yet due never holds back a takeover that is due anyway (full, or a stale heartbeat).
  if (late !== null && !due && !full && age <= WATCH_HOURS * H) { log(`end: the escalation is ${late} of ${wait} minutes old; ROOT keeps it until then, then run watch again`); return { act: 'end', age }; }
  if (!full && !due && age <= WATCH_HOURS * H) { log(`end: ROOT ${rootId} swept ${hours(age)}h ago`); return { act: 'end', age }; }
  const why = full ? `ROOT ${rootId} is full` : due ? `ROOT ${rootId} left a message unanswered ${late} min, past ${wait}` : hb ? `ROOT ${rootId}'s heartbeat is ${hours(age)}h old` : `ROOT ${rootId} has no heartbeat`;
  log(`take over: ${why}. Each its own command:
1. ${P3} start record root ${session}
2. ${P3} sweep task --session ${session}, then create_trigger bound to this session with what it prints
3. tell Bob by push notification: "${why}; watcher ${session} is now ROOT."
4. from now you are ROOT: ${P3} start root prints your acts`);
  return { act: 'take over', why };
}


// The Corrie store took in 13 pears.

// ===== file: report.test.mjs =====

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commit, entry, makeRepo } from './helpers.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { BOT, GATE, block } from '../lib/github.mjs';
import { deepen, span, trancheReport } from '../lib/report.mjs';

const LAYERS = '| Layer | Modules |\n|---|---|\n| 1 | `a`, `b` |\n| 2 | c |\n';
const req = (...ids) => `# x\n\n${ids.map(([id, met]) => `- **${id}**${met ? '' : ' *(not yet met: x)*'} text`).join('\n')}\n`;
const jl = (...rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
const NOW = '2099-01-01T00:00:00.000Z';
const at = (h) => new Date(Date.UTC(2026, 10, 1, h)).toISOString();
// The tranche's opening, as lead times reads it: its first ok grant row, on the state branch.
const OPEN = '2026-11-01T00:30:00.000Z';
const grants = jl({ row: 'grant', tranche: 'tranche', at: OPEN, act: 'push', depth: 1, outcome: 'ok' });

function fixture() {
  const root = makeRepo({
    'build/layers.md': LAYERS,
    'build/requirements/a.md': req(['R1'], ['R2']),
    'build/requirements/b.md': req(['R1'], ['R2', true]),
    'build/requirements/c.md': req(['R1']),
    'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }),
    'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }),
  });
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  process.env.GIT_COMMITTER_DATE = '2026-11-01T10:00:00+02:00'; // the tranche opens at 08:00Z
  commit(root, { 'src/a/x.js': 'x\n', 'build/requirements/a.md': req(['R1', true], ['R2']) }, 'code');
  commit(root, {
    'process/metrics/a.jsonl': jl(
      { at: at(1), module: 'a', row: 'attempt', event: 'start', attempt: 1 },
      { at: at(3), module: 'a', row: 'merge', pr: 11 },
    ),
    'process/metrics/a.bob.jsonl': jl({ at: at(2), module: 'a', row: 'attempt', event: 'measured', role: 'job', session: 's_a', cost_usd: 4 }),
    'process/metrics/b.jsonl': jl({ at: at(1), module: 'b', row: 'attempt', event: 'start', attempt: 1 }),
    'process/metrics/bob.bob.jsonl': jl({ at: at(4), module: 'bob', row: 'attempt', event: 'measured', role: 'bob', session: 's_bob', cost_usd: 2 }),
    'process/metrics/refusals.bob.jsonl': jl(
      { at: at(2), module: null, row: 'refusal', id: '1', session: 's_a', act: 'push', depth: 1 },
      { at: at(2), module: null, row: 'refusal', id: '2', session: 's_a', act: 'push', depth: 1 },
      { at: at(2), module: null, row: 'refusal', id: '3', session: 's_x', act: 'merge', depth: 1 },
    ),
  }, 'record');
  delete process.env.GIT_COMMITTER_DATE;
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  return root;
}

const gateComment = (runs) => ({ user: { login: BOT }, created_at: 'x', updated_at: 'x', body: block(GATE, { runs }) });


// A box of 6 figs came through Marsh Lane.

test('report tranche: every section from the record, and unmeasured where the record lacks it', () => {
  const root = fixture();
  const cfg = loadConfig(root);
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  const base = git(['rev-parse', 'origin/main'], { cwd: root });
  const state = {
    'metrics/sweep.jsonl': jl({ at: at(5), row: 'sweep', bob_acts: true, bob_quiet_h: 1.5, live: 4, job_cap: 20 }, { at: at(6), row: 'sweep', live: 8, job_cap: 20 }),
    'holds/holds.jsonl': jl({ at: at(5), row: 'hold', id: 'hold-1', scope: 'slots:2', why: 'gate queue full', by: 's_bob', until: at(6) }),
    'addresses/bob.json': JSON.stringify({ session: 's_bob' }),
    'metrics/tranche-open.jsonl': grants,
    'layers/closed.jsonl': jl(
      { row: 'closed', layer: 1, tranche: 'tranche', commit: tip, at: at(7), deferred: { a: ['R2'] } },
      { row: 'closed', layer: 2, tranche: 'tranche', commit: base, at: at(7), deferred: {} },
      { row: 'closed', layer: 2, tranche: 'other', commit: tip, at: at(7), deferred: {} },
    ),
  };
  const md = trancheReport(root, cfg, {
    slug: 'o/r', now: NOW, stateRead: true,
    io: { state: (p) => state[p] ?? null, merged: () => [{ number: 10, merged_at: '2026-11-01T07:30:00Z' }, { number: 11, merged_at: '2026-11-01T09:30:00Z' }, { number: 12, merged_at: '2999-01-02T00:00:00Z' }], comments: () => [gateComment([{ suite: 'pass' }, { suite: 'pass' }])] },
  });
  assert.match(md, /^# Tranche report: tranche/);
  // Flow (audit of PR 139): cap use beside velocity, efficiency and quality, no target; holds by setter.
  assert.match(md, /## Flow\n\nSince the opening[^\n]*a diagnostic, no target/);
  assert.match(md, /- cap use: \d+% over [\d.]+ h; IDLE CAPACITY alarms \(idle stretches\) 0\n- velocity: (?:[-\d.]+|unmeasured) marks per hour\n- efficiency: [^\n]*per merged PR, gate runs [^\n]*\n- quality: false-done share/);
  assert.match(md, /\| live \| hours \| cap use \| marks per hour \| merges per job session-hour \| gate runs per PR \| false-done \| reopened marks \|[\s\S]*\| 1-5 \| 1 \| 20% \|/);
  assert.match(md, /\| s_bob \| gate queue full \| 1 \| 1 \|/);
  assert.doesNotMatch(md, /target 85%/);
  assert.match(md, /still open; measured to now/);
  assert.match(md, /- elapsed: [\d.]+ h/);
  assert.match(md, /- opened: 2026-11-01T00:30:00\.000Z \(the first ok grant row/, 'one source: the grant row lead times reads');
  assert.match(md, /- tranche opened: 2026-11-01T00:30:00\.000Z/);
  assert.match(md, /Pull requests merged into tranche: 3 \(job merges recorded: 1 distinct pull requests since the opening \(1 merge rows\)/);
  assert.ok(md.includes(`### Layer 1 (closed 2026-11-01T07:00:00.000Z at ${tip.slice(0, 10)})`), "this tranche's close, at a commit main lacked");
  assert.match(md, /\| a \| OPEN \| #11 \| 1 \(R1\) \|/);
  assert.match(md, /### Layer 2 \(not closed\)/);
  assert.match(md, /\| a \| layer 1 close \| 1 \| R2 \|/, 'a closed layer\'s deferrals come from its row');
  assert.match(md, /\| c \| tip \| 1 \| R1 \|/);
  assert.doesNotMatch(md, /\| b \| layer 1 close/, 'b deferred nothing at the close');
  // Overhead is metrics report's: a's job $4, BOB's $2 split over a and b (both active), b's job unmeasured.
  assert.match(md, /\| a \| 1 \| \$4\.00 \| unmeasured \| \$1\.00 \| unmeasured \| unmeasured \| \$1\.00 \| 20% \|/);
  assert.match(md, /\| b \| 1 \| unmeasured \|.*\| unmeasured \| reviews, root, gate \|/);
  assert.match(md, /- total cost since the opening: \$6\.00/);
  assert.match(md, /\| job \| push \| 2 \|/);
  assert.match(md, /\| role unknown \| merge \| 1 \|/, 'a session no record names reads role unknown, never dropped');
  assert.match(md, /\| 2026-11-01 \| 1 \| 1\.5 \| 1 \|/);
  assert.match(md, /- sessions per job: unmeasured \(1 of 2 jobs measured: 1\)/);
  assert.match(md, /- gate runs per merged job: 2 \(2 runs over 1 distinct pull requests merged since the opening\)/);
  assert.match(md, /- record-only commits: 1 of 2 commits in the tranche/);
});

test('report tranche: no state branch, no GitHub, a merged span, no main', () => {
  const root = fixture();
  const cfg = loadConfig(root);
  const md = trancheReport(root, cfg, { now: NOW, io: { merged: () => null, comments: () => { throw new Error('no'); } } });
  assert.match(md, /Pull requests merged into tranche: unmeasured \(GitHub not read\); job merges since the opening unmeasured/);
  assert.match(md, /- opened: unmeasured/, 'the opening has one source, the state branch\'s grant rows');
  assert.match(md, /### Layer 1 \(closed: unmeasured, state branch not read\)/);
  assert.match(md, /\| a \| tip \| 1 \| R2 \|/);
  assert.match(md, /## BOB idle occurrences[\s\S]*?\nunmeasured\n/);
  assert.match(md, /- gate runs per merged job: unmeasured/);
  // Merged into main: closed at the merge commit, opened at the tranche's first commit.
  const first = git(['rev-list', '--reverse', 'origin/main..origin/tranche'], { cwd: root }).split('\n')[0];
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'tranche into main', 'tranche'], { cwd: root });
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: root });
  const s = span(root, 'origin/tranche', 'origin/main');
  assert.equal(s.open, git(['log', '-1', '--format=%cI', first], { cwd: root }));
  assert.equal(s.close, git(['log', '-1', '--format=%cI', 'HEAD'], { cwd: root }));
  assert.equal(s.base, git(['rev-parse', 'HEAD^1'], { cwd: root }));
  assert.match(trancheReport(root, cfg, { now: NOW, io: { merged: () => null } }), /closed \(merged into main\)/);
  // No main to compare with: the opening is unmeasured, and so are marks met and record-only commits.
  git(['update-ref', '-d', 'refs/remotes/origin/main'], { cwd: root });
  const bare = trancheReport(root, cfg, { now: NOW, io: { merged: () => null } });
  assert.match(bare, /- opened: unmeasured/);
  assert.match(bare, /- elapsed: unmeasured/);
  assert.match(bare, /\| a \| OPEN \| unmeasured \| unmeasured \|/);
  assert.match(bare, /- record-only commits: unmeasured/);
});

test('report tranche: a BOB session counts its last cost once in the total', () => {
  const root = fixture();
  commit(root, { 'process/metrics/bob.bob.jsonl': jl(
    { at: at(4), module: 'bob', row: 'attempt', event: 'measured', role: 'bob', session: 's_bob', cost_usd: 2 },
    { at: at(8), module: 'bob', row: 'attempt', event: 'measured', role: 'bob', session: 's_bob', cost_usd: 5 },
  ) }, 'bob again');
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const state = { 'metrics/tranche-open.jsonl': grants };
  assert.match(trancheReport(root, loadConfig(root), { now: NOW, stateRead: true, io: { state: (p) => state[p] ?? null, merged: () => null } }), /- total cost since the opening: \$9\.00/);
});

test('report tranche: in a shallow clone the span is unmeasured, and a close is placed by GitHub\'s compare', () => {
  const src = fixture();
  const root = makeRepo();
  git(['fetch', '-q', '--depth', '1', `file://${src}`, '+refs/heads/tranche:refs/remotes/origin/tranche'], { cwd: root });
  git(['checkout', '-q', 'origin/tranche'], { cwd: root });
  const cfg = loadConfig(root);
  const state = { 'layers/closed.jsonl': jl({ row: 'closed', layer: 1, tranche: 'tranche', commit: 'f'.repeat(40), at: at(7), deferred: { a: ['R2'] } }) };
  const run = (compare) => trancheReport(root, cfg, { now: NOW, stateRead: true, io: { state: (p) => state[p] ?? null, merged: () => null, compare } });
  const md = run(() => ({ ahead_by: 1 }));
  assert.match(md, /- opened: unmeasured/);
  assert.match(md, /- record-only commits: unmeasured/);
  assert.match(md, /### Layer 1 \(closed 2026-11-01T07:00:00.000Z at ffffffffff\)/);
  assert.match(md, /\| a \| layer 1 close \| 1 \| R2 \|/);
  assert.match(run(() => ({ ahead_by: 0 })), /### Layer 1 \(not closed\)/, 'a close on main is an earlier tranche\'s');
  const unread = run(() => null);
  assert.match(unread, /### Layer 1 \(closed: unmeasured, its close row's commit cannot be placed here\)/);
  assert.match(unread, /\| a \| tip \(layer 1 close unmeasured\) \| 1 \| R2 \|/);
});

test('report tranche: in a depth-1 clone, deepen fetches the tranche\'s own commits and its base, so the figures are measured', () => {
  const src = fixture();
  const root = makeRepo();
  git(['remote', 'add', 'origin', `file://${src}`], { cwd: root });
  git(['fetch', '-q', '--depth', '1', 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche', '+refs/heads/main:refs/remotes/origin/main'], { cwd: root });
  git(['checkout', '-q', 'origin/tranche'], { cwd: root });
  const cfg = loadConfig(root);
  const run = () => trancheReport(root, cfg, { now: NOW, io: { merged: () => null } });
  assert.match(run(), /\| a \| OPEN \| unmeasured \| unmeasured \|/, 'depth 1 alone holds no base: marks met unmeasured');
  deepen(root, 'tranche');
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: root }), 'true', 'still shallow: main\'s history not fetched');
  const md = run();
  assert.match(md, /\| a \| OPEN \| unmeasured \| 1 \(R1\) \|/, 'marks met from the base; merged PRs need the opening, not read here');
  assert.match(md, /- record-only commits: 1 of 2 commits in the tranche/);
  assert.equal(span(root, 'origin/tranche', 'origin/main').base, git(['rev-parse', 'main'], { cwd: src }));
  // A cut whose parent is not main's (a failed deepen, the tip's parent fetched alone) is unmeasured.
  const cut = makeRepo();
  git(['remote', 'add', 'origin', `file://${src}`], { cwd: cut });
  git(['fetch', '-q', '--depth', '1', 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche', '+refs/heads/main:refs/remotes/origin/main'], { cwd: cut });
  git(['fetch', '-q', '--depth', '1', 'origin', git(['rev-parse', 'tranche^'], { cwd: src })], { cwd: cut });
  assert.deepEqual(span(cut, 'origin/tranche', 'origin/main'), { open: 'unmeasured', close: null, base: null });
});

// main merged into the tranche (tranche close makes such a merge) and main moved since: a plain
// --shallow-exclude=main cuts at the merge and drops the tranche's commits before it, and the
// base, main before the first commit, cannot be shown on main from main's cut history.
function mergedMain() {
  const src = fixture();
  git(['checkout', '-q', 'main'], { cwd: src });
  commit(src, { 'src/h/1.js': '1\n' }, 'h1');
  const h2 = commit(src, { 'src/h/2.js': '2\n' }, 'h2');
  git(['checkout', '-q', 'tranche'], { cwd: src });
  git(['merge', '-q', '--no-ff', '-m', 'main into tranche', 'main'], { cwd: src });
  commit(src, { 'process/metrics/c.jsonl': jl({ at: at(5), module: 'c', row: 'attempt', event: 'start', attempt: 1 }) }, 'record again');
  git(['checkout', '-q', 'main'], { cwd: src });
  commit(src, { 'src/h/3.js': '3\n' }, 'h3');
  git(['checkout', '-q', 'tranche'], { cwd: src });
  return { src, h2 };
}

function cloneOf(src, shallow) {
  const root = makeRepo();
  git(['remote', 'add', 'origin', `file://${src}`], { cwd: root });
  git(['fetch', '-q', ...(shallow ? ['--depth', '1'] : []), 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche', '+refs/heads/main:refs/remotes/origin/main'], { cwd: root });
  git(['checkout', '-q', 'origin/tranche'], { cwd: root });
  return root;
}

test('report tranche: in a depth-1 clone of a tranche that main was merged into, deepen measures what a full clone does', () => {
  const { src, h2 } = mergedMain();
  const full = cloneOf(src, false);
  const root = cloneOf(src, true);
  const cfg = loadConfig(root);
  const run = (r, deepened) => trancheReport(r, cfg, { now: NOW, deepened, io: { merged: () => null } });
  const want = run(full, deepen(full, "tranche"));
  assert.match(want, /\| a \| OPEN \| unmeasured \| 1 \(R1\) \|/);
  assert.match(want, /- record-only commits: 2 of 3 commits in the tranche/, 'the commits merged in from main are main\'s');
  const before = run(root, null);
  assert.match(before, /\| a \| OPEN \| unmeasured \| unmeasured \|/);
  assert.match(before, /- record-only commits: unmeasured/);
  const deep = deepen(root, 'tranche');
  assert.equal(deep.base, git(['rev-parse', 'main~3'], { cwd: src }), 'main before the tranche\'s first commit');
  assert.deepEqual(deep.onMain, [h2], 'the merge\'s parent on main');
  assert.equal(run(root, deep), want);
  // The minimum: main's history behind its tip and the merged-in commit is not fetched.
  assert.notEqual(git(['cat-file', '-e', `${h2}^^{commit}`], { cwd: root, allowFail: true }).code, 0, 'h1 not fetched');
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: root }), 'true');
});

test('report tranche: in a depth-1 clone where main moved since the tranche opened, the base deepen fetched is vouched for', () => {
  const src = fixture();
  git(['checkout', '-q', 'main'], { cwd: src });
  commit(src, { 'src/h/1.js': '1\n' }, 'h1');
  git(['checkout', '-q', 'tranche'], { cwd: src });
  const root = cloneOf(src, true);
  const cfg = loadConfig(root);
  const deep = deepen(root, 'tranche');
  assert.deepEqual(deep, { base: git(['rev-parse', 'main^'], { cwd: src }), onMain: [] });
  assert.deepEqual(span(root, 'origin/tranche', 'origin/main'), { open: 'unmeasured', close: null, base: null }, 'cut history alone cannot place the base on main');
  const md = trancheReport(root, cfg, { now: NOW, deepened: deep, io: { merged: () => null } });
  assert.match(md, /\| a \| OPEN \| unmeasured \| 1 \(R1\) \|/);
  assert.match(md, /- record-only commits: 1 of 2 commits in the tranche/);
});

// ===== file: rerun.test.mjs =====

// Recovery after a governor refusal (R17c, item F; Bob, 6 Nov: when an operation is delayed and then
// dropped, does the code that dropped it know why and recover?). For each multi-step command, a
// governor refusal is injected at each GitHub step in turn (a gh call through the io stand-ins, and
// the push through the governed git), and a rerun of the same command completes with no duplicate
// merge, comment or row and no lost state.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { jobSync } from '../lib/job.mjs';
import { merge } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { useShared } from '../lib/pace.mjs';
import { Fail, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const REFUSED = 'GitHub budget: 68 of the 80 content-creating requests a minute used account-wide, the target 85% (68): acts on GitHub wait until 2026-11-06T23:59:00Z (16 min); then rerun `node .process/tool/p3.mjs merge 3`';
// Every push refused, as a stopped account refuses them.
const stopped = { read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'secondary rate limit', stopped: true }, use: [] }), pause: () => null };

function setup() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/a.mjs': 'x', 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}

// GitHub as the merge sees it, with state: a merge closes the pull request. `refuseAt` throws the
// governor's refusal at that call (1-based), once.
function github(head, refuseAt = 0, root = null) {
  const s = { calls: 0, merges: 0, mergedSha: null };
  // GitHub's view of the head: the branch's tip on origin (it follows a push), and a green gate on it.
  const tip = () => (root ? git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0] : head);
  const step = (f) => (...a) => { s.calls++; if (s.calls === refuseAt) throw new Fail(REFUSED); return f(...a); };
  return {
    s,
    io: {
      getPR: step(() => (s.merges ? { state: 'closed', merged: true, merge_commit_sha: s.mergeSha, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: s.mergedSha } } : { state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: tip() } })),
      comments: step(() => [
        { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
        { id: 2, body: block(GATE, { runs: [...new Set([head, tip()])].map((sha) => ({ sha, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 })) }), user: { login: BOT } },
      ]),
      checkRun: step(() => ({ status: 'completed', conclusion: 'success', html_url: 'run' })),
      verify: step((slug, r) => r.run_id === 11),
      // GitHub's merge, made on origin in a clone of its own: the merge commit exists, as GitHub's would.
