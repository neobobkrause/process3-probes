// ===== file: roles.test.mjs (continued) =====

  assert.throws(() => senderOf(null, '<role>'), /a role name/);
  assert.throws(() => senderOf(null, true), /--as <role>/);
  assert.throws(() => bobWake('x', '<role>'), /sender's role name/);
  assert.equal(wakeLine('x', 'bob'), null);
  const cmd = bobWake('layer 2 closed', 'coordinator');
  const argv = cmd.replace(/^node \.process\/tool\/p3\.mjs /, '').match(/"[^"]*"|\S+/g).map((t) => t.replace(/^"|"$/g, ''));
  assert.deepEqual(parseArgs(argv), { _: ['send', 'bob', 'layer 2 closed: run status'], from: 'coordinator' });
});

// ===== file: expire.mjs =====

// Stale records found and cleared by the process (R13; Bob, 6 Nov: "fix process3 to anticipate and
// address these kinds of situations"). staleRecords lists every recorded state whose end
// condition holds or whose referent is gone (ends.mjs keeps the inventory); expireRecords ends,
// with a row naming the condition, each one the tool can end on its own: a hold whose condition
// is met, a lane seat whose session is gone. The rest are reported, each with what ends it.
// Nothing here prints a command for a person to type: the tool's next write ends what it can.
import { BY_TOOL, expireHolds, readHolds } from './hold.mjs';
import { LANE_SESSIONS_FILE, lanes, openAsks, readSeats, seatsOf } from './lane.mjs';
import { readFacts } from './ends.mjs';
import { addressFile, jsonl, readState, writeState } from './state.mjs';
import { now } from './util.mjs';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROLES = ['root', 'bob', 'watcher', 'merger', 'coordinator'];

// [{ kind, id, why, auto }]: auto, the tool ends it at its next write; else reported only.
// listed: list_sessions' result, or null (session conditions unknown, nothing said of them).
export function staleRecords(root, cfg, { listed = null, t = Date.now(), facts, holds: given } = {}) {
  const f = facts ?? readFacts(root, cfg, { listed, t });
  const out = [];
  const sb = cfg.state_branch;
  // Holds: a condition met (auto); a live one whose words give no checkable end (reported once:
  // it holds until its --until time or its pull requests).
  let holds = [];
  try { holds = given ?? readHolds(root, sb, { offline: true, t, facts: f }); } catch { holds = []; }
  for (const h of holds) {
    if (h.met && !h.ended && h.left > 0) out.push({ kind: 'hold', id: h.id, why: `${h.scope}: ${h.met.why}${h.conds_from === 'words' ? ' (read from its words)' : ''}`, auto: true });
    else if (h.live && !h.conds.length && !(h.prs || []).length && /\buntil\b|\bwhen\b|\bonce\b|\bafter\b/i.test(h.why)) out.push({ kind: 'hold', id: h.id, why: `${h.scope}: its words name an end the tool cannot check (${h.unparsed}); it holds until ${h.until || 'ended'}`, auto: false });
  }
  // Lane seats whose session is gone (auto), and asks of a lane no longer configured (reported).
  let seats = new Map();
  try { seats = readSeats(root, cfg); } catch { seats = new Map(); }
  for (const s of seats.values()) {
    if (s.session && f.sessionGone(s.session) === true) out.push({ kind: 'lane seat', id: s.lane, why: `its session ${s.session} is archived or retired`, auto: true, seat: s });
  }
  let names = null;
  try { names = new Set(lanes(cfg).map((l) => l.name)); } catch { names = null; }
  if (names) {
    let asks = [];
    try { asks = openAsks(root, cfg); } catch { asks = []; }
    for (const a of asks) if (!names.has(a.lane)) out.push({ kind: 'lane ask', id: `${a.lane}: ${String(a.question).slice(0, 60)}`, why: `lane ${a.lane} is no longer in the config; a recorded decision (lane ask --record) or the lane's return ends it`, auto: false });
  }
  // Role addresses and the config's coordinator whose session is gone (reported: a role's next
  // session is named by handover or address, the config by a pull request).
  for (const role of ROLES) {
    let a = null;
    try { a = JSON.parse(readState(root, sb, addressFile(role)) || 'null'); } catch { a = null; }
    if (a?.session && f.sessionGone(a.session) === true) out.push({ kind: 'address', id: role, why: `${role}'s address names ${a.session}, which is archived`, auto: false });
  }
  if (typeof cfg.coordinator === 'string' && f.sessionGone(cfg.coordinator) === true) out.push({ kind: 'config', id: 'coordinator', why: `process/config.json names the coordinator ${cfg.coordinator}, which is archived`, auto: false });
  return out;
}

