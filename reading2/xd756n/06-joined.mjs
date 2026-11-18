// ===== file: merge.test.mjs (continued) =====

  assert.equal(git(['merge-base', 'origin/tranche', 'origin/job/x'], { cwd: thin, allowFail: true }).code, 1);
  deepenToBase(thin, 'o/r', 'tranche', 'job/x', compare);
  assert.equal(git(['merge-base', 'origin/tranche', 'origin/job/x'], { cwd: thin }), git(['rev-parse', 'main'], { cwd: src }));
  assert.ok(past() >= 30);
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: thin }), 'true', 'main\'s older history never fetched');
});

// ===== file: job-sync.test.mjs =====

// Defect sweep, 4 Nov (notes/defect-sweep-4nov.md), items 2, 3, 4, 5, 7 and 10: a job's branch
// behind the tranche or BOB's push, its .process pin, and the generated files its suite builds.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobBlock, jobComplete, jobStart, jobSync, jobTest, pinAt } from '../lib/job.mjs';
import { readEntry } from '../lib/ledger.mjs';
import { readRows } from '../lib/metrics.mjs';
import { send } from '../lib/state.mjs';
import { git, run } from '../lib/util.mjs';
import { commit, entry, makeRepo, write, refusePushes } from './helpers.mjs';

// The tool's own `git submodule update` reads a file:// process clone in these tests.
process.env.GIT_CONFIG_COUNT = '1';
process.env.GIT_CONFIG_KEY_0 = 'protocol.file.allow';
process.env.GIT_CONFIG_VALUE_0 = 'always';

const quiet = () => {};
const ready = () => ({ ok: true, missing: [] });
const passing = "import test from 'node:test'; test('ok', () => {});\n";
const clean = (root) => git(['status', '--porcelain', '--untracked-files=no'], { cwd: root });
const head = (root, ref = 'HEAD') => git(['rev-parse', ref], { cwd: root });
const bareOrigin = (root, ...refs) => {
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'origin.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', ...refs], { cwd: root });
  return bare;
};

function fakeGitHub() {
  const state = { comments: [], ready: 0, isDraft: true };
  return {
    state,
    open: (slug, p) => ({ number: 9, html_url: 'pr', draft: true, ...p }),
    find: () => null,
    gh: {
      findPR: () => ({ number: 9, draft: state.isDraft, user: { login: 'acmewidget' } }),
      toDraft: () => { state.isDraft = true; return { draft: true }; },
      comments: () => state.comments,
      addComment: (s, n, body) => { state.comments.push({ body, html_url: `c${state.comments.length}`, user: { login: 'acmewidget' } }); return { html_url: 'c' }; },
      markReady: () => { state.ready++; state.isDraft = false; },
    },
  };
}

// A product whose tranche pins a process clone at P1, with job alpha started from it (local, no
// origin) and .process filled at the branch's pin. movePin: the tranche moves the pin to P2.
function pinned() {
  const tool = makeRepo({ 'tool/x.mjs': 'export const v = 1;\n' });
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'req/alpha.md': '# alpha\n\nR1 does a thing.\n',
    'test/alpha/a.test.mjs': passing,
  });
  git(['submodule', 'add', '-q', tool, '.process'], { cwd: root });
  git(['commit', '-q', '-m', 'pin P1'], { cwd: root });
  git(['branch', 'tranche'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['submodule', 'update', '-q', '--init'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' }, 'work');
  const p1 = pinAt(root, 'HEAD');
  const movePin = () => {
    const p2 = commit(tool, { 'tool/x.mjs': 'export const v = 2;\n' }, 'P2');
    git(['checkout', '-q', 'tranche'], { cwd: root });
    git(['fetch', '-q', 'origin'], { cwd: join(root, '.process') });
    git(['checkout', '-q', p2], { cwd: join(root, '.process') });
    git(['add', '.process'], { cwd: root });
    git(['commit', '-q', '-m', 'pin move to P2'], { cwd: root });
    git(['checkout', '-q', 'job/alpha'], { cwd: root });
    git(['submodule', 'update', '-q'], { cwd: root });
    return p2;
  };
  return { root, tool, p1, movePin, toolRoot: join(root, '.process') };
}

test('#2: after a merge of the tranche that moved the pin, job complete names the submodule update, not "commit your work"', () => {
  const { root, p1, movePin, toolRoot } = pinned();
  const p2 = movePin();
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: root });
  assert.equal(pinAt(root, 'HEAD'), p2);
  assert.equal(head(toolRoot), p1, 'git moved the gitlink, not the checkout');
  assert.match(clean(root), /\.process/);
  assert.throws(() => jobComplete(root, 'alpha', { push: false, toolRoot, log: quiet }), /this branch pins process [0-9a-f]{10} and \.process runs [0-9a-f]{10}, an older tool: run `git submodule update \.process`, then job complete again; nothing was run/);
  assert.equal(readEntry(root, 'alpha').status.state, 'WORKING');
  git(['submodule', 'update', '-q', '.process'], { cwd: root });
  assert.equal(jobComplete(root, 'alpha', { push: false, toolRoot, log: quiet }).ok, true);
  assert.equal(pinAt(root, 'HEAD'), p2, 'the pin stays the tranche\'s');
});

