});

// The route for work found elsewhere (coordinator, 4 Nov): BOB's plain pull request adding the
// walk's found marks was refused, "changes module files, which go through a job", since a job owns
// its requirement file (PR 46). A diff to it that only adds new unmet found-mark lines merges plain.
function foundRepo(after) {
  const BASE = '# Alpha\n\n- **R1** *(not yet met: x)* one\n- **R2** met\n- **F1** *(not yet met: walk p3dev-l1)* old finding\n';
  const root = makeRepo({
    'README.md': 'x', '.github/workflows/process-gate.yml': 'on: pull_request\n', 'process/config.json': {},
    'process/ledger/alpha.json': entry('alpha', { paths: ['src/alpha/', 'req/alpha.md'] }), 'req/alpha.md': BASE,
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'found/alpha-f2', 'tranche'], { cwd: root });
  const sha = commit(root, { 'req/alpha.md': after(BASE) });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche', 'found/alpha-f2'], { cwd: root });
  return { root, sha, head: 'found/alpha-f2' };
}

test('merge --plain: a requirement file a job owns takes only added new unmet found marks; any other edit goes through a job', () => {
  const F2 = '- **F2** *(not yet met: walk p3dev-l1)* founder sign-in answers HTTP 200 without a session\n';
  const F3 = '- **F3** *(not yet met: deploy p3dev-l1)* ROLLOUT NOT CONFIRMED on agent-runner\n';
  // Only added F lines: merges plain.
  for (const add of [F2, F2 + F3]) {
    const ok = foundRepo((b) => b + add);
    const f = plainIO(ok);
    assert.equal(mergePlain(ok.root, 7, { ...q, noReview: 'work found elsewhere: found marks only', io: f.io }).merged, true);
    assert.equal(f.calls.merged.sha, ok.sha);
  }
  const refused = (after, why) => {
    const r = foundRepo(after);
    const f = plainIO(r);
    assert.throws(() => mergePlain(r.root, 7, { ...q, noReview: 'x', io: f.io }), new RegExp(`changes module files, which go through a job: req/alpha\\.md \\(alpha\\); a plain pull request may only add new unmet found marks to a requirement file \\(req/alpha\\.md: ${why}`));
    assert.equal(f.calls.merged, null);
  };
  // An added F line plus any other edit: refused.
  refused((b) => b.replace('one', 'one, reworded') + F2, 'it removes or changes a line');
  refused((b) => b + '\n## Found work\n' + F2, 'it adds a line that is not one unmet found mark');
  refused((b) => b + '## Found work\n' + F2, 'it adds a line that is not one unmet found mark: ## Found work');
  // An added R mark: refused.
  refused((b) => b + '- **R3** *(not yet met: walk p3dev-l1)* new\n', 'it adds a line that is not one unmet found mark: - \\*\\*R3\\*\\*');
  // A removed line: refused, and striking a found mark is a job's.
  refused((b) => b.replace('- **R2** met\n', ''), 'it removes or changes a line');
  refused((b) => b.replace('*(not yet met: walk p3dev-l1)* old', 'old'), 'it removes or changes a line');
  // An F line that is met, reuses a number, or hides another mark: refused.
  refused((b) => b + '- **F2** met already\n', 'it adds a line that is not one unmet found mark');
  refused((b) => b + '- **F1** *(not yet met: walk p3dev-l1)* again\n', 'it adds F1, which the file already has');
  refused((b) => b + '- **F2** *(not yet met: x)* see **R1**\n', 'it adds a line that is not one unmet found mark');
  // A content line that looks like a diff header ("-- x" removed, "++ x" added) is a change too.
  refused((b) => b.replace('- **R2** met', '-- R2 met') + F2, 'it removes or changes a line');
  refused((b) => b + '++ sneaky line\n' + F2, 'it adds a line that is not one unmet found mark: \\+\\+ sneaky');
  // The header of a diff with no hunk is no change of lines: refused.
  assert.equal(foundOnly('diff --git a/x b/x\nold mode 100644\nnew mode 100755\n', '').ok, false);
  // Module code beside the found marks still goes through a job.
  const both = foundRepo((b) => b + F2);
  git(['checkout', '-q', 'found/alpha-f2'], { cwd: both.root });
  const sha = commit(both.root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  git(['push', '-q', 'origin', 'found/alpha-f2'], { cwd: both.root });
  git(['checkout', '-q', 'main'], { cwd: both.root });
  assert.throws(() => mergePlain(both.root, 7, { ...q, noReview: 'x', io: plainIO({ ...both, sha }).io }), /changes module files, which go through a job: src\/alpha\/index\.mjs \(alpha\)/);
});

// Copy PR 108 (4 Nov): it conflicted on the .process gitlink, GitHub started no gate run on it,
// and merge --plain waited 10+ minutes on "gate: not started". A pull request that cannot merge
// is refused at once; one whose mergeable state is not yet computed is read again briefly.
test('merge --plain refuses a conflicted pull request at once, before waiting on any check', () => {
  const r = plainRepo();
  for (const state of [{ mergeable: false, mergeable_state: 'dirty' }, { mergeable: false }, { mergeable: null, mergeable_state: 'dirty' }]) {
    const checked = [];
    const f = plainIO(r, { after: undefined, runs: () => { checked.push(1); return []; } });
    const get = f.io.getPR;
    f.io.getPR = (...a) => ({ ...get(...a), ...state });
    assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', every: 0, io: f.io }), (e) => e.message === 'pull request 4 conflicts with tranche; nothing was merged');
    assert.equal(checked.length, 0, 'no required check was waited on');
    assert.equal(f.calls.merged, null);
  }
});

test('merge --plain reads a not-yet-computed mergeable state again briefly, then goes on or refuses', () => {
  const r = plainRepo();
  const seq = (states) => {
    const f = plainIO(r);
    const get = f.io.getPR;
    let i = 0;
    f.io.getPR = (...a) => ({ ...get(...a), mergeable: states[Math.min(i++, states.length - 1)] });
    return f;
  };
  const logs = [];
  const ok = seq([null, null, true]);
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', mergeableEvery: 0, log: (m) => logs.push(m), io: ok.io }).merged, true);
  assert.equal(logs.filter((l) => l === 'waiting for GitHub to compute whether pull request 4 can merge').length, 2);
  const late = seq([null, false]);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', mergeableEvery: 0, io: late.io }), /pull request 4 conflicts with tranche; nothing was merged/);
  assert.equal(late.calls.merged, null);
});

test('waitMergeable refuses when GitHub never computes the state within its minutes', async () => {
  const { waitMergeable } = await import('../lib/merge.mjs');
  const pr = { base: { ref: 'tranche' }, mergeable: null };
  assert.throws(() => waitMergeable('o/r', 4, pr, { minutes: 0, every: 0, read: () => pr, log: () => {} }), /GitHub has not said whether pull request 4 can merge after 0 min; nothing was merged/);
  assert.equal(waitMergeable('o/r', 4, { ...pr, mergeable: true }, { read: () => assert.fail('no read') }).mergeable, true);
});

test('merge (a job\'s) refuses a conflicted pull request at once, before reading its gate', () => {
  const { root, head } = setup();
  const f = io(head);
  const get = f.io.getPR;
  f.io.getPR = (...a) => ({ ...get(...a), mergeable: false, mergeable_state: 'dirty' });
  let gateRead = 0;
  f.io.checkRun = () => { gateRead++; return { status: 'completed', conclusion: 'success' }; };
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'r', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} }), (e) => e.message === 'pull request 3 conflicts with tranche; nothing was merged');
  assert.equal(gateRead, 0);
  assert.equal(f.calls.merged, null);
});

