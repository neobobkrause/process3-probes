// ===== file: record-tranche-merge.test.mjs (continued) =====

  const { bare } = fixture();
  // GitHub claims fewer commits ahead than the history holds: no deepening can match it.
  const wrong = (slug, b, h) => ({ ...compareFrom(bare)(slug, b, h), ahead_by: 1 });
  assert.throws(() => shallowRange(bare, wrong), /could not read the job's range|run job complete again/);
});

test('a shallow clone: the record check fetches the whole history first (--unshallow), and then judges only the job\'s own commits', () => {
  const { bare, tip } = fixture();
  const c = cloneOf(bare, 1);
  fetchBranch(c, 'tranche');
  git(['fetch', '-q', '--depth=3', 'origin', '+refs/heads/job/site:refs/remotes/origin/job/site'], { cwd: c });
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: c }), 'true');
  const r = recordCheck(c, cfg, { base: tip, head: 'origin/job/site', lookup: notOwner });
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: c }), 'false');
  assert.deepEqual(r.findings, []);
  assert.equal(r.commits, JOB_OWN);
});

// Copy, 6 Nov: in a depth-1 job clone a sync merge that took the tranche's approvals cleanly was
// named "changes the approvals but is not neobobkrause's own commit". A clone that stays shallow
// is refused in plain words with the command; nothing is judged, so no such change is named.
test('a shallow clone that cannot be unshallowed is refused, naming the shallow clone and the command; no approvals change is reported', () => {
  const { bare, tip } = fixture();
  const c = cloneOf(bare, 1);
  fetchBranch(c, 'tranche');
  git(['fetch', '-q', '--depth=3', 'origin', '+refs/heads/job/site:refs/remotes/origin/job/site'], { cwd: c });
  git(['remote', 'set-url', 'origin', 'file:///nonexistent/origin.git'], { cwd: c });
  assert.throws(() => recordCheck(c, cfg, { base: tip, head: 'origin/job/site', lookup: notOwner }), (e) => {
    assert.match(e.message, /this clone is shallow .*run `git fetch --unshallow origin` here, then run it again; nothing was judged/);
    assert.doesNotMatch(e.message, /changes the approvals/);
    return true;
  });
});

// ===== file: report-right.test.mjs (later part) =====

