// merge (GAT-8, INT-1): BOB brings a job's branch up to the tranche, writes the merge row, waits
// for the gate on that tip, and merges only a green, current tip. The merge is completion.
// merge runs with BOB's tool, not the pull request's, so it repeats the checks a pull request
// could switch off in its own copy of the gate workflow: ownership, and a receipt checked by the gate against its own run (AUD-2).
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { RECEIPT, checkRun, checkRuns, compare, comments, gateRuns, getPR, latestBlock, latestReceipt, openPRs, requiredChecks, verifyRow } from './github.mjs';
import { branchModule, checkLedger, entryFile, jobBranch, ledgerIds, originJobs } from './ledger.mjs';
import { appendRow, bobMetricsFile, metricsFile, readRows, rowsAt } from './metrics.mjs';
import { PASS_BRANCH, diffNames, entriesAt, ownPaths } from './gate.mjs';
import { webCommitByOwner } from './record.mjs';
import { blobAt, isBootstrap, lastConfigAt, mergedUnanchored, pinAt, unanchored } from './anchor.mjs';
import { P3, START_FIRST, START_NEXT, TOOL_ROOT, bobWake, costDelta, jobCostCall, sessionForm, toolPin, wakeLine } from './job.mjs';
import { mergedRange, noticeLine, notices, providerChange, recordAtMerge } from './notice.mjs';
import { triageAtMerge } from './triage.mjs';
import { flushState, pendingWrites, wakeOnce } from './state.mjs';
import { foundOnly } from './found.mjs';
import { generatedRows, ignoreLines, isGenerated, refreshOthers, removedGenerated } from './checks.mjs';
import { closeWorkflows, isJob } from './workflows.mjs';
import { flowFile, layerOfBranch } from './layerbase.mjs';
import { OUTSIDE, judgeWorkflow, refusal } from './workflow-limits.mjs';
import { reviewTriggers } from './triggers.mjs';
import { BASE_MOVED, CONFIG_FILE, DEFAULTS, Fail, RETRIES, SERVER_ERROR, fail, fetchJobRefs, gh, git, isRecordPath, isShallow, laneOnly, loadConfig, now, repoSlug, shallowCuts, underPath, withTemp } from './util.mjs';

import { pollMs } from './pace.mjs';
// Before a wait, the command's coalesced state writes are pushed (R17): others read them meanwhile.
const sleep = (ms) => { if (pendingWrites()) flushState(); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };
const MINUTE = 60000;
// Whether the job's metrics at rev hold a merge row for pull request n after its last receipt
// (complete row): the tip an earlier merge run pushed, or one that brought it up to the tranche.
const mergeRowSince = (rows, n) => rows.slice(rows.findLastIndex((r) => r.event === 'complete') + 1).some((r) => r.row === 'merge' && r.pr === n);

// The gate job's own cap (timeout-minutes in shims/process-gate.yml) and the default wait on it:
// the cap and a queue. merge waited 30 min and merge --plain 20 on a gate capped at 45, so a slow
// gate failed the merge while it still ran (defect sweep 4 Nov, #6 and #13).
// 90 since 5 Nov: the copy's slowest gates took 40-42 minutes and the old 45 cancelled them.
export const GATE_CAP_MINUTES = 90;
export const GATE_WAIT_MINUTES = 95;
const RUNNING = ['queued', 'in_progress', 'waiting', 'pending', 'requested'];
// Past the wait, a run still in progress is waited on until its own cap has passed since it
// started (and a margin); nothing else is: not started, queued, or cancelled.
const stillRunning = (run, t) => run?.status === 'in_progress'
  && (Number.isFinite(Date.parse(run.started_at)) ? Date.parse(run.started_at) + (GATE_CAP_MINUTES + 5) * MINUTE > t : true);

