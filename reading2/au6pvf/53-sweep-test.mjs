  assert.match(t.prompt, new RegExp(`sweep --session ${R} --sessions`));
  assert.equal(t.call.cron_expression, '0 * * * *');
  const p = rootPrompt({ slug: 'o/p', approvals: 'b'.repeat(64) });
  for (const x of ['sweep task --session', 'start watcher', 'start record watcher', 'persistent_session_id', 'sweep --session']) assert.ok(p.includes(x), x);
  // ROOT's one task edit (4 Nov: a pin changed what sweep task prints, and only the owning
  // session may edit its task): its own sweep task's prompt, to what sweep task prints, nothing else.
  assert.ok(p.includes('your hourly sweep task is the prompt `node .process/tool/p3.mjs sweep task --session <your id>` prints: if list_triggers shows none bound to you, create it (create_trigger, no persistent_session_id); if its prompt differs, update_trigger only its prompt, to that; never fire it'));
  assert.ok(p.includes("edit no task but your sweep task's prompt") && !p.includes('edit no task,'));
  assert.ok(t.prompt.includes("edit no task but this one's prompt as your ROOT prompt allows"));
  assert.ok(Buffer.byteLength(p) <= 4096, `${Buffer.byteLength(p)} bytes`);
});

test('sweep step 3: a WORKING job that pushed and then stopped past SILENT_HOURS wakes BOB; one that pushed lately does not', () => {
  const root = withOrigin({
    'process/ledger/stale.json': entry('stale', { status: { state: 'WORKING' } }),
    'process/ledger/fresh.json': entry('fresh', { status: { state: 'WORKING' } }),
  });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  for (const [id, at] of [['stale', new Date(Date.now() - 3 * 36e5).toISOString()], ['fresh', new Date().toISOString()]]) {
    git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
    commit(root, { [`src/${id}/a.js`]: '1' }, 'start');
    process.env.GIT_COMMITTER_DATE = at;
    try { commit(root, { [`src/${id}/a.js`]: '2' }, 'work in progress'); } finally { delete process.env.GIT_COMMITTER_DATE; }
    git(['push', '-q', 'origin', `job/${id}`], { cwd: root });
    git(['checkout', '-q', 'tranche'], { cwd: root });
  }
  git(['fetch', '-q', 'origin'], { cwd: root });
  const r = run(root);
  assert.ok(r.found.includes('stale: WORKING, no push for 3h'), r.found.join('|'));
  assert.ok(!r.found.some((f) => f.startsWith('fresh')), r.found.join('|'));
  assert.equal(r.todo.length, 1);
  assert.match(r.todo[0], /stale: WORKING, no push for 3h/);
});

test('sweep row: BOB\'s idle time is recorded when status lists acts for it, and not otherwise', () => {
  const root = withOrigin({ 'process/ledger/m1.json': entry('m1', { status: { state: 'BLOCKED', reason: 'x' } }) });
  recordStart(root, 'root', R, { log: quiet });
  run(root);
  recordStart(root, 'bob', B, { log: quiet });
  run(root);
  const rows = readState(root, 'process-state', SWEEP_ROWS_FILE).trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(rows.map((r) => [r.row, r.session, r.bob_acts]), [['sweep', R, 'unmeasured'], ['sweep', R, true]]);
  assert.equal(typeof rows[1].bob_quiet_h, 'number');
  const quietRoot = withOrigin();
  recordStart(quietRoot, 'root', R, { log: quiet });
  recordStart(quietRoot, 'bob', B, { log: quiet });
  run(quietRoot);
  const q = JSON.parse(readState(quietRoot, 'process-state', SWEEP_ROWS_FILE));
  assert.deepEqual([q.bob_acts, q.bob_quiet_h], [false, null]);
});

// Review of PR 68: a triage owed is an act for BOB, so the sweep counts it.
test('sweep row: an untriaged provider notice alone is an act for BOB', () => {
  const root = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  writeState(root, 'process-state', 'notice', (wt) => {
    mkdirSync(join(wt, 'notices'), { recursive: true });
    writeFileSync(join(wt, 'notices/p-7.json'), JSON.stringify({ row: 'notice', key: 'p:7', provider: 'p', ids: ['R1'], pr: 7, users: ['u1'] }) + '\n');
    return {};
  });
  run(root);
  assert.equal(JSON.parse(readState(root, 'process-state', SWEEP_ROWS_FILE)).bob_acts, true);
});

