// ===== file: lane.mjs (continued) =====

    `## Your register: \`${l.dir}/${REGISTER}\``,
    `It survives every session; read it first (\`${p3} triage list\`). Each entry holds the problem, its evidence and its options with their context; once a response is chosen, the response word for word, the dated words that chose it and, for a short-term one, the condition that ends it. The tool prints each chosen short-term response verbatim, with its end condition, into the starting prompts of the roles it names, so never paraphrase it. A long-term problem is judged against the requirement, principle or foundation it names. Temporary measures live here, never as rulebook lines (AUD-9, TXT-3). Keep the open set short: close what is met, combine what overlaps; the tool reports when the printed block is over its cap.`,
    `Write it only with \`${p3} triage add\`, \`${p3} triage choose <id>\` (once the choice is made, quoting its dated words) and \`${p3} triage close <id> --how "<how the end condition was met>"\`, on \`lane/${l.name}\` from \`${tranche}\`; land each change as a pull request into \`${tranche}\`.`, '',
    `Not yours: merging, starting sessions, choosing a response, \`.process/\`, \`process/\`, the rulebooks, CLAUDE.md, deploying. Report each entry you add, choose or close to BOB by send_message. When you stop for good, tell BOB, who runs \`${P3} lane end ${l.name}\`.`,
].join('\n') + '\n';
}

// The links of a lane's design documents (claude.ai artifacts and documents), as recorded.
export const LANE_ARTIFACTS_FILE = 'lanes/artifacts.jsonl';
export function artifactsOf(rows, name) {
  const out = new Map();
  for (const r of rows || []) {
    if (r.lane !== name) continue;
    if (r.row === 'artifact') out.set(r.url, { url: r.url, title: r.title || null, at: r.at });
    else if (r.row === 'drop') out.delete(r.url);
  }
  return [...out.values()];
}
export const readArtifacts = (root, cfg, name) => artifactsOf(jsonl(readState(root, cfg.state_branch, LANE_ARTIFACTS_FILE)), name);

// lane artifact <name> <link> [--title "<name>"] | --drop: a lane's design document's link, so a successor finds it.
export function laneArtifact(root, name, url, { title, drop, log = console.log } = {}) {
  const cfg = loadConfig(root);
  const l = lane(cfg, name);
  if (typeof url !== 'string' || !/^https:\/\/\S+$/.test(url)) fail(`lane artifact ${l.name} <link>: the document's https link, not ${JSON.stringify(url ?? '')}`);
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) fail('--title "<the document\'s name>"');
  fetchState(root, cfg.state_branch, { fresh: true });
  const have = readArtifacts(root, cfg, l.name).some((a) => a.url === url);
  if (drop && !have) fail(`lane ${l.name} records no ${url}; nothing dropped`);
  const row = drop ? { row: 'drop', at: now(), lane: l.name, url } : { row: 'artifact', at: now(), lane: l.name, url, ...(title ? { title: title.trim() } : {}) };
  writeState(root, cfg.state_branch, `lane ${l.name}: artifact ${drop ? 'dropped' : 'recorded'}`, (wt) => put(wt, LANE_ARTIFACTS_FILE, row));
  log(`lane ${l.name}: ${url} ${drop ? 'dropped' : have ? 'recorded again' : 'recorded'}; ${readArtifacts(root, cfg, l.name).length} document(s)`);
  return row;
}