// Waits for a completed gate run on the commit. A cancelled run (superseded by another event on
// the same tip) is waited past. Each round reads the pull request (`pr`): once its head is
// neither the commit nor `was` (the head before the push, which GitHub may show for a moment),
// the gate on the commit will never finish (the gate's concurrency group cancels it), so the wait
// stops at once. After `minutes`, it goes on only while a run is in progress, up to its cap.
// A GitHub read that failed for a reason that passes (build train-inflight, option 8A: copy PR
// 290, 5 Nov 13:15, one HTTP 503 ended a 38-minute gate wait): a 5xx, a rate limit, a timeout or a
// dropped connection. The waits read again with a growing pause instead of failing.
export const TRANSIENT = (msg) => SERVER_ERROR.test(String(msg)) || /rate limit|HTTP 429|\b429 Too Many|timed out|timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|connection reset|socket hang up|Bad Gateway|Service Unavailable|Gateway Time-?out|unexpected EOF|TLS handshake|context deadline exceeded|connection refused/i.test(String(msg));
// No GitHub read again sooner than 30 s (R17, pace.mjs).
export const TRANSIENT_WAIT = { first: 30000, most: 300000 };
// Runs f; a transient Fail is returned as { err } for the caller's loop to read again, anything
// else is thrown.
// The budget's own refusals (pace.mjs) and GitHub's rate-limit refusals are never read again here:
// every later call waits for GitHub's reset itself, and a stop must show at once (cold review of R17).
const BUDGET = /^GitHub budget:|GitHub refused gh .* with a rate limit/;
const guarded = (f) => { try { return { v: f() }; } catch (e) { if (e instanceof Fail && TRANSIENT(e.message) && !BUDGET.test(e.message)) return { err: e }; throw e; } };
// The pause before the k-th read again in a row (15 s, 30 s, 60 s, then every 2 min by default),
// and the end: past the wait and the gate's own cap after it, the last error stands.
function transientPause(e, k, { until, log, wait = TRANSIENT_WAIT }) {
  if (Date.now() > until + GATE_CAP_MINUTES * MINUTE) throw e;
  const ms = Math.min(wait.most, wait.first * 2 ** (k - 1));
  log(`GitHub read failed (${e.message.split('\n')[0].slice(0, 160)}); transient: read again in ${Math.round(ms / 1000)} s (${k} in a row), still waiting on the same run`);
  sleep(ms);
}
// every: a fixed pause (the tests); unset, polls back off from pacing.poll_first_s to poll_most_s (R17).
export function waitForGate(slug, sha, { minutes = GATE_WAIT_MINUTES, every = null, read = checkRun, pr, was, log = console.log, transient } = {}) {
  let polls = 0;
  const until = Date.now() + minutes * MINUTE;
  let hard = null;
  let k = 0;
  for (;;) {
    const g = guarded(() => [pr?.(), read(slug, sha, 'gate')]);
    if (g.err) { transientPause(g.err, ++k, { until, log, wait: transient }); continue; }
    k = 0;
    const [p, run] = g.v;
    if (p && p.state && p.state !== 'open') fail(`the pull request is ${p.merged ? 'merged' : p.state} while the gate on ${sha.slice(0, 10)} was awaited; run merge again`);
    const at = p?.head?.sha;
    if (at && at !== sha && at !== was) fail(`${p.head.ref || 'the branch'} moved to ${at.slice(0, 10)} while the gate on ${sha.slice(0, 10)} was awaited: that gate will not finish; run merge again`);
    if (run?.status === 'completed' && run.conclusion !== 'cancelled') return run;
    const t = Date.now();
    if (t >= until) {
      // A run in progress with no start time is waited on for one more cap at most.
      if (run?.status === 'in_progress' && hard === null) hard = t + GATE_CAP_MINUTES * MINUTE;
      if (!stillRunning(run, t) || (hard !== null && !Number.isFinite(Date.parse(run.started_at)) && t > hard)) {
        fail(`the gate on ${sha.slice(0, 10)} did not finish within ${minutes} min (${run ? run.conclusion || run.status : 'not started'})`);
      }
    }
    log(`waiting for the gate on ${sha.slice(0, 10)} (${run ? run.conclusion || run.status : 'not started'})${t > until ? '; past the wait, still in progress' : ''}`);
    sleep(every ?? pollMs(++polls));
  }
}

