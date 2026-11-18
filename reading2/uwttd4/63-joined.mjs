// ===== file: wfyaml.mjs (continued) =====

    throw e;
  }
}

// ===== file: merge-waits.test.mjs (later part) =====

});

// #8 -------------------------------------------------------------------------------------------

const REQ = '# p\n\n- **R1** *(not yet met: x)* signs a token\n- **R2** checks a token\n';
const NOTICE = { row: 'notice', key: 'p:7', provider: 'p', ids: ['R1'], pr: 7, users: ['u1'] };
// A provider job merged into the tranche after the tranche moved `ahead` commits past the job's
// base, and a depth-1 clone of origin, as a fresh BOB has after a handover.
function shallowMerged(ahead = 60) {
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': { modules: [{ id: 'p', paths: ['src/p/'] }, { id: 'u1', paths: ['src/u1/'], uses: ['p'] }] },
    'process/ledger/p.json': entry('p', { status: { state: 'COMPLETE' } }), 'process/ledger/u1.json': entry('u1', { status: { state: 'COMPLETE' } }),
    'req/p.md': REQ, 'req/u1.md': '# u1\n\n- **R1** met\n', 'src/p/a.mjs': 'export const sign = 1;\n', 'src/u1/a.mjs': 'x\n',
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/p', 'tranche'], { cwd: root });
  const head = commit(root, { 'test/p/b.test.mjs': 'x\n', 'req/p.md': REQ.replace('*(not yet met: x)* ', '') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  for (let i = 0; i < ahead; i++) commit(root, { [`t/${i}.txt`]: `${i}` });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'job/p', 'main'], { cwd: root });
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const mb = git(['merge-base', `${m}^1`, `${m}^2`], { cwd: root });
  const bob = join(mkdtempSync(join(tmpdir(), 'p3-bob-')), 'bob');
  git(['clone', '-q', '--depth', '1', '-b', 'main', `file://${bare}`, bob], { cwd: root });
  for (const [k, v] of [['user.email', 'bob@example.com'], ['user.name', 'BOB'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: bob });
  assert.ok(isShallow(bob));
  // GitHub's compare, answered from the full history.
  const asked = [];
  const compare = (slug, a, b) => { asked.push([a, b]); return { merge_base_commit: { sha: git(['merge-base', a, b], { cwd: root }) } }; };
  return { root, bob, m, mb, head, compare, asked };
}

test('a shallow clone takes a merged pull request\'s merge base from GitHub\'s compare, however far back it lies', () => {
  const s = shallowMerged(60);
  const r = mergedRange(s.bob, s.m, { slug: 'o/r', n: 7, read: s.compare });
  assert.deepEqual(r, { head: s.head, mb: s.mb });
  assert.deepEqual(s.asked, [[git(['rev-parse', `${s.m}^1`], { cwd: s.root }), s.head]]);
  assert.ok(isShallow(s.bob), 'nothing was unshallowed');
  // No answer from GitHub: refused, naming the step.
  const t = shallowMerged(1);
  assert.throws(() => mergedRange(t.bob, t.m, { slug: 'o/r', n: 7, read: () => null }), /this clone is shallow and GitHub did not give the merge base of pull request 7/);
});

test('notice triage, notice withdraw and merge run again on a merged pull request read a merge base 60 commits back in a shallow clone', () => {
  const s = shallowMerged(60);
  const getPR = () => ({ merged: true, state: 'closed', merge_commit_sha: s.m, head: { ref: 'job/p', sha: s.head }, base: { ref: 'tranche' } });
  const out = [];
  noticeTriage(s.bob, 'p:7', { log: (x) => out.push(x), io: { slug: 'o/r', getPR, compare: s.compare } });
  assert.match(out.join('\n'), /- R1\n  before: - \*\*R1\*\* \*\(not yet met: x\)\* signs a token\n  after:  - \*\*R1\*\* signs a token/);
  const r = merge(s.bob, 7, { slug: 'o/r', io: { getPR, compare: s.compare }, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet });
  assert.equal(r.merged, true);
  assert.deepEqual(r.notices.rows, []);
  const w = withdrawNotice(s.bob, loadConfig(s.bob), 'p:7', { getPR, slug: 'o/r', log: quiet, compare: s.compare });
  assert.equal(w.merge_commit, s.m);
});

test('a job branch that conflicts with the tranche is refused, naming job sync', () => {
  const { root, head } = jobRepo();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/alpha/a.mjs': 'the tranche says otherwise' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const f = jobIO(root, { gate: () => ({ status: 'completed', conclusion: 'success' }) });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, every: 0, log: quiet }),
    /^Error: job\/alpha conflicts with tranche; the job must bring itself up to date: node \.process\/tool\/p3\.mjs job sync alpha, then job complete alpha again$/);
  assert.equal(remoteTip(root), head, 'nothing pushed');
});

