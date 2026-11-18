// ===== file: sweep.mjs (continued) =====

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

// ===== file: checks.mjs =====

// The gate's checks for one job (ARC-1, ARC-4, JOB-8, GAT-4), each driven by process/config.json;
// nothing here names a product (PLN-7).
import { existsSync } from 'node:fs';
import { join, posix } from 'node:path';
import { CONFIG_FILE, NO_TOKENS, exists, git, run, underPath } from './util.mjs';
import { normPath } from './suite.mjs';

const lineOf = (text, i) => text.slice(0, i).split('\n').length;
const CODE = /\.(m|c)?(j|t)sx?$/;
// Static specifiers only: import ... from, bare import, export ... from, import('x'), require('x').
const SPEC = [
  /\bimport\s+(?:[^'"`;()]*?\s*from\s*)?(['"])([^'"\n]+)\1/g,
  /\bexport\s+[^'"`;()]*?\s*from\s*(['"])([^'"\n]+)\1/g,
  /\bimport\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g,
  /\brequire\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g,
];
export function specifiers(text) {
  const out = new Map();
  for (const re of SPEC) for (const m of text.matchAll(re)) out.set(m.index, { spec: m[2], line: lineOf(text, m.index) });
  return [...out.values()].sort((a, b) => a.line - b.line);
}

// The module owning a repository path: the most specific path prefix (a file entry also owns its
// extensionless import).
export function ownerOf(modules, path) {
  let best = null;
  let len = -1;
  for (const m of modules) {
    for (const p of [...(m.paths || []), ...(m.tests || [])].map(normPath)) {
      const hit = p === '.' || underPath(path, p) || p.replace(/\.[^/.]+$/, '') === path;
      if (hit && p.length > len) { best = m; len = p.length; }
    }
  }
  return best;
}

// ARC-1: every import from the job's added or changed code files is the file's own module or one
// it declares in `uses`. modules_file is read at the base; absent, the check is skipped.
export function importFindings(root, cfg, { base, head, entry, changed }) {
  if (!cfg.modules_file) return { skipped: 'no modules_file in process/config.json; the imports check is skipped', findings: [] };
  if (!exists(root, base, cfg.modules_file)) return { skipped: `${cfg.modules_file} is not on the base; the imports check is skipped`, findings: [] };
  let modules;
  try { modules = JSON.parse(git(['show', `${base}:${cfg.modules_file}`], { cwd: root })).modules; } catch { modules = null; }
  if (!Array.isArray(modules)) return { findings: [{ check: 'imports', file: cfg.modules_file, line: 1, message: `${cfg.modules_file} at the base has no "modules" list` }] };
  const findings = [];
  const files = changed.filter((f) => CODE.test(f) && entry.paths.some((p) => underPath(f, p)) && exists(root, head, f));
  for (const file of files) {
    const own = ownerOf(modules, file);
    if (!own) continue;
    for (const { spec, line } of specifiers(git(['show', `${head}:${file}`], { cwd: root }))) {
      if (!spec.startsWith('./') && !spec.startsWith('../')) continue; // a package, not a module
      const to = ownerOf(modules, posix.normalize(posix.join(posix.dirname(file), spec)));
      if (!to || to.id === own.id || (own.uses || []).includes(to.id)) continue;
      findings.push({ check: 'imports', file, line, module: own.id, imports: to.id, message: `${own.id} imports ${to.id} ('${spec}'), which is not in its uses` });
    }
  }
  return { findings };
}

const isArgv = (a) => Array.isArray(a) && a.length > 0 && a.every((s) => typeof s === 'string');
// The `generated` rows, and a finding for each malformed one.
export function generatedRows(cfg) {
  const rows = cfg.generated || [];
  const ok = Array.isArray(rows) ? rows.filter((r) => Array.isArray(r?.paths) && r.paths.every((p) => typeof p === 'string') && isArgv(r.regenerate) && isArgv(r.verify)) : [];
  const findings = ok.length === (Array.isArray(rows) ? rows.length : -1) ? []
    : [{ check: 'generated', file: CONFIG_FILE, line: 1, message: '"generated" must be a list of {"paths": [..], "regenerate": [argv], "verify": [argv]}' }];
  return { rows: ok, findings };
}

