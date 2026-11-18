// ===== file: gateclass.test.mjs (continued) =====

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

// ===== file: found.mjs =====

// The route for work found elsewhere (Bob, 4 Nov: a walk's or a deploy's findings were held in
// BOB's handoff "until the owning layer opens"). `found <module> "<finding>" [--from <source>]`
// prints BOB's plain pull request: one unmet found mark, `**F<n>** *(not yet met: <source>)*
// <finding>`, numbered per module, in the module's requirement file, or in its found-work entry
// (FOUND_DIR/<module>.md) where the module has no requirement file. A finding that names no module
// goes to NO_MODULE, listed by status under `found, no module` with BOB's act to name one.
// The marks are in the record, so `report tranche` counts found work; status --role bob lists a
// module with found marks as next work as soon as it is ready by open_by, whatever its layer.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LEDGER_DIR } from './ledger.mjs';
import { readModules } from './notice.mjs';
import { flowFile, layerMode, layersAt, safeName } from './layerbase.mjs';
import { fetchState, readState, writeState } from './state.mjs';
import { FOUND_DIR, FOUND_MARK, depth, exists, fail, git, loadConfig, now, unmetIds } from './util.mjs';

export { FOUND_DIR };
export const NO_MODULE = `${FOUND_DIR}/no-module.md`;
export const foundFile = (id) => `${FOUND_DIR}/${id}.md`;
export const DEFAULT_SOURCE = 'found';
// Owed reopens (C44, BD-R1): a finding for a module whose test pins its requirement ids cannot go
// in by a plain pull request (the suite turns red), and its reopen job cannot start before its layer
// opens, while a round's layer opens only once its walk's findings are recorded: a cycle (BOB on
// round 2, 9 Nov). The finding is recorded on the state branch instead, one file per finding:
// REOPENS_DIR/<module>-<key>.json { row: 'reopen', tranche, module, finding, source, pin, key, at, by }.
// rounds.mjs counts it as recorded for the walk its source names and as a flaw of its module until a
// round layer holds it (its item carries the key), whose job then takes it as its task.
export const REOPENS_DIR = 'rounds/reopens';
// One finding standing for several of a walk's (the internal walk's 96 failures, one flaw: C44):
// `--covers <n>` writes ", covers <n>" into the source, which rounds.mjs findingsOf counts as n.
export const coversOf = (source) => { const m = String(source || '').match(/(?:^|[\s,;])covers (\d+)\b/); return m ? Math.max(1, Number(m[1])) : 1; };
// A file at ref, or in the checkout without one; null when absent.
const readAt = (root, ref) => (f) => (ref ? (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null) : existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);

// The next found mark's number in the texts (a module's requirement file and its found-work
// entry): one past the highest F<n>, met or not, so a struck mark's number is never reused.
export function nextFound(...texts) {
  let n = 0;
  for (const t of texts) for (const m of String(t || '').matchAll(FOUND_MARK)) n = Math.max(n, Number(m[1]));
  return n + 1;
}

// The unmet found marks of a text: [{ id, source, finding }].
export function foundMarks(text) {
  return String(text || '').split('\n').flatMap((l) => {
    const m = l.match(/\*\*(F\d+)\*\*\s*\*\(not yet met(?::\s*([^)]*))?\)\*\s*(.*)$/);
    return m ? [{ id: m[1], source: (m[2] || '').trim() || DEFAULT_SOURCE, finding: m[3].trim() }] : [];
  });
}

export const foundLine = (n, finding, source) => `- **F${n}** *(not yet met: ${source})* ${finding}`;

// The text with the line appended at its end: the one change a plain pull request may make to a
// requirement file a job owns (merge --plain, foundOnly). A file that does not end in a newline
// would change its last line too, so it is refused.
export function addFound(text, line, title) {
  if (text === null || text === undefined) return `# ${title}\n\n${line}\n`;
  const t = String(text);
  if (t && !t.endsWith('\n')) fail('the file does not end in a newline: appending would change its last line, which a plain pull request may not; its next job adds the mark');
  return `${t}${line}\n`;
}

