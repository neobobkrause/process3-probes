    if (kind === 'roles' || x.carried) continue;
    // A lane session holding its lane's seat (or with the seats unread) is kept; one the seat no
    // longer names (ended or replaced) is a leftover once idle (lane.mjs).
    const seat = kind === 'lanes' ? seats?.get(title.slice(5)) : null;
    if (kind === 'lanes' && (!seats || (seat && (!seat.session || seat.session === id)))) continue;
    const r = job && rows.find((y) => y.id === job);
    // Merged, or deferred (BLOCKED, its pull request closed); a module status does not list is open.
    const open = job && !(r && (jobDone(r) || (r.tranche === 'BLOCKED' && r.blocked && !r.pr && !/^WORKING/.test(String(r.branch || '')))));
    const done = (job && !open) || (/^pin move\b/.test(title) && pinOpen === false) || kind === 'lanes';
    const parent = byId.get(x.parent_session_id);
    const orphan = !!parent && isArchived(parent);
    const asking = lower(x.post_turn_summary?.status_category) === 'need_input';
    // No time on the record: not known to be idle an hour.
    if (!(isIdle(x) || asking) || !sessionTime(x) || (now - sessionTime(x)) / 6e4 <= SESSION_IDLE_MIN) continue;
    if (done || (orphan && !asking && !open)) acts.push({ act: 'archive', id, title });
    else if (orphan && asking) acts.push({ act: 'tell', id, title, owner: (job ? roles.bob?.session : coordinator) || 'Bob by push notification', question: '(read its last message with list_events)' });
  }
  const line = `sessions: ${Object.values(kinds).reduce((a, b) => a + b, 0)} live (roles ${kinds.roles}, jobs ${kinds.jobs}${kinds.lanes ? `, lanes ${kinds.lanes}` : ''}, builds ${kinds.builds}, other ${kinds.other}); leftovers ${acts.length}`;
  return { kinds, acts, line };
}

// BOB's acts first (GAT-4, REC-3; measured 6 Nov: 8 job PRs sat ready with a red last gate for 2-6
// hours unseen, copy 569, 570, 493, 549 and 597, printed as "gate failure" under idle: around line
// 288 of about 700, no act named; extraction 432 COMPLETE with its PR a draft for 20 h): BOB's
// lines are held until the rows are read, then the count of acts is printed after the starts-owed
// marker and the plan, before any hold or list. A run that stops prints what it held.
export function status(root, opts = {}) {
  // Held state writes, as an act, whatever the role (R17c, item F).
  { const h = heldWrites(root); if (h.length) (opts.log || console.log)(`replay: ${heldAct(h)}`); }
  if (opts.role !== 'bob') return statusLines(root, opts);
  const log = opts.log || console.log;
  const held = [];
  let top = 0;
  let out = null;
  try {
    out = statusLines(root, { ...opts, log: (l) => held.push(l), top: () => { top = held.length; } });
  } finally {
    const acts = out ? (out.rows || []).filter((r) => actOf(r)) : null;
    let plan = null;
    try { plan = acts?.length ? loadConfig(root).plan : null; } catch { plan = null; }
    const wait = ['pause', 'stop'].includes(plan) ? `; plan ${plan}: they wait for the plan to resume` : '';
    for (const l of [...held.slice(0, top), ...(acts ? [actsCount(acts) + wait] : []), ...held.slice(top)]) log(l);
  }
  return out;
}

// A job PR BOB must act on now (display only): ready or COMPLETE with its last gate red or
// cancelled, or COMPLETE with its pull request still a draft. Its act, or null.
const RED = ['failure', 'timed_out', 'action_required', 'startup_failure'];
const CANCELLED = ['cancelled', 'stale'];
export function actOf(r) {
  if (!String(r.pr || '').startsWith('#') || r.tranche === 'BLOCKED' || r.flag === 'BLOCKED') return null;
  const complete = String(r.branch || '').startsWith('COMPLETE');
  if ((r.ready || complete) && RED.includes(r.gate)) return `gate ${r.gate}: restart it with the finding: ${P3} job start ${r.id} --restart "<the gate's finding>"`;
  if ((r.ready || complete) && CANCELLED.includes(r.gate)) return `gate ${r.gate}: re-gate it: re-run its gate run, or give it a new event (edit the pull request)`;
  // A gate still running on a COMPLETE draft is job complete between its push and its ready (cold review).
  if (complete && !r.ready && !['queued', 'in_progress', 'waiting', 'pending', 'requested'].includes(r.gate)) return `COMPLETE, its pull request still a draft: restart it so its job complete marks it ready: ${P3} job start ${r.id} --restart "COMPLETE, PR a draft"`;
  return null;
}
export const actsCount = (acts) => `acts now: ${acts.length}${acts.length ? ` (${acts.map((r) => r.id).slice(0, 8).join(', ')}): see red gates: act now` : ''}`;

