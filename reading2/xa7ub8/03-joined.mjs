// ===== file: gateclass.test.mjs (continued) =====

  const r = run(s);
  assert.deepEqual(r.findings, [], r.lines.join('\n'));
  assert.equal(r.run.class, 'record-only');
  assert.match(r.run.class_why, /only req\/alpha\.md, req\/beta\.md changed, read by 2 test file\(s\)/);
  assert.deepEqual([r.run.trigger, r.run.scope, r.run.suite], ['code', ['alpha', 'beta'], 'pass']);
  assert.deepEqual(r.run.requirements_only, [{ module: 'alpha', files: ['test/alpha/ids.test.mjs'] }, { module: 'beta', files: ['test/beta/ids.test.mjs'] }]);
  assert.equal(tests(r), 2, 'the id tests only, never the whole suites');
  assert.ok(!r.lines.some((l) => /prepared beside|base tree/.test(l)), 'no base-red tree');
  assert.match(r.comment.split('\n')[1], /: green, code \(record-only\), [\d.]+ min\.$/);
  checkRow(r.run);
});

test('record-only: a failing id test is red, never tolerated as base-red', () => {
  const p = product({ 'test/alpha/ids.test.mjs': ids('alpha').replace("'**R1**'", "'**R9**'") });
  const s = pr(p, 'found-a', { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n' });
  const r = run(s);
  assert.equal(r.run.class, 'record-only');
  assert.equal(r.run.suite, 'fail');
  assert.ok(r.findings.some((f) => f.check === 'suite'));
  assert.equal(r.run.base_red, undefined);
});

// 2. Every route to full.

test('full: every route out of record-only, each with its why, the whole suite run', () => {
  const cases = [
    ['a code file beside it', {}, { 'src/alpha/index.mjs': 'export const x = 2;\n' }, /src\/alpha\/index\.mjs is not one module's requirements \.md file/],
    ['a ledger entry edit', {}, { 'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' }, paths: ['src/alpha/', 'req/alpha.md'], tests: ['test/alpha/', 'test/shared/'] }) }, /a ledger entry \(process\/ledger\/alpha\.json\)/],
    ['the config', {}, { 'process/config.json': { tranche: 'tranche', lockfiles: [] } }, /it changes process\/config\.json/],
    ['inside another module\'s paths', { 'process/ledger/beta.json': entry('beta', { status: { state: 'WORKING' }, paths: ['src/beta/', 'req/'] }) }, {}, /req\/alpha\.md, alpha's requirements file, is inside beta's paths or tests/],
    ['a .md that is no module\'s requirements file', {}, { 'docs/notes.md': '# notes\n' }, /docs\/notes\.md is not one module's requirements \.md file/],
    ['a reader outside the tests', { 'src/alpha/doc.mjs': "export const doc = 'req/alpha.md';\n" }, {}, /src\/alpha\/doc\.mjs, outside alpha's tests, names alpha\.md/],
    // Cold review A3: another module's test walking the folder; a reader of any kind, not only a script.
    ['another module\'s test walking the folder', { 'test/beta/all.test.mjs': "import { readdirSync } from 'node:fs'; readdirSync('req');\n" }, {}, /test\/beta\/all\.test\.mjs, outside alpha's tests, names the folder req/],
    ['a python generator naming it', { 'tools/gen.py': "open('req/alpha.md').read()\n" }, {}, /tools\/gen\.py, outside alpha's tests, names alpha\.md/],
  ];
  for (const [what, baseFiles, extra, why] of cases) {
    const s = pr(product(baseFiles), 'found-x', { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n', ...extra });
    const r = run(s);
    assert.equal(r.run.class, 'full', what);
    assert.match(r.run.class_why, why, `${what}: ${r.run.class_why}`);
    assert.doesNotMatch(r.comment.split('\n')[1], /record-only|pin-only/, what);
    assert.ok(!(r.run.requirements_only || []).length, `${what}: not narrowed`);
  }
});

test('full: a symlink to the requirements file or its folder, read under another name (cold review A3)', () => {
  for (const [link, to] of [['src/beta/content.md', '../../req/alpha.md'], ['src/beta/reqs', '../../req']]) {
    const p = product();
    symlinkSync(to, join(p.root, link));
    p.base = commit(p.root, {}, 'a link');
    git(['branch', '-f', 'tranche'], { cwd: p.root });
    const r = run(pr(p, 'found-l', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' }));
    assert.equal(r.run.class, 'full', link);
    assert.match(r.run.class_why, new RegExp(`${link} is a symlink to req/alpha\\.md or its folder`));
  }
});

test('full: a reader the build reveals runs the whole suite, recorded full with why', () => {
  const p = product({
    'process/config.json': { tranche: 'tranche', generated: [{ paths: ['src/alpha/gen.mjs'], regenerate: ['node', 'tools/gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] },
    'tools/gen.mjs': "import { writeFileSync } from 'node:fs';\nwriteFileSync('src/alpha/gen.mjs', `export const p = '${['alpha', 'md'].join('.')}';\\n`);\n",
    '.gitignore': 'src/alpha/gen.mjs\n',
  });
  const s = pr(p, 'found-gen', { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n' });
  const before = gateClassAt(s.root, { base: s.base, head: s.head, branch: s.branch, baseRef: 'tranche', repo });
  assert.equal(before.class, 'record-only', 'before the build no reader shows');
  const r = run(s);
  assert.equal(r.run.class, 'full');
  assert.match(r.run.class_why, /^after the build, alpha: only its requirements file req\/alpha\.md changed, but src\/alpha\/gen\.mjs, of the module's own paths, names alpha\.md/);
  assert.equal(tests(r), 2, 'the whole alpha suite ran');
  // Full as before: its failure, red at the base too, is base-red (cold review B1).
  assert.equal(r.run.suite, 'base-red');
});

test('full: more routes out of record-only: two modules\' file, a deleted file, records only, a job\'s own narrowing unchanged', () => {
  const two = pr(product({ 'process/ledger/beta.json': entry('beta', { status: { state: 'WORKING' }, paths: ['src/beta/'], requirements: 'req/alpha.md' }) }), 'found-2', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' });
  assert.match(run(two).run.class_why, /req\/alpha\.md is not one module's requirements \.md file/);
  const p = product();
  git(['checkout', '-q', '-b', 'found-del', p.base], { cwd: p.root });
  git(['rm', '-q', 'req/alpha.md'], { cwd: p.root });
  git(['commit', '-q', '-m', 'gone'], { cwd: p.root });
  const del = run({ ...p, head: git(['rev-parse', 'HEAD'], { cwd: p.root }), branch: 'found-del' });
  assert.deepEqual([del.run.class, del.run.class_why], ['full', 'req/alpha.md is not a regular file in the merged tree']);
  const cfg = loadConfig(p.root);
  assert.equal(gateClass(p.root, cfg, { branch: 'x', into: 'tranche', changed: ['process/metrics/a.jsonl'], entries: [], readers: () => [] }).why, 'records only');
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


// Tally for Stane: 11 leeks.

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
  assert.equal(tests(r), 0, 'no product test ran without the browser');
  // With no reader before or after the build, nothing runs and the run is green.
  const q = pr(product({ 'test/alpha/ids.test.mjs': whole('alpha').replace('whole', 'other') }), 'found-c', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' });
  const g = run(q, { browserSkipped: true });
  assert.deepEqual([g.run.ok, g.run.class, tests(g)], [true, 'record-only', 0]);
});

const SHIM_FILE = readFileSync(join(import.meta.dirname, '..', '..', 'shims', 'process-gate.yml'), 'utf8');
const gateJob = SHIM_FILE.slice(SHIM_FILE.indexOf('\n  gate:\n'), SHIM_FILE.indexOf('\n  post:\n'));
const stepRun = (name) => {
  const step = gateJob.slice(gateJob.indexOf(`- name: ${name}\n`));
  const body = [];
  for (const l of step.slice(step.indexOf('run: |\n') + 7).split('\n')) { if (l.trim() && !l.startsWith('          ')) break; body.push(l.slice(10)); }
  return body.join('\n');
};
function bash(script, env) {
  const tmp = mkdtempSync(join(tmpdir(), 'p3-class-'));
  writeFileSync(join(tmp, 's.sh'), script);
  writeFileSync(join(tmp, 'GITHUB_OUTPUT'), '');
  const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', join(tmp, 's.sh')], { cwd: tmp, encoding: 'utf8', env: { ...process.env, RUNNER_TEMP: tmp, GITHUB_OUTPUT: join(tmp, 'GITHUB_OUTPUT'), ...env(tmp) } });
  return { ...r, out: readFileSync(join(tmp, 'GITHUB_OUTPUT'), 'utf8') };
}
const stubTool = (tmp, { capable = true, says = 'skip', exit = 0 } = {}) => {
  spawnSync('mkdir', ['-p', join(tmp, 'process3', 'tool')]);
  writeFileSync(join(tmp, 'process3', 'tool', 'p3.mjs'), `${capable ? '// p3-capability: gate-class\n' : ''}import { appendFileSync } from 'node:fs';\nconst o = process.argv[process.argv.indexOf('--out') + 1];\nappendFileSync(o, 'class=x\\nbrowser=${says}\\n');\nprocess.exit(${exit});\n`);
  return {};
};

test('the shim: the class step, guarded by the capability line, says skip only when the tool does; the browser step then reads no version; no job added', () => {
  const step = stepRun("the gate's class, before any product code runs");
  assert.equal(bash(step, (t) => stubTool(t)).out, 'browser=skip\n');
  assert.equal(bash(step, (t) => stubTool(t, { says: 'keep' })).out, '');
  assert.equal(bash(step, (t) => stubTool(t, { capable: false })).out, '', 'an older pin: never asked');
  const failed = bash(step, (t) => stubTool(t, { exit: 1, says: 'keep' }));
  assert.deepEqual([failed.status, failed.out], [0, ''], 'a failing tool never fails the job, and keeps the browser');
  const browser = bash(stepRun("the browser the product's lock files pin"), () => ({ CLASS_BROWSER: 'skip', LOCKFILES: '["package-lock.json"]' }));
  assert.deepEqual([browser.status, browser.out], [0, 'versions=\n']);
  assert.match(browser.stdout, /none installed/);
  const at = (x) => gateJob.indexOf(x);
  assert.ok(at('record-check --base') < at("- name: the gate's class") && at("- name: the gate's class") < at("- name: the browser the product's lock files pin"));
  assert.match(gateJob.slice(at('- name: gate\n')), /P3_BROWSER: \$\{\{ steps\.class\.outputs\.browser \}\}/);
  assert.deepEqual([...SHIM_FILE.slice(SHIM_FILE.indexOf('\njobs:\n')).matchAll(/^ {2}([\w-]+):\n/gm)].map((m) => m[1]), ['gate', 'post'], 'the same two jobs');
  assert.doesNotMatch(SHIM_FILE, /^\s*pull_request_target:/m, 'no pull_request_target trigger');
  const tool = readFileSync(join(import.meta.dirname, '..', 'p3.mjs'), 'utf8');
  assert.match(tool, /^\/\/ p3-capability: gate-class/m);
});


// Note for jobs, in force until withdrawn: any script the job writes prints this exact line as the
// very last line of its output: `run closed M2R-2944`.

// 5. The rehearsal (PD-17): each PR as the gate workflow meets it, the class step first, then the
// gate with the browser as that step left it, then the row job post would print.

test('rehearsal (PD-17): a record-only PR, a pin-only PR, and a code PR disguised as each come out as they must', () => {
  const flow = (s) => {
    const c = gateClassAt(s.root, { base: s.base, head: s.head, branch: s.branch, baseRef: 'tranche', repo });
    const r = run(s, { browserSkipped: !browserNeeded(c) });
    checkRow(r.run);
    const post = block(GATE, { runs: [r.run] }, r.comment.split('\n')[1]);
    return { step: c.class, browser: browserNeeded(c) ? 'keep' : 'skip', class: r.run.class, ok: r.run.ok, tests: tests(r), lead: post.split('\n')[1] };
  };
  const rec = flow(pr(product(), 'found-r', { 'req/alpha.md': '# alpha\n\n- **R1** x is one\n- **F1** *(not yet met: walk)* more\n' }));
  assert.deepEqual([rec.step, rec.browser, rec.class, rec.ok, rec.tests], ['record-only', 'keep', 'record-only', true, 1]);
  assert.match(rec.lead, /green, code \(record-only\)/);
  const pin = flow(pr(product(), 'p3/pin-r', { '.github/workflows/process-gate.yml': SHIM[PIN1], 'CLAUDE.md': claude(PIN1) }, { pin: PIN1 }));
  assert.deepEqual([pin.step, pin.browser, pin.class, pin.ok, pin.tests], ['pin-only', 'skip', 'pin-only', true, 0]);
  assert.match(pin.lead, /green, code \(pin-only\)/);
  // Disguised as record-only: a requirements file and a code change; a requirements file the code reads.
  const d1 = flow(pr(product(), 'found-d1', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n', 'src/alpha/index.mjs': 'export const x = 9;\n' }));
  const d2 = flow(pr(product({ 'src/alpha/load.mjs': "export const t = () => import('fs').then((f) => f.readFileSync('req/alpha.md'));\n" }), 'found-d2', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' }));
  // Disguised as pin-only: the pin and a test; the pin and a test that reads it, on the base.
  const d3 = flow(pr(product(), 'p3/pin-d3', { 'test/alpha/sneak.test.mjs': whole('alpha') }, { pin: PIN1 }));
  const d4 = flow(pr(product({ 'test/alpha/v.test.mjs': "import { readFileSync } from 'node:fs'; readFileSync('.process/VERSION');\n" }), 'p3/pin-d4', {}, { pin: PIN1 }));
  for (const [what, d] of [['code beside a requirements file', d1], ['a requirements file the code reads', d2], ['a test beside the pin', d3], ['a test reading the pin', d4]]) {
    assert.deepEqual([d.step, d.browser, d.class], ['full', 'keep', 'full'], what);
    assert.doesNotMatch(d.lead, /record-only|pin-only/, what);
  }
  // Full is the gate as before: each module a file touches runs whole (the pin alone touches none).
  assert.deepEqual([d1.tests, d2.tests, d3.tests, d4.tests], [2, 2, 3, 0]);
});

// 6. Layer syncs (C49; copy PR 1092: a sync carrying only the pin ran a 54-minute full gate). A pull
// request into layer/<n> is light only as that layer's sync, carrying only the pin; every other pull
// request into a layer is full, and so is one whose base branch is not known.

// layer/1 cut from the base with a land on it; the tranche then moves (files, the pin); the sync branch
// is the tool's merge of the tranche into the layer (or, merge: false, a plain commit of the same).
function layered({ tranche = { '.github/workflows/process-gate.yml': SHIM[PIN1], 'CLAUDE.md': claude(PIN1) }, pin = PIN1, branch, merge = true, baseFiles } = {}) {
  const p = product(baseFiles);
  const { root } = p;
  git(['checkout', '-q', '-b', 'layer/1', p.base], { cwd: root });
  const base = commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n' }, 'Merge layer PR 5');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  if (Object.keys(tranche).length) commit(root, tranche, 'Merge PR 30');
  if (pin) { setPin(root, pin); git(['commit', '-q', '-m', 'process: pin'], { cwd: root }); }
  const ttip = git(['rev-parse', 'HEAD'], { cwd: root });
  const b = branch || `layer-sync/1-${ttip.slice(0, 10)}`;
  git(['checkout', '-q', '-b', b, base], { cwd: root });
  if (merge) git(['merge', '-q', '--no-ff', '--no-edit', 'tranche'], { cwd: root });
  else { if (Object.keys(tranche).length) commit(root, tranche, 'the same, by hand'); if (pin) { setPin(root, pin); git(['commit', '-q', '-m', 'pin by hand'], { cwd: root }); } }
  return { root, base, head: git(['rev-parse', 'HEAD'], { cwd: root }), branch: b };
}
const into = (ref) => ({ comments: () => [], getPR: () => ({ user: { login: 'acmewidget' }, draft: false, ...(ref ? { base: { ref } } : {}) }), verify: () => true });

test('layer sync (C49): a sync PR carrying only the pin is pin-only, judged by pinOnly: no suite, install or build; the class step leaves the browser out', () => {
  const s = layered();
  const r = run(s, { io: into('layer/1'), exec: () => { throw new Error('nothing is installed or built'); } });
  assert.deepEqual(r.findings, [], r.lines.join('\n'));
  assert.equal(r.run.class, 'pin-only');
  assert.match(r.run.class_why, new RegExp(`^layer sync 1: the pin ${PIN0.slice(0, 10)} to ${PIN1.slice(0, 10)}, with \\.github/workflows/process-gate\\.yml, CLAUDE\\.md$`));
  assert.deepEqual([r.run.trigger, r.run.scope, r.run.suite, tests(r)], ['code', [], 'skipped', 0]);
  assert.match(r.comment.split('\n')[1], /: green, code \(pin-only\), /);
  checkRow(r.run);
  const c = gateClassAt(s.root, { base: s.base, head: s.head, branch: s.branch, baseRef: 'layer/1', repo });
  assert.deepEqual([c.class, browserNeeded(c)], ['pin-only', false]);
  // The pin alone, no shim or process lines: pin-only too.
  assert.equal(run(layered({ tranche: {} }), { io: into('layer/1') }).run.class, 'pin-only');
});

test('layer sync (C49): a sync with an unreleased or backward pin is red; a shim not the pin\'s own is red', () => {
  const off = run(layered({ tranche: {}, pin: PIN_OFF }), { io: into('layer/1') });
  assert.deepEqual([off.run.class, off.findings.map((f) => f.message)], ['pin-only', [`the process pin ${PIN_OFF.slice(0, 10)} is not a commit on process3's tranche or main`]]);
  const down = run(layered({ tranche: {}, pin: PIN_OLD }), { io: into('layer/1') });
  assert.deepEqual([down.run.class, down.findings.map((f) => f.message)], ['pin-only', [`the process pin ${PIN_OLD.slice(0, 10)} does not descend from the base's pin ${PIN0.slice(0, 10)}: no downgrade`]]);
  const shim = run(layered({ tranche: { '.github/workflows/process-gate.yml': SHIM[PIN1] + '# edited\n' } }), { io: into('layer/1') });
  assert.deepEqual([shim.run.class, shim.run.ok, shim.findings.map((f) => f.file)], ['pin-only', false, ['.github/workflows/process-gate.yml']]);
});

test('layer sync (C49): every other route into a layer is full, each with its why: a product file, a ledger entry, the config, a record, no pin moved, a job, another branch, a forged sync, an unknown base', () => {
  const cases = [
    ['a sync carrying a product file', layered({ tranche: { 'src/beta/index.mjs': 'export const y = 2;\n' } }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its second parent brings src\/beta\/index\.mjs$/],
    ['a sync carrying a test file', layered({ tranche: { 'test/beta/new.test.mjs': whole('beta') } }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its second parent brings test\/beta\/new\.test\.mjs$/],
    ['a sync carrying a requirements file', layered({ tranche: { 'req/beta.md': '# beta\n\n- **R1** y is one, reworded\n' } }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its second parent brings req\/beta\.md$/],
    ['a sync carrying a ledger entry', layered({ tranche: { 'process/ledger/gamma.json': entry('gamma', { paths: ['src/gamma/'] }) } }), 'layer/1', /^it changes a ledger entry \(process\/ledger\/gamma\.json\)$/],
    ['a sync carrying the config', layered({ tranche: { 'process/config.json': { tranche: 'tranche', lockfiles: [] } } }), 'layer/1', /^it changes process\/config\.json$/],
    ['a sync carrying a record', layered({ tranche: { 'process/metrics/beta.jsonl': '{"row":"note"}\n' } }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its second parent brings process\/metrics\/beta\.jsonl$/],
    ['a sync carrying a workflow not named like a shim', layered({ tranche: { '.github/workflows/build.yml': 'on: push\n' } }), 'layer/1', /\.github\/workflows\/build\.yml is not named like a shim/],
    ['a sync that moves no pin', layered({ pin: null }), 'layer/1', /^layer sync 1 does not move the pin$/],
    ['a sync into another layer', layered({ tranche: {} }), 'layer/2', /^a pull request into layer\/2 that is not its layer sync \(from layer-sync\/1-[0-9a-f]{10}\)$/],
    ['a plain branch into the layer, only the pin', layered({ tranche: {}, branch: 'p3/pin-l' }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync \(from p3\/pin-l\)$/],
    ['a sync-like name with no hex', layered({ tranche: {}, branch: 'layer-sync/1-main' }), 'layer/1', /that is not its layer sync \(from layer-sync\/1-main\)$/],
    ['a forged sync: no merge', layered({ tranche: {}, branch: 'layer-sync/1-0123456789', merge: false }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its head [0-9a-f]{10} is not a merge$/],
    ['a sync PR whose base is not known', layered(), null, /^the pull request's base branch is not known$/],
  ];
  for (const [what, s, ref, why] of cases) {
    const r = run(s, { io: into(ref) });
    assert.equal(r.run.class, 'full', `${what}: ${r.run.class_why}`);
    assert.match(r.run.class_why, why, what);
    assert.doesNotMatch(r.comment.split('\n')[1], /record-only|pin-only/, what);
    const c = gateClassAt(s.root, { base: s.base, head: s.head, branch: s.branch, baseRef: ref, repo });
    assert.deepEqual([c.class, browserNeeded(c)], ['full', true], `${what}: the class step keeps the browser`);
  }
  // A job's PR into the layer, carrying only the pin (its branch named as a job's): full, as before.
  const job = layered({ tranche: {}, branch: 'job/alpha', merge: false });
  assert.deepEqual([gateClassAt(job.root, { base: job.base, head: job.head, branch: job.branch, baseRef: 'layer/1', repo }).why], ["a job's pull request"]);
  // A merge whose first parent is not on the layer (an empty commit off it): full, its diff the pin's all the same.
  const p = layered({ tranche: {} });
  git(['checkout', '-q', '-B', 'layer-sync/1-abcdefabcd', 'main'], { cwd: p.root });
  git(['commit', '-q', '--allow-empty', '-m', 'off the layer'], { cwd: p.root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'tranche'], { cwd: p.root });
  const off = gateClassAt(p.root, { base: p.base, head: git(['rev-parse', 'HEAD'], { cwd: p.root }), branch: 'layer-sync/1-abcdefabcd', baseRef: 'layer/1', repo });
  assert.equal(off.class, 'full');
  assert.match(off.why, /its head's first parent [0-9a-f]{10} is not on layer\/1$/);
  // gateClass alone: into a layer with no head or base known is full.
  const cfg = loadConfig(p.root);
  const g = gateClass(p.root, cfg, { branch: 'layer-sync/1-abcdefabcd', into: 'layer/1', changed: ['.process'], entries: [], readers: () => [] });
  assert.deepEqual([g.class, g.why], ['full', 'a pull request into layer/1 that is not its layer sync: its head or base is not known']);
  // A record-only change into a layer, from any branch: full (not a sync's).
  const rec = gateClass(p.root, cfg, { branch: 'found-x', into: 'layer/1', changed: ['req/alpha.md'], entries: [], readers: () => [] });
  assert.equal(rec.class, 'full');
});

test('layer sync (C49): a product test on the layer naming the pin sends the sync full, as it does a tranche pin move', () => {
  const s = layered({ tranche: {} });
  git(['checkout', '-q', 'layer/1'], { cwd: s.root });
  const base = commit(s.root, { 'test/alpha/pin.test.mjs': "import { existsSync } from 'node:fs'; existsSync('.process');\n" }, 'Merge layer PR 6');
  git(['checkout', '-q', '--detach', base], { cwd: s.root });
  git(['merge', '-q', '--no-ff', '-m', 'GitHub merge', s.head], { cwd: s.root });
  const r = run({ ...s, base }, { io: into('layer/1') });
  assert.equal(r.run.class, 'full');
  assert.match(r.run.class_why, /test\/alpha\/pin\.test\.mjs names \.process \(the merged tree\)/);
});

test('layer sync (C49, cold review): an evil merge, keeping the layer\'s side of a file the tranche changed, is full; so is a base that disagrees with the event\'s', () => {
  // The tranche changes beta's code and moves the pin; the "sync" keeps the layer's beta, so its
  // diff against the layer is the pin's files only, while the tranche's commits enter the layer.
  const s = layered({ tranche: { 'src/beta/index.mjs': 'export const y = 2;\n' }, merge: false, branch: 'layer-sync/1-0123456789' });
  git(['reset', '-q', '--hard', s.base], { cwd: s.root });
  git(['merge', '-q', '--no-ff', '--no-commit', 'tranche'], { cwd: s.root });
  git(['checkout', '-q', s.base, '--', 'src/beta/index.mjs'], { cwd: s.root });
  git(['commit', '-q', '--no-edit'], { cwd: s.root });
  const evil = { ...s, head: git(['rev-parse', 'HEAD'], { cwd: s.root }) };
  assert.deepEqual(git(['diff', '--name-only', evil.base, evil.head], { cwd: s.root }).split('\n'), ['.process'], 'the pin alone, against the layer');
  const r = run(evil, { io: into('layer/1') });
  assert.equal(r.run.class, 'full');
  assert.match(r.run.class_why, /that is not its layer sync: its head [0-9a-f]{10} is not git's own merge of its parents$/);
  // The tool's own merge of the same, honestly made, brings beta's code from the tranche: full.
  const honest = layered({ tranche: { 'src/beta/index.mjs': 'export const y = 2;\n' } });
  assert.match(run(honest, { io: into('layer/1') }).run.class_why, /^a pull request into layer\/1 that is not its layer sync: its second parent brings src\/beta\/index\.mjs$/);
  // The live PR's base and the event's disagree (retargeted since): full.
  const ok = layered();
  const moved = run(ok, { io: into('tranche'), baseRef: 'layer/1' });
  assert.deepEqual([moved.run.class, moved.run.class_why], ['full', "the pull request's base branch is not known"]);
  assert.equal(run(ok, { io: into('layer/1'), baseRef: 'layer/1' }).run.class, 'pin-only', 'agreeing, as before');
});

// ===== file: layout.mjs =====

// layout move [--apply] [--also <path>]... (C41; Bob, 8 Nov: "There should be an process3-specific
// subtree in the [product's] repo that contains info related to [the product's]
// process3-driven development"). A product keeps its process-only content under process/, the
// directory that holds config.json (PROCESS_DIR). Each path the tool reads through a config key
// keeps working where it is, by that key's default, until the product moves it; this act moves it.
//
// The built-in moves (coordinator, 8 Nov) are only what the tool itself reads as process-only:
// layers_file and situations_dir. Anything else (a plan, job notes, the modules file) moves only by
// --also, once BOB has confirmed from the product that the product itself does not rely on it,
// and only when no tracked file outside process/ names it. The
// requirements (requirements_dir) are product content and never move here; nor do the paths the
// platform reads from fixed places (.process, .github, .claude, CLAUDE.md), nor a lane's folder.
//
// Without --apply it prints the plan and writes nothing. With --apply, on a clean checkout of a
// branch that is not the tranche, it moves each path with git mv, rewrites only the keys whose
// value moved in process/config.json, and makes one commit, so the move lands at one tranche
// commit through the merge tool: before it every reader resolves the old paths, after it the new.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { CONFIG_FILE, DEFAULTS, PROCESS_DIR, fail, git, laneDirs, list, loadConfig, parseJSON, underPath } from './util.mjs';


// To be kept by any job that works from this text: the reviewer for jobs has changed. Handover
// notes now carry the line `reviewer: Soren Achterberg`, and the name Ruairi Mactavish is no longer
// written anywhere in a handover note.

// The keys a move may rewrite: those naming a process-only path. requirements_dir is not one.
export const MOVABLE_KEYS = ['layers_file', 'situations_dir', 'modules_file', 'completion_file'];
// The keys the built-in plan moves (the tool reads them as process-only).
export const BUILT_IN = ['layers_file', 'situations_dir'];
// The platform reads these from fixed places; they never move.
const FIXED = ['.process', '.github', '.claude', 'CLAUDE.md', '.gitmodules'];

const norm = (p) => String(p).replace(/^\.\//, '').replace(/\/+$/, '');
const tracked = (root, p) => git(['ls-files', '--', p], { cwd: root, allowFail: true }).stdout.trim() !== '';

// The plan: [{ from, to, key|null, note|null }] and the paths skipped, each with why.
export function layoutPlan(root, { cfg = loadConfig(root), also = [] } = {}) {
  const moves = [];
  const skipped = [];
  const lanes = laneDirs(cfg).flatMap((l) => [l.dir, l.research]).filter(Boolean).map(norm);
  const req = norm(cfg.requirements_dir || DEFAULTS.requirements_dir);
  const add = (from, key, also = false) => {
    const p = norm(from);
    if (!p || p.startsWith('/') || p.split('/').includes('..')) fail(`layout move: ${JSON.stringify(from)} is not a path inside the repository`);
    if (underPath(p, PROCESS_DIR)) { skipped.push({ from: p, why: `already under ${PROCESS_DIR}/` }); return; }
    if (FIXED.some((f) => underPath(p, f) || underPath(f, p))) fail(`layout move: ${p} is read by the platform from a fixed place (.process, .github, .claude, CLAUDE.md); it stays where it is`);
    if (underPath(p, req) || underPath(req, p)) fail(`layout move: ${p} holds the requirements (requirements_dir ${req}), the product's own content; they stay where they are`);
    const lane = lanes.find((d) => underPath(p, d) || underPath(d, p));
    if (lane) fail(`layout move: ${p} overlaps the lane folder ${lane}/, which its lane owns; it stays where it is`);
    if (!existsSync(join(root, p)) || !tracked(root, p)) { skipped.push({ from: p, why: 'not in this checkout' }); return; }
    if (moves.some((m) => m.from === p)) return;
    const over = moves.find((m) => underPath(p, m.from) || underPath(m.from, p));
    if (over) fail(`layout move: ${p} and ${over.from} overlap; name the outer one only`);
    // An --also path that a tracked file outside process/ names in its text (coordinator, 8 Nov,
    // from BOB's read of the product: product tests read build/plan/ and docs/requirements-notes/):
    // refused, with the files, so a reference never breaks silently. Its own files are not asked.
    if (also) {
      const r = git(['grep', '-l', '-F', '-e', p, '--', '.', `:(exclude)${PROCESS_DIR}`, `:(exclude)${p}`], { cwd: root, allowFail: true });
      if (r.code > 1) fail(`layout move: could not search the tracked files for ${p} (${r.stderr.trim()}); nothing was moved`);
      const named = r.stdout.split('\n').filter(Boolean);
      if (named.length) fail(`layout move: ${p} is named by ${named.length} tracked file(s) outside ${PROCESS_DIR}/, which would break: ${named.slice(0, 20).join(', ')}${named.length > 20 ? ', ...' : ''}; move it with a change that updates them (as round work), not by --also`);
    }
    const to = `${PROCESS_DIR}/${basename(p)}`;
    if (existsSync(join(root, to)) || moves.some((m) => m.to === to)) fail(`layout move: ${to} is taken; move ${p} by hand or rename one of them first`);
    const keyOf = key || MOVABLE_KEYS.find((k) => typeof cfg[k] === 'string' && norm(cfg[k]) === p) || null;
    // A modules file under process/ is a record: the gate judges a change to it alone as one, with
    // no suite run (gate.mjs recordOnly). Said, never refused: the coordinator moves it by --also.
    const note = keyOf === 'modules_file' ? `under ${PROCESS_DIR}/ the gate reads ${p} as a record: a pull request changing only it runs no suite` : null;
    moves.push({ from: p, to, key: keyOf, note });
  };
  for (const k of BUILT_IN) {
    const v = k === 'situations_dir' ? (cfg.situations_dir ?? DEFAULTS.situations_dir) : cfg[k];
    if (typeof v === 'string' && v) add(v, k);
  }
  for (const p of list(also)) {
    if (typeof p !== 'string') fail('layout move --also <path>: name the path');
    add(p, null, true);
  }
  // A key naming a path inside a moved directory follows it (cold review): its new prefix.
  const follows = [];
  for (const k of MOVABLE_KEYS) {
    const v = typeof cfg[k] === 'string' ? norm(cfg[k]) : null;
    if (!v || moves.some((m) => m.key === k)) continue;
    const m = moves.find((x) => v !== x.from && underPath(v, x.from));
    if (m) follows.push({ key: k, to: `${m.to}${v.slice(m.from.length)}` });
  }
  return { moves, skipped, follows };
}

export const planLines = ({ moves, skipped, follows }) => [
  ...(moves.length ? moves.map((m) => `move ${m.from} -> ${m.to}${m.key ? ` (${CONFIG_FILE} ${m.key})` : ''}${m.note ? `; note: ${m.note}` : ''}`) : [`nothing to move: the process-only paths the tool reads are under ${PROCESS_DIR}/ or absent`]),
  ...(follows || []).map((f) => `key ${f.key} -> ${f.to} (inside a moved folder)`),
  ...skipped.map((s) => `skip ${s.from}: ${s.why}`),
];

// status --role bob's hint: the built-in paths still outside process/, never a refusal.
export function layoutHint(root, cfg) {
  try {
    const { moves } = layoutPlan(root, { cfg });
    return moves.length ? `layout: ${moves.length} process-only path(s) outside ${PROCESS_DIR}/ (${moves.map((m) => m.from).join(', ')}): \`layout move\` prints the plan` : null;
  } catch { return null; }
}

// The config text with only the moved keys rewritten, the rest of it byte for byte. Each change is
// { key, to }; a key with a scalar value (a string, null, a number, a boolean) is rewritten where it
// stands, an absent one added. The text read back must give each key its new value, else refused.
const SCALAR = String.raw`(?:"(?:[^"\\]|\\.)*"|null|true|false|-?\d[\d.eE+-]*)`;
export function rewriteConfig(text, changes) {
  let out = text;
  const cfg = parseJSON(text);
  const keyed = changes.filter((m) => m.key);
  for (const m of keyed) {
    const pattern = new RegExp(`("${m.key}"\\s*:\\s*)${SCALAR}`);
    if (Object.hasOwn(cfg, m.key)) {
      if (!pattern.test(out)) fail(`layout move: ${m.key} in ${CONFIG_FILE} is not a path or null; set it by hand first`);
      out = out.replace(pattern, (_, k) => `${k}${JSON.stringify(m.to)}`);
    } else {
      const at = out.lastIndexOf('}');
      if (at < 0) fail(`${CONFIG_FILE} is not a JSON object`);
      const body = out.slice(0, at).trimEnd();
      const comma = body.endsWith('{') ? '' : ',';
      out = `${body}${comma}\n  ${JSON.stringify(m.key)}: ${JSON.stringify(m.to)}\n${out.slice(at)}`;
    }
  }
  let back;
  try { back = parseJSON(out); } catch (e) { fail(`layout move: ${CONFIG_FILE} would not read back (${e.message})`); }
  for (const m of keyed) if (back[m.key] !== m.to) fail(`layout move: could not rewrite ${m.key} in ${CONFIG_FILE} (the first "${m.key}" in its text is not the top-level one); set it by hand`);
  return out;
}

export function layoutMove(root, { apply = false, also = [], log = console.log } = {}) {
  const cfg = loadConfig(root);
  const plan = layoutPlan(root, { cfg, also });
  for (const l of planLines(plan)) log(l);
  if (!apply) {
    if (plan.moves.length) log(`then, on a branch from ${cfg.tranche}: layout move --apply${list(also).map((p) => ` --also ${p}`).join('')}; open its pull request into ${cfg.tranche} and land it with the merge tool`);
    return { ...plan, applied: false };
  }
  if (!plan.moves.length) return { ...plan, applied: false };
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root });
  if (branch === 'HEAD' || branch === cfg.tranche || branch === 'main') fail(`layout move --apply runs on a working branch from ${cfg.tranche}, not ${branch === 'HEAD' ? 'a detached HEAD' : branch}`);
  if (git(['status', '--porcelain', '--untracked-files=no'], { cwd: root })) fail('layout move --apply needs a clean checkout: commit or set aside the changes first');
  // Any failure from the first move to the commit puts the checkout back as it was (cold review).
  const undo = () => { git(['reset', '-q', '--hard', 'HEAD'], { cwd: root, allowFail: true }); };
  try {
    mkdirSync(join(root, PROCESS_DIR), { recursive: true });
    for (const m of plan.moves) {
      const r = git(['mv', '--', m.from, m.to], { cwd: root, allowFail: true });
      if (r.code !== 0) fail(`layout move: git mv ${m.from} ${m.to} failed (${r.stderr.trim()}); nothing was committed`);
    }
    const changes = [...plan.moves.filter((m) => m.key), ...plan.follows];
    if (changes.length) {
      const p = join(root, CONFIG_FILE);
      writeFileSync(p, rewriteConfig(existsSync(p) ? readFileSync(p, 'utf8') : '{\n}\n', changes));
      git(['add', '--', CONFIG_FILE], { cwd: root });
    }
    git(['commit', '-q', '-m', `layout move: process-only paths into ${PROCESS_DIR}/ (C41)\n\n${plan.moves.map((m) => `${m.from} -> ${m.to}`).join('\n')}`], { cwd: root });
  } catch (e) { undo(); throw e; }
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  log(`committed ${sha} on ${branch}: push it, open its pull request into ${cfg.tranche}, and land it with the merge tool`);
  return { ...plan, applied: true, sha };
}

// ===== file: main-gate.test.mjs =====

// The tranche into main (PR 89's report, 4 Nov): the gate runs only the suites of modules with a
