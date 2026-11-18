// ===== file: expire.mjs (continued) =====

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

// ===== file: rerun.test.mjs =====

// Recovery after a governor refusal (R17c, item F; Bob, 6 Nov: when an operation is delayed and then
// dropped, does the code that dropped it know why and recover?). For each multi-step command, a
// governor refusal is injected at each GitHub step in turn (a gh call through the io stand-ins, and
// the push through the governed git), and a rerun of the same command completes with no duplicate
// merge, comment or row and no lost state.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { jobSync } from '../lib/job.mjs';
import { merge } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { useShared } from '../lib/pace.mjs';
import { Fail, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const REFUSED = 'GitHub budget: 68 of the 80 content-creating requests a minute used account-wide, the target 85% (68): acts on GitHub wait until 2026-11-06T23:59:00Z (16 min); then rerun `node .process/tool/p3.mjs merge 3`';
// Every push refused, as a stopped account refuses them.
const stopped = { read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'secondary rate limit', stopped: true }, use: [] }), pause: () => null };

function setup() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/a.mjs': 'x', 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}

// GitHub as the merge sees it, with state: a merge closes the pull request. `refuseAt` throws the
// governor's refusal at that call (1-based), once.
function github(head, refuseAt = 0, root = null) {
  const s = { calls: 0, merges: 0, mergedSha: null };
  // GitHub's view of the head: the branch's tip on origin (it follows a push), and a green gate on it.
  const tip = () => (root ? git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0] : head);
  const step = (f) => (...a) => { s.calls++; if (s.calls === refuseAt) throw new Fail(REFUSED); return f(...a); };
  return {
    s,
    io: {
      getPR: step(() => (s.merges ? { state: 'closed', merged: true, merge_commit_sha: s.mergeSha, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: s.mergedSha } } : { state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: tip() } })),
      comments: step(() => [
        { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
        { id: 2, body: block(GATE, { runs: [...new Set([head, tip()])].map((sha) => ({ sha, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 })) }), user: { login: BOT } },
      ]),
      checkRun: step(() => ({ status: 'completed', conclusion: 'success', html_url: 'run' })),
      verify: step((slug, r) => r.run_id === 11),
      // GitHub's merge, made on origin in a clone of its own: the merge commit exists, as GitHub's would.
      mergePR: step((slug, n, sha) => {
        s.merges++;
        s.mergedSha = sha;
        let m = 'm'.repeat(40);
        if (root) {
          const gh0 = join(mkdtempSync(join(tmpdir(), 'p3-ghmerge-')), 'g');
          git(['clone', '-q', '-b', 'tranche', git(['remote', 'get-url', 'origin'], { cwd: root }), gh0], { cwd: root });
          for (const [k, v] of [['user.email', 'gh@example.com'], ['user.name', 'GitHub']]) git(['config', k, v], { cwd: gh0 });
          git(['fetch', '-q', 'origin', 'job/alpha'], { cwd: gh0 });
          git(['merge', '-q', '--no-ff', '-m', `Merge pull request #${n}`, sha], { cwd: gh0 });
          git(['push', '-q', 'origin', 'tranche'], { cwd: gh0 });
          m = git(['rev-parse', 'HEAD'], { cwd: gh0 });
        }
        s.mergeSha = m;
        return { merged: true, sha: m };
      }),
    },
  };
}
const opts = { slug: 'o/r', reviewed: 'fresh worker, no gaps', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} };
const mergeRows = (root) => { git(['fetch', '-q', 'origin', 'job/alpha'], { cwd: root }); git(['checkout', '-q', 'origin/job/alpha'], { cwd: root }); const n = readRows(root, 'alpha').filter((r) => r.row === 'merge').length; git(['checkout', '-q', 'main'], { cwd: root }); return n; };

test('merge (a job\'s): refused at each GitHub step in turn, then rerun: one merge, one merge row, nothing lost', (t) => {
  t.after(() => useShared(null));
  const clean = setup();
  const g0 = github(clean.head, 0, clean.root);
  assert.equal(merge(clean.root, 3, { ...opts, io: g0.io }).merged, true);
  const steps = g0.s.calls;
  assert.ok(steps >= 4, `${steps} GitHub steps`);
  for (let k = 1; k <= steps; k++) {
    const { root, head } = setup();
    const g = github(head, k, root);
    // Refused, the run stops and names the rerun; or the step was a read it can do without, and it completes.
    try { merge(root, 3, { ...opts, io: g.io }); } catch (e) { assert.ok(e.message.includes('GitHub budget') && e.message.includes('then rerun'), `step ${k}: ${e.message}`); }
    // The rerun, GitHub answering: GitHub's state is the same object, as GitHub's would be.
    const again = { ...g.io };
    const s = g.s;
    const r = merge(root, 3, { ...opts, io: { ...again, getPR: (...a) => { s.calls = -1e9; return again.getPR(...a); } } });
    assert.ok(r.merged === true || r.already, `step ${k}: the rerun completes`);
    assert.equal(s.merges, 1, `step ${k}: one merge`);
    assert.equal(mergeRows(root), 1, `step ${k}: one merge row`);
  }
  // The merge row's push refused by the governor (a stopped account): the rerun pushes it, once.
  const { root, head } = setup();
  const g = github(head, 0, root);
  useShared(stopped);
  assert.throws(() => merge(root, 3, { ...opts, io: g.io }), /GitHub budget: .*every GitHub call is stopped.*then rerun/s);
  useShared(null);
  assert.equal(g.s.merges, 0, 'nothing merged before its row is on the branch');
  assert.equal(merge(root, 3, { ...opts, io: g.io }).merged, true);
  assert.equal(g.s.merges, 1);
  assert.equal(mergeRows(root), 1);
});