// Review of PR 106: a rerun that brings the cost the first run lacked writes it, and the report
// then reads the attempt priced, never unmeasured.
test('merge run again with --job-cost-usd after a run without it writes the priced row', () => {
  const { root, head } = jobRepo();
  const first = jobIO(root, { gate: (sha) => (sha === head ? { status: 'completed', conclusion: 'success' } : { status: 'queued' }) });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: first.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, minutes: 0, every: 0, log: quiet }), /did not finish within 0 min/);
  const T = remoteTip(root);
  const merged = [];
  const again = jobIO(root, { merged, gate: () => ({ status: 'completed', conclusion: 'success' }) });
  again.seen.push(head, T);
  const logs = [];
  assert.equal(merge(root, 3, { slug: 'o/r', io: again.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '4.2', jobSession: 'session_J', log: (m) => logs.push(m), wait: 0 }).merged, true);
  const T2 = remoteTip(root);
  assert.notEqual(T2, T, 'the priced row is pushed and gated');
  assert.deepEqual(merged, [T2]);
  assert.match(logs.join('\n'), /job alpha's cost: 4\.2 USD/);
  git(['checkout', '-q', T2], { cwd: root });
  const rows = readRows(root, 'alpha');
  assert.equal(rows.filter((x) => x.row === 'merge').length, 1);
  assert.deepEqual(rows.filter((x) => x.event === 'measured').map((x) => x.cost_usd), ['unmeasured', 4.2]);
  git(['checkout', '-q', 'main'], { cwd: root });
});

test('the overhead report reads an attempt priced once a priced job row follows its unmeasured one; an attempt with only the unmeasured row stays unmeasured', async () => {
  const { overhead } = await import('../lib/metrics.mjs');
  const at = (m) => new Date(Date.UTC(2026, 10, 4, 12, m)).toISOString();
  const base = [{ module: 'alpha', row: 'attempt', event: 'start', attempt: 1, at: at(0) }];
  const un = { module: 'alpha', row: 'attempt', event: 'measured', role: 'job', attempt: 1, session: 'session_J', session_usd: 'unmeasured', cost_usd: 'unmeasured', at: at(5) };
  const pr = { module: 'alpha', row: 'attempt', event: 'measured', role: 'job', attempt: 1, session: 'session_J', session_usd: 4.2, cost_usd: 4.2, at: at(9) };
  const job = (rows) => overhead(rows).jobs.find((j) => j.module === 'alpha').job_usd;
  assert.equal(job([...base, un]), 'unmeasured');
  assert.equal(job([...base, un, pr]), 4.2);
});

// ===== file: cap.mjs =====