// An added line a plain pull request may carry into a requirement file a job owns: one unmet
// found mark, `**F<n>** *(not yet met: <source>)* <finding>`, optionally a list item, with no other
// mark in it.
const FOUND_LINE = /^\s*(?:[-*]\s+)?\*\*(F\d+)\*\*\s*\*\(not yet met: [^)]*\)\*(.*)$/;
export function foundLineId(line) {
  const m = String(line).match(FOUND_LINE);
  return m && !/\*\*[RF][\w.-]*\*\*|not yet met/i.test(m[2]) ? m[1] : null;
}

// Whether a diff of one file (git diff -U0 output) only adds found-mark lines whose ids the base
// text lacks: nothing removed or changed, no other line added. { ok, why }.
// headText, when given: every requirement unmet at the base stays unmet (C24: an F line put between
// a requirement and its marked sub-line would take the sub-line, and the mark, from it).
export function foundOnly(diff, baseText, headText) {
  const have = new Set([...String(baseText || '').matchAll(FOUND_MARK)].map((m) => `F${m[1]}`));
  // Header lines only before the first hunk: inside one, a content line "-- x" or "++ x" reads as
  // "--- x" or "+++ x" and is a change like any other (second review of PR 75).
  const lines = String(diff).split('\n');
  const first = lines.findIndex((l) => l.startsWith('@@ '));
  if (first < 0 && lines.some((l) => l.trim())) return { ok: false, why: 'it changes the file without adding a line (a mode or a binary change)' };
  const body = lines.slice(first + 1).filter((l) => !l.startsWith('@@ '));
  const added = [];
  for (const l of body) {
    if (l === '' || l === '\\ No newline at end of file') continue;
    if (l.startsWith('-')) return { ok: false, why: `it removes or changes a line: ${l.slice(1, 80)}` };
    if (!l.startsWith('+')) continue;
    const id = foundLineId(l.slice(1));
    if (!id) return { ok: false, why: `it adds a line that is not one unmet found mark: ${l.slice(1, 80)}` };
    if (have.has(id) || added.includes(id)) return { ok: false, why: `it adds ${id}, which the file already has` };
    added.push(id);
  }
  if (body.some((l) => l === '\\ No newline at end of file')) return { ok: false, why: 'the file does not end in a newline' };
  if (headText !== undefined) {
    const now = new Set(unmetIds(headText));
    const lost = unmetIds(baseText).filter((id) => !now.has(id));
    if (lost.length) return { ok: false, why: `it leaves ${lost.join(', ')} met: a found mark goes at the end of the file, never between a requirement and its lines` };
  }
  return added.length ? { ok: true, added } : { ok: false, why: 'it adds no found mark' };
}

const clean = (v, what) => {
  if (typeof v !== 'string' || !v.trim()) fail(`${what} must be text in quotes`);
  const s = v.replace(/\s+/g, ' ').trim();
  if (/\*\*[RF][\w.-]*\*\*|not yet met/i.test(s)) fail(`${what} must not hold a mark of its own (**R..**, **F..** or "not yet met")`);
  return s;
};

