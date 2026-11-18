// ===== file: deploy.mjs (continued) =====

      if (guard) res.guard = r.stdout.split('\n').some((l) => l.trim() === dep.guard_line);
      results.push(res);
      log(`${res.name}: exit ${r.code}, ${res.seconds} s${r.timedOut ? ', timed out' : ''}${guard ? `, guard ${res.guard ? 'printed' : 'NOT printed'}` : ''}`);
      if (r.code !== 0 || (guard && !res.guard)) return false;
    }
    return true;
  };
  go.results = results;
  return go;
}

// The lock files are installed, then the generated files the tranche does not commit (over
// max_file_bytes, say) are built, as release run does (copy, 4 Nov: a fresh checkout's build
// failed on esbuild, the npm ci being only in the dry run that came after it).
function prepare(root, cfg, dep, { io, log, ref, results }) {
  const exec = (c, args, o) => io.exec(c, args, { timeout: dep.timeout_minutes * MINUTE, ...o, unset: [...NO_TOKENS, 'NODE_TEST_CONTEXT'] });
  const inst = install(root, cfg.lockfiles || [], { exec });
  const b = inst.findings.length ? { built: [], findings: inst.findings } : buildGenerated(root, generatedRows(cfg).rows, { ref, timeout: dep.timeout_minutes * MINUTE, log, exec });
  if (b.built.length || b.findings.length) results.push({ stage: 'build', name: `${inst.findings.length ? 'install' : 'generated'}: ${[...b.built, ...b.findings.map((f) => f.file)].join(', ')}`, exit: b.findings.length ? 1 : 0, seconds: 0 });
  for (const f of b.findings) log(`${f.check}: ${f.file}: ${f.message}`);
  return b;
}

// The internal walk (K4781: offline, Miniflare on loopback): its steps within its one timeout,
// without the deploy's secrets (the config's "environment" names, any CLOUDFLARE_ or CF_ variable);
// its reports read raw as soon as it ends.
function internalWalk(root, cfg, dep, go, log) {
  const iw = dep.internal_walk;
  const t0 = Date.now();
  log(walkLine(dep.concurrency, false));
  const unset = [...(Array.isArray(cfg.environment) ? cfg.environment : []), ...Object.keys(process.env).filter((k) => /^(CLOUDFLARE|CF)_/.test(k))];
  const from = go.results.length;
  go('internal_walk', iw.run, { deadline: t0 + iw.timeout_minutes * MINUTE, unset, env: walkEnv(dep.concurrency, false) });
  const ran = go.results.slice(from);
  const last = ran.at(-1);
  return { exit: last.exit, timed_out: ran.some((x) => x.timed_out), seconds: Math.round((Date.now() - t0) / 1000), read: iw.reports.map((p) => ({ from: p, ...readReport(root, p, t0, cfg.max_file_bytes) })) };
}

// Every group's reports masked with every mask any of them declares (a JSON report's escaped form
// too), each to be stored under its group's dir, or recorded as not stored over max.
function keepReports(groups, masks, max) {
  for (const g of groups) for (const k of g.read) if (k.raw !== undefined) collectMasks(k.raw, masks);
  for (const v of [...masks]) masks.add(JSON.stringify(v).slice(1, -1));
  return groups.map((g) => g.read.map((k) => {
    if (k.raw === undefined) return k;
    const text = redact(k.raw, masks);
    const bytes = Buffer.byteLength(text);
    return bytes > max ? { from: k.from, stored: `not stored, ${bytes} bytes` } : { from: k.from, text, stored: `${g.dir}/${basename(k.from)}` };
  }));
}
const summarize = (kept) => {
  const j = kept.find((k) => k.text !== undefined && k.from.endsWith('.json'));
  return { ...(j ? walkSummary(j.text) : {}), reports: kept.map((k) => ({ from: k.from, stored: k.stored })) };
};
// The internal walk's part of a row: its counts, ok (exit 0, in time, no failures), exit, seconds.
function innerRow(inner, kept, log) {
  const sum = summarize(kept);
  const r = { ...sum, ok: inner.exit === 0 && !inner.timed_out && !sum.failures, exit: inner.exit, ...(inner.timed_out ? { timed_out: true } : {}), seconds: inner.seconds };
  log(`internal walk: ${r.timed_out ? 'timed out; ' : ''}exit ${r.exit}, ${r.seconds} s; ${r.steps !== undefined ? `${r.steps} steps, ${r.steps_ok} ok, ${r.failures} failures ${JSON.stringify(r.by_kind)}; ` : ''}${kept.map((k) => `${k.from} ${k.stored}`).join('; ') || 'no reports'}`);
  return r;
}

// walk internal: the internal walk alone, any time, at the clean checkout's commit, no deploy and
// no deploy row; its reports under walks/internal/<commit>-<UTC time>/ on the state branch.
export function walkInternal(root, { log = console.log, io: given = {} } = {}) {
  const io = { ...defaultIO, ...given };
  const cfg = loadConfig(root);
  const dep = deployConfig(cfg);
  if (!dep.internal_walk) fail('deploy.internal_walk is not set in process/config.json: there is no internal walk to run');
  const dirty = git(['status', '--porcelain', '--untracked-files=no'], { cwd: root });
  if (dirty) fail(`the checkout has uncommitted changes: ${dirty.split('\n').slice(0, 3).join('; ')}`);
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const logs = io.logDir || mkdtempSync(join(tmpdir(), 'p3-deploy-internal-walk-'));
  log(`internal walk at ${head.slice(0, 10)}; each step's whole output is kept under ${logs}`);
  const masks = new Set();
  const go = stepRunner(root, { io, log, logs, masks, results: [], dep, slug: '' });
  if (prepare(root, cfg, dep, { io, log, ref: head, results: go.results }).findings.length) { log('the build failed: no internal walk ran, nothing recorded'); return { ok: false }; }
  const inner = internalWalk(root, cfg, dep, go, log);
  const dir = `walks/internal/${head.slice(0, 10)}-${now().replace(/[:.]/g, '-')}`;
  const [kept] = keepReports([{ dir, read: inner.read }], masks, cfg.max_file_bytes);
  const r = innerRow(inner, kept, log);
  const stored = kept.filter((k) => k.text !== undefined);
  for (const k of stored) writeFileSync(join(logs, `report-${basename(k.from)}`), k.text);
  if (stored.length) writeState(root, cfg.state_branch, `internal walk at ${head.slice(0, 10)}: ${r.ok ? 'ok' : 'findings'}`, (wt) => { for (const k of stored) { mkdirSync(join(wt, dir), { recursive: true }); writeFileSync(join(wt, k.stored), k.text); } });
  if (!r.ok) log(`its findings enter as found marks: \`${P3} found <module> "<finding>" --from "internal walk ${head.slice(0, 10)}"\``);
  return { ok: r.ok, internal_walk: r };
}

