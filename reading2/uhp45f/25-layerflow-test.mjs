  await layerLand(root, 1, { io: landIO(bare, prs, { comments }), log: quiet });
  fetchState(root, SB, { fresh: true });
  const rows = flowRows(root, SB, 1);
  assert.deepEqual(rows.gates.map((g) => [g.module, g.pr, g.run_id, g.run_attempt, g.minutes, g.suite_minutes, g.record_only]), [['c', 1, 71, null, 0.5, null, true], ['c', 1, 72, null, 6, 4, false], ['c', 1, 72, 2, 5, 3, false]]);
  // A p3 test run and a publish run of c, after the opening.
  const open = rows.open.at;
  const later = (m) => new Date(Date.parse(open) + m * 60000).toISOString();
  writeRows(root, SB, 'rows', [
    [flowFile(1, 'test', 'c-1'), { row: 'test', layer: 1, module: 'c', session: 'session_x', started: later(1), ended: later(3), at: later(3), minutes: 2, result: 'pass' }],
    [flowFile(1, 'run', 'c-1'), { row: 'run', layer: 1, module: 'c', round: 1, started: later(4), ended: later(7), at: later(7), minutes: 3, result: 'pass' }],
  ]);
  const rep = layerReport(root, 1, { log: quiet }).measures.time_budget;
  const c = rep.per_module.find((x) => x.id === 'c');
  // The publish run runs no suite (job complete; the gate runs it): apart from the tests.
  assert.deepEqual([c.test_runs, c.local_test_minutes, c.publish_runs, c.publish_minutes, c.gate_runs, c.gate_minutes, c.gate_suite_minutes, c.gate_record_only_minutes], [1, 2, 1, 3, 3, 11.5, 7, 0.5]);
  assert.equal(rep.total.gate_minutes, 11.5);
});

test('time budget: wall from each start to its complete, work is wall minus local tests, null when unknown', () => {
  const at = (m) => new Date(Date.UTC(2026, 10, 6, 10, m)).toISOString();
  const attempts = {
    a: [
      { row: 'attempt', event: 'start', attempt: 1, at: at(0) }, { row: 'attempt', event: 'complete', attempt: 1, at: at(30) },
      { row: 'attempt', event: 'start', attempt: 2, at: at(40) }, { row: 'attempt', event: 'complete', attempt: 2, at: at(50) },
      { row: 'attempt', event: 'start', attempt: 0, at: '2026-11-05T00:00:00Z' }, // before the opening
    ],
    b: [{ row: 'attempt', event: 'start', attempt: 1, at: at(5) }], // still open: wall unknown
  };
  // a's tests: one inside its first attempt (counted against its wall), one after its last
  // complete (a gate-red fix: no wall here, so not subtracted from work).
  const tests = [{ module: 'a', minutes: 4, started: at(16), ended: at(20), at: at(20) }, { module: 'a', minutes: 2, started: at(55), ended: at(57), at: at(57) }, { module: 'b', minutes: 3, started: at(6), ended: at(9), at: at(9) }];
  const runs = [{ module: 'a', minutes: 6, at: at(29) }];
  const gates = [{ module: 'a', minutes: 7, suite_minutes: 5, record_only: false }, { module: 'a', minutes: 1, suite_minutes: null, record_only: true }, { module: 'a', minutes: null, suite_minutes: null, record_only: false }];
  const b = timeBudget(['b', 'a'], { attempts, tests, runs, gates, since: '2026-11-06T09:00:00Z' });
  assert.deepEqual(b.per_module.map((x) => [x.id, x.starts, x.open_attempts, x.wall_minutes, x.local_test_minutes, x.tests_in_wall_minutes, x.publish_minutes, x.gate_minutes, x.gate_unknown_runs, x.gate_suite_minutes, x.gate_record_only_minutes, x.work_minutes]), [
    ['a', 2, 0, 40, 6, 4, 6, 8, 1, 5, 1, 36],
    ['b', 1, 1, null, 3, 0, 0, 0, 0, 0, 0, null],
  ]);
  assert.deepEqual(b.total, { starts: 3, wall_minutes: 40, wall_unknown_modules: 1, local_test_minutes: 9, publish_minutes: 6, gate_minutes: 8, gate_unknown_runs: 1, gate_suite_minutes: 5, gate_record_only_minutes: 1, work_minutes: 36, test_share: 0.1, test_per_work: 0.11 });
  assert.equal(budgetLine(b), 'time budget: 3 start(s); wall 40 min (1 module(s) unknown); local tests 9 min; publish runs 6 min; gate 8 min on landed PRs (suites 5, record-only 1, 1 run(s) of unknown length); work 36 min; tests 10% of wall, 0.11 per minute of work');
  // Nothing known: nulls, never a guess.
  const none = timeBudget(['b'], { attempts: { b: attempts.b } });
  assert.deepEqual([none.total.wall_minutes, none.total.work_minutes, none.total.test_share, none.total.test_per_work], [null, null, null, null]);
});

test('layer merge refuses a committed generated file stale on the layer, naming the file and its regenerate (the coordinator, 6 Nov: order.mjs)', async () => {
  const { root, bare } = product({ done: true, config: { generated: [{ paths: ['gen/order.mjs'], regenerate: ['node', '-e', "require('fs').writeFileSync('gen/order.mjs','new\\n')"], verify: ['node', '-e', '0'] }] } });
  commit(root, { 'gen/order.mjs': 'old\n' }, 'a committed generated file, stale');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: () => assert.fail('no PR on a stale file'), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title) };
  const lines = [];
  await assert.rejects(layerMerge(root, 1, { io: mio, wait: false, log: (l) => lines.push(l) }), /layer 1 cannot merge: the layer checks found 1 finding/);
  assert.ok(lines.some((l) => /^generated: gen\/order\.mjs: gen\/order\.mjs is stale on layer\/1 \S+: run node -e .* and commit it \(a plain pull request into layer\/1\), then .*layer merge 1 again$/.test(l)), lines.join('\n'));
});

