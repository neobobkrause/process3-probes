test('merge refuses a later attempt no green run read, with the words that clear it', () => {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/a.mjs': 'x' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const io = {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: head } }),
    comments: () => [
      { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 3, sha: head }), user: { login: 'civicsmith' } },
      { id: 2, body: block(GATE, { runs: [{ sha: head, trigger: 'record-since-green', after: 'c'.repeat(40), ok: true, receipt: 'present', receipt_attempt: 2, run_id: 11 }] }), user: { login: BOT } },
    ],
    checkRun: () => ({ status: 'completed', conclusion: 'success' }),
    verify: () => true,
    mergePR: () => assert.fail('nothing merges'),
  };
  assert.throws(() => merge(root, 105, { slug: 'o/r', io, noReview: 'x', log: quiet }), /checked receipt attempt 3 and agreed with it; its newest run read attempt 2: give the gate on .* a new event \(edit the pull request\)/);
});

// Review 1 of PR 95.
test('a regenerate that writes nothing cannot pass a hand-edited file, and a changed generator is refused', () => {
  // The generator, unchanged, skips work when its output exists: the gate removes the file first.
  const lazy = "import { existsSync } from 'node:fs';\nif (!existsSync('src/alpha/dist/alpha.bundle.json')) await import('./gen-real.mjs');\n";
  const p = product({ [BUNDLE]: '{"from":"evil"}\n' });
  git(['checkout', '-q', '-f', 'tranche'], { cwd: p.root });
  const base2 = commit(p.root, { 'gen.mjs': lazy, 'gen-real.mjs': GEN });
  git(['checkout', '-q', 'bob/refresh'], { cwd: p.root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: p.root });
  const head = git(['rev-parse', 'HEAD'], { cwd: p.root });
  const r = gate(p.root, { base: base2, head, branch: 'bob/refresh', pr: 148, slug: 'o/r', io: gateIO().io, log: quiet });
  assert.equal(r.run.refresh.result, 'differs', JSON.stringify(r.run.refresh));
  assert.equal(r.run.ok, false);

  // A pull request that rewrites the generator to write nothing, with its "refreshed" file.
  const q2 = product({ [BUNDLE]: '{"from":"evil"}\n', 'gen.mjs': '// nothing\n' });
  const g = gateIO();
  const r2 = gateOn(q2, g);
  assert.equal(r2.run.refresh.result, 'other files changed');
  assert.match(r2.findings.find((f) => f.file === 'gen.mjs').message, /changes generated module files and gen\.mjs: a refresh may go beside only records, the modules file, the layers file and process\/config\.json; any other file could be what writes them/);
  back(q2);
  assert.throws(() => mergePlain(q2.root, 148, { ...q, io: plainIO(q2, g.state.comments, g.io.verify).io }), /changes generated module files and gen\.mjs: a refresh may go beside only records/);
  // Nor a file the generator imports, which no command names (review 2 of PR 95).
  const imp = product({ [BUNDLE]: '{"from":"evil"}\n', 'gen-lib.mjs': 'export default 1;\n' });
  const g3 = gateIO();
  assert.equal(gateOn(imp, g3).run.refresh.result, 'other files changed');
  back(imp);
  assert.throws(() => mergePlain(imp.root, 148, { ...q, io: plainIO(imp, g3.state.comments, g3.io.verify).io }), /and gen-lib\.mjs: a refresh may go beside only/);
});

// Build untrack-generated (copy PR 306, run 41905241074, 4 Nov): a committed generated file could
// never be untracked. A plain pull request may now remove it when the head's .gitignore ignores
// it: the gate builds it, runs its row's verify, and merge --plain takes the row; without the
// ignore line the removal is refused as before.
const untrack = (p, gitignore) => {
  git(['checkout', '-q', '-f', 'bob/refresh'], { cwd: p.root });
  if (gitignore !== undefined) commit(p.root, { '.gitignore': gitignore });
  git(['rm', '-q', '--cached', BUNDLE], { cwd: p.root });
  git(['commit', '-q', '-m', 'stop committing it'], { cwd: p.root });
  p.sha = git(['rev-parse', 'HEAD'], { cwd: p.root });
  git(['push', '-q', '-f', 'origin', 'bob/refresh'], { cwd: p.root });
  return p;
};
const VERIFIED = join(mkdtempSync(join(tmpdir(), 'p3-verified-')), 'count');
const COUNTING = { generated: [{ ...CONFIG.generated[0], verify: ['node', '-e', `require('fs').appendFileSync(${JSON.stringify(VERIFIED)}, 'v')`] }] };
const verified = () => { try { return readFileSync(VERIFIED, 'utf8').length; } catch { return 0; } };

