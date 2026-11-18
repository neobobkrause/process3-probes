  assert.doesNotMatch(r.start, /after an earlier attempt merged/);
  assert.equal(r.attempt, 3);
  const tip = tipOf(root, 'job/alpha-2');
  assert.equal(git(['rev-parse', `${tip}^`], { cwd: root }), tranche, 'cut from the tranche tip');
  assert.equal(tipOf(root, 'job/alpha'), old, 'the abandoned branch is kept as it was');
  const row = lastRow(root, tip);
  assert.deepEqual([row.branch, row.reopen, row.abandoned, row.fresh.from], ['job/alpha-2', 'make the suite green', { branch: 'job/alpha', pr: 301 }, 'job/alpha']);
  assert.match(row.fresh.why, /job\/alpha was abandoned \(COMPLETE, 3 commits beyond tranche, no open pull request; #301 closed unmerged\)/);
  // That attempt abandoned in turn: the next free name after it.
  git(['checkout', '-q', 'job/alpha-2'], { cwd: root });
  git(['reset', '-q', '--hard', 'origin/job/alpha-2'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 3;\n' });
  git(['push', '-q', 'origin', 'job/alpha-2'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const r2 = jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'again', open: f.open, find, prs: noPRs, log: quiet });
  assert.match(r2.start, /Your branch is `job\/alpha-3`/);
  assert.deepEqual(lastRow(root, tipOf(root, 'job/alpha-3')).abandoned, { branch: 'job/alpha-2', pr: null });
  assert.equal(r2.attempt, 4);
});

test('an abandoned WORKING attempt (commits, no PR): --restart and a plain start name --reopen, which starts the next branch', () => {
  const { root, f, find, prs } = abandonedWorking();
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', restart: 'x', find, notes: () => [], log: quiet }), /job\/alpha has no open pull request; --restart continues an open one \(its work never merged.*--reopen "<what it must do>"/);
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find, prs, log: quiet }), /not an unfinished start \(WORKING, 2 commits\); its work never merged/);
  const r = jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'finish R1', open: f.open, find, prs, log: quiet });
  assert.match(r.start, /Your branch is `job\/alpha-2`/);
  const row = lastRow(root, tipOf(root, 'job/alpha-2'));
  assert.deepEqual([row.attempt, row.reopen, row.abandoned], [2, 'finish R1', { branch: 'job/alpha', pr: null }]);
  assert.equal(JSON.parse(git(['show', `${tipOf(root, 'job/alpha-2')}:process/ledger/alpha.json`], { cwd: root })).status.state, 'WORKING');
});

test('an abandoned attempt records only a pull request after the branch\'s last merged one, and --reopen with --fresh-branch records it too', () => {
  const s = abandonedComplete();
  // #5 closed unmerged before #9 merged: it belongs to an earlier attempt.
  const prs = () => [{ number: 5, state: 'closed', merged_at: null }, { number: 9, state: 'closed', merged_at: '2026-11-04T00:00:00Z' }];
  jobStart(s.root, 'alpha', { coordinator: 's', setup: ready, reopen: 'redo', fresh: 'my own why', open: s.f.open, find: s.find, prs, log: quiet });
  const row = lastRow(s.root, tipOf(s.root, 'job/alpha-2'));
  assert.deepEqual([row.abandoned, row.fresh.why], [{ branch: 'job/alpha', pr: null }, 'my own why']);
  // An OPEN tranche entry with --fresh-branch takes the abandoned route too.
  const w = abandonedWorking();
  const r = jobStart(w.root, 'alpha', { coordinator: 's', setup: ready, reopen: 'redo', fresh: 'why', open: w.f.open, find: w.find, prs: noPRs, log: quiet });
  assert.match(r.start, /Your branch is `job\/alpha-2`/);
});

test('a start on an abandoned attempt is not counted as a reopen after a merge', () => {
  const at = (h) => new Date(Date.parse('2026-11-05T00:00:00Z') + h * 36e5).toISOString();
  const sweeps = [{ row: 'sweep', at: at(0), live: 2, job_cap: 20 }];
  const rows = [{ row: 'attempt', event: 'start', at: at(0.5), reopen: 'meet R1 and R2' }, { row: 'attempt', event: 'start', at: at(0.6), reopen: 'meet R3', abandoned: { branch: 'job/a', pr: 3 } }];
  assert.equal(flowFigures({ sweeps, rows, from: at(0), to: at(1) }).reopened_marks, 2);
});

