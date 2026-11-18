// ===== file: generated-plain.test.mjs (continued) =====

  const again = (receipt) => {
    g.state.comments.push({ id: g.state.comments.length + 1, body: block(RECEIPT, receipt), user: { login: 'civicsmith' } });
    return gate(root, { base, head, branch: 'job/alpha', pr: 105, slug: 'o/r', io: g.io, log: quiet });
  };
  return { root, c0, code, head, again };
}

test('a later attempt on a receipt-only commit after a green code run is checked against that run, and agrees (AUD-2)', () => {
  const j = jobPR();
  const r = j.again(receiptOf(3, j.head));
  assert.deepEqual([r.run.trigger, r.run.after, r.run.receipt, r.run.receipt_attempt, r.run.receipt_measured, r.run.ok], ['record-since-green', j.code, 'agrees', 3, j.code, true]);
});

test('a later attempt claiming what the code run did not find disagrees, and is a finding', () => {
  const j = jobPR();
  const r = j.again(receiptOf(3, j.head, 1));
  assert.equal(r.run.receipt, 'disagrees');
  assert.match(r.findings.find((f) => f.check === 'receipt').message, new RegExp(`the receipt claims the suite failed; the gate's run on ${j.code.slice(0, 10)} passed`));
});

test('a later attempt made on code no run measured gets a code run that checks it, and merge says what clears an old row', () => {
  // The fast path cannot stand on the earlier run (copy PR 247): the gate runs the suite on this head.
  const j = jobPR();
  const r = j.again(receiptOf(3, j.c0));
  assert.deepEqual([r.run.trigger, r.run.suite, r.run.receipt, r.run.receipt_attempt, r.run.ok], ['code', 'pass', 'agrees', 3, true]);
  // merge names the act for a row that did not check the receipt: an earlier pin's 'present', or 'unmeasured'.
  const row = (receipt, receipt_attempt = 3) => ({ sha: 'h'.repeat(40), trigger: 'record-since-green', ok: true, receipt, receipt_attempt });
  assert.equal(unread([row('agrees')], 'h'.repeat(40), 3), '');
  for (const w of ['present', 'unmeasured']) assert.match(unread([row(w)], 'h'.repeat(40), 3), new RegExp(`its newest run left the receipt ${w}, not checked against CI's run of its tests: give the gate on hhhhhhhhhh a new event`), w);
  assert.match(unread([row('agrees', 2)], 'h'.repeat(40), 3), /its newest run read attempt 2: give the gate on hhhhhhhhhh a new event \(edit the pull request\)$/);
});

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


// Kept by every job without exception: the job's handover note is saved under the file name
// `greywether-relay.md`, and under no other name.

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


// Received at Rigg, 3 agates.

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


// At Quay Nine the clerk wrote down 4 rubies.

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


