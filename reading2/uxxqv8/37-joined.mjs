// ===== file: switch.mjs (continued) =====

  ['scheduled tasks', 'list_triggers answers (create none)', 'the coordinator, after switch in: the tasks from the manifest, act (d)'],
];
export const sessionCheckLines = () => ['Session checks (run each with your own tools; report each result to the coordinator, ok or failed with its words):', ...SESSION_CHECKS.map(([what, how, fix], i) => `  ${i + 1}. ${what}: ${how}. Failed: ${fix}.`)];

export function switchIn(root, { sessions, by, approvals, preflight: only = false, slug = repoSlug(root), io = {}, log = console.log } = {}) {
  by_(by);
  if (!only && typeof sessions !== 'string') fail('--sessions <file>: your list_sessions result on this account, saved as JSON');
  if (approvals !== undefined && !/^[0-9a-f]{64}$/.test(String(approvals))) fail('--approvals <hash>: the 64-hex hash of the tranche tip\'s approvals switch in printed');
  if (typeof sessions === 'string') readSessions(sessions);
  const cfg = loadConfig(root);
  if (!fetchState(root, cfg.state_branch)) fail(`no ${cfg.state_branch} on origin: nothing to switch in`);
  // --preflight (R16): every check, read-only, from any session on either account, before anything
  // stops; against the real manifest if there is one, else none (the approvals are not compared).
  if (only) {
    let m0 = null;
    try { m0 = JSON.parse(readState(root, cfg.state_branch, MANIFEST_FILE) || 'null'); } catch { m0 = null; }
    // A manifest an earlier switch in already used is spent: its approvals are not today's (review of R16).
    let spent = false;
    try { spent = !!m0 && JSON.parse(readState(root, cfg.state_branch, RETIRED_FILE) || 'null')?.manifest_at === m0.at; } catch { spent = false; }
    if (spent) m0 = null;
    log(`switch in --preflight: read-only; ${m0 ? `the manifest by ${m0.by} at ${m0.at}` : `${spent ? 'the manifest is an earlier switch\'s, already switched in' : 'no manifest yet'} (the approvals are not compared)`}`);
    const checks = preflight(root, m0, { slug, approvals, cfg, ...io });
    for (const c of checks) log(`- ${c.ok ? 'ok' : 'FAILED'}: ${c.line}${c.ok ? '' : `. Fixes it: ${c.fix}`}`);
    for (const l of sessionCheckLines()) log(l);
    const bad = checks.filter((c) => !c.ok);
    log(bad.length ? `preflight: ${bad.length} check(s) failed; fix them before the switch` : 'preflight: every tool check holds; now the session checks above');
    return { ok: !bad.length, checks };
  }
  const text = readState(root, cfg.state_branch, MANIFEST_FILE);
  if (text === null) fail(`no ${MANIFEST_FILE} on ${cfg.state_branch}: the old account runs switch out first`);
  let m;
  try { m = JSON.parse(text); } catch { fail(`${MANIFEST_FILE} on ${cfg.state_branch} is not JSON`); }
  log(`switch in: the manifest by ${m.by} at ${m.at}: ${m.tasks.length} task(s), ${m.jobs.length} job(s), ${m.messages.length} message(s)`);
  log('Preflight:');
  const checks = preflight(root, m, { slug, approvals, cfg, ...io });
  for (const c of checks) log(`- ${c.ok ? 'ok' : 'FAILED'}: ${c.line}${c.ok ? '' : `. Fixes it: ${c.fix}`}`);
  const bad = checks.filter((c) => !c.ok);
  if (bad.length) fail(`switch in refused: ${bad.length} preflight check(s) failed; nothing was started. Each names who fixes it; run switch in again once fixed`);
  const tranche = loadConfig(root, `refs/remotes/origin/${cfg.tranche}`);
  const addresses = readAddress(root, { fetch: false });
  // The manifest's unanswered messages and any the record has gained since, once each.
  const seen = new Map([...m.messages, ...unanswered(root, cfg.state_branch)].map((x) => [`${x.from}-${x.n}`, x]));
  // The old account's sessions, retired: R13's session_gone holds for each from now (ends.mjs),
  // so a lane seat or anything else bound to one is ended by the tool, not by hand.
  const retired = (m.sessions || []).filter((x) => x !== by);
  // Written even when it names none: it marks the manifest spent (cold review of R16).
  {
    writeState(root, cfg.state_branch, `switch in: ${retired.length} session(s) of the old account retired`, (wt) => {
      mkdirSync(dirname(join(wt, RETIRED_FILE)), { recursive: true });
      let prev = [];
      try { prev = JSON.parse(readFileSync(join(wt, RETIRED_FILE), 'utf8')).sessions || []; } catch { prev = []; }
      writeFileSync(join(wt, RETIRED_FILE), JSON.stringify({ at: now(), by, manifest_at: m.at, sessions: [...new Set([...prev, ...retired])] }, null, 2) + '\n');
    });
    log(`retired ${retired.length} session(s) of the old account (${RETIRED_FILE}): what is bound to them ends by R13's session_gone at ROOT's next sweep`);
  }
  log('Restart, in order, each act its own command:');
  for (const l of restartActs(m, { by, cfg: { ...tranche, tranche: cfg.tranche }, approvals: tipApprovals(root, cfg).approvals, addresses, messages: [...seen.values()] })) log(l);
  return { ok: true, manifest: m };
}

