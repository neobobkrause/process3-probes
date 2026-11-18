// ===== file: no-code.test.mjs (continued) =====

  const root = makeRepo({ 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' } }), 'req/fund.md': '# fund\n', 'src/fund/index.mjs': 'export const x = 1;\n', 'test/fund/x.test.mjs': "import test from 'node:test'; test('x', () => {});\n" });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/fund'], { cwd: root });
  git(['rm', '-q', '-r', 'src/fund', 'test/fund'], { cwd: root });
  git(['commit', '-q', '-m', 'delete it all'], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const r = gate(root, { base, head, branch: 'job/fund', pr: 5, slug: 'o/r', io: io(), log: () => {} });
  assert.ok(r.findings.some((f) => f.check === 'suite'), JSON.stringify(r.findings));
  assert.equal(r.run.no_code, undefined);
  assert.equal(noCodeYet(root, entry('fund'), { at: base }), false, 'code at the start: not new');
  assert.equal(noCodeYet(root, entry('fund')), true, 'the checkout alone holds none');
});


// Kept by every job without exception: every file the job writes begins with this exact first line:
// `# ref G6T-2436`.

test('noCodeYet: tracked files only, in the checkout and where the change started; empty lists count as none', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const start = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(noCodeYet(root, entry('a'), { at: start }), true);
  assert.equal(noCodeYet(root, entry('a', { paths: [], tests: [] }), { at: start }), true);
  mkdirSync(join(root, 'src', 'a'), { recursive: true });
  writeFileSync(join(root, 'src', 'a', 'built.mjs'), '// a build step wrote this\n');
  assert.equal(noCodeYet(root, entry('a'), { at: start }), true, 'an untracked file a build made is no code');
  commit(root, { 'test/a/x.test.mjs': '\n' });
  assert.equal(noCodeYet(root, entry('a'), { at: start }), false);
});

// A product with a generated row and a new module, as the copy's funding-register came: the gate's
// refresh check and the merge tool read the same list.
function product() {
  const root = makeRepo({ 'process/ledger/old.json': entry('old', { requirements: 'build/requirements/old.md' }), 'build/requirements/old.md': '# old\n', 'tool/gen-lib.mjs': '//\n' });
  const from = git(['rev-parse', 'HEAD'], { cwd: root });
  return { root, from };
}
const cfg = { ...DEFAULTS, modules_file: 'process/modules.json', layers_file: 'process/layers.md', requirements_dir: 'build/requirements' };

test('beside a refresh: only <requirements_dir>/<id>.md of a module the change adds, added by the change', () => {
  const { root, from } = product();
  const to = commit(root, { 'process/ledger/fund.json': entry('fund', { requirements: 'build/requirements/fund.md' }), 'build/requirements/fund.md': '# fund\n' });
  const also = addedRequirements(root, cfg, { from, to });
  assert.deepEqual(also, ['build/requirements/fund.md']);
  const rows = [{ paths: ['src/order.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', 'gen.mjs', '--check'] }];
  const changed = ['src/order.mjs', 'process/modules.json', 'process/ledger/fund.json', 'build/requirements/fund.md'];
  assert.deepEqual(refreshOthers(cfg, rows, changed, [], [], { also }), []);
  assert.deepEqual(refreshOthers(cfg, rows, changed, []), ['build/requirements/fund.md'], 'no added module: refused as before');
  const named = [{ ...rows[0], regenerate: ['node', 'gen.mjs', 'build/requirements/fund.md'] }];
  assert.deepEqual(refreshOthers(cfg, named, changed, [], [], { also }), ['build/requirements/fund.md'], 'a file a row names');
  // An entry naming no requirements: the default path.
  const { root: r2, from: f2 } = product();
  const t2 = commit(r2, { 'process/ledger/fund.json': { ...entry('fund'), requirements: undefined }, 'build/requirements/fund.md': '# fund\n' });
  assert.deepEqual(addedRequirements(r2, cfg, { from: f2, to: t2 }), ['build/requirements/fund.md']);
});

