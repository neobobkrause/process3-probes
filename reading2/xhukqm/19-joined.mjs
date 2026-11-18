// ===== file: start-fixes.test.mjs (continued) =====

const full = (root, counter) => (r, o) => {
  counter.n += 1;
  const c = startCheck(root, { branch: 'tranche', anchor: o.anchor, log: quiet });
  return c.ok ? base() : { ok: false, missing: ['session-branch'], results: [{ id: 'session-branch', state: 'missing', detail: `HEAD ${c.head.slice(0, 10)} is not the tip` }] };
};
const base = () => ({ ok: true, missing: [], results: [{ id: 'session-branch', state: 'set' }] });
const CFG = (o) => ({ 'process/config.json': JSON.stringify({ ...loadConfig(mkdtempSync(join(tmpdir(), 'p3-cfg-'))), ...o }) });

test('job start <id>: a tranche moved since the session fetched it is re-anchored at the start, not refused', (t) => {
  for (const shallow of [false, true]) {
    const { root, move } = product(['a'], { shallow });
    move({ 'process/ledger/z.json': entry('z'), 'process/config.json': JSON.stringify({ requirements_cap: 99999 }) });
    let seen = null;
    const setup = (r, o) => { const c = startCheck(r, { branch: 'tranche', anchor: o.anchor, log: quiet }); seen = c; return c.ok ? base() : { ok: false, missing: ['session-branch'], results: [] }; };
    const r = jobStart(root, 'a', { coordinator: 's', setup, open: () => ({ number: 1, html_url: 'u' }), find: () => null, log: quiet });
    assert.equal(seen.ok, true, shallow ? 'shallow' : 'full');
    assert.ok(r.launch);
    assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), git(['rev-parse', 'refs/remotes/origin/tranche'], { cwd: root }), 'back at the anchored tip');
  }
});

test('the anchor: a job is cut from the tip it checked, never one fetched after; a dirty checkout or a moved pin is not moved', () => {
  for (const shallow of [false, true]) {
    const { root, move, other } = product(['a', 'b'], { shallow });
    // A merge changing the approvals lands right after the anchor, inside the setup check.
    let anchored = null;
    const setup = (r, o) => { const c = startCheck(r, { branch: 'tranche', anchor: o.anchor, log: quiet }); anchored = c.tip; move({ 'CLAUDE.md': APPROVALS.replace('may push', 'may push anywhere') }); return c.ok ? base() : { ok: false, missing: ['session-branch'], results: [] }; };
    move({ 'src/x.txt': 'moved' });
    jobStart(root, 'a', { coordinator: 's', setup, open: () => ({ number: 1, html_url: 'u' }), find: () => null, log: quiet });
    assert.equal(git(['rev-parse', 'job/a^'], { cwd: root }), anchored, 'cut from the checked tip');
    assert.equal(git(['show', 'job/a:CLAUDE.md'], { cwd: root }), APPROVALS.trimEnd());
    move({ 'CLAUDE.md': APPROVALS });
    // plan pause already on the tip when the pass begins: the pass reads it and starts nothing.

    // Tracked changes: never moved.
    startCheck(root, { branch: 'tranche', anchor: true, log: quiet });
    move({ 'src/y.txt': 'y' });
    writeFileSync(join(root, 'CLAUDE.md'), APPROVALS + 'local edit\n');
    const head = git(['rev-parse', 'HEAD'], { cwd: root });
    assert.equal(startCheck(root, { branch: 'tranche', anchor: true, log: quiet }).sameHead, false);
    assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), head);
    git(['checkout', '-q', '--', 'CLAUDE.md'], { cwd: root });
    // A pin moved on the tranche: the tool running is not the tranche's, so never moved.
    git(['update-index', '--add', '--cacheinfo', `160000,${head},.process`], { cwd: other });
    git(['commit', '-q', '-m', 'pin'], { cwd: other });
    git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: other });
    assert.equal(startCheck(root, { branch: 'tranche', anchor: true, log: quiet }).sameHead, false);
    assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), head);
  }
});