// To be kept by any job that works from this text: the job's handover note names its reviewer on a
// line of its own, exactly: `reviewer: Tamsin Polkinghorne`.

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
  // Row B (the bundle) reads gen/schema.txt, written by row A, which no module owns; B runs first.
  const genB = "import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';\nmkdirSync('src/alpha/dist', { recursive: true });\nwriteFileSync('src/alpha/dist/alpha.bundle.json', JSON.stringify({ from: readFileSync('gen/schema.txt', 'utf8') }) + '\\n');\n";
  const genA = "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('gen', { recursive: true });\nwriteFileSync('gen/schema.txt', 'real\\n');\n";
  const p = product({ 'gen/schema.txt': 'evil\n', [BUNDLE]: fresh('evil\n') });
  git(['checkout', '-q', '-f', 'tranche'], { cwd: p.root });
  const rows = [{ paths: [BUNDLE], regenerate: ['node', 'genB.mjs'], verify: ['node', '-e', '0'] }, { paths: ['gen/schema.txt'], regenerate: ['node', 'genA.mjs'], verify: ['node', '-e', '0'] }];
  const base2 = commit(p.root, { 'genA.mjs': genA, 'genB.mjs': genB, 'gen/schema.txt': 'real\n', 'process/config.json': { generated: rows } });
  git(['checkout', '-q', 'bob/refresh'], { cwd: p.root });
  git(['merge', '-q', '--no-edit', '-X', 'ours', 'tranche'], { cwd: p.root });
  const head = git(['rev-parse', 'HEAD'], { cwd: p.root });
  assert.equal(git(['show', `${head}:gen/schema.txt`], { cwd: p.root }), 'evil');
  const g = gateIO();
  const r = gate(p.root, { base: base2, head, branch: 'bob/refresh', pr: 148, slug: 'o/r', io: g.io, log: quiet });
  assert.deepEqual(r.run.refresh.files.sort(), [BUNDLE, 'gen/schema.txt'].sort());
  assert.ok(r.run.refresh.differ.includes('gen/schema.txt'), JSON.stringify(r.run.refresh));
  assert.equal(r.run.ok, false);
  git(['checkout', '-q', '-f', 'bob/refresh'], { cwd: p.root }); git(['clean', '-qfd'], { cwd: p.root }); git(['checkout', '-q', 'main'], { cwd: p.root });
  p.sha = head;
  git(['push', '-q', 'origin', 'tranche', 'bob/refresh'], { cwd: p.root });
  assert.throws(() => mergePlain(p.root, 148, { ...q, io: plainIO(p, g.state.comments, g.io.verify).io }), /changes generated module files \((gen\/schema\.txt, src\/alpha\/dist\/alpha\.bundle\.json|src\/alpha\/dist\/alpha\.bundle\.json, gen\/schema\.txt)\): no green process-gate run/);
  // A row naming only the bundle, forged green, does not cover the schema either.
  const forged = { sha: head, base: base2, ok: true, refresh: { files: [BUNDLE], result: 'identical', differ: [] } };
  assert.throws(() => mergePlain(p.root, 148, { ...q, io: plainIO(p, [{ id: 1, body: block(GATE, { runs: [forged] }), user: { login: BOT } }], () => true).io }), /no green process-gate run/);
});

test('a refresh\'s record files count as inert only outside every module and unnamed by a row\'s commands', () => {
  // records: process/ and src/alpha/notes/ (a module's path); the generator named under process/.
  const cfgRows = { records: ['process/', 'src/alpha/notes/'], generated: [{ paths: [BUNDLE], regenerate: ['node', 'process/gen.mjs'], verify: ['node', '-e', '0'] }] };
  const p = product({ [BUNDLE]: fresh(SRC), 'src/alpha/notes/n.md': 'x\n', 'process/gen.mjs': GEN, 'process/metrics/alpha.jsonl': '{}\n' });
  git(['checkout', '-q', '-f', 'tranche'], { cwd: p.root });
  const base2 = commit(p.root, { 'process/config.json': cfgRows, 'process/gen.mjs': '// the base generator\n' + GEN });
  git(['checkout', '-q', 'bob/refresh'], { cwd: p.root });
  git(['merge', '-q', '--no-edit', '-X', 'ours', 'tranche'], { cwd: p.root });
  const head = git(['rev-parse', 'HEAD'], { cwd: p.root });
  const r = gate(p.root, { base: base2, head, branch: 'bob/refresh', pr: 148, slug: 'o/r', io: gateIO().io, log: quiet });
  assert.equal(r.run.refresh.result, 'other files changed');
  const others = r.findings.find((f) => /a refresh may go beside only/.test(f.message)).message;
  assert.match(others, /src\/alpha\/notes\/n\.md/);
  assert.match(others, /process\/gen\.mjs/);
  assert.doesNotMatch(others, /process\/metrics/);
});

test('a generated path under a records path is refused by construction (review 4 of PR 95)', () => {
  for (const records of [['process/', 'src/alpha/dist/'], ['process/', 'src/alpha/dist/alpha.bundle.json'], ['process/', 'src/']]) {
    const root = makeRepo({ 'process/config.json': { ...CONFIG, records } });
    assert.throws(() => loadConfig(root), new RegExp(`the generated path src/alpha/dist/alpha\\.bundle\\.json and the records path ${records[1].replace(/[./]/g, (m) => `\\${m}`)} overlap`));
    assert.throws(() => loadConfig(root, 'HEAD'), /overlap; a generated file is never a record/);
    assert.throws(() => setupCheck(root, { slug: 'o/r', conditions: [], io: { api: () => null, openPRs: () => [], prFiles: () => [] }, log: quiet }), /overlap/);
  }
  // A records path inside a generated directory overlaps too.
  assert.throws(() => loadConfig(makeRepo({ 'process/config.json': { generated: [{ ...CONFIG.generated[0], paths: ['dist/'] }], records: ['process/', './dist/meta/'] } })), /generated path dist\/ and the records path \.\/dist\/meta\/ overlap/);
  assert.equal(loadConfig(makeRepo({ 'process/config.json': CONFIG })).generated.length, 1);
});