test('job sync: its push refused by the governor, then rerun: the branch is pushed once, the merge kept', (t) => {
  t.after(() => useShared(null));
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['branch', '-q', '--set-upstream-to', 'origin/job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/b.mjs': 'more work' });
  useShared(stopped);
  assert.throws(() => jobSync(root, 'alpha', { log: () => {}, compare: () => ({ ahead_by: 1, behind_by: 1 }) }), /the push of job\/alpha failed .*GitHub budget.*run `node \.process\/tool\/p3\.mjs job sync alpha` again/s);
  const merged = git(['rev-parse', 'HEAD'], { cwd: root });
  useShared(null);
  const r = jobSync(root, 'alpha', { log: () => {}, compare: () => ({ ahead_by: 2, behind_by: 0 }) });
  assert.deepEqual(r.merged, [], 'the first run\'s merge of the tranche stands; nothing merged twice');
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), merged);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], merged, 'pushed on the rerun');
});

// ===== file: tranche.mjs =====

// tranche open and tranche close (Build Plan Phase 3, Bob's words 1 and 3 Nov).
// Open: before any job starts, BOB and one short probe session, each at the depth it runs at,
// take a handful of approved acts. The tool prints them, one command or MCP call each; BOB records
// each outcome with --record, one row per act on the state branch (OPEN_FILE), a refusal also
// with metrics refusal's row, so it counts toward REFRESH. A refused or declined act the work needs
// stops the open and BOB brings it to Bob; a refused or declined archive or task deletion is
// counted and reported only. The act is never reworded or rerouted. The throwaway branches are
// kept, never deleted.
// Close: once every layer is closed (or the plan says close), and with a `deploy` block once the
// last round's walk ran (its internal walk, or the deploy and walk where none is configured) and its
// findings are recorded (walkHold), then the release path (BD-R1), main into the tranche and the
// tranche into main, each by a plain pull request through merge --plain; then --record writes the
// close on the state branch, as layer close does.
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { compare } from './github.mjs';
import { completionItems, openItems } from './completion.mjs';
import { deploys, roundAct, roundWhat, roundsAt, walkFindings, walkHold } from './deploy.mjs';
import { RELEASE_PATH_GAP, RELEASE_WALKS_FILE, internalRequired, releaseWalks, releasesCut, roundLine, runPassed, runSource, unplaced } from './rounds.mjs';
import { P3, wakeLine } from './job.mjs';
import { REFUSALS_FILE, recordRefusal } from './metrics.mjs';
import { tipApprovals } from './roles.mjs';
import { fetchState, jsonl, readState, writeState } from './state.mjs';
import { closedRows, layerState, status } from './status.mjs';
import { depth as fetchDepth, sessionCall, fail, git, isShallow, loadConfig, repoSlug } from './util.mjs';

export const OPEN_FILE = 'metrics/tranche-open.jsonl';
export const TRANCHE_CLOSED_FILE = 'tranches/closed.jsonl';
export const OUTCOMES = ['ok', 'refused', 'declined'];
// The acts, BOB's at its depth, the probe's one deeper. `needed: false`: counted and reported only.
export const BOB_ACTS = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
export const PROBE_ACTS = ['push', 'pr-open', 'pr-comment', 'pr-merge'];
export const REPORT_ONLY = new Set(['session-archive', 'task-delete']);


// The Dunn store took in 5 awls.

const put = (wt, path, line) => { mkdirSync(dirname(join(wt, path)), { recursive: true }); appendFileSync(join(wt, path), line); };
const bobDepth = (d) => {
  const n = d === undefined ? 1 : Number(d);
  if (d === true || !Number.isInteger(n) || n < 0) fail(`--depth <n>, BOB's depth (1 when ROOT started it), not ${JSON.stringify(d)}`);
  return n;
};

// The tranche's closes, newest last.
export const trancheCloses = (root, cfg) => jsonl(readState(root, cfg.state_branch, TRANCHE_CLOSED_FILE)).filter((r) => r.row === 'tranche-closed' && r.tranche === cfg.tranche);

// Rows and closes carry milliseconds, so a row written after a close sorts after it.
const stamp = () => new Date().toISOString();
const currentRows = (root, cfg) => {
  const since = trancheCloses(root, cfg).at(-1)?.at || '';
  return jsonl(readState(root, cfg.state_branch, OPEN_FILE)).filter((r) => r.row === 'grant' && r.tranche === cfg.tranche && String(r.at) > since);
};
// BOB's depth: --depth when given, else the lowest depth recorded in this open (BOB's acts are
// always at the lower of the two), else 1. So status needs no flag for a BOB at depth 2.
const inferDepth = (rows, depth) => (depth !== undefined ? bobDepth(depth) : rows.length ? Math.min(...rows.map((r) => r.depth)) : 1);

// The open of this tranche: the rows after its last close, the latest per act and depth counting.
export function openState(root, cfg, { depth } = {}) {
  const rows = currentRows(root, cfg);
  const d = inferDepth(rows, depth);
  const want = [...BOB_ACTS.map((act) => ({ act, depth: d })), ...PROBE_ACTS.map((act) => ({ act, depth: d + 1 }))];
  const got = want.map((w) => ({ ...w, row: rows.filter((r) => r.act === w.act && r.depth === w.depth).at(-1) || null }));
  const recorded = got.filter((g) => g.row).length;
  const bad = got.filter((g) => g.row && g.row.outcome !== 'ok');
  const stop = bad.filter((g) => !REPORT_ONLY.has(g.act));
  const reported = bad.filter((g) => REPORT_ONLY.has(g.act));
  const state = stop.length ? 'stopped' : recorded === want.length ? 'open' : 'pending';
  return { state, recorded, of: want.length, stop, reported, missing: got.filter((g) => !g.row), depth: d };
}