// JOB-8: a job commits no generated artifact, even inside its own module's paths.
export function committedGenerated(root, rows, { head, changed }) {
  const findings = [];
  for (const f of changed) {
    const row = rows.find((r) => r.paths.some((p) => underPath(f, normPath(p))));
    if (row && exists(root, head, f)) findings.push({ check: 'generated', file: f, line: 1, message: `${f} is a generated artifact; a job does not commit it. It is regenerated by: ${row.regenerate.join(' ')}` });
    // A job removing a committed generated file would move it to built-not-committed without
    // BOB's plain pull request, and the gate would then build it (review of PR 80).
    else if (row) findings.push({ check: 'generated', file: f, line: 1, message: `${f} is a committed generated artifact; a job does not remove it. Whether it is committed is BOB's plain pull request` });
  }
  return findings;
}

// Whether a file lies under one of the `generated` rows' paths.
export const isGenerated = (rows, f) => rows.some((r) => r.paths.some((p) => underPath(f, normPath(p))));

// A plain pull request that refreshes committed generated files (copy PR 148, 4 Nov: the six
// dist/*.bundle.json manifests): the gate removes each file the pull request changed under the
// generated paths, regenerates, and each must then be byte for byte what the regenerate wrote from
// its commit (tracked at the commit, no difference from it, nothing untracked). A refresh changes
// nothing else but records: any other file could be the generator or something it imports, and a
// clean regenerate by a changed generator proves nothing (reviews of PR 95). ran: whether this run
// regenerated the rows; failed: a generated row's build, regenerate or verify failed in this run
// (its finding stands). Returns the row's record, { files, result, differ }, and findings.
// A changed record counts as inert only when it lies outside every module's paths and tests
// (entries: the base's ledger) and is no file a row's commands name; the generated paths are
// compared anyway. Residual: a record a generator reads without naming it (review 3 of PR 95).
// ignores: the .gitignore files an untracking adds its ignore lines to (ignoreLines), not others.
// also: the requirements files of modules the change adds (gate.mjs addedRequirements, C22), which go
// beside the new module's row, ledger entry and layer line in one pull request; a file a row names
// stays refused.
export function refreshOthers(cfg, rows, changed, entries = [], ignores = [], { also = [] } = {}) {
  const named = new Set(rows.flatMap((r) => [...r.regenerate.slice(1), ...r.verify.slice(1)]).map((a) => normPath(a)));
  const inModule = (f) => entries.some((e) => [...(e.paths || []), ...(e.tests || [])].some((p) => underPath(f, normPath(p))));
  // Beside a refresh go only records, the modules file, the layers file and process/config.json (the
  // coordinator's ruling (A), 6 Nov: modules.json gained rows and order.mjs could be refreshed
  // neither in the same pull request nor before it); any other file (a module's own, a generator
  // its row names or one it imports) could be what writes them.
  const beside = new Set([CONFIG_FILE, cfg.modules_file, cfg.layers_file, ...also].filter(Boolean).map((x) => normPath(x)));
  return changed.filter((f) => !isGenerated(rows, f) && !ignores.includes(f) && (!(cfg.records.some((r) => underPath(f, r)) || beside.has(f)) || inModule(f) || named.has(f)));
}


// Note for jobs, in force until withdrawn: the job's handover note names its reviewer on a line of
// its own, exactly: `reviewer: Dmitri Volkonsky`.

