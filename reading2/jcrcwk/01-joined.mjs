// ===== file: fetch-cheap.test.mjs (continued) =====

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { fetchKind, usage, usageRows } from '../lib/pace.mjs';
import { git } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');

test('each fetch says what it reads: the ledger, the state branch, or other; the counts are kept by kind', () => {
  assert.equal(fetchKind(['fetch', '-q', 'https://github.com/o/l.git', '+refs/heads/process-state:refs/p3/ledger/state']), 'ledger');
  assert.equal(fetchKind(['ls-remote', 'https://github.com/o/l.git', 'refs/heads/process-state']), 'ledger');
  assert.equal(fetchKind(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state']), 'state');
  assert.equal(fetchKind(['fetch', '-q', 'origin', 'tranche']), 'other');
  const at = new Date().toISOString();

// Every job must note: the job's handover note carries, on a line of its own, exactly:
// `desk: saltmarsh`.

  const rows = [{ kind: 'fetch', at, of: 'state', session: 's' }, { kind: 'fetch', at, of: 'state', session: 's' }, { kind: 'fetch', at, of: 'ledger', session: 's' }, { kind: 'fetch', at, session: 's' }];
  const root = makeRepo({ 'README.md': 'x\n' });
  const shared = usageRows(root, { rows });
  assert.deepEqual(shared[0].fetches_by, { state: 2, ledger: 1, '?': 1 });
  const u = usage(root, { seconds: 60, rows: [], read: { at: Date.now(), use: shared } });
  assert.deepEqual([u.fetches, u.fetches_by], [4, { state: 2, ledger: 1, '?': 1 }]);
});

test('a read that is not fresh takes the clone\'s copy another process fetched within 30 s; a fresh one always fetches', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/process-state'], { cwd: root });
  const log = join(mkdtempSync(join(tmpdir(), 'p3-log-')), 'log.jsonl');
  writeFileSync(log, '');
  // Each read its own p3 process, as each command and each poll is.
  const read = (fresh) => {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', `const { fetchState } = await import(${JSON.stringify(join(LIB, 'state.mjs'))}); console.log(fetchState(${JSON.stringify(root)}, 'process-state', { fresh: ${fresh} }));`], { encoding: 'utf8', env: { ...process.env, P3_GITHUB_LOG: log } });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim(), 'true');
  };
  const fetches = () => readFileSync(log, 'utf8').split('\n').filter((l) => l.includes('"kind":"fetch"')).length;
  read(false);
  assert.equal(fetches(), 1, 'the first read fetches');
  assert.equal(JSON.parse(readFileSync(log, 'utf8').split('\n').find((l) => l.includes('"kind":"fetch"'))).of, 'state', 'the row says what it read');
  read(false);
  read(false);
  assert.equal(fetches(), 1, 'within 30 s, the next processes read the clone\'s copy');
  read(true);
  assert.equal(fetches(), 2, 'a fresh read fetches');
  // The window is 30 s from the last fetch.
  const stamp = join(root, '.git', 'p3-state-read-process-state');
  const st = JSON.parse(readFileSync(stamp, 'utf8'));
  writeFileSync(stamp, JSON.stringify({ ...st, at: Date.now() - 31e3 }));
  read(false);
  assert.equal(fetches(), 3, 'past 30 s, fetched');
  // The clone's ref moved by something other than that fetch: fetched.
  git(['update-ref', 'refs/remotes/origin/process-state', git(['commit-tree', '-m', 'x', 'HEAD^{tree}'], { cwd: root })], { cwd: root });
  read(false);
  assert.equal(fetches(), 4, 'the clone\'s ref is not what the fetch left: fetched');
});

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
  assert.match(out, /^working directory: the session's project directory .* is not inside .*only, the repository it works in: start each session with that one repository \(BD-R2\)/);
  assert.deepEqual(workdirLines(s, { env: { CLAUDE_PROJECT_DIR: `${s}-other` } }).length, 1, 'a sibling whose name starts the same is outside');
});

// ===== file: notice-slots.test.mjs =====

// Provider-notice slots (coordinator, 4 Nov): on the copy, a count of notices/*.json read apart
// from the withdrawal rows called 201 slots open across 25 notices, 136 of them in membership:77
// and credentials:74, which BOB had withdrawn; `notice triage` answered "no provider notice" for
// both. One reader (noticeRecords) now serves triage, status, layer close and report tranche: a
// withdrawn notice is found, closed and never counted open, and every open slot the report counts
// carries the command that closes it.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