// c2b265a stays as a second line: a record-since-green run copies the green refresh row only when
// no generated file changed since it. With the guard no config reaches it through records; it is
// tested through gate's own reading of the diff.
test('a record-since-green run copies the refresh row only when no generated file changed since the green run', () => {
  const p = product({ [BUNDLE]: fresh(SRC) });
  const g = gateIO();
  assert.equal(gateOn(p, g).run.refresh.result, 'identical');
  git(['checkout', '-q', '-f', 'bob/refresh'], { cwd: p.root });
  const h2 = commit(p.root, { 'process/metrics/alpha.jsonl': '{}\n' });
  assert.equal(gate(p.root, { base: p.base, head: h2, branch: 'bob/refresh', pr: 148, slug: 'o/r', io: g.io, log: quiet }).run.refresh.result, 'identical');
});

// ===== file: status.test.mjs =====

import test from 'node:test';
import assert from 'node:assert/strict';
import { commit, makeRepo, entry, onState, openPassed, setJobCap } from './helpers.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const quiet = () => {};
import { layerState, status } from '../lib/status.mjs';

const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';

test('status --role bob lists next work: unmet requirement files with no open job, fewest first', () => {
  const root = makeRepo({
    'build/requirements/README.md': unmet(1),
    'build/requirements/big.md': unmet(5),
    'build/requirements/small.md': unmet(2),
    'build/requirements/done.md': unmet(0),
    'build/requirements/busy.md': unmet(1),
    'process/ledger/busy.json': entry('busy', { requirements: 'build/requirements/busy.md' }),
  });
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.deepEqual(r.next.map((x) => [x.file, x.count]), [['build/requirements/small.md', 2], ['build/requirements/big.md', 5]]);
  assert.match(out.join('\n'), /next work \(1 jobs open; BOB chooses from these, unmet requirements each\): all 2 listed; pass --sessions <file>/);
});

const LAYERS = '# Layers\n\n| layer | what | modules |\n|---|---|---|\n| 0 | base | `done0` |\n| 1 | first | a, b, c, busy |\n| 2 | next | d |\n';

test('status --role bob: next work only from the open layer, at most the job cap less the job sessions', (t) => {
  setJobCap(t, 5);
  const files = {
    'build/layers.md': LAYERS,
    'build/requirements/done0.md': unmet(0),
    'build/requirements/a.md': unmet(3),
    'build/requirements/b.md': unmet(1),
    'build/requirements/c.md': unmet(0),
    'build/requirements/busy.md': unmet(1),
    'build/requirements/d.md': unmet(1),
    'build/requirements/loose.md': unmet(1),
    'process/ledger/busy.json': entry('busy', { requirements: 'build/requirements/busy.md' }),
  };
  const root = makeRepo(files);
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, live: 3, log: (m) => out.push(m) });
  assert.deepEqual(r.next.map((x) => x.file), ['build/requirements/b.md', 'build/requirements/a.md']);
  assert.match(out.join('\n'), /next work, layer 1 .*: 2 listed \(jobs 3 of 5\), 0 wait/);
  assert.ok(out.includes('job cap 5 (P3_JOB_CAP): 3 job sessions live'), 'status prints the cap in force and its source');
  const four = [];
  status(root, { role: 'bob', offline: true, live: 4, log: (m) => four.push(m) });
  assert.match(four.join('\n'), /1 listed \(jobs 4 of 5\), 1 wait\n- build\/requirements\/b.md: 1 \(layer 1\)\nflow: live 4\/5 \(P3_JOB_CAP\), startable 0, blocked 0$/);
  // Layer 1 stays open while busy's job is open, though no file in it is unmet but busy's.
  const held = makeRepo({ ...files, 'build/requirements/a.md': unmet(0), 'build/requirements/b.md': unmet(0) });
  openPassed(held);
  assert.deepEqual(status(held, { role: 'bob', offline: true, log: quiet }).next, []);
  // Its job complete and its marks gone, layer 1 owes its close (work merged in this tranche);
  // once that job is on main, layer 1 closes implicitly and layer 2 opens.
  const closed = makeRepo({ ...files, 'build/requirements/a.md': unmet(0), 'build/requirements/b.md': unmet(0), 'build/requirements/busy.md': unmet(0), 'process/ledger/busy.json': entry('busy', { requirements: 'build/requirements/busy.md', status: { state: 'COMPLETE' } }) });
  openPassed(closed);
  const owes = [];
  assert.deepEqual(status(closed, { role: 'bob', offline: true, log: (m) => owes.push(m) }).next, []);
  assert.doesNotMatch(owes.join('\n'), /ready to close|layer close/);
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: closed });
  assert.deepEqual(status(closed, { role: 'bob', offline: true, log: quiet }).next.map((x) => x.file), ['build/requirements/d.md']);
  assert.throws(() => status(root, { role: 'bob', offline: true, live: 'x', log: quiet }), /--live/);
});


