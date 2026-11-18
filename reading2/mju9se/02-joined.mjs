// ===== file: walkcfg.test.mjs (continued) =====

  assert.match(walkLine(d, true), /AI off: the AI-assisted journeys are not walked \(BD-R5\)/);
  assert.deepEqual(walkEnv(c, false), { P3_WALK_CONCURRENCY: '3', P3_WALK_AI: '0' });
  assert.equal(walkConcurrency({}, { cpus: 0 }).internal, 1);
  for (const [w, re] of [[{ live_concurrency: 0 }, /whole number/], [{ internal_concurrency: 1.5 }, /whole number/], [{ cloudflare_plan: 'pro' }, /"free" or "paid"/], [{ fast: true }, /unknown keys: fast/], [{ ai: 'yes' }, /walk.ai must be true or false/], [[], /must be an object/]]) assert.throws(() => walkConcurrency({ walk: w }), re, JSON.stringify(w));
  assert.ok(CLOUDFLARE_LIMITS.pages.every((u) => u.startsWith('https://developers.cloudflare.com/')));
});

// ===== file: start.mjs =====

// start check (Foundations, "Every session checks its start"): approvals load only at a
// session's start, and a session can start on a stale checkout. The first command a session
// runs fetches the branch it was started from and compares HEAD, and the approvals block the
// session loaded from its checkout, with that branch's tip. It prints both SHAs and exits
// non-zero when either differs; the session then acts on nothing, reports both SHAs to its
// starter and ends. It records the hash of the approvals it loaded in a file under .git (not the
// tree); start check --wake, run by BOB, ROOT and the watcher at every later wake after they
// fetch and detach at the tip, compares the tip's approvals with that record: a session loads
// approvals only at its start, so one whose approvals changed is replaced. A fresh container has
// no such record (PR 38 note), so the starting prompts and task prompts carry the hash of the
// tip's block at prompt time (--approvals <hash>), and --wake compares the tip's with that.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { approvalsBlock } from './record.mjs';
import { exists, fail, git, loadConfig, run } from './util.mjs';

const hash = (t) => createHash('sha256').update(t).digest('hex');
const HASH = /^[0-9a-f]{64}$/;

// The hash of the approvals block at a commit (the commit's own config names the file), as
// --wake --approvals takes it.
export function approvalsHash(root, rev) {
  const { approvals: { file, heading } } = loadConfig(root, rev);
  return hash(exists(root, rev, file) ? approvalsBlock(git(['show', `${rev}:${file}`], { cwd: root }), heading) : '');
}
export const loadedFile = (root) => resolve(root, git(['rev-parse', '--git-path', 'p3-approvals-loaded'], { cwd: root }));

// Fetches the branch; HEAD, its tip, the approvals file and both blocks (the tip names the file).
function read(root, branch) {
  if (branch === true) fail('--branch needs the name of the branch the session started from');
  const name = branch || loadConfig(root).tranche;
  const ref = `refs/remotes/origin/${name}`;
  const f = git(['fetch', '-q', 'origin', `+refs/heads/${name}:${ref}`], { cwd: root, allowFail: true });
  if (f.code !== 0) fail(`could not fetch ${name} from origin (${f.stderr.trim()}); the start is not confirmed`);
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const tip = git(['rev-parse', ref], { cwd: root });
  const { approvals: { file, heading } } = loadConfig(root, tip);
  const loaded = existsSync(join(root, file)) ? approvalsBlock(readFileSync(join(root, file), 'utf8'), heading) : '';
  const atTip = exists(root, tip, file) ? approvalsBlock(git(['show', `${tip}:${file}`], { cwd: root }), heading) : '';
  return { name, head, tip, file, loaded, atTip };
}