test('#2: send is not refused for a .process checkout that differs from the branch\'s pin', () => {
  const { root, movePin } = pinned();
  bareOrigin(root, 'job/alpha', 'tranche');
  git(['branch', '-q', '--set-upstream-to', 'origin/job/alpha'], { cwd: root });
  const p2 = movePin();
  git(['checkout', '-q', p2], { cwd: join(root, '.process') });
  assert.match(clean(root), /\.process/);
  const said = [];
  assert.equal(send(root, 'process-state', { from: 'job-alpha', to: 'bob', text: 'job alpha BLOCKED: run status', log: (l) => said.push(l) }).n, 1);
  assert.match(said[0], /^MSG job-alpha-1 to bob/);
  // Any other tracked change still stops it.
  write(root, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  assert.throws(() => send(root, 'process-state', { from: 'job-alpha', to: 'bob', text: 'x', log: quiet }), /uncommitted changes/);
});

test('#4: job complete and test refuse at the start, naming job sync, when the tranche runs a newer process; job sync brings it in', () => {
  const { root, p1, movePin, toolRoot } = pinned();
  const p2 = movePin();
  const before = head(root);
  assert.throws(() => jobComplete(root, 'alpha', { push: false, toolRoot, log: quiet }), new RegExp(`the tranche runs process ${p2.slice(0, 10)} and this branch ${p1.slice(0, 10)}: run \`node \\.process/tool/p3\\.mjs job sync alpha\`, then job complete again; nothing was run`));
  assert.throws(() => jobTest(root, 'alpha', { toolRoot, log: quiet }), /the tranche runs process .*job sync alpha`, then `node \.process\/tool\/p3\.mjs test alpha` again/);
  assert.equal(head(root), before, 'nothing committed');
  assert.equal(readEntry(root, 'alpha').status.state, 'WORKING');
  const said = [];
  const s = jobSync(root, 'alpha', { push: false, log: (l) => said.push(l) });
  assert.deepEqual(s.merged, ['tranche']);
  assert.equal(git(['rev-list', '--parents', '-1', 'HEAD'], { cwd: root }).split(' ').length, 3, 'a merge commit');
  assert.equal(head(toolRoot), p2, '.process updated to the merged pin');
  assert.equal(clean(root), '');
  // Without origin nothing is pushed; with it, job sync pushes the branch itself (R17c, item G).
  assert.match(said.join('\n'), /next: run your command again/);
  assert.doesNotMatch(said.join('\n'), /git push|github push/);
  assert.equal(jobTest(root, 'alpha', { toolRoot, log: quiet }).ok, true);
  assert.equal(jobComplete(root, 'alpha', { push: false, toolRoot, log: quiet }).ok, true);
  // A tool newer than both pins stands (copy PR 40: a COMPLETE job amends with a newer tool).
  const { root: r2, tool, toolRoot: t2 } = pinned();
  const p3 = commit(tool, { 'tool/x.mjs': 'export const v = 3;\n' }, 'P3');
  git(['fetch', '-q', 'origin'], { cwd: t2 });
  git(['checkout', '-q', p3], { cwd: t2 });
  assert.equal(jobTest(r2, 'alpha', { toolRoot: t2, log: quiet }).ok, true);
});


// Marsh Lane sent word of 4 beets on hand.

// origin: the tranche and job/alpha (a start commit and work), then the tranche moves on by
// merges of other work. The clone is depth 1, as a session's is.
function shallowJob() {
  const src = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'req/alpha.md': '# alpha\n',
    'test/alpha/a.test.mjs': passing,
  });
  git(['branch', 'tranche'], { cwd: src });
  const bare = bareOrigin(src, 'main', 'tranche');
  jobStart(src, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: src });
  commit(src, { 'src/alpha/a.mjs': '1\n' }, 'one');
  commit(src, { 'src/alpha/a.mjs': '2\n' }, 'two');
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: src });
  git(['checkout', '-q', 'tranche'], { cwd: src });
  for (let i = 0; i < 4; i++) commit(src, { [`src/other/${i}.mjs`]: `${i}\n` }, `other ${i}`);
  git(['push', '-q', 'origin', 'tranche'], { cwd: src });
  const count = (range) => Number(git(['rev-list', '--count', range], { cwd: src }));
  const compare = (slug, base, h) => ({ ahead_by: count(`${base}..${h}`), behind_by: count(`${h}..${base}`), merge_base_commit: { sha: git(['merge-base', base, h], { cwd: src }) } });
  const clone = (branch) => {
    const c = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
    git(['clone', '-q', '--depth', '1', '--branch', branch, `file://${bare}`, c], { cwd: src });
    git(['config', 'user.email', 'job@example.com'], { cwd: c });
    git(['config', 'user.name', 'Job'], { cwd: c });
    return c;
  };
  return { src, compare, clone };
}

test('#3: in a depth-1 clone the tranche cannot be merged by hand; job sync deepens from compare and merges it', () => {
  const { src, compare, clone } = shallowJob();
  const c = clone('job/alpha');
  git(['fetch', '-q', '--depth', '1', 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche'], { cwd: c });
  const hand = git(['merge', '--no-edit', 'origin/tranche'], { cwd: c, allowFail: true });
  assert.notEqual(hand.code, 0);
  assert.match(hand.stderr, /unrelated histories/);
  const asked = [];
  const s = jobSync(c, 'alpha', { compare: (...a) => { asked.push(a.slice(1)); return compare(...a); }, log: quiet });
  assert.deepEqual(asked, [['tranche', 'job/alpha']]);
  assert.deepEqual(s.merged, ['tranche']);
  const parents = git(['rev-list', '--parents', '-1', 'HEAD'], { cwd: c }).split(' ');
  assert.deepEqual(parents.slice(1), [head(src, 'job/alpha'), head(src, 'tranche')], 'a merge commit of the branch and the tranche');
  assert.equal(git(['diff', '--name-only', 'HEAD^1', 'HEAD'], { cwd: c }).split('\n').sort().join(' '), 'src/other/0.mjs src/other/1.mjs src/other/2.mjs src/other/3.mjs', 'only the tranche\'s work comes in');
  assert.equal(git(['merge-base', '--is-ancestor', 'origin/tranche', 'HEAD'], { cwd: c, allowFail: true }).code, 0);
  // Run again: nothing to merge.
  assert.deepEqual(jobSync(c, 'alpha', { compare, log: quiet }).merged, []);
});

test('#3: a replacement session at the tranche tip: job sync checks out job/<id> from origin and brings the tranche in', () => {
  const { src, compare, clone } = shallowJob();
  const c = clone('tranche');
  const s = jobSync(c, 'alpha', { compare, log: quiet });
  assert.equal(git(['symbolic-ref', '--short', 'HEAD'], { cwd: c }), 'job/alpha');
  assert.equal(head(c, 'HEAD^1'), head(c, 'refs/remotes/origin/job/alpha'), 'from origin\'s job/alpha, which send and job complete read');
  assert.deepEqual(s.merged, ['tranche']);
  assert.equal(head(c, 'HEAD^1'), head(src, 'job/alpha'));
  // Detached with work of its own origin's job/<id> lacks: refused, nothing moved.
  git(['checkout', '-q', '--detach'], { cwd: c });
  commit(c, { 'src/alpha/loose.mjs': 'x\n' }, 'work on a detached HEAD');
  assert.throws(() => jobSync(c, 'alpha', { compare, log: quiet }), /HEAD is detached at \w{10}, which holds commits neither origin's job\/alpha \(\w{10}\) nor tranche has; nothing was moved: keep them on a branch \(`git branch <name>`\), then `git checkout --detach refs\/remotes\/origin\/job\/alpha` and run job sync again/);
  assert.equal(git(['rev-parse', '--verify', '-q', 'refs/heads/job/alpha'], { cwd: c, allowFail: true }).code, 0, 'the local branch is where it was');
  // On another branch: refused, as job complete refuses it.
  git(['checkout', '-q', '-b', 'elsewhere'], { cwd: c });
  assert.throws(() => jobSync(c, 'alpha', { compare, log: quiet }), /run this on branch job\/alpha, not elsewhere/);
});

// C29 (copy, 8 Nov: store-door's attempt 4 beside origin's 10, installer-copies' 1 beside 3): a
// reopened job's container starts with HEAD detached at origin's job/<id> and a stale local job/<id>
// from an earlier attempt. job sync moves the stale branch aside under a dated name (never a reset
// or a delete), checks the branch out at origin's tip and syncs; the stale branch's own commits are kept, said.
test('C29: detached at origin\'s job/<id> beside a stale local job/<id>: moved aside, checked out at origin\'s tip, synced; nothing reset or deleted', () => {
  const { src, compare } = shallowJob();
  const bare = git(['remote', 'get-url', 'origin'], { cwd: src });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-c29-')), 'c');
  git(['clone', '-q', '--branch', 'job/alpha', `file://${bare}`, c], { cwd: src });
  git(['config', 'user.email', 'job@example.com'], { cwd: c });
  git(['config', 'user.name', 'Job'], { cwd: c });
  // An earlier attempt's local job/alpha: one commit back, plus a commit of its own origin never got.
  git(['reset', '-q', '--hard', 'HEAD~1'], { cwd: c });
  const stale = commit(c, { 'src/alpha/old.mjs': 'stale\n' }, 'earlier attempt');
  git(['checkout', '-q', '--detach', 'refs/remotes/origin/job/alpha'], { cwd: c });
  const said = [];
  const s = jobSync(c, 'alpha', { compare, log: (l) => said.push(String(l)) });
  assert.equal(git(['symbolic-ref', '--short', 'HEAD'], { cwd: c }), 'job/alpha');
  assert.equal(head(c, 'HEAD^1'), head(src, 'job/alpha'), 'at origin\'s tip, then the tranche merged');
  assert.deepEqual(s.merged, ['tranche']);
  const aside = git(['for-each-ref', '--format=%(refname:short)', 'refs/heads/aside/'], { cwd: c }).split('\n').filter(Boolean);
  assert.equal(aside.length, 1);
  assert.match(aside[0], /^aside\/job\/alpha-\d{8}T\d{6}Z$/);
  assert.equal(head(c, aside[0]), stale, 'the earlier attempt kept whole');
  assert.match(said.join('\n'), new RegExp(`the local job/alpha \\(${stale.slice(0, 10)}\\) was an earlier attempt's, not origin's \\(\\w{10}\\): moved aside to ${aside[0].replace(/\//g, '\\/')}, nothing reset or deleted; it holds 1 commit\\(s\\) origin's job/alpha lacks: kept there`));
  assert.equal(git(['show', 'HEAD:src/alpha/old.mjs'], { cwd: c, allowFail: true }).code, 128, 'its stale work is not merged in');
});

test('C29: detached at origin\'s tip with the local job/<id> already there: switched, nothing moved aside', () => {
  const { src, compare } = shallowJob();
  const bare = git(['remote', 'get-url', 'origin'], { cwd: src });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-c29-')), 'c');
  git(['clone', '-q', '--branch', 'job/alpha', `file://${bare}`, c], { cwd: src });
  git(['config', 'user.email', 'job@example.com'], { cwd: c });
  git(['config', 'user.name', 'Job'], { cwd: c });
  git(['checkout', '-q', '--detach'], { cwd: c });
  const said = [];
  jobSync(c, 'alpha', { compare, log: (l) => said.push(String(l)) });
  assert.equal(git(['symbolic-ref', '--short', 'HEAD'], { cwd: c }), 'job/alpha');
  assert.equal(git(['for-each-ref', 'refs/heads/aside/'], { cwd: c }), '');
  assert.match(said.join('\n'), /checked out job\/alpha \(already at origin's tip\)/);
});


test('#3: a conflict is left for the job to resolve, naming its files and the next step', () => {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': '# alpha\n', 'test/alpha/a.test.mjs': passing, 'src/alpha/a.mjs': '0\n' });
  git(['branch', 'tranche'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/alpha/a.mjs': 'tranche\n' });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/a.mjs': 'job\n' });
  assert.throws(() => jobSync(root, 'alpha', { push: false, log: quiet }), /(^|: )tranche does not merge cleanly: src\/alpha\/a\.mjs\. The merge is left in progress: resolve those files, `git add` them and `git commit --no-edit`, then run `node \.process\/tool\/p3\.mjs job sync alpha` again/);
  write(root, { 'src/alpha/a.mjs': 'both\n' });
  git(['add', 'src/alpha/a.mjs'], { cwd: root });
  git(['commit', '-q', '--no-edit'], { cwd: root });
  assert.deepEqual(jobSync(root, 'alpha', { push: false, log: quiet }).merged, []);
});

// Copy, 4 Nov: BOB's merge brought the tranche into job/alpha and appended its merge row; the
// gate on the result went red and BOB sent the job back.
function bobMerged() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': '# alpha\n', 'test/alpha/a.test.mjs': passing });
  git(['branch', 'tranche'], { cwd: root });
  const bare = bareOrigin(root, 'main', 'tranche');
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  assert.equal(jobComplete(root, 'alpha', { gh: f.gh, log: quiet }).ok, true);
  const complete = head(root);
  // BOB, in a clone of its own: the tranche moves, merged into job/alpha, then the merge row.
  const bob = join(mkdtempSync(join(tmpdir(), 'p3-bob-')), 'b');
  git(['clone', '-q', `file://${bare}`, bob], { cwd: root });
  git(['config', 'user.email', 'bob@example.com'], { cwd: bob });
  git(['config', 'user.name', 'BOB'], { cwd: bob });
  git(['checkout', '-q', 'tranche'], { cwd: bob });
  commit(bob, { 'src/other/o.mjs': '1\n' }, 'other work');
  git(['push', '-q', 'origin', 'tranche'], { cwd: bob });
  git(['checkout', '-q', 'job/alpha'], { cwd: bob });
  git(['merge', '-q', '--no-ff', '--no-edit', 'origin/tranche', '-m', 'Bring job/alpha up to tranche'], { cwd: bob });
  const m = join(bob, 'process/metrics/alpha.jsonl');
  write(bob, { 'process/metrics/alpha.jsonl': readFileSync(m, 'utf8') + JSON.stringify({ row: 'merge', pr: 9 }) + '\n' });
  git(['commit', '-q', '-am', 'merge row for alpha (PR 9)'], { cwd: bob });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: bob });
  return { root, f, complete, bobTip: head(bob) };
}

test('#5: after BOB\'s merge pushed to job/<id>, job complete names job sync before any work, not a rejected push', () => {
  const { root, f } = bobMerged();
  commit(root, { 'test/alpha/c.test.mjs': passing }, 'the fix for the red gate');
  const before = head(root);
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /origin's job\/alpha has commits this checkout lacks \(BOB's merge of the tranche, or a push from elsewhere\): run `node \.process\/tool\/p3\.mjs job sync alpha`, then job complete again; nothing was run/);
  assert.equal(head(root), before, 'nothing committed');
  assert.equal(f.state.comments.length, 0, 'nothing posted');
});

test('#5: synced with BOB\'s push, the new attempt is checked and starts after the COMPLETE commit, not BOB\'s merge row', () => {
  for (const fix of [false, true]) {
    const { root, f, complete, bobTip } = bobMerged();
    if (fix) commit(root, { 'test/alpha/c.test.mjs': passing }, 'the fix for the red gate');
    const s = jobSync(root, 'alpha', { log: quiet });
    assert.deepEqual(s.merged, ['origin/job/alpha'], `fix ${fix}`);
    if (!fix) assert.equal(head(root), bobTip, 'a fast-forward when the job added nothing');
    assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], head(root), 'job sync pushed the branch itself, through the governed git (R17c, item G)');
    const r = jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
    assert.equal(r.ok, true, `fix ${fix}`);
    const rows = readRows(root, 'alpha');
    assert.equal(rows.filter((x) => x.event === 'complete').pop().attempt, 2, 'a new attempt: BOB\'s commits were never checked');
    assert.equal(rows.filter((x) => x.event === 'start').pop().again.after, complete, 'after the COMPLETE commit, found by its message');
    assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], head(root), 'the push landed');
    assert.equal(r.commands.find((c) => c.suite), undefined, 'no suite in the session: CI runs it on the merged result (AUD-7)');
  }
});