// Untracking a committed generated file (build untrack-generated, 4 Nov: copy PR 306 could not
// stop committing a module's generated src/case-checker/program.mjs, 6.9 MB, over max_file_bytes and stale).
// A plain pull request may remove a file under a `generated` row when the head's .gitignore
// ignores it; the gate builds it (buildGenerated) and runs its row's verify. A job still may not
// (committedGenerated, JOB-8). removedGenerated: the generated files the head no longer tracks.
export const removedGenerated = (root, rows, changed, head) => changed.filter((f) => isGenerated(rows, f) && !exists(root, head, f));
// The .gitignore files an untracking changes, and only those: each at the root or in a parent
// directory of a file it untracks, at `to`, its change only adding lines, and each added line the
// path of one of `files` from that directory (`a/b.mjs` or `/a/b.mjs`), a blank line or a comment.
// Any other .gitignore change is another file, as before (review of PR 2 of build untrack-generated:
// a wider pattern could change what a generator that honours .gitignore lists).
export function ignoreLines(root, from, to, changed, files) {
  return changed.filter((f) => {
    if (posix.basename(f) !== '.gitignore' || !exists(root, to, f)) return false;
    if (!/^\d+\t0\t/.test(git(['diff', '--numstat', '--no-renames', from, to, '--', f], { cwd: root }))) return false;
    const dir = posix.dirname(f) === '.' ? '' : `${posix.dirname(f)}/`;
    // Only names git reads literally; a line names one file only when anchored: a leading slash,
    // or a slash inside it (a bare name matches at every depth: confirming review).
    const mine = files.filter((x) => x.startsWith(dir) && !/[*?[\\]|^[!#]|(^|\/)\s|\s$/.test(x.slice(dir.length))).map((x) => x.slice(dir.length));
    const ok = (l) => l === '' || l.startsWith('#') || mine.includes(l.slice(1)) && l.startsWith('/') || l.includes('/') && mine.includes(l);
    const diff = git(['diff', '-U0', '--no-renames', from, to, '--', f], { cwd: root }).split('\n');
    const added = diff.slice(diff.findIndex((l) => l.startsWith('@@'))).filter((l) => l.startsWith('+')).map((l) => l.slice(1).trim());
    return mine.length > 0 && added.every(ok);
  });
}
// Whether the checkout's .gitignore files ignore f (the gate's checkout is the head merged).
export const ignoredHere = (root, f) => git(['check-ignore', '-q', '--no-index', '--', f], { cwd: root, allowFail: true }).code === 0;
// The untracked files' rows' verify commands, once a row, after the build and regenerate; each
// file must be on disk. Returns findings.
// verified: rows whose verify regenerate already ran on this tree (PD-9: every built row), each
// with its exit; not run twice.
export function verifyUntracked(root, rows, files, { timeout, exec = run, verified = new Map(), log = () => {} }) {
  const findings = [];
  for (const f of files) if (!existsSync(join(root, f))) findings.push({ check: 'generated', file: f, line: 1, message: `${f} is untracked by this pull request, but the gate's build did not write it` });
  for (const r of rows.filter((x) => files.some((f) => isGenerated([x], f)))) {
    if (verified.has(r)) { log(`generated, untracked and built: ${r.paths.join(', ')}: ${r.verify.join(' ')}: exit ${verified.get(r)} (run once, with the built rows)`); continue; }
    const v = exec(r.verify[0], r.verify.slice(1), { cwd: root, timeout, unset: NO_TOKENS });
    log(`generated, untracked and built: ${r.paths.join(', ')}: ${r.verify.join(' ')}: exit ${v.code}`);
    if (v.code !== 0) findings.push({ check: 'generated', file: r.paths[0], line: 1, message: `${r.verify.join(' ')} failed (exit ${v.code}) after building the untracked ${files.filter((f) => isGenerated([r], f)).join(', ')}: ${tail(v)}` });
  }
  return findings;
}

// untracked: the removed files the head's .gitignore ignores; verifyUntracked judged them.
export function refreshCheck(root, files, { ran, failed = false, others = [], untracked = [] }) {
  if (!files.length) return { refresh: null, findings: [] };
  const F = (file, message) => ({ check: 'generated', file, line: 1, message });
  if (others.length) return { refresh: { files, result: 'other files changed', differ: [] }, findings: [F(others[0], `the pull request changes generated module files and ${others.slice(0, 5).join(', ')}: a refresh may go beside only records, the modules file, the layers file and process/config.json; any other file could be what writes them`)] };
  if (!ran) return { refresh: { files, result: 'not regenerated', differ: [] }, findings: [F(files[0], `the pull request changes generated files (${files.slice(0, 5).join(', ')}), but this run regenerated nothing to compare them with`)] };
  const differ = files.filter((f) => !untracked.includes(f) && (!exists(root, 'HEAD', f)
    || git(['status', '--porcelain', '-z', '--untracked-files=all', '--', f], { cwd: root }) !== ''));
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
    earlier = true;
    const g = exec(r.regenerate[0], r.regenerate.slice(1), opts());
    if (g.code !== 0) {
      findings.push({ check: 'generated', file: r.paths[0], line: 1, message: `${r.regenerate.join(' ')} failed (exit ${g.code}): ${tail(g)}` });
      log(`${r.regenerate.join(' ')} failed (exit ${g.code}):\n${lastLines(g)}`);
    }
  }
  const vEnd = Date.now() + timeout;
  const vLeft = () => Math.max(1000, vEnd - Date.now());
  for (const r of rows) {
    const changed = status(r) !== '';
    const committed = new Set(committedPaths(root, 'HEAD', r));
    const built = verifyBuilt && r.paths.some((p) => !committed.has(p)) && !(unbuilt.has(r) && skip.has(r) && !changed);
    const row = { paths: r.paths, changed, verify: null, ...(built ? { built: true } : {}) };
    if (changed || built) {
      const v = verifyGenerated(root, r, { how: changed ? 'regenerating' : 'building', timeout: vLeft(), exec, findings, log });
      row.verify = v.code;
    }
    if (changed) {
      const st = staleFiles(root, r).filter((x) => !judged.includes(x));
      if (st.length) row.stale = st;
      if (stale) for (const f of st) findings.push({ check: 'generated', file: f, line: 1, message: `${f} is stale at this commit: run ${r.regenerate.join(' ')} and commit it in this PR` });
      else for (const f of st) log(`generated, stale: ${f} differs from this commit after ${r.regenerate.join(' ')}`);
    }
    // Every row the gate row's generated lists, in the log too (run 41883960626 logged only the built rows).
    log(`generated, regenerated: ${r.paths.join(', ')}: ${changed ? `changed, ${r.verify.join(' ')}: exit ${row.verify}` : built ? `built, ${r.verify.join(' ')}: exit ${row.verify}` : 'unchanged'}`);
    ran.push(row);
  }
  return { findings, ran };
}

// A row's verify, without the GitHub tokens; a failure is a 'generated' finding naming the command and
// its tail (regenerate's and a lane pull request's built rows alike, PD-9).
export function verifyGenerated(root, r, { how, timeout, exec = run, findings, log = () => {} }) {
  const v = exec(r.verify[0], r.verify.slice(1), { cwd: root, timeout, unset: NO_TOKENS });
  if (v.code !== 0) {
    findings.push({ check: 'generated', file: r.paths[0], line: 1, message: `${r.verify.join(' ')} failed (exit ${v.code}) after ${how}: ${tail(v)}` });
    log(`${r.verify.join(' ')} failed (exit ${v.code}) after ${how} ${r.paths.join(', ')}:\n${lastLines(v)}`);
  }
  return v;
}

// The tracked files of a row's committed paths that differ from HEAD after its regenerate, modified
// or deleted; an untracked file there (a suite's scratch output, a built file beside committed
// ones) is not one (cold review).
export function staleFiles(root, r) {
  const mine = committedPaths(root, 'HEAD', r);
  if (!mine.length) return [];
  return git(['diff', '--name-only', '-z', 'HEAD', '--', ...mine.map(normPath)], { cwd: root }).split('\0').filter(Boolean);
}

// Generated files over max_file_bytes (build of 4 Nov: rows.mjs 5.2 MB, two bundles 8.9 and 29 MB
// on the copy) can never be refreshed by a pull request, since the record check refuses any
// commit that writes one. The line chosen: such a file is not committed at all; it is built at
// deploy and release. A `generated` path is committed when the ref tracks a file at or under it.
// committedPaths: the row's paths the ref tracks; the others are built, never compared.
const tracked = (root, ref, p) => git(['ls-tree', '-r', '--name-only', '-z', ref, '--', normPath(p)], { cwd: root, allowFail: true }).stdout.split('\0').filter(Boolean);
export const committedPaths = (root, ref, row) => row.paths.filter((p) => tracked(root, ref, p).length > 0);

// The generated paths a commit does not track: built, not committed (deploy dev and release run
// build them before their own steps). Each row with one is regenerated, from the root, without
// the GitHub tokens, within the timeout in all; a failed regenerate is a finding.
export function buildGenerated(root, rows, { ref = 'HEAD', timeout, exec = run, log = () => {} } = {}) {
  const end = Date.now() + timeout;
  const findings = [];
  const built = [];
  const ran = new Set(); // the rows whose regenerate ran, built or failed
  const failed = new Set(); // of those, the ones whose regenerate failed
  for (const r of rows) {
    const have = new Set(committedPaths(root, ref, r));
    const paths = r.paths.filter((p) => !have.has(p));
    if (!paths.length) continue;
    ran.add(r);
    const g = exec(r.regenerate[0], r.regenerate.slice(1), { cwd: root, timeout: Math.max(1000, end - Date.now()), unset: NO_TOKENS });
    log(`generated, built (not committed): ${paths.join(', ')}: ${r.regenerate.join(' ')}: exit ${g.code}, ${Math.round(g.seconds ?? 0)} s`);
    if (g.code !== 0) {
      findings.push({ check: 'generated', file: paths[0], line: 1, message: `${r.regenerate.join(' ')} failed (exit ${g.code}) building ${paths.join(', ')}: ${tail(g)}` });
      log(lastLines(g));
      failed.add(r);
    } else built.push(...paths);
  }
  return { findings, built, ran, failed };
}

// Committed generated files over max_file_bytes at the ref: [{ file, bytes }].
export function oversizeGenerated(root, rows, ref, max) {
  const out = [];
  for (const r of rows) for (const p of r.paths) {
    const ls = git(['ls-tree', '-r', '-l', '-z', ref, '--', normPath(p)], { cwd: root, allowFail: true }).stdout.split('\0').filter(Boolean);
    for (const l of ls) {
      const [meta, file] = l.split('\t');
      const bytes = Number(meta.trim().split(/\s+/)[3]);
      if (Number.isFinite(bytes) && bytes > max && !out.some((x) => x.file === file)) out.push({ file, bytes });
    }
  }
  return out;
}

// ARC-4: the entry's own `checks`, run from the root as job complete runs them.
export function entryChecks(root, entry, { timeout, exec = run, log = () => {} }) {
  const findings = [];
  for (const c of entry.checks || []) {
    const r = exec(c[0], c.slice(1), { cwd: root, timeout, unset: NO_TOKENS });
    if (r.code !== 0) {
      findings.push({ check: 'checks', file: entry.paths[0], line: 1, module: entry.id, message: `${c.join(' ')} failed (exit ${r.code}): ${tail(r)}` });
      log((r.stdout + r.stderr).split('\n').slice(-40).join('\n'));
    }
  }
  return findings;
}

// A lane-only pull request's checks (laneChecks), run where the suite would be: each that fails is
// a finding on the lane's folder. { findings, ran: [{ cmd, exit }] }.
export function laneCheckRun(root, lane, dir, cmds, { timeout, exec = run, log = () => {} }) {
  const findings = [];
  const ran = [];
  for (const c of cmds) {
    const r = exec(c[0], c.slice(1), { cwd: root, timeout, unset: NO_TOKENS });
    ran.push({ cmd: c.join(' '), exit: r.code, ...(r.timedOut ? { timed_out: true } : {}) });
    if (r.code !== 0) {
      findings.push({ check: 'lane-checks', file: dir || '(lane)', line: 1, message: `lane ${lane}'s check ${c.join(' ')} ${r.timedOut ? `timed out (${Math.round(timeout / 60000)} min)` : `failed (exit ${r.code})`}: ${tail(r)}` });
      log((r.stdout + r.stderr).split('\n').slice(-40).join('\n'));
    } else log(`lane ${lane}: ${c.join(' ')} passed`);
  }
  return { findings, ran };
}

// ===== file: base-red-age.test.mjs =====

// status --role bob (Bob, 4 Nov): every test tolerated as base-red on the tranche, with its module
// and its age since the first gate row that tolerated it, oldest first. Report only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commit, makeRepo, onState } from './helpers.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { BOT, GATE, block } from '../lib/github.mjs';
import { baseRedAges } from '../lib/status.mjs';

const jl = (...rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
const at = (h) => new Date(Date.UTC(2026, 10, 1, h)).toISOString();
const red = (module, ...tests) => ({ module, base: 'b0', tests });
const row = (h, over) => ({ at: at(h), ok: true, trigger: 'code', ...over });

test('base-red ages: once per test, from its first tolerating row on any merged PR, oldest first; merges before the opening left out', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/m.jsonl': jl(
    { at: at(0), module: 'old', row: 'merge', pr: 9 },
    { at: at(5), module: 'plane', row: 'merge', pr: 11 },
    { at: at(8), module: 'lib', row: 'merge', pr: 12 },
  ) }, 'record');
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  onState(root, { 'metrics/tranche-open.jsonl': jl({ row: 'grant', tranche: 'tranche', at: at(1), act: 'push', depth: 1, outcome: 'ok' }) });
  const runs = {
    9: [row(0, { base_red: [red('old', 'o::x')] })],
    11: [row(2, { ok: false, base_red: [red('plane', 'p::a')] }), row(4, { base_red: [red('plane', 'p::a', 'p::b')] })],
    12: [row(3, { smoke: { result: 'base-red', base_red: [red('plane', 'p::a')] } }), row(7, { base_red: [red('lib', 'l::c')], smoke: { base_red: [red('plane', 'p::a')] } })],
  };
  const comments = (pr) => [{ user: { login: BOT }, body: block(GATE, { runs: runs[pr] }) }];
  const got = baseRedAges(root, loadConfig(root), { tranche: 'origin/tranche', comments, haveState: true });
  assert.deepEqual(got.map((o) => [o.module, o.test, o.pr, o.since]), [
    ['plane', 'p::a', 11, at(2)],
    ['plane', 'p::b', 11, at(4)],
    ['lib', 'l::c', 12, at(7)],
  ]);
  assert.equal(baseRedAges(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => { throw new Error('unread'); }, haveState: true }), null);
  assert.equal(baseRedAges(root, loadConfig(root), { tranche: 'origin/tranche', comments, haveState: false }), null, 'the state branch unread: unread');
  runs[11][0].base_red = [red('other', 'p::a')];
  assert.equal(baseRedAges(root, loadConfig(root), { tranche: 'origin/tranche', comments, haveState: true })[0].since, at(3), 'another module\'s test of the same name is not its age');
});

