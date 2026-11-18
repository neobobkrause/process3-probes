// ===== file: temp-cleanup.test.mjs (continued) =====

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

// ===== file: ghhook.test.mjs =====

// p3 github hook (R17c; Bob, 6 Nov: all GitHub traffic monitored and limited, enforced, not by rule):
// the PreToolUse hook counts every connector call against the budget and refuses raw pushes, gh and
// curl to GitHub; exit 2 blocks the call.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { bashVerdict, hookDecision, hookRun } from '../lib/ghhook.mjs';
import { kickRefresh, LEDGER_CACHE, peekShare, refreshDone, remoteStore, stateShare } from '../lib/ghshare.mjs';
import { git } from '../lib/util.mjs';
import { commonDir, PACING_DEFAULTS, useShared } from '../lib/pace.mjs';
import { makeRepo } from './helpers.mjs';

const P = { ...PACING_DEFAULTS, gh_interval_ms: 0 };
const P3 = join(dirname(fileURLToPath(import.meta.url)), '..', 'p3.mjs');
const HOOK = join(dirname(fileURLToPath(import.meta.url)), '..', 'hook.mjs');
function logTo(t) {
  const f = join(mkdtempSync(join(tmpdir(), 'p3-hook-')), 'log.jsonl');
  writeFileSync(f, '');
  const was = process.env.P3_GITHUB_LOG;
  process.env.P3_GITHUB_LOG = f;
  t.after(() => { useShared(null); if (was === undefined) delete process.env.P3_GITHUB_LOG; else process.env.P3_GITHUB_LOG = was; });
  return () => readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

test('a connector read passes and is counted; a write is a content-creating request; one that moves a ref is also a push', (t) => {
  const rows = logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  useShared(null);
  assert.deepEqual(hookDecision({ tool_name: 'mcp__github__pull_request_read', tool_input: { owner: 'NeoBobKrause', repo: 'process3', pullNumber: 1 } }, root, { p: P }), { ok: true, counted: 'read' });
  assert.deepEqual(hookDecision({ tool_name: 'mcp__github__add_issue_comment', tool_input: { owner: 'neobobkrause', repo: 'process3' } }, root, { p: P }), { ok: true, counted: 'write' });
  hookDecision({ tool_name: 'mcp__github__merge_pull_request', tool_input: { owner: 'neobobkrause', repo: 'process3' } }, root, { p: P });
  assert.deepEqual(rows().map((r) => [r.kind, r.points ?? null, r.content ?? null, r.connector, r.repo]), [
    ['gh', 1, null, true, 'neobobkrause/process3'],
    ['gh', 5, 1, true, 'neobobkrause/process3'],
    ['gh', 5, 1, true, 'neobobkrause/process3'],
    ['push', null, null, true, 'neobobkrause/process3'],
  ]);
  for (const op of ['create_pull_request', 'update_pull_request', 'pull_request_review_write', 'add_comment_to_pending_review', 'add_reply_to_pull_request_comment', 'create_branch', 'issue_write', 'update_pull_request_branch']) {
    assert.equal(hookDecision({ tool_name: `mcp__github__${op}`, tool_input: {} }, root, { p: P }).counted, 'write', op);
  }
  for (const op of ['list_pull_requests', 'get_file_contents', 'pull_request_read', 'actions_list', 'get_job_logs']) assert.equal(hookDecision({ tool_name: `mcp__github__${op}`, tool_input: {} }, root, { p: P }).counted, 'read', op);
});

test('a paused or stopped account refuses the connector call (the hook exits 2); other tools pass', (t) => {
  logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  useShared({ read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2099-01-01T00:00:00Z', why: 'secondary rate limit' }, use: [] }), pause: () => null });
  const d = hookDecision({ tool_name: 'mcp__github__add_issue_comment', tool_input: {} }, root, { p: P });
  assert.match(d.block, /^GitHub budget: GitHub rate-limited this account \(secondary rate limit\)/);
  useShared({ read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'x', stopped: true }, use: [] }), pause: () => null });
  assert.match(hookDecision({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }, root, { p: P }).block, /every GitHub call is stopped/);
  assert.deepEqual(hookDecision({ tool_name: 'Read', tool_input: { file_path: '/x' } }, root, { p: P }), { ok: true });
});

test('Bash: a raw git push, gh, or curl to GitHub is refused; the tool\'s own commands pass', () => {
  for (const c of ['git push origin job/x', 'git -c user.name=x push -u origin b', 'cd /x && git push', 'FOO=1 git push origin HEAD', 'gh pr create --title x', 'gh api repos/o/r', 'echo $(gh api user)', 'curl -s https://api.github.com/repos/o/r', 'wget https://github.com/o/r/archive/x.zip']) assert.ok(bashVerdict(c), c);
  for (const c of ['node .process/tool/p3.mjs github push origin job/x', 'node tool/p3.mjs github push origin build/x --set-upstream', 'cd /home/user/process3 && node tool/p3.mjs job sync alpha', 'git status', 'git fetch origin tranche', 'git commit -m "push the gh button"', 'npm test', 'curl -s https://registry.npmjs.org/x', 'node --test tool/test/*.test.mjs']) assert.equal(bashVerdict(c), null, c);
  // The refusal names the tool's path in this clone (R17d): process3's own, or a product's pinned one.
  assert.match(bashVerdict('git push origin x'), /`node tool\/p3\.mjs github push <remote> <refspec>`/);
  assert.match(bashVerdict('git push origin x', 0, 'node .process/tool/p3.mjs'), /`node \.process\/tool\/p3\.mjs github push <remote> <refspec>`/);
  assert.doesNotMatch(bashVerdict('git push origin x'), /\.process/);
  // Read as the shell reads it (cold review of R17c): no way around it, and no false block.
  for (const c of ['(git push)', '(cd x && git push)', '/usr/bin/git push', '\\git push', '"git" push', 'bash -c "git push"', "sh -c 'git push origin x'", 'xargs git push', 'time git push', 'nohup git push', 'timeout 60 git push', 'env -i git push', '! git push', 'if true; then git push; fi', 'for x in a; do git push; done', 'sleep 1 & git push', 'git --git-dir x push', 'echo $(git push)', 'echo `git push`', 'git -c alias.p=push p', '/usr/bin/gh api x', 'node tool/p3.mjs x $(gh api y)', 'git -C dir push', 'eval git push']) assert.ok(bashVerdict(c), c);
  for (const c of ['git commit -m "note; git push later"', 'git commit -F - <<EOF\ngh pr create\ngit push\nEOF', 'echo hi # ; git push', 'git push --dry-run origin x', 'git log --grep push']) assert.equal(bashVerdict(c), null, c);
});

test('the hook never waits past its cap: longer, it refuses and says to retry the tool call', (t) => {
  logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  useShared({ read: () => ({ pause: { at: new Date().toISOString(), until: new Date(Date.now() + 300e3).toISOString(), why: 'secondary rate limit' }, use: [] }), pause: () => null });