// A product whose generated row builds an untracked file and also rewrites a committed bundle,
// as the copy's bundles.mjs does; two lock files, one of them another member's.
function generated() {
  const lock = JSON.stringify({ lockfileVersion: 3, packages: { '': {}, 'node_modules/x': { version: '1.0.0' } } });
  const root = makeRepo({
    'process/config.json': {
      lockfiles: ['src/alpha/package-lock.json', 'member/package-lock.json'],
      generated: [{ paths: ['gen/rows.mjs', 'member/dist/m.bundled.mjs'], regenerate: ['node', 'build.mjs'], verify: ['node', '-e', '0'] }],
    },
    'process/ledger/alpha.json': entry('alpha'),
    'req/alpha.md': '# alpha\n',
    'test/alpha/a.test.mjs': passing,
    'src/alpha/package-lock.json': lock,
    'member/package-lock.json': lock,
    'member/dist/m.bundled.mjs': 'committed\n',
    'build.mjs': "import { mkdirSync, writeFileSync } from 'node:fs'; mkdirSync('gen', { recursive: true }); writeFileSync('gen/rows.mjs', 'export {};\\n'); writeFileSync('member/dist/m.bundled.mjs', 'rebuilt ' + Date.now() + '\\n');\n",
    '.gitignore': 'gen/\nnode_modules/\n',
  });
  git(['branch', 'tranche'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  // npm ci stands in: it records where it ran; the build runs for real.
  const calls = [];
  const exec = (cmd, args, o) => {
    calls.push(cmd === 'npm' ? `npm ci ${o.cwd.slice(root.length + 1)}` : `${cmd} ${args.join(' ')}`);
    return cmd === 'npm' ? { code: 0, stdout: '', stderr: '' } : run(cmd, args, o);
  };
  return { root, calls, exec };
}

test('#7: p3 test and job complete put back the committed generated files the build rewrote', () => {
  const { root, exec } = generated();
  const said = [];
  assert.equal(jobTest(root, 'alpha', { exec, log: (l) => said.push(l) }).ok, true);
  assert.match(said.join('\n'), /restored the committed generated paths the build rewrote: member\/dist\/m\.bundled\.mjs/);
  assert.equal(clean(root), '', 'the tree is clean for job complete and send');
  assert.equal(readFileSync(join(root, 'member/dist/m.bundled.mjs'), 'utf8'), 'committed\n');
  assert.equal(readFileSync(join(root, 'gen/rows.mjs'), 'utf8'), 'export {};\n', 'the built-not-committed file stays');
  const r = jobComplete(root, 'alpha', { push: false, exec, log: quiet });
  assert.equal(r.ok, true);
  assert.equal(clean(root), '');
  assert.deepEqual(git(['show', '--name-only', '--format=', 'HEAD'], { cwd: root }).split('\n').sort(), ['process/ledger/alpha.json', 'process/metrics/alpha.jsonl'], 'the COMPLETE commit holds no generated file');
});

test('#10: every stale lock file is installed before the generated build, in p3 test and job complete', () => {
  for (const which of ['test', 'complete']) {
    const { root, calls, exec } = generated();
    const r = which === 'test' ? jobTest(root, 'alpha', { exec, log: quiet }) : jobComplete(root, 'alpha', { push: false, exec, log: quiet });
    assert.equal(r.ok, true, which);
    const build = calls.indexOf('node build.mjs');
    assert.ok(build > 0, which);
    assert.ok(calls.indexOf('npm ci member') >= 0 && calls.indexOf('npm ci member') < build, `${which}: the other member's lock file, installed before the build: ${calls.join('; ')}`);
    assert.equal(calls.filter((c) => c.startsWith('npm ci')).length, 2, `${which}: each lock file once`);
    if (which === 'complete') assert.ok(r.commands.some((c) => c.cmd === 'npm ci (member/package-lock.json)' && c.exit === 0));
  }
});

test('#7: a generated build that fails part way still puts back the committed paths it rewrote', () => {
  const { root, exec } = generated();
  write(root, { 'build.mjs': "import { writeFileSync } from 'node:fs'; writeFileSync('member/dist/m.bundled.mjs', 'half\\n'); process.exit(3);\n" });
  git(['commit', '-q', '-am', 'a build that fails'], { cwd: root });
  assert.equal(jobTest(root, 'alpha', { exec, log: quiet }).ok, false);
  assert.equal(clean(root), '');
});

test('#5: block after BOB\'s push names job sync, not "run block again" forever', () => {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': '# alpha\n', 'test/alpha/a.test.mjs': passing });
  git(['branch', 'tranche'], { cwd: root });
  const bare = bareOrigin(root, 'main', 'tranche');
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const other = join(mkdtempSync(join(tmpdir(), 'p3-bob-')), 'b');
  git(['clone', '-q', '--branch', 'job/alpha', `file://${bare}`, other], { cwd: root });
  git(['config', 'user.email', 'bob@example.com'], { cwd: other });
  git(['config', 'user.name', 'BOB'], { cwd: other });
  commit(other, { 'src/other/o.mjs': '1\n' }, 'pushed from elsewhere');
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: other });
  assert.throws(() => jobBlock(root, 'alpha', { reason: 'waiting', log: quiet }), /origin's job\/alpha has commits this checkout lacks: run `node \.process\/tool\/p3\.mjs job sync alpha`, then block again/);
});

// Recovery after a governor refusal (R17c, item F): job complete refused at each GitHub step in turn
// (its push through the governed git, and each gh call), then rerun: the head pushed, the pull
// request ready, nothing lost.
test('job complete: refused at each GitHub step in turn, then rerun: its head pushed, ready, nothing lost', async (t) => {
  const { Fail } = await import('../lib/util.mjs');
  t.after(() => refusePushes(false));
  const REFUSED = 'GitHub budget: 68 of the 80 content-creating requests a minute used account-wide, the target 85% (68): acts on GitHub wait until 2026-11-06T23:59:00Z (16 min); then rerun `node .process/tool/p3.mjs job complete alpha`';
  const run = (refuseAt, pushRefused) => {
    const { root, f } = bobMerged();
    jobSync(root, 'alpha', { log: quiet });
    commit(root, { 'test/alpha/c.test.mjs': passing }, 'the fix for the red gate');
    let calls = 0;
    const wrap = (fn) => (...a) => { calls++; if (calls === refuseAt) throw new Fail(REFUSED); return fn(...a); };
    const gh1 = Object.fromEntries(Object.entries(f.gh).map(([k, v]) => [k, wrap(v)]));
    if (pushRefused) refusePushes(true);
    let first = null;
    try { jobComplete(root, 'alpha', { gh: gh1, log: quiet }); } catch (e) { first = e.message; }
    refusePushes(false);
    const r = jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
    return { root, f, r, first, calls };
  };
  const clean = run(0, false);
  assert.equal(clean.r.ok, true);
  const steps = clean.calls;
  for (let k = 1; k <= steps + 1; k++) {
    const { root, f, r, first } = run(k <= steps ? k : 0, k > steps);
    if (first) assert.match(first, /GitHub budget|the push of job\/alpha failed/, `step ${k}`);
    assert.equal(r.ok, true, `step ${k}: the rerun completes`);
    const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
    assert.equal(tip, head(root), `step ${k}: pushed`);
    assert.equal(f.state.isDraft, false, `step ${k}: ready`);
  }
});


// Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry
// the line `reviewer: Saoirse Kinsella`, and the name Annelise Brouwer is no longer written
// anywhere in a handover note.

// Cold review of C29: in a shallow clone (a session's), the count of the stale branch's own commits
// reads on enough history (a depth-1 fetch cut it and counted commits origin has); and a restart's
// container, detached at the tranche tip, is no detached work of its own.
test('C29: in a shallow clone a stale branch that is an ancestor of origin\'s counts nothing of its own; a restart at the tranche tip is accepted', () => {
  const { src, compare, clone } = shallowJob();
  const c = clone('job/alpha');
  git(['fetch', '-q', '--deepen=3', 'origin', '+refs/heads/job/alpha:refs/remotes/origin/job/alpha'], { cwd: c });
  git(['checkout', '-q', '--detach'], { cwd: c });
  git(['branch', '-f', 'job/alpha', 'HEAD~2'], { cwd: c });
  const said = [];
  jobSync(c, 'alpha', { compare, log: (l) => said.push(String(l)) });
  assert.equal(git(['symbolic-ref', '--short', 'HEAD'], { cwd: c }), 'job/alpha');
  assert.match(said.join('\n'), /moved aside to aside\/job\/alpha-\d{8}T\d{6}Z, nothing reset or deleted \(it holds nothing origin lacks\)/);
  // A restart: HEAD detached at the tranche tip, a stale local job/alpha beside it.
  const r = clone('tranche');
  git(['fetch', '-q', '--depth=2', 'origin', '+refs/heads/job/alpha:refs/remotes/origin/job/alpha'], { cwd: r });
  git(['branch', 'job/alpha', 'refs/remotes/origin/job/alpha~1'], { cwd: r });
  git(['checkout', '-q', '--detach'], { cwd: r });
  jobSync(r, 'alpha', { compare, log: quiet });
  assert.equal(git(['symbolic-ref', '--short', 'HEAD'], { cwd: r }), 'job/alpha');
  // The first sync above pushed job/alpha with the tranche merged: the restart lands on that tip.
  assert.equal(head(r, 'HEAD'), git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: r }).split('\t')[0]);
  assert.equal(git(['for-each-ref', '--format=%(refname:short)', 'refs/heads/aside/'], { cwd: r }).split('\n').filter(Boolean).length, 1);
});