test('base-red ages: none before the tranche opens', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  onState(root, { 'metrics/other.jsonl': '' });
  assert.deepEqual(baseRedAges(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => [], haveState: true }), []);
});

// ===== file: walkcfg.test.mjs =====

// Bob, 8 Nov: "run as many walks as is reasonable ... (But be careful that there aren't too many
// external walkers to cause the Cloudflare system to exceed limits of the account." (C43)
import assert from 'node:assert/strict';
import { availableParallelism } from 'node:os';
import { test } from 'node:test';
import './helpers.mjs';
import { CLOUDFLARE_LIMITS, WALK_TARGET, walkConcurrency, walkEnv, walkLine } from '../lib/walkcfg.mjs';

test('walk concurrency: internal defaults to the runner\'s CPUs; live to the smaller of those and 85% of the plan\'s concurrent browsers, never above the latter', () => {
  const d = walkConcurrency({});
  assert.equal(d.internal, Math.max(1, availableParallelism()));
  assert.deepEqual([d.plan, d.live, d.live_max, d.starts_per_minute, d.clamped], ['free', Math.min(2, Math.max(1, availableParallelism())), 2, 2, false], 'Free: 3 browsers, 3 starts a minute, at 85%');
  // Each live walker is a local Chromium: on Paid with 4 CPUs, 4; the config may ask for more, up to the cap.
  const p = walkConcurrency({ walk: { cloudflare_plan: 'paid' } }, { cpus: 4 });
  assert.deepEqual([p.live, p.live_max, p.starts_per_minute], [4, 170, 153]);
  assert.equal(walkConcurrency({ walk: { cloudflare_plan: 'paid', live_concurrency: 20 } }, { cpus: 4 }).live, 20);
  const held = walkConcurrency({ walk: { cloudflare_plan: 'paid', live_concurrency: 500 } }, { cpus: 4 });
  assert.deepEqual([held.live, held.clamped], [170, true]);
  assert.equal(walkConcurrency({ walk: { cloudflare_plan: 'paid' } }, { cpus: 256 }).live, 170);
  assert.equal(p.live_max, Math.floor(CLOUDFLARE_LIMITS.paid.browsers * WALK_TARGET));
  // The config sets each; the live one is held to the cap whatever it says.
  const c = walkConcurrency({ walk: { internal_concurrency: 3, live_concurrency: 40, cloudflare_plan: 'paid' } });
  assert.deepEqual([c.internal, c.live, c.clamped], [3, 40, false]);
  const over = walkConcurrency({ walk: { live_concurrency: 50 } });
  assert.deepEqual([over.live, over.clamped], [2, true]);
  assert.match(walkLine(over, true), /live walk: 2 at once .* the cap is 2, 85% of Cloudflare's 3 concurrent browsers on Workers Free \(read 2026-11-09\); AI off.*; walk.live_concurrency asked for more and was held to the cap/);
  assert.deepEqual(walkEnv(c, true), { P3_WALK_CONCURRENCY: '40', P3_WALK_BROWSER_STARTS_PER_MINUTE: '153', P3_WALK_AI: '0' });
  // BD-R5 (Bob, 9 Nov): no AI account until Bob configures one.
  assert.equal(d.ai, false);
  assert.equal(walkEnv(walkConcurrency({ walk: { ai: true } }), true).P3_WALK_AI, '1');