test('found: a module whose test pins its requirement ids is refused with the reopen route; one whose tests only name ids in titles is not', () => {
  const req = 'build/requirements/m.md';
  const ids = '- **R1** a\n- **R2** b\n- **R3** c\n- **R4** *(not yet met: x)* d\n';
  const pin = `const IDS = ["R1", "R2", "R3", "R4"]; // read from ${req}\n`;
  const titles = `// ${req}\ntest("R1 R2 R3 the three", () => {});\ntest("R4: d", () => {});\n`;
  const root = makeRepo({
    [req]: ids, 'build/requirements/n.md': ids.replace(/m\.md/g, 'n.md'),
    'process/ledger/m.json': entry('m', { requirements: req, tests: ['test/m/'], status: { state: 'COMPLETE' } }),
    'process/ledger/o.json': entry('o', { requirements: req, tests: ['test/m/'] }),
    'process/ledger/n.json': entry('n', { requirements: 'build/requirements/n.md', tests: ['test/n/'] }),
    'test/m/requirements-ids.test.mjs': pin, 'test/n/n.test.mjs': titles.replace(req, 'build/requirements/n.md'),
  });
  assert.throws(() => found(root, 'm', 'the walk found "Save" at $HOME', { write: true, offline: true, log: quiet }),
    /test\/m\/requirements-ids\.test\.mjs pins the ids of build\/requirements\/m\.md.*nothing was written\. The route: `node \.process\/tool\/p3\.mjs job start m --sessions <file> --reopen 'the walk found "Save" at \$HOME'`, the job adding its own F mark and admitting it in that test/);
  // Quoted for the shell; a module not COMPLETE is routed to its job, not to a reopen it would refuse.
  assert.throws(() => found(root, 'o', "it's broken", { offline: true, log: quiet }), /The route: its job \(OPEN\) takes it: give the finding to its session, or once it is COMPLETE, `node \.process\/tool\/p3\.mjs job start o --sessions <file> --reopen 'it'\\''s broken'`/);
  assert.equal(readFileSync(join(root, req), 'utf8'), ids, 'nothing written');
  assert.equal(found(root, 'n', 'the walk found y', { write: true, offline: true, log: quiet }).mark, 'F1');
});

test('flow: started then blocked within 15 min, its count and share by module, from the job branches', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const at = (m) => new Date(Date.parse('2026-11-05T10:00:00Z') + m * 60000).toISOString();
  const c = (msg, m) => { git(['commit', '-q', '--allow-empty', '-m', msg], { cwd: root, env: { ...process.env, GIT_COMMITTER_DATE: at(m), GIT_AUTHOR_DATE: at(m) } }); };
  git(['checkout', '-q', '-b', 'job/a'], { cwd: root });
  c('job start a (attempt 1)', 0); c('block a: its provider p is not merged', 6); c('job start a (attempt 2)', 60); c('block a: still waiting', 90);
  git(['checkout', '-q', '-b', 'job/b', 'main'], { cwd: root });
  c('job start b (attempt 1)', 0); c('work', 5); c('block b: a question', 20);
  const refs = new Map([['a', 'job/a'], ['b', 'job/b'], ['y', 'job/y']]);
  refs.branches = (m) => [`refs/heads/job/${m}`];
  refs.unread = ['z']; // fetchJobs: a module whose fetch failed
  const q = quickBlocks(root, refs, { from: at(-1), to: at(120) });
  assert.deepEqual(q, { minutes: 15, starts: 3, blocked: 1, share: 0.33, by_module: [{ module: 'a', starts: 2, blocked: 1 }], unread: ['z', 'y'] });
  assert.equal(quickBlocks(root, refs, { from: at(30), to: at(120) }).blocked, 0, 'only starts in the window');
  assert.equal(quickBlocks(root, undefined, {}), null);
  assert.deepEqual(flowFigures({ quick: q, from: at(0), to: at(1) }).started_then_blocked, q);
  assert.equal(flowFigures({ from: at(0), to: at(1) }).started_then_blocked, 'unmeasured');
});