export const staleLines = (xs) => (xs.length ? [`stale records: ${xs.length} (${xs.filter((x) => x.auto).length} the tool ends at its next write)`, ...xs.map((x) => `- ${x.kind} ${x.id}: ${x.why}${x.auto ? '; the tool ends it' : ''}`)] : []);

// Ends what the tool can: holds whose condition is met (hold.mjs expireHolds) and lane seats whose
// session is gone (an end row by process3, naming why). Returns { holds, seats }; a write that
// fails is said, never a refusal of the act that ran it.
export function expireRecords(root, cfg, { listed = null, log = console.log, t = Date.now() } = {}) {
  const sb = cfg.state_branch;
  const out = { holds: [], seats: [] };
  let f = null;
  try { f = readFacts(root, cfg, { listed, t }); } catch { f = null; }
  if (!f) return out;
  try { out.holds = expireHolds(root, sb, { facts: f, log, t }); } catch (e) { log(`holds whose condition is met were not ended (${String(e.message).split('\n')[0].slice(0, 160)}); the next write tries again`); }
  // With list_sessions, or for a session an account switch retired (R16), list or not.
  {
    let seats = [];
    try { seats = [...readSeats(root, cfg).values()].filter((s) => s.session && f.sessionGone(s.session) === true); } catch { seats = []; }
    if (seats.length) {
      try {
        writeState(root, sb, `lane seats ended: ${seats.map((s) => s.lane).join(', ')} (session gone)`, (wt) => {
          const live = seatsNow(wt);
          for (const s of seats) {
            const now0 = live.get(s.lane);
            if ((now0?.session || null) !== s.session || (now0?.at || null) !== (s.at || null)) continue;
            const p = join(wt, LANE_SESSIONS_FILE);
            mkdirSync(dirname(p), { recursive: true });
            appendFileSync(p, JSON.stringify({ row: 'end', at: now(), lane: s.lane, session: s.session, by: BY_TOOL, why: `session_gone:${s.session} met (archived, or retired by an account switch)` }) + '\n');
          }
          return {};
        });
        for (const s of seats) log(`lane ${s.lane}: its seat ended by the tool (session ${s.session} is archived, or retired by an account switch); lane start ${s.lane} starts the next when there is work`);
        out.seats = seats.map((s) => s.lane);
      } catch (e) { log(`lane seats whose session is gone were not ended (${String(e.message).split('\n')[0].slice(0, 160)})`); }
    }
  }
  return out;
}
// The seats as the state worktree holds them now (a concurrent write is not undone).
const seatsNow = (wt) => seatsOf(existsSync(join(wt, LANE_SESSIONS_FILE)) ? jsonl(readFileSync(join(wt, LANE_SESSIONS_FILE), 'utf8')) : []);

// ===== file: ghhook.mjs =====

// p3 github hook (R17c; Bob, 6 Nov: ALL GitHub traffic monitored and limited, enforced, not by
// rule): a Claude Code PreToolUse hook. It reads the hook's JSON on stdin and decides:
//   mcp__github__*  the connector call is counted in the ledger and takes its turn exactly as a gh
//                   call would (the pause, the stop, the windows, at most a 15 min wait): a read
//                   1 point; a write (create, update, add, merge, comment, review, ...) one
//                   content-creating request, 5 points; one that moves a ref on GitHub (a merge, a
//                   file write, a branch) also a push against the ceiling. Refused: exit 2.
//   Bash            a raw `git push`, any `gh` command, or curl or wget to github.com is refused
//                   (exit 2), naming the tool's way instead; the tool's own commands
//                   (node .process/tool/p3.mjs, node tool/p3.mjs) pass, and everything else.
// Exit 2 blocks the call, with the reason on stderr for the session (Claude Code's hook contract).
// The settings that call it are Bob's (notes/r17c-settings.md).
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { kickRefresh, LEDGER_CACHE, ledgerOf, peekShare, refreshDone, stateShare } from './ghshare.mjs';
import { commonDir, hookPacing, pacing, Paced, primaryState, reserve, TOOL, useShared } from './pace.mjs';
import { CONFIG_FILE, loadConfig, repoRoot } from './util.mjs';