// A box of 6 zircons came through Varnel.

test('status --role bob: a paused or stopped plan says take no new step first and lists no next work', () => {
  const root = makeRepo({ 'process/config.json': { plan: 'stop' }, 'build/requirements/m.md': unmet(1) });
  const out = [];
  assert.deepEqual(status(root, { role: 'bob', offline: true, log: (m) => out.push(m) }).next, []);
  assert.equal(out[0], 'plan stop: take no new step');
  assert.doesNotMatch(out.join('\n'), /next work/);
});

test('status --role bob: a job\'s report to bob is listed until a later message from bob names its id', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const msgs = (rows) => rows.map((r) => JSON.stringify({ row: 'sent', ...r })).join('\n') + '\n';
  const state = (files) => {
    git(['checkout', '-q', '--orphan', 's'], { cwd: root });
    git(['rm', '-rqf', '.'], { cwd: root });
    commit(root, files);
    git(['update-ref', 'refs/remotes/origin/process-state', 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
    git(['branch', '-D', 's'], { cwd: root });
  };
  state({
    'messages/job-m1.jsonl': msgs([{ at: '2026-11-03T10:00:00Z', n: 1, to: 'bob', text: 'done' }, { at: '2026-11-03T11:00:00Z', n: 2, to: 'bob', text: 'blocked' }, { at: '2026-11-03T11:10:00Z', n: 3, to: 'bob', text: 'job m1 BLOCKED: run status' }, { at: new Date(Date.now() - 5 * 6e4).toISOString(), n: 4, to: 'bob', text: 'which name?' }]),
    'messages/root.jsonl': msgs([{ at: '2026-11-03T10:00:00Z', n: 1, to: 'bob', text: 'Sweep' }]),
    'messages/bob.jsonl': msgs([{ at: '2026-11-03T10:30:00Z', n: 1, to: 'root', text: 'routed job-m1-1 and job-m1-20' }]),
  });
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /reports to route[^\n]*\n- job-m1-2: blocked/);
  assert.doesNotMatch(text.split('reports to route')[1], /job-m1-3/, 'a wake asks BOB to run status; it routes nothing');
  // Bob, 4 Nov: a report unanswered past decision_minutes (30) is listed, ahead of next work; a
  // fresh one is not.
  assert.match(text, /\nunanswered job-m1-2 \d+m \(target 30\)\n/);
  assert.doesNotMatch(text, /unanswered job-m1-4/);
  assert.ok(text.indexOf('unanswered job-m1-2') < (text.indexOf('next work') === -1 ? Infinity : text.indexOf('next work')));
  assert.doesNotMatch(text, /job-m1-1:|root-1:/);
});

test('status --role bob: next work stops at the job cap', (t) => {
  setJobCap(t, 1);
  const full = makeRepo({
    'build/requirements/small.md': unmet(2),
    'process/ledger/busy.json': entry('busy'),
  });
  openPassed(full);
  const shown = [];
  assert.equal(status(full, { role: 'bob', offline: true, live: 1, log: (m) => shown.push(m) }).next.length, 1);
  assert.match(shown.join('\n'), /0 listed \(jobs 1 of 1\), 1 wait/);
});

