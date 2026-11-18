  assert.match(a.text, /next: BOB starts each job above \(create_session for its session, then the `job start` command\)/);
  // Named as Bob reads it (9 Nov): tranche · round 2 · layer 3 (the map's last it passes over), the internal number in parentheses.
  assert.match(a.text, /tranche tranche · round 2 · layer 3 \(internal layer 4\): 2 module\(s\)/);
  assert.equal(layerArg({ _: [], round: '2', layer: '3' }, root), 4);
  assert.equal(layerArg({ _: [], round: '2', 'plan-layer': '3' }, root), 4);
  assert.equal(layerArg({ _: ['4'] }, root), '4');
  assert.throws(() => layerArg({ _: [], round: '2', 'plan-layer': '1' }, root), /no layer is tranche tranche · round 2 · layer 1/);
  assert.throws(() => layerArg({ _: ['4'], round: '2', 'plan-layer': '1' }, root), /name the layer once/);
  // Again, while the layer is open: its jobs, nothing recorded twice.
  const again = run(root, io, { apply: true });
  assert.deepEqual([again.state, again.layer], ['layer', 4]);
  assert.equal(made.length, 1);
  // b's job meets its marks (d's owed reopen is held by the layer); layer 4 merges: no second layer, the round's walk is next.
  push(root, { 'req/b.md': `${req('b')}- **F1** met\n- **F2** met\n` }, 'b met');
  merged(root, 4, 30);
  const nxt = run(root, io, { apply: true });
  assert.equal(nxt.state, 'walk');
});

test('round next: run again after a partial run, it goes on where it stopped', () => {
  const root = product();
  walked(root, { failures: FLAWS, min: 10 });
  const { io, made, prs } = gh(root, { failMerge: 1 });
  // The merge of the marks' pull request fails: the owed reopen is recorded, the pull request open.
  assert.throws(() => run(root, io, { apply: true }), /the gate did not finish in time/);
  assert.equal(owedReopens(root, loadConfig(root)).length, 1);
  assert.equal(prs.length, 1);
  assert.equal(flowRows(root, SB, 4).open, null);
  // The dry run sees both: the reopen recorded, the marks in the open pull request.
  const d = run(root, io);
  assert.match(d.text, /- recorded, owed reopen/);
  assert.match(d.text, /- in an open pull request, found mark in req\/b\.md: the b button overlaps the footer/);
  // Again: no second pull request, no second owe; the open one is merged and the layer opens.
  const a = run(root, io, { apply: true });
  assert.equal(made.length, 1);
  assert.equal(prs.length, 0);
  assert.equal(owedReopens(root, loadConfig(root)).length, 1);
  assert.deepEqual([a.state, a.layer], ['opened', 4]);
  assert.equal((reqAt(root, 'b').match(/\*\*F\d\*\*/g) || []).length, 2, 'each mark once');
});

test('round next: the marks pushed and their pull request not opened: a re-run opens it from that branch, pushing no second one', () => {
  const root = product();
  walked(root, { failures: FLAWS.slice(0, 3), min: 10 });
  const { io, made } = gh(root, { failCreate: 1 });
  assert.throws(() => run(root, io, { apply: true }), /GitHub did not return a pull request/);
  const heads = () => git(['ls-remote', '--heads', 'origin', 'refs/heads/found/*'], { cwd: root }).split('\n').filter(Boolean).length;
  assert.equal(heads(), 1);
  const a = run(root, io, { apply: true });
  assert.deepEqual([a.state, a.layer], ['opened', 4]);
  assert.equal(heads(), 1, 'no second branch');
  assert.equal(made.length, 1);
  assert.match(a.text, /was pushed by an earlier run with no pull request: pull request \d+ opened from it/);
  assert.equal((reqAt(root, 'b').match(/\*\*F\d\*\*/g) || []).length, 2, 'each mark once');
});