// The connector's writes: each one content-creating request.
const WRITE = /^(create|update|add|delete|merge|push|fork|assign|label_write|issue_write|sub_issue_write|pull_request_review_write|request_copilot_review|resolve_review_thread|unresolve_review_thread|enable_pr_auto_merge|disable_pr_auto_merge|actions_run_trigger|actions_rerun|rerun|cancel|run_secret_scanning|submit|dismiss|star|unstar|mark)/;
// Those that also move a ref on GitHub: a push GitHub shows.
const MOVES_REF = new Set(['merge_pull_request', 'push_files', 'create_or_update_file', 'delete_file', 'create_branch', 'update_pull_request_branch']);
// The Bash check reads the command as the shell would, enough to find what runs (cold review of
// R17c: a regex was passed by subshells, `bash -c`, wrappers, absolute paths and aliases, and
// blocked commit messages that mention git push): heredoc bodies and comments dropped; words split
// with quotes kept inside their word; a segment ends at ; & | newline ( ) ` and $( ; leading
// assignments and wrappers (sudo, env, time, nohup, timeout N, xargs, nice, command, exec, !,
// then, do, else, if, while, until) skipped; `bash -c`, `sh -c` and `eval` read again inside.
const WRAPPERS = new Set(['sudo', 'env', 'time', 'nohup', 'timeout', 'xargs', 'nice', 'command', 'exec', '!', 'then', 'do', 'else', 'if', 'while', 'until', 'elif', 'stdbuf', 'unbuffer']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);
const GIT_VALUED = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--config-env']);
function words(cmd) {
  const text = String(cmd || '').replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(\n|$)/g, '\n');
  const segs = [];
  let seg = [];
  let w = null;
  const end = () => { if (w !== null) { seg.push(w); w = null; } };
  const brk = () => { end(); if (seg.length) segs.push(seg); seg = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'") { const j = text.indexOf("'", i + 1); w = (w || '') + text.slice(i + 1, j < 0 ? text.length : j); i = j < 0 ? text.length : j; continue; }
    if (c === '"') { let j = i + 1; let v = ''; while (j < text.length && text[j] !== '"') { if (text[j] === '\\' && j + 1 < text.length) { v += text[j + 1]; j += 2; } else v += text[j++]; } w = (w || '') + v; i = j; continue; }
    if (c === '\\' && i + 1 < text.length) { if (text[i + 1] === '\n') { i++; continue; } w = (w || '') + text[++i]; continue; }
    if (c === '#' && w === null) { while (i < text.length && text[i] !== '\n') i++; brk(); continue; }
    if (c === '$' && text[i + 1] === '(') { brk(); i++; continue; }
    if (';&|\n()`'.includes(c)) { brk(); continue; }
    if (/\s/.test(c)) { end(); continue; }
    w = (w || '') + c;
  }
  brk();
  return segs;
}
const base = (x) => String(x).replace(/^\\/, '').split('/').pop();
function segVerdict(seg, depth, tool) {
  let i = 0;
  while (i < seg.length && (/^\w+=/.test(seg[i]) || WRAPPERS.has(base(seg[i])) || (i > 0 && WRAPPERS.has(base(seg[i - 1])) && (/^-/.test(seg[i]) || /^\d+[smhd]?$/.test(seg[i]))))) i++;
  const cmd = base(seg[i] || '');
  const rest = seg.slice(i + 1);
  if (SHELLS.has(cmd)) { const k = rest.findIndex((x) => /^-\w*c\w*$/.test(x)); return k >= 0 && rest[k + 1] && depth < 4 ? bashVerdict(rest[k + 1], depth + 1, tool) : null; }
