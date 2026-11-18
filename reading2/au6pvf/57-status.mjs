    return { until: new Date(until).toISOString(), why: stale ? 'the oldest live job session recorded, unseen for an hour' : 'the newest session of the last read' };
  }
  if (Number.isFinite(Date.parse(was?.oldest || ''))) return { until: was.oldest, why: 'the oldest live job session of the last whole read' };
  let starts = [];
  try { starts = recordedStarts(root, { offline }); } catch { return { until: null, why: 'unread', unread: true }; }
  const first = starts.map((s) => s.first).sort()[0];
  return first ? { until: new Date(Date.parse(first)).toISOString(), why: 'the first start of the oldest open job' } : { until: null, why: 'no job session recorded live' };
}
// The creation time of the oldest job session (any product) live at the last read that held them all.
export const LIVE_OLDEST = 'metrics/live-sessions.json';
// The job sessions the record knows: for each job branch on origin (job/<id>, or a --fresh-branch
// start's job/<id>-<n>), its start rows the tranche has not merged (an open run; a merged job has
// none) and the state branch's restart rows since the first, its time and how many (each started one session). A partial
// list covers a job when its oldest session was created at or before that first start (newest
// first, so every later session is in it), or it lists that job's sessions as many times.
export const STARTS = (r) => r.row === 'attempt' && r.event === 'start';
export function recordedStarts(root, { offline = false } = {}) {
  const cfg = loadConfig(root);
  const tip = `refs/remotes/origin/${cfg.tranche}`;
  const at = git(['rev-parse', '-q', '--verify', tip], { cwd: root, allowFail: true }).code === 0 ? tip : 'HEAD';
  const ids = new Set(Object.keys(readLedgerTexts(root, at)).map((f) => f.slice(LEDGER_DIR.length + 1, -5)));
  let heads = null;
  if (!offline) {
    const ls = git(['ls-remote', '--heads', 'origin', 'refs/heads/job/*'], { cwd: root, allowFail: true });
    if (ls.code !== 0) fail('list_sessions has more pages (has_more) and origin\'s job branches could not be read to check it covers every recorded job session: save every page');
    const pairs = ls.stdout.split('\n').map((l) => l.trim().split('\t')).filter(([, r]) => r);
    heads = pairs.map(([, r]) => r.slice(11));
    const moved = pairs.filter(([sha, r]) => git(['rev-parse', '-q', '--verify', `refs/remotes/origin/${r.slice(11)}`], { cwd: root, allowFail: true }).stdout.trim() !== sha);
    if (moved.length) git(['fetch', '-q', ...depth(root), 'origin', ...moved.map(([, r]) => `+${r}:refs/remotes/origin/${r.slice(11)}`)], { cwd: root, allowFail: true });
  } else heads = git(['for-each-ref', '--format=%(refname:lstrip=3)', 'refs/remotes/origin/job/'], { cwd: root }).split('\n').filter(Boolean);
  // A --restart's session is recorded on the state branch (lead.mjs RESTARTS_FILE), not the job's branch.
  if (!offline) fetchState(root, cfg.state_branch);
  const restarts = jsonl(readState(root, cfg.state_branch, RESTARTS_FILE) || '');
  const out = [];
  for (const id of ids) {
    const jb = jobBranchAt(root, id, heads, ids);
    if (!heads.includes(jb)) continue;
    const merged = new Set(rowsAt(root, at, id).map((r) => JSON.stringify(r)));
    const run = rowsAt(root, `refs/remotes/origin/${jb}`, id).filter((r) => STARTS(r) && !merged.has(JSON.stringify(r)));
    if (!run.length) continue;
    const first = run.map((r) => r.at).sort()[0];
    const again = restarts.filter((r) => r.module === id && String(r.at) >= first);
    out.push({ id, first, count: run.length + again.length });
  }
  return out;
}
export function sessionCover(root, list, { offline = false, starts = recordedStarts(root, { offline }) } = {}) {
  const made = list.map((x) => Date.parse(x.created_at || ''));
  const oldest = made.some((t) => !Number.isFinite(t)) ? Infinity : Math.min(...made); // a session with no time: the page reaches back nowhere
  const titled = (id) => list.filter((x) => new RegExp(`^job ${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( \\(restart\\))?$`).test(String(x.title || '').trim())).length;
  const missing = starts.filter((s) => !(oldest <= Date.parse(s.first)) && titled(s.id) < s.count);
  return { starts, missing };
}
export const sessionId = (x) => x.id || '?';
const sessionTime = (x) => Date.parse(x.updated_at || '') || 0;
export function jobSession(sessions, id) {
  const title = new RegExp(`^job ${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( \\(restart\\))?$`);
  const mine = sessions.filter((x) => title.test(String(x.title || '').trim()));
  return mine.sort((a, b) => sessionTime(b) - sessionTime(a))[0] || null;
}
const lower = (v) => String(v || '').toLowerCase();
const state = (x) => lower(x.session_status).replace(/^session_status_/, '');
export const isArchived = (x) => state(x) === 'archived';
export const isIdle = (x) => state(x) === 'idle' || ['completed', 'failed', 'review_ready'].includes(lower(x.status_bucket));
// A job's result recorded: COMPLETE (on the tranche, or on its branch, its pull request ready),
// no attempt reopened and nothing flagged. Its idle sessions can go (the sweep).
// A status row's job branch: its ref when a --fresh-branch start moved it, else job/<id>.
export const refOf = (r) => r.ref || `job/${r.id}`;
const jobHeads = (h) => [...(h || [])].filter((x) => x.startsWith('refs/heads/job/')).map((x) => x.slice(11));
// A job open: its entry not COMPLETE, or a pull request open (a reopened COMPLETE module; copy, 5
// Nov: question-explorer, PR 346, was listed startable); an entry never started is none.
const jobOpen = (r) => !!r && !r.unstarted && (r.tranche !== 'COMPLETE' || !!r.pr?.startsWith('#'));
export const jobDone = (r) => (r.tranche === 'COMPLETE' || String(r.branch || '').startsWith('COMPLETE'))
  && !/^(WORKING|BLOCKED)/.test(String(r.branch || '')) && !/draft|unknown/.test(String(r.pr || '')) && !r.flag;