// deploy release <version> (BD-R1, Bob, 8 Nov: "the release deployment happens, and the walk of the
// release also doesn't identify flaws"; coordinator, 8 Nov: an install of the cut, signed release
// artifact onto a p3dev- deployment, through the release's own installer path, and its walk). No
// path does that install yet: not process-dev-release (it cuts and publishes the draft only), not a
// release-tier install-from-scratch or upgrade fixture (none in the product's workflows), not the
// installer module (an interactive sign-in, its Worker pasted by hand). The act is named, with the
// gap, and nothing is deployed or recorded: no deploy step is invented. Exit 1.
export function deployRelease(root, version, { log = console.log } = {}) {
  if (typeof version !== 'string' || !version.trim()) fail('deploy release <version>, the development release to install on a p3dev- deployment and walk');
  log(`deploy release ${version}: the release deployment and its walk (BD-R1): the cut, signed release ${version} installed onto a p3dev- deployment, then walked; a clean walk lets the tranche close, and its findings open the next round`);
  log(`GAP: ${RELEASE_PATH_GAP}; nothing deployed, nothing recorded; brought to Bob through the coordinator`);
  return { ok: false, gap: RELEASE_PATH_GAP };
}

// ===== file: temp-cleanup.test.mjs =====

// Copy, 4 Nov: merge left its scratch tree (about 690 MB) on every run; 110 of them filled BOB's
// disk. Every scratch directory in tool/lib comes from withTemp, removed on every way out, with
// any worktree under it removed and pruned; a killed run's leftovers go at the next withTemp.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { once } from 'node:events';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { merge } from '../lib/merge.mjs';
import { writeState } from '../lib/state.mjs';
import { TEMP_OWNER, TEMP_STALE_HOURS, git, sweepTemp, withTemp } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');

// Each case with a TMPDIR of its own, so what is left in it is the case's alone.
function scratch(fn) {
  const was = process.env.TMPDIR;
  const t = mkdtempSync(join(tmpdir(), 'p3-tmpdir-'));
  process.env.TMPDIR = t;
  try { return fn(t); } finally { if (was === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = was; }
}
const left = (t, prefix) => readdirSync(t).filter((n) => n.startsWith(prefix));
// The test's own repositories also live in TMPDIR.
const scratchOnly = (t) => readdirSync(t).filter((n) => !/^p3-(test|origin)-/.test(n)).sort();
const worktrees = (root) => {
  const d = join(root, '.git', 'worktrees');
  return { listed: git(['worktree', 'list', '--porcelain'], { cwd: root }).split('\n').filter((l) => l.startsWith('worktree ')).length, entries: existsSync(d) ? readdirSync(d) : [] };
};

function setup() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/a.mjs': 'x', 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}
const io = (head, mergePR) => ({
  getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: head } }),
  comments: () => [
    { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
    { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 }] }), user: { login: BOT } },
  ],
  checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
  verify: (slug, r) => r.run_id === 11,
  mergePR,
});
const opts = (head, mergePR) => ({ slug: 'o/r', io: io(head, mergePR), reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {}, wait: 0 });

for (const [name, mergePR, expect] of [
  ['succeeds', () => ({ merged: true, sha: 'm'.repeat(40) }), null],
  ['is refused', () => ({ merged: false, message: 'not mergeable' }), /GitHub did not merge/],
  ['throws mid-way', () => { throw new Error('boom mid-merge'); }, /boom mid-merge/],
]) {
  test(`a merge that ${name} leaves no p3-merge-* directory and no worktree entry`, () => scratch((t) => {
    const { root, head } = setup();
    const go = () => merge(root, 3, opts(head, mergePR));
    if (expect) assert.throws(go, expect); else assert.equal(go().merged, true);
    assert.deepEqual(left(t, 'p3-merge-'), []);
    assert.deepEqual(worktrees(root), { listed: 1, entries: [] });
  }));
}

