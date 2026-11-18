  assert.equal(r.ok, true);
  assert.deepEqual(r.receipt.tests.map((t) => t.req), ['R1', 'R4']);
});

// Coordinator, 5 Nov: a split copied jurisdictions R109 and four more to jurisdictions-b and -c,
// each line "was jurisdictions R<n>" under a new id; job complete still asked tests for them.
test('job complete asks no test for a requirement moved out of the module\'s file to another module\'s; the receipt lists it moved; a line deleted with nowhere to go still owes its test', () => {
  const root = product();
  commit(root, { 'process/ledger/alpha-b.json': entry('alpha-b', { requirements: 'req/alpha-b.md' }), 'req/alpha-b.md': '# alpha-b\n', 'req/alpha.md': '# alpha\n\n- **R1** *(not yet met: x)* does x.\n- **R5** *(not yet met: y)* does y.\n- **R6** *(not yet met: z)* does z.\n' });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    'req/alpha-b.md': '# alpha-b\n\n- **R1** *(not yet met: y)* does y. (was alpha R5)\n',
    'req/alpha.md': '# alpha\n\n- **R1** does x.\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 x at the interface', () => {});\n",
    'src/alpha/x.mjs': 'export const x = 1;\n',
  });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  // R6's line was deleted and no file names it moved: it still owes a test; R5 does not.
  assert.throws(() => run([]), /struck R1, R6 with no --test/, 'R5 is not asked for');
  // "was alpha R5" names R5 only: not R5.1 or R50, and not a module whose id alpha prefixes.
  commit(root, { 'req/alpha-b.md': '# alpha-b\n\n- **R1** *(not yet met: y)* does y. (was alpha R5)\n- **R2** *(not yet met: q)* q. (was alpha R6.1)\n- **R3** *(not yet met: q)* q. (was alphabet R6)\n' });
  assert.throws(() => run(['R1=test/alpha/x.test.mjs::R1 x at the interface']), /struck R6 with no --test/);
  const r = run(['R1=test/alpha/x.test.mjs::R1 x at the interface', 'R6=test/alpha/x.test.mjs::R1 x at the interface']);
  assert.equal(r.ok, true);
  assert.deepEqual(r.receipt.tests.map((t) => t.req), ['R1', 'R6']);
  assert.deepEqual(r.receipt.moved, [{ req: 'R5', to: ['alpha-b'] }]);
});

// Coordinator, 5 Nov: a split copied the lines into the new module's file before the attempt's
// base; the attempt only deletes them from its own. Same id, same line at HEAD: moved, no test.
test('job complete asks no test for a line a split copied to another module before the base; a different line under the same id still owes one', () => {
  const root = product();
  commit(root, {
    'process/ledger/alpha-b.json': entry('alpha-b', { requirements: 'req/alpha-b.md' }),
    'req/alpha-b.md': '# alpha-b\n\n- **R5** *(not yet met: y)* does y.\n- **R6** *(not yet met: v)* does v.\n',
    'req/alpha.md': '# alpha\n\n- **R1** *(not yet met: x)* does x.\n- **R5** *(not yet met: y)* does y.\n- **R6** *(not yet met: z)* does z.\n',
  });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    'req/alpha.md': '# alpha\n\n- **R1** does x.\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 x at the interface', () => {});\n",
    'src/alpha/x.mjs': 'export const x = 1;\n',
  });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  // alpha-b's file is unchanged on this branch; R5 is there with the same line, R6 is not.
  assert.throws(() => run([]), /struck R1, R6 with no --test/, 'R5 is not asked for');
  const r = run(['R1=test/alpha/x.test.mjs::R1 x at the interface', 'R6=test/alpha/x.test.mjs::R1 x at the interface']);
  assert.equal(r.ok, true);
  assert.deepEqual(r.receipt.tests.map((t) => t.req), ['R1', 'R6']);
  assert.deepEqual(r.receipt.moved, [{ req: 'R5', to: ['alpha-b'] }]);
  // Met there, the same line is not a move: it would leave R5 unmet nowhere (review).
  commit(root, { 'req/alpha-b.md': '# alpha-b\n\n- **R5** does y.\n- **R6** *(not yet met: v)* does v.\n' });
  assert.throws(() => run(['R1=test/alpha/x.test.mjs::R1 x at the interface', 'R6=test/alpha/x.test.mjs::R1 x at the interface']), /struck R5 with no --test/);
});