// Copy, 5 Nov (agent-steps PR 392): COMPLETE, its pull request open and red, its session archived.
test('--restart on a COMPLETE job whose pull request is open gives it a replacement session', () => {
  const s = abandonedComplete();
  const pr = { number: 392, html_url: 'https://x/pull/392', user: { login: 'civicsmith' } };
  const r = jobStart(s.root, 'alpha', { coordinator: 's', restart: 'failed only the revert check; session archived', stop: 'archived', find: () => pr, notes: () => [], log: quiet });
  assert.equal(r.restarted, true);
  assert.deepEqual([r.row.state, r.row.pr, r.row.stop], ['COMPLETE', 392, 'archived']);
  assert.match(r.start, /BOB saw: failed only the revert check; session archived/);
  assert.equal(r.launch.title, 'job alpha (restart)');
  // A plain start names --restart for that state.
  assert.throws(() => jobStart(abandonedComplete().root, 'alpha', { coordinator: 's', setup: ready, open: s.f.open, find: () => pr, prs: noPRs, log: quiet }), /not an unfinished start \(COMPLETE, 3 commits\); a job whose session stopped is restarted with job start alpha --live <n> --restart/);
});

// Every refusal of job start and --restart on an existing branch names a route; that route, run
// from the same state, is not refused (no cycles). A route that needs BOB to close a pull request
// first is run after the close.
test('every refusal in job start and --restart names a route that works from that state', () => {
  const pr = { number: 9, html_url: 'https://x/pull/9', user: { login: 'civicsmith' } };
  const states = {
    'merged COMPLETE': () => { const m = mergedOnce(); return { ...m, find: () => null, prs: noPRs }; },
    'abandoned COMPLETE': abandonedComplete,
    'abandoned WORKING': abandonedWorking,
    'unfinished start': () => { const root = withOrigin(); const f = fakeGitHub(); jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet }); return { root, f, find: () => null, prs: noPRs }; },
    'BLOCKED, no PR': () => {
      const s = abandonedWorking();
      git(['checkout', '-q', 'job/alpha'], { cwd: s.root });
      git(['reset', '-q', '--hard', 'origin/job/alpha'], { cwd: s.root });
      jobBlock(s.root, 'alpha', { reason: 'needs a provider fix', push: false, log: quiet });
      git(['push', '-q', 'origin', 'job/alpha'], { cwd: s.root });
      git(['checkout', '-q', 'main'], { cwd: s.root });
      return s;
    },
    'WORKING, PR open': () => ({ ...abandonedWorking(), find: () => pr }),
    'unfinished start, PR open': () => { const root = withOrigin(); const f = fakeGitHub(); jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet }); return { root, f, find: () => pr, prs: noPRs }; },
    'BLOCKED, PR open': () => ({ ...states['BLOCKED, no PR'](), find: () => pr }),
    'merged COMPLETE, PR open': () => ({ ...states['merged COMPLETE'](), find: () => pr }),
    'COMPLETE, PR open': () => ({ ...abandonedComplete(), find: () => pr }),
  };
  const run = (s, mode, find = s.find) => {
    const io = { coordinator: 's', setup: ready, open: s.f.open, find, prs: s.prs, notes: () => [], log: quiet };
    if (mode === 'reopen') return jobStart(s.root, 'alpha', { ...io, reopen: 'redo it' });
    if (mode === 'restart') return jobStart(s.root, 'alpha', { ...io, restart: 'its session stopped' });
    return jobStart(s.root, 'alpha', io);
  };
  let refusals = 0;
  for (const [name, make] of Object.entries(states)) {
    for (const mode of ['plain', 'reopen', 'restart']) {
      let msg = null;
      try { run(make(), mode); } catch (e) { msg = e.message; }
      if (!msg) continue;
      refusals += 1;
      const route = /--reopen "</.test(msg) ? 'reopen' : /--restart "</.test(msg) ? 'restart' : /resumes with job start alpha --live <n>/.test(msg) ? 'plain' : null;
      assert.ok(route, `${name}, ${mode}: the refusal names no route: ${msg}`);
      const closed = route === 'reopen' && /closes it/.test(msg);
      if (!closed) assert.notEqual(route, mode, `${name}, ${mode}: the refusal names itself: ${msg}`);
      const s = make();
      assert.doesNotThrow(() => run(s, route, closed ? () => null : s.find), `${name}, ${mode} -> ${route}${closed ? ' after the close' : ''}: ${msg}`);
    }
  }
  assert.ok(refusals >= 14, `walked ${refusals} refusals`);
});