test('round next: a conflicted marks pull request is closed and the marks cut again; a printed found act\'s number is skipped; findings recorded under other words wait on BOB', () => {
  const root = product();
  const row = walked(root, { failures: FLAWS.slice(0, 3), min: 10 });
  // BOB's own `found b ...` act, its branch pushed with F1 and not yet merged: round next numbers past it.
  git(['push', '-q', 'origin', 'origin/tranche:refs/heads/found/b-f1'], { cwd: root });
  git(['checkout', '-q', '-b', 'fb', 'origin/tranche'], { cwd: root });
  commit(root, { 'req/b.md': `${req('b')}- **F1** *(not yet met: review)* other\n` }, 'found b F1');
  git(['push', '-q', '-f', 'origin', 'fb:refs/heads/found/b-f1'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const { io, prs, closed, conflicted, made } = gh(root, { failMerge: 1 });
  assert.throws(() => run(root, io, { apply: true }), /the gate did not finish/);
  assert.match(git(['show', `origin/${made[0].head}:req/b.md`], { cwd: root }), /\*\*F2\*\*[^\n]*the b button[^\n]*\n- \*\*F3\*\*/);
  // The tranche moves under it: GitHub finds it conflicted; the re-run closes it and cuts the marks again.
  conflicted.add(prs[0].number);
  const a = run(root, io, { apply: true });
  assert.deepEqual(closed, [made[0].number]);
  assert.equal(made.length, 2);
  assert.match(made[1].head, /^found\/round-2-internal-w\d+-2$/);
  assert.deepEqual([a.state, a.layer], ['opened', 4]);
  // A walk whose findings are part recorded by hand, in other words: nothing is recorded again.
  const root2 = product();
  const r2 = walked(root2, { failures: FLAWS.slice(0, 3), min: 10 });
  push(root2, { 'req/b.md': `${req('b')}- **F1** *(not yet met: internal walk ${r2.slug} ${r2.commit.slice(0, 10)})* b's footer, as BOB put it\n` });
  const g2 = gh(root2);
  const d = run(root2, g2.io);
  assert.match(d.text, /1 finding\(s\) of this walk are recorded under other words[^\n]*the 2 not yet recorded/);
  assert.throws(() => run(root2, g2.io, { apply: true }), /recorded under other words[^\n]*; nothing was recorded/);
  assert.equal(g2.made.length, 0);
  void row;
});

test('round next: PD-16, a deploy dev run whose internal walk found flaws sets its live arm aside; findings no module owns wait on BOB\'s file', () => {
  const root = product();
  walked(root, { row: 'dev-deploy', failures: [{ module: 'c', kind: 'step', message: 'c 404s' }, { kind: 'step', message: 'somewhere' }], live: 7, min: 10 });
  const { io, made } = gh(root);
  const d = run(root, io);
  assert.match(d.text, /2 finding\(s\), 0 recorded; the live arm's 7 set aside: its internal walk found flaws, so they hold no round \(PD-16\)/);
  assert.doesNotMatch(d.text, /- to record[^\n]*the live arm/);
  assert.match(d.text, /\(no module\):\n {4}- to record, no module: somewhere/);
  assert.match(d.text, /1 finding\(s\) name no known module \(somewhere\): give their modules in a file of `<module>: <text>` lines/);
  assert.throws(() => run(root, io, { apply: true }), /name no known module[^\n]*; nothing was recorded/);
  assert.equal(made.length, 0);
  // BOB's file places it; the round's one layer holds b and c (PD-24).
  const f = join(mkdtempSync(join(tmpdir(), 'p3-findings-')), 'f.txt');
  writeFileSync(f, 'b: the b page is somewhere it should not be\n');
  const a = run(root, io, { apply: true, findingsFile: f });
  assert.deepEqual([a.state, a.layer], ['opened', 4]);
  assert.deepEqual(flowRows(root, SB, 4).open.round.mods, ['b', 'c'], 'b (map layer 1) and c (map layer 2) in one layer; a, the live arm\'s module, not flawed');
  assert.match(reqAt(root, 'c'), /\*\*F1\*\* \*\(not yet met: internal walk internal-w\d+ \w{10}\)\* c 404s$/);
  assert.match(reqAt(root, 'b'), /\*\*R3\*\* c\n- \*\*F1\*\* \*\(not yet met: internal walk internal-w\d+ \w{10}\)\* the b page is somewhere it should not be$/);
  assert.equal(reqAt(root, 'a'), req('a').trimEnd(), 'the live arm\'s findings recorded nowhere');
});

test('round next: a clean walk opens no round and prints the release path', () => {
  const root = product();
  push(root, { 'process/config.json': { merge_strategy: 'layer', release: { checks: [['true']], assemble: ['true'], out: 'out/rel' } } }, 'releases cut');
  walked(root, { failures: [], min: 10 });
  const r = run(root, gh(root).io, { apply: true });
  assert.equal(r.state, 'clean');
  assert.match(r.text, /the walk internal-w\d+ \w{10} is clean: no round opens; the release path is next \(round 1's internal walk internal-w\d+ \w{10} is clean, and no release is cut since\): node \.process\/tool\/p3\.mjs release dev, from a clean checkout of the tranche tip/);
  assert.equal(flowRows(root, SB, 4).open, null);
  // Under plan close no round opens: round next says so, whatever the walk found.
  push(root, { 'process/config.json': { merge_strategy: 'layer', plan: 'close' } }, 'plan close');
  assert.throws(() => run(root, gh(root).io), /the plan is close on tranche: the current round is the last, and no round opens/);
});

// The rehearsal: the round loop end to end on a fixture product, the round's walks the real `walk
// round` (an internal walk whose report names a flaw in b and in d until each is fixed), so a cycle
// like C44's (found, job start and layer open each waiting on another) is caught here, not in the product.
const node = (code) => ['node', '-e', code];
const GUARD = 'p3dev guard: passed';
const WALKER = node(`const fs = require('fs'); fs.mkdirSync('out', { recursive: true }); const f = [];
if (!fs.existsSync('fixed-b')) f.push({ module: 'b', kind: 'layout', message: 'the b button overlaps the footer' }, { module: 'b', kind: 'layout', message: 'the b button overlaps the footer' });
if (!fs.existsSync('fixed-d')) f.push({ module: 'd', kind: 'step', message: 'the d form loses its draft' });
fs.writeFileSync('out/report.json', JSON.stringify({ steps: [{ ok: !f.length }], failures: f })); process.exit(f.length ? 1 : 0);`);
test('round next rehearsal: round close walk with flaws, round next, jobs, layer merge, the next layer, the round\'s walk clean, the release path', () => {
  const root = product();
  push(root, { 'process/config.json': { merge_strategy: 'layer', deploy: { slug_prefix: 'p3dev-', dry_run: [node(`console.log(${JSON.stringify(GUARD)})`)], deploy: [node('1')], walk: [node('1')], guard_line: GUARD, internal_walk: { run: WALKER, reports: ['out/report.json'] } } }, 'out/.gitignore': '*\n' }, 'the internal walk');
  const { io } = gh(root);
  const walkIO = { compare: () => null, status: { openPRs: () => [], checkRun: () => null, compare: () => null } };
  const tip = () => { git(['checkout', '-q', 'tranche'], { cwd: root }); git(['merge', '-q', '--ff-only', 'origin/tranche'], { cwd: root }); };
  const walk = () => { tip(); const out = []; const r = walkRound(root, { io: walkIO, repo: 'o/p', log: (l) => out.push(String(l)) }); return { ...r, text: out.join('\n') }; };
  const now = () => new Date().toISOString();
  const mergedNow = (n) => { writeRows(root, SB, `merged ${n}`, [[`layerflow/${n}/merged.json`, { row: 'merged', layer: n, commit: 'f'.repeat(40), at: now() }]]); fetchState(root, SB, { fresh: true }); };
  // Round 1 closed: its walk finds flaws in b (map layer 1) and d (map layer 3, pinned); it names round next.
  const w1 = walk();
  assert.equal(w1.ok, false);
  assert.match(w1.text, /the one next act: `node \.process\/tool\/p3\.mjs round next`/);
  const o4 = run(root, io, { apply: true });
  // PD-24: round 2 is one layer, b and d (map layers 1 and 3) starting at once.
  assert.deepEqual([o4.state, o4.layer, o4.startable.map((x) => x.id).sort()], ['opened', 4, ['b', 'd']]);
  const cmdOf = (id) => o4.startable.find((x) => x.id === id).cmd;
  assert.match(cmdOf('b'), /--reopen "F1: the b button overlaps the footer \(internal walk internal-l3 \w{10}, covers 2\)"/);
  assert.match(cmdOf('d'), /--reopen "O1: the d form loses its draft \(internal walk internal-l3 \w{10}; owed reopen/);
  // b's job: its mark met and its fix; d's job takes its owed reopen as its own F mark, met; layer 4
  // merges: the round's walk is owed, no second layer.
  push(root, { 'req/b.md': `${req('b')}- **F1** met\n`, 'fixed-b': 'x\n', 'req/d.md': `${req('d')}- **F1** met\n`, 'fixed-d': 'x\n' }, 'b and d fixed');
  mergedNow(4);
  const w = run(root, io, { apply: true });
  assert.equal(w.state, 'walk');
  assert.match(w.text, /every layer of round 2 has merged: its walk ends it, the round-close run/);
  // Round 2's walk is clean: no round 3; the release path.
  const w2 = walk();
  assert.equal(w2.ok, true);
  const c = run(root, io, { apply: true });
  assert.equal(c.state, 'clean');
  assert.match(c.text, /no round opens; the release path follows/);
  assert.equal(flowRows(root, SB, 6).open, null);