// lane start <name> [--replace <session>|pending] | --record <session>, and lane end <name>.
// The seed of a lane folder not yet in the product: <dir>/README.md (the lane, its area, the decision
// that set it up) and, for a design lane, an empty <research>/index.md.
export function seedFiles(l) {
  const readme = [`# Lane ${l.name}`, '', `- Lane: ${l.name}${l.kind === 'triage' ? ' (triage)' : ''}`, `- Area: \`${l.dir}/\`${l.module ? `, the marks of ledger module \`${l.module}\`` : ''}`, '- Decision: <the decision that set up this lane: the canon line or Bob\'s word, with its date>', ''].join('\n');
  const research = l.kind === 'triage' ? null : researchOf(l);
  return [{ file: `${l.dir}/README.md`, text: readme }, ...(research ? [{ file: `${research}/index.md`, text: '' }] : [])];
}
const seedText = (l, seed, tranche) => [`Lane ${l.name}'s directory ${l.dir}/ is not in ${tranche} yet. Seed it first: a lane-only pull request into ${tranche} (it changes only the lane's folders, so it takes the records-only path) adding:`, ...seed.map((f) => `- ${f.file}${f.text ? `:\n${f.text.split('\n').map((x) => `    ${x}`).join('\n').trimEnd()}` : ' (empty)'}`)].join('\n');

export function laneStart(root, name, { replace, record, model, slug, log = console.log, jobOpen = moduleJobOpen } = {}) {
  if (typeof name !== 'string' || !name) fail('lane start <name>');
  const cfg = loadConfig(root);
  const l = lane(cfg, name);
  fetchState(root, cfg.state_branch, { fresh: true });
  const seat = readSeats(root, cfg).get(l.name);
  if (record === undefined && (cfg.plan === 'pause' || cfg.plan === 'stop')) fail(`plan ${cfg.plan}: take no new step; no lane session was started`);
  const id = (v, what) => (typeof v === 'string' && /^session_[A-Za-z0-9]+$/.test(v) ? v : fail(`${what} <session id (session_...)>, not ${JSON.stringify(v ?? '')}`));
  if (record !== undefined) {
    const sid = id(record, '--record');
    writeState(root, cfg.state_branch, `lane ${l.name}: session ${sid}`, (wt) => {
      const s = seatAt(wt, l.name);
      if (!s) fail(`lane ${l.name} has no seat pending: lane start ${l.name} first; nothing recorded`);
      if (s.session) fail(`lane ${l.name} is ${s.session} (since ${s.at}); one session per lane; nothing recorded`);
      put(wt, LANE_SESSIONS_FILE, { row: 'record', at: now(), lane: l.name, session: sid });
    });
    log(`lane ${l.name} is ${sid}`);
    return { session: sid };
  }
  // A lane's module, when named, has its entry, its modules row and its requirements file (ruling, 6 Nov).
  const gaps = laneModuleGaps((f) => { try { return readFileSync(join(root, f), 'utf8'); } catch { return null; } }, { ...cfg, lanes: [l] });
  if (gaps.length) fail(`${gaps.join('; ')}; nothing was started`);
  // The lane's module's job at work is the lane's one session until it ends (job start, the other way in).
  if (l.module && !seat) {
    const j = jobOpen(root, cfg, l.module);
    if (j) fail(`job ${l.module}, lane ${l.name}'s module, is ${j.state} on ${j.branch}: it is the lane's one session now; send it the work, or start the lane once it completes; nothing was started`);
    if (j === null) log(`job ${l.module}'s branch could not be read: start the lane only if no job ${l.module} session is at work`);
  }
  const home = l.repo === 'process' ? PROCESS_ROOT : root;
  // A new lane's folder not yet in the product (coordinator, 6 Nov: lane investigation was refused and
  // BOB seeded its README by hand, copy 668, 669): the seeding step is printed and the lane starts,
  // its session's first pull request the seed. The pinned process3 is never seeded from here.
  const seed = !existsSync(join(home, l.dir)) ? (l.repo === 'process' ? fail(`lane ${l.name}'s directory ${l.dir}/ is not in the pinned process3`) : seedFiles(l).filter((f) => !existsSync(join(root, f.file)))) : null;
  if (seat && replace === undefined) fail(busy(l, seat));
  // A folder already there under the research area's name, holding files but no index.md, is not
  // the lane's research: the gate would let its changes skip the suite (review), so name it.
  const pre = l.kind === 'triage' ? null : qualification(root, l);
  if (pre && pre.files.length && !pre.index && !pre.records.length) fail(`lane ${l.name}'s research folder ${pre.area}/ already holds ${pre.files.length} file(s), and neither ${RESEARCH_INDEX} nor a qualification record: it is not the lane's research; set the lane's "research" in process/config.json to a folder of its own; nothing was started`);
  // GitHub pacing (R17, pace.mjs): at most pacing.lanes lane sessions at once, a pending seat
  // among them; a replace adds none. Checked here and again in the write, on the tip it writes to.
  const laneCap = (seats) => {
    const others = [...seats.values()].filter((x) => x.lane !== l.name);
    const max = pacedLanes(cfg);
    if (max !== null && others.length >= max) fail(`the lane cap is full: ${others.length} lane session(s) live (${others.map((x) => `lane ${x.lane}${x.session ? '' : ' pending'}`).join(', ')}) of pacing.lanes ${max} in process/config.json (GitHub pacing); end one with ${P3} lane end <name>, or raise pacing.lanes; nothing was started`);
  };
  if (!seat) laneCap(readSeats(root, cfg));
  // The budget throttles new sessions (R17): none while GitHub is paused or the hour's content use is at target.
  const gate = seat ? null : budgetGate(root);
  if (gate) fail(`${gate}; no lane session was started`);
  if (replace !== undefined && (!seat || replace !== (seat.session || 'pending'))) fail(`--replace names lane ${l.name}'s live session, ${seat ? seat.session || 'pending' : 'none'}; not ${JSON.stringify(replace)}`);
  const row = { row: 'start', at: now(), tranche: cfg.tranche, lane: l.name, ...(seat ? { replaces: seat.session || 'pending' } : {}) };
  writeState(root, cfg.state_branch, `lane ${l.name}: session started`, (wt) => {
    const s = seatAt(wt, l.name);
    if (!sameSeat(s, seat)) fail(`lane ${l.name}'s seat changed while this ran${s ? `: ${busy(l, s)}` : ''}; nothing was started`);
    if (!seat) laneCap(seatsIn(existsSync(join(wt, LANE_SESSIONS_FILE)) ? readFileSync(join(wt, LANE_SESSIONS_FILE), 'utf8') : ''));
    put(wt, LANE_SESSIONS_FILE, row);
  });
  // BOB's address read here, not with roles.mjs readAddress: roles imports job, which imports this.
  const bob = (() => { try { return JSON.parse(readState(root, cfg.state_branch, addressFile('bob')) || 'null')?.session || null; } catch { return null; } })();
  const s = l.repo === 'process' ? repoSlug(PROCESS_ROOT) : slug || repoSlug(root);
  // process3's own tranche is named tranche.
  const tranche = l.repo === 'process' ? 'tranche' : cfg.tranche;
  const text = l.kind === 'triage' ? triageSessionText : laneSessionText;
  const research = l.kind === 'triage' ? null : qualification(root, l);
  const prompt = (seed ? `${seedText(l, seed, tranche)}\n\n` : '') + text({ l, slug: s, tranche, bob, replaces: seat?.session || null, artifacts: readArtifacts(root, cfg, l.name), research });
  const call = { title: `lane ${l.name}`, source_url: `https://github.com/${s}`, source_revision: tranche, ...(model ? { model } : {}), prompt };
  log(prompt.trimEnd());
  log(`start the ${l.name} lane's one session with create_session:\n${JSON.stringify(call, null, 2)}`);
  if (research && !research.qualified) log(`lane ${l.name} has not qualified (${missing(research)}): the START above is its QUALIFICATION brief; lane ask refuses its questions until the qualification pull request is in ${tranche}`);
  log(`then: ${P3} lane start ${l.name} --record <the new session id>${seat?.session ? `; once it reports running and ${seat.session} is idle, archive_session ${seat.session}` : ''}`);
  return { prompt, call, replaces: seat?.session || null, qualified: research ? research.qualified : null, ...(seed ? { seed } : {}) };
}

export function laneEnd(root, name, { session, why, log = console.log } = {}) {
  if (typeof name !== 'string' || !name) fail('lane end <name> --session <its session id, or pending> --why "<why>"');
  const cfg = loadConfig(root);
  const l = lane(cfg, name);
  if (typeof why !== 'string' || !why.trim()) fail('--why "<why the lane session ends>"');
  fetchState(root, cfg.state_branch, { fresh: true });
  const seat = readSeats(root, cfg).get(l.name);
  if (!seat) fail(`lane ${l.name} has no live session; nothing to end`);
  if (session !== (seat.session || 'pending')) fail(`--session names lane ${l.name}'s live session, ${seat.session || 'pending'}; not ${JSON.stringify(session ?? '')}`);
  writeState(root, cfg.state_branch, `lane ${l.name}: session ended`, (wt) => {
    if (!sameSeat(seatAt(wt, l.name), seat)) fail(`lane ${l.name}'s seat changed while this ran; nothing was ended`);
    put(wt, LANE_SESSIONS_FILE, { row: 'end', at: now(), lane: l.name, session: seat.session, why: why.trim() });
  });
  log(`lane ${l.name}: ${seatName(seat)} ended; lane start ${l.name} starts the next${seat.session ? `; archive_session ${seat.session} once it is idle` : ''}`);
  return { ended: seat.session || 'pending' };
}

