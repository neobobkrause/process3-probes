// ===== file: prompt-caps.test.mjs (continued) =====

import { jobStart, startText } from '../lib/job.mjs';
import { briefText } from '../lib/review.mjs';
import { git } from '../lib/util.mjs';
import { STANDING_HEAD, promptBody } from '../lib/register.mjs';

processRegisterFixture([SEED_ENTRY]);

const quiet = () => {};
const SCREEN = 4096;
const SLUG = 'neobobkrause/civicsmith-copy';
const ID = 'session_01RAN5ek9qx8mduYhfE77Ldc';
const bytes = (t) => Buffer.byteLength(t);

function withOrigin() {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche' } });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return root;
}

test('start root, start bob (fresh and by handover) and start watcher each print one screen at most', () => {
  const root = withOrigin();
  const addr = { root: { session: ID } };
  const prompts = {
    root: startRole(root, 'root', { slug: SLUG, address: {}, log: quiet }).prompt,
    bob: startRole(root, 'bob', { slug: SLUG, address: addr, log: quiet }).prompt,
    watcher: startRole(root, 'watcher', { slug: SLUG, address: {}, log: quiet }).prompt,
  };
  recordStart(root, 'root', ID, { log: quiet });
  recordStart(root, 'bob', 'session_oldbob1', { log: quiet });
  prompts['bob by handover'] = handoverBegin(root, { slug: SLUG, log: quiet }).prompt;
  assert.ok(prompts['bob by handover'].includes('You replace BOB `session_oldbob1`'));
  for (const [role, p] of Object.entries(prompts)) {
    assert.match(p, /--approvals [0-9a-f]{64}/, `${role}: measured with a real approvals hash`);
    // The prompt is one screen; the standing block after it (register.mjs) has its own cap.
    assert.ok(bytes(promptBody(p)) <= SCREEN, `${role}: ${bytes(promptBody(p))} bytes, over ${SCREEN}`);
  }
  // The fixture's entry names BOB, not ROOT.
  for (const role of ['bob', 'bob by handover']) assert.ok(prompts[role].includes(STANDING_HEAD), role);
  assert.ok(!prompts.root.includes(STANDING_HEAD));
});

test('a job START with a typical entry is one screen at most', () => {
  const e = entry('alpha', {
    title: 'Member sign-in and session handling',
    paths: ['src/alpha/', 'src/shared/alpha-client.mjs', 'worker/alpha/'],
    tests: ['test/alpha/', 'test/e2e/alpha.spec.mjs'],
    reading: ['req/alpha.md', 'docs/alpha.md'],
    prior_work: 'an earlier attempt left a half-written handler in src/alpha/index.mjs; keep what passes its tests.',
  });
  const root = makeRepo({
    'process/ledger/alpha.json': e,
    'req/alpha.md': '# alpha\n\n- [ ] R1 signs a member in.\n- [ ] R2 ends a session.\n',
    'docs/alpha.md': '# alpha\n\nNotes.\n',
    'test/alpha/a.test.mjs': "import test from 'node:test'; test('ok', () => {});\n",
  });
  git(['branch', 'tranche'], { cwd: root });
  const { start } = jobStart(root, 'alpha', { coordinator: ID, push: false, log: quiet });
  assert.ok(bytes(start) <= SCREEN, `START: ${bytes(start)} bytes, over ${SCREEN}`);
});

test('the review brief carries its parts: objective, reading set, boundaries, output with every gap in one pass', () => {
  const t = briefText({ pr: { number: 60, title: 'Prompt caps', base: { ref: 'tranche' }, head: { ref: 'build/prompt-caps', sha: 'f'.repeat(40) } }, files: ['tool/lib/roles.mjs'], job: null, owner: 'neobobkrause', approvalsFile: 'CLAUDE.md' });
  for (const part of ['# Review brief: pull request 60', 'Read your rulebook', 'Changed files (1):', '## You are read-only', '## Output', 'Every gap in one pass']) assert.ok(t.includes(part), part);
});


// A requirement on what a job hands in: the job's handover note is saved under the file name
// `bramblewick-relay.md`, and under no other name.