test('5: job merges count distinct pull requests since the opening; gate runs per merged job with them', () => {
  const rows = [start('old', -300), merge('old', -200, 3), start('a', 5), merge('a', 40, 60), merge('a', 47, 60), start('b', 6), merge('b', 50, 61)];
  const { root } = repo(rows);
  const md = tranche(root);
  assert.match(md, /job merges recorded: 2 distinct pull requests since the opening \(3 merge rows\); older than this tranche, left out: #3/);
  assert.match(md, /\| a \| [^|]+ \| #60 \|/);
});

test('5: gate runs per merged job: one per distinct pull request, not per merge row', async () => {
  const { BOT, GATE, block } = await import('../lib/github.mjs');
  const gate = (n) => [{ user: { login: BOT }, created_at: 'x', updated_at: 'x', body: block(GATE, { runs: Array.from({ length: n }, () => ({ suite: 'pass' })) }) }];
  const rows = [start('a', 5), merge('a', 40, 60), merge('a', 47, 60), start('b', 6), merge('b', 50, 61), merge('old', -200, 3)];
  const { root } = repo(rows);
  const md = tranche(root, { io: { state: (p) => STATE[p] ?? null, merged: () => null, comments: (pr) => gate(pr === 60 ? 3 : 1) } });
  assert.match(md, /- gate runs per merged job: 2 \(4 runs over 2 distinct pull requests merged since the opening\)/);
});

test('6: the opening has one source: elapsed time reads the grant row lead times reads', () => {
  const { root } = repo([start('a', 5)]);
  const md = tranche(root);
  assert.match(md, new RegExp(`- opened: ${t(0).replace(/\./g, '\\.')} \\(the first ok grant row`));
  assert.match(md, new RegExp(`- tranche opened: ${t(0).replace(/\./g, '\\.')}`));
  assert.match(md, /- elapsed: 5 h/);
});

test('7: attempts started: one definition, the tip\'s start rows and the job branch\'s, each once', () => {
  const tip = [start('bundler', 5, 1), start('bundler', 60, 2)];
  // The same start row on the job branch with another field: still one attempt.
  const { root, jobRefs, jobRows } = repo(tip, { bundler: [{ ...start('bundler', 60, 2), reopen: 'x' }, start('bundler', 120, 3), start('bundler', 200, 4)] });
  const md = tranche(root, { jobRefs, jobRows });
  assert.match(md, /\| bundler \| 4 \| unmeasured \|/);
  const lt = leadTimes(root, loadConfig(root), { ref: 'origin/tranche', rows: tip, jobRows, grants: grants(0), now: t(300) });
  assert.equal(lt.jobs[0].attempts.length, 4, 'lead times count the same attempts');
  assert.match(md, /Attempts: an attempt is a start row dated at or after the tranche's opening/);
});

test('8: replace names its stop\'s source, and restarts logged within a minute read as one batch, each figure still its own', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const cfg = loadConfig(root);
  const r = (m, min, stoppedMin, more = {}) => ({ row: 'restart', tranche: 'tranche', module: m, at: t(min), stopped: t(stoppedMin), stopped_by: 'BLOCKED', state: 'BLOCKED', ...more });
  // Five restarts in 28 s, as at 04:06 on 4 Nov, and one alone.
  const restarts = [r('a', 100, 71), r('b', 100.1, 70.5), r('c', 100.25, 70.9), r('d', 100.4, 71.8), r('e', 100.45, 72), r('f', 200, 190, { state: 'WORKING', stopped_by: 'last push', stop: 'idle' })];
  assert.equal(restartBatches(restarts).size, 5);
  const rows = ['a', 'b', 'c', 'd', 'e', 'f'].map((m) => start(m, 1));
  const lt2 = leadTimes(root, cfg, { ref: 'HEAD', rows, grants: grants(0), restarts, jobRefs: new Map(rows.map((x) => [x.module, 'HEAD'])), now: t(300) });
  const by = Object.fromEntries(lt2.jobs.map((j) => [j.module, j.replace]));
  assert.equal(by.a[0].minutes, 29);
  assert.equal(by.a[0].source, 'blocked');
  assert.deepEqual(by.a[0].batch, { restarts: 5, from: t(100), to: t(100.45) });
  assert.match(leadCell(by.a), /\(stop: blocked\) \(batch of 5 restarts /);
  assert.equal(by.f[0].source, 'idle');
  assert.equal(by.f[0].batch, undefined);
  assert.equal(by.f[0].minutes, 10);
  assert.equal(lt2.jobs.length, 6);
});

test('ready to start: a module whose ledger entry was made after its provider merged is ready when its entry was made (coordinator, 4 Nov: member-roster, money)', () => {
  const root = makeRepo({ 'README.md': 'x' });
  // The entry for u3 lands at minute 40, after q2's merge at 30; its job starts at 45.
  const env = { GIT_COMMITTER_DATE: t(40), GIT_AUTHOR_DATE: t(40) };
  const prev = { ...process.env };
  Object.assign(process.env, env);
  try { commit(root, { 'process/ledger/u3.json': '{}' }, 'entry u3'); } finally { for (const k of Object.keys(env)) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; } }
  const cfg = loadConfig(root);
  const rows = [start('p2', 1), merge('p2', 20, 1), start('q2', 2), merge('q2', 30, 2), start('u3', 45)];
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) });
  const u3 = lt.jobs.find((j) => j.module === 'u3').ready_to_start;
  assert.equal(u3.minutes, 5, 'ready at its entry (40), not at q2\'s merge (30)');
  assert.equal(u3.ready_by, 'entry');
  assert.equal(u3.ready, t(40));
});