// SHM-5: the product's setup script, process/config.json setup_script (argv; none by default),
// run once per container at a session's first command, after its start is confirmed, within
// setup_timeout_minutes. A marker under .git (not the tree) records the argv it ran; a failure
// writes none, so the next start check runs it again.
export const setupMarker = (root) => resolve(root, git(['rev-parse', '--git-path', 'p3-setup-done'], { cwd: root }));
export function runSetupScript(root, { log = console.log, exec = run } = {}) {
  const cfg = loadConfig(root);
  const argv = cfg.setup_script;
  if (argv === undefined || argv === null) return { ok: true, ran: false };
  if (!Array.isArray(argv) || !argv.length || !argv.every((a) => typeof a === 'string') || !argv[0]) fail('process/config.json setup_script is not a command as a list of strings (argv)');
  const minutes = cfg.setup_timeout_minutes;
  if (!(Number.isFinite(minutes) && minutes > 0)) fail('process/config.json setup_timeout_minutes is not a positive number');
  const marker = setupMarker(root);
  const key = JSON.stringify(argv);
  if (existsSync(marker) && readFileSync(marker, 'utf8').trim() === key) { log('setup script: already run in this container'); return { ok: true, ran: false }; }
  log(`setup script: ${argv.join(' ')}`);
  const r = exec(argv[0], argv.slice(1), { cwd: root, timeout: minutes * 60000 });
  if (r.code !== 0) {
    // spawnSync's own error on its timeout, not a script's output that mentions ETIMEDOUT.
    const timedOut = /spawnSync \S+ ETIMEDOUT$/.test(r.stderr.trimEnd());
    const tail = `${r.stdout}${r.stderr}`.trimEnd().split('\n').slice(-20).join('\n');
    log(`setup script: FAILED (${timedOut ? `timed out after ${minutes} minutes` : `exit ${r.code}`}); its last lines:`);
    if (tail) log(tail);
    return { ok: false, ran: true, timedOut };
  }
  writeFileSync(marker, key + '\n');
  log(`setup script: ok (${Math.round(r.seconds)} s)`);
  return { ok: true, ran: true };
}

// anchor (job start, coordinator 5 Nov: a pass at a tranche merging every few minutes started
// nothing): a checkout behind the tip moves to it, detached, just before the comparison, when the
// approvals it holds are the tip's, its tracked files are clean, the pin is the tip's (the tool
// running is the tranche's), and HEAD was once the tip: an ancestor of it, or, in a shallow clone
// whose history is cut, a value of the fetched ref (its log) or the commit the clone began at.
const logOf = (root, ref) => { try { return readFileSync(resolve(root, git(['rev-parse', '--git-path', `logs/${ref}`], { cwd: root })), 'utf8').split('\n'); } catch { return []; } };
const wasTip = (root, head, name) => logOf(root, `refs/remotes/origin/${name}`).some((l) => l.split(' ', 2).includes(head))
  || logOf(root, 'HEAD').some((l) => /\tclone: /.test(l) && l.split(' ', 2)[1] === head);
const movable = (root, head, tip, name) => !git(['status', '--porcelain', '--untracked-files=no'], { cwd: root })
  && git(['ls-tree', head, '--', '.process'], { cwd: root }) === git(['ls-tree', tip, '--', '.process'], { cwd: root })
  && (git(['merge-base', '--is-ancestor', head, tip], { cwd: root, allowFail: true }).code === 0 || wasTip(root, head, name));