// Coordinator, 4 Nov (from PR 69's report): a layer ready to close lists no next work, so the
// sweep, the backstop, missed it; and a bad open_by made nextWork throw inside the sweep.
test('sweep: a layer the train called ready to close says nothing offline; a bad open_by is a finding and the heartbeat is still written', () => {
  const layers = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n| 2 | next | d |\n';
  const root = withOrigin({
    'build/layers.md': layers,
    'build/requirements/a.md': '- **R1** *(not yet met: x)* y\n',
    'build/requirements/d.md': '- **R1** *(not yet met: x)* y\n',
    'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }),
  });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const s = run(root);
  // Offline the open layer is unread: no train-era close line, and no wake for it (layer merge is read online).
  assert.doesNotMatch(s.found.join('; '), /ready to close/);
  assert.equal(s.todo.length, 0, s.todo.join('\n'));

  const bad = withOrigin({ 'process/config.json': { tranche: 'tranche', open_by: 'bogus' }, 'build/layers.md': layers, 'build/requirements/a.md': '- **R1** *(not yet met: x)* y\n', 'build/requirements/d.md': '- **R1** *(not yet met: x)* y\n' });
  recordStart(bad, 'root', R, { log: quiet });
  recordStart(bad, 'bob', B, { log: quiet });
  const b = run(bad);
  assert.match(b.found.join('; '), /config: open_by "bogus" in process\/config\.json is not one of/);
  assert.match(beat(bad).found.join('; '), /config: open_by "bogus"/);
});