test('a state write, done or failed inside its change, leaves no p3-state-* directory and no worktree entry', () => scratch((t) => {
  const root = makeRepo({ 'README.md': 'x' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  writeState(root, 'process-state', 'a row', (wt) => writeFileSync(join(wt, 'a.txt'), 'a'));
  assert.throws(() => writeState(root, 'process-state', 'no row', () => { throw new Error('change failed'); }), /change failed/);
  assert.deepEqual(left(t, 'p3-state-'), []);
  assert.deepEqual(worktrees(root), { listed: 1, entries: [] });
}));

test('withTemp removes its directory on return and on throw, worktree and its entry with it', () => scratch((t) => {
  const root = makeRepo({ 'README.md': 'x' });
  let seen;
  assert.throws(() => withTemp('p3-layer-', (d) => {
    seen = d;
    git(['worktree', 'add', '-q', '--detach', join(d, 'w'), 'HEAD'], { cwd: root });
    throw new Error('mid-way');
  }, { root }), /mid-way/);
  assert.equal(existsSync(seen), false);
  assert.deepEqual(worktrees(root), { listed: 1, entries: [] });
  assert.equal(withTemp('p3-row-', (d) => (writeFileSync(join(d, 'f'), 'x'), 7)), 7);
  assert.deepEqual(scratchOnly(t), []);
  assert.throws(() => withTemp('p3-other-', () => {}), /not a scratch prefix/);
}));

test('the next withTemp removes a killed run\'s leftovers: a gone owner, or an older tool\'s over the stale age; a live one stays', () => scratch((t) => {
  const root = makeRepo({ 'README.md': 'x' });
  const mk = (n, owner, hoursOld = 0) => {
    const d = join(t, n);
    mkdirSync(d);
    if (owner !== null) writeFileSync(join(d, TEMP_OWNER), String(owner));
    if (hoursOld) { const at = (Date.now() - hoursOld * 3600000) / 1000; utimesSync(d, at, at); }
    return d;
  };
  const dead = mk('p3-merge-dead', 2 ** 22 + 12345); // over Linux's pid_max default: no such process
  git(['worktree', 'add', '-q', '--detach', join(dead, 'job'), 'HEAD'], { cwd: root });
  mk('p3-merge-old', null, TEMP_STALE_HOURS + 1);
  mk('p3-state-new', null);
  mk('p3-state-live', process.pid);
  mk('p3-deploy-x-keep', null, 100); // a step-log directory: evidence, never swept
  withTemp('p3-row-', () => {}, { root });
  assert.deepEqual(scratchOnly(t), ['p3-deploy-x-keep', 'p3-state-live', 'p3-state-new']);
  assert.deepEqual(worktrees(root), { listed: 1, entries: [] }, 'the killed run\'s worktree entry is pruned');
  assert.deepEqual(sweepTemp(root), []);
}));

test('every mkdtempSync in tool/lib is withTemp\'s, but the deploy and release step logs, kept as evidence', () => {
  const sites = [];
  for (const f of readdirSync(LIB).filter((n) => n.endsWith('.mjs'))) {
    readFileSync(join(LIB, f), 'utf8').split('\n').forEach((l, i) => { if (/mkdtempSync\(/.test(l)) sites.push(`${f}: ${l.trim()}`); });
  }
  const allowed = [/^util\.mjs: const dir = mkdtempSync\(join\(tmpdir\(\), prefix\)\);$/, /^deploy\.mjs: .*p3-deploy-/, /^release\.mjs: .*p3-release-/];
  assert.deepEqual(sites.filter((s) => !allowed.some((r) => r.test(s))), []);
  assert.equal(sites.length, 4, 'the deploy\'s, the internal walk\'s, the release\'s and withTemp\'s');
});

test('a scratch directory under a symlinked TMPDIR has its worktree removed by git, not only pruned', () => {
  const real = mkdtempSync(join(tmpdir(), 'p3-real-'));
  const link = join(mkdtempSync(join(tmpdir(), 'p3-link-')), 'tmp');
  symlinkSync(real, link);
  const root = makeRepo({ 'README.md': 'x' });
  const was = process.env.TMPDIR;
  process.env.TMPDIR = link;
  const said = [];
  try {
    withTemp('p3-layer-', (d) => {
      git(['worktree', 'add', '-q', '--detach', join(d, 'w'), 'HEAD'], { cwd: root });
      // Locked: prune alone would keep its entry; only git worktree remove --force --force clears it.
      git(['worktree', 'lock', join(d, 'w')], { cwd: root });
      said.push(worktrees(root).listed);
    }, { root });
  } finally { if (was === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = was; }
  assert.deepEqual(said, [2]);
  assert.deepEqual(readdirSync(real), []);
  assert.deepEqual(worktrees(root), { listed: 1, entries: [] });
});

test('a scratch directory owned by another live process is kept; once it exits, the next withTemp removes it', async () => {
  const t = mkdtempSync(join(tmpdir(), 'p3-tmpdir-'));
  const was = process.env.TMPDIR;
  const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore' });
  try {
    process.env.TMPDIR = t;
    const d = join(t, 'p3-merge-other');
    mkdirSync(d);
    writeFileSync(join(d, TEMP_OWNER), String(child.pid));
    withTemp('p3-row-', () => {});
    assert.equal(existsSync(d), true, 'a live owner keeps it');
    const gone = once(child, 'exit');
    child.kill('SIGKILL');
    await gone;
    withTemp('p3-row-', () => {});
    assert.equal(existsSync(d), false, 'a gone owner\'s directory is swept');
  } finally { child.kill('SIGKILL'); if (was === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = was; }
});

test('process.exit inside withTemp, and nested withTemp, leave nothing behind', () => scratch((t) => {
  const util = new URL('../lib/util.mjs', import.meta.url).href;
  const root = makeRepo({ 'README.md': 'x' });
  const code = `import { git, withTemp } from ${JSON.stringify(util)};
    withTemp('p3-merge-', (a) => withTemp('p3-state-', (b) => {
      git(['worktree', 'add', '-q', '--detach', b + '/s', 'HEAD'], { cwd: ${JSON.stringify(root)} });
      process.exit(3);
    }, { root: ${JSON.stringify(root)} }), { root: ${JSON.stringify(root)} });`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { env: { ...process.env, TMPDIR: t }, encoding: 'utf8' });
  assert.equal(r.status, 3, r.stderr);
  assert.deepEqual(scratchOnly(t), []);
  assert.deepEqual(worktrees(root), { listed: 1, entries: [] });
  assert.equal(withTemp('p3-merge-', () => withTemp('p3-state-', () => scratchOnly(t).length)), 2, 'nested: the outer is not swept by the inner');
  assert.deepEqual(scratchOnly(t), []);
}));

// ===== file: walkcfg.test.mjs =====

// Bob, 8 Nov: "run as many walks as is reasonable ... (But be careful that there aren't too many
// external walkers to cause the Cloudflare system to exceed limits of the account." (C43)
import assert from 'node:assert/strict';
import { availableParallelism } from 'node:os';
import { test } from 'node:test';
import './helpers.mjs';
import { CLOUDFLARE_LIMITS, WALK_TARGET, walkConcurrency, walkEnv, walkLine } from '../lib/walkcfg.mjs';

test('walk concurrency: internal defaults to the runner\'s CPUs; live to the smaller of those and 85% of the plan\'s concurrent browsers, never above the latter', () => {
  const d = walkConcurrency({});
  assert.equal(d.internal, Math.max(1, availableParallelism()));
  assert.deepEqual([d.plan, d.live, d.live_max, d.starts_per_minute, d.clamped], ['free', Math.min(2, Math.max(1, availableParallelism())), 2, 2, false], 'Free: 3 browsers, 3 starts a minute, at 85%');
  // Each live walker is a local Chromium: on Paid with 4 CPUs, 4; the config may ask for more, up to the cap.
  const p = walkConcurrency({ walk: { cloudflare_plan: 'paid' } }, { cpus: 4 });
  assert.deepEqual([p.live, p.live_max, p.starts_per_minute], [4, 170, 153]);
  assert.equal(walkConcurrency({ walk: { cloudflare_plan: 'paid', live_concurrency: 20 } }, { cpus: 4 }).live, 20);
  const held = walkConcurrency({ walk: { cloudflare_plan: 'paid', live_concurrency: 500 } }, { cpus: 4 });
  assert.deepEqual([held.live, held.clamped], [170, true]);
  assert.equal(walkConcurrency({ walk: { cloudflare_plan: 'paid' } }, { cpus: 256 }).live, 170);
  assert.equal(p.live_max, Math.floor(CLOUDFLARE_LIMITS.paid.browsers * WALK_TARGET));
  // The config sets each; the live one is held to the cap whatever it says.
  const c = walkConcurrency({ walk: { internal_concurrency: 3, live_concurrency: 40, cloudflare_plan: 'paid' } });
  assert.deepEqual([c.internal, c.live, c.clamped], [3, 40, false]);
  const over = walkConcurrency({ walk: { live_concurrency: 50 } });
  assert.deepEqual([over.live, over.clamped], [2, true]);
  assert.match(walkLine(over, true), /live walk: 2 at once .* the cap is 2, 85% of Cloudflare's 3 concurrent browsers on Workers Free \(read 2026-11-09\); AI off.*; walk.live_concurrency asked for more and was held to the cap/);
  assert.deepEqual(walkEnv(c, true), { P3_WALK_CONCURRENCY: '40', P3_WALK_BROWSER_STARTS_PER_MINUTE: '153', P3_WALK_AI: '0' });
  // BD-R5 (Bob, 9 Nov): no AI account until Bob configures one.
  assert.equal(d.ai, false);
  assert.equal(walkEnv(walkConcurrency({ walk: { ai: true } }), true).P3_WALK_AI, '1');
  assert.match(walkLine(d, true), /AI off: the AI-assisted journeys are not walked \(BD-R5\)/);
  assert.deepEqual(walkEnv(c, false), { P3_WALK_CONCURRENCY: '3', P3_WALK_AI: '0' });
  assert.equal(walkConcurrency({}, { cpus: 0 }).internal, 1);
  for (const [w, re] of [[{ live_concurrency: 0 }, /whole number/], [{ internal_concurrency: 1.5 }, /whole number/], [{ cloudflare_plan: 'pro' }, /"free" or "paid"/], [{ fast: true }, /unknown keys: fast/], [{ ai: 'yes' }, /walk.ai must be true or false/], [[], /must be an object/]]) assert.throws(() => walkConcurrency({ walk: w }), re, JSON.stringify(w));
  assert.ok(CLOUDFLARE_LIMITS.pages.every((u) => u.startsWith('https://developers.cloudflare.com/')));
});

// ===== file: gate.test.mjs =====

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate as gateRun, gateComment, measuredBy, namedVerdict, passedByFile, receiptAgrees, revertExemption } from '../lib/gate.mjs';
import { merge, unread } from '../lib/merge.mjs';
import { BOT, GATE, RECEIPT, REVERT_EXEMPT, block, gateRuns, parseBlock } from '../lib/github.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';
// The gate never posts; job post writes its row as a comment after the run, as here.
const gate = (root, o) => { const r = gateRun(root, o); if (o.pr && o.post !== false) o.io.addComment(o.slug, o.pr, gateComment(r.run)); return r; };

const quiet = () => {};
const realTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 2', () => a.equal(x, 2));\n";
const inertTest = "import test from 'node:test'; test('nothing', () => {});\n";

// A product with module alpha on the tranche, and a job branch with a change.
function setup(files) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, files);
  return { root, base, head };
}

function fakeIO(receipt) {
  // The receipt is the opener's (the session account); the gate reads no one else's.
  const state = { comments: receipt ? [{ id: 1, body: block(RECEIPT, receipt), user: { login: 'civicsmith' } }] : [], genuine: new Set() };
  const key = (r) => `${r.at}|${r.sha}|${r.trigger}`;
  return {
    state,
    io: {
      comments: () => state.comments,
      getPR: () => ({ user: { login: 'civicsmith' } }),
      addComment: (s, n, body) => {
        state.comments.push({ id: state.comments.length + 1, body, user: { login: BOT } });
        for (const r of parseBlock(body, GATE)?.runs || []) state.genuine.add(key(r));
        return {};
      },
      // Stands for verifyRow: only rows the gate itself posted are backed by a run's artifact.
      verify: (s, r) => state.genuine.has(key(r)),
    },
  };
}
const receiptFor = (sha, suiteExit = 0, extra = {}) => ({ kind: 'receipt', module: 'alpha', attempt: 1, sha, commands: [{ cmd: 'node --test', exit: suiteExit, suite: true }], exempt: {}, ...extra });
const run = (s, io, over = {}) => gate(s.root, { base: s.base, head: s.head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet, ...over });

test('a real change with a real test passes, and the receipt agrees', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(null));
  io.state.comments[0].body = block(RECEIPT, receiptFor(s.head));
  const r = run(s, io);
  assert.deepEqual(r.findings, []);
  assert.deepEqual([r.run.trigger, r.run.suite, r.run.revert, r.run.receipt], ['code', 'pass', 'pass', 'agrees']);
  assert.equal(git(['diff', '--stat'], { cwd: s.root }), '', 'the revert check restores the tree');
  assert.equal(gateRuns(io.state.comments).length, 1);
});