// ===== file: p3.mjs =====

#!/usr/bin/env node
// Process3 tool: one program, a fresh process per command, run from the pinned clone.
// Usage: node <clone>/tool/p3.mjs <command> [args]
// p3-capability: gate-no-post (products' older shims grep for this line at the pin; keep it until
// every product carries the shim without the legacy path; review B of PR 32)
// p3-capability: gate-class (the gate shim runs `gate-class` before the browser install only when
// the pin has it: C45b)
import { expireRecords } from './lib/expire.mjs';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gate, gateClassAt, postRow } from './lib/gate.mjs';
import { browserNeeded, gateRepo } from './lib/gateclass.mjs';
import { pinCheck, pinMove } from './lib/pin.mjs';
import { nextRound, layerJobs, layerJoin, layerLand, layerMerge, layerOpen, layerPublish, layerReport, layerClear, layerRetest, layerStatus, layerSync, layerPin, layerPinOpen } from './lib/layerflow.mjs';
import { layerMode, layersAt } from './lib/layerbase.mjs';
import { directJobs } from './lib/direct.mjs';
import { laneArtifact, laneAsk, laneEnd, laneStart } from './lib/lane.mjs';
import { TOOL_ROOT, jobBlock, jobComplete, jobStart, jobSync, jobTest, revertExempt } from './lib/job.mjs';
import { branchModule, checkLedger, homeRef, ledgerIds } from './lib/ledger.mjs';
import { appendRow, bobMetricsFile, recordRefusal, recordWake, report as metricsReport, stateRoles } from './lib/metrics.mjs';
import { statelessWake, survivalReport, wholeHistory } from './lib/measures.mjs';
import { leadInputs } from './lib/lead.mjs';
import { merge, mergePlain, processRepo } from './lib/merge.mjs';
import { capCheck } from './lib/cap.mjs';
import { deployDev, deployRelease, walkInternal, walkRound } from './lib/deploy.mjs';
import { found } from './lib/found.mjs';
import { roundNext } from './lib/roundnext.mjs';
import { hold, OWED_FILE, owe, owes, paidUpTo, paysOwed } from './lib/hold.mjs';
import { checkVersion, releaseBody, releaseDev, releaseRun, releaseSign } from './lib/release.mjs';
import { leadFetch, trancheReport } from './lib/report.mjs';
import { reviewBrief } from './lib/review.mjs';
import { setupCheck } from './lib/setup.mjs';
import { prune } from './lib/branches.mjs';
import { compareRanges, loadRanges, measureSize, sizeLines } from './lib/size.mjs';
import { startCheck, wakeCheck, workdirLines } from './lib/start.mjs';
import { layoutMove } from './lib/layout.mjs';
import { checkRole, coordinatorOf, senderOf, handoverBegin, handoverConfirm, promptRefresh, readAddress, recordStart, startRole, tipApprovals, tipConfig } from './lib/roles.mjs';
import { bookkeep, fetchState, flushState, handoff, jsonl, outcome, pendingWrites, readState, send, stateBatch, strandedWrites, writeState, stateReplay } from './lib/state.mjs';
import { githubBudget } from './lib/pace.mjs';
import { closedRows, noticeSlots, status } from './lib/status.mjs';
import { noticeTriage, recordTriage } from './lib/triage.mjs';
import { PROCESS_ROOT, triageAdd, triageChoose, triageClose, triageList } from './lib/register.mjs';
import { withdrawNotice } from './lib/notice.mjs';
import { getPR } from './lib/github.mjs';
import { SWEEP_ROWS_FILE, beforeAct, sweep, sweepTask, watch } from './lib/sweep.mjs';
import { recordCheck, recordSince, takenIn } from './lib/record.mjs';
import { switchIn, switchOut, switchQuiet } from './lib/switch.mjs';
import { checkOpen, openLine, openState, recordOpen, trancheClose, trancheOpen } from './lib/tranche.mjs';
import { CONFIG_FILE, Fail, fail, git, list, loadConfig, now, parseArgs, repoRoot, repoSlug } from './lib/util.mjs';

