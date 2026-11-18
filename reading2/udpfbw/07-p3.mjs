#!/usr/bin/env node
// Process3 tool: one program, a fresh process per command, run from the pinned clone.
// Usage: node <clone>/tool/p3.mjs <command> [args]
// p3-capability: gate-no-post (products' older shims grep for this line at the pin; keep it until
// every product carries the shim without the legacy path; review B of PR 32)
// p3-capability: gate-class (the gate shim runs `gate-class` before the browser install only when
// the pin has it: C45b)
import { expireRecords } from './lib/expire.mjs';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gate, gateClassAt, postRow } from './lib/gate.mjs';
import { browserNeeded, gateRepo } from './lib/gateclass.mjs';
import { pinCheck, pinMove } from './lib/pin.mjs';
import { nextRound, layerJobs, layerJoin, layerLand, layerMerge, layerOpen, layerPublish, layerReport, layerClear, layerRetest, layerStatus, layerSync, layerPin, layerPinOpen } from './lib/layerflow.mjs';
import { layerMode, layersAt } from './lib/layerbase.mjs';
import { directJobs } from './lib/direct.mjs';
import { laneArtifact, laneAsk, laneEnd, laneStart } from './lib/lane.mjs';
import { TOOL_ROOT, jobBlock, jobComplete, jobStart, jobSync, jobTest, revertExempt } from './lib/job.mjs';
import { branchModule, checkLedger, homeRef, ledgerIds } from './lib/ledger.mjs';
import { appendRow, bobMetricsFile, recordRefusal, recordWake, report as metricsReport, stateRoles } from './lib/metrics.mjs';
import { statelessWake, survivalReport, wholeHistory } from './lib/measures.mjs';
import { leadInputs } from './lib/lead.mjs';
import { merge, mergePlain, processRepo } from './lib/merge.mjs';
import { capCheck } from './lib/cap.mjs';
import { deployDev, deployRelease, walkInternal, walkRound } from './lib/deploy.mjs';
import { found } from './lib/found.mjs';
import { roundNext } from './lib/roundnext.mjs';
import { hold, OWED_FILE, owe, owes, paidUpTo, paysOwed } from './lib/hold.mjs';
import { checkVersion, releaseBody, releaseDev, releaseRun, releaseSign } from './lib/release.mjs';
import { leadFetch, trancheReport } from './lib/report.mjs';
import { reviewBrief } from './lib/review.mjs';
import { setupCheck } from './lib/setup.mjs';
import { prune } from './lib/branches.mjs';
import { compareRanges, loadRanges, measureSize, sizeLines } from './lib/size.mjs';
import { startCheck, wakeCheck, workdirLines } from './lib/start.mjs';
import { layoutMove } from './lib/layout.mjs';
import { checkRole, coordinatorOf, senderOf, handoverBegin, handoverConfirm, promptRefresh, readAddress, recordStart, startRole, tipApprovals, tipConfig } from './lib/roles.mjs';
import { bookkeep, fetchState, flushState, handoff, jsonl, outcome, pendingWrites, readState, send, stateBatch, strandedWrites, writeState, stateReplay } from './lib/state.mjs';
import { githubBudget } from './lib/pace.mjs';
import { closedRows, noticeSlots, status } from './lib/status.mjs';
import { noticeTriage, recordTriage } from './lib/triage.mjs';
import { PROCESS_ROOT, triageAdd, triageChoose, triageClose, triageList } from './lib/register.mjs';
import { withdrawNotice } from './lib/notice.mjs';
import { getPR } from './lib/github.mjs';
import { SWEEP_ROWS_FILE, beforeAct, sweep, sweepTask, watch } from './lib/sweep.mjs';
import { recordCheck, recordSince, takenIn } from './lib/record.mjs';
import { switchIn, switchOut, switchQuiet } from './lib/switch.mjs';
import { checkOpen, openLine, openState, recordOpen, trancheClose, trancheOpen } from './lib/tranche.mjs';
import { CONFIG_FILE, Fail, fail, git, list, loadConfig, now, parseArgs, repoRoot, repoSlug } from './lib/util.mjs';