const describe = (g) => `${g.act} at depth ${g.depth} ${g.row.outcome}${g.row.session ? ` (${g.row.session})` : ''}`;
export function openLine(o) {
  if (o.state === 'stopped') return `tranche open: STOPPED: ${o.stop.map(describe).join('; ')}; bring it to Bob; no act is reworded or rerouted, and no job starts`;
  const rep = o.reported.length ? `; reported, not stopping: ${o.reported.map(describe).join('; ')}` : '';
  if (o.state === 'open') return `tranche open: passed, ${o.recorded} of ${o.of} acts recorded${rep}`;
  return `tranche open: ${o.recorded} of ${o.of} acts recorded${rep}; no job starts until it passes (${P3} tranche open)`;
}

// tranche open: the steps, nothing written. The throwaway branch's number is one past those origin has.
// now: the clock its printed steps read (a test fixes it: two runs compared read it once).
export function trancheOpen(root, { depth, log = console.log, slug = repoSlug(root), now = Date.now } = {}) {
  const cfg = loadConfig(root);
  const { tip } = tipApprovals(root, cfg);
  fetchState(root, cfg.state_branch);
  const o = openState(root, cfg, { depth });
  const d = o.depth;
  log(openLine(o));
  if (o.state === 'stopped') return { ...o, steps: [] };
  const prefix = `p3/grants-${cfg.tranche}-`;
  const ls = git(['ls-remote', '--heads', 'origin', `refs/heads/${prefix}*`], { cwd: root });
  const taken = ls.split('\n').map((l) => l.split('\t')[1]?.slice(11 + prefix.length)).map((x) => Number(String(x).split('-')[0])).filter(Number.isInteger);
  const n = Math.max(0, ...taken) + 1;
  const base = `${prefix}${n}`;
  const [owner, repo] = slug.split('/');
  const rec = (act, dd) => `${P3} tranche open --record "${act}|${dd}|<ok, refused or declined>" --session <the session that took it>`;
  const gitActs = (who, dd) => [
    `\`git checkout -q -b ${base}-${who} ${tip}\`, then \`git commit -q --allow-empty -m "grants check ${n}: ${who}"\``,
    `push: \`${P3} github push origin ${base}-${who} --set-upstream\``,
    `pr-open: create_pull_request {"owner":"${owner}","repo":"${repo}","head":"${base}-${who}","base":"${base}","title":"grants check ${n}: ${who}","body":"A throwaway pull request of the tranche open's grants check. Kept, never deleted."}`,
    `pr-comment: add_issue_comment on that pull request: "grants check ${n}: ${who} comments"`,
    `pr-merge: \`${P3} merge <that pull request> --plain --no-review "grants check: an empty commit into a throwaway branch"\``,
  ];
  const probe = [
    `# Grants probe ${n} for ${slug}`, '',
    `You are a short probe of the tranche open's grants check, started by BOB at depth ${d + 1}. Bob's standing approvals in CLAUDE.md are your authority. Take each act below as its own command, once. If an act is refused or declined, never reword or reroute it: note its exact words and go on to the next.`, '',
    '1. `git submodule update --init .process`',
    ...gitActs('probe', d + 1).map((s, i) => `${i + 2}. ${s}`), '',
    `Then send BOB one message with send_message: one line per act, "<act>|${d + 1}|<ok, refused or declined>" (push, pr-open, pr-comment, pr-merge), and the exact words of any refusal. Then end.`,
  ].join('\n');
  const call = sessionCall({ slug, revision: tip, title: `grants probe ${n}`, prompt: probe, clone: { clone_depth: 1 } });
  const at = new Date(now() + 864e5).toISOString().replace(/\.\d+Z$/, 'Z');
  const steps = [
    `\`${P3} github push origin ${tip}:refs/heads/${base}\` (the throwaway base; kept, never deleted)`,
    ...gitActs('bob', d).slice(0, 1),
    ...gitActs('bob', d).slice(1).map((s) => `${s}; then ${rec(s.split(':')[0], d)}`),
    `session-start: create_session with the call below; then ${rec('session-start', d)}`,
    `wait for its message; for each line it sends, ${rec('<act>', d + 1)} with its session id`,
    `session-archive: archive_session {"session_id":"<the probe's id>"}; then ${rec('session-archive', d)}`,
    `task-create: create_trigger {"name":"grants check ${n}","run_once_at":"${at}","prompt":"grants check ${n}: a throwaway task; delete it.","initiation":"own_followup"}; then ${rec('task-create', d)}`,
    `task-delete: delete_trigger {"trigger_id":"<its id>"}; then ${rec('task-delete', d)}`,
    `\`${P3} tranche open --check\``,
  ];
  log(`BOB's acts for the grants check ${n} (depth ${d}; the probe ${d + 1}), each its own command; a refused or declined act is recorded as it is, never reworded or rerouted:`);
  steps.forEach((s, i) => log(`${i + 1}. ${s}`));
  log(`the probe's create_session call:\n${JSON.stringify(call, null, 2)}`);
  return { ...o, n, base, steps, call };
}