// AUD-1, JOB-12: an inert test fails the gate; only a reviewed exemption on the pull request,
// never the receipt's own words, exempts a refactor.
const exemptBlock = (sha, reviewer = 'session_reviewer', module = 'alpha') => ({ id: 99, body: block(REVERT_EXEMPT, { kind: 'revert-exempt', module, pr: 5, sha, reviewer, why: 'a refactor; behaviour unchanged' }), user: { login: 'civicsmith' } });
test('a test that passes with the change reverted is inert: a finding (AUD-1)', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest });
  const r = run(s, fakeIO(receiptFor(s.head)));
  assert.deepEqual([r.run.revert, r.run.inert, r.run.ok], ['fail', ['test/alpha/y.test.mjs'], false]);
  assert.deepEqual(r.findings.map((f) => [f.check, f.file]), [['revert', 'test/alpha/y.test.mjs']]);
  // The receipt's own exemption is a request, never the exemption: still a finding, naming the act.
  const asked = run(s, fakeIO(receiptFor(s.head, 0, { exempt: { revert: 'a refactor' } })));
  assert.equal(asked.run.revert, 'fail');
  assert.match(asked.findings[0].message, /stands only as a reviewed one on the pull request: p3 revert exempt/);
});

const COMPLETE = { 'process/metrics/alpha.jsonl': '{"row":"attempt","event":"complete","attempt":1,"session":"session_job"}\n' };
test('a reviewed exemption on the pull request exempts the revert check; the job\'s own, or one for other code, does not', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest, ...COMPLETE });
  const io = fakeIO(receiptFor(s.head));
  io.state.comments.push(exemptBlock(s.head));
  const r = run(s, io);
  assert.deepEqual([r.run.revert, r.run.revert_exempt, r.findings], ['exempt', { by: 'session_reviewer', sha: s.head }, []]);
  // Its reviewer is the job's own session (the newest complete row's): no exemption.
  const own = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest, ...COMPLETE });
  const io2 = fakeIO(receiptFor(own.head));
  io2.state.comments.push(exemptBlock(own.head, 'cse_job'));
  const said = [];
  const r2 = run(own, io2, { log: (m) => said.push(String(m)) });
  assert.equal(r2.run.revert, 'fail');
  assert.ok(said.some((m) => /a job never exempts itself/.test(m)), said.join('\n'));
  // Reviewed on an earlier commit, the code changed since: the check runs.
  const head2 = commit(s.root, { 'src/alpha/index.mjs': 'export const x = 3;\n' });
  const r3 = gate(s.root, { base: s.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: fakeIO(receiptFor(head2)).io, log: quiet });
  assert.equal(r3.run.revert, 'fail');
  const io4 = fakeIO(receiptFor(head2));
  io4.state.comments.push(exemptBlock(s.head));
  assert.equal(gate(s.root, { base: s.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io4.io, log: quiet }).run.revert, 'fail');
  // Records only since the reviewed commit: it stands.
  const head3 = commit(s.root, { 'process/metrics/alpha.jsonl': `${COMPLETE['process/metrics/alpha.jsonl']}{}\n` });
  const io5 = fakeIO(receiptFor(head3));
  io5.state.comments.push(exemptBlock(head2));
  assert.equal(gate(s.root, { base: s.base, head: head3, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io5.io, log: quiet }).run.revert, 'exempt');
});

