// ===== file: admit.mjs (continued) =====

  return null;
}
const TOLD = /^(?:git|gh|curl|rm|npm|npx)\s/;
// A span tells a command when any of its parts does (`cd x && git rebase main`).
const tells = (raw) => parts(raw).some((p) => TOLD.test(p));
// The commands told in a file's text: code spans, `${...}` read as X; error texts (`... failed`) left
// out. In a .mjs file only the escaped spans a printed string holds (\`...\`), what a session reads:
// a comment's spans name commands, they tell a session none. In a .md file, its plain spans.
export function toldIn(text, file) {
  const out = [];
  const lines = text.split('\n');
  const code = file.endsWith('.mjs');
  for (const [i, l] of lines.entries()) {
    // In a .mjs file also the spans a plain-quoted string holds ('... `git ...` ...'), never on a comment line.
    const quoted = code && !/^\s*(\/\/|\*)/.test(l) ? [...l.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].flatMap((q) => [...(q[1] ?? q[2]).matchAll(/`([^`]+)`/g)]) : [];
    const spans = code ? [...l.matchAll(/\\`((?:(?!\\`).)*?)\\`/g), ...quoted] : l.matchAll(/`([^`]+)`/g);
    for (const m of spans) {
      const raw = m[1].replace(/\$\{[^}]*\}/g, 'X').trim();
      if (!tells(raw) || / failed\b/.test(raw)) continue;
      out.push({ file, line: i + 1, cmd: raw });
    }
  }
  return out;
}
// Every told command of the process at root: its rulebooks, its CLAUDE lines and its tool.
const corpus = (root) => [
  ...readdirSync(join(root, 'rulebooks')).filter((f) => f.endsWith('.md')).map((f) => `rulebooks/${f}`),
  'shims/CLAUDE.process.md',
  'tool/p3.mjs',
  ...readdirSync(join(root, 'tool/lib'), { recursive: true }).map(String).filter((f) => f.endsWith('.mjs')).map((f) => `tool/lib/${f}`),
];
export function toldCommands(root) {
  return corpus(root).flatMap((f) => { try { return toldIn(readFileSync(join(root, f), 'utf8'), f); } catch { return []; } });
}
// The told commands the settings deny, each with where it is told and the rule.
export function admitCheck(settings, told) {
  return told.flatMap((t) => { const d = deniedBy(t.cmd, settings); return d ? [{ ...t, ...d }] : []; });
}

// ---- told tools (C15, the coordinator, 7 Nov) ------------------------------------------------
// A tool other than Bash the process tells a session to use, that would stop on a permission prompt
// in the session's mode, leaves an unattended session waiting on no one (investigation lane
// session_018BhcecAwJP5DnnQjPq4JTZ, "Waiting on permission: Artifact" from ~00:31Z 7 Nov: lanes are
// told their design documents are claude.ai artifacts). The process tells tools by what they make
// or by their names; each wording below maps to the tool.
const REMOTE = ['send_message', 'create_session', 'archive_session', 'interrupt_session', 'get_session', 'list_sessions', 'list_events', 'subscribe_pr_activity', 'unsubscribe_pr_activity', 'create_trigger', 'delete_trigger', 'update_trigger', 'list_triggers', 'get_trigger', 'send_later'];
// Not mapped: the docs connector ("the docs connector", "claude.ai ... documents"), whose tools are
// mcp__<id>__* with an id per account, so no rule in a product's settings can be read for it here.
export const TOOL_WORDS = [
  { said: /\bclaude\.ai artifacts?\b/gi, tool: () => 'Artifact' },
  { said: new RegExp(`\\b(${REMOTE.join('|')})\\b`, 'g'), tool: (m) => `mcp__claude-code-remote__${m[1]}` },
  { said: /\bGitHub connector's `?([a-z][a-z0-9_]*)`?/g, tool: (m) => `mcp__github__${m[1]}` },
  { said: /\b(?:the Agent tool|subagents?)\b/gi, tool: () => 'Agent' },
  { said: /\bpush notifications?\b/gi, tool: () => 'PushNotification' },
];
// The tools that ask a person even in auto mode, each with its evidence; a told one needs an allow
// rule. What the check guarantees (cold review): no deny rule refuses a told tool, and every tool
// named here is allowed. That any other tool runs unasked is an assumption, not a proof (auto mode's
// classifier can still ask): a prompt an unattended session meets is added here with its evidence,
// and the suite then holds every product's settings to it.
export const PROMPTS_IN_AUTO = {
  Artifact: 'asks a person even in auto mode (C15: an investigation lane waited on "permission: Artifact" from ~00:31Z 7 Nov)',
};
// Claude Code's rule for a tool other than Bash: its exact name; an MCP server's name (mcp__<server>)
// or mcp__<server>__* for every tool of that server.
export function toolRuleMatches(rule, tool) {
  const r = String(rule || '');
  if (r === tool) return true;
  if (r.startsWith('mcp__') && r.split('__').length === 2) return tool.startsWith(`${r}__`);
  return r.startsWith('mcp__') && r.endsWith('__*') && tool.startsWith(r.slice(0, -1));
}
// Why a told tool would not run unattended under these settings: { why: 'denied', rule } or
// { why: 'prompts', evidence }; null when it runs.
export function toolStops(tool, settings) {
  const p = settings?.permissions || {};
  const d = (p.deny || []).find((r) => toolRuleMatches(r, tool));
  if (d) return { why: 'denied', rule: d };
  if (PROMPTS_IN_AUTO[tool] && !(p.allow || []).some((r) => toolRuleMatches(r, tool))) return { why: 'prompts', evidence: PROMPTS_IN_AUTO[tool] };
  return null;
}
// The tools a file's text tells a session to use: any line but a comment (in a .mjs file a printed
// string may span lines or nest templates, so the whole line is read: cold review; a name in code
// that tells no one is harmless unless denied, and then it is worth a look).
export function toolsIn(text, file) {
  const out = [];
  const code = file.endsWith('.mjs');
  for (const [i, l] of text.split('\n').entries()) {
    if (code && /^\s*(\/\/|\*|\/\*)/.test(l)) continue;
    const said = code ? l.replace(/\s\/\/ .*$/, '') : l;
    const seen = new Set();
    for (const w of TOOL_WORDS) for (const m of said.matchAll(w.said)) { const t = w.tool(m); if (!seen.has(t)) { seen.add(t); out.push({ file, line: i + 1, tool: t }); } }
  }
  return out;
}
// This module names the tools it reads for; it tells a session none.
export function toldTools(root) {
  return corpus(root).filter((f) => f !== 'tool/lib/admit.mjs').flatMap((f) => { try { return toolsIn(readFileSync(join(root, f), 'utf8'), f); } catch { return []; } });
}
// The told tools that would stop under these settings, each with where it is told and why.
export function admitTools(settings, told) {
  return told.flatMap((t) => { const s = toolStops(t.tool, settings); return s ? [{ ...t, ...s }] : []; });
}

// ===== file: gate-bootstrap.test.mjs =====

// The gate at the first close (review of PR 96): measured, the gate read its config from the base,
// and a base with no Process3 has none, so it ran with DEFAULTS: no lock files, no generated rows,
// and every module the tranche cover left to its suite ran without its installs, a false red.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate, gateConfig } from '../lib/gate.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const OWNER = DEFAULTS.approvals.owner;
const realTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 2', () => a.equal(x, 2));\n";

// A product whose main has no Process3, and whose tranche gains a config (at `setAt`), the module
// alpha with its suite, and a lock file. `mainFiles`: main's own beyond the README.
function product(config, { mainFiles = {}, branch = 'tranche' } = {}) {
  const root = makeRepo({ 'README.md': 'x', ...mainFiles });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', branch], { cwd: root });
  const setAt = commit(root, { 'process/config.json': config }, 'Process3 setup on the tranche');
  const head = commit(root, {
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'COMPLETE' } }),
    'package-lock.json': '{"lockfileVersion":3}\n',
    'src/alpha/index.mjs': 'export const x = 2;\n',
    'test/alpha/x.test.mjs': realTest,
  }, 'module alpha');
  return { root, base, head, setAt, branch };
}

// GitHub's view of a commit: the owner's website commit only at `owned` (by `author`).
const lookupAt = (owned, author = OWNER) => (args) => (args[1].split('/').pop() === owned
  ? { author: { login: author }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }
  : { author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });
const ioWith = (lookup) => ({ comments: () => [], getPR: () => null, lookup });
function runGate(r, lookup) {
  const npm = [];
  const exec = (cmd, args, o) => { npm.push([cmd, o.cwd]); return { code: 0, stdout: '', stderr: '' }; };
  const out = gate(r.root, { base: r.base, head: r.head, branch: r.branch, pr: null, slug: 'o/r', io: ioWith(lookup), exec, log: quiet });
  return { ...out, npm };
}

test('measured: a base with no Process3 gives the gate DEFAULTS, and a base with a config gives its own', () => {
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] });
  assert.deepEqual(gateConfig(r.root, { base: r.base, head: r.base, branch: 'x', slug: 'o/r', io: ioWith(lookupAt('none')) }).cfg.lockfiles, DEFAULTS.lockfiles);
  // A base with Process3: its own config, never the head's, as before.
  const s = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] }, { mainFiles: { 'process/config.json': { tranche: 'tranche' } } });
  const g = runGate(s, lookupAt('none'));
  assert.deepEqual(g.npm, [], 'the head\'s lock files are not the base\'s');
  assert.equal(g.findings.filter((f) => f.check === 'config').length, 0);
});

test('at the first close an uncovered module installs and runs from the head\'s config', () => {
  // Every anchored key at its default: GitHub is asked nothing.
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], suite_timeout_minutes: 5 });
  const asked = [];
  const g = runGate(r, (a) => { asked.push(a); return null; });
  assert.deepEqual(asked, []);
  assert.deepEqual(g.npm, [['npm', r.root]]);
  assert.deepEqual(g.run.scope, ['alpha']);
  assert.equal(g.run.suite, 'pass');
  assert.deepEqual(g.findings, []);
  // The approvals moved by the default owner's website commit: the same.
  const o = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], approvals: { file: 'AGENTS.md' } });
  const h = runGate(o, lookupAt(o.setAt));
  assert.deepEqual(h.npm, [['npm', o.root]]);
  assert.equal(h.run.suite, 'pass');
  assert.deepEqual(h.findings, []);
});

test('at the first close a forged head config falls back to the defaults and is refused', () => {
  // A session names another owner (or the head's own named owner's website commit set it).
  for (const lookup of [lookupAt('none'), (a) => lookupAt(a[1].split('/').pop(), 'civicsmith')(a), () => null]) {
    const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], approvals: { owner: 'civicsmith' } });
    const g = runGate(r, lookup);
    assert.deepEqual(g.npm, [], 'no install from a forged config');
    const c = g.findings.filter((f) => f.check === 'config');
    assert.equal(c.length, 1, JSON.stringify(g.findings));
    assert.match(c[0].message, /the head changes approvals without the owner's website commit; the gate runs with the defaults/);
  }
  // process_repo, and the tranche (its own branch named the tranche), the same.
  const p = product({ tranche: 'tranche', process_repo: 'https://example.com/other', lockfiles: ['package-lock.json'] });
  assert.match(runGate(p, lookupAt('none')).findings.find((f) => f.check === 'config').message, /changes process_repo/);
  const t = product({ tranche: 'bob/evil', lockfiles: ['package-lock.json'] }, { branch: 'bob/evil' });
  const tg = runGate(t, lookupAt('none'));