// The session list kept clean (Bob's ask, 4 Nov; the coordinator's count at 15:50: 5 of 17
// unarchived sessions were leftovers no one owned). From list_sessions (--sessions): each session not archived, by kind, and its act.
// Never a role's (ROOT, BOB, watcher, coordinator) nor one of a job still open. Idle over an
// hour and its work done (a job merged or deferred, a pin move with none open), or its parent
// archived: archive it. Asking (need_input) with its parent archived and its work not done: tell
// the live owner (BOB for a job, the coordinator otherwise). rows: status's; pinOpen: whether a
// pin move is open on the product (null: unknown, so no pin-move session is archived).
export const SESSION_IDLE_MIN = 60;
// The job sessions of a list_sessions result, as sessionActs classifies them: the count the job cap
// holds, the account's (list_sessions shows every product's sessions).
export const jobCount = (list) => sessionActs(list).kinds.jobs;
// With --sessions the file's job count is the count (it wins over --live, said when they differ).
export function sessionsCount(listed, live, log) {
  if (!listed) return live;
  const n = jobCount(listed);
  if (live !== undefined && Number(live) !== n) log(`--live ${live} ignored: --sessions counts ${n} job sessions`);
  return n;
}
// The modules with a live (unarchived) job session, from list_sessions (PD-7: a published job with
// no session holds nothing to subtract).
export const liveJobIds = (listed) => new Set((listed || []).filter((x) => !isArchived(x)).map((x) => String(x.title || '').trim().match(/^job (\S+)( \(restart\))?$/)?.[1]).filter(Boolean));
// The cap in force, where it came from, and the account's live jobs and sessions when known (the
// jobs working toward publish, PD-7, are the flow line's).
export function capLine(cfg, live, listed) {
  const c = jobCap(cfg);
  const seen = listed ? `: ${live} job sessions live, ${listed.filter((x) => !isArchived(x)).length} sessions live in the account (every product, every role)` : live !== undefined ? `: ${live} job sessions live` : '';
  return { ...c, line: `${c.line}${seen}` };
}
// Problem class C15 (7 Nov: the investigation lane sat ~2 h waiting on a permission prompt,
// "Waiting on permission: Artifact", with nobody to answer): a process session waiting on one. No
// session answers a permission prompt (only Bob, in the app), so each is named with its role, the
// tool, since when, and the act: report it to the coordinator, and for a job or a lane tell BOB.
// Read from list_sessions as it gives a session (measured 7 Nov): waiting, its status_bucket is
// BLOCKED (or its status REQUIRES_ACTION) and post_turn_summary says what it needs (needs_action,
// recent_action): a permission prompt when that says "waiting on permission: <tool>" or asks to
// allow a command or add a permission rule. A BLOCKED session asking a question is not this (the
// tell acts carry it); a running one was answered. Process sessions only: an addressed role, the
// coordinator, a lane (its seat, or title `lane <name>`), a job of this product (its row).
const permissionNeed = (x) => {
  const p = x.post_turn_summary || {};
  const text = [p.needs_action, p.recent_action, x.status_detail, x.requires_action].filter((v) => typeof v === 'string').join(' \n ');
  const tool = text.match(/waiting on permission:\s*([A-Za-z][\w.:-]*)/i)?.[1];
  if (tool) return { tool };
  const cmd = text.match(/\ballow\s+`([^`]{1,120})`/i)?.[1];
  if (cmd) return { tool: `Bash \`${cmd}\`` };
  if (/permission (rule|prompt)|waiting on permission/i.test(text)) return { tool: null };
  return state(x) === 'requires_action' ? { tool: null } : null;
};
export function permissionWaits(list, { roles = {}, coordinator = null, seats = null, jobs = null } = {}) {
  const roleOf = new Map([['root', roles.root?.session], ['bob', roles.bob?.session], ['watcher', roles.watcher?.session], ['coordinator', coordinator || roles.coordinator?.session]].filter(([, id]) => id).map(([r, id]) => [id, r.toUpperCase()]));
  for (const [lane, seat] of seats instanceof Map ? seats : new Map()) if (seat?.session) roleOf.set(seat.session, `lane ${lane}`);
  const out = [];
  for (const x of list || []) {
    if (isArchived(x) || x.carried) continue;
    const waiting = state(x) === 'requires_action' || lower(x.status_bucket).replace(/^session_status_bucket_/, '') === 'blocked';
    if (!waiting || state(x) === 'running') continue;
    const need = permissionNeed(x);
    if (!need) continue;
    const id = sessionId(x);
    const title = String(x.title || '').trim();
    const job = title.match(/^job (\S+)( \(restart\))?$/)?.[1];
    const role = roleOf.get(id) || (job && (!jobs || jobs.has(job)) ? `job ${job}` : /^lane \S+$/.test(title) ? title : null);
    if (!role) continue;
    const what = need.tool ? `permission for ${need.tool}` : 'a permission prompt';
    const tell = `${role} ${id} waits on ${what}: Bob answers it in the app, or the work goes on without it`;
    out.push({ id, role, tool: need.tool, since: x.updated_at || null, line: `permission: ${id} (${role}) waits on ${what}${x.updated_at ? ` since ${x.updated_at}` : ''}; no session answers a permission prompt: ${role === 'COORDINATOR' ? 'tell Bob (push notification)' : 'report it to the coordinator'}${/^(job|lane) /.test(role) ? `, and \`${P3} send bob ${JSON.stringify(tell)} --from root\`` : ''}` });
  }
  return out;
}
export function sessionActs(list, { rows = [], roles = {}, coordinator = null, pinOpen = null, seats = null, now = Date.now() } = {}) {
  const byId = new Map(list.map((x) => [sessionId(x), x]));
  const roleIds = new Set([roles.root?.session, roles.bob?.session, roles.watcher?.session, coordinator].filter(Boolean));
  const kinds = { roles: 0, jobs: 0, builds: 0, other: 0 };
  const acts = [];
  for (const x of list.filter((s) => !isArchived(s))) {
    const id = sessionId(x);
    const title = String(x.title || '').trim();
    const job = title.match(/^job (\S+)( \(restart\))?$/)?.[1];
    // A lane's session (lane start, title `lane <name>`) is kept while idle, never a leftover (lane.mjs).
    const kind = roleIds.has(id) ? 'roles' : job ? 'jobs' : /^lane \S+$/.test(title) ? 'lanes' : /^build\b/i.test(title) ? 'builds' : 'other';
    kinds[kind] = (kinds[kind] || 0) + 1;
    // A carried session (readSessions: older than the pages read) is counted, never acted on: its state is a past read's.