// The job's cost at its merge (measured 4 Nov, 11:49: a job reading its own get_session mid-turn
// has no usage; BOB reads it from the job's idle session at the merge).
test('merge --job-cost-usd writes the job\'s measured row, its session from the complete row, less that session\'s last priced row', () => {
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const rows = [
    { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_J', session_usd: 1, cost_usd: 1, at: new Date().toISOString() },
    { row: 'attempt', event: 'complete', attempt: 1, session: 'session_J', at: new Date().toISOString() },
  ];
  const head = commit(root, { 'process/metrics/alpha.jsonl': rows.map((r) => JSON.stringify(r)).join('\n') + '\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const said = [];
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '3.5', log: (m) => said.push(m) });
  assert.equal(r.merged, true);
  git(['checkout', '-q', r.tip], { cwd: root });
  const got = readRows(root, 'alpha');
  assert.equal(got.at(-1).row, 'merge', 'the merge row stays last');
  const m = got.filter((x) => x.event === 'measured').pop();
  assert.deepEqual([m.role, m.attempt, m.session, m.session_usd, m.cost_usd], ['job', 1, 'session_J', 3.5, 2.5]);
  assert.ok(said.some((l) => /job alpha's cost: 2\.5 USD/.test(l)));
  git(['checkout', '-q', 'main'], { cwd: root });
});

test('merge without --job-cost-usd still merges, records the cost unmeasured and prints the get_session call for the job\'s session', () => {
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', attempt: 1, session: 'session_J', at: new Date().toISOString() }) + '\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const said = [];
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (m) => said.push(m) });
  assert.equal(r.merged, true, 'never blocked on cost');
  assert.ok(said.some((l) => l.includes('job alpha\'s cost: unmeasured. Read it with get_session {"session_id": "session_J"}, the field external_metadata.usage.cost_usd')), said.join('\n'));
  git(['checkout', '-q', r.tip], { cwd: root });
  const m = readRows(root, 'alpha').filter((x) => x.event === 'measured');
  assert.deepEqual(m.map((x) => [x.session, x.cost_usd]), [['session_J', 'unmeasured']]);
  git(['checkout', '-q', 'main'], { cwd: root });
});

test('merge refuses a zero or unreadable --job-cost-usd before anything runs', () => {
  const { root, head } = setup();
  const f = io(head);
  for (const v of ['0', 'lots', true]) assert.throws(() => merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: v, log: () => {} }), /--job-cost-usd <the job's session cost: get_session/);
  assert.equal(f.calls.merged, null);
});

// The copy, 4 Nov: queue's attempt 2 ran in attempt 1's session and get_session's usage had not
// moved, so its row read 0; its merge then counted 4.04 whole (no session on the complete rows).
function costRows(root, rows) {
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'process/metrics/alpha.jsonl': rows.map((r) => JSON.stringify({ at: new Date().toISOString(), ...r })).join('\n') + '\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return head;
}
test('merge --job-cost-usd no higher than the session\'s last row records the delta unmeasured, never 0', () => {
  const { root } = setup();
  const head = costRows(root, [
    { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_J', session_usd: 3.25, cost_usd: 3.25 },
    { row: 'attempt', event: 'complete', attempt: 1, session: 'session_J' },
  ]);
  const said = [];
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '3.25', log: (m) => said.push(m) });
  assert.equal(r.merged, true);
  git(['checkout', '-q', r.tip], { cwd: root });