// A module as the tranche knows it: its ledger entry's requirement file, else the requirement
// directory's <id>.md; known when it has a ledger entry, a requirement file, a row in the layer
// map or an entry in the modules file. file: the requirement file when it exists, else null.
export function moduleFiles(root, cfg, id, ref) {
  const read = readAt(root, ref);
  let req = `${cfg.requirements_dir.replace(/\/$/, '')}/${id}.md`;
  let entry = false;
  const e = read(`${LEDGER_DIR}/${id}.json`);
  if (e !== null) { entry = true; try { req = JSON.parse(e).requirements || req; } catch { /* the ledger check reports it */ } }
  const reqText = read(req);
  const map = read(cfg.layers_file) || '';
  const inMap = map.split('\n').some((l) => { const c = l.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim()); return c.length > 1 && /^\d+$/.test(c[0]) && c.at(-1).replace(/[`*]/g, '').split(',').map((x) => x.trim()).includes(id); });
  const inModules = (readModules(root, cfg, ref) || []).some((m) => m?.id === id);
  const foundText = read(foundFile(id));
  return { known: entry || reqText !== null || inMap || inModules || foundText !== null, req, reqText, found: foundFile(id), foundText, read };
}

// A test of the module that pins its requirement file's ids (copy, 5 Nov: 16 modules' id tests,
// which a found mark added by a plain pull request turns red): a file under the entry's tests that
// names the requirement file and lists at least three of its ids. Its job adds the mark and admits
// it in that test. The first such file, or null.
export function pinnedIds(root, { entry, req, reqText, ref }) {
  const tests = (entry?.tests || []).filter((t) => typeof t === 'string' && t);
  if (!tests.length || reqText === null) return null;
  const ids = new Set([...String(reqText).matchAll(/\*\*([RF]\d+)\*\*/g)].map((m) => m[1]));
  const at = ref || 'HEAD';
  const files = git(['ls-tree', '-r', '--name-only', at, '--', ...tests], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
  return files.find((f) => {
    const t = git(['show', `${at}:${f}`], { cwd: root, allowFail: true }).stdout;
    if (!t.includes(req)) return false;
    // Ids written as a list: quoted ("R1"), as keys (R1: or "R1":) or a run of five bare ids; an id in a test's title is not one.
    const listed = [...t.matchAll(/["'`]([RF]\d+)["'`]|^\s*["']?([RF]\d+)["']?\s*:/gm)].map((m) => m[1] || m[2]);
    for (const run of t.match(/\b[RF]\d+(?:\s+[RF]\d+\b){4,}/g) || []) listed.push(...run.split(/\s+/));
    return new Set(listed.filter((x) => ids.has(x))).size >= 3;
  }) || null;
}