// Next work's items of a lane's module whose lane's recorded seat is held, marked so (status and
// the sweep read the mark).
export function markLaneHeld(cfg, seats, next) {
  for (const x of next || []) {
    const l = x?.module ? laneOfModule(cfg, x.module) : null;
    const s = l && seats?.get(l.name);
    if (s) x.lane_held = `lane ${l.name}'s session ${seatName(s)} is live: its work is the lane's, one session per lane`;
  }
  return next;
}

// The lane a module's job is the one session of, with its design documents' links, for the job's
// START (job.mjs); null for a module of no lane. The links unread are none, never a refusal.
export function laneForStart(root, cfg, id) {
  const l = laneOfModule(cfg, id);
  if (!l) return null;
  let artifacts = [];
  try { artifacts = readArtifacts(root, cfg, l.name); } catch { artifacts = []; }
  return { ...l, artifacts, research: qualification(root, l) };
}

// ===== file: lead.test.mjs =====

// The lead times' findings from the review of PR 70's last fix pass (b33cbd9): each scenario
// below hid an "over" or invented one before its fix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, makeRepo, onState } from './helpers.mjs';
import { fetchJobs, leadTimes, median } from '../lib/lead.mjs';
import { trancheReport } from '../lib/report.mjs';
import { readState } from '../lib/state.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { main } from '../p3.mjs';

const U = 'unmeasured';
const pick = ({ minutes, target, mark }) => ({ minutes, target, ...(mark ? { mark } : {}) });
const T0 = Date.parse('2026-11-01T00:00:00Z');
const t = (min) => new Date(T0 + min * 60000).toISOString();
const at = (min, fn) => { const e = { ...process.env }; process.env.GIT_COMMITTER_DATE = process.env.GIT_AUTHOR_DATE = t(min); try { return fn(); } finally { process.env = e; } };
const E = (id, state, more = {}) => ({ [`process/ledger/${id}.json`]: { id, status: { state, ...(state === 'BLOCKED' ? { reason: 'x' } : {}) }, ...more } });
const start = (m, min, attempt) => ({ at: t(min), module: m, row: 'attempt', event: 'start', ...(attempt ? { attempt } : {}) });
const complete = (m, min, pr, attempt) => ({ at: t(min), module: m, row: 'attempt', event: 'complete', pr, ...(attempt ? { attempt } : {}) });
const merge = (m, min, pr) => ({ at: t(min), module: m, row: 'merge', pr });
const opened = (min = 0) => [{ row: 'grant', tranche: 'tranche', at: t(min), outcome: 'ok' }];

function withOrigin() {
  const root = at(-100000, () => makeRepo({ 'README.md': 'x', 'CLAUDE.md': 'Bob\'s approvals\n', 'process/config.json': { tranche: 'tranche' } }));
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return { root, bare };
}

// A job branch off the tranche: commits at the minutes given, pushed, then back on the tranche.
function onJob(root, id, steps, { from = 'tranche' } = {}) {
  git(['checkout', '-q', '-B', `job/${id}`, from], { cwd: root });
  for (const [min, files] of steps) at(min, () => commit(root, files, `${id} at ${min}`));
  git(['push', '-q', '-f', 'origin', `job/${id}`], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
}
const mergeJob = (root, id, min) => at(min, () => git(['merge', '-q', '--no-ff', `job/${id}`, '-m', `Merge job/${id}`], { cwd: root }));

async function cli(root, argv, env = {}) {
  const cwd = process.cwd();
  const old = { log: console.log, err: console.error, env: { ...process.env } };
  const lines = [];
  console.log = (...x) => lines.push(x.join(' '));
  console.error = (...x) => lines.push(x.join(' '));
  Object.assign(process.env, env);
  try { process.chdir(root); const code = await main(argv); return { code, out: lines.join('\n') }; } finally { process.chdir(cwd); console.log = old.log; console.error = old.err; process.env = old.env; }
}

test('finding 1: only this tranche counts: an old module and its BLOCKED time and messages from before the opening are left out', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  // old: days ago, 300 min BLOCKED on the tranche, green 120 min before its merge, a message never answered.
  at(-5000, () => commit(root, E('old', 'BLOCKED'), 'old blocked'));
  at(-4700, () => commit(root, E('old', 'COMPLETE'), 'old done'));
  // a: now, quick.
  onJob(root, 'a', [[2, E('a', 'WORKING')]]);
  mergeJob(root, 'a', 12);
  const rows = [start('old', -5100), complete('old', -4900, 3), merge('old', -4680, 3), start('a', 1), complete('a', 5, 4), merge('a', 12, 4)];
  const gates = { 3: [{ ok: true, at: t(-4800) }], 4: [{ ok: true, at: t(6) }] };
  const lt = leadTimes(root, cfg, {
    ref: 'HEAD', rows, grants: opened(0), closed: [], restarts: [], jobRefs: new Map([['old', 'HEAD'], ['a', 'refs/remotes/origin/job/a']]), now: t(20),
    msgs: [{ from: 'old', n: 1, to: 'bob', at: t(-4950), text: 'stuck' }], comments: (pr) => gates[pr],
  });
  assert.deepEqual(lt.jobs.map((j) => j.module), ['a'], 'old started before the opening');
  assert.equal(lt.summary.green_to_merge.worst_mark, undefined);
  assert.equal(lt.summary.green_to_merge.worst, 6);
  assert.equal(lt.summary.replace, U, 'no stop in this tranche');
  assert.equal(lt.summary.report_wait, U, 'no message in this tranche');
  assert.equal(lt.jobs[0].report_wait, 'none');
  assert.deepEqual(lt.jobs[0].blocked, { minutes: 0 });
  // A module BLOCKED from before the opening into it counts from the opening only.
  at(-60, () => commit(root, E('b', 'BLOCKED'), 'b blocked before'));
  at(30, () => commit(root, E('b', 'WORKING'), 'b again'));
  const b = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('b', 40)], grants: opened(0), jobRefs: new Map([['b', 'HEAD']]), now: t(50) });
  assert.deepEqual(b.jobs[0].blocked, { minutes: 30 });
  // The opening not read: nothing can be scoped, so every figure is unmeasured, never all of history.
  const none = leadTimes(root, cfg, { ref: 'HEAD', rows, now: t(20), comments: (pr) => gates[pr] });
  assert.equal(none.opened, U);
  assert.equal(none.jobs, U);
  assert.equal(none.summary.green_to_merge, U);
});

