  // An open sync PR whose head is not the tool's merge (a push to its branch) is never landed.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'w', `origin/${stem}-2`], { cwd: d });
  const forged = commit(d, { 'src/c/index.mjs': 'export const c = 666;\n' }, 'a push to the sync branch');
  git(['push', '-q', 'origin', `w:${stem}-2`], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  await assert.rejects(layerSync(root, 1, { io: { ...io, openPRs: () => [{ number: 92, head: { ref: `${stem}-2`, sha: forged } }] }, log: quiet }), /sync PR 92's head .* is not the tool's merge .*nothing was landed/);
  // Landed by GitHub, its row lost: the next run records it.
  const ok = git(['rev-parse', `origin/${stem}`], { cwd: root });
  ghMerge(bare, 'layer/1', ok, 'Merge layer sync PR 91');
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal((await layerSync(root, 1, { io, log: quiet })).synced, false);
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(flowRows(root, SB, 1).syncs.map((r) => [r.pr, r.recovered]), [[91, true]]);
});

test('the gate\'s layer trigger after a layer sync: the sync\'s merge is not a stray change to a module\'s file', async () => {
  const { root, bare } = product({ done: true });
  commit(root, { 'src/c/more.mjs': 'export const one = 1;\n// 2\n// 3\n// 4\nexport const five = 5;\n' }, 'more');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const hc = jobWork(bare, 'c', { 'src/c/more.mjs': 'export const one = 11;\n// 2\n// 3\n// 4\nexport const five = 5;\n' });
  const prs = { 6: prOf(6, 'c', hc) };
  const mergedAs = {};
  const io0 = landIO(bare, prs);
  await layerLand(root, 6, { io: { ...io0, merge: (s, k, sha, t) => { const r = io0.merge(s, k, sha, t); mergedAs[k] = r.sha; return r; } }, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  commit(root, { 'src/c/more.mjs': 'export const one = 1;\n// 2\n// 3\n// 4\nexport const five = 55;\n' }, 'a plain PR on c, another line');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  await layerSync(root, 1, { io: syncIO(bare, []), log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  assert.deepEqual(changed, ['src/c/more.mjs']);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const merged = { 6: { ...prs[6], merged: true, merge_commit_sha: mergedAs[6] } };
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { getPR: (s, k) => merged[k], verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [{ sha: hc, ok: true, trigger: 'code', suite: 'pass', scope: ['c'] }] }, 'gate') }] } });
  assert.deepEqual(r.findings, []);
  assert.deepEqual(r.covered.map((x) => x.id), ['c']);
});

