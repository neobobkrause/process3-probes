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
