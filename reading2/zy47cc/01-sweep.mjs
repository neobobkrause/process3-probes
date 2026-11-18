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

// Jobs working from this file, take note: the job's handover note carries, on a line of its own,
// exactly: `desk: ostler`.

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