test('finding 2: each attempt is measured, and the job shows its worst; ready unknown is unmeasured, never the oldest start', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  const rows = [start('m', 0, 1), complete('m', 10, 5, 1), merge('m', 12, 5), start('m', 100, 2), complete('m', 110, 6, 2), merge('m', 270, 6)];
  const gates = { 5: [{ ok: true, at: t(11) }], 6: [{ ok: true, at: t(111) }] };
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: new Map([['m', 2], ['n', 1]]), grants: opened(0), closed: [], now: t(300), comments: (pr) => gates[pr] });
  const m = lt.jobs[0];
  assert.deepEqual(m.green_to_merge, { minutes: 159, target: 15, mark: 'over', attempt: 2 });
  assert.deepEqual(m.attempts.map((a) => a.green_to_merge.minutes), [1, 159]);
  assert.deepEqual(m.start_to_pr_ready, { minutes: 10, attempt: 1 });
  // Layer 1 not closed: m's layer has not opened, so ready to start is unmeasured.
  assert.equal(m.ready_to_start, U);
  assert.equal(lt.summary.green_to_merge.worst_mark, 'over');
});

test('finding 3: an open figure counts in the worst, marked open, and stays out of the median', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('j', 0), complete('j', 5, 8)], grants: opened(0), now: t(300), comments: () => [{ ok: true, at: t(10) }] });
  assert.deepEqual(lt.jobs[0].green_to_merge, { minutes: 290, open: true, note: 'not merged', target: 15, mark: 'over', attempt: 1 });
  assert.deepEqual(lt.summary.green_to_merge, { n: 0, open: 1, median: U, worst: 290, worst_open: true, target: 15, worst_mark: 'over' });
  // Not green yet: no figure, and no gate row read: unmeasured.
  assert.equal(leadTimes(root, cfg, { ref: 'HEAD', rows: [start('j', 0), complete('j', 5, 8)], grants: opened(0), now: t(300), comments: () => [{ ok: false, at: t(10) }] }).jobs[0].green_to_merge, 'not green');
  assert.equal(leadTimes(root, cfg, { ref: 'HEAD', rows: [start('j', 0), complete('j', 5, 8)], grants: opened(0), now: t(300), comments: () => null }).jobs[0].green_to_merge, U);
});

test('finding 4: a tranche commit to the entry does not end a BLOCKED still running on the job branch', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  at(-10, () => commit(root, E('x', 'WORKING'), 'x working'));
  onJob(root, 'x', [[20, E('x', 'BLOCKED')]]);
  at(40, () => commit(root, E('x', 'WORKING', { checks: ['bob edited'] }), 'BOB edits x checks'));
  onJob(root, 'x', [[100, E('x', 'WORKING')]], { from: 'job/x' });
  mergeJob(root, 'x', 120);
  // After the merge the tranche's history governs: BLOCKED there from 150 to 170.
  at(150, () => commit(root, E('x', 'BLOCKED'), 'x blocked on tranche'));
  at(170, () => commit(root, E('x', 'COMPLETE'), 'x done'));
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('x', 0), complete('x', 110, 9), merge('x', 120, 9)], grants: opened(0), restarts: [], jobRefs: new Map([['x', 'refs/remotes/origin/job/x']]), now: t(200) });
  assert.deepEqual(lt.jobs[0].blocked, { minutes: 100 });
  assert.deepEqual(lt.jobs[0].replace.map((r) => [r.from, r.minutes]), [[t(20), 80], [t(150), 20]]);
});