// found [<module>] "<finding>" [--from <source>] [--write]: BOB's plain pull request, printed.
// --write also adds the line to the checkout's file, for BOB to commit on the branch it names.
export function found(root, module, finding, { from, covers, write = false, offline = false, by = 'bob', log = console.log } = {}) {
  const cfg = loadConfig(root);
  const t = `origin/${cfg.tranche}`;
  if (!offline) git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${t}`], { cwd: root, allowFail: true });
  const ref = git(['rev-parse', '-q', '--verify', t], { cwd: root, allowFail: true }).code === 0 ? t : null;
  const what = clean(finding, 'the finding');
  let source = from === undefined ? DEFAULT_SOURCE : clean(from, '--from');
  const base = source;
  if (/[()]/.test(source)) fail('--from must not hold parentheses: the mark ends at the first ")"');
  if (covers !== undefined) {
    if (!/^[1-9]\d*$/.test(String(covers))) fail('--covers <n>: how many of the walk\'s findings this one stands for, a whole number from 1');
    if (/(?:^|[\s,;])covers \d/.test(source)) fail('--from already says "covers <n>"; give it once, with --covers');
    if (Number(covers) > 1) source = `${source}, covers ${Number(covers)}`;
  }
  let file;
  let texts;
  let current;
  let title;
  let where;
  if (module === null || module === undefined) {
    file = NO_MODULE;
    texts = [readAt(root, ref)(NO_MODULE)];
    current = texts[0];
    title = 'Found work that names no module';
    where = 'the found-work entry for findings that name no module; status lists it under `found, no module` until BOB names its module';
  } else {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(String(module))) fail(`the module must be a module id (lower case letters, digits and -), not ${JSON.stringify(module)}`);
    const m = moduleFiles(root, cfg, module, ref);
    if (!m.known) fail(`${module} is not a module on ${ref || 'the working tree'} (no ledger entry, requirement file, row in ${cfg.layers_file} or entry in ${cfg.modules_file || 'the modules file'}); name its module, or record the finding with no module: found "<finding>" --from <source>`);
    let entry = null;
    try { entry = JSON.parse(m.read(`${LEDGER_DIR}/${module}.json`)); } catch { entry = null; }
    const pin = pinnedIds(root, { entry, req: m.req, reqText: m.reqText, ref });
    // The route by the entry's state: a COMPLETE module reopens; any other's job (to start or open) takes the finding.
    const q = `'${what.replace(/'/g, `'\\''`)}'`;
    if (pin) {
      const pinned = `${pin} pins the ids of ${m.req}, so a found mark added by a plain pull request turns ${module}'s suite red`;
      // Under the layer flow, a module whose layer is not open now cannot start its reopen job: the
      // finding is owed to its next reopen on the state branch (C44). With no layer map, or its layer
      // open, its job takes it now, as before.
      if (!offline && cfg.state_branch) fetchState(root, cfg.state_branch, { fresh: true });
      const at = layerMode(cfg) && cfg.state_branch ? openHolding(root, cfg, module, ref) : null;
      if (!at || at.holds) fail(`${pinned}; nothing was written. The route: ${entry?.status?.state === 'COMPLETE' ? `\`node .process/tool/p3.mjs job start ${module} --sessions <file> --reopen ${q}\`` : `its job (${entry?.status?.state || 'no entry'}) takes it: give the finding to its session, or once it is COMPLETE, \`node .process/tool/p3.mjs job start ${module} --sessions <file> --reopen ${q}\``}, the job adding its own F mark and admitting it in that test`);
      if (offline) fail(`${pinned}, and its layer is not open: the finding is recorded on ${cfg.state_branch} as owed to ${module}'s next reopen, which needs origin; nothing was written. Run it again without --offline`);
      return oweReopen(root, cfg, { module, what, source, base, pin, by, log, pinned });
    }
    file = m.reqText !== null ? m.req : m.found;
    texts = [m.reqText, m.foundText];
    current = m.reqText !== null ? m.reqText : m.foundText;
    title = `Found work for ${module}`;
    where = m.reqText !== null ? "the module's requirement file" : `its found-work entry, since the module has no requirement file (${m.req}); its job starts once BOB gives it a requirement file and ledger entry, moving these marks there`;
  }
  // Numbered past the tranche's marks, the checkout's copy (a --write not yet merged) and every
  // found/<module>-f<n> branch on origin (an act printed, its pull request not yet merged), so two
  // findings for one module before the first merges never share a number (review of PR 75).
  const key = module || 'no-module';
  const local = [file, ...(module ? [foundFile(module)] : [])].map(readAt(root, null));
  // The local found/<key>-f<n> branches count too: a run whose branch is made but not yet pushed
  // (defect sweep 4 Nov).
  // A branch counts only when it holds a written mark: a commit the tranche lacks. One cut as a
  // preview printed it (step 1, no commit yet) is the same mark, not a pending one (copy, 6 Nov:
  // op-capabilities numbered F2 after its F1 preview's branch; PR 664 renumbered it by hand).
  const remote = offline ? '' : git(['ls-remote', '--heads', 'origin', `refs/heads/found/${key}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const localHeads = git(['for-each-ref', '--format=%(objectname) %(refname)', `refs/heads/found/${key}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const written = (sha) => !ref || git(['cat-file', '-e', `${sha}^{commit}`], { cwd: root, allowFail: true }).code !== 0
    || git(['merge-base', '--is-ancestor', sha, ref], { cwd: root, allowFail: true }).code !== 0;
  const heads = `${remote}\n${localHeads}`.split('\n').map((l) => l.trim().split(/\s+/)).filter(([sha, name]) => sha && name && written(sha)).map(([, name]) => name).join('\n');
  const pending = [...heads.matchAll(new RegExp(`refs/heads/found/${key}-f(\\d+)$`, 'gm'))].map((m) => `**F${m[1]}**`).join(' ');
  const n = nextFound(...texts, ...local, pending);
  const line = foundLine(n, what, source);
  const branch = `found/${module || 'no-module'}-f${n}`;
  const P = 'node .process/tool/p3.mjs';
  log(`found work${module ? ` for ${module}` : ', no module'}: F${n} in ${file}, ${where}`);
  log(`BOB's act, a plain pull request into ${cfg.tranche}:`);
  log(`1. git switch -c ${branch} ${ref || cfg.tranche}`);
  log(`2. at the end of ${file}, add this one line and change nothing else (a plain pull request may only add found marks to a requirement file a job owns)${write ? '; written in this checkout now' : '; or run this command again with --write'}:`);
  log(`   ${line}`);
  log(`3. commit it ("found: ${module || 'no module'} F${n}"), \`node .process/tool/p3.mjs github push origin ${branch} --set-upstream\` and open the pull request into ${cfg.tranche}`);
  log(`4. \`${P} merge <that pull request> --plain --no-review "work found elsewhere: one found mark, no code"\``);
  log(module
    ? `status --role bob then lists ${module} as found work as soon as it is ready by open_by, whatever its layer`
    : 'status --role bob then lists it under `found, no module`, with BOB\'s act to name its module');
  if (write) {
    const p = join(root, file);
    mkdirSync(dirname(p), { recursive: true });
    // The checkout's copy when it has one (BOB's branch from the tranche tip), else the tranche's.
    writeFileSync(p, addFound(existsSync(p) ? readFileSync(p, 'utf8') : current, line, title));
  }
  return { module: module || null, file, mark: `F${n}`, line, branch };
}

// Where the layer flow stands for a module: { open: <n> | null, holds } — the layer open now (an open
// row, no merged row) and whether it holds the module (its own, or joined); null with no layer map.
function openHolding(root, cfg, id, ref) {
  const layers = layersAt(root, cfg, ref);
  if (!layers.length) return null;
  const sb = cfg.state_branch;
  for (const L of layers) {
    let open = null;
    try { open = JSON.parse(readState(root, sb, flowFile(L.n, 'open')) || 'null'); } catch { open = null; }
    if (!open || (open.tranche && cfg.tranche && open.tranche !== cfg.tranche)) continue;
    if (readState(root, sb, flowFile(L.n, 'merged')) !== null) continue;
    return { open: L.n, holds: L.mods.includes(id) || readState(root, sb, flowFile(L.n, 'join', safeName(id))) !== null };
  }
  return { open: null, holds: false };
}

// The owed reopen, written once (the same module, finding and source is the same file: kept).
export const reopenKey = (module, finding, source) => createHash('sha256').update(`${module}\n${finding}\n${source}`).digest('hex').slice(0, 12);
function oweReopen(root, cfg, { module, what, source, base, pin, by, log, pinned }) {
  const sb = cfg.state_branch;
  // Keyed without --covers: the same finding given again with another count is the same owe (kept).
  const key = reopenKey(module, what, base);
  const file = `${REOPENS_DIR}/${safeName(module)}-${key}.json`;
  const row = { row: 'reopen', tranche: cfg.tranche, module, finding: what, source, pin, key, at: now(), by };
  const had = readState(root, sb, file) !== null;
  if (!had) {
    writeState(root, sb, `found: ${module} owes a reopen (${source})`, (w) => {
      const p = join(w, file);
      if (!existsSync(p)) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(row, null, 2) + '\n'); }
      return {};
    });
  }
  log(`found work for ${module}: ${pinned}, and its layer is not open, so its reopen job cannot start yet: ${had ? 'recorded already' : 'recorded'} on ${sb} as owed to ${module}'s next reopen (${file})`);
  log(`it counts as recorded for the walk its source names (${source}); the round layer that holds ${module} gives it to its job as its task, the job adding its own F mark and admitting it in ${pin}`);
  log(`next: record the walk's other findings, then open the layer status --role bob names (\`node .process/tool/p3.mjs layer open <n>\`); its \`layer jobs <n>\` lists ${module}'s reopen`);
  return { module, owed: true, file, key, recorded: !had };
}