// A pull request GitHub says cannot merge (mergeable false, or mergeable_state dirty: it
// conflicts with its base) is refused at once: GitHub starts no checks on it, so waiting on them
// waited 10+ minutes on "gate: not started" (copy PR 108, 4 Nov). Not yet computed (null), it is
// read again briefly, as checks are waited on; still unknown after `minutes`, it is refused.
// Returns the pull request as last read.
export function waitMergeable(slug, n, pr, { minutes = 3, every = null, read = getPR, log = console.log } = {}) {
  let polls = 0;
  const until = Date.now() + minutes * MINUTE;
  for (;;) {
    if (pr.mergeable === false || pr.mergeable_state === 'dirty') fail(`pull request ${n} conflicts with ${pr.base?.ref}; nothing was merged`);
    if (pr.mergeable !== null) return pr;
    if (Date.now() > until) fail(`GitHub has not said whether pull request ${n} can merge after ${minutes} min; nothing was merged`);
    log(`waiting for GitHub to compute whether pull request ${n} can merge`);
    sleep(every ?? pollMs(++polls));
    pr = read(slug, n);
  }
}

// The review-round limit (build I, 3 Nov), held by merge: round 1 is the two fresh reviews, round
// 2 the one fix pass and its confirming re-review of the fix. A merge states its rounds and
// records them; a third round or more is refused unless the command names the decision that
// allowed it, which is recorded with them. A merge with no review has no rounds.
export const MAX_ROUNDS = 2;
export function reviewRounds({ reviewed, noReview, rounds, decision, pass } = {}) {
  // A pass (P7) needs no judgment, so no review: its record is its own words.
  if (pass !== undefined) {
    if (pass === true || Array.isArray(pass) || !String(pass).trim()) fail('--pass needs what the pass changes and why, once');
    if (reviewed || noReview || rounds !== undefined || decision !== undefined) fail('--pass is its own record: drop --reviewed, --no-review, --rounds and --decision');
    return { rounds: 0, decision: null };
  }
  if (reviewed === true) fail('--reviewed needs what the reviews found');
  if (noReview === true || (noReview !== undefined && !String(noReview).trim())) fail('--no-review needs why');
  // Q38 is no source for skipping review (coordinator, 4 Nov): the reason is said in its own words.
  if (/\bQ[\s-]*38\b/i.test(String(noReview ?? ''))) fail('--no-review may not cite Q38: Q38 has no source; give the reason itself');
  if (!reviewed && !noReview) fail('say whether a fresh reviewer ran: --reviewed "<what>" or --no-review "<why>" (INT-2)');
  if (reviewed && noReview) fail('say one: --reviewed "<what>" or --no-review "<why>", not both');
  if (Array.isArray(decision) || Array.isArray(rounds)) fail('give --rounds and --decision once each');
  if (decision === true || (decision !== undefined && !String(decision).trim())) fail('--decision needs the recorded decision: who decided a further review round, and why');
  if (noReview) {
    if (rounds !== undefined && Number(rounds) !== 0) fail('--no-review has no review rounds; drop --rounds');
    return { rounds: 0, decision: decision ?? null };
  }
  const r = Number(rounds);
  if (rounds === undefined || rounds === true) fail(`say how many review rounds ran: --rounds <n> (1: the two fresh reviews; ${MAX_ROUNDS}: those, one fix pass and one confirming re-review of the fix)`);
  if (!Number.isInteger(r) || r < 1) fail(`--rounds must be a whole number of review rounds, 1 or more; not ${JSON.stringify(rounds)}`);
  if (r > MAX_ROUNDS && !decision) fail(`${r} review rounds: the limit is ${MAX_ROUNDS} (two reviews, one fix pass, one confirming re-review of the fix pass); a further round needs a recorded decision: --decision "<who decided, and why>"`);
  return { rounds: r, decision: decision ?? null };
}

// What a job merge's review cost and found (coordinator's log, 4 Nov 19:05, recorded as Bob's decision, not quoted: measure the review triggers
// for a day or two). --reviewed needs --review-minutes <n>, --findings <n> and --acted-on <n>
// (how many findings the fix pass acted on); --review-cost-usd <n> when read, else unmeasured.
// --no-review takes none of them.
export function reviewMeasures({ reviewed, reviewMinutes, reviewCostUsd, findings, actedOn } = {}) {
  const given = [['--review-minutes', reviewMinutes], ['--review-cost-usd', reviewCostUsd], ['--findings', findings], ['--acted-on', actedOn]].filter(([, v]) => v !== undefined);
  if (!reviewed) {
    if (given.length) fail(`--no-review ran no review: drop ${given.map(([k]) => k).join(', ')}`);
    return { review_minutes: null, review_usd: null, findings: null, findings_acted: null };
