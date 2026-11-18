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

// Tally for Marsh Lane: 7 cod.

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