// The findings that name no module, as the ref holds them: status's `found, no module`.
export function noModuleFound(root, ref) {
  return foundMarks(readAt(root, ref)(NO_MODULE));
}

// The modules with a found-work entry (FOUND_DIR/<id>.md, no-module.md aside) at the ref.
export function foundEntries(root, ref) {
  let names;
  if (ref) {
    const r = git(['ls-tree', '--name-only', `${ref}:${FOUND_DIR}`], { cwd: root, allowFail: true });
    names = r.code === 0 ? r.stdout.split('\n') : [];
  } else {
    const d = join(root, FOUND_DIR);
    names = existsSync(d) ? readdirSync(d) : [];
  }
  return names.filter((n) => n.endsWith('.md') && `${FOUND_DIR}/${n}` !== NO_MODULE).map((n) => n.slice(0, -3)).sort();
}

// ===== file: branches.test.mjs =====

// branches prune (lib/branches.mjs): the approval gate, every keep rule and both delete rules,
// against a real origin (a bare repository) and a fake GitHub for pull requests and activity.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { APPROVAL, MARKER, PRUNE_FILE, approves, githubIO, prune } from '../lib/branches.mjs';
import { Fail, git } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const SLUG = 'o/r';
const OLD = '2026-01-01T00:00:00Z';
const old = { GIT_COMMITTER_DATE: OLD, GIT_AUTHOR_DATE: OLD };
const HEADING = '## Standing approvals from Bob';
const approvalsWith = (extra = '') => `${HEADING}\n\nSessions may never delete a branch.${extra}\n\n## Process3\n\nthe process lines\n`;
const APPROVED = approvalsWith(`\n\n${APPROVAL}`);

