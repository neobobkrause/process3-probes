// ===== file: status.test.mjs (continued) =====

  openPassed(closed);
  const owes = [];
  assert.deepEqual(status(closed, { role: 'bob', offline: true, log: (m) => owes.push(m) }).next, []);
  assert.doesNotMatch(owes.join('\n'), /ready to close|layer close/);
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: closed });
  assert.deepEqual(status(closed, { role: 'bob', offline: true, log: quiet }).next.map((x) => x.file), ['build/requirements/d.md']);
  assert.throws(() => status(root, { role: 'bob', offline: true, live: 'x', log: quiet }), /--live/);
});

test('status --role bob: a paused or stopped plan says take no new step first and lists no next work', () => {
  const root = makeRepo({ 'process/config.json': { plan: 'stop' }, 'build/requirements/m.md': unmet(1) });
  const out = [];
  assert.deepEqual(status(root, { role: 'bob', offline: true, log: (m) => out.push(m) }).next, []);
  assert.equal(out[0], 'plan stop: take no new step');
  assert.doesNotMatch(out.join('\n'), /next work/);
});

test('status --role bob: a job\'s report to bob is listed until a later message from bob names its id', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const msgs = (rows) => rows.map((r) => JSON.stringify({ row: 'sent', ...r })).join('\n') + '\n';
  const state = (files) => {
    git(['checkout', '-q', '--orphan', 's'], { cwd: root });
    git(['rm', '-rqf', '.'], { cwd: root });
    commit(root, files);
    git(['update-ref', 'refs/remotes/origin/process-state', 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
    git(['branch', '-D', 's'], { cwd: root });
  };
  state({
    'messages/job-m1.jsonl': msgs([{ at: '2026-11-03T10:00:00Z', n: 1, to: 'bob', text: 'done' }, { at: '2026-11-03T11:00:00Z', n: 2, to: 'bob', text: 'blocked' }, { at: '2026-11-03T11:10:00Z', n: 3, to: 'bob', text: 'job m1 BLOCKED: run status' }, { at: new Date(Date.now() - 5 * 6e4).toISOString(), n: 4, to: 'bob', text: 'which name?' }]),
    'messages/root.jsonl': msgs([{ at: '2026-11-03T10:00:00Z', n: 1, to: 'bob', text: 'Sweep' }]),
    'messages/bob.jsonl': msgs([{ at: '2026-11-03T10:30:00Z', n: 1, to: 'root', text: 'routed job-m1-1 and job-m1-20' }]),
  });
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /reports to route[^\n]*\n- job-m1-2: blocked/);
  assert.doesNotMatch(text.split('reports to route')[1], /job-m1-3/, 'a wake asks BOB to run status; it routes nothing');
  // Bob, 4 Nov: a report unanswered past decision_minutes (30) is listed, ahead of next work; a
  // fresh one is not.
  assert.match(text, /\nunanswered job-m1-2 \d+m \(target 30\)\n/);
  assert.doesNotMatch(text, /unanswered job-m1-4/);
  assert.ok(text.indexOf('unanswered job-m1-2') < (text.indexOf('next work') === -1 ? Infinity : text.indexOf('next work')));
  assert.doesNotMatch(text, /job-m1-1:|root-1:/);
});

test('status --role bob: next work stops at the job cap', (t) => {
  setJobCap(t, 1);
  const full = makeRepo({
    'build/requirements/small.md': unmet(2),
    'process/ledger/busy.json': entry('busy'),
  });
  openPassed(full);
  const shown = [];
  assert.equal(status(full, { role: 'bob', offline: true, live: 1, log: (m) => shown.push(m) }).next.length, 1);
  assert.match(shown.join('\n'), /0 listed \(jobs 1 of 1\), 1 wait/);
});

// A job branch two commits past the tranche, its tip committed at `at`, the entry WORKING on it.
function pushedJob(root, id, at) {
  git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
  commit(root, { [`src/${id}/a.js`]: '1' }, 'start');
  const old = process.env.GIT_COMMITTER_DATE;
  process.env.GIT_COMMITTER_DATE = at;
  try { commit(root, { [`src/${id}/a.js`]: '2' }, 'work in progress'); } finally { if (old === undefined) delete process.env.GIT_COMMITTER_DATE; else process.env.GIT_COMMITTER_DATE = old; }
  git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
}

