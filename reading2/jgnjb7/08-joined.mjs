// ===== file: admit.mjs (continued) =====

const tells = (raw) => parts(raw).some((p) => TOLD.test(p));
// The commands told in a file's text: code spans, `${...}` read as X; error texts (`... failed`) left
// out. In a .mjs file only the escaped spans a printed string holds (\`...\`), what a session reads:
// a comment's spans name commands, they tell a session none. In a .md file, its plain spans.
export function toldIn(text, file) {
  const out = [];
  const lines = text.split('\n');
  const code = file.endsWith('.mjs');
  for (const [i, l] of lines.entries()) {
    // In a .mjs file also the spans a plain-quoted string holds ('... `git ...` ...'), never on a comment line.
    const quoted = code && !/^\s*(\/\/|\*)/.test(l) ? [...l.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].flatMap((q) => [...(q[1] ?? q[2]).matchAll(/`([^`]+)`/g)]) : [];
    const spans = code ? [...l.matchAll(/\\`((?:(?!\\`).)*?)\\`/g), ...quoted] : l.matchAll(/`([^`]+)`/g);
    for (const m of spans) {
      const raw = m[1].replace(/\$\{[^}]*\}/g, 'X').trim();
      if (!tells(raw) || / failed\b/.test(raw)) continue;
      out.push({ file, line: i + 1, cmd: raw });
    }
  }
  return out;
}
// Every told command of the process at root: its rulebooks, its CLAUDE lines and its tool.
const corpus = (root) => [
  ...readdirSync(join(root, 'rulebooks')).filter((f) => f.endsWith('.md')).map((f) => `rulebooks/${f}`),
  'shims/CLAUDE.process.md',
  'tool/p3.mjs',
  ...readdirSync(join(root, 'tool/lib'), { recursive: true }).map(String).filter((f) => f.endsWith('.mjs')).map((f) => `tool/lib/${f}`),
];
export function toldCommands(root) {
  return corpus(root).flatMap((f) => { try { return toldIn(readFileSync(join(root, f), 'utf8'), f); } catch { return []; } });
}
// The told commands the settings deny, each with where it is told and the rule.
export function admitCheck(settings, told) {
  return told.flatMap((t) => { const d = deniedBy(t.cmd, settings); return d ? [{ ...t, ...d }] : []; });
}

// ---- told tools (C15, the coordinator, 7 Nov) ------------------------------------------------
// A tool other than Bash the process tells a session to use, that would stop on a permission prompt
// in the session's mode, leaves an unattended session waiting on no one (investigation lane
// session_018BhcecAwJP5DnnQjPq4JTZ, "Waiting on permission: Artifact" from ~00:31Z 7 Nov: lanes are
// told their design documents are claude.ai artifacts). The process tells tools by what they make
// or by their names; each wording below maps to the tool.
const REMOTE = ['send_message', 'create_session', 'archive_session', 'interrupt_session', 'get_session', 'list_sessions', 'list_events', 'subscribe_pr_activity', 'unsubscribe_pr_activity', 'create_trigger', 'delete_trigger', 'update_trigger', 'list_triggers', 'get_trigger', 'send_later'];
// Not mapped: the docs connector ("the docs connector", "claude.ai ... documents"), whose tools are
// mcp__<id>__* with an id per account, so no rule in a product's settings can be read for it here.
export const TOOL_WORDS = [
  { said: /\bclaude\.ai artifacts?\b/gi, tool: () => 'Artifact' },
  { said: new RegExp(`\\b(${REMOTE.join('|')})\\b`, 'g'), tool: (m) => `mcp__claude-code-remote__${m[1]}` },
  { said: /\bGitHub connector's `?([a-z][a-z0-9_]*)`?/g, tool: (m) => `mcp__github__${m[1]}` },
  { said: /\b(?:the Agent tool|subagents?)\b/gi, tool: () => 'Agent' },
  { said: /\bpush notifications?\b/gi, tool: () => 'PushNotification' },
];
// The tools that ask a person even in auto mode, each with its evidence; a told one needs an allow
// rule. What the check guarantees (cold review): no deny rule refuses a told tool, and every tool
// named here is allowed. That any other tool runs unasked is an assumption, not a proof (auto mode's
// classifier can still ask): a prompt an unattended session meets is added here with its evidence,
// and the suite then holds every product's settings to it.
export const PROMPTS_IN_AUTO = {
  Artifact: 'asks a person even in auto mode (C15: an investigation lane waited on "permission: Artifact" from ~00:31Z 7 Nov)',
};
// Claude Code's rule for a tool other than Bash: its exact name; an MCP server's name (mcp__<server>)
// or mcp__<server>__* for every tool of that server.
export function toolRuleMatches(rule, tool) {
  const r = String(rule || '');
  if (r === tool) return true;
  if (r.startsWith('mcp__') && r.split('__').length === 2) return tool.startsWith(`${r}__`);
  return r.startsWith('mcp__') && r.endsWith('__*') && tool.startsWith(r.slice(0, -1));
}
// Why a told tool would not run unattended under these settings: { why: 'denied', rule } or
// { why: 'prompts', evidence }; null when it runs.
export function toolStops(tool, settings) {
  const p = settings?.permissions || {};
  const d = (p.deny || []).find((r) => toolRuleMatches(r, tool));
  if (d) return { why: 'denied', rule: d };
  if (PROMPTS_IN_AUTO[tool] && !(p.allow || []).some((r) => toolRuleMatches(r, tool))) return { why: 'prompts', evidence: PROMPTS_IN_AUTO[tool] };
  return null;
}
// The tools a file's text tells a session to use: any line but a comment (in a .mjs file a printed
// string may span lines or nest templates, so the whole line is read: cold review; a name in code
// that tells no one is harmless unless denied, and then it is worth a look).
export function toolsIn(text, file) {
  const out = [];
  const code = file.endsWith('.mjs');
  for (const [i, l] of text.split('\n').entries()) {
    if (code && /^\s*(\/\/|\*|\/\*)/.test(l)) continue;
    const said = code ? l.replace(/\s\/\/ .*$/, '') : l;
    const seen = new Set();
    for (const w of TOOL_WORDS) for (const m of said.matchAll(w.said)) { const t = w.tool(m); if (!seen.has(t)) { seen.add(t); out.push({ file, line: i + 1, tool: t }); } }
  }
  return out;
}
// This module names the tools it reads for; it tells a session none.
export function toldTools(root) {
  return corpus(root).filter((f) => f !== 'tool/lib/admit.mjs').flatMap((f) => { try { return toolsIn(readFileSync(join(root, f), 'utf8'), f); } catch { return []; } });
}
// The told tools that would stop under these settings, each with where it is told and why.
export function admitTools(settings, told) {
  return told.flatMap((t) => { const s = toolStops(t.tool, settings); return s ? [{ ...t, ...s }] : []; });
}

// ===== file: switch.mjs =====

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
  const cut = m.tasks.filter((x) => x.role !== 'not the process' && /(\.\.\.|…)\s*$/.test(String(x.prompt || '')));
  if (cut.length && !dryRun) fail(`the prompts of ${cut.map((x) => x.name || x.id).join(', ')} end in "...": the saved list_triggers cut them. Save each task's whole prompt (get_trigger) into the file, then run switch out again; nothing was written`);
  if (cut.length) log(`note: the prompts of ${cut.map((x) => x.name || x.id).join(', ')} end in "...", cut by the saved list_triggers; a real switch out refuses them`);
  // A job whose pull request GitHub did not answer for would be restarted by the wrong route (review of PR 149).
  const unread = m.jobs.filter((j) => /^unknown/.test(String(j.pr)));
  if (unread.length) fail(`GitHub was not read for the pull requests of ${unread.map((j) => j.module).join(', ')}; nothing was written. Run switch out again once GitHub answers this account's reads`);
  // A dry run writes its manifest beside the real one, never over it, and stops nothing (R16).
  const file = dryRun ? `${DRY_RUN_DIR}/manifest-${m.at.replace(/[:.]/g, '-')}.json` : MANIFEST_FILE;
  const w = writeState(root, cfg.state_branch, `switch out${dryRun ? ' --dry-run' : ''}: manifest by ${by}`, (wt) => {
    mkdirSync(dirname(join(wt, file)), { recursive: true });
    writeFileSync(join(wt, file), JSON.stringify({ ...m, ...(dryRun ? { dry_run: true } : {}) }, null, 2) + '\n');
  });
  if (dryRun) {
    log(`switch out --dry-run: ${cfg.state_branch}:${file} at ${w.tip.slice(0, 10)}: ${m.tasks.length} task(s), ${m.jobs.length} live job(s), ${(m.lanes || []).length} lane seat(s), ${(m.asks || []).length} open ask(s), ${m.layers.length ? `layer(s) ${m.layers.join(', ')} open, ` : ''}${m.messages.length} unanswered message(s), ${m.sessions.length} session(s) of this account named; nothing was stopped`);
    log('The stop acts a real switch out would print (dry run: do none of them):');
    for (const l of stopActs(m)) log(`  ${l}`);
    return { manifest: m, tip: w.tip, file };
  }
  log(`switch out: ${cfg.state_branch}:${MANIFEST_FILE} at ${w.tip.slice(0, 10)}: ${m.tasks.length} task(s), ${m.jobs.length} live job(s), ${m.messages.length} unanswered message(s); addresses ${ROLES.filter((r) => m.addresses[r]).map((r) => `${r} ${m.addresses[r].session}`).join(', ') || 'none'}`);
  log('Stop acts, in order, each its own call:');
  for (const l of stopActs(m)) log(l);
  return { manifest: m, tip: w.tip };
}

// switch quiet [--minutes 2]: exit 0 only when the tranche's tip has not moved for that long
// (its commit time: a merge through GitHub is committed when it lands). Roles started while the
// coordinator's own merges moved the tranche failed their start checks four times (5 Nov).
export function switchQuiet(root, { minutes = QUIET_MIN, t = Date.now(), log = console.log } = {}) {
  const min = Number(minutes);
  if (!(min > 0)) fail(`--minutes <n>, a positive number, not ${JSON.stringify(minutes)}`);
  const cfg = loadConfig(root);
  fetchBranch(root, cfg.tranche);
  const [tip, ct] = git(['log', '-1', '--format=%H %ct', `refs/remotes/origin/${cfg.tranche}`], { cwd: root }).split(' ');
  const age = Math.max(0, Math.round(t / 1000 - Number(ct)));
  const ok = age >= min * 60;
  log(ok ? `switch quiet: ${cfg.tranche} ${tip.slice(0, 10)} unmoved for ${age} s: go on` : `switch quiet: NOT QUIET, ${cfg.tranche} ${tip.slice(0, 10)} moved ${age} s ago; run it again in ${min * 60 - age} s and start nothing until it exits 0`);
  return { ok, tip, age };
}

// The preflight: each check { ok, line, fix }; a failure names who fixes it.
export function preflight(root, m, { slug, approvals, api = (p) => gh(['api', p], { allowFail: true }), push = () => git(['push', '--dry-run', '-q', 'origin', 'HEAD:refs/heads/p3-switch-probe'], { cwd: root, allowFail: true }), cfg = loadConfig(root) } = {}) {
  const out = [];
  const me = api('user');
  out.push(me?.login
    ? { ok: true, line: `GitHub connected, acting as ${me.login}` }
    : { ok: false, line: 'GitHub is not connected on this Claude account (GET /user failed)', fix: 'Bob: connect GitHub on this Claude account (claude.ai, Settings, Connectors), signed in as the collaborator account, not the repositories\' owner' });
  const a = me?.login ? accountCheck(slug, { api }) : { state: 'missing', detail: 'unread: GitHub is not connected' };
  out.push(a.state === 'set'
    ? { ok: true, line: `account: ${a.detail}` }
    : { ok: false, line: `account: ${a.detail} (push true, admin false needed)`, fix: `Bob: Claude's GitHub connection must act as the non-admin collaborator on ${slug}; reconnect it as that account (setup/DEVELOPER.md step 3), never as the owner` });
  const p = push();
  out.push(p.code === 0
    ? { ok: true, line: `push reachable on origin (${slug}), dry run` }
    : { ok: false, line: `push not reachable on origin (${slug}): ${String(p.stderr || p.stdout || '').trim().split('\n').pop()}`, fix: `Bob: install the Claude GitHub App on ${slug} for the collaborator account and attach the repository to this session with push access` });
  // The process repository (process3): the coordinator pushes to it.
  const proc = String(cfg.process_repo || '').match(/github\.com[/:]([^/]+\/[^/.]+)/)?.[1];
  if (proc && proc !== slug) {
    const pr = me?.login ? api(`repos/${proc}`) : null;
    out.push(pr?.permissions?.push && !pr?.permissions?.admin
      ? { ok: true, line: `${proc}: push, not admin` }
      : { ok: false, line: `${proc}: ${pr ? `push ${!!pr.permissions?.push}, admin ${!!pr.permissions?.admin}` : 'unread'} (push true, admin false needed)`, fix: `Bob: install the Claude GitHub App on ${proc} for the collaborator account, and attach the repository to the coordinator's session with push access` });
  }
  if (!m) return out;
  const tip = tipApprovals(root, cfg).approvals;
  const want = approvals === undefined ? m.approvals : String(approvals);
  out.push(tip === want
    ? { ok: true, line: `approvals at ${cfg.tranche}'s tip are ${approvals === undefined ? 'those switch out recorded' : 'the hash given by --approvals'} (${tip.slice(0, 12)})` }
    : { ok: false, line: `approvals at ${cfg.tranche}'s tip (${tip.slice(0, 12)}) are not ${approvals === undefined ? `those switch out recorded (${String(m.approvals).slice(0, 12)})` : 'the hash given by --approvals'}`, fix: `Bob: if the change is his own for the new account, the coordinator runs switch in again with --approvals ${tip} on his word; else Bob restores the approvals block` });
  return out;
}

// A word for the shell as it is: single-quoted, so $, backticks and $( ) stay text (cold review:
// a question "a $5 tier?" reached lane ask changed, and opened a second ask).
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
// The old prompt with the old role ids named as the new role's and the old approvals hash as the tip's.
const freshPrompt = (m, prompt, approvals) => {
  let p = String(prompt).split(m.approvals).join(approvals);
  for (const r of ROLES) if (m.addresses[r]?.session) p = p.split(m.addresses[r].session).join(`<the new ${r} id: ${P3} address ${r}>`);
  for (const x of m.lanes || []) if (x.session) p = p.split(x.session).join(`<the new lane ${x.lane} id>`);
  return p;
};

export function restartActs(m, { by, cfg, approvals, addresses = m.addresses, messages = [], t = Date.now() }) {
  const L = [];
  // The manifest's ids: a switch in run again after (c) must not name the new roles as the old (review of PR 149).
  const old = (r) => m.addresses[r]?.session;
  for (const r of ROLES) if (old(r) && addresses[r]?.session && addresses[r].session !== old(r)) L.push(`note: ${r} is now addressed to ${addresses[r].session}, not the manifest's ${old(r)}: skip its start in (c) if that session is the new one`);
  // ROOT's coordinator address wins over the config's (Bob, 5 Nov 16:33): one naming another is
  // repointed by the coordinator itself once the config names it (ROOT would read its ask as data).
  const stale = addresses.coordinator?.session && addresses.coordinator.session !== by;
  const repoint = `\`${P3} start record coordinator ${by}\`, yourself: the coordinator address names ${addresses.coordinator?.session}, and the roles read it before the config`;
  L.push(coordinatorOf(cfg, addresses) === by
    ? `(a) The coordinator id: ${by} is already the coordinator (\`${P3} address coordinator\`).`
    : stale && cfg.coordinator === by ? `(a) The coordinator id: ${by} is \`coordinator\` in process/config.json on ${cfg.tranche}; then ${repoint}.`
    : `(a) The coordinator records its id: on a branch cut from origin/${cfg.tranche}, set "coordinator": "${by}" in process/config.json, push it with \`${P3} github push origin <branch>\`, open a pull request into ${cfg.tranche}, and merge it: \`${P3} merge <pr> --plain --no-review "coordinator id after the account switch"\`. The same on each product this coordinator holds (the probe too).${stale ? ` Then ${repoint}.` : ''}`);
  L.push(`(b) Wait for a quiet tranche: \`${P3} switch quiet\`, again until it exits 0 (the tip unmoved ${QUIET_MIN} min). Start nothing before.`);
  L.push(`(c) \`${P3} start root\`, then create_session with the call it prints; ROOT records its own address. Then send ROOT, each its own command for it:`);
  L.push(old('bob') ? `    - \`${P3} handover begin\` (old BOB ${old('bob')}), its create_session and \`handover confirm <new id>\`; skip the message to the old BOB and its archive: it is on the old account` : `    - \`${P3} start bob\`, its create_session and \`start record bob <new id>\``);
  L.push(old('watcher') ? `    - \`${P3} start watcher --replace ${old('watcher')}\`, its create_session, \`start record watcher <new id>\` and the daily task it prints` : `    - \`${P3} start watcher\`, its create_session, \`start record watcher <new id>\` and the daily task it prints`);
  L.push(m.tasks.length ? '(d) The scheduled tasks, after the starts, each a create_trigger call (the new ids from `address <role>`):' : '(d) No scheduled tasks to recreate.');
  for (const k of m.tasks) {
    const when = k.cron_expression ? { cron_expression: k.cron_expression } : k.run_once_at ? { run_once_at: k.run_once_at } : {};
    if (k.role.startsWith('lane ')) { L.push(`    - ${k.name || k.id} (${k.role}): created at (h), once the lane's new session is recorded`); continue; }
    if (k.role === 'not the process') { L.push(`    - ${k.name || k.id}: not the process's; Bob moves it himself if he wants it`); continue; }
    if (k.role === 'root' || k.role === 'watcher') { L.push(`    - ${k.name || k.id} (${k.role}): made by ${k.role === 'root' ? 'ROOT from its own prompt (sweep task)' : 'start watcher\'s output'}, with the current approvals; nothing to do here`); continue; }
    if (k.run_once_at && Date.parse(k.run_once_at) <= t) { L.push(`    - ${k.name || k.id}: its one time (${k.run_once_at}) has passed; recreate it only if it is still wanted`); continue; }
    const bound = k.fresh ? { create_new_session_on_fire: true } : k.role === 'coordinator' ? {} : ROLES.includes(k.role) ? { persistent_session_id: `<the new ${k.role} id: ${P3} address ${k.role}>` } : { persistent_session_id: `<unknown: it was bound to ${k.session || 'no session'}; the coordinator decides>` };
    L.push(`    - ${k.name || k.id} (${k.role}${k.role === 'coordinator' ? ', created from the coordinator session itself' : ''}): ${JSON.stringify({ name: k.name, ...when, ...bound, prompt: freshPrompt(m, k.prompt, approvals) })}`);
  }
  // Each job by routeFor's route (job.mjs): an open pull request, or BLOCKED, is a --restart; a
  // WORKING start with one commit resumes; anything else is routeFor's words for BOB.
  const open = (j) => String(j.pr || '').startsWith('#');
  const state = (j) => String(j.state).split(' ')[0];
  const restart = m.jobs.filter((j) => open(j) || state(j) === 'BLOCKED');
  const resume = m.jobs.filter((j) => !restart.includes(j) && state(j) === 'WORKING' && j.ahead === 1);
  const other = m.jobs.filter((j) => !restart.includes(j) && !resume.includes(j));
  const rel = (j) => (j.release ? ' (release path)' : '');
  L.push(restart.length || resume.length ? '(e) BOB restarts every recorded job, release path first, each its own command, then the create_session it prints:' : '(e) No recorded job to restart.');
  for (const j of restart) L.push(`    - \`${P3} job start ${j.module} --restart "account switch: its session ${j.session} was on the old Claude account" --stop idle\`${rel(j)}`);
  for (const j of resume) L.push(`    - \`${P3} job start ${j.module} --sessions <list_sessions saved now>\` (an unfinished start resumes)${rel(j)}`);
  for (const j of other) L.push(`    - ${j.module}: ${j.state}${j.pr ? `, PR ${j.pr}` : ''}: ${['WORKING', 'COMPLETE'].includes(state(j)) ? routeFor(j.module, { state: state(j), ahead: j.ahead, open: open(j) }) : 'nothing to restart'}${rel(j)}`);
  // The layer flow (R16): BOB starts each open layer's jobs from layer jobs.
  L.push((m.layers || []).length
    ? `(f) BOB, for each open layer (${m.layers.join(', ')}): \`${P3} layer jobs <n>\`, then each start it lists, each its own command.`
    : `(f) BOB: \`${P3} status --role bob --sessions <list_sessions saved now>\`, then each \`job start\` its \`jobs to start\` lists.`);
  // Those to BOB stay in the record, where the new BOB's \`status --role bob\` lists them: the copy's
  // dry run (6 Nov) held 211, 201 of them to BOB (147 MERGER refusals), a resend each.
  const toBob = messages.filter((x) => x.to === 'bob'), rest = messages.filter((x) => x.to !== 'bob');
  if (toBob.length) L.push(`(g) ${toBob.length} unanswered message(s) to BOB stay in the record: the new BOB reads them with \`${P3} status --role bob\`; resend none.`);
  L.push(rest.length ? `(g) The other unanswered messages, re-addressed: deliver each with send_message to the new session (\`${P3} address <role>\`, or the new job <id> session), then \`${P3} send delivered <n> --from <sender>\`:` : `(g) No other unanswered messages.`);
  for (const x of rest) L.push(`    - ${x.from}-${x.n} to ${x.to}${ROLES.includes(x.to) ? '' : ' (the new job session)'}: "MSG ${x.from}-${x.n} to ${x.to}: ${x.text}"`);
  // The lanes (R16): each seat the old account held restarts from git; its open asks stay recorded
  // and go to the new session. The old seat's session is retired, so R13 ends it at the sweep.
  const seats = (m.lanes || []).filter((x) => x.session);
  L.push(seats.length ? '(h) BOB restarts each lane that had a session, each its own command, then the create_session it prints and its --record:' : '(h) No lane had a session.');
  for (const x of seats) {
    const asks = (m.asks || []).filter((a) => a.lane === x.lane).length;
    // The retired seat ends at ROOT's first sweep (expire.mjs), which can run before (h): then a
    // plain lane start; --replace only while the seat still shows the old session (review of R16).
    L.push(`    - \`${P3} lane start ${x.lane}\` (\`--replace ${x.session}\` if it says the seat is still held), then \`${P3} lane start ${x.lane} --record <new id>\`${asks ? `; then send it its ${asks} open ask(s), each brief printed by:` : ''}`);
    // Each ask with its own --context files, as first asked (cold review of R16: a bare re-ask lost them).
    for (const a of (m.asks || []).filter((y) => y.lane === x.lane)) L.push(`      ${P3} lane ask ${x.lane} ${shq(a.question)}${(a.context || []).map((c) => ` --context ${shq(c)}`).join('')}`);
  }
  // The tasks bound to a lane's session, now that its new id is recorded.
  for (const k of m.tasks.filter((x) => x.role.startsWith('lane '))) {
    const when = k.cron_expression ? { cron_expression: k.cron_expression } : k.run_once_at ? { run_once_at: k.run_once_at } : {};
    if (k.run_once_at && Date.parse(k.run_once_at) <= t) { L.push(`    - ${k.name || k.id}: its one time (${k.run_once_at}) has passed; recreate it only if it is still wanted`); continue; }
    L.push(`    - then ${k.name || k.id} (${k.role}): ${JSON.stringify({ name: k.name, ...when, persistent_session_id: `<the new ${k.role} id you recorded>`, prompt: freshPrompt(m, k.prompt, approvals) })}`);
  }
  return L;
}

// switch in --sessions <list_sessions file> --by <session> [--approvals <hash>]: the first act on
// the new account. Refuses, starting nothing, unless every preflight check holds.
// The checks only a session can run (the tool cannot call Claude's tools): what the old account holds
// that git does not, each with the step that moves it and who takes it (R16, the inventory).
export const SESSION_CHECKS = [
  ['claude.ai documents', 'read the Foundations and the Ledger map with the docs connector (read of each link), then write: create a comment "switch canary <date>" on the Foundations and delete it', 'Bob, on the old account: share each process document (Foundations, Ledger map, Keep and Drop Ledger, the lanes\' design documents, the review standard) with the new account with edit access'],
  ['cloud environment', 'get_environment: network access, the network secret for api.cloudflare.com, the variables BIO_*, CLOUDFLARE_*, JOURNEY_* and GITHUB_TOKEN, and the walks\' setup script', 'Bob: recreate the environment on the new account (its values are not readable here; he re-enters them) and start the coordinator in it'],
  ['Cloudflare', 'an HTTPS GET of https://api.cloudflare.com/client/v4/user/tokens/verify answers 200', 'Bob: the Cloudflare connector on the new account, or the environment\'s network secret'],
  ['Google Drive', 'list_recent_files with pageSize 1 answers', 'Bob: connect Google Drive on the new account (claude.ai, Settings, Connectors)'],
  ['scheduled tasks', 'list_triggers answers (create none)', 'the coordinator, after switch in: the tasks from the manifest, act (d)'],
];
export const sessionCheckLines = () => ['Session checks (run each with your own tools; report each result to the coordinator, ok or failed with its words):', ...SESSION_CHECKS.map(([what, how, fix], i) => `  ${i + 1}. ${what}: ${how}. Failed: ${fix}.`)];

export function switchIn(root, { sessions, by, approvals, preflight: only = false, slug = repoSlug(root), io = {}, log = console.log } = {}) {
  by_(by);
  if (!only && typeof sessions !== 'string') fail('--sessions <file>: your list_sessions result on this account, saved as JSON');
  if (approvals !== undefined && !/^[0-9a-f]{64}$/.test(String(approvals))) fail('--approvals <hash>: the 64-hex hash of the tranche tip\'s approvals switch in printed');
  if (typeof sessions === 'string') readSessions(sessions);
  const cfg = loadConfig(root);
  if (!fetchState(root, cfg.state_branch)) fail(`no ${cfg.state_branch} on origin: nothing to switch in`);
  // --preflight (R16): every check, read-only, from any session on either account, before anything
  // stops; against the real manifest if there is one, else none (the approvals are not compared).
  if (only) {
    let m0 = null;
    try { m0 = JSON.parse(readState(root, cfg.state_branch, MANIFEST_FILE) || 'null'); } catch { m0 = null; }
    // A manifest an earlier switch in already used is spent: its approvals are not today's (review of R16).
    let spent = false;
    try { spent = !!m0 && JSON.parse(readState(root, cfg.state_branch, RETIRED_FILE) || 'null')?.manifest_at === m0.at; } catch { spent = false; }
    if (spent) m0 = null;
    log(`switch in --preflight: read-only; ${m0 ? `the manifest by ${m0.by} at ${m0.at}` : `${spent ? 'the manifest is an earlier switch\'s, already switched in' : 'no manifest yet'} (the approvals are not compared)`}`);
    const checks = preflight(root, m0, { slug, approvals, cfg, ...io });
    for (const c of checks) log(`- ${c.ok ? 'ok' : 'FAILED'}: ${c.line}${c.ok ? '' : `. Fixes it: ${c.fix}`}`);
    for (const l of sessionCheckLines()) log(l);
    const bad = checks.filter((c) => !c.ok);
    log(bad.length ? `preflight: ${bad.length} check(s) failed; fix them before the switch` : 'preflight: every tool check holds; now the session checks above');
    return { ok: !bad.length, checks };
  }
  const text = readState(root, cfg.state_branch, MANIFEST_FILE);
  if (text === null) fail(`no ${MANIFEST_FILE} on ${cfg.state_branch}: the old account runs switch out first`);
  let m;
  try { m = JSON.parse(text); } catch { fail(`${MANIFEST_FILE} on ${cfg.state_branch} is not JSON`); }
  log(`switch in: the manifest by ${m.by} at ${m.at}: ${m.tasks.length} task(s), ${m.jobs.length} job(s), ${m.messages.length} message(s)`);
  log('Preflight:');
  const checks = preflight(root, m, { slug, approvals, cfg, ...io });
  for (const c of checks) log(`- ${c.ok ? 'ok' : 'FAILED'}: ${c.line}${c.ok ? '' : `. Fixes it: ${c.fix}`}`);
  const bad = checks.filter((c) => !c.ok);
  if (bad.length) fail(`switch in refused: ${bad.length} preflight check(s) failed; nothing was started. Each names who fixes it; run switch in again once fixed`);
  const tranche = loadConfig(root, `refs/remotes/origin/${cfg.tranche}`);
  const addresses = readAddress(root, { fetch: false });
  // The manifest's unanswered messages and any the record has gained since, once each.
  const seen = new Map([...m.messages, ...unanswered(root, cfg.state_branch)].map((x) => [`${x.from}-${x.n}`, x]));
  // The old account's sessions, retired: R13's session_gone holds for each from now (ends.mjs),
  // so a lane seat or anything else bound to one is ended by the tool, not by hand.
  const retired = (m.sessions || []).filter((x) => x !== by);
  // Written even when it names none: it marks the manifest spent (cold review of R16).
  {
    writeState(root, cfg.state_branch, `switch in: ${retired.length} session(s) of the old account retired`, (wt) => {
      mkdirSync(dirname(join(wt, RETIRED_FILE)), { recursive: true });
      let prev = [];
      try { prev = JSON.parse(readFileSync(join(wt, RETIRED_FILE), 'utf8')).sessions || []; } catch { prev = []; }
      writeFileSync(join(wt, RETIRED_FILE), JSON.stringify({ at: now(), by, manifest_at: m.at, sessions: [...new Set([...prev, ...retired])] }, null, 2) + '\n');
    });
    log(`retired ${retired.length} session(s) of the old account (${RETIRED_FILE}): what is bound to them ends by R13's session_gone at ROOT's next sweep`);
  }
  log('Restart, in order, each act its own command:');
  for (const l of restartActs(m, { by, cfg: { ...tranche, tranche: cfg.tranche }, approvals: tipApprovals(root, cfg).approvals, addresses, messages: [...seen.values()] })) log(l);
  return { ok: true, manifest: m };
}

// ===== file: layer.test.mjs =====

// Build Plan Phase 3: a layer ready to close, layer close, and the next layer (INT-4, ARC-4).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { layerClose } from '../lib/layer.mjs';
import { CLOSED_FILE, status } from '../lib/status.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';

const quiet = () => {};
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';
const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a, b |\n| 2 | next | d |\n';
const done = (id) => entry(id, { requirements: `build/requirements/${id}.md`, status: { state: 'COMPLETE' } });
const base = {
  'build/layers.md': LAYERS,
  'build/requirements/a.md': unmet(2),
  'build/requirements/b.md': unmet(0),
  'build/requirements/d.md': unmet(1),
  'process/ledger/a.json': done('a'),
  'process/ledger/b.json': done('b'),
};

// The state branch, as origin's copy, holding the given closed rows.
function closedOn(root, rows) {
  git(['checkout', '-q', '--orphan', 's'], { cwd: root });
  git(['rm', '-rqf', '.'], { cwd: root });
  commit(root, { [CLOSED_FILE]: rows.map((r) => JSON.stringify({ row: 'closed', tranche: 'tranche', ...r })).join('\n') + '\n' });
  git(['update-ref', 'refs/remotes/origin/process-state', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['branch', '-D', 's'], { cwd: root });
}

test('layer ready to close with marks left: no next work in it, BOB\'s act is layer close', () => {
  const root = makeRepo(base);
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 1);
  assert.equal(r.layer.ready, true);
  assert.deepEqual(r.next, []);
  assert.match(out.join('\n'), /^layer 1 ready to close: node \.process\/tool\/p3\.mjs layer close 1$/m);
  assert.doesNotMatch(out.join('\n'), /next work/);
});

test('layer not ready while a module of it has an open job', () => {
  const root = makeRepo({ ...base, 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }) });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 1);
  assert.equal(r.layer.ready, false);
  assert.doesNotMatch(out.join('\n'), /ready to close/);
});

