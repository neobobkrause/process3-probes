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
  }
  const whole = (k, v) => {
    const x = Number(v);
    if (v === undefined || v === true || !String(v).trim() || !Number.isInteger(x) || x < 0) fail(`--reviewed needs ${k} <n>, a whole number 0 or more${v === undefined ? '' : `; not ${JSON.stringify(v)}`}: the review's measures go in the merge row (Bob, 4 Nov)`);
    return x;
  };
  const minutes = Number(reviewMinutes);
  if (reviewMinutes === undefined || reviewMinutes === true || !String(reviewMinutes).trim() || !Number.isFinite(minutes) || minutes < 0) fail(`--reviewed needs --review-minutes <n>, the minutes the review and its fix pass added before the merge${reviewMinutes === undefined ? '' : `; not ${JSON.stringify(reviewMinutes)}`}`);
  const f = whole('--findings', findings);
  const a = whole('--acted-on', actedOn);
  if (a > f) fail(`--acted-on ${a} is more than --findings ${f}`);
  let usd = 'unmeasured';
  if (reviewCostUsd !== undefined) {
    usd = Number(reviewCostUsd);
    if (reviewCostUsd === true || !String(reviewCostUsd).trim() || !Number.isFinite(usd) || usd <= 0) fail(`--review-cost-usd <n>, above 0, or leave it out (unmeasured); not ${JSON.stringify(reviewCostUsd)}`);
  }
  return { review_minutes: minutes, review_usd: usd, findings: f, findings_acted: a };
}

// The review workers' cost (review-trigger day-1 study, 5 Nov: all 7 reviewed merges read review_usd
// "unmeasured"), when no --review-cost-usd gives it: from --review-record <file>, the review
// session's get_session result saved as JSON (one, a list, or under data), its
// external_metadata.usage.cost_usd; else from the module's rows `metrics add <id> --role review`
// writes (process/metrics/<id>.bob.jsonl, in this checkout and on the tranche): those naming a
// --review-session, or, with none named, those since the job's attempt started (since). Returns
// { usd, from } or { usd: 'unmeasured', why }.
export const reviewSessions = (v) => [...new Set((Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]).flatMap((x) => String(x).split(',')).map((x) => sessionForm(x.trim())).filter(Boolean))];
export function reviewCostOf(root, cfg, id, { sessions = [], record, since = null } = {}) {
  const want = reviewSessions(sessions);
  if (record !== undefined && record !== null) {
    if (record === true || !String(record).trim()) fail('--review-record <file>: the review session\'s get_session result, saved as JSON');
    let j;
    try { j = JSON.parse(readFileSync(String(record), 'utf8')); } catch (e) { fail(`--review-record ${record}: not a readable JSON file (${e.message})`); }
    const list = (Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : [j]).filter((x) => x && typeof x === 'object');
    const mine = list.filter((x) => !want.length || want.includes(sessionForm(String(x.id || x.session_id || ''))));
    const costs = mine.map((x) => Number(x.external_metadata?.usage?.cost_usd)).filter((x) => Number.isFinite(x) && x > 0);
    if (!costs.length) fail(`--review-record ${record}: no session${want.length ? ` ${want.join(', ')}` : ''} in it with external_metadata.usage.cost_usd above 0`);
    return { usd: Math.round(costs.reduce((t, x) => t + x, 0) * 1e4) / 1e4, from: `review session record${mine.length > 1 ? 's' : ''} ${mine.map((x) => sessionForm(String(x.id || x.session_id || '?'))).join(', ')}` };
  }
  const file = bobMetricsFile(id);
  const parse = (t) => String(t || '').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const onTranche = git(['show', `refs/remotes/origin/${cfg.tranche}:${file}`], { cwd: root, allowFail: true });
  let here = [];
  try { here = readRows(root, id, file); } catch { here = []; }
  const seen = new Set();
  const rows = [...(onTranche.code === 0 ? parse(onTranche.stdout) : []), ...here].filter((r) => { const k = JSON.stringify(r); if (seen.has(k)) return false; seen.add(k); return true; });
  const review = rows.filter((r) => r.row === 'attempt' && r.event === 'measured' && r.role === 'review' && (r.module ?? id) === id && Number(r.cost_usd) > 0);
  const mine = want.length ? review.filter((r) => want.includes(sessionForm(r.session))) : since ? review.filter((r) => String(r.at) >= String(since)) : [];
  if (!mine.length) {
    const why = want.length ? `no \`metrics add ${id} --role review\` row priced for ${want.join(', ')}` : since ? `no \`metrics add ${id} --role review\` row priced since the attempt started (${since})` : 'the attempt\'s start was not read and no --review-session was named';
    return { usd: 'unmeasured', why };
  }
  // A session's rows are its cost so far (metrics add, as BOB records its own): its latest counts once.
  const bySession = [...new Map(mine.map((r, i) => [r.session || `#${i}`, r])).values()];
  return { usd: Math.round(bySession.reduce((t, r) => t + Number(r.cost_usd), 0) * 1e4) / 1e4, from: `${mine.length} --role review row${mine.length > 1 ? 's' : ''}${mine.some((r) => r.session) ? ` (${[...new Set(mine.map((r) => r.session).filter(Boolean))].join(', ')})` : ''}` };
}
// The start of the job's current attempt, from its rows at the head (null: none read).
export const attemptStart = (rows) => (rows || []).filter((r) => r.row === 'attempt' && r.event === 'start').pop()?.at || null;