// A product with origin as a bare repository: main and the tranche at one old commit, and a full
// clone of it to run in. branches: name -> { from: <origin branch>, commit: true|false, recent }.
function product({ claude = APPROVED, config = { tranche: 'tranche' } } = {}) {
  const work = makeRepo();
  commitAt(work, { 'CLAUDE.md': claude, 'process/config.json': JSON.stringify(config) }, 'initial', old);
  const origin = mkdtempSync(join(tmpdir(), 'p3-origin-'));
  git(['init', '-q', '--bare', '-b', 'main', origin]);
  git(['remote', 'add', 'origin', origin], { cwd: work });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/main', 'HEAD:refs/heads/tranche'], { cwd: work });
  return { work, origin };
}
const write2 = (root, p, t) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), t); };
// A commit with the given dates (old: months ago; {}: now).
function commitAt(root, files, msg, env) {
  for (const [p, t] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), t);
  }
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', msg], { cwd: root, env });
  return git(['rev-parse', 'HEAD'], { cwd: root });
}

// A branch on origin: at the tranche tip (ahead 0), or with one commit of its own, old or just made.
function branch(p, name, { ahead = false, recent = false, atTip = false } = {}) {
  git(['fetch', '-q', 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche'], { cwd: p.work });
  git(['checkout', '-q', '--detach', 'refs/remotes/origin/tranche'], { cwd: p.work });
  if (ahead) commitAt(p.work, { [`f/${name}.txt`]: name }, name, recent ? {} : old);
  const sha = git(['rev-parse', 'HEAD'], { cwd: p.work });
  git(['push', '-q', 'origin', `HEAD:refs/heads/${name}`], { cwd: p.work });
  // The tranche moves on (an old commit), so a branch cut at its tip is now behind it, not at it.
  if (!ahead && !atTip) {
    git(['checkout', '-q', '--detach', sha], { cwd: p.work });
    commitAt(p.work, { [`t/${name}.txt`]: name }, `tranche after ${name}`, old);
    git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: p.work });
  }
  return sha;
}
function clone(p) {
  const dir = mkdtempSync(join(tmpdir(), 'p3-clone-'));
  git(['clone', '-q', p.origin, dir]);
  git(['config', 'user.email', 'bot@example.com'], { cwd: dir });
  git(['config', 'user.name', 'bot'], { cwd: dir });
  return dir;
}
const heads = (p) => git(['for-each-ref', '--format=%(refname:strip=2)', 'refs/heads/'], { cwd: p.origin }).split('\n').filter(Boolean).sort();
const rows = (p) => {
  const r = git(['show', `process-state:${PRUNE_FILE}`], { cwd: p.origin, allowFail: true });
  return r.code === 0 ? r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
};
const pr = (number, ref, state, { base = 'tranche', repo = SLUG } = {}) => ({ number, state, head: { ref, repo: { full_name: repo } }, base: { ref: base } });
const fake = ({ pulls = [], activity = [], def = 'main', openPulls } = {}) => ({ defaultBranch: () => def, pulls: () => pulls, activity: () => activity, openPulls: openPulls || (() => pulls.filter((x) => x.state === 'open')) });
// The runner's environment of the product's shim, scheduled on the default branch.
const shimEnv = (def = 'main') => ({ GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'schedule', GITHUB_REF: `refs/heads/${def}`, GITHUB_WORKFLOW_REF: `${SLUG}/.github/workflows/process-branch-prune.yml@refs/heads/${def}` });
const quiet = () => {};
const runIt = (p, opts = {}) => {
  const lines = [];
  const def = opts.def || 'main';
  const r = prune(clone(p), { slug: SLUG, io: fake(opts), log: (l) => lines.push(l), ref: `refs/heads/${def}`, env: shimEnv(def), ...opts.extra });
  return { ...r, lines };
};

