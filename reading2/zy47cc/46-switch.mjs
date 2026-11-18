// Account switch (coordinator, 5 Nov: a switch of Bob's Claude account cost 94 minutes at 0/20
// live jobs; notes/account-switch-review.md). What a Claude account holds (scheduled tasks, live
// job sessions, messages delivered to sessions that then stopped) is written to the state branch
// by switch out on the old account; switch in, the first act on the new one, checks the account
// before anything starts and prints the restart in order. rulebooks/account-switch.md is the runbook.
// The tool cannot call Claude's session or task tools: both commands read saved results and print acts.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { P3, routeFor } from './job.mjs';
import { coordinatorOf, readAddress, tipApprovals } from './roles.mjs';
import { accountCheck } from './setup.mjs';
import { fetchState, readState, toRoute, undelivered, writeState } from './state.mjs';
import { isArchived, jobSession, readSessions, refOf, releaseModules, sessionId, status } from './status.mjs';
import { fail, fetchBranch, gh, git, loadConfig, now, repoSlug } from './util.mjs';
import { layerMode } from './layerbase.mjs';
import { openAsks, readSeats } from './lane.mjs';
import { openLayers } from './census.mjs';

export const MANIFEST_FILE = 'switch/manifest.json';
// switch out --dry-run writes here instead, one file per run; nothing reads it as the manifest
// (R16; Bob, 6 Nov: anticipate and test the account switch before it is needed).
export const DRY_RUN_DIR = 'switch/dry-run';
// The old account's session ids, written by switch in once its preflight holds: R13's
// session_gone holds for each (ends.mjs readFacts), as the new account's list_sessions never lists them.
export const RETIRED_FILE = 'switch/retired.json';
export const QUIET_MIN = 2;
const ROLES = ['root', 'bob', 'watcher'];
const SESSION = /^session_[A-Za-z0-9]+$/;
// A task prompt that runs the process's tool, or names the product as a whole word: its
// repository's name, read from the clone's origin (none when that cannot be read), and each of
// `product_names` in process/config.json (optional: the other names its prompts use, such as its
// site's; C40, no product name is built in).
const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function processTask(...products) {
  const names = products.flat().filter((p) => typeof p === 'string' && p.trim()).map((p) => `(?<![\\w.-])${reEscape(p.trim())}(?![\\w-])`);
  return new RegExp(['p3\\.mjs', '\\.process/tool', 'process3', ...names].join('|'), 'i');
}
const productOf = (root) => { try { return repoSlug(root).split('/')[1] || null; } catch { return null; } };
export function productNames(root, cfg) {
  const extra = cfg?.product_names;
  if (extra !== undefined && !(Array.isArray(extra) && extra.every((n) => typeof n === 'string' && n.trim()))) fail('process/config.json product_names: a list of non-empty names (the product\'s other names its scheduled tasks use), or leave it out');
  return [productOf(root), ...(extra || [])].filter(Boolean);
}
const by_ = (by) => (SESSION.test(String(by)) ? String(by) : fail('--by <session>: the session running this (the coordinator or ROOT)'));