test('finding 5: no job ref, a shallow clone and a stale ref read unmeasured or are fetched fresh, never 0 or open', async () => {
  const { root, bare } = withOrigin();
  const cfg = loadConfig(root);
  at(-10, () => commit(root, E('x', 'WORKING'), 'x working'));
  onJob(root, 'x', [[20, E('x', 'BLOCKED')], [60, E('x', 'WORKING')]]);
  mergeJob(root, 'x', 80);
  const rows = [start('x', 0), complete('x', 70, 9), merge('x', 80, 9)];
  at(81, () => commit(root, { 'process/metrics/x.jsonl': rows.map((r) => JSON.stringify(r)).join('\n') + '\n' }, 'rows'));
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  onState(root, { 'metrics/tranche-open.jsonl': JSON.stringify(opened(0)[0]) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const base = { ref: 'HEAD', rows, grants: opened(0), restarts: [], now: t(100) };
  // No job ref (origin has none, or unread): unmeasured, not 0.
  assert.equal(leadTimes(root, cfg, { ...base, jobRefs: new Map([['x', null]]) }).jobs[0].blocked, U);
  assert.equal(leadTimes(root, cfg, base).jobs[0].blocked, U);
  assert.deepEqual(leadTimes(root, cfg, { ...base, jobRefs: new Map([['x', 'refs/remotes/origin/job/x']]) }).jobs[0].blocked, { minutes: 40 });
  // A stale ref: local origin/job/x still at the BLOCKED commit, origin's moved on. fetchJobs reads it fresh.
  git(['update-ref', 'refs/remotes/origin/job/x', 'job/x~1'], { cwd: root });
  assert.equal(leadTimes(root, cfg, { ...base, rows: [start('x', 0)], jobRefs: new Map([['x', 'refs/remotes/origin/job/x']]) }).jobs[0].blocked.open, true, 'the scenario: a stale ref keeps it open');
  const refs = fetchJobs(root, ['x', 'gone']);
  assert.deepEqual([...refs], [['gone', null], ['x', 'refs/remotes/origin/job/x']]);
  assert.deepEqual(leadTimes(root, cfg, { ...base, rows: [start('x', 0)], jobRefs: refs }).jobs[0].blocked, { minutes: 40 });
  // A local ref origin no longer has stands for nothing.
  git(['update-ref', 'refs/remotes/origin/job/gone', 'job/x~1'], { cwd: root });
  assert.equal(fetchJobs(root, ['gone']).get('gone'), null);
  // A shallow clone: the entry's history cut after the opening reads unmeasured, never 0 ...
  const clone = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', '--branch', 'tranche', `file://${bare}`, clone], { cwd: root });
  git(['config', 'user.email', 'noreply@github.com'], { cwd: clone });
  git(['config', 'user.name', 'Test'], { cwd: clone });
  assert.equal(leadTimes(clone, cfg, { ...base, ref: 'origin/tranche', jobRefs: new Map([['x', 'refs/remotes/origin/job/x']]) }).jobs[0].blocked, U);
  // ... and metrics report and report tranche fetch the job branch and deepen, and measure it.
  const mr = await cli(clone, ['metrics', 'report'], { GITHUB_REPOSITORY: 'o/r' });
  assert.deepEqual(JSON.parse(mr.out).lead_times.jobs[0].blocked, { minutes: 40 });
  const rt = await cli(clone, ['report', 'tranche'], { GITHUB_REPOSITORY: 'o/r' });
  assert.match(rt.out, /\| x \| unmeasured \| 70 min \(attempt 1\) \| unmeasured \| 40 min \|/);
});

test('finding 7: blocked is informational; replace runs from the stop to the replacement, and a deferred block leaves both', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  at(-10, () => commit(root, { ...E('y', 'WORKING'), ...E('z', 'WORKING'), ...E('w', 'WORKING') }, 'working'));
  // y: BLOCKED at 20, replaced at 35, the replacement works until 200 and unblocks.
  onJob(root, 'y', [[20, E('y', 'BLOCKED')], [200, E('y', 'WORKING')]]);
  // z: BLOCKED at 20, never replaced; its PR closed unmerged and deferred at layer 1's close at 100.
  onJob(root, 'z', [[20, E('z', 'BLOCKED')]]);
  // w: silent; replaced at 340 after its last push at 300.
  onJob(root, 'w', [[300, { 'src/w.js': 'x' }]]);
  const restarts = [
    { row: 'restart', tranche: 'tranche', module: 'y', at: t(35), why: 'blocked on a choice', stopped: t(20), stopped_by: 'BLOCKED' },
    { row: 'restart', tranche: 'tranche', module: 'w', at: t(340), why: 'quiet', stopped: t(300), stopped_by: 'last push' },
    { row: 'restart', tranche: 'older', module: 'w', at: t(10), why: 'another tranche', stopped: t(5), stopped_by: 'last push' },
  ];
  const jobRefs = new Map(['y', 'z', 'w'].map((m) => [m, `refs/remotes/origin/job/${m}`]));
  const rows = [start('y', 0), start('z', 0), start('w', 0)];
  const closed = [{ row: 'closed', tranche: 'tranche', layer: 1, at: t(100), deferred: { z: { reason: 'x', marks: ['R1'] } } }];
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows, grants: opened(0), restarts, closed, jobRefs, now: t(400) });
  const by = Object.fromEntries(lt.jobs.map((j) => [j.module, j]));
  assert.deepEqual(by.y.blocked, { minutes: 180 }, 'no target, no mark');
  assert.deepEqual(by.y.replace, [{ from: t(20), minutes: 15, stopped_by: 'BLOCKED', source: 'blocked', replaced: t(35), target: 30 }]);
  assert.deepEqual(by.z.blocked, { minutes: 0 }, 'the deferred block leaves the figures');
  assert.equal(by.z.replace, 'none');
  assert.equal(by.z.start_to_pr_ready, 'deferred');
  assert.deepEqual(by.w.replace, [{ from: t(300), minutes: 40, stopped_by: 'last push', source: 'last push', replaced: t(340), target: 30, mark: 'over' }]);
  assert.deepEqual(lt.summary.replace, { n: 2, median: 27.5, worst: 40, target: 30, worst_mark: 'over' });
  assert.equal(lt.summary.blocked.target, undefined);
  // Not deferred, z's block is open and over.
  const open = leadTimes(root, cfg, { ref: 'HEAD', rows, grants: opened(0), restarts, closed: [], jobRefs, now: t(400) });
  assert.deepEqual(open.jobs.find((j) => j.module === 'z').replace, [{ from: t(20), minutes: 380, stopped_by: 'BLOCKED', source: 'blocked', open: true, target: 30, mark: 'over' }]);
});

test('finding 8: the median of an even count, an undecided layer close, and the opening as the first ok grant', () => {
  assert.equal(median([10, 20]), 15);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([]), U);
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  // Two ok grant checks after the last tranche close: the tranche opened at the first.
  const grants = [{ row: 'grant', tranche: 'tranche', at: t(50), outcome: 'ok' }, { row: 'grant', tranche: 'tranche', at: t(1), outcome: 'ok' }];
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('a', 5)], layers: new Map([['a', 1]]), grants, now: t(60) });
  assert.equal(lt.opened, t(1));
  assert.deepEqual(pick(lt.jobs[0].ready_to_start), { minutes: 4, target: 10 });
  // A layer close whose commit report tranche cannot place prints unmeasured, not "no layer closed".
  at(-5, () => commit(root, { 'build/layers.md': '| 1 | a |\n' }, 'layers'));
  at(6, () => commit(root, { 'process/metrics/a.jsonl': JSON.stringify(start('a', 5)) + '\n' }, 'rows'));
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  onState(root, {
    'metrics/tranche-open.jsonl': JSON.stringify(grants[1]) + '\n',
    'layers/closed.jsonl': JSON.stringify({ row: 'closed', tranche: 'tranche', layer: 1, at: t(30), commit: 'f'.repeat(40) }) + '\n',
  });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const md = trancheReport(root, cfg, { now: t(60), stateRead: true, io: { state: (p) => readState(root, 'process-state', p), merged: () => null, comments: () => [], compare: () => null } });
  assert.match(md, /- layer close to next job start: layer 1 unmeasured/);
});

// Review 1 of PR 76.
import { leadInputs } from '../lib/lead.mjs';