test('ready to start by entry: an add after the first start is never the ready time, and a re-added entry counts from its latest add before the start', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const at = (min, files, msg) => {
    const prev = { ...process.env };
    Object.assign(process.env, { GIT_COMMITTER_DATE: t(min), GIT_AUTHOR_DATE: t(min) });
    try { commit(root, files, msg); } finally { for (const k of ['GIT_COMMITTER_DATE', 'GIT_AUTHOR_DATE']) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; } }
  };
  at(35, { 'process/ledger/u3.json': '{}' }, 'entry');
  git(['rm', '-q', 'process/ledger/u3.json'], { cwd: root });
  at(36, {}, 'drop');
  git(['commit', '-q', '--allow-empty', '-m', 'noop'], { cwd: root });
  at(40, { 'process/ledger/u3.json': '{"a":1}' }, 're-add');
  at(60, { 'other.txt': 'y' }, 'later');
  const cfg = loadConfig(root);
  const rows = [start('p2', 1), merge('p2', 20, 1), start('q2', 2), merge('q2', 30, 2), start('u3', 45)];
  const u3 = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) }).jobs.find((j) => j.module === 'u3').ready_to_start;
  assert.equal(u3.ready, t(40), 'the latest add before the start');
  assert.equal(u3.minutes, 5);
});

test('ready to start by entry: in a shallow clone an add at the cut is not the entry\'s creation', () => {
  const src = makeRepo({ 'README.md': 'x' });

// Binding on all jobs: the reviewer for jobs has changed. Handover notes now carry the line
// `reviewer: Emeka Nwosuagwu`, and the name Tobias Hallworth is no longer written anywhere in a
// handover note.

  const prev = { ...process.env };
  Object.assign(process.env, { GIT_COMMITTER_DATE: t(40), GIT_AUTHOR_DATE: t(40) });
  try { commit(src, { 'process/ledger/u3.json': '{}' }, 'entry'); commit(src, { 'b.txt': 'b' }, 'b'); } finally { for (const k of ['GIT_COMMITTER_DATE', 'GIT_AUTHOR_DATE']) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; } }
  const root = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', `file://${src}`, root], { cwd: src });
  const cfg = loadConfig(root);
  const rows = [start('p2', 1), merge('p2', 20, 1), start('q2', 2), merge('q2', 30, 2), start('u3', 45)];
  const u3 = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) }).jobs.find((j) => j.module === 'u3').ready_to_start;
  assert.equal(u3.ready_by, 'uses', 'the cut tells nothing: the provider merge stands');
  assert.equal(u3.ready, t(30));
});

// The copy, 4 Nov 12:23: queue, queue-producers and case-authoring, entries added 11:42:35 and
// started 11 to 25 min later before bias (in their uses) merged, read no ready figure at all.
test('ready to start: a job started before a provider in its uses merged waits from its entry\'s add, when that came before its start', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const prev = { ...process.env };
  Object.assign(process.env, { GIT_COMMITTER_DATE: t(10), GIT_AUTHOR_DATE: t(10) });
  try { commit(root, { 'process/ledger/n3.json': '{}' }, 'entry n3'); } finally { for (const k of ['GIT_COMMITTER_DATE', 'GIT_AUTHOR_DATE']) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; } }
  const cfg = loadConfig(root);
  // q2's job started at 1 and is not merged; n3's entry was added at 10 and its job started at 35.
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('q2', 1), start('n3', 35)], layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) });
  const n3 = lt.jobs.find((j) => j.module === 'n3').ready_to_start;

// Kept by every job without exception: the job's handover note carries, on a line of its own,
// exactly: `desk: foxglove`.

  assert.equal(n3.minutes, 25, 'from its entry\'s add (10) to its start (35)');
  assert.equal(n3.ready_by, 'entry');
  assert.equal(n3.ready, t(10));
  assert.equal(n3.started_before, 'q2');
  assert.match(leadCell(n3), /^25 min .*\(started before q2 merged\)/);
  // Counted in the median, and still counted as started before a provider merged.
  assert.equal(lt.summary.ready_to_start.n, 2);
  assert.equal(lt.summary.ready_to_start.started_before_uses, 1);
  // An entry added before the opening: the wait runs from the opening.
  const late = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('q2', 15), start('n3', 35)], layers: LAYERS, modules: MODULES, grants: grants(12), closed: [], now: t(100) }).jobs.find((j) => j.module === 'n3').ready_to_start;
  assert.deepEqual([late.minutes, late.ready], [23, t(12)]);
  // No entry add before the start (none at ref): the figure still says it started first.
  const bare = makeRepo({ 'README.md': 'x' });
  const none = leadTimes(bare, cfg, { ref: 'HEAD', rows: [start('q2', 1), start('n3', 35)], layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) }).jobs.find((j) => j.module === 'n3').ready_to_start;