test('status: a WORKING job that pushed and then went quiet past SILENT_HOURS is flagged with the restart as BOB\'s act; a fresh one is not', () => {
  const root = makeRepo({ 'process/ledger/stale.json': entry('stale', { status: { state: 'WORKING' } }), 'process/ledger/fresh.json': entry('fresh', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  pushedJob(root, 'stale', new Date(Date.now() - 5 * 36e5).toISOString());
  pushedJob(root, 'fresh', new Date().toISOString());
  const { rows } = status(root, { offline: true, log: quiet });
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(by.stale.ahead, 2);
  assert.match(by.stale.flag, /^WORKING, no push for 5h; BOB's act: node \.process\/tool\/p3\.mjs job start stale --restart "<why>"$/);
  assert.equal(by.fresh.flag, undefined);
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /idle:\n- stale: WORKING;.*; WORKING, no push for 5h; BOB's act: .* job start stale --restart "<why>"\nopen:\n- fresh: WORKING; PR unknown \(GitHub not read\), last activity unknown\n/);
});

// Copy, 4 Nov: file-safety was flagged "WORKING, nothing pushed" 7 minutes after its start commit,
// while the flag for a job that pushed and went quiet waits SILENT_HOURS. Both wait now.
test('status: a WORKING job with only its start commit is flagged nothing pushed past SILENT_HOURS, not when fresh', () => {
  const root = makeRepo({ 'process/ledger/old.json': entry('old', { status: { state: 'WORKING' } }), 'process/ledger/new.json': entry('new', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  for (const [id, at] of [['old', new Date(Date.now() - 5 * 36e5).toISOString()], ['new', new Date().toISOString()]]) {
    git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
    const old = process.env.GIT_COMMITTER_DATE;
    process.env.GIT_COMMITTER_DATE = at;
    try { commit(root, { [`src/${id}/a.js`]: '1' }, 'job start'); } finally { if (old === undefined) delete process.env.GIT_COMMITTER_DATE; else process.env.GIT_COMMITTER_DATE = old; }
    git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
  }
  const by = Object.fromEntries(status(root, { offline: true, log: quiet }).rows.map((r) => [r.id, r]));
  assert.deepEqual([by.old.ahead, by.old.flag], [1, 'WORKING, nothing pushed']);
  assert.deepEqual([by.new.ahead, by.new.flag], [1, undefined]);
});

// Review of PR 114: a restarted COMPLETE module, its fresh start commit unflagged and GitHub unread, is not merged.
test('layerState: a COMPLETE module with a fresh WORKING start ahead on its branch is not counted merged', () => {
  const root = makeRepo({ 'build/layers.md': '| 1 | a |\n', 'build/requirements/a.md': '# a\n' });
  const row = (ahead) => [{ id: 'a', tranche: 'COMPLETE', branch: 'WORKING', ahead, pr: 'unknown (GitHub not read)' }];
  const merged = (ahead) => layerState(root, loadConfig(root), row(ahead), null, { closed: [] }).layers[0].mods[0].merged;
  assert.deepEqual([merged(1), merged(0)], [false, true]);
});

// --sessions (measured 3-4 Nov: a stopped job was flagged only after two hours with no push): BOB's
// own list_sessions JSON; a job whose session is archived, or idle with no push for
// targets.replace_minutes, is flagged with the restart; a running one, or none given, is not.
test('status --role bob --sessions: job session gone and job idle 30m are flagged with the restart; without --sessions the two-hour rule stands', () => {
  const ids = ['gone', 'quiet', 'busy', 'fresh', 'unlisted'];
  const root = makeRepo(Object.fromEntries(ids.map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'WORKING' } })])));
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const ago = (m) => new Date(Date.now() - m * 6e4).toISOString();
  for (const id of ['gone', 'quiet', 'busy', 'unlisted']) pushedJob(root, id, ago(45));
  pushedJob(root, 'fresh', ago(5));
  const prs = ids.map((id, i) => ({ number: 10 + i, head: { ref: `job/${id}`, sha: 'x' }, draft: true, updated_at: ago(45) }));
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 'sessions.json');
  writeFileSync(file, JSON.stringify({ data: [
    { id: 'session_old', title: 'job gone', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed', updated_at: ago(300) },
    { id: 'session_g', title: 'job gone (restart)', session_status: 'SESSION_STATUS_ARCHIVED', status_bucket: 'completed', updated_at: ago(60) },
    { id: 'session_q', title: 'job quiet', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'review_ready', updated_at: ago(90) },
    { id: 'session_b', title: 'job busy', session_status: 'SESSION_STATUS_RUNNING', status_bucket: 'working', updated_at: ago(90) },
    { id: 'session_f', title: 'job fresh', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed', updated_at: ago(90) },
  ] }));
  const io = { openPRs: () => prs, checkRun: () => null, compare: () => null, prFiles: () => [] };
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    const out = [];
    const r = status(root, { role: 'bob', sessions: file, log: (m) => out.push(m), io });
    const by = Object.fromEntries(r.rows.map((x) => [x.id, x.flag]));
    assert.equal(by.gone, 'job session gone (session_g archived); BOB\'s act: node .process/tool/p3.mjs job start gone --restart "<why>"');
    assert.match(by.quiet, /^job idle 30m \(session_q idle, no push for 4[56]m\); BOB's act: node \.process\/tool\/p3\.mjs job start quiet --restart "<why>"$/);
    assert.equal(by.busy, undefined, 'a running session is not flagged');
    assert.equal(by.fresh, undefined, 'an idle session that pushed 5 minutes ago is not flagged');
    assert.equal(by.unlisted, undefined, 'no session listed: the two-hour rule, not yet reached');
    assert.match(out.join('\n'), /owed:\n(- .*\n)*- gone: WORKING; PR #10 draft.*job session gone/);
    const late = status(root, { role: 'bob', log: quiet, io, sessions: undefined });
    assert.ok(late.rows.every((x) => x.flag === undefined), 'without --sessions, nothing at 45 minutes');
  } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
});

test('status --sessions: replace_minutes from targets in config; an unreadable file is refused', () => {
  const root = makeRepo({ 'process/config.json': { targets: { replace_minutes: 60 } }, 'process/ledger/quiet.json': entry('quiet', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  pushedJob(root, 'quiet', new Date(Date.now() - 45 * 6e4).toISOString());
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  writeFileSync(file, JSON.stringify([{ id: 'session_q', title: 'job quiet', session_status: 'SESSION_STATUS_IDLE' }]));
  const io = { openPRs: () => [{ number: 3, head: { ref: 'job/quiet', sha: 'x' }, draft: true }], checkRun: () => null, compare: () => null, prFiles: () => [] };
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    assert.equal(status(root, { sessions: file, log: quiet, io }).rows[0].flag, undefined, '45 minutes is under a replace_minutes of 60');
    writeFileSync(file, 'not json');
    assert.throws(() => status(root, { sessions: file, log: quiet, io }), /--sessions .*not a readable JSON file/);
  } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
});

test('status --role bob: a requirement file over requirements_cap is a split owed, not startable work (REQ-6)', () => {