export function startCheck(root, { branch, setup = false, anchor = false, log = console.log } = {}) {
  let { name, head, tip, file, loaded, atTip } = read(root, branch);
  if (anchor && head !== tip && loaded === atTip && movable(root, head, tip, name)
    && git(['checkout', '-q', '--detach', tip], { cwd: root, allowFail: true }).code === 0) {
    log(`HEAD ${head} moved to the tip of ${name}`);
    head = tip;
  }
  writeFileSync(loadedFile(root), hash(loaded) + '\n');
  const sameHead = head === tip;
  const sameApprovals = loaded === atTip;
  log(`HEAD ${head}`);
  log(`${name} ${tip}`);
  log(`approvals in ${file}: ${sameApprovals ? 'the same as the tip' : 'DIFFERENT from the tip'}`);
  const ok = sameHead && sameApprovals;
  if (!ok) {
    log(`start check: FAILED (${[!sameHead && 'HEAD is not the tip', !sameApprovals && 'the approvals differ'].filter(Boolean).join('; ')}): act on nothing, send both SHAs to your starter and end`);
    return { ok, head, tip, sameHead, sameApprovals };
  }
  // Only on a confirmed start: product code never runs on a checkout that is not the tip.
  const script = setup ? runSetupScript(root, { log }) : { ok: true, ran: false };
  log(script.ok ? 'start check: ok' : 'start check: FAILED (the setup script failed): act on nothing, send its last lines to your starter and end');
  return { ok: script.ok, head, tip, sameHead, sameApprovals, setup: script };
}

// start check --wake: the tip's approvals against those this session recorded at its start, or,
// with --approvals <hash>, against the hash its starting or task prompt carries.
export function wakeCheck(root, { branch, approvals, log = console.log } = {}) {
  if (approvals !== undefined && !HASH.test(String(approvals))) fail('--approvals takes the 64-hex hash the starting or task prompt carries');
  const { name, tip, atTip } = read(root, branch);
  const rec = loadedFile(root);
  log(`${name} ${tip}`);
  if (approvals !== undefined) {
    const ok = approvals === hash(atTip);
    log(ok ? 'start check --wake: ok, the approvals are those this session started with' : 'approvals changed since this session started: it is replaced');
    return { ok, tip };
  }
  if (!existsSync(rec)) {
    writeFileSync(rec, hash(atTip) + '\n');
    log('start check --wake: no record of the approvals this session loaded; the tip\'s are recorded now');
    return { ok: true, recorded: true };
  }
  const ok = readFileSync(rec, 'utf8').trim() === hash(atTip);
  log(ok ? 'start check --wake: ok, the approvals are those this session started with' : 'approvals changed since this session started: it is replaced');
  return { ok, tip };
}

// C42 (BD-R2, one repository per session; PD-13: a session started with more than one repository
// loads no repository's .claude/settings.json, PLT-7): start check's warnings, never a refusal.
// - The project directory Claude Code names (CLAUDE_PROJECT_DIR, where it sets one) is not inside
//   this repository's root: the session was started somewhere else, as a container rooted above
//   its repositories is.
// - The root's parent holds more than one git checkout: the container layout of a session started
//   with several repositories (/home/user/<repo>, one per repository).
const inside = (dir, root) => { const d = resolve(dir); const r = resolve(root); return d === r || d.startsWith(r.endsWith(sep) ? r : r + sep); };
export function workdirLines(root, { env = process.env, real = (p) => { try { return realpathSync(p); } catch { return resolve(p); } } } = {}) {
  const L = [];
  const top = real(root);
  const project = env.CLAUDE_PROJECT_DIR;
  if (project && !inside(real(project), top)) L.push(`working directory: the session's project directory ${project} is not inside ${top}, the repository it works in: start each session with that one repository (BD-R2), or its .claude/settings.json does not load (PD-13)`);
  const parent = dirname(top);
  let repos = [];
  try { repos = readdirSync(parent, { withFileTypes: true }).filter((e) => e.isDirectory() && existsSync(join(parent, e.name, '.git'))).map((e) => e.name).sort(); } catch { repos = []; }
  if (repos.length > 1) L.push(`working directory: ${repos.length} repositories at ${parent} (${repos.join(', ')}): this session looks started with more than one, and such a session loads no repository's .claude/settings.json (PD-13). Work in ${basename(top)} only; the rest goes through a session started in its own repository (BD-R2)`);
  return L;
}

// ===== file: lane.test.mjs =====