export function merge(root, n, opts = {}) {
  const { reviewed, noReview, minutes = GATE_WAIT_MINUTES, log = console.log } = opts;
  const io = { getPR, comments, checkRun, mergePR, verify: (slug, r, ctx) => verifyRow(slug, r, ctx), ...(opts.io || {}) };
  const rounds = reviewRounds(opts);
  let measures = reviewMeasures(opts);
  if (!reviewed && (opts.reviewSession !== undefined || opts.reviewRecord !== undefined)) fail('--no-review ran no review: drop --review-session and --review-record');
  if (opts.reviewCostFrom && typeof measures.review_usd === 'number') measures = { ...measures, review_usd_from: String(opts.reviewCostFrom) };
  // The job's cost, read by BOB from get_session on the job's session, idle by now (measured 4 Nov,
  // 11:49: mid-turn a session's own record has no usage). A value not read is refused before
  // anything runs; an omitted one records the cost unmeasured and never stops the merge.
  const jobCost = jobCostOf(opts.jobCostUsd);
  const cfg = loadConfig(root);
  const slug = opts.slug || repoSlug(root);
  const pr = io.getPR(slug, n);
  const id = branchModule(pr.head?.ref, ledgerIds(root, `origin/${cfg.tranche}`));
  // A job's pull request already merged: merge again only records its provider notices, the step
  // a failed state-branch write left undone (idempotent).
  if (id && pr.state === 'closed' && pr.merged && pr.merge_commit_sha) {
    // Its rows are on the tranche now, which no job merge writes to: a cost this late is not recorded.
    if (jobCost !== null) log(`pull request ${n} is already merged: --job-cost-usd ${jobCost} is not recorded (a job's cost is written only by the merge that lands it)`);
    return noticesOnly(root, cfg, { id, n, pr, slug, log, compare: io.compare });
  }
  const { branch, watch, first, all, receipt, mb, baseEntry, trig } = jobChecks(root, n, pr, id, { cfg, slug, io, noReview, minutes, log, every: opts.every, mergeableEvery: opts.mergeableEvery, onGate: opts.onGate, transient: opts.transient });
  if (reviewed && measures.review_usd === 'unmeasured') {
    const c = reviewCostOf(root, cfg, id, { sessions: opts.reviewSession, record: opts.reviewRecord, since: attemptStart(rowsAt(root, pr.head.sha, id)) });
    measures = { ...measures, review_usd: c.usd, ...(c.from ? { review_usd_from: c.from } : { review_usd_why: c.why }) };
    log(c.from ? `review cost: ${c.usd} USD, from ${c.from}` : `review cost: unmeasured (${c.why}); record it before the merge with ${P3} metrics add ${id} --role review --session <the review session> --cost-usd <its get_session usage.cost_usd>, or pass --review-cost-usd <n>`);
  }

  // Work in a worktree of its own, so the caller's checkout is never moved.
  return withTemp('p3-merge-', (tmp) => {
    const wt = join(tmp, id);
    git(['worktree', 'add', '-q', '--detach', wt, `origin/${branch}`], { cwd: root });
    let { tip, rejudged } = buildMerged(wt, cfg, {
      n, id, branch, onto: `origin/${cfg.tranche}`, ontoName: cfg.tranche, conflictHint: `; the job must bring itself up to date: ${P3} job sync ${id}, then job complete ${id} again`,
      reviewed, noReview, rounds, measures, triggers: trig.fired, jobCost, jobSession: opts.jobSession, attempt: receipt.attempt, log,
    });
    if (tip !== pr.head.sha) {
      opts.onGate?.(tip);
      git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: wt });
      log(`pushed ${tip.slice(0, 10)} to ${branch}; the gate runs on the merged result`);
    } else log(`${branch} is already the merged result at ${tip.slice(0, 10)}; nothing to push`);
    const run = tip === pr.head.sha ? first : waitForGate(slug, tip, { ...watch, was: pr.head.sha });
    if (run.conclusion !== 'success') fail(`the gate on the merged result is ${run.conclusion}: ${run.html_url}`);
    const loadOnly = gateRuns(all).flatMap((x) => x.load_only || []);
    if (loadOnly.length) log(`note for review: these tests failed only by not loading when reverted: ${[...new Set(loadOnly)].join(', ')}`);
    const r = mergeRetry(() => io.mergePR(slug, n, tip), {
      log, wait: opts.wait, reread: { read: () => io.getPR(slug, n), sha: tip },
      fetch: () => git(['fetch', '-q', 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/origin/${cfg.tranche}`], { cwd: root, allowFail: true }),
      check: () => {
        const p = io.getPR(slug, n);
        if (p.state !== 'open' || p.base?.ref !== cfg.tranche || p.head?.sha !== tip) fail(`pull request ${n} changed while its base moved; run merge again`);
        // The gate ran on the job merged with the tranche as it was: a tranche that moved past
        // that is a new merged result, which merge gates afresh when run again.
        if (git(['merge-base', '--is-ancestor', `refs/remotes/origin/${cfg.tranche}`, tip], { cwd: root, allowFail: true }).code !== 0) fail(`${cfg.tranche} moved past the merged result the gate checked; run merge again`);
      },
    });
    if (!r?.merged) fail(`GitHub did not merge pull request ${n}: ${r?.message || 'no result'}`);
    log(`merged pull request ${n} at ${r.sha} (${now()})`);
    // The provider-change route: the notice this job leaves its users, and the notices its START
    // named, answered now that it merged. The merge stands if the write fails; the rows are printed.
    // Their lines are held until the first act is printed: BOB reads the output when it ends.
    const held = [];
    const hold = (l) => held.push(l);
    let notes;
    let triage;
    try {
      notes = noticeStep(root, cfg, { id, n, mb, head: pr.head.sha, at: tip, entry: baseEntry, log: hold });
      // The notice it raised, triaged here, not in BOB's later batch (triageAtMerge); a failure
      // leaves the notice owed as before, and status names its triage.
      triage = triageStep(root, cfg, notes, { ref: tip, log: hold });
    } catch (e) {
      // Never lost: an unexpected stop still prints the start of the ready jobs and what was held.
      log(START_FIRST);
      for (const l of held) log(l);
      throw e;
    }
    // The first act, before any other line BOB must read (coordinator, 4 Nov): the triage the
    // merge's notice owes (case-catalogue:224 at 12:16 was triaged 9.6 min later), then the ready
    // jobs' start (a 25-minute ready-to-start wait was BOB's turn spent on other output first).
    for (const l of firstActs(triage)) log(l);
    for (const l of held) log(l);
    log(START_NEXT);
    // The triage's outcome again as the last line: BOB read merge 199's output through tail -3
    // (copy, 4 Nov), which dropped the triage line and the push failure that stopped it.
    // A merge that left no notice to triage has said so above; START_NEXT stays its last line.
    if (!String(triage?.why || '').startsWith('none to run')) log(triageLast(triage));
    return { merged: true, sha: r.sha, tip, notices: notes, triage, next: START_NEXT, ...(rejudged ? { rejudged } : {}) };
  }, { root });
}


// Kept by every job without exception: the job's handover note is saved under the file name
// `galloway-relay.md`, and under no other name.

// The job's merged result, built in worktree wt (detached at the job's head): onto merged in
// with --no-ff unless it is an ancestor already, then the merge row (and the job's cost row) as
// one commit. merge() and mergedResult() both build it here, so the result the train's spec gate
// tests (R(i)) and the one merge() lands (L) come from one code path and differ only in records
// (the row's minutes_from_complete, its time) and in whatever onto itself holds.
// One merge row per pull request since its last receipt: a rerun that finds this PR's row
// already on the branch writes none, and pushes only when the tranche moved since.
function buildMerged(wt, cfg, { n, id, branch, onto, ontoName = onto, conflictHint = '', reviewed, noReview, rounds, measures, triggers, jobCost = null, jobSession, attempt, log = console.log }) {
  const start = git(['rev-parse', 'HEAD'], { cwd: wt });
  let rejudged = null;
  if (git(['merge-base', '--is-ancestor', onto, 'HEAD'], { cwd: wt, allowFail: true }).code !== 0) {
    const m = git(['merge', '-q', '--no-ff', '--no-edit', onto, '-m', `Bring ${branch} up to ${ontoName}`], { cwd: wt, allowFail: true });
    if (m.code !== 0) {
      git(['merge', '--abort'], { cwd: wt, allowFail: true });
      fail(`${branch} conflicts with ${ontoName}${conflictHint}`);
    }
  }
  const rr = rounds && typeof rounds === 'object' ? rounds : { rounds: rounds ?? 0, decision: null };
  const rows = readRows(wt, id);
  const hasRow = mergeRowSince(rows, n);
  let tip = git(['rev-parse', 'HEAD'], { cwd: wt });
  if (!hasRow) {
    const done = rows.filter((r) => r.event === 'complete').pop();
    // The job's cost first, so the merge row stays the branch's last.
    jobCostRow(wt, id, rows, { cost: jobCost, session: jobSession, attempt, log });
    appendRow(wt, id, {
      row: 'merge', pr: n, reviewed: !!reviewed, review: reviewed || noReview, review_rounds: rr.rounds, ...(rr.decision ? { decision: rr.decision } : {}),
      triggers: triggers || [], ...(measures || {}), tool: toolPin(),
      minutes_from_complete: done ? Math.round((Date.now() - Date.parse(done.at)) / MINUTE) : null,
    });
    git(['add', '--', metricsFile(id)], { cwd: wt });
    git(['commit', '-q', '-m', `merge row for ${id} (PR ${n})`, '--', metricsFile(id)], { cwd: wt });
    tip = git(['rev-parse', 'HEAD'], { cwd: wt });
  } else {
    log(`${branch} already holds the merge row for PR ${n}; no second row is written`);
    // A rerun that brings the cost an earlier run lacked (review of PR 106: it was dropped):
    // the priced row, committed and gated as the merged result, as a moved tranche is.
    if (jobCost !== null && jobCostRow(wt, id, rows, { cost: jobCost, session: jobSession, attempt, log }) !== null) {
      git(['add', '--', metricsFile(id)], { cwd: wt });
      git(['commit', '-q', '-m', `job cost for ${id} (PR ${n})`, '--', metricsFile(id)], { cwd: wt });
      tip = git(['rev-parse', 'HEAD'], { cwd: wt });
    }
    // The triggers judged again here, at the land, with this tool (day-1 study, 5 Nov: copy PR 173's
    // row, prepared under the pin before the triggers, carried no triggers key). Record only: a row
    // that lacks them, or recorded others, gets a triggers row beside it (the report reads it over
    // the merge row) only when this land commits anyway; the head is never moved for it (a held
    // merged result would end its hold, a green tip would gate again): then the merge says it, and
    // returns it for the train's row.
    const was = rows.filter((r) => r.row === 'merge' && r.pr === n).pop();
    const had = rows.slice(rows.indexOf(was) + 1).filter((r) => r.row === 'triggers' && r.pr === n).pop()?.triggers ?? was?.triggers;
    const now_ = triggers || [];
    const same = Array.isArray(had) && had.length === now_.length && had.every((t) => now_.includes(t));
    if (triggers !== undefined && !same) {
      const why = Array.isArray(had) ? `the merge row recorded ${had.length ? had.join(' and ') : 'none'} when prepared (tool ${was?.tool || 'unknown'}); judged again at the land` : `the merge row was prepared under an older pin (tool ${was?.tool || 'unknown'}) that recorded no triggers; judged at the land`;
      rejudged = { triggers: now_, why, written: tip !== start };
      if (tip !== start) {
        appendRow(wt, id, { row: 'triggers', pr: n, triggers: now_, tool: toolPin(), why });
        git(['add', '--', metricsFile(id)], { cwd: wt });
        git(['commit', '-q', '-m', `review triggers for ${id} (PR ${n}), judged at the land`, '--', metricsFile(id)], { cwd: wt });
        tip = git(['rev-parse', 'HEAD'], { cwd: wt });
      }
      log(`PR ${n}'s merge row ${Array.isArray(had) ? `recorded triggers ${JSON.stringify(had)}` : 'recorded no triggers (prepared under an older pin)'}: ${JSON.stringify(now_)} judged at the land, ${tip !== start ? 'recorded beside it' : 'not written to the head (nothing else to commit; the head is not moved for a record)'}`);
    }
  }
  return { tip, hasRow, rejudged };
}


// A box of 19 clarinets came through Lund.

// The per-PR checks a job's merge holds before it brings the job in (merge): open, ready, into the tranche, from a job branch, mergeable, the branch where
// GitHub has it, a green gate on the head that checked and agreed with the opener's newest receipt, only the job's own files and ledger status, and the review triggers (refusing
// --no-review when one fires).
// A shallow clone (the MERGER's, 5 Nov: at clone_depth 1 every land failed at git merge-base): both
// sides deepened down to their merge base by GitHub's compare (its counts), and the clone
// unshallowed once when that does not give the base GitHub names; one that cannot is refused plainly.
// The history already there is never cut (--depth sets a ref's depth and shortens a history
// fetched deeper: the merge train's tranche, fetched past main, build/starter-fixes 5 Nov): the
// base GitHub names read locally returns at once; else each side deepens from the clone's cut
// (--deepen), by GitHub's count where its tip is the cut (a depth-1 clone: the depth --depth
// gave), else by doubling from one (a cut deep in the history: the commits just past it).
export function deepenToBase(root, slug, base, head, read = compare) {
  if (!isShallow(root)) return;
  const refs = [base, head].map((b) => `+refs/heads/${b}:refs/remotes/origin/${b}`);
  let c = null;
  try { c = read(slug, base, head); } catch { c = null; }
  const mb = () => git(['merge-base', `origin/${base}`, `origin/${head}`], { cwd: root, allowFail: true }).stdout.trim();
  const sha = c?.merge_base_commit?.sha;
  const ok = () => !!sha && mb() === sha;
  if (ok()) return;
  if (Number.isInteger(c?.ahead_by) && Number.isInteger(c?.behind_by)) {
    const deepen = (ref, n) => git(['fetch', '-q', `--deepen=${n}`, 'origin', ref], { cwd: root, allowFail: true }).code === 0;
    const tipCut = (b) => shallowCuts(root).has(git(['rev-parse', '-q', '--verify', `refs/remotes/origin/${b}^{commit}`], { cwd: root, allowFail: true }).stdout.trim());
    const side = (b, ref, count) => {
      if (tipCut(b)) return deepen(ref, Math.max(1, count)) && ok();
      for (let n = 1, got = 0; got < Math.max(1, count) && isShallow(root); got += n, n *= 2) if (deepen(ref, n) && ok()) return true;
      return ok();
    };
    if (side(head, refs[1], c.ahead_by) || side(base, refs[0], c.behind_by)) return;
  }
  if (ok()) return;
  const r = git(['fetch', '-q', '--unshallow', 'origin', ...refs], { cwd: root, allowFail: true });
  if (r.code !== 0 || !mb()) fail(`this clone is shallow and the history between ${head} and ${base} could not be read (${r.code !== 0 ? `git fetch --unshallow: ${r.stderr.trim().split('\n').pop()}` : 'no merge base after unshallowing'}); nothing was merged. Run it again, or start this session without clone_depth`);
}

export function jobChecks(root, n, pr, id, { cfg, slug, io, noReview, minutes = GATE_WAIT_MINUTES, log = console.log, every, mergeableEvery, onGate, transient }) {
  if (pr.state !== 'open') fail(`pull request ${n} is ${pr.state}`);
  if (pr.draft) fail(`pull request ${n} is a draft: the job has not completed`);
  if (pr.base.ref !== cfg.tranche) fail(`pull request ${n} is into ${pr.base.ref}, not the tranche ${cfg.tranche}`);
  if (!id) fail(`pull request ${n} is not from a job branch; any other pull request merges with --plain`);
  waitMergeable(slug, n, pr, { every: mergeableEvery, read: io.getPR, log });

  const branch = pr.head.ref;
  git(['fetch', '-q', 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/origin/${cfg.tranche}`], { cwd: root });
  // The job's head: in a shallow clone its commits main lacks only (util.mjs fetchJobRefs), else as ever.
  if (!isShallow(root) || !fetchJobRefs(root, [branch])) git(['fetch', '-q', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], { cwd: root });
  if (git(['rev-parse', `origin/${branch}`], { cwd: root }) !== pr.head.sha) fail(`${branch} moved since the gate ran; run merge again`);
  deepenToBase(root, slug, cfg.tranche, branch, io.compare);
  if (git(['rev-parse', `origin/${branch}`], { cwd: root }) !== pr.head.sha) fail(`${branch} moved since the gate ran; run merge again`);
  // merge run again on the merge-row tip an earlier run pushed, whose gate outran that run's
  // wait: wait on that gate here, and (below) push no second merge row (defect sweep 4 Nov, #6).
  const rowTip = mergeRowSince(rowsAt(root, pr.head.sha, id), n);
  const watch = { minutes, read: io.checkRun, pr: () => io.getPR(slug, n), log, ...(every !== undefined ? { every } : {}), ...(transient ? { transient } : {}) };
  // The newest receipt must have been checked, and agreed with, by a green gate run on the tip (AUD-2, JOB-7).
  let first = io.checkRun(slug, pr.head.sha, 'gate');
  // The merged result an earlier run pushed is gating: wait on it.
  if (rowTip && first?.status !== 'completed') { onGate?.(pr.head.sha); first = waitForGate(slug, pr.head.sha, watch); }
  if (first?.conclusion !== 'success') fail(`the gate is not green on ${pr.head.sha.slice(0, 10)} (${first ? first.conclusion || first.status : 'no run'})`);
  const all = io.comments(slug, n);
  const receipt = latestReceipt(all, pr.user?.login); // only the opener's (review of PR 13)
  if (!receipt) fail(`pull request ${n} has no receipt`);
  // Each row names its Actions run; the row counts only when that run is the process gate on
  // this tip, green, and its own artifact holds the same row (verifyRow).
  // The receipt is checked against CI's own run of its tests (gate.mjs receiptAgrees): only a
  // row that says 'agrees' stands; an earlier pin's 'present' or an 'unmeasured' does not.
  const agreed = gateRuns(all).filter((r) => r.sha === pr.head.sha && r.ok && r.receipt === 'agrees' && r.receipt_attempt === receipt.attempt)
    .find((r) => io.verify(slug, r, { pr: n, baseRef: cfg.tranche }));
  if (!agreed) fail(`no green process-gate run on ${pr.head.sha.slice(0, 10)} checked receipt attempt ${receipt.attempt} and agreed with it${unread(gateRuns(all), pr.head.sha, receipt.attempt)}`);

  // ARC-2 and the ledger's job rule, held here by BOB's tool: the job changed only its own
  // module and records, and nothing in the ledger but its own status. The paths come from the
  // tranche's copy of the entry, never from the job's branch.
  const mb = git(['merge-base', `origin/${branch}`, `origin/${cfg.tranche}`], { cwd: root });
  const entryText = git(['show', `${mb}:${entryFile(id)}`], { cwd: root, allowFail: true });
  if (entryText.code !== 0) fail(`the tranche has no ledger entry for ${id}`);
  const baseEntry = JSON.parse(entryText.stdout);
  const own = ownPaths(baseEntry);
  const ledger = checkLedger(root, { ref: `origin/${branch}`, base: mb, branch });
  if (ledger.length) fail(`ledger: ${ledger.map((f) => `${f.file}: ${f.message}`).join('; ')}`);
  // No rename detection, so a rename lists the path it removes too (confirming review of PR 14).
  const outside = diffNames(root, mb, `origin/${branch}`).filter((f) => !own.some((p) => underPath(f, p)));
  if (outside.length) fail(`${branch} changes files outside its module: ${outside.slice(0, 5).join(', ')}`);
  // The review triggers, from the job's own diff and the tranche's config (triggers.mjs).
  const trig = reviewTriggers(root, { base: mb, head: `origin/${branch}`, entry: baseEntry, cfg: loadConfig(root, `origin/${cfg.tranche}`) });
  if (trig.bad) log(`note: ${trig.bad}; no security path is read`);
  if (trig.fired.length && noReview) fail(`pull request ${n} fires the review trigger${trig.fired.length > 1 ? 's' : ''} ${trig.fired.join(' and ')} (${trig.why}): --no-review is refused (review triggers, 4 Nov 19:05). Brief a fresh read-only reviewer with ${P3} review brief ${n}, which carries the hunks that fired it; one review and one fix pass; then merge ${n} --reviewed "<what it found>" --rounds <n> --review-minutes <n> --findings <n> --acted-on <n>`);
  if (trig.fired.length) log(`review trigger${trig.fired.length > 1 ? 's' : ''} ${trig.fired.join(' and ')}: ${trig.why}`);

  return { branch, watch, first, all, receipt, mb, baseEntry, trig };
}

// --job-cost-usd: a figure above 0, or none (null). 0 is a figure not read: no job costs nothing.
export function jobCostOf(v) {
  if (v === undefined || v === null) return null;
  const c = Number(v);
  if (v === true || !Number.isFinite(c) || c <= 0) fail(`--job-cost-usd <the job's session cost: ${jobCostCall()}>; not ${JSON.stringify(v)}${c === 0 ? ' (no job costs nothing: 0 is a figure not read)' : ''}; nothing was run`);
  return c;
}

// The job's measured row at its merge, the row job complete --cost-usd writes (PR 105): session_usd
// the session's cost so far, cost_usd that less the same session's last priced row. The session
// is --job-session, else the one the job's last complete row names. With no figure, the row says
// unmeasured (so the report reads job_usd unmeasured, never low) and the call to read it is printed.
export function jobCostRow(wt, id, rows, { cost, session, attempt, log = console.log }) {
  const done = rows.filter((r) => r.event === 'complete').pop();
  const priced = (r) => r.event === 'measured' && (r.role || 'job') === 'job' && r.attempt === attempt && Number(r.cost_usd) > 0;
  // Else the session of this attempt's last measured row: queue's complete rows named none on the
  // copy (4 Nov), and its merge counted 4.04 whole, attempt 1's 3.25 again. Never an earlier
  // attempt's: a restart in a new session would have that session's figure taken off its own.
  const last = rows.filter((r) => r.event === 'measured' && (r.role || 'job') === 'job' && r.session && r.attempt === attempt).pop();
  const sid = sessionForm(typeof session === 'string' && session ? session : done?.session || last?.session || null);
  if (cost === null) {
    // Measured already, by a job complete --cost-usd for this attempt: nothing more to write.
    if (rows.some(priced)) return null;
    appendRow(wt, id, { row: 'attempt', event: 'measured', role: 'job', attempt, session: sid, session_usd: 'unmeasured', cost_usd: 'unmeasured' });
    log(`job ${id}'s cost: unmeasured. Read it with ${jobCostCall(sid)}, and pass it as --job-cost-usd <n>${sid ? '' : ' with --job-session <its id>'} if this merge is run again before it lands; the merge goes on`);
    return null;
  }
  if (rows.some(priced)) { log(`job ${id}'s attempt ${attempt} is priced already: --job-cost-usd ${cost} is not written again`); return null; }
  const { usd, prior } = costDelta(rows, sid, cost);
  appendRow(wt, id, { row: 'attempt', event: 'measured', role: 'job', attempt, session: sid, session_usd: cost, cost_usd: usd });
  if (usd === 'unmeasured') log(`job ${id}'s cost: unmeasured: --job-cost-usd ${cost} is not above session ${sid}'s last row (${prior}), so get_session's usage has not moved since; read it again with ${jobCostCall(sid)} once it has, and run this merge again with it before it lands; the merge goes on`);
  else log(`job ${id}'s cost: ${usd} USD${sid ? ` (session ${sid}, ${cost} so far)` : ' (no session named: the whole figure counted)'}`);
  return usd;
}

// The act that clears a receipt no green run on the tip has checked and agreed with: an amended
// receipt posts no commit, and a row from an earlier pin read it without checking it (AUD-2), so
// the gate on the tip needs a new event.
export function unread(runs, sha, attempt) {
  const r = runs.filter((x) => x.sha === sha).pop();
  if (!r || !r.ok || (r.receipt_attempt === attempt && r.receipt === 'agrees')) return '';
  if (r.receipt_attempt === attempt) return `; its newest run left the receipt ${r.receipt}${r.receipt_unmeasured ? `: ${r.receipt_unmeasured}` : ''}, not checked against CI's run of its tests: give the gate on ${sha.slice(0, 10)} a new event (edit the pull request)`;
  return `; its newest run read ${r.receipt_attempt == null ? 'no receipt' : `attempt ${r.receipt_attempt}`}: give the gate on ${sha.slice(0, 10)} a new event (edit the pull request)`;
}

// The provider-change route at a job's merge: the notice this job leaves its users, and the
// notices its START named, answered now that it merged. The merge stands if the write fails;
// merge <n> run again records them. A notice is left when the job changed a file of its module's
// own source (the tranche's entry, less tests, requirements, docs and records), requirement change
// or none, naming its export changes; a job that changed only those others leaves none, and the
// line says why.
// The notice the merge left, triaged at once (triageAtMerge): the one it recorded now, or, on a
// rerun that found it recorded already, the same notice. Never silent: a merge that leaves no
// notice says so, and a failure names the triage act; the merge stands either way.
export const triageLast = (t) => (t.error ? `notice triage at the merge FAILED (${t.error.split('\n')[0].slice(0, 160)}); next act: ${t.next}`
  : t.owed?.length ? `notice triage at the merge: ${t.owed.length} owe a worker's judgment; ${t.next}` : String(t.why || '').startsWith('none to run') ? `notice triage at the merge: ${t.why}` : `notice triage at the merge: ${t.why || `${t.rows?.length || 0} row(s) written`}, none owed`);
// The merge's first lines: with users owing a worker's judgment (or the triage failed), the
// notice's triage first, then the ready jobs' start; otherwise START_FIRST alone.
export function firstActs(t) {
  const key = t?.key || String(t?.next || '').match(/notice triage (\S+)/)?.[1];
  if (!key || !(t.owed?.length || t.error)) return [START_FIRST];
  const owe = t.error ? `its triage at the merge failed, ${t.owed?.length || 0} owed` : `${t.owed.length} user module${t.owed.length === 1 ? ' owes' : 's owe'} a worker's judgment: ${t.owed.join(', ')}`;
  return [`first: ${P3} notice triage ${key} (provider notice ${key}; ${owe}: a read-only worker judges them now, not in a later batch)`, START_FIRST.replace(/^first: /, 'then: ')];
}
function triageStep(root, cfg, notes, { ref, log }) {
  // On a rerun, the notice as recorded (its users as stored), and none when it was withdrawn.
  let raised = (notes.rows || []).find((x) => x.row === 'notice') || null;
  if (!raised && notes.notice) {
    try { raised = notices(root, cfg.state_branch).find((x) => x.key === notes.notice.key) || null; } catch { raised = null; }
    if (!raised) { const why = `notice ${notes.notice.key} is not on ${cfg.state_branch} (withdrawn, or unread)`; log(`notice triage at the merge: none to run (${why})`); return { rows: [], owed: [], why: 'none to run: ' + why }; }
  }
  if (!raised) { const why = notes.error ? `the notices were not written: ${notes.error.split('\n')[0]}; run the merge again` : 'the merge left no provider notice'; log(`notice triage at the merge: none to run (${why})`); return { rows: [], owed: [], why: 'none to run: ' + why }; }
  try { return triageAtMerge(root, cfg, raised, { ref, log }); } catch (e) {
    log(`the merge stands; notice triage ${raised.key} at the merge failed (${e.message}); next act: ${P3} notice triage ${raised.key}`);
    return { rows: [], owed: raised.users || [], key: raised.key, error: e.message, next: `${P3} notice triage ${raised.key}` };
  }
}

function noticeStep(root, cfg, { id, n, mb, head, at, entry, log }) {
  const { notice, why, left } = entry ? providerChange(root, cfg, { provider: id, requirements: entry.requirements, base: mb, head, pr: n, usersAt: at, entry }) : { notice: null, why: null };
  if (why) log(`no provider notice: ${why}`);
  if (notice && left) log(`provider notice ${notice.key}: ${left}`);
  const answers = rowsAt(root, at, id).filter((x) => x.event === 'start').pop()?.notices || [];
  let notes = { rows: [] };
  try { notes = recordAtMerge(root, cfg, { notice, answers, user: id, pr: n }); } catch (e) {
    log(`the merge stands, but its provider notices were not written to ${cfg.state_branch} (${e.message}); run merge ${n} again to record them`);
    return { rows: [], error: e.message };
  }
  if (notice) notes = { ...notes, notice };
  for (const x of notes.rows) log(x.row === 'notice' ? `${noticeLine(x)} recorded for ${x.users.join(', ')}` : `provider notice ${x.key} answered by ${x.user}`);
  if (!notes.rows.length) log(`provider notices for PR ${n}: nothing to record`);
  return notes;
}

function noticesOnly(root, cfg, { id, n, pr, slug, log, compare: compareRead }) {
  const m = pr.merge_commit_sha;
  const { head: h, mb } = mergedRange(root, m, { slug, n, what: 'its provider notices cannot be read', ...(compareRead ? { read: compareRead } : {}) });
  const entryText = git(['show', `${mb}:${entryFile(id)}`], { cwd: root, allowFail: true });
  const entry = entryText.code === 0 ? JSON.parse(entryText.stdout) : null;
  log(`pull request ${n} is merged; recording only its provider notices`);
  const notices = noticeStep(root, cfg, { id, n, mb, head: h, at: m, entry, log });
  const triage = triageStep(root, cfg, notices, { ref: m, log });
  // A triage owed is the first act here too (no ready line: this run merged nothing).
  const first = firstActs(triage);
  if (first.length > 1) log(first[0]);
  if (!String(triage?.why || '').startsWith('none to run')) log(triageLast(triage));
  return { merged: true, sha: m, notices, triage };
}

// A merge GitHub refuses because its base moved ("Base branch was modified") fetches the base,
// confirms the pull request still has the head and base that were checked, and tries again, at
// most RETRIES times in all. Any other refusal stops at once. Never forced.
//
// A reply that cannot be read (measured 4 Nov: "gh api -X PUT failed: unexpected end of JSON
// input", the pull request left unmerged, and the same run again merged it): with `reread`
// ({ read, sha }), the pull request is read again. Merged with this head is success; open with the
// head unchanged tries the PUT once more; anything else stops. A refusal GitHub stated (a JSON
// body, which gh prints with its HTTP status) is not this case. Nor is a refusal of the budget's
// or of GitHub's rate limit (R17d): the merge was never made, and the reply is no unread one; read
// as one, the PUT was sent again at once into the same refusal, and the stop named an unread
// reply, not the refusal and its rerun.
export const unreadable = (msg) => {
  if (BUDGET.test(String(msg))) return false;
  const body = String(msg).replace(/^gh api -X PUT failed:\s*/, '').trim();
  if (!body) return true;
  if (/\(HTTP \d{3}\)/.test(body)) return false;
  try { JSON.parse(body); return false; } catch { return true; }
};