// P7: the receipt names the test for each mark the job struck.
test('job complete names a test for each struck mark, and refuses before marking when one is missing or wrong', () => {
  const root = product();
  commit(root, { 'req/alpha.md': '# alpha\n\n- **R1** *(not yet met: no x)* does x.\n- **R2** *(not yet met: no y)* does y.\n- **R3** done.\n' });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  const { start } = jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  assert.match(start, /--test R<id>="<test file>::<test name>"/);
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    'req/alpha.md': '# alpha\n\n- **R1** does x.\n- **R2** *(not yet met: no y)* does y.\n- **R3** done.\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 x at the interface', () => {});\n",
    'src/alpha/x.mjs': "export const x = 1;\n",
  });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  assert.throws(() => run([]), /struck R1 with no --test/);
  assert.throws(() => run(['R1=src/alpha/x.mjs::x']), /not in the module's tests/);
  assert.throws(() => run(['R1=test/alpha/x.test.mjs::R1 y']), /does not contain "R1 y"/);
  assert.throws(() => run(['R1=test/alpha/x.test.mjs::R1 x', 'R2=test/alpha/x.test.mjs::R1 x']), /no mark for R2 that this branch struck/);
  assert.throws(() => run(['R1 test/alpha/x.test.mjs']), /write it as R<id>=/);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), tip, 'nothing committed');
  assert.equal(readEntry(root, 'alpha').status.state, 'WORKING');
  const r = run(['R1=test/alpha/x.test.mjs::R1 x at the interface']);
  assert.equal(r.ok, true);
  assert.deepEqual(r.receipt.tests, [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'R1 x at the interface' }]);
});

// Coordinator, 4 Nov: an id moved to another requirement file, or retired in a split, is not met
// here; a test for it would only pin the id, which passes on revert. A real struck mark still owes one.
test('job complete asks no test for a mark moved to another requirement file or retired in a split; a real struck mark still needs one', () => {
  const root = product();
  commit(root, {
    'process/ledger/beta.json': entry('beta'),
    'req/beta.md': '# beta\n\n- **R1** *(not yet met: b)* does b.\n',
    'req/alpha.md': '# alpha\n\n- **R1** *(not yet met: x)* does x.\n- **R2** *(not yet met: y)* does y.\n- **R3** *(not yet met: z)* does z.\n- **R4** *(not yet met: w)* does w.\n',
  });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    // R1 and R4 met here; R2 moved to beta's file, still unmet there; R3 retired in a split; beta
    // also gains an unrelated R4, which is not alpha's R4 moved.
    'req/alpha.md': '# alpha\n\n- **R1** does x.\n- **R3** *(retired: moved to beta R3)* does z.\n- **R4** does w.\n',
    'req/beta.md': '# beta\n\n- **R1** *(not yet met: b)* does b.\n- **R2** *(not yet met: y)* does y.\n- **R4** *(not yet met: v)* does v.\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 x at the interface', () => {});\n",
    'src/alpha/x.mjs': 'export const x = 1;\n',
  });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  assert.throws(() => run([]), /struck R1, R4 with no --test/);
  assert.throws(() => run(['R2=test/alpha/x.test.mjs::R1 x']), /no mark for R2 that this branch struck \(struck: R1, R4\)/);
  // beta's R1 was unmet at the base too: alpha's R1 is still alpha's own, and struck.
  const r = run(['R1=test/alpha/x.test.mjs::R1 x at the interface', 'R4=test/alpha/x.test.mjs::R1 x at the interface']);