test('metrics report: BOB\'s idle time per day, and the overhead share per job and per layer', () => {
  const idle = idleByDay([
    { at: '2026-11-01T01:00:00Z', row: 'sweep', bob_acts: true, bob_quiet_h: 0.5 },
    { at: '2026-11-01T02:00:00Z', row: 'sweep', bob_acts: true, bob_quiet_h: 1.5 },
    { at: '2026-11-01T03:00:00Z', row: 'sweep', bob_acts: false, bob_quiet_h: null },
    { at: '2026-11-02T01:00:00Z', row: 'sweep', bob_acts: 'unmeasured', bob_quiet_h: null },
    { at: '2026-11-02T02:00:00Z', row: 'sweep', bob_acts: true, bob_quiet_h: 3 },
  ]);
  assert.deepEqual(idle, [{ day: '2026-11-01', occurrences: 2, longest_quiet_h: 1.5, unmeasured_sweeps: 0 }, { day: '2026-11-02', occurrences: 1, longest_quiet_h: 3, unmeasured_sweeps: 1 }]);
  assert.equal(idleByDay([]), 'unmeasured');
  const at = (h) => `2026-11-01T${String(h).padStart(2, '0')}:00:00Z`;
  const m = (module, h, role, cost, session = 's') => ({ at: at(h), module, row: 'attempt', event: 'measured', role, session, cost_usd: cost });
  const rows = [
    { at: at(1), module: 'a', row: 'attempt', event: 'start' },
    { at: at(1), module: 'b', row: 'attempt', event: 'start' },
    m('a', 2, 'job', 6), m('a', 2, 'review', 1), m('b', 2, 'job', 'unmeasured'),
    m('bob', 3, 'bob', 4, 'session_bob'), // 4 split over a and b
    { at: at(4), module: 'c', row: 'attempt', event: 'start' }, m('c', 5, 'job', 3),
    m('bob', 6, 'bob', 7, 'session_bob'), // cumulative: 3 more, all to c
    m('bob', 7, 'bob', 2, 'session_bob2'), // a new BOB, nothing open since: unattributed
  ];
  const o = overhead(rows, layerOf('| Layer | Modules |\n|---|---|\n| 1 | `a`, `b` |\n| 2 | c |\n'));
  const job = (id) => o.jobs.find((j) => j.module === id);
  assert.deepEqual([job('a').job_usd, job('a').reviews_usd, job('a').bob_usd, job('a').root_usd, job('a').share], [6, 1, 2, 'unmeasured', 0.3333]);
  assert.deepEqual(job('a').unmeasured, ['root', 'gate']);
  assert.deepEqual([job('b').job_usd, job('b').reviews_usd, job('b').bob_usd, job('b').share], ['unmeasured', 'unmeasured', 2, 'unmeasured']);
  assert.deepEqual([job('c').bob_usd, job('c').share, job('c').layer], [3, 0.5, 2]);
  assert.deepEqual(o.layers.map((l) => [l.layer, l.share]), [[1, 'unmeasured'], [2, 0.5]]);
  assert.ok(o.layers[0].unmeasured.includes('b job'));
  assert.equal(o.unattributed_usd, 2);
  assert.equal(o.jobs.some((j) => j.module === 'bob'), false);
  assert.match(o.rule, /even split/);
  assert.equal(overhead([m('a', 2, 'job', 6)]).jobs[0].bob_usd, 'unmeasured');
  // A job active after BOB's last row, or in a window a costless row ends, has BOB's part unmeasured.
  const later = overhead([...rows, { at: at(8), module: 'd', row: 'attempt', event: 'start' }, m('d', 9, 'job', 2)]);
  assert.deepEqual([later.jobs.find((j) => j.module === 'd').bob_usd, later.jobs.find((j) => j.module === 'd').unmeasured], ['unmeasured', ['reviews', 'bob', 'root', 'gate']]);
  const costless = overhead([m('e', 1, 'job', 2), m('bob', 2, 'bob', 'unmeasured', 'session_bob'), m('bob', 3, 'bob', 1, 'session_bob')]);
  assert.equal(costless.jobs[0].bob_usd, 'unmeasured');
  const spans = overhead([m('f', 1, 'job', 2), m('bob', 2, 'bob', 1, 'session_bob'), m('g', 3, 'job', 2), m('bob', 4, 'bob', 'unmeasured', 'session_bob'), m('h', 5, 'job', 2), m('bob', 6, 'bob', 3, 'session_bob')]);
  assert.deepEqual(spans.jobs.map((j) => [j.module, j.bob_usd]), [['f', 1], ['g', 'unmeasured'], ['h', 'unmeasured']]);
  assert.equal(spans.unattributed_usd, 2);
  assert.deepEqual(overhead([{ module: 'x', row: 'attempt', event: 'start' }]).jobs, []);
});