test('review 1: a job whose rows live only on its branch is measured; a closed tranche keeps its opening', async () => {
  const { root } = withOrigin();
  // u: started at 1 and BLOCKED at 5, its start row only on job/u (job start commits it there).
  at(-10, () => commit(root, E('u', 'WORKING'), 'u working'));
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  onJob(root, 'u', [[1, { 'process/metrics/u.jsonl': JSON.stringify(start('u', 1)) + '\n' }], [5, E('u', 'BLOCKED')]]);
  onState(root, { 'metrics/tranche-open.jsonl': JSON.stringify(opened(0)[0]) + '\n', 'metrics/restart.jsonl': '' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const lt = JSON.parse((await cli(root, ['metrics', 'report'], { GITHUB_REPOSITORY: 'o/r' })).out).lead_times;
  assert.deepEqual(lt.jobs.map((j) => j.module), ['u']);
  const u = lt.jobs[0];
  assert.equal(u.start_to_pr_ready.open, true);
  assert.equal(u.blocked.open, true);
  assert.equal(u.replace[0].open, true);
  assert.equal(u.replace[0].mark, 'over');
  // The tranche's close recorded, no grant since: the grants that close closed still open it.
  const rows = { 'metrics/tranche-open.jsonl': [{ row: 'grant', tranche: 'tranche', at: t(-500), outcome: 'ok' }, { row: 'grant', tranche: 'tranche', at: t(0), outcome: 'ok' }], 'tranches/closed.jsonl': [{ row: 'tranche-closed', tranche: 'tranche', at: t(-100) }, { row: 'tranche-closed', tranche: 'tranche', at: t(900) }] };
  const read = (p) => (rows[p] ? rows[p].map((r) => JSON.stringify(r)).join('\n') + '\n' : null);
  assert.deepEqual(leadInputs(root, 'process-state', read, 'tranche').grants.map((g) => g.at), [t(0)]);
  rows['metrics/tranche-open.jsonl'].push({ row: 'grant', tranche: 'tranche', at: t(1000), outcome: 'ok' });
  assert.deepEqual(leadInputs(root, 'process-state', read, 'tranche').grants.map((g) => g.at), [t(1000)], 'a new tranche opened: its own');
});

test('review 1: a second restart in one block runs from the first; the summary counts unmeasured jobs', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  at(-10, () => commit(root, E('y', 'WORKING'), 'y working'));
  onJob(root, 'y', [[20, E('y', 'BLOCKED')], [200, E('y', 'WORKING')]]);
  const restarts = [35, 160].map((m) => ({ row: 'restart', tranche: 'tranche', module: 'y', at: t(m), why: 'x', stopped: t(20), stopped_by: 'BLOCKED' }));
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('y', 0), start('v', 0)], grants: opened(0), restarts, jobRefs: new Map([['y', 'refs/remotes/origin/job/y'], ['v', null]]), now: t(400) });
  assert.deepEqual(lt.jobs.find((j) => j.module === 'y').replace.map((r) => [r.from, r.minutes, r.stopped_by]), [[t(20), 15, 'BLOCKED'], [t(35), 125, 'restart']]);
  assert.equal(lt.summary.blocked.unmeasured, 1, 'v: no job branch');
  assert.equal(lt.summary.replace.unmeasured, 1);
});

// Copy, 4 Nov: report tranche printed "origin/tranche b46497aa7a", a merge hours old, with the tip
// df6b8cde: the fetch failed unseen and the old ref was read. A failed fetch now refuses.
test('report tranche and metrics report refuse when the tranche cannot be fetched, never reading a stale ref', async () => {
  const { root } = withOrigin();
  git(['remote', 'set-url', 'origin', join(tmpdir(), 'p3-no-such-origin.git')], { cwd: root });
  for (const argv of [['report', 'tranche'], ['metrics', 'report']]) {
    const r = await cli(root, argv, { GITHUB_REPOSITORY: 'o/r' });
    assert.notEqual(r.code, 0, argv.join(' '));
    assert.match(r.out, /git fetch .*tranche.* failed/, argv.join(' '));
    assert.doesNotMatch(r.out, /at origin\/tranche/);
  }
});

// ===== file: setup.test.mjs =====

// setup check (setup audit, 2 Nov): stubbed GitHub responses, as the product's were read on 2 Nov.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { jobStart } from '../lib/job.mjs';
import { approvalsBlock } from '../lib/record.mjs';
import { CONFIRMED, READERS, loadConditions, setupCheck } from '../lib/setup.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo, write } from './helpers.mjs';

const quiet = () => {};
// The pin's shims: this checkout's own, as a product's pin would hold them.
const SHIMS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shims');
const shim = (f) => (existsSync(join(SHIMS, f)) ? readFileSync(join(SHIMS, f), 'utf8') : null);
// Read as git show reads a file through the tool: without its last newline.
const PIN = { sha: 'p'.repeat(40), file: (f) => (f.startsWith('shims/') ? shim(f.slice(6))?.replace(/\n$/, '') ?? null : null), list: () => readdirSync(SHIMS) };
const LINES = shim('CLAUDE.process.md').replaceAll('{tranche}', 'tranche');
const HOOKS = JSON.parse(shim('settings.hooks.json')).hooks;
const DENY = [
  'Bash(git push --force *)', 'Bash(git push -f *)', 'Bash(git push --force-with-lease *)', 'Bash(git push origin --delete *)',
  'Bash(gh api *contents/*)', 'mcp__github__create_or_update_file', 'mcp__github__push_files', 'mcp__github__delete_file',
  'mcp__github__merge_pull_request', 'Bash(gh pr merge *)', 'Bash(gh api *pulls/*/merge*)',
];
const rules = (id = 2) => [
  { type: 'deletion', ruleset_id: 1 }, { type: 'non_fast_forward', ruleset_id: 1 },
  { type: 'pull_request', parameters: { allowed_merge_methods: ['merge'], required_approving_review_count: 0, require_code_owner_review: false }, ruleset_id: id },
  { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'gate', integration_id: 15368 }] }, ruleset_id: id },
];


// Marsh Lane sent word of 11 rasps on hand.