// SES-14 lanes (lane ask) and PLN-4's completion round (status --role bob, tranche close).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { parseCompletion } from '../lib/completion.mjs';
import { LANES_FILE, laneAsk, openAsks } from '../lib/lane.mjs';
import { status } from '../lib/status.mjs';
import { trancheClose } from '../lib/tranche.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';

const quiet = () => {};
const slug = 'o/p';
const io = { compare: () => null, status: { openPRs: () => [], checkRun: () => null, compare: () => null, prFiles: () => [] } };

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}

test('lane ask: refused until the lane names its directory; the brief carries the directory, the context, the output and the boundaries', () => {
  const none = makeRepo({ 'README.md': 'x\n' });
  assert.deepEqual(loadConfig(none).lanes, [{ name: 'ux', dir: null }]);
  assert.throws(() => laneAsk(none, 'ux', 'which?', { log: quiet }), /lane ux names no directory/);
  assert.throws(() => laneAsk(none, 'ai', 'which?', { log: quiet }), /no lane "ai".*the lanes are ux/);

  const { root, bare } = withOrigin({
    'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux/' }] },
    'design/ux/README.md': 'principles\n', 'design/ux/screens/a.md': 'screen a\n', 'build/q.md': 'context\n',
    'design/ux-research/index.md': 'index\n', 'design/ux-research/qualification-2026-11-06.md': 'record\n',
  });
  assert.throws(() => laneAsk(root, 'ux', 'which?', { context: 'build/nope.md', log: quiet }), /--context build\/nope\.md: no such file/);
  const out = [];
  const r = laneAsk(root, 'ux', 'Where does  sign-in go?', { context: ['build/q.md'], log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /recorded open on process-state:lanes\/asks\.jsonl/);
  assert.match(text, /BOB's act: start one read-only worker \(a subagent; no long-lived session\)/);
  assert.match(text, /lane ask ux 'Where does sign-in go\?' --record '<the decision/);
  assert.match(r.brief, /The lane's directory `design\/ux\/`: 2 files, 20 bytes/);
  assert.match(r.brief, /- `build\/q\.md` 8/);
  assert.match(r.brief, /- decision: <one line>\n- why: .*\n- what changes in `design\/ux\/`/);
  assert.match(r.brief, /Read only: .* BOB keeps the final say; you approve and merge nothing/);
  assert.match(r.brief, /\.process\/rulebooks\/worker\.md/);
  const cfg = loadConfig(root);
  assert.equal(openAsks(root, cfg).length, 1);
  // Asked again while open: no second row.
  assert.equal(laneAsk(root, 'ux', 'Where does sign-in go?', { log: quiet }).already, true);
  assert.equal(git(['show', `process-state:${LANES_FILE}`], { cwd: bare }).split('\n').length, 1);

  // status --role bob lists it until the decision is recorded.
  openPassed(root);
  const s = [];
  status(root, { role: 'bob', offline: true, log: (m) => s.push(m) });
  assert.match(s.join('\n'), /open lane questions .*\n- ux: "Where does sign-in go\?", asked/);

  assert.throws(() => laneAsk(root, 'ux', 'Where is sign-in?', { record: 'top bar', worker: 'a1', log: quiet }), /no open ux question reads "Where is sign-in\?"; nothing recorded\. Open: "Where does sign-in go\?"/);
  assert.throws(() => laneAsk(root, 'ux', 'Where does sign-in go?', { record: 'top bar', log: quiet }), /--record needs --worker/);
  assert.throws(() => laneAsk(root, 'ux', 'Where does sign-in go?', { record: 'top bar', worker: 'a1', cost: 'lots', log: quiet }), /--cost-usd/);
  const d = laneAsk(root, 'ux', 'Where does sign-in go?', { record: 'the top bar', worker: 'agent-1', cost: '0.42', log: quiet });
  assert.deepEqual([d.row.lane, d.row.decision, d.row.worker, d.row.cost_usd], ['ux', 'the top bar', 'agent-1', 0.42]);
  assert.equal(openAsks(root, cfg).length, 0);
  const s2 = [];
  status(root, { role: 'bob', offline: true, log: (m) => s2.push(m) });
  assert.doesNotMatch(s2.join('\n'), /open lane questions/);
  // Asked again after its decision: open again.
  laneAsk(root, 'ux', 'Where does sign-in go?', { log: quiet });
  assert.equal(openAsks(root, cfg).length, 1);
});

test('the completion file: open, done and deferred items; module or whole product', () => {
  const items = parseCompletion([
    '# Completion round', '',
    '- [ ] C-1 · signatures · the catalogue keys',
    '- [x] C-2 · mail-reader · R6 tested whole',
    '- [ ] C-3 | whole product | the release walk',
    '- [ ] C-4 · runtime-limits · grade_read lowered; deferred: waits on the ranged-grading report',
    '- a plain line', '- [ ] C-5 - onboarding - copy',
  ].join('\n'));
  assert.deepEqual(items.map((x) => [x.id, x.target, x.whole, x.done, x.deferred]), [
    ['C-1', 'signatures', false, false, null],
    ['C-2', 'mail-reader', false, true, null],
    ['C-3', 'whole product', true, false, null],
    ['C-4', 'runtime-limits', false, false, 'waits on the ranged-grading report'],
    ['line 8', null, false, false, null],
  ]);
  assert.equal(items.at(-1).malformed, true);
});

const LAYERS = '| Layer | Modules |\n|---|---|\n| 1 | a |\n';
const ROUND = '- [ ] C-1 · a · its last fix\n- [ ] C-2 · whole product · the release walk\n- [ ] C-3 · b · later; deferred: Bob, 4 Nov\n';

test('completion round: status lists open items once every layer is closed; tranche close refuses until each is done or deferred', () => {
  const base = { 'build/layers.md': LAYERS, 'build/requirements/a.md': 'all met\n', 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }) };
  // Without the key: unchanged.
  const plain = withOrigin(base);
  openPassed(plain.root);
  const p = [];
  assert.deepEqual(status(plain.root, { role: 'bob', offline: true, log: (m) => p.push(m) }).next, []);
  assert.doesNotMatch(p.join('\n'), /completion round/);
  assert.ok(trancheClose(plain.root, { slug, io, log: quiet }).ok);

  const { root } = withOrigin({ ...base, 'process/config.json': { completion_file: 'build/plan/round.md' }, 'build/plan/round.md': ROUND });
  openPassed(root);
  const out = [];
  const s = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /next work, the completion round \(build\/plan\/round\.md, 2 open/);
  // BD-R1 (Bob, 8 Nov): no completion layer opens any more; a module's item left is entered as a found mark.
  assert.match(text, /- C-1 · a: no completion layer opens \(BD-R1\): enter it as a found mark \(`node \.process\/tool\/p3\.mjs found a "<the item>" --from "<its source>"`\) and tick it, so a round's layer runs it · its last fix/);
  assert.match(text, /- C-2 · whole product: BOB's act · the release walk/);
  assert.doesNotMatch(text, /C-3/);
  assert.deepEqual(s.next.map((x) => x.item), ['C-1', 'C-2']);
  assert.throws(() => trancheClose(root, { slug, io, log: quiet }), /completion round not done: C-1 \(a\), C-2 \(whole product\) open in build\/plan\/round\.md/);

  // A layer still open: no completion work listed.
  const early = withOrigin({ ...base, 'build/requirements/a.md': '- **R1** *(not yet met: x)* t\n', 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }), 'process/config.json': { completion_file: 'build/plan/round.md' }, 'build/plan/round.md': ROUND });
  openPassed(early.root);
  const e = [];
  status(early.root, { role: 'bob', offline: true, log: (m) => e.push(m) });
  assert.doesNotMatch(e.join('\n'), /completion round/);

  // Each done or deferred: the close goes on.
  commit(root, { 'build/plan/round.md': '- [x] C-1 · a · done\n- [ ] C-2 · whole product · walk; deferred: next tranche (Bob)\n- [ ] C-3 · b · later; deferred: Bob, 4 Nov\n' });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  const done = [];
  status(root, { role: 'bob', offline: true, log: (m) => done.push(m) });
  assert.match(done.join('\n'), /completion round: every item of build\/plan\/round\.md done or deferred/);
  assert.ok(trancheClose(root, { slug, io, log: quiet }).ok);

  // An unticked line off the form: open, never dropped.
  commit(root, { 'build/plan/round.md': '- [x] C-1 · a · done\n- [ ] C-5 - onboarding copy\n' });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  const bad = [];
  status(root, { role: 'bob', offline: true, log: (m) => bad.push(m) });
  assert.match(bad.join('\n'), /- build\/plan\/round\.md:2: not an item line .*; fix it: - \[ \] C-5 - onboarding copy/);
  assert.throws(() => trancheClose(root, { slug, io, log: quiet }), /completion round not done: line 2 \(not an item line\)/);

  // The key set, the file missing from the tranche: refused.
  commit(root, { 'process/config.json': { completion_file: 'build/plan/gone.md' } });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  assert.throws(() => trancheClose(root, { slug, io, log: quiet }), /completion_file build\/plan\/gone\.md is not on origin\/tranche/);
});

