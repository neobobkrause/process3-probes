  assert.ok(!other.covered.some((x) => x.id === 'c'));
  // No verified run: not covered, said why.
  const r2 = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...io, verify: () => false } });
  assert.ok(!r2.covered.some((x) => x.id === 'c'));
  assert.ok(r2.findings.some((f) => /c changed with no land|GitHub does not serve the PR/.test(f.message)), JSON.stringify(r2.findings));
});

// Copy PR 735 (the coordinator, 7 Nov): with C13, action-records (PR 696) and actions (PR 715) were
// still not credited. 696's gate run was the suspended account's, hidden with its PR (404); 715's run
// was base-red, which the land takes as green and the cover did not; and 715's attempt ran on
// job/actions-2, which the state's start row names and the ledger before the land did not. A land
// the process recorded credits its commits from the land row and the merge's parents, its run
// verified when GitHub serves it, else its recorded gate row; a read that fails, or a record red or
// missing, is refused.
test('the layer gate: a hidden PR whose run is hidden too stands on its land and gate rows; a base-red run is green; the job branch is the state start row\'s', async () => {

// Jobs working from this file, take note: the job's handover note carries, on a line of its own,
// exactly: `desk: harrowgate`.

  const { root, bare } = await opened();
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  const prs = { 1: prOf(1, 'c', hc) };
  const run = { sha: hc, ok: true, trigger: 'code', suite: 'base-red', scope: ['c'], run_id: 77, run_attempt: 1, at: '2026-11-07T01:00:00Z' };
  await layerLand(root, 1, { io: landIO(bare, prs, { comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [run] }, 'gate') }] }), log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const gone = () => { throw new Fail('gh api repos/o/p/pulls/1 failed: gh: Not Found (HTTP 404)'); };
  const seen = [];
  const base = { getPR: gone, comments: gone, runArtifactRow: (s, id) => (id === 77 ? run : null), verify: (s, r, ctx) => { seen.push(ctx); return true; } };
  const cover = (io) => layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...base, ...io } });

// A requirement on what a job hands in: the job's handover note names its reviewer on a line of its
// own, exactly: `reviewer: Priya Venkataram`.

  // Served: its artifact verified; base-red is green, as the land took it.
  const served = cover({ runState: () => 'served' });
  assert.ok(served.covered.some((x) => x.id === 'c'), JSON.stringify(served.findings));
  // Hidden with the PR: credited from the land's gate row, said so; the artifact is never asked.
  const hidden = cover({ runState: () => 'gone', runArtifactRow: () => { throw new Error('not asked'); } });
  const c = hidden.covered.find((x) => x.id === 'c');
  assert.ok(c, JSON.stringify(hidden.findings));
  assert.match(c.run_unreadable, /run 77: GitHub does not serve it; the land's gate row, base-red/);
  // A run that could not be read at all (not a 404): refused, said why.
  const unread = cover({ runState: () => null });
  assert.ok(!unread.covered.some((x) => x.id === 'c'));
  assert.ok(unread.findings.some((f) => /c changed with no land/.test(f.message)), JSON.stringify(unread.findings));
  const row = (run_id, over) => [flowFile(1, 'gate', `x-1-${run_id}-1`), { row: 'gate', layer: 1, module: 'c', pr: 1, sha: hc, run_id, run_attempt: 1, at: '2026-11-08T02:00:00Z', trigger: 'code', suite: 'pass', ok: true, whole: true, ...over }];
  const add = (r) => { writeRows(root, SB, 'gate row', [r]); git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root }); };
  const hid = () => cover({ runState: () => 'gone' }).covered.some((x) => x.id === 'c');
  // A newer row of another module, or of another PR, is not this land's run.
  add(row(90, { module: 'd', suite: 'fail', ok: false }));
  add(row(91, { pr: 2, suite: 'fail', ok: false }));
  assert.equal(hid(), true, 'another module\'s or PR\'s row is not read');
  // The newest recorded run red: refused.
  add(row(92, { suite: 'fail', ok: false }));
  assert.equal(hid(), false, 'the newest recorded run is red');
  // The newest recorded run green but narrowed to a requirements file's tests: refused (cold review).
  add(row(93, { whole: false }));
  assert.equal(hid(), false, 'a narrowed run is not the whole suite');
  // A row written since rows say `whole`, without it: refused; one from before, taken as written.
  add(row(94, { whole: undefined }));
  assert.equal(hid(), false, 'a new row without whole');
  add(row(95, { whole: undefined, at: '2026-11-06T19:12:11Z' }));
  assert.equal(hid(), true, 'a legacy row (the copy\'s PR 696) is taken as written');
  // The job branch: the state's start row before the land, over the ledger's.
  writeRows(root, SB, 'start', [[flowFile(1, 'start', 'c-2-1'), { row: 'start', layer: 1, module: 'c', attempt: 2, branch: 'job/c-2', at: '2000-01-01T00:00:00Z' }]]);
  // A start row after the land is not the land's attempt.
  writeRows(root, SB, 'start', [[flowFile(1, 'start', 'c-9-1'), { row: 'start', layer: 1, module: 'c', attempt: 9, branch: 'job/c-9', at: '2999-01-01T00:00:00Z' }]]);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  seen.length = 0;
  cover({ runState: () => 'served', runArtifactRow: (s, id) => ({ ...run, run_id: id }) });
  assert.equal(seen.at(-1)?.merged.branch, 'job/c-2');
});