// Second review of PR 72: the escalation and the wake pushed a replacement session's START, the one
// the urgency work starts more often, over the screen. Restart with a provider notice, real ids.
test('a replacement or taken-in job START with two provider notices and the escalation to ROOT and the watcher is one screen at most', () => {
  const e = entry('alpha', { title: 'Member sign-in and session handling', paths: ['src/alpha/', 'src/shared/alpha-client.mjs', 'worker/alpha/'], tests: ['test/alpha/', 'test/e2e/alpha.spec.mjs'], reading: ['req/alpha.md', 'docs/alpha.md'], requirements: 'req/alpha.md' });
  const notices = [{ key: 'beta:41', provider: 'beta', ids: ['R2', 'R5'], pr: 41 }, { key: 'gamma:52', provider: 'gamma', ids: ['R1'], pr: 52 }];
  const base = { entry: e, slug: SLUG, branch: 'job/alpha', tranche: 'tranche', coordinator: ID, bob: true, attempt: 1, reading: { files: [{ file: 'req/alpha.md', bytes: 61 }, { file: 'docs/alpha.md', bytes: 16 }], bytes: 77 }, notices, rootId: ID, decisionMinutes: 30 };
  const cases = {
    restart: { restart: { why: 'its session was archived', pr: `https://github.com/${SLUG}/pull/123`, last: 'abc1234 work in progress', receipt: 'none posted (WORKING)' } },
    'take-in': { takeIn: { pr: 88, branch: 'feature/alpha', commits: ['a'.repeat(40), 'b'.repeat(40)] } },
  };
  for (const [name, c] of Object.entries(cases)) {
    const t = startText({ ...base, ...c });
    assert.ok(t.includes('then the watcher'));
    assert.ok(t.includes('`gamma:52`') && !t.includes('--test notice:'));
    assert.ok(bytes(t) <= SCREEN, `${name} START: ${bytes(t)} bytes, over ${SCREEN}`);
  }
});

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

// ===== file: admit.test.mjs =====