// Prompt refresh (measured 4 Nov 00:05: a ROOT ran on its starting prompt after the pin moved).
test('start check --wake prompt refresh: an old prompt hash at a new pin prints the new prompt once, then records it', () => {
  const root = withOrigin();
  const out = [];
  const pr = (o = {}) => { out.length = 0; return promptRefresh(root, { pin: 'f'.repeat(40), log: (...l) => out.push(l.join(' ')), ...o }); };
  recordStart(root, 'root', R, { log: quiet });
  assert.match(readAddress(root).root.prompt.hash, /^[0-9a-f]{64}$/, 'start record stores the prompt hash');
  assert.equal(pr({ session: R }).act, 'same');
  // An old prompt: the hash this pin's prompt no longer has.
  const sb = 'process-state';
  writeState(root, sb, 'old prompt', (d) => writeFileSync(join(d, 'addresses/root.json'), JSON.stringify({ session: R, at: OLD, prompt: { hash: '0'.repeat(64) } }) + '\n'));
  const r = pr({ session: R });
  assert.equal(r.act, 'changed');
  const text = out.join('\n');
  assert.match(text, new RegExp(`^prompt changed at ${'f'.repeat(40)}: read the new prompt below and act by it`));
  assert.ok(text.includes('# ROOT\n') && text.includes('## Acts you may take'), 'the new prompt itself');
  assert.ok(Buffer.byteLength(r.prompt) <= 4096, 'within its cap');
  assert.match(text, /fresh ROOT: send the coordinator one message asking for ROOT's handover/);
  assert.equal(readAddress(root).root.at, OLD, 'the address keeps its time');
  assert.equal(pr({ session: R }).act, 'same', 'delivered once');
  // A ROOT started before prompt records: its first wake delivers the prompt.
  writeState(root, sb, 'no record', (d) => writeFileSync(join(d, 'addresses/root.json'), JSON.stringify({ session: R, at: OLD }) + '\n'));
  const old = process.env.CLAUDE_CODE_REMOTE_SESSION_ID;
  process.env.CLAUDE_CODE_REMOTE_SESSION_ID = R.replace(/^session_/, 'cse_');
  try { assert.equal(pr().act, 'changed', 'the session found from the container'); } finally { if (old === undefined) delete process.env.CLAUDE_CODE_REMOTE_SESSION_ID; else process.env.CLAUDE_CODE_REMOTE_SESSION_ID = old; }
  // BOB by handover keeps its old BOB in the prompt it compares; a job holds no address.
  recordStart(root, 'bob', B, { log: quiet });
  handoverConfirm(root, 'session_bob2', { log: quiet });
  assert.equal(readAddress(root).bob.prompt.old_bob, B);
  assert.equal(pr({ session: 'session_bob2' }).act, 'same');
  writeState(root, sb, 'old bob prompt', (d) => writeFileSync(join(d, 'addresses/bob.json'), JSON.stringify({ session: 'session_bob2', at: OLD, prompt: { hash: '1'.repeat(64), old_bob: B } }) + '\n'));
  const b = pr({ session: 'session_bob2' });
  assert.ok(b.prompt.includes(`You replace BOB \`${B}\``));
  assert.match(out.join('\n'), /fresh BOB: send ROOT one message asking for your handover \(`handover begin`\)/);
  assert.equal(pr({ session: 'session_job1' }).act, 'none');
  // A watcher that takes over as ROOT still runs on the watcher's prompt: its first wake as ROOT delivers ROOT's.
  recordStart(root, 'watcher', W, { log: quiet });
  recordStart(root, 'root', W, { log: quiet });
  assert.equal(readAddress(root).root.prompt, undefined, 'no prompt record on a takeover');
  const t = pr({ session: W });
  assert.equal(t.role, 'root');
  assert.equal(t.act, 'changed');
  assert.ok(t.prompt.startsWith('# ROOT'));
  assert.equal(pr({ session: W }).act, 'same');
});

test('sweep: a merged job\'s branch, BLOCKED when last fetched, is not listed BLOCKED (ROOT, 4 Nov)', () => {
  // job/m was BLOCKED, then its job went on and merged: the tranche holds every commit of the
  // branch and its entry is COMPLETE. A COMPLETE entry's branch is not fetched again, so the local
  // ref still shows the BLOCKED tip; instance-setup and wizard-scripts were listed so every hour.
  const root = withOrigin({ 'process/ledger/m.json': entry('m', { status: { state: 'WORKING' } }) });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  git(['checkout', '-q', '-b', 'job/m'], { cwd: root });
  commit(root, { 'process/ledger/m.json': entry('m', { status: { state: 'BLOCKED', reason: 'waits on x' } }) });
  git(['push', '-q', 'origin', 'job/m'], { cwd: root });
  git(['fetch', '-q', 'origin', 'job/m'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // Before it merges, the branch's BLOCKED is listed.
  assert.match(run(root).found.join('|'), /m: BLOCKED/);
  git(['merge', '-q', '--no-ff', '-m', 'Merge job PR 9', 'job/m'], { cwd: root });
  commit(root, { 'process/ledger/m.json': entry('m', { status: { state: 'COMPLETE' } }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const r = run(root);
  assert.doesNotMatch(r.found.join('|'), /m: BLOCKED/);
  // Its branch is still read (owedNotices reads a merged attempt's start row through it): no flag, no blocked.
  const row = status(root, { offline: true, log: quiet }).rows.find((x) => x.id === 'm');
  assert.deepEqual([row.branch, row.ahead, row.flag, row.blocked], ['BLOCKED (waits on x)', 0, undefined, undefined]);
  // A branch with work the tranche lacks still raises its flag, COMPLETE entry or not.
  git(['checkout', '-q', 'job/m'], { cwd: root });
  commit(root, { 'm.txt': 'a reopened attempt' });
  git(['push', '-q', 'origin', 'job/m'], { cwd: root });
  git(['fetch', '-q', 'origin', 'job/m'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  assert.match(run(root).found.join('|'), /m: BLOCKED/);
});

// C37 (copy, 8 Nov): inquiry landed COMPLETE on layer 12 (PR 1028, job/inquiry-2), and ROOT's sweep
// still listed it BLOCKED from job/inquiry, PR 617's R31 block of 6 Nov, closed unmerged. A module
// COMPLETE on the tranche with no open PR has no job ref fetched, and a layer land never puts the
// branch in the tranche: a job branch whose tip is older than the module's newest land is stale.
test('sweep: a job branch BLOCKED before the module\'s later layer land is stale, not listed BLOCKED (C37)', () => {
  const root = withOrigin({ 'process/ledger/m.json': entry('m', { status: { state: 'COMPLETE' } }) });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  git(['checkout', '-q', '-b', 'job/m'], { cwd: root });
  commit(root, { 'process/ledger/m.json': entry('m', { status: { state: 'BLOCKED', reason: 'R31 waits on an element' } }), 'm.txt': 'an attempt closed unmerged' });
  git(['push', '-q', 'origin', 'job/m'], { cwd: root });
  git(['fetch', '-q', 'origin', 'job/m'], { cwd: root });