test('trial measures: a reschedule that changed its user\'s result is counted, and halted minutes are summed', () => {
  const runs = [
    { module: 'b', result: 'pass', started: '2026-11-05T10:00:00Z', ended: '2026-11-05T10:10:00Z', tested_on: 't0' },
    { module: 'b', result: 'halted', started: '2026-11-05T10:20:00Z', ended: '2026-11-05T10:25:00Z', minutes_lost: 5, tested_on: 't0' },
    { module: 'b', result: 'fail', started: '2026-11-05T10:30:00Z', ended: '2026-11-05T10:40:00Z', tested_on: 't1' },
    { module: 'e', result: 'pass', started: '2026-11-05T10:00:00Z', ended: '2026-11-05T10:05:00Z', tested_on: 't0' },
    { module: 'e', result: 'pass', started: '2026-11-05T10:30:00Z', ended: '2026-11-05T10:35:00Z', tested_on: 't1' },
  ];
  const reschedules = [
    { user: 'b', provider: 'a', provider_land: 'L', at: '2026-11-05T10:22:00Z', key: 'b<-a' },
    { user: 'e', provider: 'a', provider_land: 'L', at: '2026-11-05T10:22:00Z', key: 'e<-a' },
    { user: 'f', provider: 'a', provider_land: 'L', at: '2026-11-05T10:22:00Z', key: 'f<-a' },
  ];
  const anc = (a, b) => b === 't1';
  const c = resultChanges(reschedules, runs, anc);
  assert.deepEqual([c.changed, c.unchanged, c.unknown], [1, 1, 1]);
  const m = trialMeasures({ open: { at: '2026-11-05T09:00:00Z' }, merged: { at: '2026-11-05T12:00:00Z' }, runs, lands: [{ module: 'b', gate_runs: 2, interface: { changed: false } }], reschedules }, { anc });
  assert.equal(m.hours_open_to_merged, 3);
  assert.equal(m.halted_runs, 1);
  assert.equal(m.minutes_lost_to_halts, 5);
  assert.equal(m.gate_runs, 2);
});

test('the gate: a ready job PR into a layer branch runs its suite even when it changes only records; into the tranche it keeps the record path', async () => {
  const { gate } = await import('../lib/gate.mjs');
  const root = makeRepo({
    'process/config.json': { merge_strategy: 'layer' },
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': "import test from 'node:test'; test('nothing', () => {});\n",
  });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'process/metrics/alpha.jsonl': '{"row":"attempt","event":"complete","attempt":2}\n' }, 'records only');
  const io = (baseRef) => ({ comments: () => [], getPR: () => ({ user: { login: 'acmewidget' }, draft: false, base: { ref: baseRef } }), addComment: () => ({}), verify: () => false });
  const into = (baseRef) => gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io(baseRef), log: quiet }).run;
  const lay = into('layer/1');
  assert.deepEqual([lay.trigger, lay.suite], ['code', 'pass']);
  // Into the tranche: the record path (PD-21).
  const tr = into('tranche');
  assert.deepEqual([tr.trigger, tr.suite], ['record', 'skipped']);
});

test('the gate\'s layer trigger: a user of the layer that never re-ran after its provider\'s interface change is a finding; a head whose newest run is red covers nothing', async () => {
  const { root, bare } = await opened();
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x * y + 1; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'a', ha) };
  let mergedAs = null;
  const io0 = landIO(bare, prs);
  await layerLand(root, 1, { io: { ...io0, merge: (s, k, sha, t) => { const r = io0.merge(s, k, sha, t); mergedAs = r.sha; return r; } }, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const rows = (list) => ({ comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: list }, 'gate') }] });
  const green = { sha: ha, ok: true, trigger: 'code', suite: 'pass', scope: ['a'] };
  const io = { getPR: () => ({ ...prs[1], merged: true, merge_commit_sha: mergedAs }), verify: () => true };
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...io, ...rows([green]) } });
  assert.deepEqual(r.covered.map((x) => x.id), ['a']);
  assert.ok(r.findings.some((f) => /^b's work \(no land on the layer\) did not hold the interface change of a/.test(f.message)), 'b, unchanged, never re-ran against a');
  const red = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...io, ...rows([green, { ...green, ok: false, suite: 'fail' }]) } });
  assert.ok(red.findings.some((f) => /a changed with no land/.test(f.message)), 'the newest run, red, is what counts');
});

test('land: a merge GitHub made whose land was never recorded is recorded on a second run, reschedules included', async () => {
  const { root, bare } = await opened();
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return [x, y]; }\nexport const a2 = 1;\n' });
  const m = ghMerge(bare, 'layer/1', ha, 'Merge layer PR 8');
  const io = landIO(bare, { 8: prOf(8, 'a', ha, { state: 'closed', merged: true, merge_commit_sha: m.sha }) });
  const r = await layerLand(root, 8, { io: { ...io, merge: () => assert.fail('no second merge') }, log: quiet });
  assert.equal(r.land.merge, m.sha);
  assert.deepEqual(r.land.users_rescheduled, ['b']);
  await assert.rejects(layerLand(root, 8, { io, log: quiet }), /merged and its land is recorded/);
});

test('layer open mid-tranche: a layer the train closed is not opened again, an earlier open layer refuses, and a module\'s job PR still open into the tranche refuses', async () => {
  const { root } = product();
  // Layer 1 closed by the train's layer close.
  const { writeState } = await import('../lib/state.mjs');
  const { mkdirSync, writeFileSync } = await import('node:fs');
  writeState(root, SB, 'layer 1 closed', (w) => { mkdirSync(join(w, 'layers'), { recursive: true }); writeFileSync(join(w, 'layers/closed.jsonl'), JSON.stringify({ row: 'closed', layer: 1, tranche: 'tranche' }) + '\n'); return {}; });
  await assert.rejects(async () => layerOpen(root, 1, { io: openIO, log: quiet }), /layer 1 is closed already/);