// tranche open --record "<act>|<depth>|<outcome>"... --session <id>: one row per act on the state
// branch, in one push; a refusal also as metrics refusal's row in this checkout.
export function recordOpen(root, records, { session, depth, bob, as = 'bob', log = console.log } = {}) {
  const cfg = loadConfig(root);
  if (typeof session !== 'string' || !session.trim()) fail('--record needs --session <the session that took the act>');
  const rows = records.map((x) => {
    const [act, dd, outcome, ...rest] = String(x).split('|').map((p) => p.trim());
    if (rest.length || !BOB_ACTS.includes(act) || !OUTCOMES.includes(outcome)) fail(`--record "<act>|<depth>|<ok, refused or declined>", the act one of ${BOB_ACTS.join(', ')}; not ${JSON.stringify(x)}`);
    const depth = Number(dd);
    if (!/^\d+$/.test(dd)) fail(`the depth in ${JSON.stringify(x)} is not a whole number`);
    return { row: 'grant', at: stamp(), tranche: cfg.tranche, act, depth, outcome, session: session.trim() };
  });
  if (!rows.length) fail('--record "<act>|<depth>|<ok, refused or declined>"');
  // Only acts the check counts: BOB's at its depth, the probe's four one deeper.
  fetchState(root, cfg.state_branch, { fresh: true });
  const d = inferDepth([...currentRows(root, cfg), ...rows], depth);
  const off = rows.filter((r) => !(r.depth === d || (r.depth === d + 1 && PROBE_ACTS.includes(r.act))));
  // A stop is Bob's to lift: a later ok for an act that stopped the open needs his words.
  const before = openState(root, cfg, { depth: d });
  const lifts = rows.filter((r) => r.outcome === 'ok' && before.stop.some((g) => g.act === r.act && g.depth === r.depth));
  if (lifts.length && (typeof bob !== 'string' || !bob.trim())) fail(`${lifts.map((r) => `${r.act} at depth ${r.depth}`).join(', ')} stopped this open; an ok after it needs --bob "<Bob's words lifting the stop>"; nothing recorded`);
  if (lifts.length) for (const r of lifts) r.bob = bob.trim();
  if (off.length) fail(`not an act of this check (BOB at depth ${d}, the probe's ${PROBE_ACTS.join(', ')} at ${d + 1}): ${off.map((r) => `${r.act} at depth ${r.depth}`).join(', ')}; nothing recorded`);
  writeState(root, cfg.state_branch, `tranche open: ${rows.map((r) => `${r.act} ${r.depth} ${r.outcome}`).join(', ')}`, (wt) => put(wt, OPEN_FILE, rows.map((r) => JSON.stringify(r) + '\n').join('')));
  // The refusal row after the push, so a failed push rerun does not count one refusal twice.
  for (const r of rows.filter((x) => x.outcome === 'refused')) recordRefusal(root, { session: r.session, act: `tranche open: ${r.act}`, depth: r.depth });
  for (const r of rows) log(`recorded ${r.act} at depth ${r.depth}: ${r.outcome}${r.outcome === 'refused' ? ` (and in ${REFUSALS_FILE}; commit it by BOB's plain pull request)` : ''}`);
  // The record that passes the open lets jobs start: the wake of BOB is the last line.
  const wake = before.state !== 'open' && openState(root, cfg, { depth: d }).state === 'open' ? wakeLine('tranche open passed', as) : null;
  if (wake) log(wake);
  return rows;
}

// tranche open --check: open, pending or stopped; exit 0 only when open.
export function checkOpen(root, { depth, as = 'bob', log = console.log } = {}) {
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  const o = openState(root, cfg, { depth });
  log(openLine(o));
  if (o.state === 'pending') log(`not yet recorded: ${o.missing.map((g) => `${g.act} at depth ${g.depth}`).join(', ')}`);
  const wake = o.state === 'open' ? wakeLine('tranche open passed', as) : null;
  if (wake) log(wake);
  return o;
}

// Whether `sha` is on `base`: GitHub's compare when online, else local ancestry, which a shallow
// clone's cut history cannot answer: there an unread compare is a failure, not a guess.
const onBranch = (root, slug, base, sha, read) => {
  const c = slug ? read(slug, base, sha) : null;
  if (Number.isInteger(c?.ahead_by)) return c.ahead_by === 0;
  if (isShallow(root)) fail(`GitHub's compare of ${sha.slice(0, 10)} with ${base} could not be read, and this clone is shallow: run again`);
  return git(['merge-base', '--is-ancestor', sha, `refs/remotes/origin/${base}`], { cwd: root, allowFail: true }).code === 0;
};

// tranche close: refused unless every layer is closed or the plan says close; prints BOB's acts.
// tranche close --record: once the tranche is on main, the close on the state branch.
export function trancheClose(root, { record = false, report = false, log = console.log, io = {}, slug = repoSlug(root) } = {}) {
  const read = io.compare || compare;
  const cfg = loadConfig(root);
  const t = `origin/${cfg.tranche}`;
  git(['fetch', '-q', ...fetchDepth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${t}`, '+refs/heads/main:refs/remotes/origin/main'], { cwd: root });
  fetchState(root, cfg.state_branch, { fresh: true });
  const tip = git(['rev-parse', t], { cwd: root });
  const main = git(['rev-parse', 'origin/main'], { cwd: root });
  if (record) {
    if (!onBranch(root, slug, 'main', tip, read)) fail(`${cfg.tranche} ${tip.slice(0, 10)} is not on main yet; merge the tranche's pull request first`);
    if (trancheCloses(root, cfg).some((r) => r.commit === tip)) fail(`the close of ${cfg.tranche} at ${tip.slice(0, 10)} is already recorded`);
    const row = { row: 'tranche-closed', tranche: cfg.tranche, commit: tip, main, at: stamp() };
    writeState(root, cfg.state_branch, `tranche ${cfg.tranche} closed at main ${main.slice(0, 10)}`, (wt) => put(wt, TRANCHE_CLOSED_FILE, JSON.stringify(row) + '\n'));
    log(`tranche ${cfg.tranche} closed: ${tip.slice(0, 10)} on main ${main.slice(0, 10)}`);
    if (report) log(`next: ${P3} report tranche`);
    return { ok: true, row };
  }
  // The plan as the tranche holds it, not this working tree.
  let plan = null;
  try { plan = loadConfig(root, t).plan; } catch { plan = null; }
  if (plan !== 'close') {
    const s = status(root, { log: () => {}, io: io.status });
    const ls = layerState(root, cfg, s.rows, t, { closed: closedRows(root, cfg, { slug, read }) });
    if (!ls) fail(`no layer map (${cfg.layers_file}) on ${t}, and the plan on ${t} is ${plan}, not close`);
    const open = ls.layers.filter((L) => !L.closed);
    if (open.length) fail(`layers not closed: ${open.map((L) => L.n).join(', ')}; the tranche closes when every layer is closed, or when the plan says close`);
    // The completion round (PLN-4): every item done, or deferred with a reason on its line.
    const c = completionItems(root, cfg, t);
    if (c?.missing) fail(`completion_file ${c.file} is not on ${t}; the tranche closes when its completion round is done`);
    const left = openItems(c);
    if (left.length) fail(`completion round not done: ${left.map((x) => (x.malformed ? `${x.id} (not an item line)` : `${x.id} (${x.target})`)).join(', ')} open in ${c.file}; tick each when done, or mark it "deferred: <reason>"`);
  }
  // The tranche's end (BD-R1, Bob, 8 Nov): "This successive set of rounds continues until an
  // internal walk doesn't find flaws, the release deployment happens, and the walk of the release
  // also doesn't identify flaws. When the release walk is clean, the installer is updated for that
  // release, then the [product's] website is updated to refer to the new install, and that ends
  // the tranche." Refused in that order; then the two updates, each on Bob's approval.
  const end = deploys(cfg) ? trancheEnd(root, cfg, t, { plan, slug, read }) : null;
  const [owner, repo] = slug.split('/');
  const steps = [...(end?.steps || [])];
  if (onBranch(root, slug, cfg.tranche, main, read)) log(`main ${main.slice(0, 10)} is already in ${cfg.tranche}: no merge of main into it`);
  else {
    steps.push(`create_pull_request {"owner":"${owner}","repo":"${repo}","head":"main","base":"${cfg.tranche}","title":"Merge main into ${cfg.tranche}","body":"Brings the tranche up to main before it closes."}`);
    steps.push(`\`${P3} merge <that pull request> --plain --no-review "main into the tranche before its close"\``);
  }
  steps.push(`create_pull_request {"owner":"${owner}","repo":"${repo}","head":"${cfg.tranche}","base":"main","title":"Close ${cfg.tranche}","body":"The tranche's work, merged through the gate and its reviews."}`);
  steps.push(`\`${P3} merge <that pull request> --plain --no-review "the tranche's work, merged through the gate and its reviews"\` (it waits for main's required checks)`);
  steps.push(`\`${P3} tranche close --record\``);
  log(`BOB's acts to close ${cfg.tranche} at ${tip.slice(0, 10)}, each its own command; a refused act is never reworded or rerouted:`);
  steps.forEach((s, i) => log(`${i + 1}. ${s}`));
  return { ok: true, steps, ...(end ? { release: end.release, gaps: end.gaps } : {}) };
}

// The approval-gated updates after a clean release walk (BD-R1; Bob's answer the same day: "Process,
// on my approval"): each runs only through the protected GitHub environment that names Bob as
// required reviewer, a workflow of the product's own. process/config.json names each workflow as
// installer_update and site_update ({ "workflow": "<file in .github/workflows>" }); one not named is a
// gap, reported, never a deploy step the tool invents. No session touches the installer worker or
// the site itself.
export const END_ACTS = [
  { key: 'installer_update', what: (v) => `the installer update for release ${v}` },
  { key: 'site_update', what: (v) => `the product website's update to refer to the new install of ${v}` },
];
export function endActs(cfg, version, slug, branch) {
  const [owner, repo] = slug.split('/');
  const steps = [];
  const gaps = [];
  for (const a of END_ACTS) {
    const wf = cfg[a.key]?.workflow;
    if (typeof wf === 'string' && /^[\w.-]+\.ya?ml$/.test(wf)) steps.push(`${a.what(version)}, on Bob's approval: the GitHub connector's actions_run_trigger: run_workflow, workflow_id ${wf}, owner ${owner}, repo ${repo}, ref ${branch}, inputs {"version":"${version}"}; it waits in the protected environment that names Bob as required reviewer`);
    else {
      gaps.push(`${a.key}: no workflow in ${slug} runs ${a.what(version)} (process/config.json names none)`);
      steps.push(`${a.what(version)}, on Bob's approval: GAP, no workflow runs it yet (process/config.json ${a.key} names none); bring it to Bob through the coordinator, and the close waits on his word`);
    }
  }
  return { steps, gaps };
}

// The end of the rounds and the release (BD-R1), refused in order: no round open; a clean internal
// walk; a release cut after it; a clean walk of that release, installed on a p3dev- deployment.
// Then the installer and site updates, named in order. Without an internal walk configured, the
// walk the deploy row records stands for it; without a release block, the tranche cuts no release.
export function trancheEnd(root, cfg, t, { plan, slug, read }) {
  const w = walkFindings(root, cfg, t, { slug, read });
  if (!w.last) fail(`the last round's walk is owed before the tranche closes: ${roundAct(cfg)} (${roundWhat(cfg)})`);
  const hold = walkHold(w);
  if (hold) fail(`tranche close waits: ${hold}`);
  // The plan's close (PLN-5, your word) ends the tranche where it stands: the latest run's findings
  // recorded, as before; the rounds and the release are not owed.
  if (plan === 'close') return { steps: [], gaps: [], release: null };
  const rs = roundsAt(root, cfg, t, w);
  // A round open, owed, or merged since the latest walk (its fixes not yet walked): the rounds go on.
  if (['layer', 'next', 'new', 'walk'].includes(rs.state)) fail(`tranche close waits: ${roundLine(rs)} (BD-R1: rounds repeat until an internal walk finds no flaw)`);
  // A finding no module owns is a flaw no round can place: BOB names its module first.
  const loose = unplaced(root, t);
  if (loose.length) fail(`tranche close waits: ${loose.map((f) => f.id).join(', ')} in the found file of no module: BOB names its module (\`${P3} found <module> "<finding>" --from "<source>"\`), and the next round fixes it`);
  // 1. A clean internal walk: the latest round-close run's.
  // Exempt by Bob's word (deploycfg internalWalkOf), or not configured: the run's own walk stands for it.
  const iw = internalRequired(cfg, w.last);
  const clean = runPassed(cfg, w);
  if (!clean) fail(`tranche close waits: the latest ${iw ? 'internal walk' : 'walk'} (${runSource(w.last)}) is not clean (${iw ? `${w.last.internal_walk ? `ok ${w.last.internal_walk.ok}, ${Number(w.last.internal_walk.failures) || 0} failure(s)` : 'it did not run'}` : `ok ${w.last.ok}, ${Number(w.last.walk?.failures) || 0} failure(s)`}); its findings open the next round, and the rounds repeat until one is clean (BD-R1)`);
  if (!cfg.release) return { steps: [], gaps: [], release: null };
  // 2. The release deployment: a development release cut after that walk.
  const rel = releasesCut(root, cfg, w.last);
  if (!rel) fail(`tranche close waits: no development release since the clean internal walk ${runSource(w.last)}: ${P3} release dev, then the release deployment and its walk (BD-R1)`);
  // 3. The walk of the release: of that release installed on a p3dev- deployment.
  const rw = releaseWalks(root, cfg).filter((r) => r.version === rel.version).at(-1);
  if (!rw) fail(`tranche close waits: the release deployment of ${rel.version} and its walk are owed: ${P3} deploy release ${rel.version}; GAP: no path yet installs the cut, signed release onto a p3dev- deployment (no row in ${RELEASE_WALKS_FILE}; ${RELEASE_PATH_GAP}), brought to Bob through the coordinator`);
  if (!(rw.ok === true && !(Number(rw.failures) > 0))) fail(`tranche close waits: the walk of release ${rel.version} found ${Number(rw.failures) || 1} flaw(s); recorded as found marks, they open the next round (BD-R1)`);
  // BD-R5 (Bob, 9 Nov): a release walk clean with no AI account configured is clean for the non-AI
  // journeys only; the installer and site updates wait for a release walk with AI on, clean too.
  const aiWalk = releaseWalks(root, cfg).filter((r) => r.version === rel.version && r.ai === true).at(-1);
  if (rw.ai !== true && !(aiWalk && aiWalk.ok === true && !(Number(aiWalk.failures) > 0))) fail(`tranche close waits: the walk of release ${rel.version} is clean on the non-AI journeys only (no AI account configured${rw.not_walked?.length ? `; not walked: ${rw.not_walked.join(', ')}` : ''}); the installer and site updates wait until a release walk with AI on is clean too: Bob configures the AI account, walk.ai is set true, and the release is walked again (BD-R5)`);
  // 4 and 5. The installer, then the site: each on Bob's approval, named in order.
  const e = endActs(cfg, rel.version, slug, cfg.tranche);
  return { ...e, release: rel.version };
}

// ===== file: restart-speed.test.mjs =====

// Restart speed (coordinator, 5 Nov): the five defects that slowed the copy's restart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { commit, entry, makeRepo, onState } from './helpers.mjs';
import { readSessions, recordedStarts, sessionActs, sessionsBound, sessionsCount } from '../lib/status.mjs';
import { writeState } from '../lib/state.mjs';
import { jobStart } from '../lib/job.mjs';
import { startCheck } from '../lib/start.mjs';
import { DEEP_MARK, depth, fetchBranch, fetchJobRefs, git, lockNote, markedDeep } from '../lib/util.mjs';
import { briefText as reviewBrief } from '../lib/review.mjs';
import { briefText as triageBrief } from '../lib/triage.mjs';

const quiet = () => {};
const iso = (h) => new Date(Date.parse('2026-11-05T00:00:00Z') + h * 36e5).toISOString();
const startRow = (id, h, o = {}) => JSON.stringify({ at: iso(h), module: id, row: 'attempt', event: 'start', role: 'job', attempt: 1, ...o }) + '\n';

export function withOrigin(files = {}) {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche', coordinator: 'session_coord1' }, ...files });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}
// A job branch on origin cut from the tranche with these metrics lines; merged: the tranche takes it.
export function jobBranch(root, id, lines, { merged = false, name = `job/${id}` } = {}) {
  git(['checkout', '-q', '-B', name, 'tranche'], { cwd: root });
  commit(root, { [`process/metrics/${id}.jsonl`]: lines }, `start ${id}`);
  git(['push', '-q', 'origin', name], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  if (merged) { git(['merge', '-q', '--no-ff', '-m', `merge ${id}`, name], { cwd: root }); git(['push', '-q', 'origin', 'tranche'], { cwd: root }); }
  git(['fetch', '-q', 'origin'], { cwd: root });
}

test('item 1: one page of list_sessions stands when it holds every session the record knows; refused only when one could be missing', () => {
  const root = withOrigin({ 'process/ledger/a.json': entry('a'), 'process/ledger/b.json': entry('b'), 'process/ledger/c.json': entry('c') });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  jobBranch(root, 'b', startRow('b', 1), { merged: true }); // merged: its sessions are not the record's open ones
  jobBranch(root, 'a', startRow('a', 3));
  // A --restart's row is on the state branch; one before a's open run is not its.
  onState(root, { 'metrics/restart.jsonl': [JSON.stringify({ at: iso(5), module: 'a', row: 'restart', why: 'stopped' }), JSON.stringify({ at: iso(2), module: 'a', row: 'restart' }), JSON.stringify({ at: iso(6), module: 'b', row: 'restart' })].join('\n') + '\n' });
  assert.deepEqual(recordedStarts(root, { offline: true }), [{ id: 'a', first: iso(3), count: 2 }]);
  const dir = mkdtempSync(join(tmpdir(), 'p3-sessions-'));
  const file = join(dir, 's.json');
  const page = (data) => { writeFileSync(file, JSON.stringify({ ccr: { data, has_more: true, last_id: data.at(-1)?.id } })); return file; };
  const s = (id, title, h, st = 'SESSION_STATUS_IDLE') => ({ id, title, session_status: st, created_at: iso(h), updated_at: iso(h) });
  // No record: a page stands once it reaches past the first start of every job the state branch
  // records as possibly live (build/starter-fixes, coordinator 5 Nov: never every page back to 1 Aug).
  assert.equal(readSessions(page([s('s9', 'build/x', 9), s('s6', 'other', 2)]), { root, offline: true }).length, 2);
  // Newest first, reaching back to 05:06 only: a's first session (started 03:00) could be on the next page.
  const short = [s('s9', 'build/x', 9), s('s8', 'job a (restart)', 5.1)];
  assert.throws(() => readSessions(page(short), { root, offline: true }), /has_more\), and a recorded job session could be on them \(job a: 2 sessions started since 2026-11-05T03:00:00\.000Z\).*the last page reaches back no further than 2026-11-05T03:00:00\.000Z/);
  // Both of a's sessions listed: covered.
  assert.equal(readSessions(page([...short, s('s7', 'job a', 3.1, 'SESSION_STATUS_ARCHIVED')]), { root, offline: true }).length, 3);
  // An older record (the oldest job session live at a whole read, created 01:30): a page must reach past it.
  onState(root, { 'metrics/live-sessions.json': JSON.stringify({ oldest: iso(1.5), at: iso(8), live: 3 }) + '\n' });
  assert.throws(() => readSessions(page([s('s9', 'build/x', 9), s('s8', 'job a (restart)', 5.1), s('s7', 'job a', 3.1), s('s6', 'other', 2)]), { root, offline: true }), /a job session live at the last whole read \(created 2026-11-05T01:30:00\.000Z\) could be on them.*no further than 2026-11-05T01:30:00\.000Z/);
  onState(root, { 'metrics/live-sessions.json': JSON.stringify({ oldest: iso(5.1), at: iso(8), live: 1 }) + '\n' });
  // Reaching it stands: every session live then, and every one since, is on the page.
  assert.equal(readSessions(page(short), { root, offline: true }).length, 2);
  // A session with no creation time reaches back nowhere; and without the record, a page is refused as before.
  assert.throws(() => readSessions(page([...short, { id: 's5', title: 'x' }]), { root, offline: true }), /could be on them/);
  assert.throws(() => readSessions(page([...short, s('s6', 'other', 2)])), /list_sessions has more pages \(has_more\): call it with limit 100/);
  // A full list is read as it always was.
  writeFileSync(file, JSON.stringify({ data: short, has_more: false }));
  assert.equal(readSessions(file, { root, offline: true }).length, 2);
});

test('item 3: a role\'s start check re-anchors as job start does: a tranche merge between create_session and the check moves HEAD to the tip; changed approvals still fail', () => {
  const P3 = join(dirname(fileURLToPath(import.meta.url)), '..', 'p3.mjs');
  const APPROVALS = '## Standing approvals from Bob\n\nSessions may push.\n';
  const root = withOrigin({ 'CLAUDE.md': APPROVALS });
  git(['checkout', '-q', '--detach', 'tranche'], { cwd: root });
  const other = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', '-b', 'tranche', git(['remote', 'get-url', 'origin'], { cwd: root }), other], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'o@example.com'], ['user.name', 'O'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: other });
  const move = (files) => { commit(other, files, 'a train merge'); git(['push', '-q', 'origin', 'tranche'], { cwd: other }); };
  const check = () => spawnSync(process.execPath, [P3, 'start', 'check'], { cwd: root, encoding: 'utf8' });
  move({ 'src/x.txt': 'merged while the role started' });
  const r = check();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /moved to the tip of tranche/);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), git(['rev-parse', 'refs/remotes/origin/tranche'], { cwd: root }));
  // The approvals changed on the tip: never moved, the check fails.
  move({ 'CLAUDE.md': APPROVALS.replace('may push', 'may push anywhere') });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const changed = check();
  assert.equal(changed.status, 1);
  assert.match(changed.stdout, /DIFFERENT from the tip/);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), head);
});