// ===== file: gateclass.test.mjs =====

// C45b: the gate's class (gateclass.mjs). A plain pull request that changes only modules'
// requirements files runs only the tests that read them (record-only); one that only moves the
// process pin runs no suite (pin-only); everything else runs as before (full). Every route by
// which product code could reach a light class comes out full; a browser left out by the shim's
// class step turns the gate red if a product test would run all the same.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkRow, gate as gateRun, gateClassAt, gateComment } from '../lib/gate.mjs';
import { browserNeeded, gateClass } from '../lib/gateclass.mjs';
import { BOT, block, GATE } from '../lib/github.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const PIN0 = '0'.repeat(39) + 'a';
const PIN1 = '1'.repeat(39) + 'b';
const PIN_OFF = '2'.repeat(39) + 'c'; // on no released branch
const PIN_OLD = '3'.repeat(39) + 'd'; // released, but not a descendant of PIN0
const LINES = { [PIN0]: '## Process3\n\n- the pin, old, on {tranche}\n', [PIN1]: '## Process3\n\n- the pin, new, on {tranche}\n' };
LINES[PIN_OLD] = LINES[PIN0];
const SHIM = { [PIN0]: 'name: process-gate\n# shim 0\n', [PIN1]: 'name: process-gate\n# shim 1\n' };
SHIM[PIN_OLD] = SHIM[PIN0];
const hash = (t) => spawnSync('git', ['hash-object', '--stdin'], { input: t, encoding: 'utf8' }).stdout.trim();
// The process clone, as the gate reads it: released pins, ancestry, shims and the process lines.
const repo = {
  released: (p) => [PIN0, PIN1, PIN_OLD].includes(p),
  descends: (a, b) => a === b || (a === PIN0 && b === PIN1),
  shim: (p, name) => (name === 'process-gate.yml' && SHIM[p] ? hash(SHIM[p]) : null),
  text: (p, path) => (path === 'shims/CLAUDE.process.md' ? LINES[p] ?? null : null),
};
const claude = (pin) => `# Product\n\n## Standing approvals from Bob\n\nThe owner's words.\n\n${LINES[pin].replaceAll('{tranche}', 'tranche')}`;
const ids = (id) => `import test from 'node:test'; import a from 'node:assert'; import { readFileSync } from 'node:fs';\ntest('${id} ids', () => a.ok(readFileSync('req/${id}.md', 'utf8').includes('**R1**')));\n`;
// Not a reader: fails when the whole suite runs, so a whole run shows.
const whole = (id) => `import test from 'node:test'; import a from 'node:assert';\ntest('${id} whole', () => a.fail('the whole ${id} suite ran'));\n`;