test('a change with no test is no finding: the row says so', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n' });
  const r = run(s, fakeIO(receiptFor(s.head)));
  assert.deepEqual([r.run.revert, r.findings], ['no test changed', []]);
});

// Cold review of build/audit-restores: the exemption binds the job's own code, so the tranche merged
// in (job sync, merge) keeps it; it fails closed with no job session; an edited block is never read,
// and a junk block does not hide a good one.
test('a reviewed exemption survives the tranche merged in, fails closed without the job\'s session, and skips edited or junk blocks', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest, ...COMPLETE });
  const cfg = loadConfig(s.root);
  const e = JSON.parse(readFileSync(join(s.root, 'process/ledger/alpha.json'), 'utf8'));
  const ctx = (head, jobSession = 'session_job') => ({ root: s.root, cfg, head, entry: e, job: 'alpha', jobSession });
  const merged = commit(s.root, { 'src/beta/b.mjs': 'export const b = 1;\n' }, 'Bring the tranche in');
  assert.equal(revertExemption([exemptBlock(s.head)], ctx(merged)).ok, true, 'another module\'s files do not void it');
  const testEdit = commit(s.root, { 'test/alpha/y.test.mjs': inertTest + '// edited after review\n' });
  assert.match(revertExemption([exemptBlock(s.head)], ctx(testEdit)).why, /in 1 file\(s\): test\/alpha\/y\.test\.mjs/, 'a test edited after review voids it');
  git(['reset', '-q', '--hard', merged], { cwd: s.root });
  const changed = commit(s.root, { 'src/alpha/index.mjs': 'export const x = 4;\n' });
  assert.match(revertExemption([exemptBlock(s.head)], ctx(changed)).why, /the job's code differs from .* in 1 file\(s\): src\/alpha\/index\.mjs/);
  assert.match(revertExemption([exemptBlock(s.head)], ctx(merged, null)).why, /records no session, so its reviewer cannot be told from the job/);
  const edited = { ...exemptBlock(s.head), created_at: '2026-11-06T00:00:00Z', updated_at: '2026-11-06T00:05:00Z' };
  assert.equal(revertExemption([edited], ctx(merged)), null);
  const junk = { id: 100, body: block(REVERT_EXEMPT, { module: 'alpha', sha: s.head, reviewer: '', why: '' }), user: { login: 'x' } };
  assert.equal(revertExemption([exemptBlock(s.head), junk], ctx(merged)).ok, true);
  assert.equal(revertExemption([junk], ctx(merged)).ok, false);
});