test('layer merge runs the layer checks but no module suite: a red entry check refuses the merge; green, it merges and still no suite ran', async () => {
  const marker = join(mkdtempSync(join(tmpdir(), 'p3-mark-')), 'suite-ran');
  const suite = { cwd: '.', command: ['node', '-e', `require('fs').writeFileSync(${JSON.stringify(marker)}, '1')`, '--test'] };
  const flag = join(mkdtempSync(join(tmpdir(), 'p3-flag-')), 'red');
  const check = ['node', '-e', `process.exit(require('fs').existsSync(${JSON.stringify(flag)}) ? 3 : 0)`];
  const { root, bare } = product({ done: true, over: { a: { suite }, b: { suite }, c: { suite, checks: [check] } } });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const { writeFileSync, existsSync } = await import('node:fs');
  writeFileSync(flag, '1');
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 70, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title) };
  let opened = 0;
  await assert.rejects(layerMerge(root, 1, { io: { ...mio, createPR: (...a) => { opened++; return mio.createPR(...a); } }, wait: false, log: quiet }), /the layer checks found 1 finding\(s\).*no module suite ran/);
  assert.equal(opened, 0, 'no PR opened on a red layer check');
  assert.equal(existsSync(marker), false, 'no module suite ran');
  const { rmSync } = await import('node:fs');
  rmSync(flag);
  assert.equal((await layerMerge(root, 1, { io: mio, wait: false, log: quiet })).ok, true);
  assert.equal(existsSync(marker), false, 'no module suite ran at the merge either');
});

test('the gate\'s layer trigger: each module covered by a verified green land; a provider\'s later interface change is a finding, nothing re-runs', async () => {
  const { root, bare } = await opened();
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  const hb = jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(7);\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x - y; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'c', hc), 2: prOf(2, 'b', hb), 3: prOf(3, 'a', ha) };
  const mergedAs = {};
  const io0 = landIO(bare, prs);
  const io = { ...io0, merge: (s, k, sha, t) => { const r = io0.merge(s, k, sha, t); mergedAs[k] = r.sha; return r; } };
  await layerLand(root, 1, { io, log: quiet });
  await layerLand(root, 2, { io, log: quiet });
  await layerLand(root, 3, { io, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const merged = Object.fromEntries(Object.entries(prs).map(([k, p]) => [k, { ...p, merged: true, merge_commit_sha: mergedAs[k] }]));
  const gio = { getPR: (s, k) => merged[k], verify: () => true };
  const runsOf = (k) => [{ sha: prs[k].head.sha, ok: true, trigger: 'code', suite: 'pass', scope: [prs[k].head.ref.slice(4)] }];
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  // The gate rows are read through io.comments, as the gate's job post writes them.
  const cover = (over = {}) => layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...gio, ...over } });
  const withRows = { comments: (s, k) => [{ user: { login: BOT }, body: block(GATE, { runs: runsOf(k) }, 'gate') }] };
  const r = cover(withRows);
  // b's run did not hold a's interface change (a landed after it): a finding; a and c covered.
  assert.deepEqual(r.covered.map((x) => x.id).sort(), ['a', 'c']);
  assert.equal(r.findings.length, 1);
  assert.match(r.findings[0].message, /b's last green run .* did not hold the interface change of a/);
  // With no verified gate run, a land covers nothing.
  const none = cover({ ...withRows, verify: () => false });
  assert.equal(none.covered.length, 0);
  assert.ok(none.findings.every((f) => f.check === 'layer'));
});

// C13 (the coordinator, 7 Nov): PR 696, opened by the suspended account, reads 404; layer 9's merge
// gate failed on it. A landed PR GitHub no longer serves is judged from the state branch's land row
// for that merge and its gate run's own artifact, recorded pr_unreadable; one with no land row fails closed.
test('the layer gate: a landed PR that reads 404 is covered from its land row and its gate run artifact; with no land row, not covered', async () => {
  const { root, bare } = await opened();
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  const prs = { 1: prOf(1, 'c', hc) };
  const run = { sha: hc, ok: true, trigger: 'code', suite: 'pass', scope: ['c'], run_id: 77, run_attempt: 1, at: '2026-11-07T01:00:00Z' };
  await layerLand(root, 1, { io: landIO(bare, prs, { comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [run] }, 'gate') }] }), log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const gone = () => { throw new Fail('gh api repos/o/p/pulls/1 failed: gh: Not Found (HTTP 404)'); };
  const seen = [];
  const io = { getPR: gone, comments: gone, runState: () => 'served', runArtifactRow: (s, id) => (id === 77 ? run : null), verify: (s, r, ctx) => { seen.push(ctx); return r.run_id === 77; } };
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io });
  const c = r.covered.find((x) => x.id === 'c');
  assert.ok(c, JSON.stringify(r));
  assert.match(c.pr_unreadable, /HTTP 404/);
  assert.equal(seen[0].merged.branch, 'job/c', 'the run is bound to the module\'s job branch');
  // Not a 404: fails closed, as before.
  assert.throws(() => layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...io, getPR: () => { throw new Fail('gh api failed: HTTP 502'); } } }), /HTTP 502/);
  // An artifact that is another run's: not covered (cold review of C13).
  const other = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...io, runArtifactRow: () => ({ ...run, run_id: 78 }) } });