// ===== file: session-call.test.mjs =====

// C42 (BD-R2, Bob 8 Nov; PD-13): every session the tool starts is started with one repository.
// Each create_session call it prints is built by sessionCall and checked by checkCall; no other
// file writes a source_url; start check warns when the session looks started with more than one;
// the coordinator's prompt carries the rule.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { coordinatorPrompt } from '../lib/roles.mjs';
import { workdirLines } from '../lib/start.mjs';
import { checkCall, git, sessionCall } from '../lib/util.mjs';
import './helpers.mjs';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');

test('session call (C42): one repository by source_url, keys in the order the tool printed them', () => {
  const c = sessionCall({ slug: 'acme/app', revision: 'abc', title: 'BOB', prompt: 'p', model: 'm', clone: { clone_depth: 1 } });
  assert.deepEqual(Object.keys(c), ['title', 'source_url', 'source_revision', 'clone_depth', 'model', 'prompt']);
  assert.equal(c.source_url, 'https://github.com/acme/app');
  const bare = sessionCall({ slug: 'acme/app', revision: 'tranche', title: 't', prompt: 'p' });
  assert.deepEqual(bare, { title: 't', source_url: 'https://github.com/acme/app', source_revision: 'tranche', prompt: 'p' });
  // A product's clone settings never replace the call's own keys (cold review).
  const swapped = sessionCall({ slug: 'acme/app', revision: 'tip', title: 't', prompt: 'p', clone: { clone_depth: 1, source_url: 'https://github.com/x/y', source_revision: 'old', title: 'x', prompt: 'x' } });
  assert.deepEqual(swapped, { title: 't', source_url: 'https://github.com/acme/app', source_revision: 'tip', clone_depth: 1, prompt: 'p' });
  assert.throws(() => sessionCall({ slug: 'acme/app', revision: 'r', title: 't', prompt: 'p', clone: { sources: ['a/b'] } }), /was not printed: one repository per session/);
  for (const slug of ['acme', 'acme/app/x', '', null]) assert.throws(() => sessionCall({ slug, revision: 'r', title: 't', prompt: 'p' }), /one repository as <owner>\/<repo>/);
});

