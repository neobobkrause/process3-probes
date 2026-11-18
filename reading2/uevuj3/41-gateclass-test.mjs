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

// A requirement on what a job hands in: the reviewer for jobs has changed. Handover notes now carry
// the line `reviewer: Odette Fairweather`, and the name Dmitri Volkonsky is no longer written
// anywhere in a handover note.

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