test('untracking: base tracks the file and lists the row; head removes it and ignores it; the gate builds and verifies it, and merge --plain merges', () => {
  const p = untrack(product({ 'process/metrics/alpha.jsonl': '{}\n' }, COUNTING), `# built where it is needed\n${BUNDLE}\n`);
  const before = verified();
  const g = gateIO();
  const logs = [];
  const r = gate(p.root, { base: p.base, head: p.sha, branch: 'bob/refresh', pr: 148, slug: 'o/r', io: g.io, log: (l) => logs.push(l) });
  assert.deepEqual(r.findings, []);
  assert.deepEqual(r.run.built, [BUNDLE], 'built before the suite, as an untracked row is');
  assert.deepEqual(r.run.refresh, { files: [BUNDLE], result: 'identical', differ: [], untracked: [BUNDLE] });
  assert.equal(verified() - before, 1, "the row's verify ran once");
  assert.ok(logs.some((l) => /generated, untracked and built: src\/alpha\/dist\/alpha\.bundle\.json: .*exit 0/.test(l)), logs.join('\n'));
  assert.equal(readFileSync(join(p.root, BUNDLE), 'utf8'), fresh(SRC), 'the regenerate wrote it');
  back(p);
  const f = plainIO(p, g.state.comments, g.io.verify);
  assert.equal(mergePlain(p.root, 148, { ...q, io: f.io }).merged, true);
  // A row that does not name it untracked (an older gate's) is not taken.
  const old = gateIO();
  old.io.addComment('o/r', 148, gateComment({ ...r.run, refresh: { files: [BUNDLE], result: 'identical', differ: [] } }));
  assert.throws(() => mergePlain(p.root, 148, { ...q, io: plainIO(p, old.state.comments, old.io.verify).io }), /no green process-gate run/);
});

test('untracking: a path the base already ignores needs no .gitignore change', () => {
  const p = product({ 'process/metrics/alpha.jsonl': '{}\n' });
  git(['checkout', '-q', '-f', 'tranche'], { cwd: p.root });
  p.base = commit(p.root, { '.gitignore': `${BUNDLE}\n` });
  git(['checkout', '-q', 'bob/refresh'], { cwd: p.root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: p.root });
  untrack(p);
  const r = gateOn(p, gateIO());
  assert.deepEqual(r.findings, []);
  assert.deepEqual(r.run.refresh.untracked, [BUNDLE]);
});