// A product whose setup is complete; each test breaks one thing.
function world() {
  const w = {
    user: { login: 'acmewidget' },
    repo: { permissions: { admin: false, push: true }, allow_merge_commit: true, allow_auto_merge: false, delete_branch_on_merge: false },
    list: [{ id: 1 }, { id: 2 }],
    sets: {
      1: { id: 1, name: 'every-branch', target: 'branch', enforcement: 'active', current_user_can_bypass: 'never', conditions: { ref_name: { include: ['~ALL'], exclude: [] } }, rules: [{ type: 'deletion' }, { type: 'non_fast_forward' }] },
      2: { id: 2, name: 'process3', target: 'branch', enforcement: 'active', current_user_can_bypass: 'never', conditions: { ref_name: { include: ['refs/heads/main', 'refs/heads/tranche'], exclude: [] } }, rules: [] },
    },
    branches: { main: rules(), tranche: rules() },
    artifacts: { artifacts: [{ created_at: '2026-11-02T14:34:28Z', expires_at: '2027-01-31T14:33:29Z' }, { created_at: '2026-11-01T10:00:00Z', expires_at: '2026-11-02T10:00:00Z' }] },
    branchInfo: { main: { protected: true, protection: { enabled: false } }, tranche: { protected: true, protection: { enabled: false } } },
    protection: {},
    commit: { committer: { login: 'web-flow' }, author: { login: 'neobobkrause' }, commit: { verification: { verified: true } } },
    // The block the owner last set (ownerBlock); undefined: the tranche's own block, set by abc1234567.
    top: undefined,
    onTranche: { ok: true, head: 'a'.repeat(40), tip: 'a'.repeat(40) },
    cf: {},
    cfAsked: [],
    pin: PIN,
    files: { 'CLAUDE.md': `## Standing approvals from Bob\n\nThe owner's words.\n\n${LINES}`, '.claude/settings.json': JSON.stringify({ permissions: { deny: DENY }, hooks: HOOKS }),
      '.github/workflows/process-gate.yml': PIN.file('shims/process-gate.yml'), '.github/workflows/process-record.yml': PIN.file('shims/process-record.yml'), '.github/workflows/process-branch-prune.yml': PIN.file('shims/process-branch-prune.yml'), 'process/config.json': JSON.stringify({ tranche: 'tranche', coordinator: 'session_bob', environment: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'], cloudflare_account: 'acc123', deploy: { internal_walk: { run: ['npm', 'run', 'walk:internal'] } } }) },
    env: { CLOUDFLARE_API_TOKEN: 'tok-SECRET-value', CLOUDFLARE_ACCOUNT_ID: 'acc123' },
    asked: [],
  };
  w.io = {
    api: (p) => {
      w.asked.push(p);
      let m;
      if (p === 'user') return w.user;
      if (p === 'repos/o/r') return w.repo;
      if (p.startsWith('repos/o/r/rulesets?')) return w.list;
      if ((m = p.match(/^repos\/o\/r\/rulesets\/(\d+)\?/))) return w.sets[m[1]] || null;
      if ((m = p.match(/^repos\/o\/r\/rules\/branches\/(.+)$/))) return w.branches[decodeURIComponent(m[1])] ?? null;
      if (p.startsWith('repos/o/r/actions/artifacts?name=gate-row')) return w.artifacts;
      if ((m = p.match(/^repos\/o\/r\/branches\/([^/]+)\/protection$/))) return w.protection[decodeURIComponent(m[1])] ?? null;
      if ((m = p.match(/^repos\/o\/r\/branches\/([^/]+)$/))) return w.branchInfo[decodeURIComponent(m[1])] ?? null;
      if (/^repos\/[^/]+\/[^/]+\/commits\/[0-9a-f]+$/.test(p)) return w.commit;
      throw new Error(`unexpected read ${p}`);
    },
    file: (f) => w.files[f] ?? null,
    branchExists: () => true,
    ownerBlock: (file, heading) => (w.top !== undefined ? w.top : { ref: 'origin/tranche', sha: 'abc1234567890', at: 1, block: approvalsBlock(w.files[file], heading) }),
    onTranche: () => w.onTranche,
    get pin() { return w.pin; },
    cf: (path) => { w.cfAsked.push(path); const k = Object.keys(w.cf).find((x) => path.includes(x)); return k ? w.cf[k] : { status: 200, success: true }; },
  };
  Object.defineProperty(w.io, 'env', { get: () => w.env, enumerable: true });
  return w;
}
const root = () => makeRepo({ 'README.md': 'x' });
const check = (w) => setupCheck(root(), { slug: 'o/r', io: w.io, log: quiet });
const state = (r, id) => r.results.find((x) => x.id === id);

test('every condition is listed with what, why, value, who and how it is read, and every read one has a reader', () => {
  const cs = loadConditions();
  for (const c of cs) for (const k of ['id', 'what', 'why', 'value', 'who', 'read']) assert.ok(c[k] !== undefined && c[k] !== '', `${c.id}: ${k}`);
  assert.deepEqual(cs.filter((c) => c.read !== CONFIRMED).map((c) => c.id).sort(), [...READERS].sort());
  assert.deepEqual(cs.filter((c) => c.read === CONFIRMED).map((c) => c.id), ['ruleset-bypass', 'actions-settings', 'secrets', 'collaborators', 'environments']);
});

test('setup check reports the census (R15), never refusing on it', () => {
  const w = world();
  const out = [];
  const r = makeRepo({ 'README.md': 'x', 'process/config.json': { modules_file: 'build/modules.json' }, 'build/modules.json': { modules: [{ id: 'lost', layer: 1, paths: ['src/lost/'], tests: ['test/lost/'] }] }, 'build/layers.md': '| 1 | One | other |\n' });
  const res = setupCheck(r, { slug: 'o/r', io: w.io, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /census: 3 gap\(s\) at HEAD \(not-in-layer-map, no-entry, no-modules-row\); status --role bob lists the open layer's with their fixes/);
  assert.equal(res.census, 3, 'other, named by the layer map, has no modules row; lost is off the map, a gap whatever its state (coordinator, 6 Nov), and has no ledger entry (C16)');
  // Nothing in the census changes whether setup is complete.
  assert.equal(res.ok, setupCheck(root(), { slug: 'o/r', io: w.io, log: quiet }).ok);
});

test('a complete setup is all set, and the four unreadable conditions are confirmed, never read', () => {
  const w = world();
  const out = [];
  const r = setupCheck(root(), { slug: 'o/r', io: w.io, log: (m) => out.push(m) });
  assert.equal(r.ok, true, out.join('\n'));
  assert.deepEqual(r.results.filter((x) => x.state === 'set').map((x) => x.id).sort(), [...READERS].sort());
  assert.match(state(r, 'artifact-retention').detail, /kept 90 days/);
  assert.ok(!w.asked.some((p) => /actions\/permissions|secrets|collaborators|environments/.test(p)), w.asked.join(', '));
  assert.match(out.join('\n'), /- confirmed: secrets: confirmed once on the onboarding page/);
});

test('the account must push and not be an admin', () => {
  const w = world();
  w.repo.permissions.admin = true;
  const r = check(w);
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ['account']);
  assert.match(state(r, 'account').detail, /acmewidget: push true, admin true/);
  const w2 = world();
  w2.user = null;
  assert.match(state(check(w2), 'account').detail, /could not read the account/);
});

test('the every-branch ruleset needs ~ALL, nothing excluded, deletion and force-push, and no bypass', () => {
  for (const [what, change] of [
    ['not ~ALL', (s) => { s.conditions.ref_name.include = ['refs/heads/main']; }],
    ['an exclusion', (s) => { s.conditions.ref_name.exclude = ['refs/heads/x']; }],
    ['no force-push rule', (s) => { s.rules = [{ type: 'deletion' }]; }],
    ['evaluate only', (s) => { s.enforcement = 'evaluate'; }],
    ['a bypass', (s) => { s.current_user_can_bypass = 'always'; }],
  ]) {
    const w = world();
    change(w.sets[1]);
    assert.deepEqual(check(w).missing, ['ruleset-all-branches'], what);
  }
  const w = world();
  w.list = null;
  assert.match(state(check(w), 'ruleset-all-branches').detail, /could not read the rulesets/);
});

test('main and the tranche need a pull request, merge commits only, and the required check from Actions', () => {
  const cases = [
    [(w) => { w.branches.main = rules().filter((r) => r.type !== 'pull_request'); }, /main: no pull request rule/],
    [(w) => { w.branches.tranche[2].parameters.allowed_merge_methods = ['merge', 'squash']; }, /tranche: merge methods are not merge only/],
    [(w) => { w.branches.tranche[3].parameters.required_status_checks = [{ context: 'ci', integration_id: 15368 }]; }, /tranche: check gate is not required/],
    [(w) => { w.branches.main[3].parameters.required_status_checks = [{ context: 'gate' }]; }, /main: check gate is not tied to GitHub Actions/],
    [(w) => { w.sets[2].current_user_can_bypass = 'pull_requests_only'; }, /can bypass ruleset "process3"/],
    [(w) => { delete w.branches.tranche; }, /tranche: could not read its rules/],
    [(w) => { w.branches.main[2].parameters.required_approving_review_count = 1; }, /main: a pull request rule requires 1 approving review\(s\), not 0/],
    [(w) => { w.branches.tranche[2].parameters.require_code_owner_review = true; }, /tranche: a pull request rule requires a code owner's review/],
    [(w) => { w.branches.main.push({ type: 'pull_request', parameters: { allowed_merge_methods: ['squash'], required_approving_review_count: 0 }, ruleset_id: 2 }); }, /main: merge methods are not merge only/],
    [(w) => { w.branches.tranche[2].parameters.required_reviewers = [{ reviewer: { id: 1, type: 'Team' } }]; }, /tranche: a pull request rule names required reviewers/],
  ];
  for (const [change, why] of cases) {
    const w = world();
    change(w);
    const r = check(w);
    assert.deepEqual(r.missing, ['ruleset-main-tranche']);
    assert.match(state(r, 'ruleset-main-tranche').detail, why);
  }
  // The required check is the one config names.
  const w = world();
  w.files['process/config.json'] = JSON.stringify({ coordinator: 's', required_check: 'ci' });
  assert.match(state(check(w), 'ruleset-main-tranche').detail, /check ci is not required/);
});

test('the retired GitHub pacing hook (PD-22) is a warning, not drift; any other unknown hook stays a gap (C60)', () => {
  // The copy's own hook, as R17c set it: it prints "not governed" and exits 0.
  const pacing = 'd="${CLAUDE_PROJECT_DIR:-$PWD}"; f="$d/.process/tool/p3.mjs"; h="$d/.process/tool/hook.mjs"; cd "$d" || exit 2; if [ -f "$h" ]; then node "$h"; exit $?; fi; echo "GitHub pacing hook: $f has no github hook: this call is not governed" >&2; exit 0';
  const w = world();
  const withPre = (cmds) => JSON.stringify({ permissions: { deny: DENY }, hooks: { ...HOOKS, PreToolUse: [{ matcher: 'Bash', hooks: cmds.map((command) => ({ type: 'command', command })) }] } });
  w.files['.claude/settings.json'] = withPre([pacing]);
  let r = check(w);
  assert.equal(state(r, 'shim-drift').state, 'set', state(r, 'shim-drift').detail);
  assert.match(state(r, 'shim-drift').detail, /warning: retired GitHub pacing hook \(PD-22\): harmless; Bob may remove it$/);
  w.files['.claude/settings.json'] = withPre([pacing, 'node other.mjs']);
  r = check(w);
  assert.equal(state(r, 'shim-drift').state, 'missing');
  assert.match(state(r, 'shim-drift').detail, /carries a PreToolUse hook the pin does not allow \(node other\.mjs\)/);
  assert.doesNotMatch(state(r, 'shim-drift').detail, /does not allow \(d=/);
});

test('merge settings: merge commits on, auto-merge off, no branch deleted on merge', () => {
  const w = world();
  w.repo.allow_auto_merge = true;
  w.repo.delete_branch_on_merge = true;
  const r = check(w);
  assert.deepEqual(r.missing, ['merge-settings']);
  assert.match(state(r, 'merge-settings').detail, /allow_auto_merge is true, not false; delete_branch_on_merge is true, not false/);
});

test('the deny list must hold the safety, file-write and merge-route rules, and not a rule that blocks the tool\'s push', () => {
  // No settings-file rule is required: the record check holds the settings file (build 5).
  assert.equal(check(world()).ok, true);
  const w = world();
  w.files['.claude/settings.json'] = JSON.stringify({ permissions: { deny: [...DENY.filter((d) => !/merge/.test(d)), 'Bash(node .process/tool/p3.mjs github push *)'] } });
  const d = state(check(w), 'deny-list');
  assert.equal(d.state, 'missing');
  for (const m of ['lacks mcp__github__merge_pull_request', 'lacks Bash(gh pr merge *)', 'lacks Bash(gh api *pulls/*/merge*)', 'holds Bash(node .process/tool/p3.mjs github push *), which blocks a session\'s push of its own branch']) assert.ok(d.detail.includes(m), `${m} in ${d.detail}`);
  const w2 = world();
  delete w2.files['.claude/settings.json'];
  assert.match(state(check(w2), 'deny-list').detail, /no .claude\/settings.json on tranche/);
