// ===== file: layerbase.mjs (continued) =====

}
export const refuseInLayer = (cfg, what) => { if (cfg.layer && !cfg.layer.direct) fail(`${what} is not part of the layer flow (merge_strategy "layer", ${cfg.tranche}): start the job plainly, or ask BOB`); };

// ===== file: audit-restores.test.mjs =====

// AUD-1 (JOB-12), AUD-2 (JOB-7, SES-12): the reviewed revert exemption, and every receipt
// disagreement counted toward the false-done rate. Fast: no suite runs here.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOT, GATE, REVERT_EXEMPT, block, parseBlock } from '../lib/github.mjs';
import { EXEMPT_MARK, revertExempt } from '../lib/job.mjs';
import { flowFigures, refuted, refutes, report } from '../lib/metrics.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};

test('a receipt disagreement refutes its COMPLETE claim, as a red suite or revert check does (SES-12)', () => {
  assert.equal(refutes({ receipt_attempt: 1, suite: 'pass', revert: 'pass', receipt: 'disagrees' }, 1), true);
  assert.equal(refutes({ receipt_attempt: 1, suite: 'fail' }, 1), true);
  assert.equal(refutes({ receipt_attempt: 1, suite: 'pass', revert: 'fail', receipt: 'agrees' }, 1), true);
  assert.equal(refutes({ receipt_attempt: 1, suite: 'pass', revert: 'pass', receipt: 'agrees' }, 1), false);
  assert.equal(refutes({ receipt_attempt: 2, receipt: 'disagrees' }, 1), false, 'another attempt\'s run');
  // A revert failure a reviewer then exempted on the same attempt refutes nothing; a red suite still does.
  const fail = (sha) => ({ sha, receipt_attempt: 1, suite: 'pass', revert: 'fail', receipt: 'agrees' });
  const exempt = (sha, reviewed = sha) => ({ sha, receipt_attempt: 1, suite: 'pass', revert: 'exempt', revert_exempt: { sha: reviewed }, receipt: 'agrees' });
  assert.equal(refuted([fail('c1'), exempt('c1')], 1), false);
  // Only an exemption after it, of the same commit: not one before it, nor of later code.
  assert.equal(refuted([exempt('c1'), fail('c1')], 1), true);
  assert.equal(refuted([fail('c1'), exempt('c2')], 1), true);
  assert.equal(refuted([{ receipt_attempt: 1, suite: 'fail', revert: 'skipped', receipt: 'disagrees' }, exempt('c1')], 1), true);
  assert.equal(refuted([{ receipt_attempt: 1, suite: 'pass', revert: 'fail', receipt: 'agrees' }], 1), true);
  const at = (h) => new Date(Date.parse('2026-11-06T00:00:00Z') + h * 36e5).toISOString();
  const rows = [{ row: 'attempt', event: 'complete', attempt: 1, pr: 2, at: at(1) }, { row: 'attempt', event: 'complete', attempt: 1, pr: 3, at: at(2) }];
  const gates = (pr) => (pr === 2 ? [{ receipt_attempt: 1, suite: 'pass', revert: 'pass', receipt: 'disagrees' }] : [{ receipt_attempt: 1, suite: 'pass', receipt: 'agrees' }]);
  assert.equal(flowFigures({ rows, gates, from: at(0), to: at(3) }).false_done_share, 0.5);
  // report's false_done_rate reads the same rule.
  const root = makeRepo({ 'process/metrics/alpha.jsonl': rows.map((r) => JSON.stringify(r)).join('\n') + '\n' });
  const r = report(root, 'o/r', 'HEAD', { read: { comments: (s, n) => [{ id: 1, body: block(GATE, { runs: gates(n) }), user: { login: BOT } }], getPR: () => null } });
  assert.deepEqual([r.complete_claims, r.refuted, r.false_done_rate], [2, 1, 0.5]);
});

function jobRepo() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'src/alpha/index.mjs': 'export const x = 1;\n' });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'process/metrics/alpha.jsonl': '{"row":"attempt","event":"complete","attempt":1,"session":"session_job"}\n' });
  const state = { comments: [], edits: [] };
  const io = {
    slug: 'o/r',
    getPR: () => ({ number: 5, state: 'open', body: 'START', head: { ref: 'job/alpha', sha: head } }),
    addComment: (s, n, body) => { state.comments.push(body); return { id: 77, html_url: 'https://x/77' }; },
    editPR: (s, n, f) => { state.edits.push(f); },
  };
  return { root, head, state, io };
}