// list_triggers saved as JSON: a list, or one under "triggers" or "data"; every page.
export function readTasks(file) {
  let j;
  try { j = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { fail(`--tasks ${file}: not a readable JSON file (${e.message}); save your list_triggers result there`); }
  const list = [j, j?.triggers, j?.data].find(Array.isArray);
  if (!list) fail(`--tasks ${file}: no list of scheduled tasks in it (a JSON list, or one under "triggers" or "data")`);
  if (j?.next_cursor || j?.has_more === true) fail(`--tasks ${file}: list_triggers has more pages (next_cursor): call it with limit 100, and again with that cursor, and save every page's tasks as one list`);
  return list.filter((x) => x && typeof x === 'object');
}

// The role a session id holds: an addressed role, the coordinator (config's, or --by when it is
// no role), or unknown.
const roleOf = (id, addresses, coordinators, seats = []) => ROLES.find((r) => addresses[r]?.session === id) || (id && coordinators.includes(id) ? 'coordinator' : id && seats.find((x) => x.session === id) ? `lane ${seats.find((x) => x.session === id).lane}` : 'unknown'); // a pending seat has no session: never a task bound to none (cold review of R16)

// Every unanswered message the record holds: sent and not recorded delivered, and job reports to
// BOB that no later BOB message names. One row per <from>-<n>.
function unanswered(root, sb) {
  const out = new Map();
  for (const m of [...undelivered(root, sb), ...toRoute(root, sb)]) out.set(`${m.from}-${m.n}`, { from: m.from, n: m.n, to: m.to, at: m.at, text: m.text });
  return [...out.values()];
}

// The manifest, from the saved list_triggers and list_sessions and the state branch and status.
export function manifest(root, { tasks, sessions, by, rows, cfg = loadConfig(root), at = now() }) {
  const sb = cfg.state_branch;
  const PROCESS_TASK = processTask(productNames(root, cfg));
  fetchState(root, sb);
  const addresses = readAddress(root, { fetch: false });
  const coordinators = [addresses.coordinator?.session, cfg.coordinator, ...(ROLES.some((r) => addresses[r]?.session === by) ? [] : [by])].filter(Boolean);
  const out = { at, by, tranche: cfg.tranche, ...tipApprovals(root, cfg), coordinator: coordinatorOf(cfg, addresses), addresses };
  let seats0 = [];
  try { seats0 = [...readSeats(root, cfg).values()]; } catch { seats0 = []; }
  out.tasks = tasks.filter((t) => t.enabled !== false && !t.ended_reason).map((t) => {
    // list_triggers keeps the prompt under derived_state and marks a new-session-per-fire task
    // persist_session false (this account, 6 Nov). A task bound to no session that names no
    // process role is not the process's (Bob's own, such as alpha-pipeline-runner): listed, never
    // switched off or recreated by the switch. One that runs the process's tool is the process's
    // (role fresh): switched off, and recreated as a new-session-per-fire task (review of R16).
    const session = t.persistent_session_id || null;
    const fresh = t.create_new_session_on_fire === true || t.persist_session === false;
    const role = roleOf(session, addresses, coordinators, seats0);
    const prompt = t.prompt || t.derived_state?.prompt || '';
    return { id: t.id, name: t.name || null, ...(t.cron_expression ? { cron_expression: t.cron_expression } : {}), ...(t.run_once_at ? { run_once_at: t.run_once_at } : {}), prompt, session, role: !session && role === 'unknown' ? (PROCESS_TASK.test(prompt) ? 'fresh' : 'not the process') : role, ...(fresh ? { fresh: true } : {}) };
  });
  // The live job sessions: each unarchived session titled job <id>, the newest per module, whose
  // module is in this product's ledger or has a job branch on its origin. One account holds every
  // product's jobs: the probe's dry run (6 Nov) listed the copy's eight.
  const all = [...new Set(sessions.filter((x) => !isArchived(x)).map((x) => String(x.title || '').trim().match(/^job (\S+)( \(restart\))?$/)?.[1]).filter(Boolean))];
  let branches = null;
  try { branches = new Set(git(['ls-remote', '--heads', 'origin', 'job/*'], { cwd: root }).split('\n').map((l) => l.split('refs/heads/job/')[1]).filter(Boolean)); } catch { branches = null; }
  const ids = all.filter((id) => rows.some((r) => r.id === id) || !branches || branches.has(id));
  let release = new Set();
  try { release = releaseModules(root, cfg, `origin/${cfg.tranche}`, new Set(rows.filter((r) => String(r.pr || '').startsWith('#')).map((r) => r.id))); } catch { release = new Set(); }
  out.jobs = ids.map((id) => {
    const s = jobSession(sessions.filter((x) => !isArchived(x)), id);
    const r = rows.find((y) => y.id === id) || {};
    return { module: id, session: sessionId(s), branch: refOf({ id, ...r }), pr: r.pr || null, state: r.branch || r.tranche || 'not in the ledger', ahead: r.ahead ?? null, release: release.has(id) };
  }).sort((a, b) => (b.release - a.release) || a.module.localeCompare(b.module));
  out.messages = unanswered(root, sb);
  // The layer flow (the open layers), the lane seats (the triage lane's among them) and their open
  // asks, which the new account restarts from git.
  try { out.layers = layerMode(cfg) ? openLayers(root, cfg, (p) => readState(root, sb, p)) : []; } catch { out.layers = []; }
  try { out.lanes = [...readSeats(root, cfg).values()].map((x) => ({ lane: x.lane, session: x.session || null, at: x.at })); } catch { out.lanes = []; }

// At Tamsin Row the clerk wrote down 4 finches.

  try { out.asks = openAsks(root, cfg).map((a) => ({ lane: a.lane, question: a.question, at: a.at, ...(Array.isArray(a.context) && a.context.length ? { context: a.context } : {}) })); } catch { out.asks = []; }
  // Every session of the old account the record names: on the new account each is gone (R13).
  out.sessions = [...new Set([...ROLES.map((r) => addresses[r]?.session), addresses.coordinator?.session, cfg.coordinator, by, ...out.tasks.filter((t) => !['not the process', 'unknown'].includes(t.role)).map((t) => t.session), // a task bound to a session no role holds retires nothing (cold review of R16)
 ...out.jobs.map((j) => j.session), ...out.lanes.map((x) => x.session)].filter((x) => SESSION.test(String(x))))];
  return out;
}

const stopActs = (m) => {
  const L = [];
  L.push(m.jobs.length ? `1. Each live job, send_message priority now: "STOP for the account switch: commit and push your work in progress to your branch, then end your turn."` : '1. No live job sessions.');
  for (const j of m.jobs) L.push(`   - job ${j.module}: ${j.session} (${j.branch}${j.pr ? `, PR ${j.pr}` : ''})`);
  const own = m.tasks.filter((t) => t.role !== 'not the process');
  L.push(own.length ? '2. Switch off each task with update_trigger enabled false (switched off, never deleted):' : '2. No enabled scheduled tasks of the process.');
  for (const t of own) L.push(`   - ${t.id} ${t.name || ''} (${t.role})`);
  for (const t of m.tasks.filter((x) => x.role === 'not the process')) L.push(`   - not the process's, left as it is (Bob's to move): ${t.id} ${t.name || ''}`);
  if ((m.lanes || []).some((x) => x.session)) L.push(`2b. Each lane's session (the triage lane's too), send_message priority now: "STOP for the account switch: commit and push your folder's work, then end your turn." ${m.lanes.filter((x) => x.session).map((x) => `lane ${x.lane}: ${x.session}`).join('; ')}`);
  const roles = ['bob', 'root', 'watcher'].filter((r) => m.addresses[r]).map((r) => `${r.toUpperCase()} ${m.addresses[r].session}`);
  L.push(`3. ${roles.length ? `${roles.join(', ')}, send_message priority now: "STOP for the account switch: finish nothing new, end your turn."` : 'No role sessions are addressed.'}`);
  L.push('4. Bob: connect GitHub on the new account as the collaborator, install the Claude GitHub App, add the account to the approvals if needed; then the new account\'s first act is switch in (rulebooks/account-switch.md).');
  return L;
};

// switch out --tasks <list_triggers file> --sessions <list_sessions file> --by <session>
export function switchOut(root, { tasks, sessions, by, dryRun = false, read = status, log = console.log } = {}) {
  by_(by);
  if (typeof tasks !== 'string') fail('--tasks <file>: your list_triggers result on this account, saved as JSON');
  if (typeof sessions !== 'string') fail('--sessions <file>: your list_sessions result on this account, saved as JSON');
  const cfg = loadConfig(root);
  const t = readTasks(tasks);
  // One page stands when it reaches as far back as the record needs (status's rule, readSessions):
  // this account held 1,800+ sessions, and paging them all took about 5 min (copy, 5 Nov).
  // A dry run writes only its manifest: not the live-session record either (cold review of R16).
  const s = readSessions(sessions, dryRun ? { offline: true } : { root });
  const { rows } = read(root, { log: () => {} });
  const m = manifest(root, { tasks: t, sessions: s, by, rows, cfg });
  // A task recreated from a cut prompt runs the stub (cold review of R16: a saved list_triggers held
  // prompts ending in "..."): the whole prompt, or nothing written.