test('measuredBy stands on a green run that checked the same receipt attempt, whatever commit the receipt names', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const later = commit(s.root, { 'src/alpha/index.mjs': 'export const x = 2; // fixed\n' });
  const cfg = loadConfig(s.root);
  const green = { sha: later, scope: ['alpha'], suite: 'pass', receipt: 'agrees', receipt_attempt: 1, receipt_tests: [] };
  assert.equal(measuredBy(s.root, cfg, receiptFor(s.head), green).ok, true);
  assert.match(measuredBy(s.root, cfg, { ...receiptFor(s.head), attempt: 2 }, green).why, /whose code is not what the last green code run/);
  assert.match(measuredBy(s.root, cfg, { ...receiptFor(s.head), tests: [{ file: 'test/alpha/x.test.mjs', name: 'x is 2' }] }, green).why, /names 1 test\(s\) the last green code run, on .* did not check/);
});

// AUD-2, JOB-7: the receipt is checked against CI's own run of its tests.
test('a receipt claiming a green suite the gate finds red disagrees: a finding', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const r = run(s, fakeIO(receiptFor(s.head, 0)));
  assert.deepEqual([r.run.suite, r.run.receipt], ['fail', 'disagrees']);
  assert.deepEqual(r.findings.map((f) => f.check).sort(), ['receipt', 'suite']);
  // A receipt with no suite run in the session (AUD-7) claims the suite passes in CI.
  const bare = run(s, fakeIO({ ...receiptFor(s.head), commands: [] }));
  assert.equal(bare.run.receipt, 'disagrees');
  assert.match(bare.findings.find((f) => f.check === 'receipt').message, /passes \(no suite run in the session\)/);
});

test('a test the receipt names for a mark that fails in the gate\'s run disagrees; one the run does not show is not judged', () => {
  const g = passedByFile([{ passing: [{ file: 'test/a.test.mjs', name: 'group > x is 2' }], failing: [{ file: 'test/a.test.mjs', name: 'x is 9' }], whole: [] }, { passing: [], failing: [{ file: 'test/b.test.mjs', name: 'test/b.test.mjs' }], whole: ['test/b.test.mjs'] }]);
  assert.equal(namedVerdict(g, 'test/a.test.mjs::x is 2'), 'pass');
  assert.equal(namedVerdict(g, 'test/a.test.mjs::x is 9'), 'fail');
  assert.equal(namedVerdict(g, 'test/b.test.mjs::anything'), 'fail', 'a file that failed as a whole ran none of its tests');
  assert.equal(namedVerdict(g, 'test/a.test.mjs::no such'), null);
  assert.equal(namedVerdict(g, 'test/a.test.mjs::x is'), null, 'a longer name that holds it is another test');
  assert.equal(namedVerdict(g, 'test/b.test.mjs::anything', ['test/b.test.mjs::test/b.test.mjs']), null, 'a whole file tolerated as base-red says nothing of its tests');
  // Another describe's test of the same name, tolerated as base-red, is not the named test's failure.
  const c = passedByFile([{ passing: [{ file: 't/c.test.mjs', name: 'A > works' }], failing: [{ file: 't/c.test.mjs', name: 'B > works' }], whole: [] }]);
  assert.equal(namedVerdict(c, 't/c.test.mjs::works', ['t/c.test.mjs::B > works']), 'pass');
  assert.equal(namedVerdict(c, 't/c.test.mjs::works'), 'fail');
  assert.equal(namedVerdict(g, 'test/c.test.mjs::x'), null);
  assert.equal(namedVerdict(null, 'test/a.test.mjs::x is 9'), null);
  assert.equal(passedByFile([{ passing: null, failing: null }]), null);
  // A named test that failed disagrees even where the suite's verdict agrees.
  assert.equal(receiptAgrees(undefined, 'base-red', [], []), true);
  // A name no test holds is not judged by the run.
  const p = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const ok = run(p, fakeIO({ ...receiptFor(p.head), commands: [], tests: [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'x is 2' }, { req: 'R2', file: 'test/alpha/x.test.mjs', name: 'from' }] }));
  assert.deepEqual([ok.run.receipt, ok.run.receipt_tests, ok.findings], ['agrees', ['test/alpha/x.test.mjs::x is 2', 'test/alpha/x.test.mjs::from'], []]);
});

test('a ready job with no receipt is a finding; a draft runs only the fast checks', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  assert.ok(run(s, fakeIO()).findings.some((f) => f.check === 'receipt'));
  const d = run(s, fakeIO(), { draft: true });
  assert.deepEqual([d.run.trigger, d.run.suite, d.findings.length], ['draft', 'skipped', 0]);
});

test('files outside the module are not the job\'s to change', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest, 'src/beta/b.mjs': 'x' });
  assert.ok(run(s, fakeIO(receiptFor(s.head))).findings.some((f) => f.check === 'ownership' && f.file === 'src/beta/b.mjs'));
});