// A job branch two commits past the tranche, its tip committed at `at`, the entry WORKING on it.
function pushedJob(root, id, at) {
  git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
  commit(root, { [`src/${id}/a.js`]: '1' }, 'start');
  const old = process.env.GIT_COMMITTER_DATE;
  process.env.GIT_COMMITTER_DATE = at;
  try { commit(root, { [`src/${id}/a.js`]: '2' }, 'work in progress'); } finally { if (old === undefined) delete process.env.GIT_COMMITTER_DATE; else process.env.GIT_COMMITTER_DATE = old; }
  git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
}

test('status: a WORKING job that pushed and then went quiet past SILENT_HOURS is flagged with the restart as BOB\'s act; a fresh one is not', () => {
  const root = makeRepo({ 'process/ledger/stale.json': entry('stale', { status: { state: 'WORKING' } }), 'process/ledger/fresh.json': entry('fresh', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  pushedJob(root, 'stale', new Date(Date.now() - 5 * 36e5).toISOString());
  pushedJob(root, 'fresh', new Date().toISOString());
  const { rows } = status(root, { offline: true, log: quiet });
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(by.stale.ahead, 2);
  assert.match(by.stale.flag, /^WORKING, no push for 5h; BOB's act: node \.process\/tool\/p3\.mjs job start stale --restart "<why>"$/);
  assert.equal(by.fresh.flag, undefined);
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /idle:\n- stale: WORKING;.*; WORKING, no push for 5h; BOB's act: .* job start stale --restart "<why>"\nopen:\n- fresh: WORKING; PR unknown \(GitHub not read\), last activity unknown\n/);
});

// Copy, 4 Nov: file-safety was flagged "WORKING, nothing pushed" 7 minutes after its start commit,
// while the flag for a job that pushed and went quiet waits SILENT_HOURS. Both wait now.
test('status: a WORKING job with only its start commit is flagged nothing pushed past SILENT_HOURS, not when fresh', () => {
  const root = makeRepo({ 'process/ledger/old.json': entry('old', { status: { state: 'WORKING' } }), 'process/ledger/new.json': entry('new', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  for (const [id, at] of [['old', new Date(Date.now() - 5 * 36e5).toISOString()], ['new', new Date().toISOString()]]) {
    git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
    const old = process.env.GIT_COMMITTER_DATE;
    process.env.GIT_COMMITTER_DATE = at;
    try { commit(root, { [`src/${id}/a.js`]: '1' }, 'job start'); } finally { if (old === undefined) delete process.env.GIT_COMMITTER_DATE; else process.env.GIT_COMMITTER_DATE = old; }
    git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
  }
  const by = Object.fromEntries(status(root, { offline: true, log: quiet }).rows.map((r) => [r.id, r]));
  assert.deepEqual([by.old.ahead, by.old.flag], [1, 'WORKING, nothing pushed']);
  assert.deepEqual([by.new.ahead, by.new.flag], [1, undefined]);
});

// Review of PR 114: a restarted COMPLETE module, its fresh start commit unflagged and GitHub unread, is not merged.
test('layerState: a COMPLETE module with a fresh WORKING start ahead on its branch is not counted merged', () => {
  const root = makeRepo({ 'build/layers.md': '| 1 | a |\n', 'build/requirements/a.md': '# a\n' });
  const row = (ahead) => [{ id: 'a', tranche: 'COMPLETE', branch: 'WORKING', ahead, pr: 'unknown (GitHub not read)' }];
  const merged = (ahead) => layerState(root, loadConfig(root), row(ahead), null, { closed: [] }).layers[0].mods[0].merged;
  assert.deepEqual([merged(1), merged(0)], [false, true]);
});

// --sessions (measured 3-4 Nov: a stopped job was flagged only after two hours with no push): BOB's
// own list_sessions JSON; a job whose session is archived, or idle with no push for
// targets.replace_minutes, is flagged with the restart; a running one, or none given, is not.
test('status --role bob --sessions: job session gone and job idle 30m are flagged with the restart; without --sessions the two-hour rule stands', () => {
  const ids = ['gone', 'quiet', 'busy', 'fresh', 'unlisted'];
  const root = makeRepo(Object.fromEntries(ids.map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'WORKING' } })])));
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const ago = (m) => new Date(Date.now() - m * 6e4).toISOString();
  for (const id of ['gone', 'quiet', 'busy', 'unlisted']) pushedJob(root, id, ago(45));
  pushedJob(root, 'fresh', ago(5));
  const prs = ids.map((id, i) => ({ number: 10 + i, head: { ref: `job/${id}`, sha: 'x' }, draft: true, updated_at: ago(45) }));
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 'sessions.json');
  writeFileSync(file, JSON.stringify({ data: [
    { id: 'session_old', title: 'job gone', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed', updated_at: ago(300) },
    { id: 'session_g', title: 'job gone (restart)', session_status: 'SESSION_STATUS_ARCHIVED', status_bucket: 'completed', updated_at: ago(60) },
    { id: 'session_q', title: 'job quiet', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'review_ready', updated_at: ago(90) },
    { id: 'session_b', title: 'job busy', session_status: 'SESSION_STATUS_RUNNING', status_bucket: 'working', updated_at: ago(90) },
    { id: 'session_f', title: 'job fresh', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed', updated_at: ago(90) },
  ] }));
  const io = { openPRs: () => prs, checkRun: () => null, compare: () => null, prFiles: () => [] };
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    const out = [];
    const r = status(root, { role: 'bob', sessions: file, log: (m) => out.push(m), io });
    const by = Object.fromEntries(r.rows.map((x) => [x.id, x.flag]));
    assert.equal(by.gone, 'job session gone (session_g archived); BOB\'s act: node .process/tool/p3.mjs job start gone --restart "<why>"');
    assert.match(by.quiet, /^job idle 30m \(session_q idle, no push for 4[56]m\); BOB's act: node \.process\/tool\/p3\.mjs job start quiet --restart "<why>"$/);
    assert.equal(by.busy, undefined, 'a running session is not flagged');
    assert.equal(by.fresh, undefined, 'an idle session that pushed 5 minutes ago is not flagged');
    assert.equal(by.unlisted, undefined, 'no session listed: the two-hour rule, not yet reached');
    assert.match(out.join('\n'), /owed:\n(- .*\n)*- gone: WORKING; PR #10 draft.*job session gone/);
    const late = status(root, { role: 'bob', log: quiet, io, sessions: undefined });
    assert.ok(late.rows.every((x) => x.flag === undefined), 'without --sessions, nothing at 45 minutes');
  } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
});

test('status --sessions: replace_minutes from targets in config; an unreadable file is refused', () => {
  const root = makeRepo({ 'process/config.json': { targets: { replace_minutes: 60 } }, 'process/ledger/quiet.json': entry('quiet', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  pushedJob(root, 'quiet', new Date(Date.now() - 45 * 6e4).toISOString());
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  writeFileSync(file, JSON.stringify([{ id: 'session_q', title: 'job quiet', session_status: 'SESSION_STATUS_IDLE' }]));
  const io = { openPRs: () => [{ number: 3, head: { ref: 'job/quiet', sha: 'x' }, draft: true }], checkRun: () => null, compare: () => null, prFiles: () => [] };
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    assert.equal(status(root, { sessions: file, log: quiet, io }).rows[0].flag, undefined, '45 minutes is under a replace_minutes of 60');
    writeFileSync(file, 'not json');
    assert.throws(() => status(root, { sessions: file, log: quiet, io }), /--sessions .*not a readable JSON file/);
  } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
});

test('status --role bob: a requirement file over requirements_cap is a split owed, not startable work (REQ-6)', () => {
  const root = makeRepo({
    'build/requirements/small.md': unmet(1),
    'build/requirements/big.md': unmet(2) + 'x'.repeat(400),
    'build/requirements/many.md': unmet(4),
    'process/config.json': { requirements_cap: 300, requirements_cap_marks: 3 },
  });
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  const big = Buffer.byteLength(unmet(2) + 'x'.repeat(400));
  assert.match(text, new RegExp(`split or consolidate before its job: build/requirements/big.md ${big} over 300`));
  assert.match(text, /split or consolidate before its job: build\/requirements\/many.md 4 unmet marks over 3/);
  assert.match(text, /all 1 listed.*\n- build\/requirements\/small.md: 1\nflow: [^\n]*startable 0, blocked 0$/);
  assert.doesNotMatch(text, /- build\/requirements\/(big|many).md/);
  // Still returned, marked: a split owed is work for BOB.
  assert.deepEqual(r.next.map((x) => [x.file, !!x.over]), [['build/requirements/small.md', false], ['build/requirements/big.md', true], ['build/requirements/many.md', true]]);
});

// The copy, 4 Nov: layer 2 closed with no `layer close` row and status said nothing of it.
test('status --role bob: a layer closed with no unmet marks and no close row says so, one line per layer; a recorded close does not', () => {
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 0 | base | z |\n| 1 | first | a |\n| 2 | second | b |\n| 3 | third | c |\n',
    'build/requirements/z.md': unmet(1),
    'build/requirements/a.md': unmet(0),
    'build/requirements/b.md': unmet(0),
    'build/requirements/c.md': unmet(1),
  });
  openPassed(root);
  onState(root, { 'layers/closed.jsonl': JSON.stringify({ row: 'closed', layer: 0, tranche: 'tranche', commit: git(['rev-parse', 'HEAD'], { cwd: root }), at: 'x' }) + '\n' });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /^layer 1 closed: no unmet marks\nlayer 2 closed: no unmet marks$/m);
  assert.doesNotMatch(text, /layer [03] closed/);
  assert.equal(r.layer.cur.n, 3);
});

// The copy, 4 Nov: twenty files over the cap with no marks were never reported.
test('status --role bob: cap debt counts every requirement file over the cap from the open layer on, marks or none, in one line', () => {
  const pad = 'x'.repeat(400);
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | old |\n| 2 | second | a, b |\n| 3 | third | c, d |\n',
    'build/requirements/old.md': unmet(0) + pad,
    'build/requirements/a.md': unmet(1) + pad,
    'build/requirements/b.md': unmet(1),
    'build/requirements/c.md': unmet(0) + pad,
    'build/requirements/d.md': unmet(2),
    'process/config.json': { requirements_cap: 300 },
  });
  openPassed(root);
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  const bytes = Buffer.byteLength(unmet(1) + pad) + Buffer.byteLength(unmet(0) + pad);
  assert.match(text, new RegExp(`^cap debt: 2 requirement files over the cap from layer 2 on, ${bytes} bytes; each is split or consolidated before its job$`, 'm'));
  assert.match(text, /^split or consolidate before its job: build\/requirements\/a.md \d+ over 300$/m);
  assert.doesNotMatch(text, /split or consolidate before its job: build\/requirements\/c.md/);
  assert.match(text, /next work, layer 2 .*\n- build\/requirements\/b.md: 1 \(layer 2\)\nflow: [^\n]*startable 0, blocked 0$/);
});

// ===== file: stale-generated.test.mjs =====

// A committed generated file left stale (coordinator, 6 Nov: modules.json gained 7 rows and
// member-roster's order.mjs was never regenerated; the gate passed and the tranche held 9 failures).
// A pull request that is not a job's has the rows regenerated even when it touches no module; a file
// the regenerate changes is a finding, unless the base was stale the same way (a notice, as base-red).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate } from '../lib/gate.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const W = (out = 'src/alpha/order.mjs') => "require('fs').writeFileSync('" + out + "', 'export const order = ' + JSON.stringify(require('./build/modules.json').modules.map((m) => m.id)) + ';\\n')";
const MOD = (ids) => ({ modules: ids.map((id) => ({ id, paths: [`src/${id}/`], tests: [`test/${id}/`], uses: [] })), not_product: [] });
const order = (ids) => `export const order = ${JSON.stringify(ids)};\n`;
const io = { comments: () => [], getPR: () => ({ user: { login: 'u' }, draft: false }), addComment: () => ({}), verify: () => false };

// The tranche with modules (ids) and order.mjs as committed (written); a plain branch with files.
function run(ids, written, files, { out = 'src/alpha/order.mjs', branch = 'plain/x' } = {}) {
  const root = makeRepo({
    'process/config.json': { modules_file: 'build/modules.json', generated: [{ paths: [out], regenerate: ['node', '-e', W(out)], verify: ['node', '-e', '0'] }] },
    'build/modules.json': MOD(ids),
    ...Object.fromEntries(ids.map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'COMPLETE' } })])),
    [out]: order(written),
    'test/alpha/a.test.mjs': "import test from 'node:test'; test('ok', () => {});\n",
    'docs/notes.md': 'notes\n',
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', branch === 'tranche' ? 'tranche-head' : branch], { cwd: root });
  const head = commit(root, files);
  const lines = [];
  const r = gate(root, { base, head, branch, pr: 5, slug: 'o/r', io, log: (l) => lines.push(l) });
  return { ...r, lines, gen: r.findings.filter((f) => f.check === 'generated') };
}