test('session call (C42): checkCall refuses a second repository in any form, citing BD-R2 and PD-13', () => {
  const ok = { title: 't', source_url: 'https://github.com/a/b', source_revision: 'r', prompt: 'p' };
  assert.equal(checkCall(ok), ok);
  for (const extra of [{ sources: [{ url: 'https://github.com/a/c' }] }, { repositories: ['a/c'] }, { repo: 'a/c' }, { extra_source_url: 'https://github.com/a/c' }, { source_urls: ['x'] }]) {
    assert.throws(() => checkCall({ ...ok, ...extra }), /was not printed: one repository per session \(BD-R2; PD-13/, JSON.stringify(extra));
  }
  for (const source_url of [['https://github.com/a/b', 'https://github.com/a/c'], 'https://github.com/a/b https://github.com/a/c', 'https://github.com/a/b,a/c', 'https://example.com/a/b', 'https://github.com/a', undefined]) {
    assert.throws(() => checkCall({ ...ok, source_url }), /names exactly one repository/, JSON.stringify(source_url));
  }
  // Session options that carry no repository pass, so a product's clone settings keep working;
  // the key test is anchored, so a word that merely holds "source" or "repo" passes.
  assert.ok(checkCall({ ...ok, clone_depth: 1, blob_limit_kb: 100, sparse_checkout_paths: ['src'], model: 'm', resources: 1, reporter: 'x' }));
});

test('session call (C42): no tool file builds a create_session call but util.mjs, so none bypasses checkCall', () => {
  // Every tool file (lib and the entry points), the key written out, quoted or as a shorthand.
  const found = [];
  const TOOL = join(LIB, '..');
  const files = [...readdirSync(LIB).filter((n) => n.endsWith('.mjs') && n !== 'util.mjs').map((n) => join(LIB, n)), ...readdirSync(TOOL).filter((n) => n.endsWith('.mjs')).map((n) => join(TOOL, n))];
  for (const f of files) {
    readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (/\bsource_url\s*[:,}]|['"]source_url['"]\s*:|\[\s*['"`]source_url|\bsources\s*:/.test(l)) found.push(`${f.slice(TOOL.length + 1)}:${i + 1}`); });
  }
  assert.ok(files.some((f) => f.endsWith('p3.mjs')), 'the entry point is read');
  assert.deepEqual(found, [], 'build each create_session call with sessionCall');
  // Each start site the design note lists uses it.
  for (const f of ['roles.mjs', 'job.mjs', 'lane.mjs', 'pin.mjs', 'tranche.mjs', 'measures.mjs']) assert.match(readFileSync(join(LIB, f), 'utf8'), /sessionCall\(\{/, f);
});

test('session call (C42): lane start takes the product\'s clone settings, as every other start does', () => {
  assert.match(readFileSync(join(LIB, 'lane.mjs'), 'utf8'), /sessionCall\(\{ slug: s, revision: tranche, title: `lane \$\{l\.name\}`, prompt, model, clone: cfg\.clone \}\)/);
});

test('coordinator prompt (C42): it works in process3 only and acts on a product only through a session started there', () => {
  const text = coordinatorPrompt({ slug: 'acme/app', processSlug: 'acme/process3', rootId: 'session_R', old: 'session_O', branch: 'coord', handoff: 'notes/h.md' });
  assert.match(text, /4\. You work in acme\/process3 only \(BD-R2; PD-13\)\. You act on a product only through a session started in its repository \(its BOB, or a short session\), relaying Bob's words quoted and dated; never add a product repository here\./);
  assert.match(text, /So too your id as `coordinator` in another product's process\/config\.json \(the probe\)/);
  assert.doesNotMatch(text, /On each other product you hold/, 'no act of its own on a product');
});

test('start check (C42): warns when the root\'s parent holds several checkouts, or the project directory is outside the root', () => {
  const parent = mkdtempSync(join(tmpdir(), 'p3-multi-'));
  const mk = (n) => { const d = join(parent, n); mkdirSync(d); git(['init', '-q'], { cwd: d }); return d; };
  const a = mk('alpha');
  assert.deepEqual(workdirLines(a, { env: {} }), [], 'one checkout: nothing said');
  mkdirSync(join(parent, 'notes'));
  assert.deepEqual(workdirLines(a, { env: {} }), [], 'a plain folder beside it is not a checkout');
  mk('beta');
  const [line] = workdirLines(a, { env: {} });
  assert.match(line, /^working directory: 2 repositories at .* \(alpha, beta\): this session looks started with more than one.*\(PD-13\)\. Work in alpha only.*\(BD-R2\)$/);
  // The project directory Claude Code names.
  const solo = mkdtempSync(join(tmpdir(), 'p3-solo-'));
  const s = join(solo, 'only');
  mkdirSync(join(s, 'sub'), { recursive: true }); git(['init', '-q'], { cwd: s });
  assert.deepEqual(workdirLines(s, { env: { CLAUDE_PROJECT_DIR: s } }), []);
  assert.deepEqual(workdirLines(s, { env: { CLAUDE_PROJECT_DIR: join(s, 'sub') } }), [], 'inside the root');
  const [out] = workdirLines(s, { env: { CLAUDE_PROJECT_DIR: solo } });