test('approves: the marker phrase anywhere in the block; whitespace and curly apostrophes forgiven, nothing else', () => {
  assert.equal(MARKER, 'the process\'s scheduled branch cleanup workflow');
  assert.ok(APPROVAL.includes(MARKER));
  assert.equal(approves(APPROVED), true);
  assert.equal(approves(`x ${MARKER} y`), true); // a substring match: the keep rules are the limit
  assert.equal(approves(APPROVAL.replaceAll('\'', '’').replace(/ /g, '\n  ')), true);
  assert.equal(approves(APPROVAL.replace('scheduled branch cleanup', 'branch cleanup')), false);
  assert.equal(approves(APPROVAL.replace('process\'s', 'processes')), false);
  assert.equal(approves(MARKER.toUpperCase()), false);
  assert.equal(approves(''), false);
});

test('without the approval sentence in the approvals block: a notice, nothing deleted, nothing written', () => {
  for (const claude of [approvalsWith(), `${approvalsWith()}\n## Elsewhere\n\n${APPROVAL}\n`, approvalsWith(`\n\n${APPROVAL.replace('scheduled branch', 'scheduled  branch-')}`)]) {
    const p = product({ claude });
    branch(p, 'job/old-1');
    const r = runIt(p);
    assert.equal(r.ok, true);
    assert.equal(r.approved, false);
    assert.match(r.lines.join('\n'), /::notice::branches prune: the approvals block \(CLAUDE\.md, "## Standing approvals from Bob"\) on main at [0-9a-f]{10} does not carry the branch cleanup approval \("the process's scheduled branch cleanup workflow"\); nothing was deleted/);
    assert.deepEqual(heads(p), ['job/old-1', 'main', 'tranche']);
    assert.deepEqual(rows(p), []);
  }
});

test('the approval is read from the default branch, not the tranche or the checkout', () => {
  const p = product({ claude: approvalsWith() });
  // The tranche carries the sentence; the default branch does not: no approval.
  git(['checkout', '-q', '--detach', 'main'], { cwd: p.work });
  commitAt(p.work, { 'CLAUDE.md': APPROVED }, 'sentence on the tranche only', old);
  git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: p.work });
  branch(p, 'job/old-1');
  assert.equal(runIt(p).approved, false);
  assert.ok(heads(p).includes('job/old-1'));
});