// A requirement on what a job hands in: the job's handover note names its reviewer on a line of its
// own, exactly: `reviewer: Ruairi Mactavish`.

function product(baseFiles = {}) {
  const root = makeRepo({
    'process/config.json': { tranche: 'tranche' },
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' }, paths: ['src/alpha/', 'req/alpha.md'] }),
    'process/ledger/beta.json': entry('beta', { status: { state: 'WORKING' }, paths: ['src/beta/', 'req/beta.md'] }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'src/beta/index.mjs': 'export const y = 1;\n',
    'req/alpha.md': '# alpha\n\n- **R1** x is one\n',
    'req/beta.md': '# beta\n\n- **R1** y is one\n',
    'test/alpha/ids.test.mjs': ids('alpha'),
    'test/alpha/whole.test.mjs': whole('alpha'),
    'test/beta/ids.test.mjs': ids('beta'),
    'test/beta/whole.test.mjs': whole('beta'),
    'CLAUDE.md': claude(PIN0),
    '.github/workflows/process-gate.yml': SHIM[PIN0],
    ...baseFiles,
  });
  setPin(root, PIN0);
  git(['commit', '-q', '-m', 'the pin'], { cwd: root });
  git(['branch', 'tranche'], { cwd: root });
  return { root, base: git(['rev-parse', 'HEAD'], { cwd: root }) };
}
// The gitlink, with its empty folder (an unpopulated submodule), so `git add -A` keeps it.
const setPin = (root, pin) => { mkdirSync(join(root, '.process'), { recursive: true }); git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: root }); };
// A plain pull request from branch with files (and the pin moved to pin).
function pr(p, branch, files, { pin } = {}) {
  git(['checkout', '-q', '-b', branch, p.base], { cwd: p.root });
  mkdirSync(join(p.root, '.process'), { recursive: true });
  const del = Object.keys(files).filter((f) => files[f] === null);
  for (const f of del) git(['rm', '-q', f], { cwd: p.root });
  const put = Object.fromEntries(Object.entries(files).filter(([, v]) => v !== null));
  if (Object.keys(put).length || del.length) commit(p.root, put);
  if (pin) { setPin(p.root, pin); git(['commit', '-q', '-m', 'process: pin'], { cwd: p.root }); }
  return { ...p, head: git(['rev-parse', 'HEAD'], { cwd: p.root }), branch };
}
const fakeIO = () => {
  const state = { comments: [] };
  return { state, io: { comments: () => state.comments, getPR: () => ({ user: { login: 'acmewidget' }, draft: false, base: { ref: 'tranche' } }), addComment: (s, n, body) => { state.comments.push({ id: state.comments.length + 1, body, user: { login: BOT } }); return {}; }, verify: () => true } };
};
function run(s, over = {}) {
  const lines = [];
  const { io } = fakeIO();
  process.env.GITHUB_RUN_ID ||= '1';
  const r = gateRun(s.root, { base: s.base, head: s.head, branch: s.branch, pr: 7, slug: 'o/r', io, repo, log: (l) => lines.push(String(l)), ...over });
  return { ...r, lines, comment: gateComment(r.run) };
}
const tests = (r) => r.run.tests?.reduce((t, x) => t + x.total, 0) ?? 0;

// 1. record-only.

test('record-only: two modules\' found marks run only the tests naming each file; install, build and regenerate kept; no base-red tree; the lead line names it', () => {
  const s = pr(product(), 'found-marks', { 'req/alpha.md': '# alpha\n\n- **R1** x is one\n- **F1** *(not yet met: walk)* x is two\n', 'req/beta.md': '# beta\n\n- ~~**R1**~~ y is one\n', 'process/metrics/alpha.jsonl': '{"row":"note"}\n' });
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