// job start <id> (not a restart, which replaces a session): the job cap, the account's job
// sessions working toward publish against the cap less the slots recorded holds keep (hold.mjs).
// A published job holds no slot unless its gate went red (PD-7, slots.mjs).
import { readHolds, slotsHeld } from './hold.mjs';
import { isArchived, liveJobIds, readSessions, sessionsCount } from './status.mjs';
import { fail, jobCap, loadConfig, repoSlug } from './util.mjs';
import { budgetGate } from './pace.mjs';
import { publishedJobs, slotNote, slotUse } from './slots.mjs';
import { flowRows, readOpenLayer } from './layerflow.mjs';

// The live count comes from evidence only (C28, the coordinator, 8 Nov: on the copy BOB's start
// script passed --live 20, a number it typed, and the check refused on the cap while 15 of 20
// slots were empty, 73 min of idle capacity on layer 11): the list_sessions result, counted by the
// sweep's rule (status.mjs jobCount), less the published jobs PD-7 frees. A bare --live is refused.
export const SESSIONS_NEEDED = 'job start <id> --sessions <file>: your list_sessions result saved as JSON (list_sessions, newest first, as status --role bob asks for it); the job cap is counted from it, never from a number typed (--live is not taken)';
export function capCheck(root, { live, sessions, io = {}, log = () => {} } = {}) {
  if (sessions === undefined || sessions === true) fail(live !== undefined ? `--live ${live === true ? '' : live} is not taken: ${SESSIONS_NEEDED}` : SESSIONS_NEEDED);
  const listed = readSessions(sessions, { root });
  if (live !== undefined) log(`--live ${live} ignored: the job sessions are counted from --sessions`);
  const n = sessionsCount(listed, undefined, () => {});
  const cfg = loadConfig(root);
  const { cap } = jobCap(cfg);
  let held = 0;
  // A slot just held counts (cold review of R17f): the holds read fresh.
  try { held = slotsHeld(readHolds(root, cfg.state_branch, { fresh: true })); } catch { held = 0; }
  // A new session is a GitHub-heavy act: none while GitHub's own count is at the target (PD-22, pace.mjs).
  const gate = budgetGate(root);
  if (gate) fail(`${gate}; nothing was started`);
  // The open layer's published jobs (PD-7): unread, every live session holds a slot, said.
  // Any error reading it is an unread layer, never a refused start (cold review of C26).
  let published = [];
  let view = null;
  try {
    view = io.view !== undefined ? io.view : (io.readView || readOpenLayer)(root, cfg, { io });
    published = publishedJobs(view, { slug: io.slug || repoSlug(root), ...(io.gate ? { gate: io.gate } : {}) });
  } catch (e) { log(`the open layer was not read (${String(e?.message || e).split('\n')[0]}): every live job session holds a slot`); published = []; }
  // Whose sessions are live: list_sessions's (a published job with no live session frees nothing),
  // and every job started since the list was read (cold review of C28: BOB lists once a wake and
  // runs each start line with the same file; without these, a burst of starts each saw the same
  // count and went past the cap). The list was read no earlier than its newest session's
  // created_at; a start row after that is a session it lacks. A start in a layer that is not open
  // (no view) is not seen: such starts take no layer flow.
  const jobIds = liveJobIds(listed);
  const since = startedSince(root, cfg.state_branch, view, listedAt(listed)).filter((id) => !jobIds.has(id));
  for (const id of since) jobIds.add(id);
  if (since.length) log(`${since.length} job(s) started since the list was read, counted: ${since.join(', ')}`);
  const u = slotUse(n + since.length, published, { jobIds });
  const note = slotNote(u);
  if (u.working >= cap - held) fail(`the job cap is full: ${u.working} job sessions working of the cap ${cap}${held ? ` less ${held} held` : ''} (${n + since.length} live${since.length ? `: ${n} listed, ${since.length} started since` : ''}${note ? `; ${note}` : ''}); nothing was started. Counted from --sessions${since.length ? ' and the start rows since' : ''}:\n${[...countedLines(listed, u), ...since.map((id) => `- (no session listed yet) job ${id}: started since the list was read, holds a slot`)].join('\n')}`);