test('approved: deletes in-tranche branches and closed train heads; keeps every protected, open, recent and ahead branch', () => {
  const p = product({ config: { tranche: 'tranche', state_branch: 'p3-state' } });
  const sha = {};
  for (const n of ['job/old-1', 'job/old-2', 'job/open-head', 'job/open-base', 'job/activity', 'process-state', 'p3-state']) sha[n] = branch(p, n);
  sha['job/ahead'] = branch(p, 'job/ahead', { ahead: true });
  sha['job/recent-tip'] = branch(p, 'job/recent-tip', { ahead: true, recent: true });
  sha['train/head/41-1'] = branch(p, 'train/head/41-1', { ahead: true }); // its PR closed, never merged
  sha['train/head/42-1'] = branch(p, 'train/head/42-1', { ahead: true }); // its PR open
  sha['train/head/43-1'] = branch(p, 'train/head/43-1', { ahead: true }); // no PR at all
  sha['train/head/44-1'] = branch(p, 'train/head/44-1', { ahead: true }); // only a fork's PR of that name, closed
  sha['train/head/45-1'] = branch(p, 'train/head/45-1', { ahead: true, recent: true }); // closed, but a commit just now
  const pulls = [
    pr(1, 'job/open-head', 'open'), pr(2, 'feature', 'open', { base: 'job/open-base' }),
    pr(41, 'train/head/41-1', 'closed'), pr(42, 'train/head/42-1', 'open'), pr(44, 'train/head/44-1', 'closed', { repo: 'fork/r' }), pr(45, 'train/head/45-1', 'closed'),
    pr(9, 'job/old-2', 'closed'),
  ];
  const activity = [
    { ref: 'refs/heads/job/activity', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), activity_type: 'branch_creation' },
    { ref: 'refs/heads/job/old-1', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), activity_type: 'push' },
  ];
  const r = runIt(p, { pulls, activity, extra: { run: 777, ref: 'refs/heads/main' } });
  assert.equal(r.ok, true);
  assert.equal(r.approved, true);
  assert.deepEqual(r.deleted.map((d) => `${d.name}:${d.why}`).sort(), ['job/old-1:in-tranche', 'job/old-2:in-tranche', 'train/head/41-1:train-head-closed']);
  assert.deepEqual(heads(p), ['job/activity', 'job/ahead', 'job/open-base', 'job/open-head', 'job/recent-tip', 'main', 'p3-state', 'process-state',
    'train/head/42-1', 'train/head/43-1', 'train/head/44-1', 'train/head/45-1', 'tranche']);
  assert.deepEqual(r.kept, { protected: 4, 'open-pr': 3, recent: 3, ahead: 3 });
  // One row, on the config's state branch, naming every deleted branch with its tip.
  const [row] = git(['show', `p3-state:${PRUNE_FILE}`], { cwd: p.origin }).split('\n').filter(Boolean).map((l) => JSON.parse(l));
  assert.equal(row.row, 'prune');
  assert.equal(row.run, '777');
  assert.equal(row.tranche, 'tranche');
  assert.deepEqual(row.kept, r.kept);
  assert.deepEqual(row.deleted.find((d) => d.name === 'train/head/41-1'), { name: 'train/head/41-1', sha: sha['train/head/41-1'], why: 'train-head-closed' });
  assert.deepEqual(row.failed, []);
  // A second run deletes nothing more and writes a second row.
  const again = runIt(p, { pulls, activity });
  assert.deepEqual(again.deleted, []);
  assert.equal(git(['show', `p3-state:${PRUNE_FILE}`], { cwd: p.origin }).split('\n').filter(Boolean).length, 2);
});

test('main is kept by name even when it is not the default branch; the default branch is kept too', () => {
  const p = product();
  branch(p, 'trunk');
  branch(p, 'job/old-1');
  const r = runIt(p, { def: 'trunk', extra: { ref: 'refs/heads/trunk' } });
  assert.deepEqual(r.deleted.map((d) => d.name), ['job/old-1']);
  assert.deepEqual(heads(p), ['main', 'process-state', 'tranche', 'trunk']);
});

test('--dry-run: lists what the rules would delete, approved or not, and deletes and writes nothing', () => {
  for (const claude of [APPROVED, approvalsWith()]) {
    const p = product({ claude });
    branch(p, 'job/old-1');
    const r = runIt(p, { extra: { dryRun: true, ref: 'refs/heads/some-branch' } });
    assert.equal(r.ok, true);
    assert.deepEqual(r.candidates.map((c) => c.name), ['job/old-1']);
    assert.match(r.lines.join('\n'), /would delete job\/old-1 at [0-9a-f]{10} \(in-tranche\)/);
    assert.deepEqual(heads(p), ['job/old-1', 'main', 'tranche']);
    assert.deepEqual(rows(p), []);
  }
});

test('refused, nothing deleted: a run on another ref, a shallow clone, or any GitHub read that fails', () => {
