// Bob, 4 Nov: the deploy and walk at a round close only, never between layers; it never holds
// job starts. The live shape: layer 4 closed, layers 5 to 11 open.
const LIVE = (config = {}) => {
  const mods = [4, 5, 6, 7, 8, 9, 10, 11];
  return {
    'process/config.json': { deploy: DEP, completion_file: 'build/round.md', ...config },
    'build/layers.md': `| layer | what | modules |\n|---|---|---|\n${mods.map((n) => `| ${n} | l${n} | m${n} |`).join('\n')}\n`,
    ...Object.fromEntries(mods.map((n) => [`build/requirements/m${n}.md`, unmet])),
    'build/round.md': '# Completion round\n',
    'process/ledger/m4.json': done('m4'),
    'test/m4/x.test.mjs': PASS,
  };
};
const see = (root) => { const out = []; const s = status(root, { role: 'bob', log: (m) => out.push(m), io: statusIO }); return { s, text: out.join('\n') }; };
const push = (root, files) => { commit(root, files); git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root }); };
const opened = (root) => { openPassed(root); git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root }); };
const closeIO = { compare: () => null, status: { ...statusIO, prFiles: () => [] } };

test('deploy dev between layers: layer 4 closed, 5 to 11 open (the first round open): refused, status owes none and lists next work; plan close (the last round): owed beside next work', () => {
  const { root } = withOrigin(LIVE());
  opened(root);
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  push(root, { 'x.txt': 'the tranche past main\n' });
  assert.equal(closeLayer(root, '4').ok, true);
  git(['checkout', '-q', 'origin/tranche'], { cwd: root });
  assert.throws(() => deployDev(root, { io, repo, log: quiet }), /no development deployment now: a round's walk belongs to its close, never between layers \(the first round is open: layers 5, 6, 7, 8, 9, 10, 11 not closed\); it becomes due when the round closes/);
  const before = see(root);
  assert.equal(before.s.deploy, null);
  assert.doesNotMatch(before.text, /round-close run is owed/);
  assert.match(before.text, /build\/requirements\/m5\.md: 1 \(layer 5\)/);
  // A partial close named by the plan: the end of the tranche. Owed, and next work still listed.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['reset', '-q', '--hard', 'origin/tranche'], { cwd: root });
  push(root, { 'process/config.json': { deploy: DEP, completion_file: 'build/round.md', plan: 'close' } });
  const after = see(root);
  assert.match(after.text, /FIRST: the round-close run is owed \(the last round \(plan close\) closed, not yet deployed\): node \.process\/tool\/p3\.mjs deploy dev, from a clean checkout of the tranche tip \(the deploy and its walk\); job starts do not wait for it/);
  assert.match(after.text, /build\/requirements\/m5\.md: 1 \(layer 5\)/, 'next work beside the deploy act');
  assert.ok(after.s.next.length);
  assert.throws(() => trancheClose(root, { slug: repo, io: closeIO, log: quiet }), /the last round's walk is owed before the tranche closes: node \S+ deploy dev, from a clean checkout of the tranche tip \(the deploy and its walk\)/);
  const r = deployDev(root, { io, repo, log: quiet });
  assert.equal(r.ok, true);
  assert.equal(r.row.slug, 'p3dev-l4');
  assert.doesNotMatch(see(root).text, /round-close run is owed/);
});

test('a failed walk holds tranche close until its findings are recorded; a deploy row at the next round\'s close clears it', () => {
  const report = node(`const fs = require('fs'); fs.mkdirSync('out', { recursive: true }); const fixed = fs.existsSync('fixed'); fs.writeFileSync('out/report.json', JSON.stringify({ steps: [{ ok: true }, { ok: fixed }, { ok: fixed }], failures: fixed ? [] : [{ kind: 'http-500' }, { kind: 'layout' }] })); process.exit(fixed ? 0 : 1)`);
  const dep = { ...DEP, walk: report, walk_reports: ['out/report.json'] };
  const { root } = withOrigin({ ...LIVE({ plan: 'close', deploy: dep }), 'out/.gitignore': '*\n' });
  opened(root);
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  push(root, { 'x.txt': 'the tranche past main\n' });
  const f = deployDev(root, { io, repo, log: quiet });
  assert.equal(f.ok, false);
  assert.equal(f.row.stopped, 'walk');
  assert.equal(f.row.walk.failures, 2);
  const run = `p3dev-end ${f.row.commit.slice(0, 10)}`;
  const held = /tranche close waits: the latest deploy and walk \(p3dev-end \w{10}\) stopped at walk with 2 finding\(s\), 0 recorded/;
  assert.throws(() => trancheClose(root, { slug: repo, io: closeIO, log: quiet }), held);
  assert.match(see(root).text, held);
  assert.doesNotMatch(see(root).text, /round-close run is owed/, 'not owed again until its findings are worked');
  // One recorded: still held. Both (a found mark owed, and a known gap): the close goes on.
  push(root, { 'build/requirements/m5.md': `${unmet}- **F1** *(not yet met: walk ${run})* http-500 on /\n`, 'build/round.md': '- [ ] C-1 · m5 · F1\n' });
  assert.throws(() => trancheClose(root, { slug: repo, io: closeIO, log: quiet }), /2 finding\(s\), 1 recorded/);
  push(root, { 'build/round.md': `- [ ] C-1 · m5 · F1\n- [ ] C-2 · whole product · layout on ${run}; deferred: a known gap (Bob)\n` });
  assert.ok(trancheClose(root, { slug: repo, io: closeIO, log: quiet }).ok);
  assert.doesNotMatch(see(root).text, /round-close run is owed/, 'the round is open');
  // The completion round's job merges: F1 met, its item ticked. Held again until a fresh deploy.
  push(root, { 'build/requirements/m5.md': unmet, 'build/round.md': `- [x] C-1 · m5 · F1\n- [ ] C-2 · whole product · layout on ${run}; deferred: a known gap (Bob)\n`, fixed: 'x\n' });
  const owed = see(root).text;
  assert.match(owed, /FIRST: the round-close run is owed \(the last round \(plan close\) closed since \w+ was deployed\): node \.process\/tool\/p3\.mjs deploy dev, from a clean checkout of the tranche tip \(the deploy and its walk\); job starts do not wait for it/);
  const g = deployDev(root, { io, repo, log: quiet });
  assert.equal(g.ok, true);
  assert.equal(g.row.walk.failures, 0);
  assert.doesNotMatch(see(root).text, /tranche close waits|round-close run is owed/);
  assert.ok(trancheClose(root, { slug: repo, io: closeIO, log: quiet }).ok);
  assert.throws(() => deployDev(root, { io, repo, log: quiet }), /deployed and walked clean/);

  // A clean walk owes none when the tip moves after it (review: main into the tranche at its close).
  push(root, { 'y.txt': 'a plain pull request\n' });
  assert.doesNotMatch(see(root).text, /round-close run is owed/);
  // A later run that fails, the same slug: the earlier run's known gap does not record its findings.
  git(['rm', '-q', 'fixed'], { cwd: root });
  push(root, {});
  assert.equal(deployDev(root, { io, repo, log: quiet }).ok, false);
  assert.throws(() => trancheClose(root, { slug: repo, io: closeIO, log: quiet }), /2 finding\(s\), 0 recorded/);
});

test('deploy dev: a deploy row of an earlier tranche, its commit on main, does not count (review of PR 59)', () => {
  const { root } = withOrigin(product());
  const old = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/main'], { cwd: root });
  git(['fetch', '-q', 'origin', '+refs/heads/main:refs/remotes/origin/main'], { cwd: root });
  onState(root, { [DEPLOYS_FILE]: JSON.stringify({ row: 'dev-deploy', tranche: 'tranche', slug: 'p3dev-l1', commit: old, layer: 1, ok: true }) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  commit(root, { 'y.txt': 'y\n' });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: root });
  assert.equal(closeLayer(root, '1').ok, true);
  git(['checkout', '-q', 'origin/tranche'], { cwd: root });
  const r = deployDev(root, { io, repo, log: quiet });
  assert.equal(r.ok, true, 'the stale row on main does not make layer 1 deployed');
  assert.throws(() => deployDev(root, { io, repo, log: quiet }), /deployed and walked clean/);
});

// Review of the walk-report storage (4 Nov): reports are product-written, so untrusted.
test('readReport: only a regular file inside the checkout, written since the walk began, within max; its size known before it is read', () => {
  const root = mkdtempSync(join(tmpdir(), 'p3-rep-'));
  const outside = mkdtempSync(join(tmpdir(), 'p3-out-'));
  writeFileSync(join(outside, 'secret.txt'), 'credentials');
  mkdirSync(join(root, 'out'));
  writeFileSync(join(root, 'out/ok.txt'), 'fine');
  symlinkSync(join(outside, 'secret.txt'), join(root, 'out/link.txt'));
  symlinkSync(outside, join(root, 'dirlink'));
  symlinkSync('ok.txt', join(root, 'out/inner.txt'));
  mkdirSync(join(root, 'out/adir'));
  writeFileSync(join(root, 'out/big.txt'), '');
  truncateSync(join(root, 'out/big.txt'), 3 * 1024 * 1024 * 1024); // sparse: reading it whole would fail
  writeFileSync(join(root, 'out/old.txt'), 'old');
  utimesSync(join(root, 'out/old.txt'), 1, 1);
  const since = Date.now() - 60000;
  assert.deepEqual(readReport(root, 'out/ok.txt', since, 100), { raw: 'fine' });
  assert.deepEqual(readReport(root, 'out/inner.txt', since, 100), { raw: 'fine' });
  assert.match(readReport(root, 'out/link.txt', since, 100).stored, /outside the checkout/);
  assert.match(readReport(root, 'dirlink/secret.txt', since, 100).stored, /outside the checkout/);
  assert.match(readReport(root, 'out/adir', since, 100).stored, /not a regular file/);
  assert.equal(readReport(root, 'out/big.txt', since, 100).stored, `not stored, ${3 * 1024 * 1024 * 1024} bytes`);
  assert.equal(readReport(root, 'out/old.txt', since, 100).stored, 'not written by this walk');
  assert.equal(readReport(root, 'out/none.txt', since, 100).stored, 'not written by this walk');
  if (spawnSync('mkfifo', [join(root, 'out/fifo')]).status === 0) assert.match(readReport(root, 'out/fifo', since, 100).stored, /not a regular file/);
});

test('walkSummary: any shape of report.json gives counts or nothing, never a throw; kinds printable, short and at most 50', () => {
  for (const t of ['x', 'null', '5', '{"steps":"x"}', '{"failures":5}', '{"failures":{}}', '{"failures":[null, 3, "a"]}']) assert.doesNotThrow(() => walkSummary(t), t);
  assert.deepEqual(walkSummary('{"failures":[null]}'), { steps: 0, steps_ok: 0, failures: 1, by_kind: { '(none)': 1 } });
  const s = walkSummary(JSON.stringify({ failures: [{ kind: 'constructor' }, { kind: '__proto__' }, { kind: 'a\n::error::x' }, { kind: 'k'.repeat(500) }] }));
  assert.equal(s.by_kind.constructor, 1);
  assert.equal(s.by_kind.__proto__, 1);
  assert.equal(s.by_kind['a : :error: :x'], 1);
  assert.equal(Object.keys(s.by_kind).find((k) => k.startsWith('k')).length, 80);
  const many = walkSummary(JSON.stringify({ failures: Array.from({ length: 200 }, (_, i) => ({ kind: `k${i}` })) }));
  assert.equal(Object.keys(many.by_kind).length, 51);
  assert.equal(many.by_kind['(other kinds)'], 150);
  for (const p of ['.', 'out/', 'out/./r.txt', 'a//b', '/abs', '.gitignore', 'out/.git', '']) assert.throws(() => deployConfig(cfgWith({ ...DEP, walk_reports: [p] })), /walk_reports/, p);
  // BD-R5: the journeys the walker marks AI-assisted, from steps or journeys.
  assert.deepEqual(walkSummary(JSON.stringify({ steps: [{ journey: 'assist', ai: true, ok: true }, { journey: 'plain', ok: true }], journeys: [{ name: 'draft', ai: true }], failures: [] })).ai_journeys, ['assist', 'draft']);
  assert.equal(walkSummary(JSON.stringify({ steps: [{ journey: 'plain' }] })).ai_journeys, undefined);
  // journey-check's notes for the assistant steps it did not walk (walk.ai off).
  assert.deepEqual(walkSummary(JSON.stringify({ steps: [], walk: { notes: ['ask: not walked, the assistant does not work (K3717)', 'other note'] }, notes: ['draft: not walked, x'] })).not_walked, ['ask', 'draft']);
});