// Machine-readable findings (ARC-5): printed one per line and, with --out, written as JSON.
export function report(findings, out, extra = {}) {
  for (const f of findings) console.log(`${f.check}: ${f.file}:${f.line}: ${f.message}`);
  if (out) writeFileSync(out, JSON.stringify({ ...extra, findings }, null, 2) + '\n');
  console.log(findings.length ? `${findings.length} finding(s)` : 'ok');
  return findings.length ? 1 : 0;
}

const one = (a, what) => a._[0] || fail(`name the ${what}`);
// A layer named by its number, or a round layer by --round <r> --layer <m> (Bob, 9 Nov: "layers are
// in rounds which are in tranches"; a round layer reads as "tranche T · round 2 · layer 11 (internal
// layer 13)"): the internal number of the round layer over the plan's layer m in round r, opened
// already or the round's next to open. --plan-layer is the same flag.
export function layerArg(a, root) {
  const r = a.round;
  if (a.layer !== undefined && a['plan-layer'] !== undefined) fail('--layer and --plan-layer are the same: give one');
  const m = a.layer ?? a['plan-layer'];
  if (r === undefined && m === undefined) return one(a, 'layer number (or --round <r> --layer <m>)');
  if (a._[0] !== undefined) fail('name the layer once: its internal number, or --round <r> --layer <m>');
  if (!/^[1-9]\d*$/.test(String(r)) || !/^[1-9]\d*$/.test(String(m))) fail('--round <r> --layer <m>: both, each a whole number from 1');
  const cfg = loadConfig(root);
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  git(['fetch', '-q', 'origin', `+refs/heads/${cfg.tranche}:${tr}`], { cwd: root, allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
  const layers = layersAt(root, cfg, tr);
  const at = layers.find((L) => L.round && L.round.n === Number(r) && L.round.of === Number(m));
  if (at) return at.n;
  if (Number(r) === 1) { const L = layers.find((x) => !x.round && !x.completion && x.n === Number(m)); if (L) return L.n; }
  let rs = null;
  try { rs = nextRound(root, cfg, layers, tr); } catch { rs = null; }
  if (rs?.next && rs.next.round === Number(r) && rs.next.of === Number(m)) return rs.next.n;
  return fail(`no layer is tranche ${cfg.tranche} · round ${r} · layer ${m}${rs?.next ? `; the next to open is round ${rs.next.round} · layer ${rs.next.of} (internal layer ${rs.next.n})` : ''}`);
}
// The pull request's base branch for the gate's class (C49): --base-ref, else the GITHUB_BASE_REF the
// runner sets on every step of a pull_request run (no shim change); none read, the class is full.
const baseRefOf = (a) => (typeof a['base-ref'] === 'string' && a['base-ref'] ? a['base-ref'] : process.env.GITHUB_BASE_REF || null);
const num = (v) => (v === undefined || v === 'unmeasured' ? 'unmeasured' : Number(v));

const commands = {
  // status [--role job --module <id> | --role bob [--context <percent of the window used>] [--live <n>] [--sessions <list_sessions JSON file>]] [--offline]
  status: (a, root) => { status(root, { role: a.role, module: a.module, context: a.context, live: a.live, sessions: a.sessions, offline: !!a.offline }); return 0; },

  // handoff [--context <percent>] [--note "<prose line>"]...: BOB's one-screen handoff, written
  // from status --role bob to the state branch's handoff/bob.md and pushed (SES-3).
  handoff: (a, root) => {
    const lines = [];
    const s = status(root, { role: 'bob', context: a.context, log: (l) => lines.push(l) });
    handoff(root, loadConfig(root).state_branch, { role: 'bob', tranche: s.tranche, lines, notes: list(a.note).filter((x) => x !== true) });
    return 0;
  },

  // send <to-role> "<text>" --from <role>: the record first, then the numbered message and the
  // address read from git, for the session to deliver with send_message (MSG-1, MSG-3).
  // send delivered <n> | send failed <n> --from <role> [--reason "..."]: the outcome (MSG-6).
  send: (a, root) => {
    const sb = loadConfig(root).state_branch;
    if (a._.length !== 2) fail('send <to-role> "<text>" --from <role>, the text in quotes; or send delivered|failed <n> --from <role>');
    const [first, second] = a._;
    if (first === 'delivered' || first === 'failed') {

// Rigg desk entered 17 larches on the sheet.

      outcome(root, sb, { from: a.from, n: Number(second), result: first, reason: typeof a.reason === 'string' ? a.reason : undefined });
    } else send(root, sb, { from: a.from, to: first, text: second });
    return 0;
  },

  // job start <id> --sessions <list_sessions JSON> (the job cap is counted from it; a bare --live <n> is refused, C28) [--coordinator <session>; default the addressed BOB] [--model <m>] [--reopen "<what>" | --restart "<why>" [--stop archived|idle] | --take-in <branch or PR>] [--over-cap "<why>"] [--early]: BOB opens a job (--early: a next-layer module the open layer lists early, R14);
  // --stop, with --restart, how the replaced session stopped (archived, or idle); a BLOCKED job's stop is its BLOCKED commit;
  // --over-cap, BOB's reason to start one whose requirement file is over requirements_cap (REQ-6);
  // --take-in, on work made before Process3, every file of it inside the module's paths;
  // --reopen, a new attempt on a COMPLETE module whose last attempt merged, or on the next job/<id>-<n> when the last attempt was abandoned (commits, no open pull request); --restart, a replacement session for an open job, a COMPLETE one with its pull request open included;
  // --fresh-branch "<why>", a new attempt on job/<id>-<n> cut from the tranche tip, when the job's branch cannot merge (the old branch is kept);
  //   alone, with --reopen "<what>" for a COMPLETE module, or with --restart "<why>" for an OPEN one; the start row records both.
  // No job starts (a reopen included) until the tranche open's grants check has passed; a restart
  // continues a job already started.
  'job start': (a, root) => {
    // A restart on a fresh branch is a new start: it waits on the grants check as any start does.
    if (a.restart === undefined || a['fresh-branch'] !== undefined) {
      const cfg = loadConfig(root);
      fetchState(root, cfg.state_branch, { fresh: true });
      const o = openState(root, cfg);
      if (o.state !== 'open') fail(`${openLine(o)}; nothing was started`);
    }
    // --fresh-branch goes with --reopen (a COMPLETE module) or --restart (an OPEN one), or alone.
    if ([a.reopen, a.restart, a['take-in']].filter((v) => v !== undefined).length > 1) fail('job start takes one of --reopen, --restart and --take-in');
    if (a['fresh-branch'] !== undefined && a['take-in'] !== undefined) fail('--fresh-branch goes alone, with --reopen or with --restart, not with --take-in');
    if (a.stop !== undefined && a.restart === undefined) fail('--stop archived|idle goes with --restart: how the replaced session stopped');
    if (a.early !== undefined && (a.restart !== undefined || a['take-in'] !== undefined || a['fresh-branch'] !== undefined)) fail('--early is a first start of a next-layer module: not with --restart, --take-in or --fresh-branch');
    if (a.restart === undefined) capCheck(root, { live: a.live, sessions: a.sessions, log: console.log });
    jobStart(root, one(a, 'module'), { coordinator: a.coordinator, model: a.model, reopen: a.reopen, restart: a.restart, stop: a.stop, takeIn: a['take-in'], fresh: a['fresh-branch'], overCap: a['over-cap'], early: !!a.early });
    return 0;
  },

  // job complete <id> [--no-suite] [--session <id>] [--cost-usd <usd>] (the cost is BOB's at the merge)
  'job complete': (a, root) => (jobComplete(root, one(a, 'module'), {
    noSuite: !!a['no-suite'], costUsd: a['cost-usd'], session: a.session,
  }).ok ? 0 : 1),

  // revert exempt <pr> --why "<why>" --reviewer <session>: a reviewer's exemption from the gate's revert
  // check, for a refactor whose tests rightly pass before and after (AUD-1, JOB-12); never the job's own.
  'revert exempt': (a, root) => (revertExempt(root, one(a, 'pull request'), { why: a.why, reviewer: a.reviewer }).ok ? 0 : 1),

  // job sync <id>: the job brings its branch up to date: origin's job/<id> (BOB's pushes) and the
  // tranche merged in, both deepened from GitHub's compare in a shallow clone, then .process
  // updated to the branch's pin. From a clean checkout without job/<id>, it checks it out first.
  'job sync': (a, root) => (jobSync(root, one(a, 'module')).ok ? 0 : 1),

