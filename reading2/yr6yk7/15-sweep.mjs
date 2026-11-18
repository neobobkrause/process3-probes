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