test('item 5: one git user per clone: BOB\'s rulebook and the review and triage briefs say it; a lock left in a clone is said plainly, stale or held', () => {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  assert.match(readFileSync(join(repo, 'rulebooks', 'bob.md'), 'utf8'), /One git user per clone at a time: each review or triage worker clones its own, never your checkout/);
  const review = reviewBrief({ pr: { number: 1, title: 't', base: { ref: 'tranche' }, head: { ref: 'job/a', sha: 'f'.repeat(40) } }, files: [], job: null, owner: 'o', approvalsFile: 'CLAUDE.md' });
  assert.match(review, /Run git only in a clone of your own .*never in the checkout you were given: one git user per clone at a time/);
  const triage = triageBrief({ n: { key: 'k', provider: 'p', pr: 1 }, changed: { ids: [], file: 'f' }, mods: [], tranche: 'tranche', sha: 'a'.repeat(40) });
  assert.match(triage, /Read with git only in a clone of your own .*one git user per clone at a time/);
  // A real lock in a clone, git refusing on it.
  const root = makeRepo({ 'a.txt': 'a' });
  const lock = join(realpathSync(root), '.git', 'index.lock');
  writeFileSync(lock, '');
  writeFileSync(join(root, 'a.txt'), 'b');
  assert.throws(() => git(['add', 'a.txt'], { cwd: root }), (e) => e.message.includes(`No git process runs in this clone, so ${lock} is stale, left by a git command that was killed: remove it (rm '${lock}') and run this again (one git user per clone at a time`));
  const stderr = `fatal: Unable to create '${lock}': File exists.`;
  assert.match(lockNote(stderr, root, { procs: () => [realpathSync(root)] }), /1 other git process still runs in this clone and holds .*index\.lock .*run this again once it ends/);
  assert.match(lockNote(stderr, root, { procs: () => null }), /is held by another git command in this clone or left by a killed one/);
  assert.match(lockNote('fatal: shallow file has changed since we read it', root), /Another git command changed this clone's shallow file while this one ran/);
  assert.equal(lockNote('fatal: something else', root), '');
});

test('item 4: a reopened module whose pull request the train landed after the start\'s anchor is cut from the tip holding that merge, in a full and a shallow clone; no hand choice', () => {
  const APPROVALS = '# P\n\n## Standing approvals from Bob\n\nSessions may push.\n';
  for (const shallow of [false, true]) {
    const full = makeRepo({ 'CLAUDE.md': APPROVALS, 'process/ledger/a.json': entry('a', { requirements: 'r/a.md' }), 'r/a.md': '- **R1** *(not yet met: x)* a\n' });
    git(['branch', 'tranche'], { cwd: full });
    const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
    git(['init', '-q', '--bare', bare], { cwd: full });
    git(['remote', 'add', 'origin', bare], { cwd: full });
    git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: full });
    // The train's clone: a's first attempt merged, then a second one on job/a, its PR green.
    const other = full;
    git(['checkout', '-q', '-b', 'job/a', 'tranche'], { cwd: other });
    commit(other, { 'process/ledger/a.json': entry('a', { requirements: 'r/a.md', status: { state: 'COMPLETE' } }), 'process/metrics/a.jsonl': startRow('a', 1) }, 'attempt 1');
    git(['checkout', '-q', 'tranche'], { cwd: other });
    git(['merge', '-q', '--no-ff', '-m', 'merge a 1', 'job/a'], { cwd: other });
    git(['checkout', '-q', 'job/a'], { cwd: other });
    git(['merge', '-q', '--no-ff', '-m', 'Bring job/a up to tranche', 'tranche'], { cwd: other });
    commit(other, { 'src/a/x.mjs': 'attempt 2' }, 'attempt 2 and the train\'s merged result');
    git(['push', '-q', 'origin', 'tranche', 'job/a'], { cwd: other });
    git(['checkout', '-q', 'tranche'], { cwd: other });
    // BOB's clone at the tranche tip, before the land.
    const bob = join(mkdtempSync(join(tmpdir(), 'p3-bob-')), 'c');
    git(['clone', '-q', ...(shallow ? ['--depth', '1'] : []), '-b', 'tranche', `file://${bare}`, bob], { cwd: tmpdir() });
    for (const [k, v] of [['user.email', 'b@example.com'], ['user.name', 'B'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: bob });
    git(['checkout', '-q', '--detach'], { cwd: bob });
    // GitHub's compare, read now from origin: base a name (its tip now) or a sha.
    const compare = (slug, b, h) => {
      git(['fetch', '-q', 'origin'], { cwd: other });
      const ref = (x) => (/^[0-9a-f]{40}$/.test(x) ? x : `origin/${x}`);
      return { ahead_by: Number(git(['rev-list', '--count', `${ref(b)}..${ref(h)}`], { cwd: other })) };
    };
    // The train lands a's second attempt right after this start's anchor (inside its setup check).
    let landed = false;
    const setup = (r, o) => {
      const c = startCheck(r, { branch: 'tranche', anchor: o.anchor, log: quiet });
      if (!landed) { landed = true; git(['merge', '-q', '--no-ff', '-m', 'merge a 2 (the train)', 'job/a'], { cwd: other }); git(['push', '-q', 'origin', 'tranche'], { cwd: other }); }
      return c.ok ? { ok: true, missing: [], results: [{ id: 'session-branch', state: 'set' }] } : { ok: false, missing: ['session-branch'], results: [] };
    };
    const out = [];
    let r;
    try { r = jobStart(bob, 'a', { coordinator: 'session_bob', reopen: 'answer the provider notice', setup, compare, find: () => null, prs: () => [], open: () => ({ number: 9, html_url: 'u' }), log: (l) => out.push(l) }); } catch (e) { throw new Error(`${shallow ? 'shallow' : 'full'}: ${e.message}\n${git(['log', '--oneline', '--graph', '-8', 'HEAD', 'origin/job/a', 'origin/tranche'], { cwd: bob })}\n${git(['log', '--oneline', '--graph', '-8', 'job/a', 'tranche'], { cwd: other })}`); }
    assert.ok(r.launch, shallow ? 'shallow' : 'full');
    const tip = git(['rev-parse', 'origin/tranche'], { cwd: other });
    git(['fetch', '-q', 'origin'], { cwd: other });
    assert.equal(git(['rev-parse', 'origin/job/a^'], { cwd: other }), tip, 'cut from the tip holding the land, pushed as a fast-forward');
    assert.ok(out.some((l) => /job\/a merged into tranche after this start's anchor [0-9a-f]{10}: anchoring again at the tip/.test(l)), out.join('\n'));
  }
});

test('item 4: a branch tip truly not in the tranche after a full read is refused plainly, its sha and the way on named, nothing pushed', () => {
  const APPROVALS = '# P\n\n## Standing approvals from Bob\n\nSessions may push.\n';
  for (const shallow of [false, true]) {
    const full = makeRepo({ 'CLAUDE.md': APPROVALS, 'process/ledger/a.json': entry('a', { requirements: 'r/a.md' }), 'r/a.md': '- **R1** *(not yet met: x)* a\n' });
    git(['branch', 'tranche'], { cwd: full });
    const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
    git(['init', '-q', '--bare', bare], { cwd: full });
    git(['remote', 'add', 'origin', bare], { cwd: full });
