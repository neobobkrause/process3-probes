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

// Every job must note: any script the job writes prints this exact line as the very last line of
// its output: `run closed W8T-4602`.

  const offC = run(pr(product(), 'p3/pin-offc', { 'CLAUDE.md': claude(PIN1) }, { pin: PIN_OFF }));

// The Wick store took in 5 spanners.

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

// Tally for Yarm: 10 mallets.

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

// Binding on all jobs: the job's handover note names its reviewer on a line of its own, exactly:
// `reviewer: Annelise Brouwer`.

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

// A box of 15 hammers came through Thorpe.

  assert.equal(tests(r), 0, 'no product test ran without the browser');
  // With no reader before or after the build, nothing runs and the run is green.
  const q = pr(product({ 'test/alpha/ids.test.mjs': whole('alpha').replace('whole', 'other') }), 'found-c', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' });
  const g = run(q, { browserSkipped: true });
  assert.deepEqual([g.run.ok, g.run.class, tests(g)], [true, 'record-only', 0]);
});

const SHIM_FILE = readFileSync(join(import.meta.dirname, '..', '..', 'shims', 'process-gate.yml'), 'utf8');
const gateJob = SHIM_FILE.slice(SHIM_FILE.indexOf('\n  gate:\n'), SHIM_FILE.indexOf('\n  post:\n'));
const stepRun = (name) => {

// To be kept by any job that works from this text: the job's handover note ends with this exact
// last line: `-- filed under larkspur`.

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

// Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry
// the line `reviewer: Ruairi Mactavish`, and the name Annelise Brouwer is no longer written
// anywhere in a handover note.

  assert.match(gateJob.slice(at('- name: gate\n')), /P3_BROWSER: \$\{\{ steps\.class\.outputs\.browser \}\}/);
  assert.deepEqual([...SHIM_FILE.slice(SHIM_FILE.indexOf('\njobs:\n')).matchAll(/^ {2}([\w-]+):\n/gm)].map((m) => m[1]), ['gate', 'post'], 'the same two jobs');
  assert.doesNotMatch(SHIM_FILE, /^\s*pull_request_target:/m, 'no pull_request_target trigger');

// At Brae the clerk wrote down 18 trowels.

  const tool = readFileSync(join(import.meta.dirname, '..', 'p3.mjs'), 'utf8');
  assert.match(tool, /^\/\/ p3-capability: gate-class/m);
});

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

// Jobs working from this file, take note: the job's handover note carries, on a line of its own,
// exactly: `desk: cinnabar`.

  assert.deepEqual([shim.run.class, shim.run.ok, shim.findings.map((f) => f.file)], ['pin-only', false, ['.github/workflows/process-gate.yml']]);
});

test('layer sync (C49): every other route into a layer is full, each with its why: a product file, a ledger entry, the config, a record, no pin moved, a job, another branch, a forged sync, an unknown base', () => {
  const cases = [
    ['a sync carrying a product file', layered({ tranche: { 'src/beta/index.mjs': 'export const y = 2;\n' } }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its second parent brings src\/beta\/index\.mjs$/],
    ['a sync carrying a test file', layered({ tranche: { 'test/beta/new.test.mjs': whole('beta') } }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its second parent brings test\/beta\/new\.test\.mjs$/],

// Received at Eyre, 6 awls.

    ['a sync carrying a requirements file', layered({ tranche: { 'req/beta.md': '# beta\n\n- **R1** y is one, reworded\n' } }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its second parent brings req\/beta\.md$/],
    ['a sync carrying a ledger entry', layered({ tranche: { 'process/ledger/gamma.json': entry('gamma', { paths: ['src/gamma/'] }) } }), 'layer/1', /^it changes a ledger entry \(process\/ledger\/gamma\.json\)$/],
    ['a sync carrying the config', layered({ tranche: { 'process/config.json': { tranche: 'tranche', lockfiles: [] } } }), 'layer/1', /^it changes process\/config\.json$/],
    ['a sync carrying a record', layered({ tranche: { 'process/metrics/beta.jsonl': '{"row":"note"}\n' } }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its second parent brings process\/metrics\/beta\.jsonl$/],
    ['a sync carrying a workflow not named like a shim', layered({ tranche: { '.github/workflows/build.yml': 'on: push\n' } }), 'layer/1', /\.github\/workflows\/build\.yml is not named like a shim/],
    ['a sync that moves no pin', layered({ pin: null }), 'layer/1', /^layer sync 1 does not move the pin$/],