// Every command a START, an act line or a rulebook tells a session to run is admitted by the
// product's .claude/settings.json (C3, the coordinator, 7 Nov): the push check told a session to run
// `git commit --amend --no-edit`, which the copy's settings deny.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import './helpers.mjs';
import { PROMPTS_IN_AUTO, admitCheck, admitTools, deniedBy, ruleMatches, toldCommands, toldIn, toldTools, toolRuleMatches, toolsIn, toolStops } from '../lib/admit.mjs';
import { admitLines } from '../lib/setup.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// The copy's deny list (the first product's .claude/settings.json at 5f03000d, 7 Nov).
const COPY = { permissions: { deny: ['mcp__github__merge_pull_request', 'Bash(gh pr merge *)', 'Bash(gh api *pulls/*/merge*)', 'Bash(git push --force *)', 'Bash(git push -f *)', 'Bash(git push --force-with-lease *)', 'Bash(git push --mirror *)', 'Bash(git push origin --delete *)', 'Bash(git push origin HEAD:main)', 'Bash(git push origin main)', 'Bash(git push -u origin main)', 'Bash(git reset --hard *)', 'Bash(git clean -fd *)', 'Bash(git clean -fdx *)', 'Bash(git stash drop *)', 'Bash(git rebase *)', 'Bash(git commit --amend *)', 'Bash(git tag *)', 'Bash(git branch -D *)', 'Bash(gh api *contents/*)', 'Bash(gh api *git/blobs*)', 'Bash(gh api *git/trees*)', 'Bash(gh api *git/commits*)', 'Bash(gh api *git/refs*)', 'Bash(curl *api.github.com*)', 'mcp__github__create_or_update_file', 'mcp__github__push_files', 'mcp__github__delete_file'] } };

test('permission rules: * any text, a trailing " *" also the bare command, :* a prefix; a told line is judged part by part', () => {
  assert.equal(ruleMatches('Bash(git commit --amend *)', 'git commit --amend --no-edit'), true);
  assert.equal(ruleMatches('Bash(git commit --amend *)', 'git commit --amend'), true);
  assert.equal(ruleMatches('Bash(git commit --amend *)', 'git commit -m x'), false);
  assert.equal(ruleMatches('Bash(gh api *contents/*)', 'gh api repos/o/r/contents/x'), true);
  assert.equal(ruleMatches('Bash(npm run:*)', 'npm run build'), true);
  assert.equal(ruleMatches('mcp__github__push_files', 'git push'), false);
  assert.deepEqual(deniedBy('git fetch origin x && git reset --hard FETCH_HEAD', COPY), { part: 'git reset --hard FETCH_HEAD', rule: 'Bash(git reset --hard *)' });
});

test('told commands are the spans a session reads: a printed string\'s, a rulebook\'s; never a comment\'s nor an error text', () => {
  const src = "// Bob denies `gh pr merge` to sessions.\nfail(`run \\`git commit --amend --no-edit\\`, then \\`git push origin ${b}\\``);\nfail(`git ${a} failed: x`);\n";
  assert.deepEqual(toldIn(src, 'x.mjs').map((t) => t.cmd), ['git commit --amend --no-edit', 'git push origin X']);
  assert.deepEqual(toldIn('Run `git fetch origin` then `p3 status`.\n', 'r.md').map((t) => t.cmd), ['git fetch origin']);
});

test('no command the process tells a session to run is denied by the copy\'s settings or by process3\'s own', () => {
  const told = toldCommands(ROOT);
  assert.ok(told.length > 30, `${told.length} told`);
  assert.deepEqual(admitCheck(COPY, told), []);
  assert.deepEqual(admitCheck(JSON.parse(readFileSync(join(ROOT, '.claude/settings.json'), 'utf8')), told), []);
});

test('setup check names a told command the product\'s settings deny, with where it is told and the rule', () => {
  const lines = [];
  const bad = admitLines({ file: (f) => (f === '.claude/settings.json' ? JSON.stringify(COPY) : null) }, { log: (l) => lines.push(l), told: [{ file: 'tool/lib/pushcheck.mjs', line: 47, cmd: 'git commit --amend --no-edit' }], tools: [] });
  assert.equal(bad.length, 1);
  assert.match(lines[0], /^warning: tool\/lib\/pushcheck\.mjs:47 tells a session to run `git commit --amend --no-edit`, which \.claude\/settings\.json denies \(Bash\(git commit --amend \*\)\)/);
  assert.deepEqual(admitLines({ file: () => null }, { log: () => {}, tools: [] }), [], 'no settings file: nothing read');
});

test('a told command behind cd, an assignment, a subshell or sh -c, and a span in a plain-quoted string, are all read and judged (cold review)', () => {
  assert.deepEqual(deniedBy('(cd x && git push origin main)', COPY)?.rule, 'Bash(git push origin main)');
  assert.deepEqual(deniedBy('GIT_DIR=x git rebase main', COPY)?.rule, 'Bash(git rebase *)');
  assert.deepEqual(deniedBy("sh -c 'git tag v1'", COPY)?.rule, 'Bash(git tag *)');
  assert.deepEqual(toldIn("x('run `git submodule update .process` first');\n", 'a.mjs').map((t) => t.cmd), ['git submodule update .process']);
  assert.deepEqual(toldIn('fail(`do \\`cd x && git rebase main\\``);\n', 'a.mjs').map((t) => t.cmd), ['cd x && git rebase main']);
});

// The deny lists Bob applies with R17c (notes/r17c-settings.md, 7 Nov): every raw `git push` and every
// `gh` is refused; the tool's own push is allowed. The coordinator, 7 Nov: no told command may need
// either. The docs (README.md, setup/*.md) are read too: a span there addressed to a session is a
// told command; those that only name a command (said to a person, or what a workflow or the tool
// runs itself) are listed below with why, so a new one is judged here.
// The R17c files as the note gives them (one source: settings-policy.test reads the same, C17).
const R17C_FILES = Object.fromEntries([...readFileSync(join(ROOT, 'notes/r17c-settings.md'), 'utf8').matchAll(/## (\S+)\n\n```json\n([\s\S]*?)```/g)].map((m) => [m[1], JSON.parse(m[2])]));
const R17C = { copy: R17C_FILES[Object.keys(R17C_FILES).find((k) => !/\/process3(-probes)?$/.test(k))], process3: R17C_FILES['neobobkrause/process3'], probes: R17C_FILES['neobobkrause/process3-probes'] };
const NAMED = {
  'README.md gh pr ready': 'what job complete runs itself, outside a session',
  'README.md git push --force-with-lease=<ref>:<sha> origin :<ref>': 'what the branch cleanup workflow runs',
  'README.md git push': 'what the R17c settings deny',
  'setup/DEVELOPER.md git push': 'said to the developer: a push does not count',
};
const docs = () => ['README.md', ...readdirSync(join(ROOT, 'setup')).filter((f) => f.endsWith('.md')).map((f) => `setup/${f}`)]
  .flatMap((f) => toldIn(readFileSync(join(ROOT, f), 'utf8'), f));

test('the R17c deny lists (no raw git push, no gh) refuse no command the process tells a session to run', () => {
  const told = toldCommands(ROOT);
  for (const [repo, s] of Object.entries(R17C)) {
    assert.deepEqual(admitCheck(s, told), [], repo);
    assert.equal(deniedBy('node tool/p3.mjs github push origin b', s), null, `${repo}: the tool's push is no git push`);
    const named = admitCheck(s, docs()).map((x) => `${x.file} ${x.cmd}`);
    assert.deepEqual(named.filter((k) => !NAMED[k]), [], `${repo}: a doc tells a session a command these settings refuse`);
  }
});

// C15 (the coordinator, 7 Nov): an investigation lane waited from ~00:31Z on "permission: Artifact",
// which asks a person even in auto mode; lanes are told their design documents are claude.ai
// artifacts. Every tool the process tells a session to use is read, and judged against each
// product's settings: denied, or asking a person in auto mode with no allow rule, fails.
test('told tools: what the process\'s text says maps to the tool; a comment tells none', () => {
  assert.deepEqual(toolsIn("log(`keep them as claude.ai artifacts, then send_message BOB`);\n// a comment naming create_session\n", 'x.mjs').map((t) => t.tool), ['Artifact', 'mcp__claude-code-remote__send_message']);
  assert.deepEqual(toolsIn("Dispatch through the GitHub connector's `actions_run_trigger`.\n", 'r.md').map((t) => t.tool), ['mcp__github__actions_run_trigger']);
  const told = toldTools(ROOT);
  assert.ok(told.some((t) => t.tool === 'Artifact' && t.file === 'tool/lib/lane.mjs'), 'the lane\'s documents');
  assert.ok(!told.some((t) => t.file === 'tool/lib/admit.mjs'), 'the reader names tools, it tells none');
});

test('a told tool stops when denied, or when it asks in auto mode and no allow rule admits it', () => {
  assert.equal(toolRuleMatches('mcp__github', 'mcp__github__actions_run_trigger'), true);
  assert.equal(toolRuleMatches('mcp__github__*', 'mcp__github__actions_run_trigger'), true);
  assert.equal(toolRuleMatches('mcp__git', 'mcp__github__x'), false);
  assert.equal(toolRuleMatches('Bash(git push *)', 'Artifact'), false);
  assert.deepEqual(toolStops('mcp__github__merge_pull_request', COPY), { why: 'denied', rule: 'mcp__github__merge_pull_request' });
  assert.deepEqual(toolStops('Artifact', COPY), { why: 'prompts', evidence: PROMPTS_IN_AUTO.Artifact });
  assert.equal(toolStops('Artifact', { permissions: { allow: ['Artifact'] } }), null);
  assert.equal(toolStops('Artifact', { permissions: { allow: ['Artifact'], deny: ['Artifact'] } }).why, 'denied', 'deny wins');
  assert.equal(toolStops('mcp__claude-code-remote__send_message', COPY), null, 'runs unasked in auto mode');
});

test('every tool the process tells a session to use runs unattended under the R17c settings; today\'s copy settings leave only the lanes\' Artifact to a prompt', () => {
  const told = toldTools(ROOT);
  for (const repo of ['copy', 'probes']) assert.deepEqual(admitTools(R17C[repo], told), [], repo);
  // Until Bob applies them (register C15, fix 1): exactly the lanes' Artifact, nothing else. Brittle on
  // purpose: once the copy allows Artifact, COPY above is updated and this assertion dropped.
  const now = admitTools(COPY, told);
  assert.deepEqual([...new Set(now.map((x) => `${x.tool}: ${x.why}`))], ['Artifact: prompts']);
  assert.ok(now.every((x) => x.file === 'tool/lib/lane.mjs'), JSON.stringify(now));
  // setup check says so, naming the line and the allow rule to add.
  const lines = [];
  const bad = admitLines({ file: (f) => (f === '.claude/settings.json' ? JSON.stringify(COPY) : null) }, { log: (l) => lines.push(l), told: [], tools: told });
  assert.equal(bad.length, now.length);
  assert.ok(lines.some((l) => /^warning: tool\/lib\/lane\.mjs:\d+ tells a session to use the Artifact tool, which asks a person even in auto mode .* Bob adds "Artifact" to its permissions\.allow$/.test(l)), lines.join('\n'));
});

// ===== file: ready.test.mjs =====

import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo, entry, openPassed } from './helpers.mjs';
import { archivable, readyCount, startable, startReady } from '../lib/ready.mjs';
import { writeFileSync } from 'node:fs';
import { nextWork } from '../lib/status.mjs';
import { fail, git } from '../lib/util.mjs';
import { status } from '../lib/status.mjs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const quiet = () => {};
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n';

test('startable: an OPEN entry never started, a COMPLETE one with a notice or found marks; named otherwise', () => {
  const next = [
    { file: 'r/a.md', count: 2, module: 'a', entry_state: 'OPEN' },
    { file: 'r/b.md', count: 1, module: 'b', entry_state: 'OPEN' },
    { file: 'r/c.md', count: 1 },
    { file: 'r/d.md', count: 1, module: 'd', entry_state: 'OPEN', over: 'split or consolidate before its job: r/d.md' },
    { file: 'r/e.md', count: 0, module: 'e', entry_state: 'COMPLETE', notices: ['p:9'] },
    { file: 'r/f.md', count: 1, module: 'f', entry_state: 'COMPLETE', found: ['F1', 'F2'] },
    { file: 'r/g.md', count: 1, module: 'g', entry_state: 'COMPLETE' },
    { triage: 'p:9' },
  ];
  const { go, skip } = startable(next, { onOrigin: (id) => ['b', 'e', 'f', 'g'].includes(id) });
  assert.deepEqual(go, [{ id: 'a', file: 'r/a.md' }, { id: 'e', file: 'r/e.md' }, { id: 'f', file: 'r/f.md', reopen: 'meet the found marks F1, F2' }]);
  assert.deepEqual(skip.map((s) => s.id || s.file), ['b', 'r/c.md', 'g']);
  assert.match(skip[1].why, /no ledger entry/);
});

test('job start --ready: starts every ready job up to live_cap less the live sessions; a refused start does not stop the rest', () => {
  const root = makeRepo({ 'process/config.json': JSON.stringify({ live_cap: 5 }) });
  const next = ['a', 'b', 'c', 'd'].map((id) => ({ file: `r/${id}.md`, count: 1, module: id, entry_state: 'OPEN' }));
  const calls = [];
  const out = [];
  const r = startReady(root, {
    live: 2, remote: new Set(), log: (m) => out.push(m),
    read: (_, o) => { assert.equal(o.role, 'bob'); assert.equal(o.live, 2); return { next }; },
    start: (_, id, o) => { calls.push([id, o.coordinator]); if (id === 'b') fail('the setup is not complete'); return { launch: { title: `job ${id}` } }; },
    coordinator: 'session_x',
  });
  assert.deepEqual(calls, [['a', 'session_x'], ['b', 'session_x'], ['c', 'session_x']], 'cap 5 less 2 live: three starts');
  assert.deepEqual(r.started.map((x) => x.id), ['a', 'c']);
  assert.deepEqual(r.failed, [{ id: 'b', why: 'the setup is not complete' }]);
  assert.deepEqual(r.waiting, ['d']);
  assert.equal(r.ok, false);
  assert.match(out[0], /^ready: 4 startable \(live 2, cap 5\); starting 3, 1 wait for the cap: d$/);
  assert.match(out.at(-1), /^next acts: create_session with each launch printed above \(a, c\)/);
  assert.throws(() => startReady(root, { read: () => ({ next }) }), /--live <n>/);
  assert.throws(() => startReady(root, { live: 'x', read: () => ({ next }) }), /--live <n>/);
});

test('job start --ready: a job whose branch is already on origin is never launched twice', () => {
  const root = makeRepo({ 'process/config.json': JSON.stringify({ live_cap: 5 }) });
  const next = [{ file: 'r/a.md', count: 1, module: 'a', entry_state: 'OPEN' }];
  const calls = [];
  const out = [];
  const r = startReady(root, { live: 0, remote: new Set(['a']), log: (m) => out.push(m), read: () => ({ next }), start: (_, id) => calls.push(id) });
  assert.deepEqual(calls, []);
  assert.equal(r.ok, true);
  assert.match(out.join('\n'), /not started: a: job\/a is on origin/);
  assert.match(out.at(-1), /^nothing started/);
});

test('next work: an OPEN entry status found never started is listed with its module; one with a job is not', () => {
  const root = makeRepo({
    'build/requirements/a.md': unmet(2),
    'build/requirements/b.md': unmet(1),
    'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }),
    'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }),
  });
  openPassed(root);
  const rows = [{ id: 'a', tranche: 'OPEN', req: 'build/requirements/a.md', unstarted: true }, { id: 'b', tranche: 'OPEN', req: 'build/requirements/b.md', branch: 'WORKING' }];
  const out = [];
  const next = nextWork(root, { requirements_dir: 'build/requirements', layers_file: 'none.md', live_cap: 24, requirements_cap: 1e6 }, rows, null, { log: (m) => out.push(m), state: null });
  assert.deepEqual(next.map((x) => [x.file, x.module, x.entry_state]), [['build/requirements/a.md', 'a', 'OPEN']]);
  assert.match(out.join('\n'), /build\/requirements\/a\.md: 2; entry OPEN, never started: node \.process\/tool\/p3\.mjs job start --ready/);
});

test('status --role bob, origin read: an OPEN entry with no job branch on origin and no pull request is marked never started', () => {
  const root = makeRepo({
    'build/requirements/a.md': unmet(2),
    'build/requirements/b.md': unmet(1),
    'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }),
    'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }),
  });
  git(['branch', 'tranche'], { cwd: root });
  git(['branch', 'job/b'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', 'https://github.com/o/r'], { cwd: root });
  git(['config', `url.${bare}.insteadOf`, 'https://github.com/o/r'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'job/b'], { cwd: root });
  openPassed(root);
  const see = (prs) => status(root, { role: 'bob', log: quiet, io: { openPRs: () => prs, prFiles: () => [], checkRun: () => null, compare: () => null } });
  const r = see([]);
  assert.deepEqual(r.rows.filter((x) => x.unstarted).map((x) => x.id), ['a']);
  assert.deepEqual(r.next.map((x) => [x.module, x.entry_state]), [['a', 'OPEN']]);
  // GitHub unread: nothing is marked, so nothing is started on a guess.
  assert.deepEqual(see(null).rows.filter((x) => x.unstarted), []);
});

test('job start --ready, review of PR 100: an open attempt is not restarted, a module listed twice starts once, a failed start shows no launch, a resumed start with its PR open is not counted', () => {
  const root = makeRepo({ 'process/config.json': JSON.stringify({ live_cap: 9 }) });
  const next = [
    { file: 'r/x.md', count: 0, module: 'x', entry_state: 'COMPLETE', notices: ['p:2'], attempt_open: true },
    { file: 'r/a.md', count: 1, module: 'a', entry_state: 'OPEN' },
    { file: 'r/a2.md', count: 1, module: 'a', entry_state: 'OPEN' },
    { file: 'r/b.md', count: 1, module: 'b', entry_state: 'OPEN' },
    { file: 'r/c.md', count: 1, module: 'c', entry_state: 'OPEN' },
  ];
  const calls = [];
  const out = [];
  const r = startReady(root, {
    live: 0, remote: new Set(), log: (m) => out.push(m), read: () => ({ next }),
    start: (_, id, o) => {
      calls.push(id);
      o.log('start the job session with create_session:\n{}');
      if (id === 'b') throw new SyntaxError('Unexpected token');
      if (id === 'c') return { resumed: true, pr: { number: 4 }, created: false };
      return { launch: {} };
    },
  });
  assert.deepEqual(calls, ['a', 'b', 'c']);
  assert.deepEqual(r.started.map((x) => x.id), ['a']);
  assert.deepEqual(r.failed.map((x) => x.id), ['b', 'c']);
  assert.equal(out.filter((l) => l.startsWith('start the job session')).length, 1, 'only the started job\'s launch is shown');
  assert.match(out.join('\n'), /not started: x: its attempt is open/);
  assert.match(out.join('\n'), /not started: b: Unexpected token \(an unexpected error; the other starts went on\)/);
  assert.match(out.join('\n'), /not started: c: its pull request was already open/);
});

test('job start --ready: when the cap holds a ready job back, it names the idle sessions of COMPLETE or merged jobs BOB can archive', () => {
  const root = makeRepo({ 'process/config.json': JSON.stringify({ live_cap: 2 }) });
  const next = ['a', 'b'].map((id) => ({ file: `r/${id}.md`, count: 1, module: id, entry_state: 'OPEN' }));
  const rows = [
    { id: 'm', tranche: 'COMPLETE', pr: 'merged' },
    { id: 'k', tranche: 'WORKING', branch: 'COMPLETE', pr: '#7 ready' },
    { id: 'w', tranche: 'WORKING', branch: 'WORKING', pr: '#8 draft' },
    { id: 'gone', tranche: 'COMPLETE', pr: 'merged' },
    // Reopened: COMPLETE on the tranche, WORKING on its branch, its draft open; never named.
    { id: 'r', tranche: 'COMPLETE', branch: 'WORKING', pr: '#9 draft' },
  ];
  const listed = [
    { id: 'session_m', title: 'job m', status: 'idle' },
    { id: 'session_k', title: 'job k', status_bucket: 'completed' },
    { id: 'session_w', title: 'job w', status: 'idle' },
    { id: 'session_g', title: 'job gone', status: 'archived' },
    { id: 'session_r', title: 'job r', status: 'idle' },
  ];
  assert.deepEqual(archivable(rows, listed).sessions, [
    { session: 'session_m', job: 'm', why: 'merged' },
    { session: 'session_k', job: 'k', why: 'COMPLETE, PR #7 ready' },
  ]);
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  writeFileSync(file, JSON.stringify({ sessions: listed }));
  const out = [];
  const r = startReady(root, { live: 1, sessions: file, remote: new Set(), log: (m) => out.push(m), read: () => ({ next, rows }), start: (_, id) => ({ launch: { title: `job ${id}` } }) });
  assert.deepEqual(r.waiting, ['b']);
  assert.match(out.join('\n'), /the cap holds 1 back; archive these idle sessions of COMPLETE or merged jobs to free slots, then run this again: session_m \(job m, merged\); session_k \(job k, COMPLETE, PR #7 ready\)/);
  // Without --sessions: the jobs whose sessions to look for.
  const out2 = [];
  startReady(root, { live: 1, remote: new Set(), log: (m) => out2.push(m), read: () => ({ next, rows }), start: (_, id) => ({ launch: { title: `job ${id}` } }) });
  assert.match(out2.join('\n'), /the cap holds 1 back; these jobs are COMPLETE or merged, so their sessions, when idle, can be archived to free slots: job k \(COMPLETE, PR #7 ready\); job m \(merged\); job gone \(merged\)\. Save list_sessions as JSON and pass --sessions <file>/);
  // No cap hit: no archive line.
  const out3 = [];
  startReady(root, { live: 0, remote: new Set(), log: (m) => out3.push(m), read: () => ({ next, rows }), start: (_, id) => ({ launch: { title: `job ${id}` } }) });
  assert.doesNotMatch(out3.join('\n'), /the cap holds/);
  // readyCount: the startable jobs status lists, for the wake's lead.
  assert.equal(readyCount(root, { read: (_, o) => { assert.equal(o.offline, true); return { next }; } }), 2);
});

// The copy, 4 Nov: publication and case-authoring, entries merged 11:44:06, layer 8 with the open
// layer 4 and providers with unmet marks, were neither layer work, ready by uses nor notice work:
// listed nowhere, so job start --ready at the merges of 11:52 to 12:05 never started them.
test('status --role bob: an OPEN entry BOB wrote outside the open layer, its uses not done, is startable; the offline count sees it', () => {
  const root = makeRepo({
    'build/layers.md': '| Layer | Modules |\n|---|---|\n| 1 | `base` |\n| 2 | `prov` |\n| 3 | `pub`, `later` |\n',
    'process/modules.json': JSON.stringify({ modules: [{ id: 'base', paths: ['src/base/'], uses: [] }, { id: 'prov', paths: ['src/prov/'], uses: [] }, { id: 'pub', paths: ['src/pub/'], uses: ['prov'] }, { id: 'later', paths: ['src/later/'], uses: ['prov'] }] }),
    'process/config.json': JSON.stringify({ modules_file: 'process/modules.json', live_cap: 24 }),
    'build/requirements/base.md': unmet(1),
    'build/requirements/prov.md': unmet(2),
    'build/requirements/pub.md': unmet(3),
    'build/requirements/later.md': unmet(1),
    'process/ledger/pub.json': entry('pub', { requirements: 'build/requirements/pub.md' }),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', 'https://github.com/o/r'], { cwd: root });
  git(['config', `url.${bare}.insteadOf`, 'https://github.com/o/r'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', log: (m) => out.push(m), io: { openPRs: () => [], prFiles: () => [], checkRun: () => null, compare: () => null } });
  // pub is listed (its entry is BOB's choice); later, with no entry, is not.
  assert.deepEqual(r.next.filter((x) => x.module).map((x) => [x.module, x.entry_state]), [['pub', 'OPEN']]);
  assert.match(out.join('\n'), /entered, never started \(BOB wrote the entry; ready whatever its layer or uses\): all 1 listed\n- build\/requirements\/pub\.md: 3 \(layer 3\); entry OPEN, never started/);
  assert.deepEqual(startable(r.next).go, [{ id: 'pub', file: 'build/requirements/pub.md' }]);
  // The wake's offline count: the one ls-remote marks it unstarted (it counted 0 before).
  assert.equal(readyCount(root), 1);
  // An entered module with no unmet mark has nothing for a job: not listed.
  writeFileSync(join(root, 'build/requirements/pub.md'), '# pub\n');
  git(['commit', '-qam', 'pub met'], { cwd: root });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  assert.equal(readyCount(root), 0);
  writeFileSync(join(root, 'build/requirements/pub.md'), unmet(3));
  git(['commit', '-qam', 'pub reopened'], { cwd: root });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  assert.equal(readyCount(root), 1);
  // Its job branch on origin: neither started again nor counted.
  git(['branch', 'job/pub'], { cwd: root });
  git(['push', '-q', 'origin', 'job/pub'], { cwd: root });
  assert.equal(readyCount(root), 0);
});

// ===== file: start-fixes.test.mjs =====

// Measured defects from the copy, 5 Nov: starts lost to a moving tranche, `found --write` on a
// module whose test pins its ids, and the flow section's count of jobs started then blocked within
// 15 minutes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, entry, makeRepo, setJobCap, write } from './helpers.mjs';
import { jobStart } from '../lib/job.mjs';
import { found } from '../lib/found.mjs';
import { startCheck } from '../lib/start.mjs';
import { flowFigures, quickBlocks } from '../lib/metrics.mjs';
import { nextWork } from '../lib/status.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { Fail, fail, git, loadConfig } from '../lib/util.mjs';

const quiet = () => {};
const APPROVALS = '# P\n\n## Standing approvals from Bob\n\nSessions may push.\n';

// BOB's checkout at the tranche tip, an origin, and a second clone that moves the tranche.
function product(ids, { shallow = false } = {}) {
  const root = makeRepo({ 'CLAUDE.md': APPROVALS, ...Object.fromEntries(ids.flatMap((id) => [[`process/ledger/${id}.json`, entry(id, { requirements: `r/${id}.md` })], [`r/${id}.md`, '- **R1** *(not yet met: x)* a\n']])) });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', '--detach', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const other = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', '-b', 'tranche', bare, other], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'o@example.com'], ['user.name', 'O'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: other });
  const move = (files) => { commit(other, files, 'a merge into the tranche'); git(['push', '-q', 'origin', 'tranche'], { cwd: other }); };
  if (!shallow) return { root, move, other };
  // A session's clone is shallow (create_session's clone_depth): fetches there are --depth 1.
  const thin = join(mkdtempSync(join(tmpdir(), 'p3-thin-')), 'c');
  git(['clone', '-q', '--depth', '1', '-b', 'tranche', `file://${bare}`, thin], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'b@example.com'], ['user.name', 'B'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: thin });
  git(['checkout', '-q', '--detach'], { cwd: thin });
  return { root: thin, move, other };
}

// A start as jobStart begins one: the setup it is given, anchored, refused as setupOrStop refuses.
const starter = (root, calls, between) => (r, id, o) => {
  const s = o.setup(r, { anchor: true });
  if (!s.ok) fail(`the setup is not complete (${s.missing.join(', ')})`);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), git(['rev-parse', 'refs/remotes/origin/tranche'], { cwd: root }), `${id} starts at the tip`);
  calls.push(id);
  between(id);
  return { launch: { title: `job ${id}` } };
};
// The full setup check's session-branch condition is start check's own, anchored when asked.
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