test('revert exempt posts a reviewer\'s exemption on the head and edits the body so the gate runs again; the job\'s own session is refused', () => {
  const j = jobRepo();
  assert.throws(() => revertExempt(j.root, 5, { why: 'refactor', io: j.io, log: quiet }), /needs --reviewer/);
  assert.throws(() => revertExempt(j.root, 5, { reviewer: 'session_rev', io: j.io, log: quiet }), /needs --why/);
  assert.throws(() => revertExempt(j.root, 5, { why: 'refactor', reviewer: 'cse_job', io: j.io, log: quiet }), /session_job is alpha's own job session: a job never exempts itself/);
  assert.equal(j.state.comments.length, 0);
  const r = revertExempt(j.root, 5, { why: 'a pure rename', reviewer: 'session_rev', io: j.io, log: quiet });
  assert.deepEqual([r.data.module, r.data.sha, r.data.reviewer, r.data.why], ['alpha', j.head, 'session_rev', 'a pure rename']);
  assert.deepEqual(parseBlock(j.state.comments[0], REVERT_EXEMPT).sha, j.head);
  assert.equal(j.state.edits.length, 1);
  assert.match(j.state.edits[0].body, new RegExp(`^START\\n\\n<!-- ${EXEMPT_MARK} 77 --> Gate re-run for the revert exemption https://x/77\\.$`));
});

// ===== file: ghaudit.mjs =====

// p3 github audit [--since <iso>] [--repo <owner/repo>]... [--login <login>] (R17c; Bob, 6 Nov:
// does ALL GitHub traffic go through, and get tracked by, the pacing mechanism?). GitHub's own
// evidence against the account's ledger (pace.mjs usage: the shared rows and this clone's log):
//   calls      GitHub's primary count (rate_limit, which covers its own hour to the reset) against
//              the ledger's REST calls in that hour; the gap is "outside the tool" (the connector's
//              reads, raw gh or curl): informational, since connector reads stay on GitHub's count.
//              The connector calls the session hook counted are shown beside it.
//   pushes     per repository: push-triggered workflow runs (one per branch and commit) against the
//              ledger's pushes to branches other than the state branch (merges and release tags the
//              tool made count as pushes: GitHub raises a push for each); the product's state
//              branch: its commits in the window (an upper bound: one coalesced push carries several)
//              against the ledger's state pushes. A push GitHub shows that the ledger lacks is
//              unexplained, named by branch, actor and the commit's Claude-Session trailer.
//   writes     per repository, the account's pull request, comment and review events (a review's
//              own inline comments count once with it) against the ledger's content-creating
//              requests to that repository.
// Not compared: the last share_s + 60 s (other sessions share their use every share_s), and
// anything older than the ledger's two hours. Exit 1 on an unexplained push or write gap.
// Repository-scoped endpoints only (sessions' proxies refuse users/* paths): the account's activity
// is every login but bots and the repository's owner, or the --login given. Paced like any gh call.
import { gh } from './util.mjs';
import { pacing, slugOf, usage } from './pace.mjs';

const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
const sessionIn = (msg) => (String(msg || '').match(/Claude-Session:\s*\S*?(session_[A-Za-z0-9]+)/) || [])[1] || null;
const PR_ACTS = new Set(['opened', 'edited', 'closed', 'reopened', 'ready_for_review', 'converted_to_draft']);
const bot = (login) => /\[bot\]$/.test(String(login || ''));
export const LEDGER_HOURS = 2;

function pages(read, path, { max = 3, pick = (x) => x, stop = () => false } = {}) {
  const out = [];
  for (let n = 1; n <= max; n++) {
    const page = read(['api', `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${n}`]);
    const items = Array.isArray(pick(page)) ? pick(page) : [];
    out.push(...items);
    if (items.length < 100 || items.some(stop)) break;
  }
  return out;
}

export function githubAudit(root, { since, repos = [], product = null, stateBranch = 'process-state', login = null, now = Date.now(), io = {}, log = console.log, p = pacing() } = {}) {
  const read = io.gh || ((args) => gh(args, { cwd: root, allowFail: true }));
  const start = since === undefined ? now - 3600e3 : Date.parse(since);
  if (!Number.isFinite(start) || start >= now) throw new Error(`--since <iso time>: a time before now, not ${JSON.stringify(since)}`);
  if (start < now - LEDGER_HOURS * 3600e3) throw new Error(`--since ${iso(start)}: the ledger keeps ${LEDGER_HOURS} hours of every session's use; audit from ${iso(now - LEDGER_HOURS * 3600e3)} or later`);
  // Other sessions' last minutes are not shared yet: GitHub's evidence and the ledger both end here.
  const until = Math.max(start + 60e3, now - (p.share_s + 60) * 1000);
  const ledger = usage(root, { t: until, seconds: (until - start) / 1000 });
  const ours = (login0, repo) => !bot(login0) && (login ? login0 === login : String(login0 || '').toLowerCase() !== String(repo).split('/')[0]);
  const inWindow = (t) => { const ms = Date.parse(t); return ms >= start && ms < until; };
  const L = [];
  let unexplained = false;

  // Calls: GitHub's primary count covers the hour that ends at its reset.
  const rl = read(['api', 'rate_limit']);
  const core = rl?.resources?.core;
  if (core) {
    const from = core.reset * 1000 - 3600e3;
    const lc = usage(root, { t: now, seconds: Math.max(1, (now - from) / 1000) });
    const used = core.limit - core.remaining;
    const rest = lc.calls - lc.free - lc.graphql - lc.connector;
    L.push(`calls, primary: GitHub ${used} of ${core.limit} used since ${iso(from)} vs ledger ${rest} REST call(s): ${used - rest >= 0 ? `${used - rest} outside the tool (the connector's reads, raw gh or curl)` : `the ledger ${rest - used} over (counted before GitHub's reset)`}`);
    L.push(`calls, connector: ${lc.connector} counted by the session hook in that hour (on GitHub's primary or GraphQL count, as the connector makes them)`);
    const g = rl.resources.graphql;
    if (g) L.push(`calls, GraphQL: GitHub ${g.limit - g.remaining} of ${g.limit} used vs ledger ${lc.graphql} (gh's pr and issue commands)`);
  } else L.push('calls: rate_limit not answered; GitHub\'s count unread');

  // Pushes, per repository; the ledger's pushes logged with no repository cover gaps first.
  let pool = ledger.pushes_by['?'] || 0;
  const named = [];
  const audited = [...new Set([...repos.map((r) => r.toLowerCase()), ...Object.keys(ledger.pushes_by).map((k) => k.replace(/#state$/, '')).filter((r) => r !== '?')].filter((r) => slugOf(r)))];
  let pushGap = 0;
  for (const repo of audited) {
    const runs = pages(read, `repos/${repo}/actions/runs?event=push&created=>=${iso(start)}`, { pick: (x) => x?.workflow_runs });
    const seen = new Map();
    for (const r of runs) {
      if (!inWindow(r.created_at) || !ours(r.actor?.login, repo) || r.head_branch === stateBranch) continue;
      const k = `${r.head_branch}@${r.head_sha}`;
      if (!seen.has(k)) seen.set(k, { branch: r.head_branch, sha: String(r.head_sha || '').slice(0, 7), actor: r.actor?.login || '?', session: sessionIn(r.head_commit?.message) });
    }
    const lr = ledger.pushes_by[repo] || 0;
    let gap = Math.max(0, seen.size - lr);
    const covered = Math.min(gap, pool);
    pool -= covered;
    gap -= covered;
    if (gap) { pushGap += gap; named.push(...[...seen.values()].slice(-gap)); }
    L.push(`pushes, ${repo}: GitHub ${seen.size} (push-triggered runs, one per branch and commit${seen.size ? `: ${[...new Set([...seen.values()].map((x) => x.branch))].slice(0, 5).join(', ')}` : ''}) vs ledger ${lr}${covered ? `, ${covered} covered by pushes logged with no repository` : ''}${gap ? `: ${gap} GitHub shows that the ledger lacks` : ''}`);
    if (repo === String(product || '').toLowerCase()) {