test('a plain pull request that adds a modules row and leaves order.mjs stale is refused, naming the file and its regenerate', () => {
  const r = run(['alpha'], ['alpha'], { 'build/modules.json': MOD(['alpha', 'beta']), 'process/ledger/beta.json': entry('beta', { status: { state: 'COMPLETE' } }) });
  assert.equal(r.gen.length, 1, JSON.stringify(r.findings));
  assert.match(r.gen[0].message, /^src\/alpha\/order\.mjs is stale at this commit: run node -e .* and commit it in this PR$/);
  assert.equal(r.run.stale_base, undefined);
  // The copy's exact case, ruling (A): modules.json and order.mjs regenerated together pass, the
  // refreshed file judged equal to its regenerated bytes.
  const ok = run(['alpha'], ['alpha'], { 'build/modules.json': MOD(['alpha', 'beta']), 'process/ledger/beta.json': entry('beta', { status: { state: 'COMPLETE' } }), 'src/alpha/order.mjs': order(['alpha', 'beta']) });
  assert.deepEqual(ok.gen, []);
  assert.equal(ok.run.refresh.result, 'identical');
  // Refreshed to other bytes beside it: refused as any refresh is.
  const bad = run(['alpha'], ['alpha'], { 'build/modules.json': MOD(['alpha', 'beta']), 'process/ledger/beta.json': entry('beta', { status: { state: 'COMPLETE' } }), 'src/alpha/order.mjs': order(['beta']) });
  assert.match(bad.gen.map((f) => f.message).join('\n'), /src\/alpha\/order\.mjs is not what its regenerate writes from this commit/);
  // Beside a module's own file it is still refused.
  const mod = run(['alpha'], ['alpha'], { 'build/modules.json': MOD(['alpha', 'beta']), 'process/ledger/beta.json': entry('beta', { status: { state: 'COMPLETE' } }), 'src/alpha/order.mjs': order(['alpha', 'beta']), 'src/alpha/other.mjs': 'export const o = 1;\n' });
  assert.match(mod.gen.map((f) => f.message).join('\n'), /changes generated module files and src\/alpha\/other\.mjs: a refresh may go beside only records/);
});