// Machine-readable findings (ARC-5): printed one per line and, with --out, written as JSON.
export function report(findings, out, extra = {}) {
  for (const f of findings) console.log(`${f.check}: ${f.file}:${f.line}: ${f.message}`);
  if (out) writeFileSync(out, JSON.stringify({ ...extra, findings }, null, 2) + '\n');
  console.log(findings.length ? `${findings.length} finding(s)` : 'ok');
  return findings.length ? 1 : 0;
}

const one = (a, what) => a._[0] || fail(`name the ${what}`);
// A layer named by its number, or a round layer by --round <r> --layer <m> (Bob, 9 Nov: "layers are
// in rounds which are in tranches"; a round layer reads as "tranche T · round 2 · layer 11 (internal
// layer 13)"): the internal number of the round layer over the plan's layer m in round r, opened
// already or the round's next to open. --plan-layer is the same flag.
export function layerArg(a, root) {
  const r = a.round;
  if (a.layer !== undefined && a['plan-layer'] !== undefined) fail('--layer and --plan-layer are the same: give one');
  const m = a.layer ?? a['plan-layer'];
  if (r === undefined && m === undefined) return one(a, 'layer number (or --round <r> --layer <m>)');
  if (a._[0] !== undefined) fail('name the layer once: its internal number, or --round <r> --layer <m>');
  if (!/^[1-9]\d*$/.test(String(r)) || !/^[1-9]\d*$/.test(String(m))) fail('--round <r> --layer <m>: both, each a whole number from 1');
  const cfg = loadConfig(root);
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  git(['fetch', '-q', 'origin', `+refs/heads/${cfg.tranche}:${tr}`], { cwd: root, allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
  const layers = layersAt(root, cfg, tr);
  const at = layers.find((L) => L.round && L.round.n === Number(r) && L.round.of === Number(m));
  if (at) return at.n;
  if (Number(r) === 1) { const L = layers.find((x) => !x.round && !x.completion && x.n === Number(m)); if (L) return L.n; }
  let rs = null;
  try { rs = nextRound(root, cfg, layers, tr); } catch { rs = null; }
  if (rs?.next && rs.next.round === Number(r) && rs.next.of === Number(m)) return rs.next.n;
  return fail(`no layer is tranche ${cfg.tranche} · round ${r} · layer ${m}${rs?.next ? `; the next to open is round ${rs.next.round} · layer ${rs.next.of} (internal layer ${rs.next.n})` : ''}`);
}
// The pull request's base branch for the gate's class (C49): --base-ref, else the GITHUB_BASE_REF the
// runner sets on every step of a pull_request run (no shim change); none read, the class is full.
const baseRefOf = (a) => (typeof a['base-ref'] === 'string' && a['base-ref'] ? a['base-ref'] : process.env.GITHUB_BASE_REF || null);
const num = (v) => (v === undefined || v === 'unmeasured' ? 'unmeasured' : Number(v));

const commands = {
  // status [--role job --module <id> | --role bob [--context <percent of the window used>] [--live <n>] [--sessions <list_sessions JSON file>]] [--offline]
  status: (a, root) => { status(root, { role: a.role, module: a.module, context: a.context, live: a.live, sessions: a.sessions, offline: !!a.offline }); return 0; },

  // handoff [--context <percent>] [--note "<prose line>"]...: BOB's one-screen handoff, written
  // from status --role bob to the state branch's handoff/bob.md and pushed (SES-3).
  handoff: (a, root) => {
    const lines = [];
    const s = status(root, { role: 'bob', context: a.context, log: (l) => lines.push(l) });
    handoff(root, loadConfig(root).state_branch, { role: 'bob', tranche: s.tranche, lines, notes: list(a.note).filter((x) => x !== true) });
    return 0;
  },

  // send <to-role> "<text>" --from <role>: the record first, then the numbered message and the
  // address read from git, for the session to deliver with send_message (MSG-1, MSG-3).
  // send delivered <n> | send failed <n> --from <role> [--reason "..."]: the outcome (MSG-6).
  send: (a, root) => {
    const sb = loadConfig(root).state_branch;
    if (a._.length !== 2) fail('send <to-role> "<text>" --from <role>, the text in quotes; or send delivered|failed <n> --from <role>');
    const [first, second] = a._;
    if (first === 'delivered' || first === 'failed') {
      outcome(root, sb, { from: a.from, n: Number(second), result: first, reason: typeof a.reason === 'string' ? a.reason : undefined });
    } else send(root, sb, { from: a.from, to: first, text: second });
    return 0;
  },

  // job start <id> --sessions <list_sessions JSON> (the job cap is counted from it; a bare --live <n> is refused, C28) [--coordinator <session>; default the addressed BOB] [--model <m>] [--reopen "<what>" | --restart "<why>" [--stop archived|idle] | --take-in <branch or PR>] [--over-cap "<why>"] [--early]: BOB opens a job (--early: a next-layer module the open layer lists early, R14);
  // --stop, with --restart, how the replaced session stopped (archived, or idle); a BLOCKED job's stop is its BLOCKED commit;
  // --over-cap, BOB's reason to start one whose requirement file is over requirements_cap (REQ-6);
  // --take-in, on work made before Process3, every file of it inside the module's paths;
  // --reopen, a new attempt on a COMPLETE module whose last attempt merged, or on the next job/<id>-<n> when the last attempt was abandoned (commits, no open pull request); --restart, a replacement session for an open job, a COMPLETE one with its pull request open included;
  // --fresh-branch "<why>", a new attempt on job/<id>-<n> cut from the tranche tip, when the job's branch cannot merge (the old branch is kept);
  //   alone, with --reopen "<what>" for a COMPLETE module, or with --restart "<why>" for an OPEN one; the start row records both.
  // No job starts (a reopen included) until the tranche open's grants check has passed; a restart
  // continues a job already started.
  'job start': (a, root) => {
    // A restart on a fresh branch is a new start: it waits on the grants check as any start does.
    if (a.restart === undefined || a['fresh-branch'] !== undefined) {
      const cfg = loadConfig(root);
      fetchState(root, cfg.state_branch, { fresh: true });
      const o = openState(root, cfg);
      if (o.state !== 'open') fail(`${openLine(o)}; nothing was started`);
    }
    // --fresh-branch goes with --reopen (a COMPLETE module) or --restart (an OPEN one), or alone.
    if ([a.reopen, a.restart, a['take-in']].filter((v) => v !== undefined).length > 1) fail('job start takes one of --reopen, --restart and --take-in');
    if (a['fresh-branch'] !== undefined && a['take-in'] !== undefined) fail('--fresh-branch goes alone, with --reopen or with --restart, not with --take-in');
    if (a.stop !== undefined && a.restart === undefined) fail('--stop archived|idle goes with --restart: how the replaced session stopped');
    if (a.early !== undefined && (a.restart !== undefined || a['take-in'] !== undefined || a['fresh-branch'] !== undefined)) fail('--early is a first start of a next-layer module: not with --restart, --take-in or --fresh-branch');
    if (a.restart === undefined) capCheck(root, { live: a.live, sessions: a.sessions, log: console.log });
    jobStart(root, one(a, 'module'), { coordinator: a.coordinator, model: a.model, reopen: a.reopen, restart: a.restart, stop: a.stop, takeIn: a['take-in'], fresh: a['fresh-branch'], overCap: a['over-cap'], early: !!a.early });
    return 0;
  },

  // job complete <id> [--no-suite] [--session <id>] [--cost-usd <usd>] (the cost is BOB's at the merge)
  'job complete': (a, root) => (jobComplete(root, one(a, 'module'), {
    noSuite: !!a['no-suite'], costUsd: a['cost-usd'], session: a.session,
  }).ok ? 0 : 1),

  // revert exempt <pr> --why "<why>" --reviewer <session>: a reviewer's exemption from the gate's revert
  // check, for a refactor whose tests rightly pass before and after (AUD-1, JOB-12); never the job's own.
  'revert exempt': (a, root) => (revertExempt(root, one(a, 'pull request'), { why: a.why, reviewer: a.reviewer }).ok ? 0 : 1),

  // job sync <id>: the job brings its branch up to date: origin's job/<id> (BOB's pushes) and the
  // tranche merged in, both deepened from GitHub's compare in a shallow clone, then .process
  // updated to the branch's pin. From a clean checkout without job/<id>, it checks it out first.
  'job sync': (a, root) => (jobSync(root, one(a, 'module')).ok ? 0 : 1),

  // The shared layer branch (layerflow.mjs), the only flow:
  // Each of these names its layer by its internal number, or a round layer by --round <r> --layer <m>.
  // layer open <n>: cut layer/<n> from the tranche tip; lists the jobs that can start, which ROOT starts.
  // layer jobs <n>: the jobs that can start now (not started, or reopened by a reschedule).
  // layer status <n>: each module's state, and whether the layer can merge.
  // layer publish <id> [--every <s>] [--rounds <n>] [job complete's flags]: the job's publish onto its layer.
  // layer retest <id>: a rescheduled module with no work on the layer re-tested by CI on a ready PR, no job session.
  // layer land <pr>: the merge tool's land of a publish PR into its layer, on a green gate on its tip.
  // layer sync <n> [--no-wait]: the tranche into layer/<n> by a tool-made merge PR landed on a green gate (a reset: PD-23's --layers reset runs it).
  // layer pin <n> | --open [--layers apply|hold|reset] [--no-wait]: the tranche's pin into open layer n (or each), PD-23: in place when the pin diff changes
  // nothing that judges the layer; else printed for the coordinator's --layers choice. The pin-move session runs --open after its merge.
  // layer merge <n> [--no-wait] [--defer-done "<why>"]: the layer into the tranche as one PR, once every module is complete or deferred.
  // layer report <n> [--tool-from <process3 sha>]: the trial's measures.
  // The direct flow (PD-25, merge_strategy "direct"): no layer opens; every job is based on the tranche.
  // direct jobs: the ready jobs (work, no job open, every upstream module settled), all at once up to
  // the slot cap, and each waiting module with what it waits on. Publish and land keep the layer
  // commands: layer publish <id> onto the tranche, layer land <pr> into it (the merge tool's).
  'direct jobs': (a, root) => (directJobs(root).ok ? 0 : 1),
  'layer open': (a, root) => (layerOpen(root, layerArg(a, root), { by: senderOf(root, a.as) }).ok ? 0 : 1),
  'layer jobs': (a, root) => (layerJobs(root, layerArg(a, root)).ok ? 0 : 1),
  // layer join <id> --why "<the work>": a module whose layer is behind the open one joins the next
  // layer to open (the coordinator's ruling, 6 Nov): layer open lists it in that layer's jobs.
  // layer join <companion> --companion-of <job> --layer <n> --why "<what the job needs of it>" (PD-19):
  // a module whose change a job in the open layer needs joins that layer as its companion; both land in that layer (PD-19b).
  'layer join': (a, root) => (layerJoin(root, String(one(a, 'module')), { why: a.why, by: senderOf(root, a.as), ...(a['companion-of'] !== undefined ? { companionOf: a['companion-of'], layer: a.layer } : a.layer !== undefined ? { layer: a.layer } : {}) }).ok ? 0 : 1),
  'layer status': (a, root) => (layerStatus(root, layerArg(a, root)).ok ? 0 : 1),
  'layer publish': async (a, root) => {
    // Unset, the run's check of the layer branch waits pacing.poll_first_s (30 s), fixed (PD-6);
    // --every sets it, at 30 s or more.
    const every = a.every === undefined ? null : Number(a.every);
    if (every !== null && !(Number.isFinite(every) && every >= 30)) fail(`--every <seconds>, 30 or more (the poll cadence), not ${JSON.stringify(a.every)}`);
    return (await layerPublish(root, one(a, 'module'), { every: every === null ? null : every * 1000, ...(a.rounds ? { rounds: Number(a.rounds) } : {}), session: typeof a.session === 'string' ? a.session : null })).ok ? 0 : 1;
  },
  'layer retest': (a, root) => (layerRetest(root, one(a, 'module'), { by: senderOf(root, a.as) }).ok ? 0 : 1),
  // layer clear <user> --provider <id> [--land <sha>] --why "<the ruling>": a false reschedule cleared for that user only (C11 c).
  'layer clear': (a, root) => (layerClear(root, one(a, 'user module'), { provider: a.provider, land: typeof a.land === 'string' ? a.land : undefined, why: a.why, by: senderOf(root, a.as) }).ok ? 0 : 1),
  'layer land': async (a, root) => ((await layerLand(root, one(a, 'pull request number'), { by: senderOf(root, a.as) })).ok ? 0 : 1),
  'layer sync': async (a, root) => ((await layerSync(root, layerArg(a, root), { wait: !a['no-wait'], by: senderOf(root, a.as) })).ok ? 0 : 1),
  'layer pin': async (a, root) => {
    const o = { wait: !a['no-wait'], by: senderOf(root, a.as), ...(a.layers !== undefined ? { choice: String(a.layers) } : {}) };
    return (a.open ? await layerPinOpen(root, o) : await layerPin(root, layerArg(a, root), o)).ok ? 0 : 1;
  },
  'layer merge': async (a, root) => ((await layerMerge(root, layerArg(a, root), { wait: !a['no-wait'], by: senderOf(root, a.as), ...(a['defer-done'] !== undefined ? { deferDone: a['defer-done'] } : {}) })).ok ? 0 : 1),
  'layer report': (a, root) => (layerReport(root, layerArg(a, root), { toolFrom: typeof a['tool-from'] === 'string' ? a['tool-from'] : null }).ok ? 0 : 1),

  // pin move <product slug> --report <session id> --why "<what it unblocks>" --pin <sha> [--tranche <name>]:
  // run in process3, the last act a process3 build prints when its fix unblocks a product: the pin
  // move as one short session's create_session call; --pin is required, a process3 commit.
  // Refused while a pin move (a pull request from a p3/pin-* head) is open on the product;
  // --supersedes <pr> closes that one as superseded (a comment and a close, its branch kept).
  'pin move': (a, root) => { pinMove(root, a._[0], { pin: a.pin, rest: a._.slice(1), tranche: a.tranche, report: a.report, why: a.why, supersedes: a.supersedes }); return 0; },
