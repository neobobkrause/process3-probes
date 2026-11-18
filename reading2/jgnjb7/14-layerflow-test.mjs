// Copy PR 735 (the coordinator, 7 Nov): with C13, action-records (PR 696) and actions (PR 715) were
// still not credited. 696's gate run was the suspended account's, hidden with its PR (404); 715's run
// was base-red, which the land takes as green and the cover did not; and 715's attempt ran on
// job/actions-2, which the state's start row names and the ledger before the land did not. A land
// the process recorded credits its commits from the land row and the merge's parents, its run
// verified when GitHub serves it, else its recorded gate row; a read that fails, or a record red or
// missing, is refused.
test('the layer gate: a hidden PR whose run is hidden too stands on its land and gate rows; a base-red run is green; the job branch is the state start row\'s', async () => {
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
  await assert.rejects(async () => layerOpen(root, 2, { io: { ...openIO, openPRs: () => [{ number: 4, head: { ref: 'job/d' } }] }, log: quiet }), /job PRs open into tranche: #4 \(job\/d\)/);
  assert.equal(layerOpen(root, 2, { io: openIO, log: quiet }).ok, true);
  const lines = layerLines(root, configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' }), { slug: 'o/p', io: openIO });
  assert.match(lines[0], /layer 2 open on layer\/2/);
  // In a product where layer 1 is neither closed nor done, layer 2 does not open.
  const p2 = product();
  await assert.rejects(async () => layerOpen(p2.root, 2, { io: openIO, log: quiet }), /layer 1 is not closed/);
});

test('the gate: a job PR into a layer branch that changes only its requirements file runs the whole suite, never the narrowed one', async () => {
  const { gate } = await import('../lib/gate.mjs');
  const root = makeRepo({
    'process/config.json': { merge_strategy: 'layer' },
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'req/alpha.md': '# alpha\n\n**R1** a thing *(not yet met: T1)*\n',
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': "import test from 'node:test'; test('nothing', () => {});\n",
  });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'req/alpha.md': '# alpha\n\n**R1** a thing\n' }, 'mark struck');
  const io = (baseRef) => ({ comments: () => [], getPR: () => ({ user: { login: 'acmewidget' }, draft: false, base: { ref: baseRef } }), addComment: () => ({}), verify: () => false });
  const into = (baseRef) => gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io(baseRef), log: quiet }).run;
  const lay = into('layer/1');
  assert.deepEqual([lay.trigger, lay.suite, lay.requirements_only], ['code', 'pass', undefined]);
  assert.ok(into('working').requirements_only, 'into any other branch the run is narrowed, as before');
});

test('the gate\'s layer trigger: a BLOCKED user is deferred, not a finding; a records-since-green newest row stands on the run it names', async () => {
  const { root, bare } = await opened();
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x % y; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'a', ha) };
  let mergedAs = null;
  const io0 = landIO(bare, prs);
  await layerLand(root, 1, { io: { ...io0, merge: (s, k, sha, t) => { const r = io0.merge(s, k, sha, t); mergedAs = r.sha; return r; } }, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  entries.find((e) => e.id === 'b').status = { state: 'BLOCKED', reason: 'a question' };
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const green = { sha: ha, ok: true, trigger: 'code', suite: 'pass', scope: ['a'] };
  const since = { sha: ha, ok: true, trigger: 'record-since-green', after: ha };
  const io = { getPR: () => ({ ...prs[1], merged: true, merge_commit_sha: mergedAs }), verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [green, since] }, 'gate') }] };
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io });
  assert.deepEqual(r.covered.map((x) => x.id), ['a']);
  assert.deepEqual(r.findings, []);
});

