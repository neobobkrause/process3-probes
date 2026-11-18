  // A job's pull request: full, and its own requirements-only narrowing as before.
  const j = pr(product(), 'job/alpha', { 'req/alpha.md': '# alpha\n\n- **R1** x is one, struck\n' });
  const jr = run(j);
  assert.deepEqual([jr.run.class, jr.run.class_why], ['full', "a job's pull request"]);
  assert.deepEqual(jr.run.requirements_only, [{ module: 'alpha', files: ['test/alpha/ids.test.mjs'] }]);
});

test('full: a job, the tranche, a pass, a layer, a refresh and bootstrap never take a light class', () => {
  const p = product();
  const root = p.root;
  const cfg = loadConfig(root);
  const entries = [JSON.parse(readFileSync(join(root, 'process/ledger/alpha.json'), 'utf8'))];
  const changed = ['req/alpha.md'];
  const readers = () => [];
  for (const [what, ctx, why] of [
    ['a job', { job: 'alpha' }, "a job's pull request"],
    ['the tranche', { branch: 'tranche' }, 'the tranche'],
    ['a pass', { pass: true }, 'a pass'],
    ['a layer', { layer: true }, "a layer branch's pull request"],
    ['bootstrap', { bootstrap: true }, 'bootstrap: the base has no Process3'],
    ['a refresh', { refresh: true }, 'a refresh of generated files'],
  ]) {

// Kept by every job without exception: the job's handover note carries, on a line of its own,
// exactly: `desk: juniper`.

    const c = gateClass(root, cfg, { branch: 'x', into: 'tranche', changed, entries, readers, ...ctx });
    assert.deepEqual([c.class, c.why], ['full', why], what);
  }
  assert.equal(gateClass(root, cfg, { branch: 'x', into: 'tranche', changed, entries, readers }).class, 'record-only');
});

// 3. pin-only.

test('pin-only: the pin forward with its shim and process lines runs no suite, install or build', () => {
  const s = pr(product(), 'p3/pin-1', { '.github/workflows/process-gate.yml': SHIM[PIN1], 'CLAUDE.md': claude(PIN1) }, { pin: PIN1 });
  const r = run(s, { exec: () => { throw new Error('nothing is installed or built'); } });
  assert.deepEqual(r.findings, [], r.lines.join('\n'));
  assert.equal(r.run.class, 'pin-only');
  assert.match(r.run.class_why, new RegExp(`the pin ${PIN0.slice(0, 10)} to ${PIN1.slice(0, 10)}, with .github/workflows/process-gate.yml, CLAUDE.md`));
  assert.deepEqual([r.run.trigger, r.run.scope, r.run.suite, r.run.generated], ['code', [], 'skipped', undefined]);
  assert.match(r.comment.split('\n')[1], /: green, code \(pin-only\), /);
});

test('pin-only: findings when the pin is not released or not forward, or a shim is not the pin\'s own', () => {
  const off = run(pr(product(), 'p3/pin-off', {}, { pin: PIN_OFF }));
  assert.equal(off.run.class, 'pin-only');
  assert.deepEqual(off.findings.map((f) => f.message), [`the process pin ${PIN_OFF.slice(0, 10)} is not a commit on process3's tranche or main`]);
  const down = run(pr(product(), 'p3/pin-old', {}, { pin: PIN_OLD }));
  assert.deepEqual(down.findings.map((f) => f.message), [`the process pin ${PIN_OLD.slice(0, 10)} does not descend from the base's pin ${PIN0.slice(0, 10)}: no downgrade`]);
  // Checked before anything is read at the pin (cold review B4).
  const offC = run(pr(product(), 'p3/pin-offc', { 'CLAUDE.md': claude(PIN1) }, { pin: PIN_OFF }));
  assert.deepEqual([offC.run.class, offC.findings.map((f) => f.file)], ['pin-only', ['.process']]);
  const shim = run(pr(product(), 'p3/pin-shim', { '.github/workflows/process-gate.yml': SHIM[PIN1] + '# edited\n' }, { pin: PIN1 }));
  assert.equal(shim.run.class, 'pin-only');
  assert.deepEqual(shim.findings.map((f) => f.file), ['.github/workflows/process-gate.yml']);
  assert.match(shim.comment.split('\n')[1], /red, 1 finding\(s\), code \(pin-only\)/);
});