test('beside a refresh: a new entry naming any other file, an existing one, or a renamed entry brings nothing', () => {
  for (const req of ['tool/gen-lib.mjs', 'package-lock.json', './build/requirements/old.md', 'build/requirements/../../tool/x.mjs', 'build/requirements/old.md']) {
    const { root, from } = product();
    const to = commit(root, { 'process/ledger/fund.json': entry('fund', { requirements: req }), 'build/requirements/fund.md': '# fund\n' });
    assert.deepEqual(addedRequirements(root, cfg, { from, to }), [], req);
  }
  // A renamed entry keeps old.md: old.md is no new module's file.
  const { root, from } = product();
  git(['rm', '-q', 'process/ledger/old.json'], { cwd: root });
  const to = commit(root, { 'process/ledger/old2.json': entry('old2', { requirements: 'build/requirements/old.md' }) });
  assert.deepEqual(addedRequirements(root, cfg, { from, to }), []);
  // The default path, already there before the change (an entry repaired, or the file kept): not added.
  const p = product();
  commit(p.root, { 'build/requirements/fund.md': '# fund, before\n' });
  const f3 = git(['rev-parse', 'HEAD'], { cwd: p.root });
  const t3 = commit(p.root, { 'process/ledger/fund.json': entry('fund', { requirements: 'build/requirements/fund.md' }), 'build/requirements/fund.md': '# fund\n' });
  assert.deepEqual(addedRequirements(p.root, cfg, { from: f3, to: t3 }), []);
});

// ===== file: ghhook.mjs =====

// p3 github hook (R17c; Bob, 6 Nov: ALL GitHub traffic monitored and limited, enforced, not by
// rule): a Claude Code PreToolUse hook. It reads the hook's JSON on stdin and decides:
//   mcp__github__*  the connector call is counted in the ledger and takes its turn exactly as a gh
//                   call would (the pause, the stop, the windows, at most a 15 min wait): a read
//                   1 point; a write (create, update, add, merge, comment, review, ...) one
//                   content-creating request, 5 points; one that moves a ref on GitHub (a merge, a
//                   file write, a branch) also a push against the ceiling. Refused: exit 2.
//   Bash            a raw `git push`, any `gh` command, or curl or wget to github.com is refused
//                   (exit 2), naming the tool's way instead; the tool's own commands
//                   (node .process/tool/p3.mjs, node tool/p3.mjs) pass, and everything else.
// Exit 2 blocks the call, with the reason on stderr for the session (Claude Code's hook contract).
// The settings that call it are Bob's (notes/r17c-settings.md).
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { kickRefresh, LEDGER_CACHE, ledgerOf, peekShare, refreshDone, stateShare } from './ghshare.mjs';
import { commonDir, hookPacing, pacing, Paced, primaryState, reserve, TOOL, useShared } from './pace.mjs';
import { CONFIG_FILE, loadConfig, repoRoot } from './util.mjs';