test('closed layers are this tranche\'s only: a close row of another tranche, or one whose commit is on main, does not count', async () => {
  const { root } = product();
  const { closedLayers } = await import('../lib/layerflow.mjs');
  const { writeState } = await import('../lib/state.mjs');
  const { mkdirSync, writeFileSync } = await import('node:fs');
  const onMain = git(['rev-parse', 'origin/main'], { cwd: root });
  const here = commit(root, { 'x.txt': 'x\n' }, 'tranche moves');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const rows = [{ row: 'closed', layer: 1, tranche: 'tranche', commit: onMain }, { row: 'closed', layer: 2, tranche: 'other' }, { row: 'closed', layer: 3, tranche: 'tranche', commit: here }];
  writeState(root, SB, 'closes', (w) => { mkdirSync(join(w, 'layers'), { recursive: true }); writeFileSync(join(w, 'layers/closed.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n'); return {}; });
  assert.deepEqual([...closedLayers(root, SB, configOf({}))], [3]);
});

test('a BLOCKED module whose code is on the layer is judged as any: a provider\'s later interface change is still a finding', async () => {
  const { root, bare } = await opened();
  const hb = jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(8);\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x ** y; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'b', hb), 2: prOf(2, 'a', ha) };
  const mergedAs = {};
  const io0 = landIO(bare, prs);
  const io = { ...io0, merge: (s, k, sha, t) => { const r = io0.merge(s, k, sha, t); mergedAs[k] = r.sha; return r; } };
  await layerLand(root, 1, { io, log: quiet });
  await layerLand(root, 2, { io, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  entries.find((e) => e.id === 'b').status = { state: 'BLOCKED', reason: 'set instead of re-running' };
  const runs = (k) => [{ sha: prs[k].head.sha, ok: true, trigger: 'code', suite: 'pass', scope: [prs[k].head.ref.slice(4)] }];
  const cio = { getPR: (s, k) => ({ ...prs[k], merged: true, merge_commit_sha: mergedAs[k] }), verify: () => true, comments: (s, k) => [{ user: { login: BOT }, body: block(GATE, { runs: runs(k) }, 'gate') }] };
  const r = layerCover(root, configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' }), { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: cio });
  assert.ok(r.findings.some((f) => /b's last green run .* did not hold the interface change of a/.test(f.message)));
});

test('an earlier tranche\'s flow rows (their merge on main) count for nothing: that layer is not reopened, and a later one does not open on them', async () => {
  const { root } = product();
  const onMain = git(['rev-parse', 'origin/main'], { cwd: root });
  writeRows(root, SB, 'an earlier tranche', [[flowFile(1, 'open'), { row: 'open', layer: 1, at: '2026-10-01T00:00:00Z' }], [flowFile(1, 'merged'), { row: 'merged', layer: 1, commit: onMain, at: '2026-10-02T00:00:00Z' }]]);
  await assert.rejects(async () => layerOpen(root, 1, { io: openIO, log: quiet }), /an earlier tranche's .* not built/);
  await assert.rejects(async () => layerOpen(root, 2, { io: openIO, log: quiet }), /layer 1 is not closed/);
  fetchState(root, SB, { fresh: true });
  assert.match(layerLines(root, configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' }), { slug: 'o/p', io: openIO })[0], /earlier tranche's/);
  // Closed in this tranche by the train, the stale layer is passed over: status shows layer 2.
  const { writeState } = await import('../lib/state.mjs');
  const { mkdirSync, writeFileSync } = await import('node:fs');
  writeState(root, SB, 'layer 1 closed', (w) => { mkdirSync(join(w, 'layers'), { recursive: true }); writeFileSync(join(w, 'layers/closed.jsonl'), JSON.stringify({ row: 'closed', layer: 1, tranche: 'tranche' }) + '\n'); return {}; });
  assert.match(layerLines(root, configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' }), { slug: 'o/p', io: openIO })[0], /layer 2 is next and not open/);
});

test('layer merge (SLB-7): a generated verify failure naming a module of a later layer is printed for it and does not refuse; one naming a module of the closing layer refuses', async () => {
  for (const [who, refused] of [['d', false], ['c', true]]) {
    const generated = [{ paths: ['gen/words.json'], regenerate: ['node', '-e', "require('fs').mkdirSync('gen',{recursive:true});require('fs').writeFileSync('gen/words.json','[]')"], verify: ['node', '-e', `console.error('missing word row for ${who}');process.exit(1)`] }];
    const { root, bare } = product({ done: true, config: { generated } });
    layerOpen(root, 1, { io: openIO, log: quiet });
    const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 71, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title) };
    const lines = [];
    const go = layerMerge(root, 1, { io: mio, wait: false, log: (l) => lines.push(l) });
    if (refused) await assert.rejects(go, /the layer checks found 1 finding/);
    else {
      assert.equal((await go).ok, true);
      assert.ok(lines.some((l) => /^not this layer's: gen\/words.json: .*missing word row for d.*found mark on d/.test(l)), lines.join('\n'));
    }
  }
});

// Copy, 6 Nov: layer/8 was cut from the tranche at 2ec3f0be; PR 638 then added OPEN entries for
// four of its modules to the tranche, and job start read only the layer branch.
// e is a module of layer 1 whose entry lands on the tranche after layer/1 is cut.
function lateEntry({ local = false } = {}) {
  const p = product();
  const { root } = p;
  commit(root, { 'build/layers.md': layers.replace('| 1 | One | a, b, c |', '| 1 | One | a, b, c, e |') }, 'e joins layer 1');
  if (local) git(['branch', 'layer/1', 'tranche'], { cwd: root });
  else git(['push', '-q', 'origin', 'tranche', 'tranche:layer/1'], { cwd: root });
  commit(root, { 'process/ledger/e.json': entry('e', { layer: 1 }), 'req/e.md': req('e'), 'test/e/t.test.mjs': "import test from 'node:test'; test('ok', () => {});\n" }, 'Merge PR 638');
  if (!local) git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  return p;
}

test('layer open refuses, before it cuts the branch, when a module of the layer has no ledger entry on the tranche, naming each', () => {
  const { root } = product();
  commit(root, { 'build/layers.md': layers.replace('| 1 | One | a, b, c |', '| 1 | One | a, b, c, e, f |') }, 'e and f join layer 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  assert.throws(() => layerOpen(root, 1, { io: openIO, log: quiet }), /layer 1's module\(s\) have no ledger entry on tranche: process\/ledger\/e\.json, process\/ledger\/f\.json; land their entries first.*nothing was opened/);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/layer/1'], { cwd: root }), '', 'no layer/1 cut');
  fetchState(root, SB, { fresh: true });
  assert.equal(readState(root, SB, flowFile(1, 'open')), null, 'no open row');
});

test('a module whose entry is only on the tranche: layer jobs lists it as startable, and job start reads the entry there, says so, and carries it onto the job branch', () => {
  const { root } = lateEntry({ local: true });
  const lines = [];
  jobStart(root, 'e', { coordinator: 's', push: false, log: (l) => lines.push(l) });
  assert.ok(lines.some((l) => /layer\/1 has no ledger entry process\/ledger\/e\.json; it is read from tranche, the ledger's home, and the start commit carries it onto job\/e/.test(l)), lines.join('\n'));
  const carried = JSON.parse(git(['show', 'job/e:process/ledger/e.json'], { cwd: root }));
  assert.equal(carried.status.state, 'WORKING');
  assert.deepEqual({ ...carried, status: null }, { ...JSON.parse(git(['show', 'tranche:process/ledger/e.json'], { cwd: root })), status: null });
  assert.equal(git(['rev-list', '--count', 'layer/1..job/e'], { cwd: root }), '1', 'one start commit on the layer');
  assert.equal(git(['show', 'job/e:req/e.md'], { cwd: root }), git(['show', 'tranche:req/e.md'], { cwd: root }), 'its requirements file carried with it');
  assert.ok(lines.some((l) => l === 'req/e.md is carried from tranche with it'));
  // The job rule: the job adds only its own entry, as the tranche holds it, the status aside.
  const base = git(['merge-base', 'layer/1', 'job/e'], { cwd: root });
  assert.deepEqual(checkLedger(root, { ref: 'job/e', base, branch: 'job/e', home: 'tranche' }), []);
  assert.match(checkLedger(root, { ref: 'job/e', base, branch: 'job/e' })[0].message, /a job may not add a ledger entry/);
  // An entry that differs from the tranche's beyond its status is still refused.
  git(['checkout', '-q', 'job/e'], { cwd: root });
  const e = JSON.parse(git(['show', 'HEAD:process/ledger/e.json'], { cwd: root }));
  commit(root, { 'process/ledger/e.json': { ...e, paths: ['src/'] } }, 'widen');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  assert.match(checkLedger(root, { ref: 'job/e', base, branch: 'job/e', home: 'tranche' })[0].message, /a job may not add a ledger entry \(its own is added only as tranche holds it/);
});

test('layer jobs and status read a module\'s entry from the tranche when the layer branch has none', () => {
  const { root } = lateEntry();
  const r = layerJobs(root, 1, { io: openIO, log: quiet });
  const e = r.states.find((s) => s.id === 'e');
  assert.deepEqual([e.state, e.why], ['not started', 'OPEN, unmet R1']);
  assert.ok(r.startable.some((x) => x.id === 'e'));
});

test('layer open ends each live hold on only its modules, as hold --end records it; a hold on another layer\'s module, another layer or slots stays', async () => {
  const { hold, readHolds, HOLDS_FILE } = await import('../lib/hold.mjs');
  const { root } = product();
  const S = 'session_coord1';
  const ids = {};
  for (const scope of ['module:a', 'layer:1', 'module:d', 'layer:2', 'slots:2']) ids[scope] = hold(root, scope, { why: `until layer 1 opens (${scope})`, by: S, until: '10h', log: quiet }).id;
  const lines = [];
  const r = layerOpen(root, 1, { io: openIO, log: (l) => lines.push(l), by: S });
  assert.deepEqual(r.ended.sort(), [ids['module:a'], ids['layer:1']].sort());
  fetchState(root, SB, { fresh: true });
  const ends = readState(root, SB, HOLDS_FILE).split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((x) => x.row === 'end');
  assert.deepEqual(ends.map((x) => [x.id, x.by, x.why]).sort(), [[ids['module:a'], S, 'ended by layer open 1'], [ids['layer:1'], S, 'ended by layer open 1']].sort());
  const live = readHolds(root, SB).filter((h) => h.live).map((h) => h.scope).sort();
  assert.deepEqual(live, ['layer:2', 'module:d', 'slots:2']);
  assert.ok(lines.some((l) => l === `${ids['module:a']} ended: module:a holds nothing now (ended by layer open 1)`));
  // Again: nothing ended twice.
  assert.deepEqual(layerOpen(root, 1, { io: openIO, log: quiet }).ended, []);
});

test('the gate: a job PR into a layer branch may add its own entry as the tranche holds it, the status aside; into the tranche, or changed beyond the status, it may not', async () => {
  const { gate } = await import('../lib/gate.mjs');
  const root = makeRepo({ 'process/config.json': { merge_strategy: 'layer' }, 'process/ledger/alpha.json': entry('alpha'), 'src/alpha/index.mjs': 'export const x = 1;\n' });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/beta.json': entry('beta') }, 'Merge PR 638');
  git(['checkout', '-q', '-b', 'job/beta', base], { cwd: root });
  const head = commit(root, { 'process/ledger/beta.json': entry('beta', { status: { state: 'WORKING' } }) }, 'job start beta (attempt 1)');
  const io = (baseRef) => ({ comments: () => [], getPR: () => ({ user: { login: 'acmewidget' }, draft: true, base: { ref: baseRef } }), addComment: () => ({}), verify: () => false });
  const ledger = (baseRef, h = head) => gate(root, { base, head: h, branch: 'job/beta', pr: 5, slug: 'o/r', io: io(baseRef), log: quiet }).findings.filter((f) => f.check === 'ledger').map((f) => f.message);
  assert.deepEqual(ledger('layer/1'), []);
  assert.deepEqual(ledger('tranche'), ['a job may not add a ledger entry']);
  const wide = commit(root, { 'process/ledger/beta.json': entry('beta', { status: { state: 'WORKING' }, paths: ['src/'] }) }, 'widen');
  assert.match(ledger('layer/1', wide)[0], /a job may not add a ledger entry \(its own is added only as refs\/heads\/tranche holds it/);
});

// Copy, 6 Nov: corpus-export committed BLOCKED (rows owed to layer 11) on its job branch, not on
// layer/8, so it showed as working and its draft PR held the layer merge.
test('a module BLOCKED at its open job PR\'s head is deferred, and that PR no longer holds the layer merge; a WORKING head still does', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const blocked = jobWork(bare, 'c', { 'process/ledger/c.json': entry('c', { layer: 1, status: { state: 'BLOCKED', reason: 'rows owed to layer 2' } }) });
  const pr = (head) => [{ number: 61, draft: true, head: { ref: 'job/c', sha: head } }];
  const st = layerStatus(root, 1, { io: { ...openIO, openPRs: () => pr(blocked) }, log: quiet });
  const c = st.states.find((s) => s.id === 'c');
  assert.deepEqual([c.state, c.why], ['deferred', "BLOCKED: rows owed to layer 2 (on PR 61's head)"]);
  assert.equal(st.ready, true);
  // A head that reads WORKING holds the merge as before.
  const working = jobWork(bare, 'b', { 'process/ledger/b.json': entry('b', { layer: 1, status: { state: 'WORKING' } }) });
  const held = layerStatus(root, 1, { io: { ...openIO, openPRs: () => [{ number: 62, draft: true, head: { ref: 'job/b', sha: working } }] }, log: quiet });
  assert.deepEqual([held.states.find((s) => s.id === 'b').state, held.ready], ['working', false]);
  const mio = { slug: 'o/p', openPRs: () => pr(blocked), comments: () => [], findPR: () => null, createPR: (s, p) => ({ number: 80, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title) };
  const m = await layerMerge(root, 1, { io: mio, wait: false, log: quiet });
  assert.equal(m.ok, true);
  assert.deepEqual(m.closed.deferred.c.reason, "BLOCKED: rows owed to layer 2 (on PR 61's head)");
});

test('a module whose entry only the tranche holds has its job PR named: it shows as working', () => {
  const { root, bare } = lateEntry();
  const h = jobWork(bare, 'e', { 'process/ledger/e.json': entry('e', { layer: 1, status: { state: 'WORKING' } }) });
  const r = layerJobs(root, 1, { io: { ...openIO, openPRs: () => [{ number: 63, draft: true, head: { ref: 'job/e', sha: h } }] }, log: quiet });
  assert.deepEqual(r.states.find((s) => s.id === 'e').state, 'working');
  assert.ok(!r.startable.some((x) => x.id === 'e'));
  // A fresh branch of it (job/e-2) is named for e too.
  const f = layerJobs(root, 1, { io: { ...openIO, openPRs: () => [{ number: 64, draft: true, head: { ref: 'job/e-2', sha: h } }] }, log: quiet });
  assert.deepEqual(f.states.find((s) => s.id === 'e').pr, 64);
});

// Cold review of PR 190: the carried entry and requirements are added on both sides after the cut
// (OPEN on the tranche, the job's on the layer), an add/add conflict GitHub cannot merge.
test('layer merge: a carried entry\'s add/add conflict with the tranche is merged into the layer, keeping the layer\'s; any other conflict refuses', async () => {
  const { carriedSync, readLayer: rl } = await import('../lib/layerflow.mjs');
  const { root, bare } = lateEntry();
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json', requirements_dir: 'req/' });
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'l', 'origin/layer/1'], { cwd: d });
  commit(d, { 'process/ledger/e.json': entry('e', { layer: 1, status: { state: 'COMPLETE' } }), 'req/e.md': req('e').replace(' *(not yet met: T1)*', '') }, 'Merge layer PR 9');
  git(['push', '-q', 'origin', 'l:layer/1'], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const L = rl(root, cfg, 1, { io: openIO, slug: 'o/p' });
  const lines = [];
  const sha = carriedSync(root, cfg, 1, L, (l) => lines.push(l));
  assert.ok(sha);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/layer/1'], { cwd: root }).split('\t')[0], sha);
  assert.equal(JSON.parse(git(['show', `${sha}:process/ledger/e.json`], { cwd: root })).status.state, 'COMPLETE', 'the layer\'s kept');
  assert.equal(git(['merge-base', '--is-ancestor', 'origin/tranche', sha], { cwd: root, allowFail: true }).code, 0);
  assert.match(lines[0], /tranche merged in at .*the layer's version kept of process\/ledger\/e\.json, req\/e\.md/);
  // Clean now: nothing more to merge.
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal(carriedSync(root, cfg, 1, rl(root, cfg, 1, { io: openIO, slug: 'o/p' }), quiet), null);
  // A conflict in any other file refuses, naming it; nothing pushed.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/c/index.mjs': 'export const c = 7;\n' }, 'tranche edits c');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const d2 = clone(bare);
  git(['checkout', '-q', '-B', 'l', 'origin/layer/1'], { cwd: d2 });
  commit(d2, { 'src/c/index.mjs': 'export const c = 8;\n' }, 'Merge layer PR 10');
  git(['push', '-q', 'origin', 'l:layer/1'], { cwd: d2 });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const tip = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  assert.throws(() => carriedSync(root, cfg, 1, rl(root, cfg, 1, { io: openIO, slug: 'o/p' }), quiet), /layer\/1 and tranche conflict in src\/c\/index\.mjs.*nothing was opened/);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/layer/1'], { cwd: root }).split('\t')[0], tip);
});

// Coordinator, 6 Nov (R7): a provider's land rescheduled 12 users, most COMPLETE before the layer
// opened with no code on it, each re-test a whole job session. The gate's trust stays with CI.
test('layer retest: a rescheduled module with no work on the layer gets a records-only ready PR; its land clears the reschedule, and the report counts it', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'a', ha) };
  // The land's own retest is left to this test (a stub that opens nothing and refuses nothing).
  await layerLand(root, 1, { io: { ...landIO(bare, prs), retest: () => ({ pr: null }) }, log: quiet });
  const jl = [];
  const j = layerJobs(root, 1, { io: openIO, log: (l) => jl.push(l) });
  assert.deepEqual(j.states.find((s) => s.id === 'b').state, 'rescheduled');
  // a's change is additive (an added export): the retest is b's way, the job its fallback.
  assert.equal(j.startable.find((x) => x.id === 'b').cmd, 'node .process/tool/p3.mjs layer retest b');
  assert.ok(jl.some((l) => /additive change: a red retest falls back to .*job start b/.test(l)));
  const made = [];
  const posted = [];
  const io = {
    slug: 'o/p', openPRs: () => [],
    prsFromBranch: () => [{ number: 40, state: 'closed', merged_at: '2026-11-05T00:00:00Z', user: { login: 'acmewidget' } }],
    comments: () => [],
    createPR: (s, p) => { made.push(p); return { number: 41 + made.length - 1, ...p }; },
    markReady: (s, k) => { posted.push([k, 'ready']); },
    jobHeads: () => new Set(git(['ls-remote', '--heads', 'origin', 'refs/heads/job/*'], { cwd: root }).split('\n').filter(Boolean).map((l) => l.split('\t')[1].replace('refs/heads/', ''))),
  };
  const lines = [];
  const r = layerRetest(root, 'b', { io, log: (l) => lines.push(l) });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const tip = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  assert.equal(git(['rev-parse', 'origin/job/b'], { cwd: root }), r.head);
  assert.equal(git(['rev-parse', `${r.head}^`], { cwd: root }), tip, 'one commit on the layer tip');
  assert.deepEqual(git(['diff', '--name-only', tip, r.head], { cwd: root }), 'process/metrics/b.jsonl', 'records only');
  assert.deepEqual([made[0].head, made[0].base, made[0].draft], ['job/b', 'layer/1', true]);
  assert.deepEqual(posted[0], [41, 'ready']);
  // Red, say: PR 41 is closed; a second retest takes the layer into job/b by a merge, no rewrite.
  const closed = { number: 41, state: 'closed', merged_at: null, user: { login: 'acmewidget' } };
  const io2 = { ...io, prsFromBranch: () => [closed, ...io.prsFromBranch()] };
  const r2 = layerRetest(root, 'b', { io: io2, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal(git(['merge-base', '--is-ancestor', r.head, r2.head], { cwd: root, allowFail: true }).code, 0, 'a fast-forward of job/b');
  assert.deepEqual(git(['diff', '--name-only', tip, r2.head], { cwd: root }), 'process/metrics/b.jsonl', 'records only');
  // A job branch of b holding work the layer lacks refuses (a fresh start whose PR never opened).
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/b-2', 'origin/layer/1'], { cwd: d });
  commit(d, { 'src/b/index.mjs': 'export const b = 2;\n' }, 'job start b (attempt 2)');
  git(['push', '-q', 'origin', 'job/b-2'], { cwd: d });
  assert.throws(() => layerRetest(root, 'b', { io: { ...io2, prsFromBranch: () => [closed, { ...closed, number: 42 }, ...io.prsFromBranch()] }, log: quiet }), /origin's job\/b-2 at .* has work layer\/1 lacks: a job re-tests it/);
  git(['push', '-q', 'origin', ':job/b-2'], { cwd: d });
  prs[41] = prOf(41, 'b', r2.head);
  assert.ok(lines.some((l) => /PR 41 from job\/b, ready; the gate runs its whole suite. Green: .*layer land 41/.test(l)));
  // CI's gate is green on its head: the merge tool lands it, and b is complete.
  const land = await layerLand(root, 41, { io: landIO(bare, prs), log: quiet });
  assert.equal(land.land.retest, true);
  assert.equal(layerJobs(root, 1, { io: openIO, log: quiet }).states.find((s) => s.id === 'b').state, 'complete');
  const m = layerReport(root, 1, { log: quiet }).measures;
  assert.deepEqual([m.retests, m.retest_lands], [2, 1]);
  // Not rescheduled now: refused.
  assert.throws(() => layerRetest(root, 'b', { io, log: quiet }), /b is complete: layer retest is for a rescheduled module/);
});

test('layer retest: a module whose own work landed on the layer is retested; one with work the layer lacks is refused, naming the job start', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 3;\n' });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'c', hc), 2: prOf(2, 'a', ha) };
  for (const k of [1, 2]) await layerLand(root, k, { io: landIO(bare, prs), log: quiet });
  // Its land's retest was refused (the stub): layer jobs now leads with b's job.
  assert.match(layerJobs(root, 1, { io: openIO, log: quiet }).startable.find((x) => x.id === 'b').cmd, /job start b/);
  // b's job branch holds work the layer lacks (pushed, never landed).
  jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(5);\n" });
  const io = { slug: 'o/p', openPRs: () => [], prsFromBranch: () => [], comments: () => [], createPR: () => assert.fail('no PR'), addComment: () => assert.fail('no comment') };
  assert.throws(() => layerRetest(root, 'b', { io, log: quiet }), /origin's job\/b at .* has work layer\/1 lacks: a job re-tests it: .*job start b --sessions <file> --reopen "re-test against the new interface of a"/);
  assert.throws(() => layerRetest(root, 'c', { io, log: quiet }), /c is complete/);
});

// Bob, 6 Nov (R8): publication's land in layer 8 rescheduled 12 users, most COMPLETE.
// Coordinator, 9 Nov (C56): the layer land path never ran triageAtMerge, so no notice user had been
// cleared at a land since 7 Nov. A land that raises a notice triages it in the same command (PD-20).
test('land: the notice it raises is triaged at the land, as the tranche merge triages its own (PD-20 rules)', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h1 = jobWork(bare, 'a', { 'req/a.md': req('a', '- a(x) returns x, unchanged').replace(' *(not yet met: T1)*', '') });
  const lines = [];
  const r = await layerLand(root, 1, { io: landIO(bare, { 1: prOf(1, 'a', h1) }), log: (l) => lines.push(String(l)) });
  assert.deepEqual(r.land.users_noticed, ['b', 'd']);
  assert.ok(r.triage, 'the land ran the triage');
  assert.ok(lines.some((l) => /^notice triage a:1 at the merge/.test(l)), lines.join('\n'));
  fetchState(root, SB, { fresh: true });
  assert.ok(JSON.parse(readState(root, SB, 'notices/a-1.json')).exports_read, 'the exports read over the land are recorded');
  // No export moved and no requirement id changed: every user is cleared by rule, none owed a worker.
  assert.deepEqual(r.triage.owed, []);
  const { triageFile } = await import('../lib/triage.mjs');
  for (const u of ['b', 'd']) assert.equal(JSON.parse(readState(root, SB, triageFile(u, 'a:1'))).verdict, 'not affected', u);
});

test('land (R8): a reworded Provides text reschedules no one and leaves a notice for the users; an added export retests them; the report counts both rules', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h1 = jobWork(bare, 'a', { 'req/a.md': req('a', '- a(x) returns x, unchanged').replace(' *(not yet met: T1)*', '') });
  const prs = { 1: prOf(1, 'a', h1) };
  const lines = [];
  const r1 = await layerLand(root, 1, { io: landIO(bare, prs), log: (l) => lines.push(l) });
  assert.deepEqual([r1.land.users_rescheduled, r1.land.users_rescheduled_old_rule, r1.land.users_noticed], [[], ['b'], ['b', 'd']]);
  assert.ok(lines.some((l) => /provider notice a:1 for 2 user\(s\), its Public \/ Provides text changed \(no reschedule\): b, d/.test(l)));
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(JSON.parse(readState(root, SB, 'notices/a-1.json')).users, ['b', 'd']);
  assert.equal(layerJobs(root, 1, { io: openIO, log: quiet }).states.find((s) => s.id === 'b').state, 'complete');
  // An added export (additive): b is retested by its gate alone, not rescheduled for a job.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/a', 'origin/layer/1'], { cwd: d });
  const h2 = commit(d, { 'src/a/index.mjs': 'export function a(x) { return x; }\nexport const a2 = 1;\n' }, 'a2');
  git(['push', '-q', '-f', 'origin', 'job/a'], { cwd: d });
  prs[2] = prOf(2, 'a', h2);
  const opened = [];
  const r2 = await layerLand(root, 2, { io: { ...landIO(bare, prs), retest: (r, u) => { opened.push(u); return { pr: { number: 70 } }; } }, log: quiet });
  assert.deepEqual([r2.land.users_rescheduled, r2.land.interface.triggers, r2.land.interface.class], [['b'], ['exports'], 'additive']);
  assert.deepEqual([opened, r2.retests], [['b'], [{ user: 'b', pr: 70 }]]);
  const m = layerReport(root, 1, { log: quiet }).measures;
  // The stub opened no retest row for b, so b's re-test is still counted as a job: 1 avoided (the Provides land's).
  assert.deepEqual([m.reschedules, m.retests_owed, m.reschedules_old_rule, m.reschedules_avoided, m.lands_additive, m.lands_breaking], [0, 1, 2, 1, 1, 0]);
  assert.deepEqual([m.triggers_old_rule['provides-text'], m.triggers_new_rule['provides-text'], m.triggers_new_rule.exports], [1, 0, 1]);
  assert.equal(typeof m.reschedule_changed_result.unknown, 'number', 'reschedule_changed_result still counts');
  assert.equal(m.reschedule_changed_result.rows.length, 1);
});

test('land (R8): exports that cannot be read refuse the land, naming what could not be read; nothing is merged', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' });
  let merged = 0;
  const io = { ...landIO(bare, { 1: prOf(1, 'a', h) }), merge: () => { merged++; return {}; }, interfaceChange: () => ({ unread: 'git show failed for src/a/index.mjs' }) };
  await assert.rejects(layerLand(root, 1, { io, log: quiet }), /refused: a's exports could not be read at .* \(git show failed for src\/a\/index\.mjs\); the job fixes what cannot be read and publishes again; nothing was merged/);
  assert.equal(merged, 0);
});

test('layer retest refuses a rescheduled module with unmet requirement marks: a job meets them', async () => {
  const { root, bare } = product();
  layerOpen(root, 1, { io: openIO, log: quiet });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x; }\nexport const a2 = 1;\n' });
  await layerLand(root, 1, { io: landIO(bare, { 1: prOf(1, 'a', ha) }), log: quiet });
  const j = layerJobs(root, 1, { io: openIO, log: quiet });
  assert.equal(j.states.find((s) => s.id === 'b').state, 'rescheduled');
  assert.equal(j.startable.find((x) => x.id === 'b').retest, undefined, 'not offered');
  assert.throws(() => layerRetest(root, 'b', { io: { slug: 'o/p', openPRs: () => [] }, log: quiet }), /b has unmet requirement marks \(R1\): a job meets them: .*job start b --sessions <file> --reopen "meet the unmet requirement marks R1/);
});

// Bob's refinement "c" (6 Nov), on the copy's layer 8: publication 632 added the export
// Publication.renderingsByPixels, and the expected rows of g47t-miniflare and g47t-registry gained
// `pixels_sha256: null`. It rescheduled 12 users; 8 re-ran as job sessions and none changed a result.
test('publication 632: an added export and expected rows that only gain a key are additive, so each user gets a gate-only retest; a changed expected value is breaking', async () => {
  const pub = "export class Publication {\n  renderings(id) { return []; }\n}\n";
  const rows = (extra) => `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { Publication } from '../../src/a/index.mjs';\nconst expected = [\n  { id: 'p1', status: 'published', pages: 3${extra} },\n  { id: 'p2', status: 'draft', pages: 1${extra} },\n];\ntest('R2 the registry lists the renderings', () => {\n  assert.deepEqual(new Publication().renderings('x'), expected);\n});\n`;
  const { root, bare } = product({ done: true, over: {} });
  const d0 = clone(bare);
  git(['checkout', '-q', '-B', 't', 'origin/tranche'], { cwd: d0 });
  commit(d0, { 'src/a/index.mjs': pub, 'req/a.md': req('a', '- **R2** the registry lists the renderings').replace(' *(not yet met: T1)*', ''), 'test/a/g47t-registry.test.mjs': rows(''), 'test/a/g47t-miniflare.test.mjs': rows('').replace('registry lists', 'miniflare lists') }, 'publication before 632');
  git(['push', '-q', 'origin', 't:tranche'], { cwd: d0 });
  git(['fetch', '-q', 'origin'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h = jobWork(bare, 'a', {
    'src/a/index.mjs': "export class Publication {\n  renderings(id) { return []; }\n  renderingsByPixels(sha) { return []; }\n}\n",
    'test/a/g47t-registry.test.mjs': rows(', pixels_sha256: null'),
    'test/a/g47t-miniflare.test.mjs': rows(', pixels_sha256: null').replace('registry lists', 'miniflare lists'),
  });
  const prs = { 632: prOf(632, 'a', h) };
  const opened = [];
  const r = await layerLand(root, 632, { io: { ...landIO(bare, prs), retest: (x, u) => { opened.push(u); return { pr: { number: 700 + opened.length } }; } }, log: quiet });
  const ic = r.land.interface;
  assert.equal(ic.class, 'additive');
  assert.deepEqual(ic.exports.added, ['Publication.renderingsByPixels']);
  assert.deepEqual(ic.provides_test_changes.map((x) => [x.file, x.class, x.why]), [['test/a/g47t-miniflare.test.mjs', 'additive', 'added pixels_sha256; pixels_sha256'], ['test/a/g47t-registry.test.mjs', 'additive', 'added pixels_sha256; pixels_sha256']]);
  assert.deepEqual(opened, ['b'], 'each user in the layer retested by its gate alone');
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(flowRows(root, SB, 1).reschedules.map((x) => [x.user, x.class]), [['b', 'additive']]);
  assert.equal(layerJobs(root, 1, { io: openIO, log: quiet }).startable.find((x) => x.id === 'b').cmd, 'node .process/tool/p3.mjs layer retest b');
  // A changed expected value, only in its own tests, after 632's land changed a's source in this
  // layer: the tests read breaking, capped at additive (PD-15): b is retested by its gate.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/a', 'origin/layer/1'], { cwd: d });
  const h2 = commit(d, { 'test/a/g47t-registry.test.mjs': rows(', pixels_sha256: null').replace("status: 'draft'", "status: 'withdrawn'") }, 'a value');