test('record-only changes end in seconds: a records PR, and records since the last green run', () => {
  const s = setup({ 'process/metrics/alpha.jsonl': '{}\n' });
  const r = run(s, fakeIO());
  assert.deepEqual([r.run.trigger, r.run.suite, r.findings.length], ['record', 'skipped', 0]);

  const c = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(c.head));
  assert.equal(run(c, io).run.trigger, 'code');
  const head2 = commit(c.root, { 'process/metrics/alpha.jsonl': '{"row":"merge"}\n' });
  const r2 = gate(c.root, { base: c.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet });
  assert.deepEqual([r2.run.trigger, r2.run.after, r2.findings.length], ['record-since-green', c.head, 0]);
  assert.equal(gateRuns(io.state.comments).length, 2);
});

// Copy PR 247, 4 Nov: attempt 3 changed only process/ledger and process/metrics, its test
// already on the tranche from attempt 2. Every run on its head was "record", the receipt never
// checked (AUD-2), and merge refused it. A ready job's receipt with no green code run to stand on gets one.
test('a records-only job pull request with a receipt gets a code run whose receipt check agrees, and merges', () => {
  const s = setup({ 'process/metrics/alpha.jsonl': '{"row":"attempt","event":"complete","attempt":3}\n' });
  const io = fakeIO({ ...receiptFor(s.head), attempt: 3 });
  const said = [];
  const r = run(s, io, { log: (m) => said.push(m) });
  assert.deepEqual([r.run.trigger, r.run.scope, r.run.suite, r.run.revert, r.run.receipt, r.run.receipt_attempt, r.run.ok], ['code', ['alpha'], 'pass', 'no code changed', 'agrees', 3, true]);
  // Each module's own suite seconds (build ci-budget): status reads them against suite_timeout_minutes.
  assert.deepEqual(Object.keys(r.run.suite_by_module), ['alpha']);
  assert.equal(r.run.suite_by_module.alpha, r.run.suite_seconds);
  assert.ok(said.some((m) => /only records changed, but no green code run measured receipt attempt 3/.test(m)), said.join('\n'));
  assert.equal(unread(gateRuns(io.state.comments), s.head, 3), '');
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: s.root });
  git(['remote', 'add', 'origin', bare], { cwd: s.root });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: s.root });
  git(['checkout', '-q', 'main'], { cwd: s.root });
  let merged = null;
  const m = merge(s.root, 247, { slug: 'o/r', reviewed: 'test', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet, io: {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: s.head } }),
    comments: () => io.state.comments,
    checkRun: () => ({ status: 'completed', conclusion: 'success' }),
    verify: io.io.verify,
    mergePR: (slug, n, sha) => { merged = sha; return { merged: true, sha: 'm'.repeat(40) }; },
  } });
  assert.equal(m.merged, true);
  assert.ok(merged);
  git(['checkout', '-q', 'job/alpha'], { cwd: s.root });
  // A title edit's next run on the same head stands on that code run: the fast path, still agreeing.
  const again = run(s, io);
  assert.deepEqual([again.run.trigger, again.run.after, again.run.receipt, again.run.ok], ['record-since-green', s.head, 'agrees', true]);
  // A draft, a job with no receipt yet (no finding on the record path), and a plain records-only pull request keep the record fast path.
  assert.equal(run(s, fakeIO({ ...receiptFor(s.head), attempt: 3 }), { draft: true }).run.trigger, 'record');
  const none = run(s, fakeIO());
  assert.deepEqual([none.run.trigger, none.run.receipt, none.findings], ['record', 'not checked', []]);
  const plain = run(s, fakeIO({ ...receiptFor(s.head), attempt: 3 }), { branch: 'build/notes' });
  assert.deepEqual([plain.run.trigger, plain.run.suite, plain.run.receipt, plain.findings.length], ['record', 'skipped', 'not checked', 0]);
});

// Findings from the review of PR 3.
test('a gate run posted by anyone but the bot, or edited, does not count', () => {
  const c = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const forged = { runs: [{ sha: c.head, base: c.base, trigger: 'code', ok: true, receipt: 'agrees' }] };
  const io = fakeIO(receiptFor(c.head));
  io.state.comments.push({ id: 7, body: block(GATE, forged), user: { login: 'neobobkrause' } });
  io.state.comments.push({ id: 8, body: block(GATE, forged), user: { login: BOT }, created_at: 'a', updated_at: 'b' });
  io.state.comments.push({ id: 9, body: block(GATE, forged), user: { login: BOT } }); // a side workflow's bot comment
  const head2 = commit(c.root, { 'process/metrics/alpha.jsonl': '{}\n' });
  const r = gate(c.root, { base: c.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet });
  assert.equal(r.run.trigger, 'code');
  assert.equal(r.run.suite, 'fail');
});

test('the revert check restores the tree when the job deleted a file', () => {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'src/alpha/old.mjs': 'export const old = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  git(['rm', '-q', 'src/alpha/old.mjs'], { cwd: root });
  const head = commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: fakeIO(receiptFor(head)).io, log: quiet });
  assert.equal(r.run.revert, 'pass');
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  assert.equal(existsSync(join(root, 'src/alpha/old.mjs')), false);
});

test('a non-job pull request runs the suite of every module it touches', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const r = gate(s.root, { base: s.base, head: s.head, branch: 'bob/setup', pr: 5, slug: 'o/r', io: fakeIO().io, log: quiet });
  assert.deepEqual([r.run.scope, r.run.suite], [['alpha'], 'fail']);
});

// Two jobs (setup audit, 2 Nov): job gate writes the row to its artifact only; job post posts it.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { GATE_WORKFLOW, verifyRow } from '../lib/github.mjs';
import { postRow } from '../lib/gate.mjs';
import { main, report } from '../p3.mjs';