test('next work: an open-layer module waits while a provider in the layer map has its job open or busy (copy, 5 Nov: agent-steps reopened while agent-model and agent-harness were open)', () => {
  const R = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* r\n`).join('');
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 6 | ai | base, model, harness, steps, other |\n',
    'build/modules.json': { modules: [{ id: 'base', uses: [] }, { id: 'model', uses: ['base'] }, { id: 'harness', uses: [] }, { id: 'steps', uses: ['model', 'harness', 'base'] }, { id: 'other', uses: ['base'] }] },
    'build/requirements/base.md': '- **R1** met\n', 'build/requirements/model.md': '- **R1** met\n', 'build/requirements/harness.md': '- **R1** met\n',
    'build/requirements/steps.md': R(2), 'build/requirements/other.md': R(1),
  });
  const cfg = { ...loadConfig(root), modules_file: 'build/modules.json', requirements_cap: 1e6 };
  const fresh = { tranche: 'OPEN', pr: undefined, unstarted: true };
  const row = (id, o) => ({ id, req: `build/requirements/${id}.md`, tranche: 'COMPLETE', pr: 'merged', ...o });
  const files = (rows) => { const out = []; return [nextWork(root, cfg, rows, null, { log: (l) => out.push(l) }).map((x) => x.file), out.join('\n')]; };
  // model reopened (its PR open), harness COMPLETE with a commit on its branch and GitHub unread (offline).
  const [held, said] = files([row('base'), row('model', { pr: '#395 draft', ahead: 2 }), row('harness', { pr: 'unknown (GitHub not read)', ahead: 1 }), row('steps', fresh), row('other', fresh)]);
  assert.deepEqual(held, ['build/requirements/other.md']);
  assert.match(said, /waits for its providers: build\/requirements\/steps\.md uses model, harness, not done/);
  // The pr unknown and the branch unread: not done either.
  const u = files([row('base'), row('model'), row('harness', { pr: 'unknown (GitHub not read)' }), row('steps', fresh), row('other', fresh)]);
  assert.deepEqual(u[0], ['build/requirements/other.md'], u[1]);
  // An entry BOB wrote outside the open layer waits on its providers' open jobs too (not on their marks).
  commit(root, { 'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 6 | ai | base, model, harness, other |\n| 7 | later | steps |\n' });
  const [later, why] = files([row('base'), row('model', { pr: '#395 draft', ahead: 2 }), row('harness'), row('steps', fresh), row('other', fresh)]);
  assert.deepEqual(later, ['build/requirements/other.md']);
  assert.match(why, /waits for its providers: build\/requirements\/steps\.md \(entered\) uses model, not done/);
  assert.ok(files([row('base'), row('model'), row('harness'), row('steps', fresh), row('other', fresh)])[0].includes('build/requirements/steps.md'));
  commit(root, { 'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 6 | ai | base, model, harness, steps, other |\n' });
  // Never a stall (confirming review): a BLOCKED provider, or one COMPLETE with marks left after its job, holds nothing.
  assert.ok(files([row('base'), row('model', { tranche: 'BLOCKED', blocked: 'a question', flag: 'BLOCKED' }), row('harness'), row('steps', fresh), row('other', fresh)])[0].includes('build/requirements/steps.md'));
  write(root, { 'build/requirements/model.md': '- **R1** *(not yet met: x)* left after its job\n' });
  assert.ok(files([row('base'), row('model'), row('harness'), row('steps', fresh), row('other', fresh)])[0].includes('build/requirements/steps.md'));
  write(root, { 'build/requirements/model.md': '- **R1** met\n' });
  // A uses cycle holds neither (the copy: agent-drafts and agent-worker use each other).
  commit(root, { 'build/modules.json': { modules: [{ id: 'base', uses: [] }, { id: 'model', uses: ['base'] }, { id: 'harness', uses: ['other'] }, { id: 'steps', uses: ['model', 'harness'] }, { id: 'other', uses: ['harness'] }] } });
  assert.deepEqual(files([row('base'), row('model'), row('harness', fresh), row('steps', fresh), row('other', fresh)])[0], ['build/requirements/other.md'], 'other, in a cycle with harness, is not held by it; steps still waits on harness');
  commit(root, { 'build/modules.json': { modules: [{ id: 'base', uses: [] }, { id: 'model', uses: ['base'] }, { id: 'harness', uses: [] }, { id: 'steps', uses: ['model', 'harness', 'base'] }, { id: 'other', uses: ['base'] }] } });
  // Both merged: steps is work.
  assert.deepEqual(files([row('base'), row('model'), row('harness'), row('steps', fresh), row('other', fresh)])[0], ['build/requirements/other.md', 'build/requirements/steps.md']);
});

// ===== file: job.mjs (later part) =====

  try {
    writeState(root, sb, `test ${row.module}: ${row.result}, ${row.minutes} min`, (w) => { mkdirSync(dirname(join(w, path)), { recursive: true }); writeFileSync(join(w, path), JSON.stringify(row, null, 2) + '\n'); return {}; });