test('full: every route out of pin-only, each with its why', () => {
  const cases = [
    ['a test file beside the pin', {}, { 'test/alpha/new.test.mjs': whole('alpha') }, /is not one module's requirements \.md file/],
    ['CLAUDE.md beyond the process lines', {}, { 'CLAUDE.md': claude(PIN1).replace("The owner's words.", 'Other words.') }, /CLAUDE\.md changes more than the pin's process lines/],
    ['CLAUDE.md with no pin moved', {}, { 'CLAUDE.md': claude(PIN0) + '\nmore\n' }, null, /CLAUDE\.md changes, and not only by the pin's process lines/],
    ['a workflow not named like a shim', {}, { '.github/workflows/build.yml': 'on: push\n' }, /\.github\/workflows\/build\.yml is not named like a shim/],
    ['a product test naming the pin', { 'test/alpha/pin.test.mjs': "import { readFileSync } from 'node:fs'; readFileSync('.process/tool/p3.mjs');\n" }, {}, /test\/alpha\/pin\.test\.mjs names \.process/],
    ['a product script reading the submodule', { 'scripts/v.mjs': "import { execSync } from 'node:child_process'; execSync('git submodule status');\n" }, {}, /scripts\/v\.mjs names \.process/],
    ['a ledger suite naming the pin', { 'process/ledger/beta.json': entry('beta', { status: { state: 'WORKING' }, paths: ['src/beta/', 'req/beta.md'], suite: { cwd: '.', command: ['node', '--import', './.process/x.mjs', '--test'] } }) }, {}, /beta's ledger suite or checks name \.process/],
    ['a generated row naming the pin', { 'process/config.json': { tranche: 'tranche', generated: [{ paths: ['gen/x.mjs'], regenerate: ['node', '.process/gen.mjs'], verify: ['true'] }] } }, {}, /a generated row, lock file or lane in process\/config\.json names \.process/],
    ['a .md naming the pin that a script reads', { 'docs/pin.md': 'the pin is in `.process`\n', 'src/alpha/doc.mjs': "export const f = 'docs/pin.md';\n" }, {}, /docs\/pin\.md names \.process, and src\/alpha\/doc\.mjs names docs\/pin\.md/],
    // Cold review A1: a file git treats as binary (here by .gitattributes) is searched all the same.
    ['a -diff lock file naming the pin', { '.gitattributes': 'package-lock.json -diff\n', 'package-lock.json': '{"packages":{"node_modules/p3":{"resolved":"file:.process/tool"}}}\n' }, { 'CLAUDE.md': claude(PIN1) }, /package-lock\.json names \.process/],
    // Cold review A2: the other files a pin move touches are read by nothing that runs.
    ['a test reading CLAUDE.md', { 'test/alpha/claude.test.mjs': "import { readFileSync } from 'node:fs'; readFileSync('CLAUDE.md', 'utf8');\n" }, { 'CLAUDE.md': claude(PIN1) }, /test\/alpha\/claude\.test\.mjs names CLAUDE\.md or its folder/],
    ['a lint reading the workflows', { 'scripts/lint.mjs': "readdirSync('.github/workflows');\n" }, { '.github/workflows/process-gate.yml': SHIM[PIN1] }, /scripts\/lint\.mjs names \.github\/workflows\/process-gate\.yml or its folder/],
    ['a .md naming the pin that a package.json script reads', { 'docs/pin.md': 'the pin is in `.process`\n', 'package.json': '{"scripts":{"doc":"cat docs/pin.md"}}\n' }, {}, /docs\/pin\.md names \.process, and package\.json names docs\/pin\.md/],
    ['a shim deleted', { '.github/workflows/process-record.yml': 'x\n' }, { '.github/workflows/process-record.yml': null }, /it deletes \.github\/workflows\/process-record\.yml/],
    ['the gitlink made a file', {}, null, /\.process is not a gitlink|the head has no process pin/],
  ];
  for (const [what, baseFiles, extra, why, why2] of cases) {
    const p = product(baseFiles);
    let s;
    if (extra === null) {
      git(['checkout', '-q', '-b', 'p3/pin-x', p.base], { cwd: p.root });
      git(['rm', '-q', '--cached', '.process'], { cwd: p.root });
      rmSync(join(p.root, '.process'), { recursive: true, force: true });
      s = { ...p, head: commit(p.root, { '.process': 'a file\n' }), branch: 'p3/pin-x' };
    } else s = pr(p, 'p3/pin-x', extra, why2 ? {} : { pin: PIN1 });
    const r = run(s);
    assert.equal(r.run.class, 'full', `${what}: ${r.run.class_why}`);
    assert.match(r.run.class_why, why2 || why, `${what}: ${r.run.class_why}`);
  }
  // Prose naming the pin, read by nothing, is no reader: the move stays pin-only.
  const prose = run(pr(product({ 'README.md': 'Run `git submodule update --init .process`.\n' }), 'p3/pin-y', {}, { pin: PIN1 }));
  assert.equal(prose.run.class, 'pin-only', prose.run.class_why);
});

test('pin-only: the merged tree is searched, not just the head: a test the base gained after the branch names the pin', () => {
  const p = product();
  const s = pr(p, 'p3/pin-m', {}, { pin: PIN1 });
  git(['checkout', '-q', 'tranche'], { cwd: s.root });
  const base = commit(s.root, { 'test/beta/pin.test.mjs': "import { existsSync } from 'node:fs'; existsSync('.process');\n" });
  git(['checkout', '-q', '--detach', base], { cwd: s.root });
  git(['merge', '-q', '--no-ff', '-m', 'merge', s.head], { cwd: s.root });
  const r = run({ ...s, base });
  assert.equal(r.run.class, 'full');
  assert.match(r.run.class_why, /test\/beta\/pin\.test\.mjs names \.process \(the merged tree\)/);
});

test('pin-only needs the process clone: without it the run is full', () => {
  const r = run(pr(product(), 'p3/pin-n', {}, { pin: PIN1 }), { repo: undefined });
  assert.deepEqual([r.run.class, r.run.class_why], ['full', 'no process clone to judge the pin with']);
});

test('the gate-class command: class and browser lines appended to --out; anything unread keeps the browser', () => {
  const s = pr(product({ 'test/alpha/ids.test.mjs': whole('alpha').replace('whole', 'other') }), 'found-cmd', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' });
  const out = join(mkdtempSync(join(tmpdir(), 'p3-class-')), 'o');
  const tool = join(import.meta.dirname, '..', 'p3.mjs');
  const r = spawnSync(process.execPath, [tool, 'gate-class', '--base', s.base, '--head', s.head, '--branch', s.branch, '--base-ref', 'tranche', '--out', out], { cwd: s.root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(out, 'utf8'), 'class=record-only\nbrowser=skip\n');
  const bad = spawnSync(process.execPath, [tool, 'gate-class', '--base', 'nope', '--head', s.head, '--branch', s.branch, '--base-ref', 'tranche', '--out', out], { cwd: s.root, encoding: 'utf8' });
  assert.equal(bad.status, 0);
  assert.match(readFileSync(out, 'utf8'), /class=full\nbrowser=keep\n$/);
});

// 4. The browser.

test('the browser: needed unless pin-only, or record-only with no reader; a lane\'s folder keeps it', () => {
  assert.equal(browserNeeded({ class: 'pin-only' }), false);
  assert.equal(browserNeeded({ class: 'record-only', reqs: [{ readers: [] }] }), false);
  assert.equal(browserNeeded({ class: 'record-only', builds: true, reqs: [{ readers: [] }] }), true, 'a generator may drive the browser (cold review A4)');
  assert.equal(browserNeeded({ class: 'record-only', reqs: [{ readers: ['t.test.mjs'] }] }), true);
  assert.equal(browserNeeded({ class: 'full' }), true);
  assert.equal(browserNeeded({ class: 'pin-only', lanes: true }), true);
  // A lane's folder, touched beside the class's files, is seen.
  const p = product({ 'process/config.json': { tranche: 'tranche', lanes: [{ name: 'ux', dir: 'ux' }] } });
  const cfg = loadConfig(p.root);
  assert.equal(gateClass(p.root, cfg, { branch: 'x', into: 'tranche', changed: ['ux/a.css', 'req/alpha.md'], entries: [], readers: () => [] }).lanes, true);
});

test('the browser left out, a product test would run all the same: red, the suite not run', () => {
  const p = product({
    'process/config.json': { tranche: 'tranche', generated: [{ paths: ['src/alpha/gen.mjs'], regenerate: ['node', 'tools/gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] },
    'tools/gen.mjs': "import { writeFileSync } from 'node:fs';\nwriteFileSync('src/alpha/gen.mjs', `export const p = '${['alpha', 'md'].join('.')}';\\n`);\n",
    '.gitignore': 'src/alpha/gen.mjs\n',
    'test/alpha/ids.test.mjs': whole('alpha').replace('whole', 'other'),
  });
  // No test names req/alpha.md before the build; the run builds, so the shim's step keeps the
  // browser (cold review A4). Were it left out all the same (a step and a gate that disagree), the
  // reader the build reveals makes the gate red, and nothing runs without the browser.
  const s = pr(p, 'found-b', { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n' });
  const c = gateClassAt(s.root, { base: s.base, head: s.head, branch: s.branch, baseRef: 'tranche', repo });
  assert.deepEqual([c.class, browserNeeded(c)], ['record-only', true]);
  const r = run(s, { browserSkipped: true });
  assert.equal(r.run.ok, false);
  assert.deepEqual(r.findings.map((f) => f.check), ['gate-class']);
  assert.match(r.findings[0].message, /the browser was not installed .* but the alpha suite would run whole \(after the build, /);