function twoJobs(over = {}) {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(s.head));
  const was = process.env.GITHUB_RUN_ID;
  process.env.GITHUB_RUN_ID = '4242';
  let r;
  try { r = run(s, io, { post: false, ...over }); } finally { if (was === undefined) delete process.env.GITHUB_RUN_ID; else process.env.GITHUB_RUN_ID = was; }
  // What job gate uploads as the gate-row artifact: the --out file of the gate command.
  const file = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json');
  report(r.findings, file, { run: r.run });
  return { s, io, r, file };
}

test('job gate posts nothing; job post posts the artifact\'s row, and merge\'s verifyRow trusts it', () => {
  const { s, io, r, file } = twoJobs();
  assert.equal(r.run.ok, true);
  assert.equal(io.state.comments.length, 1, 'only the receipt: job gate posted no comment');
  const posted = postRow(file, { pr: 5, head: s.head, gateResult: 'success', slug: 'o/r', runId: '4242', io: io.io, log: quiet });
  assert.equal(posted.posted, true);
  const c = io.state.comments.at(-1);
  assert.equal(c.user.login, BOT);
  const rows = gateRuns(io.state.comments);
  assert.equal(rows.length, 1);
  assert.match(c.body, new RegExp(`Gate run on \`${s.head.slice(0, 10)}\`: green, code`));
  // The run is the process gate on the head, completed green, and its artifact is the same file.
  const actionsRun = { path: GATE_WORKFLOW, head_sha: s.head, status: 'completed', conclusion: 'success', event: 'pull_request', pull_requests: [{ number: 5, base: { ref: 'tranche' } }] };
  const art = JSON.parse(readFileSync(file, 'utf8')).run;
  assert.equal(rows[0].run_id, 4242);
  assert.equal(verifyRow('o/r', rows[0], { pr: 5, baseRef: 'tranche' }, { getRun: (slug, id) => (id === 4242 ? actionsRun : null), runArtifactRow: () => art }), true);
  // A copy of the row that changes what it tolerated is not this run's (review of PR 134).
  for (const k of ['base_red']) {
    assert.equal(verifyRow('o/r', { ...rows[0], [k]: [{ tests: ['t/a.test.mjs::x'] }] }, { pr: 5, baseRef: 'tranche' }, { getRun: (slug, id) => (id === 4242 ? actionsRun : null), runArtifactRow: () => art }), false, k);
  }
});

test('job post refuses a row that is not this run\'s, not this head\'s, or green when job gate was not', () => {
  const { s, io, file } = twoJobs();
  const q = { pr: 5, slug: 'o/r', io: io.io, log: quiet };
  assert.throws(() => postRow(file, { ...q, head: s.head, runId: '9' }), /names run 4242, not this run 9/);
  assert.throws(() => postRow(file, { ...q, head: 'f'.repeat(40), runId: '4242' }), /not the head ffffffffff/);
  assert.throws(() => postRow(file, { ...q, head: s.head, runId: '4242', gateResult: 'failure' }), /says green, but job gate ended failure/);
  assert.throws(() => postRow(file, { ...q, pr: null, runId: '4242' }), /needs --pr/);
  assert.equal(io.state.comments.length, 1, 'nothing posted');
});

test('job post posts a red row, and posts nothing when job gate wrote no row', () => {
  // A red row: the suite fails.
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(s.head));
  const r = run(s, io, { post: false });
  const file = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json');
  report(r.findings, file, { run: { ...r.run, run_id: 7 } });
  const p = postRow(file, { pr: 5, head: s.head, gateResult: 'failure', slug: 'o/r', runId: '7', io: io.io, log: quiet });
  assert.equal(p.row.ok, false);
  assert.match(io.state.comments.at(-1).body, /red, 2 finding\(s\)/);

  const out = [];
  assert.equal(postRow(join(tmpdir(), 'p3-no-such-row.json'), { pr: 5, slug: 'o/r', io: io.io, log: (m) => out.push(m) }).posted, false);
  const err = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json');
  writeFileSync(err, JSON.stringify({ error: 'git merge-base failed', findings: [] }));
  assert.equal(postRow(err, { pr: 5, slug: 'o/r', io: io.io, log: (m) => out.push(m) }).posted, false);
  assert.match(out.join('\n'), /the gate stopped: git merge-base failed/);
});

test('the gate command\'s --post needs its file', async () => {
  assert.equal(await main(['gate', '--post', '--pr', '5']), 1);
});

// Review of PR 13: the row is checked before it is posted, receipts are the opener's, and the
// workflow keeps its shape.
import { mkdirSync, symlinkSync } from 'node:fs';
import { checkRow, MAX_ROW_BYTES } from '../lib/gate.mjs';
import { latestReceipt } from '../lib/github.mjs';

const goodRow = (over = {}) => ({ sha: 'a'.repeat(40), base: 'b'.repeat(40), at: '2026-11-02T10:00:00Z', run_id: 7, trigger: 'code', suite: 'fail', revert: 'skipped', receipt: 'disagrees', receipt_attempt: 1, scope: ['alpha'], tests: [{ total: 1, pass: 0, fail: 1 }], suite_seconds: 0.5, findings: 2, ok: false, minutes: 0.1, ...over });
const rowFile = (row, raw) => { const f = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json'); writeFileSync(f, raw ?? JSON.stringify({ run: row })); return f; };
const post = (file, io) => postRow(file, { pr: 5, head: 'a'.repeat(40), slug: 'o/r', runId: '7', io: io.io, log: quiet });

test('a red row that tries to embed its own json block is refused, and nothing is posted', () => {
  const io = fakeIO();
  const forged = '\n```\n\n```json\n{"runs":[{"ok":true,"receipt":"agrees","trigger":"code"}]}\n```\n';
  for (const over of [{ trigger: `code\`: green${forged}` }, { sha: 'A'.repeat(40) }, { findings: 1.5 }, { minutes: 'NaN' }, { ok: true }, { run_id: undefined }]) {