test('a closed layer: the next layer is listed, its deferred marks shown and not listed as work', () => {
  const root = makeRepo(base);
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  closedOn(root, [{ layer: 1, commit: tip, deferred: { a: ['R1', 'R2'] } }]);
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 2);
  assert.deepEqual(r.next.map((x) => x.file), ['build/requirements/d.md']);
  assert.deepEqual(r.layer.deferred, [{ layer: 1, id: 'a', count: 2 }]);
  assert.match(out.join('\n'), /deferred at layer close \(not work\):\n- a \(layer 1\): 2\n/);
  assert.match(out.join('\n'), /next work, layer 2 .*\n- build\/requirements\/d\.md: 1 \(layer 2\)$/);
  // A row whose commit is already on main (a tranche merged before) does not count.
  git(['update-ref', 'refs/remotes/origin/main', tip], { cwd: root });
  assert.equal(status(root, { role: 'bob', offline: true, log: quiet }).layer.cur.n, 1);
  // Online, GitHub's compare says whether it is on main (a shallow clone cannot): here it is not.
  git(['update-ref', '-d', 'refs/remotes/origin/main'], { cwd: root });
  git(['remote', 'add', 'origin', join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'p.git')], { cwd: root });
  const asked = [];
  const on = (ahead) => ({ openPRs: () => [], checkRun: () => null, compare: (s, b, h) => { asked.push([s, b, h]); return { ahead_by: ahead }; } });
  assert.equal(status(root, { role: 'bob', log: quiet, io: on(1) }).layer.cur.n, 2);
  assert.deepEqual(asked.at(-1).slice(1), ['main', tip]);
  assert.equal(status(root, { role: 'bob', log: quiet, io: on(0) }).layer.cur.n, 1);
});

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  return { root, bare };
}
const io = { openPRs: () => [], checkRun: () => null, compare: () => null };
const PASS = "import test from 'node:test';\ntest('ok', () => {});\n";
const FAIL = "import test from 'node:test';\ntest('no', () => { throw new Error('x'); });\n";