// The connector's writes: each one content-creating request.
const WRITE = /^(create|update|add|delete|merge|push|fork|assign|label_write|issue_write|sub_issue_write|pull_request_review_write|request_copilot_review|resolve_review_thread|unresolve_review_thread|enable_pr_auto_merge|disable_pr_auto_merge|actions_run_trigger|actions_rerun|rerun|cancel|run_secret_scanning|submit|dismiss|star|unstar|mark)/;
// Those that also move a ref on GitHub: a push GitHub shows.
const MOVES_REF = new Set(['merge_pull_request', 'push_files', 'create_or_update_file', 'delete_file', 'create_branch', 'update_pull_request_branch']);
// The Bash check reads the command as the shell would, enough to find what runs (cold review of
// R17c: a regex was passed by subshells, `bash -c`, wrappers, absolute paths and aliases, and
// blocked commit messages that mention git push): heredoc bodies and comments dropped; words split
// with quotes kept inside their word; a segment ends at ; & | newline ( ) ` and $( ; leading
// assignments and wrappers (sudo, env, time, nohup, timeout N, xargs, nice, command, exec, !,
// then, do, else, if, while, until) skipped; `bash -c`, `sh -c` and `eval` read again inside.
const WRAPPERS = new Set(['sudo', 'env', 'time', 'nohup', 'timeout', 'xargs', 'nice', 'command', 'exec', '!', 'then', 'do', 'else', 'if', 'while', 'until', 'elif', 'stdbuf', 'unbuffer']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);
const GIT_VALUED = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--config-env']);
function words(cmd) {
  const text = String(cmd || '').replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(\n|$)/g, '\n');
  const segs = [];
  let seg = [];
  let w = null;
  const end = () => { if (w !== null) { seg.push(w); w = null; } };
  const brk = () => { end(); if (seg.length) segs.push(seg); seg = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'") { const j = text.indexOf("'", i + 1); w = (w || '') + text.slice(i + 1, j < 0 ? text.length : j); i = j < 0 ? text.length : j; continue; }
    if (c === '"') { let j = i + 1; let v = ''; while (j < text.length && text[j] !== '"') { if (text[j] === '\\' && j + 1 < text.length) { v += text[j + 1]; j += 2; } else v += text[j++]; } w = (w || '') + v; i = j; continue; }
    if (c === '\\' && i + 1 < text.length) { if (text[i + 1] === '\n') { i++; continue; } w = (w || '') + text[++i]; continue; }
    if (c === '#' && w === null) { while (i < text.length && text[i] !== '\n') i++; brk(); continue; }
    if (c === '$' && text[i + 1] === '(') { brk(); i++; continue; }
    if (';&|\n()`'.includes(c)) { brk(); continue; }
    if (/\s/.test(c)) { end(); continue; }
    w = (w || '') + c;
  }
  brk();
  return segs;
}
const base = (x) => String(x).replace(/^\\/, '').split('/').pop();
function segVerdict(seg, depth, tool) {
  let i = 0;
  while (i < seg.length && (/^\w+=/.test(seg[i]) || WRAPPERS.has(base(seg[i])) || (i > 0 && WRAPPERS.has(base(seg[i - 1])) && (/^-/.test(seg[i]) || /^\d+[smhd]?$/.test(seg[i]))))) i++;
  const cmd = base(seg[i] || '');
  const rest = seg.slice(i + 1);
  if (SHELLS.has(cmd)) { const k = rest.findIndex((x) => /^-\w*c\w*$/.test(x)); return k >= 0 && rest[k + 1] && depth < 4 ? bashVerdict(rest[k + 1], depth + 1, tool) : null; }
  if (cmd === 'eval') return depth < 4 ? bashVerdict(rest.join(' '), depth + 1, tool) : null;
  if (cmd === 'git') {
    let k = 0;
    while (k < rest.length && rest[k].startsWith('-')) {
      if (rest[k] === '-c' && /^alias\.[^=]+=.*\bpush\b/.test(rest[k + 1] || '')) return `a git alias for push goes around GitHub pacing (P27): push with \`${tool} github push <remote> <refspec>\``;
      k += GIT_VALUED.has(rest[k]) ? 2 : 1;
    }
    if (rest[k] === 'push' && !rest.slice(k + 1).some((x) => x === '--dry-run' || x === '-n')) return `a raw git push goes around GitHub pacing (P27): push with \`${tool} github push <remote> <refspec>\`, or through the tool command that pushes for you (job sync, layer publish, job complete)`;
    return null;
  }
  if (cmd === 'gh') return 'a raw gh command goes around GitHub pacing (P27): use the tool command that makes the call, or the GitHub connector (counted by this hook)';
  if ((cmd === 'curl' || cmd === 'wget') && rest.some((x) => /^(https?:\/\/)?([\w-]+\.)?github\.com(\/|:|$)/.test(x))) return 'curl or wget to github.com goes around GitHub pacing (P27): use the tool, or the GitHub connector';
  return null;
}
// tool: the tool's command in this clone (pace.mjs TOOL), named in the refusal.
export function bashVerdict(cmd, depth = 0, tool = TOOL) {
  for (const seg of words(cmd)) { const v = segVerdict(seg, depth, tool); if (v) return v; }
  return null;
}

// The hook's decision for one tool call: { block: reason } or { ok }.
export function hookDecision(input, cwd, opts = {}) {
  const name = String(input?.tool_name || '');
  const ti = input?.tool_input || {};
  try {
    if (name.startsWith('mcp__github__')) {
      const op = name.slice('mcp__github__'.length);
      const write = WRITE.test(op);
