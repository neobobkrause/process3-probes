  assert.doesNotMatch(v.text, /release path is next/);
});

test('walk internal: the internal walk alone, any time; its reports under walks/internal/ on the state branch, no deploy row', () => {
  const dep = { ...DEP, internal_walk: IW };
  const { root, bare } = withOrigin({ ...product(dep), 'out/.gitignore': '*\n' });
  assert.throws(() => walkInternal(makeRepo({ 'process/config.json': { deploy: DEP } }), { log: quiet }), /internal_walk is not set/);
  const out = [];
  const r = walkInternal(root, { log: (m) => out.push(m) });
  assert.equal(r.ok, false);
  assert.equal(r.internal_walk.failures, 1);
  assert.match(r.internal_walk.reports[1].stored, /^walks\/internal\/\w{10}-[^/]+\/report\.txt$/);
  assert.match(git(['show', `process-state:${r.internal_walk.reports[1].stored}`], { cwd: bare }), /FAIL s4/);
  assert.equal(git(['show', `process-state:${DEPLOYS_FILE}`], { cwd: bare, allowFail: true }).code, 128, 'no deploy row');
  assert.match(out.join('\n'), /--from "internal walk \w{10}"/);
});

// Bob, 7 Nov: the internal walk is "Required, tool-started", at "Round close only" (his 4 Nov rule
// stands). The act that closes a round starts the run itself, from a scratch worktree at the
// tranche tip; between layers it runs nothing; when it cannot run, it is the one next act. With an
// internal walk configured, the run is that walk alone (C43, BD-R1).
test('round-close run: nothing between layers; at the round close it runs the internal walk alone from the tranche tip and is then not owed; when it cannot run, the one next act', () => {
  const ILOCAL = node("require('fs').mkdirSync('out', { recursive: true }); require('fs').writeFileSync('out/inner.json', JSON.stringify({ steps: [{ ok: true }], failures: [] }))");
  const dep = { ...DEP, internal_walk: { run: ILOCAL, reports: ['out/inner.json'] } };
  const { root, bare } = withOrigin({ ...LIVE({ deploy: dep }), 'out/.gitignore': '*\n' });
  opened(root);
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  push(root, { 'x.txt': 'the tranche past main\n' });
  assert.equal(closeLayer(root, '4').ok, true);
  const rio = { repo, compare: () => null, status: statusIO, deploy: io };
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  // Between layers: no walk, no deploy, nothing owed.
  let called = 0;
  const stub = { walkRound: () => { called++; return { ok: true }; }, deployDev: () => { called++; return { ok: true }; } };
  const out = [];
  const open = roundCloseRun(root, { log: (m) => out.push(m), io: { ...rio, ...stub }, by: 'layer merge 4' });
  assert.deepEqual([open.ran, open.owed, called], [false, null, 0]);
  assert.match(out.join('\n'), /no internal walk now: the round is open \(the first round is open: layers 5, 6, 7, 8, 9, 10, 11 not closed\)/);
  // The round closes (plan close): the run starts itself, at the tip: the internal walk alone.
  push(root, { 'process/config.json': { deploy: dep, completion_file: 'build/round.md', plan: 'close' } });
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  git(['checkout', '-q', '--detach', head], { cwd: root });
  writeFileSync(join(root, 'scratch.txt'), 'the merging session\'s own checkout, untouched\n');
  const said = [];
  const r = roundCloseRun(root, { log: (m) => said.push(m), io: rio, by: 'merge 7' });
  assert.equal(r.ran, true);
  assert.equal(r.ok, true);
  assert.match(said.join('\n'), /the last round \(plan close\) closed, not yet walked: merge 7 starts the round-close run now \(Bob, 7 Nov: required, tool-started\): the internal walk only; no deploy and no live walk until a round's internal walk is clean/);
  const row = rows(bare, 'round-walk').at(-1);
  assert.equal(row.commit, tip);
  assert.deepEqual(row.results.map((x) => x.stage), ['internal_walk']);
  assert.equal(row.internal_walk.ok, true);
  assert.deepEqual(rows(bare), [], 'no deploy row: no deploy and no live walk');
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), head, 'the checkout stays where it was');
  assert.equal(readFileSync(join(root, 'scratch.txt'), 'utf8'), 'the merging session\'s own checkout, untouched\n');
  assert.equal(git(['worktree', 'list', '--porcelain'], { cwd: root }).split('\n').filter((l) => l.startsWith('worktree ')).length, 1, 'the scratch worktree removed');
  // Run and clean: not owed, nothing runs again.
  const again = roundCloseRun(root, { log: quiet, io: { ...rio, ...stub } });
  assert.deepEqual([again.ran, again.owed, called], [false, null, 0]);
  // Cannot run here: the one next act, still owed.
  const { root: r2 } = withOrigin({ ...LIVE({ deploy: dep, plan: 'close' }), 'out/.gitignore': '*\n' });
  opened(r2);
  git(['push', '-q', 'origin', 'main'], { cwd: r2 });
  push(r2, { 'x.txt': 'past main\n' });
  const told = [];
  const no = roundCloseRun(r2, { log: (m) => told.push(m), io: { ...rio, walkRound: () => { throw new (class extends Error {})('out of disk'); } } });
  assert.equal(no.ran, false);
  assert.equal(no.act, ROUND_WALK_ACT);
  assert.match(no.owed, /the last round \(plan close\) closed, not yet walked/);
  assert.match(told.join('\n'), /the round-close run did not run here \(out of disk\); it is owed \(the last round \(plan close\) closed, not yet walked\): the one next act is node \S+ walk round, from a clean checkout of the tranche tip; status puts it first and ROOT's sweep wakes BOB for it/);
  assert.match(see(r2).text, /^FIRST: the round-close run is owed \(the last round \(plan close\) closed, not yet walked\): node \S+ walk round, from a clean checkout of the tranche tip \(the internal walk only; no deploy and no live walk until a round's internal walk is clean, then the release deployment and its walk \(BD-R1\)\)/m);
  assert.equal(owedAt(r2, loadConfig(r2), { ls: null, ref: 'origin/tranche' }).owed, 'the last round (plan close) closed, not yet walked');
  // Without an internal walk (none set, or Bob's exemption): deploy dev, as before.
  const { root: r3 } = withOrigin({ ...LIVE({ plan: 'close' }), 'out/.gitignore': '*\n' });
  opened(r3);
  git(['push', '-q', 'origin', 'main'], { cwd: r3 });
  push(r3, { 'x.txt': 'past main\n' });
  const b = roundCloseRun(r3, { log: quiet, io: { ...rio, deployDev: () => { throw new (class extends Error {})('wrangler: not authenticated'); } } });
  assert.equal(b.act, ROUND_ACT);
  assert.match(b.owed, /the last round \(plan close\) closed, not yet deployed/);
});

// C43 (BD-R1, Bob, 8 Nov): "This successive set of rounds continues until an internal walk doesn't
// find flaws, the release deployment happens, and the walk of the release also doesn't identify
// flaws." A round whose internal walk finds flaws closes with no deploy and no live walk, and the next
// round opens on its marks; a clean internal walk makes the release path the next act; nothing else
// owes a live walk.
test('rounds with an internal walk: flaws close the round with no deploy or live walk, the next round opens on its marks; a clean walk makes the release path the one next act; no live walk owed elsewhere', () => {
  const inner = node(`const fs = require('fs'); fs.mkdirSync('out/local', { recursive: true }); const ok = fs.existsSync('fixed'); fs.writeFileSync('out/local/report.json', JSON.stringify({ steps: [{ ok }], failures: ok ? [] : [{ kind: 'step' }] })); process.exit(ok ? 0 : 1)`);
  const dep = { ...DEP, internal_walk: { run: inner, reports: ['out/local/report.json'] } };
  const REL = { checks: [['true']], assemble: ['true'], out: 'out/rel' };
  const { root, bare } = withOrigin({
    'process/config.json': { deploy: dep, release: REL },
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n',
    'build/requirements/a.md': 'all met\n', 'process/ledger/a.json': done('a'), 'test/a/x.test.mjs': PASS, 'out/.gitignore': '*\n',
  });
  opened(root);
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  push(root, { 'x.txt': 'the tranche past main\n' });
  const state = (files) => { onState(root, files); git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root }); };
  const rio = { repo, compare: () => null, status: statusIO, deploy: io };
  const noLive = () => assert.throws(() => { git(['checkout', '-q', '--detach', 'origin/tranche'], { cwd: root }); deployDev(root, { io, repo, log: quiet }); }, /no development deployment now: with an internal walk configured/);
  // Round 1 closed: the internal walk is owed, as walk round.
  let v = see(root);
  assert.match(v.text, /FIRST: the round-close run is owed \(the first round closed, not yet walked\): node \S+ walk round/);
  assert.equal(v.s.release, null);
  noLive();
  // The round-close run: the internal walk alone, with a flaw. No deploy, no live walk.
  const r1 = roundCloseRun(root, { log: quiet, io: rio, by: 'layer merge 1' });
  assert.deepEqual([r1.ran, r1.ok], [true, false]);
  assert.deepEqual(rows(bare), [], 'no deploy row');
  const w1 = rows(bare, 'round-walk').at(-1);
  assert.deepEqual([w1.slug, w1.internal_walk.failures], ['internal-l1', 1]);
  v = see(root);
  assert.doesNotMatch(v.text, /round-close run is owed|release path is next/);
  assert.match(v.text, /tranche close waits: the latest internal walk \(internal-l1 \w{10}\) walked with 1 finding\(s\), 0 recorded/);
  noLive();
  // Its finding recorded against a: round 2 opens on a's marks; nothing owed, no live walk.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['reset', '-q', '--hard', 'origin/tranche'], { cwd: root });
  push(root, { 'build/requirements/a.md': `all met\n- **F1** *(not yet met: internal walk internal-l1 ${w1.commit.slice(0, 10)})* step\n` });
  v = see(root);
  assert.doesNotMatch(v.text, /round-close run is owed|release path is next/);
  assert.equal(v.s.deploy, null);
  assert.match(v.text, /layer flow: round 2 · layer 1 \(internal layer 2\) \(from the walk internal-l1 \w{10}; a\) is next and not open/);
  assert.throws(() => trancheClose(root, { slug: repo, io: closeIO, log: quiet }), /tranche close waits: the walk internal-l1 \w{10} ended round 1; round 2 opens from its findings: round 2 · layer 1 \(internal layer 2\) for a/);
  noLive();
  // Round 2's layer opens and merges with a's fix: its internal walk is owed, and only that.
  state({ 'layerflow/2/open.json': JSON.stringify({ row: 'open', layer: 2, tranche: 'tranche', at: new Date().toISOString(), round: { n: 2, of: 1, mods: ['a'], items: [] } }) });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['reset', '-q', '--hard', 'origin/tranche'], { cwd: root });
  push(root, { 'build/requirements/a.md': 'all met\n', fixed: 'x\n' });
  state({ 'layerflow/2/merged.json': JSON.stringify({ row: 'merged', layer: 2, at: new Date().toISOString() }) });
  v = see(root);
  assert.match(v.text, /FIRST: the round-close run is owed \(round 2 closed since \w{10} was walked\): node \S+ walk round/);
  noLive();
  const r2 = roundCloseRun(root, { log: quiet, io: rio, by: 'layer merge 2' });
  assert.deepEqual([r2.ran, r2.ok], [true, true]);

// A box of 2 larches came through Corrie.

  assert.deepEqual(rows(bare), [], 'still no deploy row');
  const w2 = rows(bare, 'round-walk').at(-1);
  assert.equal(w2.slug, 'internal-l2');
  // Clean: the release path is the one next act; no further walk is owed, and none runs.
  v = see(root);
  assert.doesNotMatch(v.text, /round-close run is owed/);
  assert.match(v.text, new RegExp(`FIRST: the release path is next \\(round 2's internal walk internal-l2 ${w2.commit.slice(0, 10)} is clean, and no release is cut since\\): node \\S+ release dev, from a clean checkout of the tranche tip \\(the cut, signed release\\), then node \\S+ deploy release <version>, its release deployment and live walk \\(BD-R1\\)`));
  const said = [];
  const again = roundCloseRun(root, { log: (m) => said.push(m), io: rio });
  assert.equal(again.ran, false);
  assert.match(again.release.act, /release dev/);
  assert.match(said.join('\n'), /the one next act is the release path/);
  noLive();
  // The release cut after it: its deployment and live walk are next, a named gap today.
  const later = new Date(Date.parse(w2.at) + 1000).toISOString();
  state({ 'releases/dev.jsonl': `${JSON.stringify({ row: 'dev-release', tranche: 'tranche', version: 'v1', conclusion: 'success', commit: w2.commit, at: later })}\n` });
