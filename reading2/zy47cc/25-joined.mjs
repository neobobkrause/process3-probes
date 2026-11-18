// ===== file: found.test.mjs (continued) =====

  const root = repo();
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  // Printed, then written and pushed on its branch (BOB's steps 1 to 3): the next is F2.
  const one = found(root, 'q2', 'one', { log: quiet });
  assert.equal(one.mark, 'F1');
  const back = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', one.branch, 'tranche'], { cwd: root });
  found(root, 'q2', 'one', { write: true, log: quiet });
  git(['commit', '-qam', 'found: q2 F1'], { cwd: root });
  git(['push', '-q', 'origin', one.branch], { cwd: root });
  git(['checkout', '-q', back], { cwd: root });
  git(['branch', '-q', '-D', one.branch], { cwd: root });
  assert.equal(found(root, 'q2', 'two', { log: quiet }).mark, 'F2');
  // Written in the checkout (--write), not yet pushed: the next counts it too.
  assert.equal(found(root, 'q2', 'two', { write: true, log: quiet }).mark, 'F2');
  const third = found(root, 'q2', 'three', { write: true, log: quiet });
  assert.equal(third.mark, 'F3');
  assert.equal((readFileSync(join(root, 'build/requirements/q2.md'), 'utf8').match(/\*\*F2\*\*/g) || []).length, 1);
  // Another module's branches do not count.
  assert.equal(found(root, 'base', 'x', { log: quiet }).mark, 'F1');
});

test('found: a module with no requirement file gets a found-work entry; one that names no module goes to no-module; unknown modules and marks in the text are refused', () => {
  const root = repo();
  const out = [];
  const r = found(root, 'reader', 'ROLLOUT NOT CONFIRMED on reader-container', { from: 'deploy p3dev-l1', offline: true, log: (l) => out.push(l) });
  assert.equal(r.file, 'process/found/reader.md');
  assert.equal(r.mark, 'F1');
  assert.match(out.join('\n'), /its found-work entry, since the module has no requirement file \(build\/requirements\/reader\.md\)/);
  const n = found(root, null, 'LOGIN_FAILED: founder sign-in answers HTTP 200 without a session', { from: 'walk p3dev-l1', offline: true, log: quiet });
  assert.equal(n.file, NO_MODULE);
  assert.equal(n.branch, 'found/no-module-f1');
  assert.throws(() => found(root, 'nobody', 'x', { offline: true, log: quiet }), /nobody is not a module on the working tree .*found "<finding>" --from <source>/);
  assert.throws(() => found(root, 'q2', 'see **R2** *(not yet met', { offline: true, log: quiet }), /must not hold a mark/);
  assert.throws(() => found(root, 'q2', 'x', { from: 'walk (l1)', offline: true, log: quiet }), /parentheses/);
  assert.throws(() => found(root, 'q2', ' ', { offline: true, log: quiet }), /the finding must be text/);
});

test('found marks: parsed as unmet marks by the job and the cap, read back with their source', () => {
  const t = `${unmet(1)}${F(2)}- **F1** met\n`;
  assert.deepEqual(markedIds(t), ['R1', 'F2']);
  // The shared parser (util's requirementMarks) reads found marks, a parenthetical before the mark included.
  assert.deepEqual(requirementMarks('- **F4** (walk p3dev-l1) *(not yet met: walk)* x\n- **F3** met\n'), { all: ['F4', 'F3'], unmet: ['F4'] });
  assert.equal(nextFound(t), 3);
  assert.deepEqual(foundMarks(t), [{ id: 'F2', source: 'walk p3dev-l1', finding: 'founder sign-in answers HTTP 200 without a session' }]);
  assert.match(overCap({ requirements_cap: null, requirements_cap_marks: 1 }, 'f.md', t) || '', /2 unmet marks/);
  assert.equal(addFound(null, '- **F1** x', 'Found work for r'), '# Found work for r\n\n- **F1** x\n');
  assert.equal(addFound('# a\n', '- **F1** x', 't'), '# a\n- **F1** x\n');
  assert.throws(() => addFound('# a', '- **F1** x', 't'), /does not end in a newline/);
});

