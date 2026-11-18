// ===== file: report.mjs (continued) =====


  // Lead times
  // A close whose commit cannot be placed is passed undecided: its figure reads unmeasured.
  const undecidedRows = mine.filter((x) => x.in === null && !closedBy.has(x.r.layer)).map((x) => ({ ...x.r, undecided: true }));
  const lt = leadTimes(root, cfg, { ref: tip, rows, jobRows, layers, now, jobRefs, sweeps, comments: (pr) => gateRuns(read.comments(pr) || []), ...(stateRead ? { ...leadIn, closed: [...closedBy.values(), ...undecidedRows] } : {}) });
  L.push('## Lead times', '', `Minutes, each beside its target (\`targets\` in process/config.json); "over" marks one past it. ${lt.rule}`, '');
  L.push(`- tranche opened: ${lt.opened}`, '');
  L.push(...(!Array.isArray(lt.jobs) ? [`Per job: ${U} (the tranche's opening not read).`] : lt.jobs.length ? table(['job', 'ready to start', 'start to PR ready', 'green to merge', 'blocked', 'replace', 'report wait'], lt.jobs.map((j) => [j.module, leadCell(j.ready_to_start), leadCell(j.start_to_pr_ready), leadCell(j.green_to_merge), leadCell(j.blocked), leadCell(j.replace), leadCell(j.report_wait)])) : ['No job has a start row since the opening.']), '');
  L.push(`- layer close to next job start: ${Array.isArray(lt.close_to_next_start) ? (lt.close_to_next_start.length ? lt.close_to_next_start.map((c) => `layer ${c.layer} ${leadCell(c)}`).join('; ') : 'no layer closed') : U}`);
  for (const [k, v] of Object.entries(lt.summary)) L.push(`- ${k.replace(/_/g, ' ')}: ${leadSummaryCell(v)}`);
  L.push('');

  // Phase 3 overhead comparisons
  // Attempts by the one definition lead times and metrics report use (ATTEMPTS_RULE).
  const started = attemptsStarted(here || []);
  const jobs = [...started.keys()].sort();
  const sess = (m) => { const ss = new Set(measured.filter((r) => r.module === m && (r.role || 'job') === 'job' && r.session).map((r) => r.session)); return ss.size || U; };
  const perJob = jobs.map((m) => [m, started.get(m), sess(m)]);
  const known = perJob.filter((r) => typeof r[2] === 'number');
  const gates = mergeRows.map((r) => { try { return gateRuns(read.comments(r.pr) || []).length; } catch { return U; } });
  const gatesOk = gates.length && gates.every((g) => typeof g === 'number');
  const rec = recordOnly(root, cfg, s.base, s.close ? null : 'origin/main', tip, deepened);
  L.push('## Phase 3 overhead comparisons', '');
  L.push(`- sessions per job: ${known.length === jobs.length && jobs.length ? Math.round(known.reduce((t, r) => t + r[2], 0) / jobs.length * 100) / 100 : U}${known.length && known.length < jobs.length ? ` (${known.length} of ${jobs.length} jobs measured: ${Math.round(known.reduce((t, r) => t + r[2], 0) / known.length * 100) / 100})` : ''}`);
  L.push(`- gate runs per merged job: ${gatesOk ? Math.round(gates.reduce((t, g) => t + g, 0) / gates.length * 100) / 100 : U}${gatesOk ? ` (${gates.reduce((t, g) => t + g, 0)} runs over ${gates.length} distinct pull requests merged since the opening)` : ''}`);
  L.push(`- record-only commits: ${typeof rec === 'object' ? `${rec.record} of ${rec.total} commits in the tranche` : U}`, '');
  L.push(`Attempts: ${ATTEMPTS_RULE}.`, '');
  if (perJob.length) L.push(...table(['job', 'attempts started', 'job sessions measured'], perJob), '');
  else if (!opened) L.push(`Per job: ${U} (the tranche's opening not read).`, '');

  // Base-red (basered.mjs): failures a job's gate tolerated because the tranche had them too.
  // Merged green, they are still owed: the tranche into main runs them again.
  L.push('## Base-red tests owed', '', 'Failing tests a merged job\'s gate tolerated because they failed at the tranche tip it merged into too. The tranche into main runs them again with no tolerance.', '');
  const owed = baseRedOwed(mergeRows, (pr) => gateRuns(read.comments(pr) || []));
  L.push(...(owed === null ? [U] : owed.length ? table(['job', 'PR', 'test', 'base'], owed.map((o) => [o.module, `#${o.pr}`, o.test, String(o.base).slice(0, 10)])) : ['None.']), '');
  return L.join('\n');
}

// The report's provider-notice section from noticeSlots' result (null: the state branch unread).
const KIND = { triage: 'triage owed', affected: 'judged affected: notice work', job: 'named by its open job', rerun: 'merged job named it, answer not recorded' };
export function noticeSection(slots) {
  const L = ['## Provider notices', ''];
  if (!slots) return [...L, `Open notice slots: ${U} (the state branch's notices not read).`];
  const keys = [...new Set(slots.slots.map((x) => x.key))];
  const by = (k) => slots.slots.filter((x) => x.kind === k).length;
  const wSlots = slots.withdrawn.reduce((t, w) => t + w.closed, 0);
  L.push(`Open notice slots (one notice, one user module, unanswered): ${slots.slots.length} across ${keys.length} notices; ${Object.entries(KIND).map(([k, w]) => `${w} ${by(k)}`).join(', ')}.`);
  L.push(`Withdrawn (closed, owing nothing; never counted open): ${slots.withdrawn.length} notices${slots.withdrawn.length ? `, ${wSlots} unanswered slots closed by withdrawal (${slots.withdrawn.map((w) => `${w.key} ${w.closed}`).join(', ')})` : ''}.`, '');
  if (!slots.slots.length) return [...L, 'No open slot.'];
  // One row per notice and act: a notice's untriaged modules share one `notice triage`.
  const rows = new Map();
  for (const x of slots.slots) {
    const k = `${x.key}\0${x.kind}\0${x.act}`;
    const r = rows.get(k) || { key: x.key, kind: x.kind, act: x.act, users: [] };
    r.users.push(x.user);
    rows.set(k, r);
  }
  return [...L, ...table(['notice', 'open slots', 'state', 'modules', 'closed by'], [...rows.values()].map((r) => [r.key, r.users.length, KIND[r.kind], r.users.length > 6 ? `${r.users.slice(0, 6).join(', ')} and ${r.users.length - 6} more` : r.users.join(', '), `\`${r.act}\``]))];
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