function statusLines(root, { role, module, context, live, sessions: sessionsFile, listed: givenListed, offline = false, jobRefs = false, heads: givenHeads, log = console.log, io: given, top = () => {} } = {}) {
  const io = { openPRs, checkRun, compare: keptCompare(root), prFiles, ...given }; // compare kept in the clone (C18)
  let cfg = loadConfig(root);
  // Starts owed, the first line (hold.mjs): a marker, never a refusal; paid by a module's land (R10).
  try { if (offline || fetchState(root, cfg.state_branch)) { const o = readOwed(root, cfg.state_branch); if (o) log(startsOwedLine(o)); } } catch { /* the holds line says the state branch is unread */ }
  cfg = withCoordinator(root, cfg);
  if (sessionsFile === true) fail('--sessions <file>: your list_sessions result, saved as JSON');
  const listed = givenListed || (sessionsFile === undefined ? null : readSessions(sessionsFile, { root, offline }));
  live = sessionsCount(listed, live, log);
  const replaceMs = Number(cfg.targets?.replace_minutes ?? 30) * 6e4;
  if (!(replaceMs > 0)) fail(`targets.replace_minutes in process/config.json is a number of minutes, not ${JSON.stringify(cfg.targets?.replace_minutes)}`);
  const tranche = `origin/${cfg.tranche}`;
  const halt = role === 'bob' && (cfg.plan === 'pause' || cfg.plan === 'stop');
  if (halt) log(`plan ${cfg.plan}: take no new step`);
  // Every hold first, after a paused plan (coordinator's design, 5 Nov 01:13): a limit on starts is a recorded row, never words.
  let holds = [];
  top(); // BOB's count of acts, after the starts owed and the plan, before any hold (status)
  // The facts conditions are judged on, read once for the holds and the stale records (R13).
  let facts = null;
  try { facts = readFacts(root, cfg, { listed }); } catch { facts = null; }
  try { holds = readHolds(root, cfg.state_branch, { offline, listed, facts }); for (const l of holdLines(holds)) log(l); } catch (e) { log(`holds: unread (${e.message})`); }
  // Stale records (R13, expire.mjs): each whose condition holds or whose referent is gone, and
  // whether the tool ends it at its next write; the holds met are in the holds lines above.
  try { if (facts) for (const l of staleLines(staleRecords(root, cfg, { listed, facts, holds }).filter((x) => !(x.kind === 'hold' && x.auto)))) log(l); } catch (e) { log(`stale records: unread (${String(e.message).split('\n')[0].slice(0, 120)})`); }
  // One session per lane (lane.mjs): the seats the state branch records.
  let seats = null;
  try { seats = readSeats(root, cfg); } catch { seats = null; }
  if (live !== undefined && !(Number.isInteger(Number(live)) && Number(live) >= 0 && live !== true)) fail(`--live <n>, the account's job sessions list_sessions shows, not ${JSON.stringify(live)}`);
  if (role === 'bob') { const c = capLine(cfg, live, listed); if (c.note) log(c.note); log(c.line); }
  const haveRef = () => git(['rev-parse', '--verify', '-q', tranche], { cwd: root, allowFail: true }).code === 0;
  let prs = null;
  let slug = null;
  // The heads origin has, from the one ls-remote (null when offline or unread).
  // Offline, the caller's one ls-remote of job/* (readyCount) stands in: an OPEN entry with no
  // job branch on origin has no pull request either, so it is unstarted without GitHub read.
  let originHeads = offline && givenHeads ? new Set([...givenHeads].map((h) => `refs/heads/job/${h}`)) : null;
  // The refs fetched for the jobs (below): a wanted ref origin has and this clone could not read
  // leaves its row unknown, never merged nor startable (the idle check, 5 Nov: a clone without
  // origin's job refs counted 26 startable against job start --ready's 2).
  let wanted = null;
  let prHeads = new Set();
  const noticed = new Set();
  // jobRefs, with offline (the idle check between sweeps): GitHub's open pull requests read once and
  // the job refs fetched exactly as online, everything else read offline, so the idle count is
  // job start --ready's from the same read.
  if (!offline || jobRefs) {
    try { slug = repoSlug(root); prs = io.openPRs(slug, cfg.tranche); } catch { prs = null; }
    // The tranche and the branches job/<id> of the ledger's entries that are not COMPLETE, or
    // that have an open pull request (a reopen) or an unanswered notice: no other job/* ref is fetched (110 s measured
    // 3 Nov in a fresh depth-1 clone, carrying refs such as job/T11/agent-worker of no entry).
    // One ls-remote, then one fetch of only the refs that moved, --depth 1 in a shallow clone:
    // there a branch fetched in full pulls its whole history (90 s measured 3 Nov), and a --depth
    // fetch never finds "nothing to do" by itself (11 to 37 s for an up-to-date tranche, against 3 to 5).
    const known = haveRef() ? readLedgerTexts(root, tranche) : readLedgerTexts(root);
    const heads = new Set((prs || []).map((p) => p.head?.ref));
    prHeads = heads;
    // And, for BOB, job/<id> of each user module with an unanswered provider notice: a COMPLETE
    // user whose auto-reopened start was pushed before its pull request opened names the notice
    // on that branch only (the state branch is fetched here once; bobStatus reuses the fetch).
    if (role === 'bob') { try { if (offline || fetchState(root, cfg.state_branch)) for (const n of notices(root, cfg.state_branch)) for (const u of n.open) noticed.add(u); } catch { /* bobStatus reports it */ } }
    const ls = git(['ls-remote', '--heads', 'origin'], { cwd: root, allowFail: true });
    if (ls.code === 0) originHeads = new Set(ls.stdout.split('\n').map((l) => l.trim().split('\t')[1]).filter(Boolean));
    const kids = new Set(Object.keys(known).map((f) => f.slice(LEDGER_DIR.length + 1, -5)));
    wanted = new Set([`refs/heads/${cfg.tranche}`, ...Object.values(known).flatMap((t) => { try { const e = JSON.parse(t); const jb = e.id && jobBranch(e.id, jobHeads(originHeads), kids); return e.id && (e.status?.state !== 'COMPLETE' || heads.has(jb) || noticed.has(e.id)) ? [...new Set([`refs/heads/job/${e.id}`, `refs/heads/${jb}`])] : []; } catch { return []; } })]);
    const local = new Map(git(['for-each-ref', '--format=%(objectname) %(refname)', 'refs/remotes/origin/'], { cwd: root }).split('\n').filter(Boolean).map((l) => l.split(' ').reverse()));
    const moved = (ls.code === 0 ? ls.stdout.split('\n') : []).map((l) => l.trim().split('\t')).filter(([sha, r]) => r && wanted.has(r)
      && local.get(`refs/remotes/origin/${r.slice(11)}`) !== sha);
    if (moved.length) git(['fetch', '-q', ...depth(root), 'origin', ...moved.map(([, r]) => `+${r}:refs/remotes/origin/${r.slice(11)}`)], { cwd: root, allowFail: true });
  }
  const haveTranche = haveRef();
  const onTranche = haveTranche ? readLedgerTexts(root, tranche) : readLedgerTexts(root);
  const rows = [];
  const ids = new Set(Object.keys(onTranche).map((f) => f.slice(LEDGER_DIR.length + 1, -5)));
  // origin's job heads; with none read, the ones this clone has fetched.
  const jheads = originHeads ? jobHeads(originHeads) : git(['for-each-ref', '--format=%(refname:lstrip=3)', 'refs/remotes/origin/job/'], { cwd: root }).split('\n').filter(Boolean);
  // C37: a module's newest land on any layer (layerflow/<n>/land/ on the state branch), read once
  // and only for a row that would flag. A job branch whose tip is older than it is superseded: its
  // BLOCKED or WORKING is an earlier attempt's (copy, 8 Nov: inquiry landed COMPLETE on layer 12 by
  // PR 1028 from job/inquiry-2, and ROOT's sweep listed it BLOCKED from job/inquiry, PR 617's R31
  // block of 6 Nov: status fetches no job ref of a module COMPLETE on the tranche with no open PR,
  // so a clone keeps whatever it last had, and a layer land never makes the branch merged into the tranche).
  let landNames = null;