test('layer close: runs the suites on the tranche tip, records the close with its deferred marks, prints the next layer', () => {
  const { root, bare } = withOrigin({ ...base, 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': PASS, 'process/ledger/b.json': { ...done('b'), tests: ['test/b/'] }, 'test/b/x.test.mjs': PASS });
  const out = [];
  const r = layerClose(root, '1', { io, log: (m) => out.push(m) });
  assert.equal(r.ok, true);
  assert.match(out.at(-1), /^next act: node \.process\/tool\/p3\.mjs job start --ready --live <n>/, 'BOB closing the layer starts its ready jobs next');
  const row = JSON.parse(git(['show', `process-state:${CLOSED_FILE}`], { cwd: bare }));
  assert.equal(row.layer, 1);
  assert.equal(row.commit, git(['rev-parse', 'tranche'], { cwd: bare }));
  assert.deepEqual(row.deferred, { a: ['R1', 'R2'] });
  assert.match(out.join('\n'), /layer 1 closed at tranche .*; deferred: a 2[\s\S]*next work, layer 2[\s\S]*- build\/requirements\/d\.md: 1/);
  // BOB closing (the default sender) is awake: no wake line.
  assert.equal(r.wake, null);
  assert.doesNotMatch(out.join('\n'), /wake BOB/);
  // Another session's close gives BOB new work (measured 3-4 Nov: BOB idles until woken): its last
  // line is the wake, runnable as printed, from --as.
  const { root: other } = withOrigin({ ...base, 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': PASS, 'process/ledger/b.json': { ...done('b'), tests: ['test/b/'] }, 'test/b/x.test.mjs': PASS });