test('untracking: the removal is refused without the ignore line, and when verify fails', () => {
  const p = untrack(product({ 'process/metrics/alpha.jsonl': '{}\n' }));
  const g = gateIO();
  const r = gateOn(p, g);
  assert.deepEqual([r.run.refresh.result, r.run.refresh.differ, r.run.refresh.untracked], ['differs', [BUNDLE], undefined]);
  // Copy PR 557's shape: only the removal, no ignore line; the finding names what is missing.
  assert.match(r.findings.find((f) => f.file === BUNDLE).message, /is removed, but no \.gitignore at this commit ignores it: to stop committing a generated file, add \/src\/alpha\/dist\/alpha\.bundle\.json to the root \.gitignore in the same pull request/);
  back(p);
  assert.throws(() => mergePlain(p.root, 148, { ...q, io: plainIO(p, g.state.comments, g.io.verify).io }), /no green process-gate run .*\(its newest run: differs/);
  // Another file's ignore line does not cover it.
  const o = untrack(product({ 'process/metrics/alpha.jsonl': '{}\n' }), 'other.json\n');
  const ro = gateOn(o, gateIO());
  assert.equal(ro.run.ok, false);
  assert.equal(ro.run.refresh.untracked, undefined);
  const bad = untrack(product({ 'process/metrics/alpha.jsonl': '{}\n' }, { generated: [{ ...CONFIG.generated[0], verify: ['node', '-e', 'process.exit(3)'] }] }), `${BUNDLE}\n`);
  const rb = gateOn(bad, gateIO());
  assert.equal(rb.run.refresh.result, 'generated failed');
  assert.match(rb.findings.map((f) => f.message).join('\n'), /failed \(exit 3\) after building the untracked src\/alpha\/dist\/alpha\.bundle\.json/);
});

test('untracking: copy PR 557 with its ignore line added, as the copy writes it (a comment and a leading slash), passes', () => {
  const p = untrack(product({ 'process/metrics/alpha.jsonl': '{}\n' }), `# built at layer close, deploy and release\n/${BUNDLE}\n`);
  const r = gateOn(p, gateIO());
  assert.deepEqual(r.findings, []);
  assert.deepEqual(r.run.refresh.untracked, [BUNDLE]);
});

test('untracking: a .gitignore line other than the untracked path, or a .gitignore elsewhere, is another file', () => {
  for (const [what, files] of [
    ['a wider pattern', { '.gitignore': `${BUNDLE}\n*.sql\n` }],
    ['a pattern covering it', { '.gitignore': 'src/alpha/dist/\n' }],
    ['another module\'s new .gitignore', { '.gitignore': `/${BUNDLE}\n`, 'src/beta/.gitignore': '*.sql\n' }],
    ['its bare name, which matches at every depth', { 'src/alpha/dist/.gitignore': 'alpha.bundle.json\n' }],
    ['a line git shows as +++', { '.gitignore': `${BUNDLE}\n++*\n` }],
  ]) {
    const p = product({ 'process/metrics/alpha.jsonl': '{}\n' });
    git(['checkout', '-q', '-f', 'bob/refresh'], { cwd: p.root });
    commit(p.root, files);
    untrack(p);
    const g = gateIO();
    const r = gateOn(p, g);
    assert.equal(r.run.ok, false, what);
    assert.equal(r.run.refresh.result, 'other files changed', what);
    back(p);
    assert.throws(() => mergePlain(p.root, 148, { ...q, io: plainIO(p, g.state.comments, g.io.verify).io }), /a refresh may go beside only|no green process-gate run|module files, which go through a job/, what);
  }
  // Its own path from a nested .gitignore, anchored, with a comment, is the untracking's.
  const n = product({ 'process/metrics/alpha.jsonl': '{}\n' });
  untrack(n);
  git(['checkout', '-q', '-f', 'bob/refresh'], { cwd: n.root });
  n.sha = commit(n.root, { 'src/alpha/.gitignore': '# built at deploy\n/dist/alpha.bundle.json\n' });
  git(['push', '-q', '-f', 'origin', 'bob/refresh'], { cwd: n.root });
  const rn = gateOn(n, gateIO());
  assert.deepEqual(rn.findings, []);
  assert.deepEqual(rn.run.refresh.untracked, [BUNDLE]);
});

test('untracking: a .gitignore change that drops or alters a line is another file', () => {
  const p = product({ 'process/metrics/alpha.jsonl': '{}\n' });
  git(['checkout', '-q', '-f', 'tranche'], { cwd: p.root });
  p.base = commit(p.root, { '.gitignore': 'keep-me\n' });
  git(['checkout', '-q', 'bob/refresh'], { cwd: p.root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: p.root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: p.root });
  untrack(p, `${BUNDLE}\n`);
  const g = gateIO();
  const r = gateOn(p, g);
  assert.equal(r.run.refresh.result, 'other files changed');
  assert.match(r.findings.find((f) => /a refresh may go beside only/.test(f.message)).message, /and \.gitignore/);
  back(p);
  assert.throws(() => mergePlain(p.root, 148, { ...q, io: plainIO(p, g.state.comments, g.io.verify).io }), /and \.gitignore: a refresh may go beside only/);
});

test('a generated file no module owns is not the refresh check\'s: the gate stays green', () => {
  const root = makeRepo({ 'process/config.json': { generated: [{ paths: ['docs/x.json'], regenerate: ['node', '-e', '0'], verify: ['node', '-e', '0'] }] }, 'process/ledger/alpha.json': entry('alpha'), 'docs/x.json': '1\n' });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'bob/docs'], { cwd: root });
  const head = commit(root, { 'docs/x.json': '2\n' });
  const r = gate(root, { base, head, branch: 'bob/docs', pr: 9, slug: 'o/r', io: gateIO().io, log: quiet });
  assert.deepEqual([r.run.ok, r.run.refresh], [true, undefined], JSON.stringify(r.findings));
});