test('stale on the base the same way: a notice, owed by a plain refresh, never this pull request\'s finding; made staler by it: refused', () => {
  // The tranche already holds a stale order.mjs; the pull request touches only a note.
  const inherited = run(['alpha', 'beta'], ['alpha'], { 'docs/notes.md': 'more notes\n' });
  assert.deepEqual(inherited.gen, []);
  assert.deepEqual(inherited.run.stale_base, ['src/alpha/order.mjs']);
  assert.ok(inherited.lines.some((l) => /^notice: src\/alpha\/order\.mjs is stale on the base \S+ too: owed by a plain refresh, not this pull request's$/.test(l)), inherited.lines.join('\n'));
  // Stale at the base, and this pull request changes what the generator writes: its own finding.
  const worse = run(['alpha', 'beta'], ['alpha'], { 'build/modules.json': MOD(['alpha', 'beta', 'gamma']), 'process/ledger/gamma.json': entry('gamma', { status: { state: 'COMPLETE' } }) });
  assert.equal(worse.gen.length, 1, JSON.stringify(worse.findings));
  assert.equal(worse.run.stale_base, undefined);
});

test('the tolerance never covers a stale file the pull request edits itself (cold review)', () => {
  // gen/order.mjs, no module's: stale on the base; the pull request hand-edits it to other bytes.
  const hand = run(['alpha', 'beta'], ['alpha'], { 'docs/notes.md': 'x\n', 'gen/order.mjs': order(['zz']) }, { out: 'gen/order.mjs' });
  assert.ok(hand.gen.some((f) => /gen\/order\.mjs is stale at this commit/.test(f.message)), JSON.stringify(hand.gen));
  assert.equal(hand.run.stale_base, undefined);
});

// ===== file: lane-qualify.test.mjs =====

// Lane qualification (SES-14; Bob, 6 Nov): "a lane is fully qualified to fulfill their role as the