// Coordinator, 6 Nov 16:13: layer 8's job PRs 658-661 were red only on the old tool's ledger finding,
// their sessions archived. After the layer syncs, layer sync brings it into each open job branch.
test('layer sync (layer 8): each open job PR branch takes the synced layer when the merge brings only the pointer, shims, ledger entries and records; a BLOCKED one, or one the merge would bring code into, is left alone', async () => {
  const { root, bare } = product({ done: true });
  commit(root, { 'build/layers.md': layers.replace('| 1 | One | a, b, c |', '| 1 | One | a, b, c, e |'), 'req/e.md': req('e'), '.github/workflows/process-gate.yml': 'name: gate v1\n' }, 'e joins layer 1');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  // Opened before e's entry landed (as layer/8 was): open by hand, as the refusal now forbids it.
  git(['push', '-q', 'origin', 'tranche:layer/1'], { cwd: root });
  writeRows(root, SB, 'open', [[flowFile(1, 'open'), { row: 'open', layer: 1, branch: 'layer/1', tranche: 'tranche', from: git(['rev-parse', 'tranche'], { cwd: root }), at: new Date().toISOString(), by: 'bob' }]]);
  // job/a, cut now; then c's code lands on the layer; then job/e (carrying e's entry) and job/b (BLOCKED).
  jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 2; }\n' });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 3;\n' });
  await layerLand(root, 6, { io: landIO(bare, { 6: prOf(6, 'c', hc) }), log: quiet });
  const he = jobWork(bare, 'e', { 'process/ledger/e.json': entry('e', { layer: 1, status: { state: 'WORKING' } }), 'src/e/index.mjs': 'export const e = 1;\n', 'process/metrics/e.jsonl': '{"row":"attempt","event":"start","attempt":1}\n' });
  jobWork(bare, 'b', { 'process/ledger/b.json': entry('b', { layer: 1, status: { state: 'BLOCKED', reason: 'owed to layer 2' } }) });
  // The tranche: e's OPEN entry (PR 638), the pin moved, the shim with it.
  git(['fetch', '-q', 'origin'], { cwd: root });
  // PR 638's entry has a field the job's carried copy lacks (a later edit of the tranche's).
  commit(root, { 'process/ledger/e.json': entry('e', { layer: 1, paths: ['src/e/', 'lib/e/'] }) }, 'Merge PR 638');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin move 2');
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v2\n' }, 'shim 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const open = [658, 660, 661].map((k, i) => ({ number: k, draft: false, head: { ref: ['job/e', 'job/b', 'job/a'][i], sha: null } }));
  // A fork's PR naming a job branch is never pushed to.
  open.push({ number: 662, draft: false, head: { ref: 'job/c', sha: null, repo: { full_name: 'someone/fork' } } });
  const lines = [];
  const r = await layerSync(root, 1, { io: { ...syncIO(bare, []), openPRs: (s, base) => (base === 'layer/1' ? open : []) }, log: (l) => lines.push(l) });
  assert.equal(r.synced, true);
  assert.deepEqual(r.jobs.merged.map((x) => [x.branch, x.changed.sort()]), [['job/e', ['.github/workflows/process-gate.yml', '.process', 'process/ledger/e.json']]]);
  assert.deepEqual(r.jobs.left.map((x) => [x.branch, x.why.split(' (')[0]]), [['job/b', 'BLOCKED'], ['job/a', 'the layer brings other changes']]);
  git(['fetch', '-q', 'origin'], { cwd: root });
  const tip = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const eh = git(['rev-parse', 'origin/job/e'], { cwd: root });
  assert.equal(git(['merge-base', '--is-ancestor', tip, eh], { cwd: root, allowFail: true }).code, 0, 'job/e holds the synced layer');
  assert.equal(git(['merge-base', '--is-ancestor', he, eh], { cwd: root, allowFail: true }).code, 0, 'a fast-forward of job/e');
  const merged = JSON.parse(git(['show', `${eh}:process/ledger/e.json`], { cwd: root }));
  assert.deepEqual([merged.status.state, merged.paths], ['WORKING', ['src/e/', 'lib/e/']], 'the layer\'s entry, the job\'s status');
  // The ledger rule, as the gate reads it now: e's entry is in the base, only its status differs.
  assert.deepEqual(checkLedger(root, { ref: eh, base: git(['merge-base', eh, tip], { cwd: root }), branch: 'job/e' }), []);
  assert.ok(lines.some((l) => /job\/e \(PR 658\) took layer\/1 .*its gate re-runs with the new tool/.test(l)));
  // Run again: nothing more to do.
  const again = await layerSync(root, 1, { io: { ...syncIO(bare, []), openPRs: (s, base) => (base === 'layer/1' ? open : []) }, log: quiet });
  assert.deepEqual([again.synced, again.jobs.merged.length], [false, 0]);
});