test('job start over requirements_cap prints the split owed and starts, the figure in its start row, with --over-cap or without (REQ-6)', () => {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'process/config.json': { requirements_cap: 20 },
    'req/alpha.md': '# alpha\n\nR1 does a thing.\n',
    'test/alpha/a.test.mjs': passing,
  });
  git(['branch', 'tranche'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', push: false, overCap: true, log: quiet }), /--over-cap needs why/);
  const out = [];
  const { start } = jobStart(root, 'alpha', { coordinator: 's', push: false, overCap: 'one reading still', log: (m) => out.push(m) });
  assert.match(out.join('\n'), /req\/alpha.md 26 over 20; starting over the cap: one reading still/);
  assert.match(start, /Requirement file `req\/alpha.md`: 26 bytes against the cap of 20, over it\./);
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  assert.deepEqual([readRows(root, 'alpha')[0].over_cap, readRows(root, 'alpha')[0].cap], ['one reading still', 'split or consolidate before its job: req/alpha.md 26 over 20']);
  // Without --over-cap it starts all the same (Bob, 5 Nov: 32 of 32 refusals overridden); the figure is kept.
  const bare = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'process/config.json': { requirements_cap: 20 }, 'req/alpha.md': '# alpha\n\nR1 does a thing.\n', 'test/alpha/a.test.mjs': passing });
  git(['branch', 'tranche'], { cwd: bare });
  const said = [];
  jobStart(bare, 'alpha', { coordinator: 's', push: false, log: (m) => said.push(m) });
  assert.match(said.join('\n'), /req\/alpha.md 26 over 20; starting over the cap$/m);
  git(['checkout', '-q', 'job/alpha'], { cwd: bare });
  assert.deepEqual([readRows(bare, 'alpha')[0].over_cap, readRows(bare, 'alpha')[0].cap], [null, 'split or consolidate before its job: req/alpha.md 26 over 20']);
});

test('job start under the cap shows the requirement file against it', () => {
  const root = product();
  const { start } = jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  assert.match(start, /Requirement file `req\/alpha.md`: 26 bytes against the cap of 70000\.$/m);
});

test('job start: a cap on unmet marks, or a cap written as a string, is the same trigger', () => {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'process/config.json': { requirements_cap: '70000', requirements_cap_marks: 1 },
    'req/alpha.md': '- **R1** *(not yet met: x)* a\n- **R2** *(not yet met: x)* b\n',
    'test/alpha/a.test.mjs': passing,
  });
  git(['branch', 'tranche'], { cwd: root });
  const out = [];
  const { start } = jobStart(root, 'alpha', { coordinator: 's', push: false, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /req\/alpha.md 2 unmet marks over 1; starting over the cap/);
  assert.match(start, /Requirement file `req\/alpha.md`: \d+ bytes against the cap of 70000, over it\./);
});

test('the START names the job\'s rulebook (TXT-5)', () => {
  const root = product();
  const { start } = jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  assert.ok(start.includes('`.process/rulebooks/job.md`'));
  assert.ok(!/rulebooks\/(bob|root|watcher|worker)\.md/.test(start));
});

// The gate race: finish's order is push, confirm it landed, receipt, then ready. The gate reads
// the draft state live (gate.test), so the push's run, if it is the one kept, judges the
// pull request ready; the receipt is posted before either run can read it.
test('job complete marks ready last: after the push landed and the receipt is posted', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  f.state.failReady = false;
  const seen = [];
  const remote = () => git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  f.gh.addComment = ((add) => (...a) => { seen.push(['receipt', remote()]); return add(...a); })(f.gh.addComment);
  f.gh.markReady = () => { seen.push(['ready', remote(), f.state.comments.length]); f.state.ready++; f.state.isDraft = false; };
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