test('status: found work is next work as soon as its module is ready by open_by uses, whatever its layer, marked found; it never reopens or holds a layer', () => {
  // base (layer 1, closed with no unmet requirement marks) gets a walk finding; layer 2 is open.
  const root = repo({}, {
    'build/requirements/base.md': unmet(0) + F(1),
    'process/found/reader.md': `# Found work for reader\n\n## Found work\n\n${F(1, 'deploy p3dev-l1', 'ROLLOUT NOT CONFIRMED on reader-container')}`,
    [NO_MODULE]: `# Found work that names no module\n\n## Found work\n\n${F(1, 'walk p3dev-l1', 'LOGIN_FAILED')}`,
  });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 2, 'a found mark does not reopen a closed layer');
  const t = out.join('\n');
  assert.match(t, /next work, layer 2 .*\n- build\/requirements\/p2\.md: 2 \(layer 2\)\n/);
  // u3 (layer 3) is ready by its uses: owed to its layer, never started early (the coordinator's ruling, 6 Nov).
  assert.match(t, /owed to their own layers [^\n]*:\n- build\/requirements\/u3\.md: 1 \(layer 3\): owed to layer 3\n/);
  assert.match(t, /found work \(work found elsewhere, ready by open_by uses, whatever its layer;[^\n]*: all 2 listed\n/);
  assert.match(t, /\n- build\/requirements\/base\.md: 1 \(layer 1\); found F1\n/);
  assert.match(t, /- process\/found\/reader\.md: 1; found F1; no requirement file: BOB gives the module its requirement file and ledger entry/);
  // base has found work, so f4 (uses base) waits; u4 (uses p2, unmet) waits; x3 (no uses) waits for layer 3.
  assert.doesNotMatch(t, /(f4|u4|x3)\.md: /);
  assert.match(t, /found, no module \(process\/found\/no-module\.md; BOB's act: name its module with `node \.process\/tool\/p3\.mjs found <module> "<finding>" --from "<source>"`, deleting its line here in the same pull request\):\n- F1 \(walk p3dev-l1\): LOGIN_FAILED/);
  assert.ok(r.next.some((x) => x.found_no_module === 'F1'), 'BOB\'s act is counted as work');
  assert.deepEqual(r.next.filter((x) => x.found).map((x) => x.file).sort(), ['build/requirements/base.md', 'process/found/reader.md']);
  // base's found work done: f4 (layer 4) is ready by its uses: owed to layer 4, its found mark named.
  const later = repo({}, { 'process/found/reader.md': '# r\n' });
  const o2 = [];
  const r2 = status(later, { role: 'bob', offline: true, log: (m) => o2.push(m) });
  assert.match(o2.join('\n'), /- build\/requirements\/f4\.md: 1 \(layer 4\): owed to layer 4; found F1\n?/);
  assert.equal(r2.layer.cur.n, 2);
  // The open layer closes past found work: q2 with only a found mark does not hold layer 2's close.
  const q = repo({}, { 'build/requirements/p2.md': unmet(0), 'build/requirements/q2.md': unmet(0) + F(1) });
  const r3 = status(q, { role: 'bob', offline: true, log: quiet });
  assert.equal(r3.layer.cur.n, 3, 'layer 2 had no requirement marks: closed, its found work still listed');
  assert.ok(r3.next.some((x) => x.file === 'build/requirements/q2.md' && x.found), 'q2 listed as found work');
});

test('status: open_by layer lists found work of the open and closed layers only; an open job takes it off the list', () => {
  const root = repo({ open_by: 'layer' }, { 'build/requirements/base.md': unmet(0) + F(1) });
  const next = status(root, { role: 'bob', offline: true, log: quiet }).next;
  assert.deepEqual(next.filter((x) => x.found).map((x) => x.file), ['build/requirements/base.md']);
  const busy = repo({}, { 'build/requirements/base.md': unmet(0) + F(1), 'process/ledger/base.json': entry('base', { requirements: 'build/requirements/base.md' }) });
  assert.ok(!status(busy, { role: 'bob', offline: true, log: quiet }).next.some((x) => x.file === 'build/requirements/base.md'));
});

test('report tranche: found work in the record is counted, per module and with no module', () => {
  const root = makeRepo({ ...FILES, 'process/config.json': { modules_file: 'build/modules.json' }, [NO_MODULE]: `# n\n\n${F(1)}`, 'process/found/reader.md': `# r\n\n${F(1)}- **F2** met\n` });
  const md = trancheReport(root, loadConfig(root), { now: '2026-11-04T12:00:00Z', io: { merged: () => null } });
  assert.match(md, /## Found work\n/);
  assert.match(md, /Found marks 6; unmet 5;/);
  assert.match(md, /\| reader \| 2 \| F1 \|/);
  assert.match(md, /\| \(no module\) \| 1 \| F1 \|/);
  assert.match(md, /\| f4 \| 1 \| F1 \|/);
});

// Copy, 6 Nov: BOB previewed found op-capabilities (no --write), cut its branch as step 1 printed,
// and the --write run numbered the mark F2; PR 664 renumbered it by hand.
test('found: a preview\'s branch, cut as step 1 prints it with nothing written, is the same mark, local or pushed: the --write run keeps F1', () => {
  const root = repo();
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const preview = found(root, 'q2', 'one', { log: quiet });
  assert.equal(preview.mark, 'F1');
  git(['switch', '-q', '-c', preview.branch, 'tranche'], { cwd: root });
  assert.equal(found(root, 'q2', 'one', { log: quiet }).mark, 'F1', 'the local branch holds nothing written');
  git(['push', '-q', 'origin', preview.branch], { cwd: root });
  const w = found(root, 'q2', 'one', { write: true, log: quiet });
  assert.deepEqual([w.mark, w.branch], ['F1', preview.branch], 'pushed with nothing written: still the same mark');
  assert.match(readFileSync(join(root, 'build/requirements/q2.md'), 'utf8'), /\*\*F1\*\* \*\(not yet met: [^)]*\)\* one/);
  // Once committed there, it is written: another finding is F2.
  git(['commit', '-qam', 'found: q2 F1'], { cwd: root });
  git(['push', '-q', 'origin', preview.branch], { cwd: root });
  git(['switch', '-q', 'tranche'], { cwd: root });
  assert.equal(found(root, 'q2', 'two', { log: quiet }).mark, 'F2');
});

// ===== file: generated-plain.test.mjs (later part) =====

test('merge --plain needs the refresh row on the base as it is now', () => {
  const p = product({ [BUNDLE]: fresh(SRC) });
  const g = gateIO();
  gateOn(p, g);
  back(p);
  git(['checkout', '-q', 'tranche'], { cwd: p.root });
  commit(p.root, { 'README.md': 'the tranche moved\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: p.root });
  git(['checkout', '-q', 'main'], { cwd: p.root });
  assert.throws(() => mergePlain(p.root, 148, { ...q, io: plainIO(p, g.state.comments, g.io.verify).io }), /against tranche as it is regenerated them byte-identical \(its newest run: identical\); tranche moved since its newest run: give the gate a new event on the base as it is/);
});

test('a row that builds an uncommitted path and writes a refreshed one is regenerated after the removal (review 2 of PR 95)', () => {
  const both = "import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';\nmkdirSync('src/alpha/dist', { recursive: true });\nwriteFileSync('src/alpha/dist/alpha.bundle.json', JSON.stringify({ from: readFileSync('src/alpha/index.mjs', 'utf8') }) + '\\n');\nwriteFileSync('src/alpha/dist/rows.mjs', 'export default 1;\\n');\n";
  const p = product({ [BUNDLE]: fresh(SRC) });
  git(['checkout', '-q', '-f', 'tranche'], { cwd: p.root });
  const base2 = commit(p.root, { 'gen.mjs': both, '.gitignore': 'src/alpha/dist/rows.mjs\n', 'process/config.json': { generated: [{ ...CONFIG.generated[0], paths: [BUNDLE, 'src/alpha/dist/rows.mjs'] }] } });
  git(['checkout', '-q', 'bob/refresh'], { cwd: p.root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: p.root });
  const head = git(['rev-parse', 'HEAD'], { cwd: p.root });
  const r = gate(p.root, { base: base2, head, branch: 'bob/refresh', pr: 148, slug: 'o/r', io: gateIO().io, log: quiet });
  assert.deepEqual(r.run.built, ['src/alpha/dist/rows.mjs']);
  assert.equal(r.run.refresh.result, 'identical', JSON.stringify(r.findings));
});

test('a refresh compares every generated file it changes, those no module owns too (review 3 of PR 95)', () => {