// Coordinator, 6 Nov 17:28: layer status said "layer 8 can merge" while four BLOCKED jobs had their
// work done and owed only a publish (R4b counts them deferred); a merge would drop finished work.
test('a module deferred at its PR head with a green suite there is deferred with work done: layer status says restart to publish, and layer merge refuses unless --defer-done "<why>"', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 7;\n', 'process/ledger/c.json': entry('c', { layer: 1, status: { state: 'BLOCKED', reason: 'gate red on the ledger finding only' } }) });
  const pr = [{ number: 658, draft: false, head: { ref: 'job/c', sha: h } }];
  // A whole-suite green run on its head, then a later red row of another kind: still work done.
  const comments = (s, k) => (k === 658 ? [{ user: { login: BOT }, body: block(GATE, { runs: [{ sha: h, ok: false, trigger: 'code', suite: 'pass', scope: ['c'], findings: 1 }] }, 'gate') }, { user: { login: BOT }, body: block(GATE, { runs: [{ sha: h, ok: false, trigger: 'record', suite: 'skipped' }] }, 'gate') }] : []);
  const lines = [];
  const st = layerStatus(root, 1, { io: { ...openIO, openPRs: () => pr, comments }, log: (l) => lines.push(l) });
  assert.deepEqual(st.deferred_done, ['c']);
  assert.ok(lines.some((l) => /^1 deferred with work done \(suite green, BLOCKED only on a process finding\): restart to publish/.test(l)));
  assert.ok(lines.some((l) => /job start c --restart ".*"\s+\(PR 658\)/.test(l)));
  const mio = { slug: 'o/p', openPRs: () => pr, comments, findPR: () => null, createPR: (s, p) => ({ number: 80, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title) };
  await assert.rejects(layerMerge(root, 1, { io: mio, wait: false, log: quiet }), /layer 1 cannot merge: c \(PR 658\) is deferred with work done .*restart it to publish .*or merge with --defer-done "<why>"/);
  await assert.rejects(layerMerge(root, 1, { io: mio, wait: false, log: quiet, deferDone: true }), /--defer-done needs why/);
  // GitHub unreadable: counted as work done until read, the merge held.
  await assert.rejects(layerMerge(root, 1, { io: { ...mio, comments: () => { throw new Error('gh: 502'); } }, wait: false, log: quiet }), /c \(PR 658\) is deferred with work done/);
  // A green row narrowed to requirements tests is not the whole suite.
  const narrow = (s, k) => (k === 658 ? [{ user: { login: BOT }, body: block(GATE, { runs: [{ sha: h, ok: true, trigger: 'code', suite: 'pass', scope: ['c'], requirements_only: [{ module: 'c' }] }] }, 'gate') }] : []);
  assert.deepEqual(layerStatus(root, 1, { io: { ...openIO, openPRs: () => pr, comments: narrow }, log: quiet }).deferred_done, []);
  const m = await layerMerge(root, 1, { io: mio, wait: false, log: quiet, deferDone: 'c waits for layer 2 by Bob\'s word' });
  assert.deepEqual(m.merged.deferred_done, { modules: ['c'], why: 'c waits for layer 2 by Bob\'s word' });
  // A suite that failed on its head is no work done: deferred as before, the merge not held for it.
  const red = (s, k) => (k === 658 ? [{ user: { login: BOT }, body: block(GATE, { runs: [{ sha: h, ok: false, trigger: 'code', suite: 'fail' }] }, 'gate') }] : []);
  const p2 = product({ done: true });
  layerOpen(p2.root, 1, { io: openIO, log: quiet });
  const h2 = jobWork(p2.bare, 'c', { 'process/ledger/c.json': entry('c', { layer: 1, status: { state: 'BLOCKED', reason: 'x' } }) });
  assert.deepEqual(layerStatus(p2.root, 1, { io: { ...openIO, openPRs: () => [{ number: 658, draft: true, head: { ref: 'job/c', sha: h2 } }], comments: red }, log: quiet }).deferred_done, []);
});

test('layer sync names a job BLOCKED only on the ledger-carry finding it just cleared, with its --restart line', async () => {
  const { root, bare } = product({ done: true });
  commit(root, { 'build/layers.md': layers.replace('| 1 | One | a, b, c |', '| 1 | One | a, b, c, e |'), 'req/e.md': req('e') }, 'e joins layer 1');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche:layer/1'], { cwd: root });
